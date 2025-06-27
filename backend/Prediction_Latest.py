from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from contextlib import asynccontextmanager
import pandas as pd
import numpy as np
import threading
import classes

df = pd.DataFrame()
cached_students = []
cached_districts = []
cached_schools = []


def load_and_process_data():
    global df, cached_students, cached_districts, cached_schools
    df = pd.read_parquet("Data/students_agg.parquet")
    cached_students.clear()
    for sid in df["STUDENT_ID"].unique():
        row = df[df["STUDENT_ID"] == sid].iloc[-1]
        sid_int = int(row["STUDENT_ID"])
        location_id = int(row.get("LOCATION_ID", -1))
        g = row.get("STUDENT_GRADE_LEVEL", np.nan)
        district_id = int(row.get("DISTRICT_CODE", -1))
        if pd.isna(g):
            grade_str = "Unknown Grade"
        else:
            grade = int(g)
            if grade == -1:
                grade_str = "Pre-Kindergarten"
            elif grade == 0:
                grade_str = "Kindergarten"
            elif grade == 1:
                grade_str = "1st Grade"
            elif grade == 2:
                grade_str = "2nd Grade"
            elif grade == 3:
                grade_str = "3rd Grade"
            elif grade >= 11:
                grade_str = f"{grade}th Grade"
            else:
                suffix = {1: "st", 2: "nd", 3: "rd"}.get(grade % 10, "th")
                grade_str = f"{grade}{suffix} Grade"
        cached_students.append(
            {
                "id": str(sid_int),
                "grade": grade_str,
                "locationId": location_id,
                "schoolName": row.get("SCHOOL_NAME", "Unknown School"),
                "districtName": row.get("DISTRICT_NAME", "Unknown District"),
                "districtId": district_id,
            }
        )
    cached_students.sort(key=lambda x: x["id"])
    unique_districts = df[["DISTRICT_CODE", "DISTRICT_NAME"]].drop_duplicates()
    cached_districts[:] = [{"id": int(r.DISTRICT_CODE), "name": r.DISTRICT_NAME.strip()} for _, r in unique_districts.iterrows()]
    unique_schools = df[["LOCATION_ID", "SCHOOL_NAME", "DISTRICT_CODE"]].drop_duplicates()
    cached_schools[:] = [{"id": int(r.LOCATION_ID), "name": r.SCHOOL_NAME.strip(), "districtId": int(r.DISTRICT_CODE)} for _, r in unique_schools.iterrows()]
    cached_districts.sort(key=lambda x: x["id"])
    cached_schools.sort(key=lambda x: x["id"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    thread = threading.Thread(target=load_and_process_data, daemon=True)
    thread.start()
    yield


app = FastAPI(default_response_class=ORJSONResponse, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/students", response_model=classes.StudentsResponse)
def get_students():
    return {"districts": cached_districts, "schools": cached_schools, "students": cached_students}


@app.get("/AllDistrictsData", response_model=classes.DataResponse)
def get_all_districts_summary():
    global df
    if df.empty:
        return {"message": "No data available"}
    subset = df.copy()
    latest_per_student = subset.sort_values(["STUDENT_ID", "SCHOOL_YEAR"]).groupby("STUDENT_ID").tail(1)
    year_2024_rows = subset[subset["SCHOOL_YEAR"] == 2024]
    if year_2024_rows.empty:
        return {"message": "No 2024 data found across all districts."}
    present_total = year_2024_rows["Total_Days_Present"].astype(float).sum()
    enrolled_total = year_2024_rows["Total_Days_Enrolled"].astype(float).sum()
    attendance_2024 = round((present_total / enrolled_total) * 100, 1) if enrolled_total > 0 else 0
    all_preds = latest_per_student["District_aggregate"].dropna()
    predicted_2025 = round(all_preds.mean() * 100, 1) if not all_preds.empty else round(latest_per_student["Predictions"].astype(float).mean() * 100, 1)
    total_days = round(enrolled_total / len(year_2024_rows), 1)
    metrics = []
    for y in range(2019, 2025):
        yd = subset[subset["SCHOOL_YEAR"] == y]
        if yd.empty:
            continue
        pres = yd["Total_Days_Present"].astype(float).sum()
        enr = yd["Total_Days_Enrolled"].astype(float).sum()
        unx = yd["Total_Days_Unexcused_Absent"].astype(float).mean()
        prem = yd["Total_Days_Present"].astype(float).mean()
        rate = round((pres / enr) * 100) if enr > 0 else None
        metrics.append(classes.StudentMetrics(year=str(y), attendanceRate=rate, unexcused=int(round(unx)) if pd.notna(unx) else None, present=int(round(prem)) if pd.notna(prem) else None, total=int(round(yd["Total_Days_Enrolled"].astype(float).mean()))))
    trends = []
    for y in range(2019, 2025):
        yd = subset[subset["SCHOOL_YEAR"] == y]
        if yd.empty:
            continue
        pres = yd["Total_Days_Present"].astype(float).sum()
        enr = yd["Total_Days_Enrolled"].astype(float).sum()
        if enr > 0:
            trends.append(classes.StudentTrend(year=str(y), value=int(round((pres / enr) * 100)), isPredicted=False))
    if not all_preds.empty:
        trends.append(classes.StudentTrend(year="2025", value=int(round(all_preds.mean() * 100)), isPredicted=True))
    return classes.DataResponse(previousAttendance=attendance_2024, predictedAttendance=predicted_2025, predictedValues=classes.AttendanceValues(year="2025", predictedAttendance=predicted_2025, totalDays=total_days), metrics=sorted(metrics, key=lambda x: x.year), trends=sorted(trends, key=lambda x: x.year))


@app.post("/DistrictData", response_model=classes.DataResponse)
def get_district_summary(req: classes.DataRequest):
    if req.districtId is None or req.locationID or req.studentId or req.grade != -3:
        return {"message": "Please supply districtId only for DistrictData."}
    subset = df[df["DISTRICT_CODE"] == req.districtId]
    if subset.empty:
        return {"message": "No matching data found"}
    latest_per_student = subset.sort_values(["STUDENT_ID", "SCHOOL_YEAR"]).groupby("STUDENT_ID").tail(1)
    year_2024_rows = subset[subset["SCHOOL_YEAR"] == 2024]
    if year_2024_rows.empty:
        return {"message": "No 2024 data found in this district."}
    pres = year_2024_rows["Total_Days_Present"].astype(float)
    enr = year_2024_rows["Total_Days_Enrolled"].astype(float)
    attendance_2024 = round((pres.sum() / enr.sum()) * 100, 1)
    district_agg = latest_per_student["District_aggregate"].iloc[0]
    predicted_2025 = round(float(district_agg) * 100, 1) if pd.notna(district_agg) else round(latest_per_student["Predictions"].astype(float).mean() * 100, 1)
    total_days = round(enr.mean(), 1)
    metrics = []
    for y in range(2019, 2025):
        yd = subset[subset["SCHOOL_YEAR"] == y]
        if yd.empty:
            continue
        pres_sum = yd["Total_Days_Present"].astype(float).sum()
        enr_sum = yd["Total_Days_Enrolled"].astype(float).sum()
        unx = yd["Total_Days_Unexcused_Absent"].astype(float).mean()
        prem = yd["Total_Days_Present"].astype(float).mean()
        rate = round((pres_sum / enr_sum) * 100) if enr_sum > 0 else None
        metrics.append(classes.StudentMetrics(year=str(y), attendanceRate=rate, unexcused=int(round(unx)) if pd.notna(unx) else None, present=int(round(prem)) if pd.notna(prem) else None, total=int(round(yd["Total_Days_Enrolled"].astype(float).mean()))))
    trends = []
    for y in range(2019, 2025):
        yd = subset[subset["SCHOOL_YEAR"] == y]
        if yd.empty:
            continue
        pres_sum = yd["Total_Days_Present"].astype(float).sum()
        enr_sum = yd["Total_Days_Enrolled"].astype(float).sum()
        if enr_sum > 0:
            trends.append(classes.StudentTrend(year=str(y), value=int(round((pres_sum / enr_sum) * 100)), isPredicted=False))
    if pd.notna(district_agg):
        trends.append(classes.StudentTrend(year="2025", value=int(round(float(district_agg) * 100)), isPredicted=True))
    return classes.DataResponse(previousAttendance=attendance_2024, predictedAttendance=predicted_2025, predictedValues=classes.AttendanceValues(year="2025", predictedAttendance=predicted_2025, totalDays=total_days), metrics=sorted(metrics, key=lambda x: x.year), trends=sorted(trends, key=lambda x: x.year))


@app.post("/SchoolData", response_model=classes.DataResponse)
def get_school_summary(req: classes.DataRequest):
    subset = df.copy()

    if req.districtId is not None:
        subset = subset[subset["DISTRICT_CODE"] == req.districtId]
    if req.locationID is not None:
        subset = subset[subset["LOCATION_ID"] == req.locationID]
    if subset.empty:
        return {"message": "No matching data found"}
    
    latest_per_student = subset.sort_values(["STUDENT_ID", "SCHOOL_YEAR"]).groupby("STUDENT_ID").tail(1)
    year_2024_rows = latest_per_student[latest_per_student["SCHOOL_YEAR"] == 2024]

    if year_2024_rows.empty:
        return {"message": "No 2024 data found in this school."}
    
    pres = year_2024_rows["Total_Days_Present"].astype(float)
    enr = year_2024_rows["Total_Days_Enrolled"].astype(float)
    attendance_2024 = round((pres.sum() / enr.sum()) * 100, 1)
    school_agg = latest_per_student["School_aggregate"].iloc[0]
    predicted_2025 = round(float(school_agg) * 100, 1) if pd.notna(school_agg) else round(latest_per_student["Predictions"].astype(float).mean() * 100, 1)
    total_days = round(enr.mean(), 1)

    metrics = []
    for y in range(2019, 2025):
        ys = subset[subset["SCHOOL_YEAR"] == y]
        if ys.empty:
            continue
        pres_sum = ys["Total_Days_Present"].astype(float).sum()
        enr_sum = ys["Total_Days_Enrolled"].astype(float).sum()
        unx = ys["Total_Days_Unexcused_Absent"].astype(float).mean()
        prem = ys["Total_Days_Present"].astype(float).mean()
        rate = round((pres_sum / enr_sum) * 100) if enr_sum > 0 else None
        metrics.append(classes.StudentMetrics(year=str(y), attendanceRate=rate, unexcused=int(round(unx)) if pd.notna(unx) else None, present=int(round(prem)) if pd.notna(prem) else None, total=int(round(ys["Total_Days_Enrolled"].astype(float).mean()))))
    trends = []
    for y in range(2019, 2025):
        ys = subset[subset["SCHOOL_YEAR"] == y]
        if ys.empty:
            continue
        pres_sum = ys["Total_Days_Present"].astype(float).sum()
        enr_sum = ys["Total_Days_Enrolled"].astype(float).sum()
        if enr_sum > 0:
            trends.append(classes.StudentTrend(year=str(y), value=int(round((pres_sum / enr_sum) * 100)), isPredicted=False))
    if pd.notna(school_agg):
        trends.append(classes.StudentTrend(year="2025", value=int(round(float(school_agg) * 100)), isPredicted=True))
    return classes.DataResponse(previousAttendance=attendance_2024, predictedAttendance=predicted_2025, predictedValues=classes.AttendanceValues(year="2025", predictedAttendance=predicted_2025, totalDays=total_days), metrics=sorted(metrics, key=lambda x: x.year), trends=sorted(trends, key=lambda x: x.year))


@app.post("/GradeDetails", response_model=classes.DataResponse)
def get_grade_summary(req: classes.DataRequest):
    subset = df.copy()

    if req.districtId is not None:
        subset = subset[subset["DISTRICT_CODE"] == req.districtId]
      
    if req.locationID is not None:
        subset = subset[subset["LOCATION_ID"] == req.locationID]
        
    if req.grade != -3:
        subset = subset[subset["STUDENT_GRADE_LEVEL"] == req.grade]
       
    if subset.empty:
        return classes.DataResponse(
        previousAttendance=0, 
        predictedAttendance=0, 
        predictedValues=classes.AttendanceValues(
            year="2025", 
            predictedAttendance=0, 
            totalDays=0
        ), 
        metrics=[classes.StudentMetrics(year='0',
            attendanceRate=0,
            unexcused=0,
            present=0,
            total=0)], 
        trends=sorted([classes.StudentTrend(year='0', value=0, isPredicted=False)])
    )
    
    latest_per_student = subset.sort_values(["STUDENT_ID", "SCHOOL_YEAR"]).groupby("STUDENT_ID").tail(1)
    year_2024_rows = latest_per_student[latest_per_student["SCHOOL_YEAR"] == 2024]

    if year_2024_rows.empty:
        return classes.DataResponse(
        previousAttendance=0, 
        predictedAttendance=0, 
        predictedValues=classes.AttendanceValues(
            year="2025", 
            predictedAttendance=0, 
            totalDays=0
        ), 
        metrics=[classes.StudentMetrics(year='0',
            attendanceRate=0,
            unexcused=0,
            present=0,
            total=0)], 
        trends=sorted([classes.StudentTrend(year='0', value=0, isPredicted=False)])
    )
    
    pres = year_2024_rows["Total_Days_Present"].astype(float)
    enr = year_2024_rows["Total_Days_Enrolled"].astype(float)
    attendance_2024 = round((pres.sum() / enr.sum()) * 100, 1)
    grade_agg = latest_per_student["Grade_aggregate"].iloc[0]
    predicted_2025 = round(float(grade_agg) * 100, 1) if pd.notna(grade_agg) else round(latest_per_student["Predictions"].astype(float).mean() * 100, 1)
    total_days = round(enr.mean(), 1)

    metrics = []
    for y in range(2019, 2025):
        ys = subset[subset["SCHOOL_YEAR"] == y]
        if ys.empty:
            continue
        pres_sum = ys["Total_Days_Present"].astype(float).sum()
        enr_sum = ys["Total_Days_Enrolled"].astype(float).sum()
        unx = ys["Total_Days_Unexcused_Absent"].astype(float).mean()
        prem = ys["Total_Days_Present"].astype(float).mean()
        rate = round((pres_sum / enr_sum) * 100) if enr_sum > 0 else None
        metrics.append(classes.StudentMetrics(year=str(y), attendanceRate=rate, unexcused=int(round(unx)) if pd.notna(unx) else None, present=int(round(prem)) if pd.notna(prem) else None, total=int(round(ys["Total_Days_Enrolled"].astype(float).mean()))))

    trends = []
    for y in range(2019, 2025):
        ys = subset[subset["SCHOOL_YEAR"] == y]
        if ys.empty:
            continue
        pres_sum = ys["Total_Days_Present"].astype(float).sum()
        enr_sum = ys["Total_Days_Enrolled"].astype(float).sum()
        if enr_sum > 0:
            trends.append(classes.StudentTrend(year=str(y), value=int(round((pres_sum / enr_sum) * 100)), isPredicted=False))
    if pd.notna(grade_agg):
        trends.append(classes.StudentTrend(year="2025", value=int(round(float(grade_agg) * 100)), isPredicted=True))

    return classes.DataResponse(
        previousAttendance=attendance_2024, 
        predictedAttendance=predicted_2025, 
        predictedValues=classes.AttendanceValues(
            year="2025", 
            predictedAttendance=predicted_2025, 
            totalDays=total_days
        ), 
        metrics=sorted(metrics, key=lambda x: x.year), 
        trends=sorted(trends, key=lambda x: x.year)
    )


@app.post("/StudentDetails", response_model=classes.DataResponse)
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
        return {"message": "No matching data found"}
    latest_row = subset.sort_values("SCHOOL_YEAR").iloc[-1]
    year_2024_row = subset[subset["SCHOOL_YEAR"] == 2024].iloc[-1] if not subset[subset["SCHOOL_YEAR"] == 2024].empty else None
    if year_2024_row is not None:
        pres_d = float(year_2024_row["Total_Days_Present"])
        enr_d = float(year_2024_row["Total_Days_Enrolled"])
        attendance_2024 = round((pres_d / enr_d) * 100, 1)
        total_days = round(enr_d, 1)
    else:
        attendance_2024 = None
        total_days = None
    dist_agg = latest_row["District_aggregate"] if "District_aggregate" in latest_row and pd.notna(latest_row["District_aggregate"]) else None
    predicted_2025 = round(float(dist_agg) * 100, 1) if dist_agg is not None else (round(float(latest_row["Predictions"]) * 100, 1) if "Predictions" in latest_row else None)
    metrics = []
    for y in range(2019, 2025):
        rw = subset[subset["SCHOOL_YEAR"] == y]
        if rw.empty:
            continue
        pres = rw["Total_Days_Present"].values[0]
        enr = rw["Total_Days_Enrolled"].values[0]
        if pd.notna(pres) and pd.notna(enr) and enr > 0:
            rate = int(round((pres / enr) * 100))
        else:
            rate = None
        total = int(round(rw["Total_Days_Enrolled"].values[0]))
        unx = int(round(rw["Total_Days_Unexcused_Absent"].values[0])) if rw["Total_Days_Unexcused_Absent"].notna().any() else None
        metrics.append(classes.StudentMetrics(year=str(y), attendanceRate=rate, unexcused=unx, present=int(round(pres)) if pd.notna(pres) else None, total=total))
    trends = []
    for y in range(2019, 2025):
        rw = subset[subset["SCHOOL_YEAR"] == y]
        if rw.empty:
            continue
        pres = rw["Total_Days_Present"].values[0]
        enr = rw["Total_Days_Enrolled"].values[0]
        if pd.notna(pres) and pd.notna(enr) and enr > 0:
            trends.append(classes.StudentTrend(year=str(y), value=int(round((pres / enr) * 100)), isPredicted=False))
    if dist_agg is not None:
        trends.append(classes.StudentTrend(year="2025", value=int(round(float(dist_agg) * 100)), isPredicted=True))
    elif "Predictions" in latest_row and not np.isnan(latest_row["Predictions"]):
        trends.append(classes.StudentTrend(year="2025", value=int(round(latest_row["Predictions"] * 100)), isPredicted=True))
    return classes.DataResponse(previousAttendance=attendance_2024, predictedAttendance=predicted_2025, predictedValues=classes.AttendanceValues(year="2025", predictedAttendance=predicted_2025, totalDays=total_days), metrics=sorted(metrics, key=lambda x: x.year), trends=sorted(trends, key=lambda x: x.year))
