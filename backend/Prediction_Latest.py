from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from contextlib import asynccontextmanager
import pandas as pd
import numpy as np
import threading
import backend.classes as classes
from backend.config import (
    year_config,
    get_current_year,
    get_predicted_year,
    get_historical_years,
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


PRESENT_COL   = "Total_Days_Present"
ENROLLED_COL  = "Total_Days_Enrolled"
UNEXCUSED_COL = "Total_Days_Unexcused_Absent"
PRED_COL      = "Predictions"
PRED_DIST_COL = "Predictions_District"
PRED_SCH_COL  = "Predictions_School"
PRED_GRD_COL  = "Predictions_Grade"

df = pd.DataFrame()
cached_students   : list[dict] = []
cached_districts  : list[dict] = []
cached_schools    : list[dict] = []


def _grade_to_str(g) -> str:
    if pd.isna(g):
        return "Unknown Grade"
    g = int(g)
    if g == -1:
        return "Pre-Kindergarten"
    if g == 0:
        return "Kindergarten"
    if g in (1, 2, 3):
        return f"{g}{ {1:'st', 2:'nd', 3:'rd'}[g] } Grade"
    if g >= 11:
        return f"{g}th Grade"
    suf = {1:"st",2:"nd",3:"rd"}.get(g % 10, "th")
    return f"{g}{suf} Grade"


def _safe_int(val) -> int | None:
    if pd.isna(val):
        return None
    return int(round(val))


def _subset_pairs(data: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    cur, pred = get_current_year(), get_predicted_year()
    hist = data[data["SCHOOL_YEAR"] <= cur]
    pr   = data[data["SCHOOL_YEAR"] == pred]
    return hist, pr


def _aggregate_metrics(hist: pd.DataFrame) -> list[classes.StudentMetrics]:
    out: list[classes.StudentMetrics] = []
    for yr in get_historical_years():
        yd = hist[hist["SCHOOL_YEAR"] == yr]
        if yd.empty:
            continue
        pres_sum = yd[PRESENT_COL ].astype(float).sum()
        enr_sum  = yd[ENROLLED_COL].astype(float).sum()

        unx_mean  = yd[UNEXCUSED_COL].astype(float).mean()
        pres_mean = yd[PRESENT_COL ].astype(float).mean()
        enr_mean  = yd[ENROLLED_COL].astype(float).mean()

        rate = round((pres_sum / enr_sum) * 100) if enr_sum > 0 else None
        out.append(
            classes.StudentMetrics(
                year=str(yr),
                attendanceRate=rate,
                unexcused=_safe_int(unx_mean),
                present=_safe_int(pres_mean),
                total=_safe_int(enr_mean),
            )
        )
    return out


def _aggregate_trends(hist: pd.DataFrame, pred_value: float | None) -> list[classes.StudentTrend]:
    cur_trends: list[classes.StudentTrend] = []
    for yr in get_historical_years():
        yd = hist[hist["SCHOOL_YEAR"] == yr]
        if yd.empty:
            continue
        pres_sum = yd[PRESENT_COL ].astype(float).sum()
        enr_sum  = yd[ENROLLED_COL].astype(float).sum()
        if enr_sum > 0:
            cur_trends.append(
                classes.StudentTrend(
                    year=str(yr),
                    value=int(round((pres_sum / enr_sum) * 100)),
                    isPredicted=False,
                )
            )
    if pred_value is not None:
        cur_trends.append(
            classes.StudentTrend(
                year=str(get_predicted_year()),
                value=int(round(pred_value * 100)),
                isPredicted=True,
            )
        )
    return cur_trends


def _zero_response() -> classes.DataResponse:
    p = get_predicted_year()
    return classes.DataResponse(
        previousAttendance=0,
        predictedAttendance=0,
        predictedValues=classes.AttendanceValues(year=str(p), predictedAttendance=0, totalDays=0),
        metrics=[],
        trends=[],
    )


def load_and_process_data() -> None:
    global df, cached_students, cached_districts, cached_schools

    df = pd.read_parquet("backend/data/Predictions.parquet")
    year_config.refresh_config()

    hist, _ = _subset_pairs(df)
    latest_hist = (
        hist.sort_values(["STUDENT_ID", "SCHOOL_YEAR"])
        .groupby("STUDENT_ID")
        .tail(1)
        .reset_index(drop=True)
    )

    cached_students[:] = sorted(
        [
            {
                "id": str(int(r.STUDENT_ID)),
                "grade": _grade_to_str(r.STUDENT_GRADE_LEVEL),
                "locationId": _safe_int(r.LOCATION_ID) or -1,
                "schoolName": (r.SCHOOL_NAME or "Unknown School").strip(),
                "districtName": (r.DISTRICT_NAME or "Unknown District").strip(),
                "districtId": _safe_int(r.DISTRICT_CODE) or -1,
            }
            for _, r in latest_hist.iterrows()
        ],
        key=lambda x: x["id"],
    )

    cached_districts[:] = (
        df[["DISTRICT_CODE", "DISTRICT_NAME"]]
        .drop_duplicates()
        .assign(
            id=lambda x: x.DISTRICT_CODE.fillna(-1).astype(int),
            name=lambda x: x.DISTRICT_NAME.fillna("Unknown District").str.strip(),
        )
        .sort_values("id")
        .to_dict("records")
    )

    cached_schools[:] = (
        df[["LOCATION_ID", "SCHOOL_NAME", "DISTRICT_CODE"]]
        .drop_duplicates()
        .assign(
            id=lambda x: x.LOCATION_ID.fillna(-1).astype(int),
            name=lambda x: x.SCHOOL_NAME.fillna("Unknown School").str.strip(),
            districtId=lambda x: x.DISTRICT_CODE.fillna(-1).astype(int),
        )
        .sort_values("id")
        .to_dict("records")
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    threading.Thread(target=load_and_process_data, daemon=True).start()
    yield


app = FastAPI(default_response_class=ORJSONResponse, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/predictions/students", response_model=classes.StudentsResponse)
def get_students():
    return {"districts": cached_districts, "schools": cached_schools, "students": cached_students}


@app.get("/api/predictions/all-districts", response_model=classes.DataResponse)
def get_all_districts_summary():
    if df.empty:
        return _zero_response()

    hist, pred = _subset_pairs(df)

    cur_year = get_current_year()
    cur_rows = hist[hist["SCHOOL_YEAR"] == cur_year]
    if cur_rows.empty:
        return _zero_response()

    present_tot  = cur_rows[PRESENT_COL ].astype(float).sum()
    enrolled_tot = cur_rows[ENROLLED_COL].astype(float).sum()
    prev_att = round((present_tot / enrolled_tot) * 100, 1) if enrolled_tot > 0 else 0
    total_days = round(enrolled_tot / len(cur_rows), 1)

    preds = pred[PRED_DIST_COL].dropna()
    pred_att = round(preds.mean() * 100, 1) if not preds.empty else 0

    metrics = _aggregate_metrics(hist)
    trends  = _aggregate_trends(hist, preds.mean() if not preds.empty else None)

    return classes.DataResponse(
        previousAttendance=prev_att,
        predictedAttendance=pred_att,
        predictedValues=classes.AttendanceValues(
            year=str(get_predicted_year()), predictedAttendance=pred_att, totalDays=total_days
        ),
        metrics=metrics,
        trends=trends,
    )


@app.post("/api/predictions/district", response_model=classes.DataResponse)
def get_district_summary(req: classes.DataRequest):
    if req.districtId is None or req.locationID or req.studentId or req.grade != -3:
        return _zero_response()

    subset = df[df["DISTRICT_CODE"] == req.districtId]
    if subset.empty:
        return _zero_response()

    hist, pred = _subset_pairs(subset)

    cur_year = get_current_year()
    logger.info(f'Current Year is {cur_year}')
    cur_rows = hist[hist["SCHOOL_YEAR"] == cur_year]
    if cur_rows.empty:
        return _zero_response()

    prev_att = round(
        (cur_rows[PRESENT_COL].sum() / cur_rows[ENROLLED_COL].sum()) * 100, 1
    )
    total_days = round(cur_rows[ENROLLED_COL].mean(), 1)

    district_pred = pred[PRED_DIST_COL].dropna()
    pred_att = round(district_pred.iloc[0] * 100, 1) if not district_pred.empty else 0

    metrics = _aggregate_metrics(hist)
    trends  = _aggregate_trends(hist, district_pred.iloc[0] if not district_pred.empty else None)

    return classes.DataResponse(
        previousAttendance=prev_att,
        predictedAttendance=pred_att,
        predictedValues=classes.AttendanceValues(
            year=str(get_predicted_year()), predictedAttendance=pred_att, totalDays=total_days
        ),
        metrics=metrics,
        trends=trends,
    )


@app.post("/api/predictions/school", response_model=classes.DataResponse)
def get_school_summary(req: classes.DataRequest):
    subset = df.copy()
    if req.districtId is not None:
        subset = subset[subset["DISTRICT_CODE"] == req.districtId]
    if req.locationID is not None:
        subset = subset[subset["LOCATION_ID"] == req.locationID]
    if subset.empty:
        return _zero_response()

    hist, pred = _subset_pairs(subset)

    cur_year = get_current_year()
    cur_rows = hist[hist["SCHOOL_YEAR"] == cur_year]
    if cur_rows.empty:
        return _zero_response()

    prev_att = round(
        (cur_rows[PRESENT_COL].sum() / cur_rows[ENROLLED_COL].sum()) * 100, 1
    )
    total_days = round(cur_rows[ENROLLED_COL].mean(), 1)

    school_pred = pred[PRED_SCH_COL].dropna()
    pred_att = round(school_pred.iloc[0] * 100, 1) if not school_pred.empty else 0

    metrics = _aggregate_metrics(hist)
    trends  = _aggregate_trends(hist, school_pred.iloc[0] if not school_pred.empty else None)

    return classes.DataResponse(
        previousAttendance=prev_att,
        predictedAttendance=pred_att,
        predictedValues=classes.AttendanceValues(
            year=str(get_predicted_year()), predictedAttendance=pred_att, totalDays=total_days
        ),
        metrics=metrics,
        trends=trends,
    )


@app.post("/api/predictions/grade-details", response_model=classes.DataResponse)
def get_grade_summary(req: classes.DataRequest):
    subset = df.copy()
    if req.districtId is not None:
        subset = subset[subset["DISTRICT_CODE"] == req.districtId]
    if req.locationID is not None:
        subset = subset[subset["LOCATION_ID"] == req.locationID]
    if req.grade != -3:
        subset = subset[subset["STUDENT_GRADE_LEVEL"] == req.grade]
    if subset.empty:
        return _zero_response()

    hist, pred = _subset_pairs(subset)

    cur_year = get_current_year()
    cur_rows = hist[hist["SCHOOL_YEAR"] == cur_year]
    if cur_rows.empty:
        return _zero_response()

    prev_att = round(
        (cur_rows[PRESENT_COL].sum() / cur_rows[ENROLLED_COL].sum()) * 100, 1
    )
    total_days = round(cur_rows[ENROLLED_COL].mean(), 1)

    grade_pred = pred[PRED_GRD_COL].dropna()
    pred_att = round(grade_pred.iloc[0] * 100, 1) if not grade_pred.empty else 0

    metrics = _aggregate_metrics(hist)
    trends  = _aggregate_trends(hist, grade_pred.iloc[0] if not grade_pred.empty else None)

    return classes.DataResponse(
        previousAttendance=prev_att,
        predictedAttendance=pred_att,
        predictedValues=classes.AttendanceValues(
            year=str(get_predicted_year()), predictedAttendance=pred_att, totalDays=total_days
        ),
        metrics=metrics,
        trends=trends,
    )


@app.post("/api/predictions/student-details", response_model=classes.DataResponse)
def get_student_summary(req: classes.DataRequest):
    subset = df.copy()
    if req.districtId is not None:
        subset = subset[subset["DISTRICT_CODE"] == req.districtId]
    if req.locationID is not None:
        subset = subset[subset["LOCATION_ID"] == req.locationID]
    if req.studentId is not None:
        subset = subset[subset["STUDENT_ID"] == req.studentId]
    elif req.grade != -3:
        subset = subset[subset["STUDENT_GRADE_LEVEL"] == req.grade]
    if subset.empty:
        return _zero_response()

    hist, pred = _subset_pairs(subset)

    cur_year = get_current_year()
    cur_row = hist[hist["SCHOOL_YEAR"] == cur_year]
    if cur_row.empty:
        return _zero_response()
    cur_row = cur_row.iloc[-1]

    prev_att  = round((cur_row[PRESENT_COL] / cur_row[ENROLLED_COL]) * 100, 1)
    total_days = round(cur_row[ENROLLED_COL], 1)

    stu_pred = pred[pred["STUDENT_ID"] == cur_row.STUDENT_ID][PRED_COL].dropna()
    pred_att = (
        round(float(stu_pred.iloc[0]) * 100, 1)
        if not stu_pred.empty
        else round(float(cur_row[PRED_COL]) * 100, 1)
    )

    metrics = []
    for yr in get_historical_years():
        rw = hist[hist["SCHOOL_YEAR"] == yr]
        if rw.empty:
            continue
        rw = rw.iloc[-1]
        pres, enr = rw[PRESENT_COL], rw[ENROLLED_COL]
        rate = int(round((pres / enr) * 100)) if enr > 0 else None
        metrics.append(
            classes.StudentMetrics(
                year=str(yr),
                attendanceRate=rate,
                unexcused=_safe_int(rw[UNEXCUSED_COL]),
                present=_safe_int(pres),
                total=_safe_int(enr),
            )
        )

    trends = _aggregate_trends(hist, float(stu_pred.iloc[0]) if not stu_pred.empty else None)

    return classes.DataResponse(
        previousAttendance=prev_att,
        predictedAttendance=pred_att,
        predictedValues=classes.AttendanceValues(
            year=str(get_predicted_year()), predictedAttendance=pred_att, totalDays=total_days
        ),
        metrics=metrics,
        trends=trends,
    )
