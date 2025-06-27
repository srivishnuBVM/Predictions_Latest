import classes

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from contextlib import asynccontextmanager
import pandas as pd
import numpy as np

import threading

 
df = pd.DataFrame()
cached_students = []
cached_districts = []
cached_schools = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    background_thread = threading.Thread(target=load_and_process_data)
    background_thread.daemon = True
    background_thread.start()
    yield
 
app = FastAPI(default_response_class=ORJSONResponse, lifespan=lifespan)
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


 
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
 

@app.get("/Students", response_model=classes.StudentsResponse)
def get_students():
    return {"districts": cached_districts, "schools": cached_schools, "students": cached_students}


@app.get("/AllDistrictsData", response_model=classes.DataResponse)
def get_all_districts_summary():
    """Get aggregated data across all districts"""
    global df
    
    if df is None or df.empty:
        return {"message": "No data available"}
    
    subset = df.copy()
    
    # Get latest data per student across all districts
    latest_per_student = (
        subset.sort_values(by=["STUDENT_ID", "SCHOOL_YEAR"])
              .groupby("STUDENT_ID")
              .tail(1)
    )

    year_2024_rows = subset[subset["SCHOOL_YEAR"] == 2024]

    if year_2024_rows.empty:
        return {"message": "No 2024 data found across all districts."}

    # Attendance 2024 - aggregate across all districts
    present_days_total = year_2024_rows["Total_Days_Present"].astype(float).sum()
    enrolled_days_total = year_2024_rows["Total_Days_Enrolled"].astype(float).sum()
    attendance_2024 = round((present_days_total / enrolled_days_total) * 100, 1) if enrolled_days_total > 0 else 0

    # Predicted 2025 - use average of all District_aggregate values
    all_district_predictions = latest_per_student["District_aggregate"].dropna()
    if not all_district_predictions.empty:
        predicted_2025 = round(all_district_predictions.mean() * 100, 1)
    else:
        # Fallback to individual predictions average
        predicted_2025 = round(latest_per_student["Predictions"].astype(float).mean() * 100, 1)
    
    total_days = round(enrolled_days_total / len(year_2024_rows) if len(year_2024_rows) > 0 else 0, 1)

    # Metrics computation using real attendance data across all districts
    metrics = []
    for year in range(2019, 2025):
        year_data = subset[subset["SCHOOL_YEAR"] == year]
        if year_data.empty:
            continue

        present_sum = year_data["Total_Days_Present"].astype(float).sum()
        enrolled_sum = year_data["Total_Days_Enrolled"].astype(float).sum()
        unexcused_mean = year_data["Total_Days_Unexcused_Absent"].astype(float).mean()
        present_mean = year_data["Total_Days_Present"].astype(float).mean()

        if enrolled_sum > 0:
            attendance_rate = round((present_sum / enrolled_sum) * 100)
        else:
            attendance_rate = None

        metrics.append(classes.StudentMetrics(
            year=str(year),
            attendanceRate=attendance_rate,
            unexcused=int(round(unexcused_mean)) if pd.notna(unexcused_mean) else None,
            present=int(round(present_mean)) if pd.notna(present_mean) else None,
            total=int(round(year_data["Total_Days_Enrolled"].astype(float).mean()))
        ))

    # Trend computation using real attendance percentages across all districts
    trend = []
    for year in range(2019, 2025):
        year_data = subset[subset["SCHOOL_YEAR"] == year]
        if year_data.empty:
            continue

        present_sum = year_data["Total_Days_Present"].astype(float).sum()
        enrolled_sum = year_data["Total_Days_Enrolled"].astype(float).sum()

        if enrolled_sum > 0:
            avg_attendance = (present_sum / enrolled_sum) * 100
            trend.append(classes.StudentTrend(
                year=str(year),
                value=int(round(avg_attendance)),
                isPredicted=False
            ))

    # Add prediction for 2025 using average of district aggregates
    if not all_district_predictions.empty:
        trend.append(classes.StudentTrend(
            year="2025",
            value=int(round(all_district_predictions.mean() * 100)),
            isPredicted=True
        ))

    return classes.DataResponse(
        previousAttendance=attendance_2024,
        predictedAttendance=predicted_2025,
        predictedValues=classes.AttendanceValues(
            year='2025',
            predictedAttendance=predicted_2025,
            totalDays=total_days
        ),
        metrics=classes.StudentMetrics(sorted(metrics, key=lambda x: x.year)),
        trend=classes.StudentTrend(sorted(trend, key=lambda x: x.year))
    )

@app.post("/DistrictData", response_model=classes.DataResponse)
def get_district_summary(req: classes.SchoolSummaryRequest):
    subset = df.copy()
    print("All Student IDs:", df['STUDENT_ID'].unique().tolist()[:10])

    if (req.districtName or req.districtId is not None) and not req.schoolName and not req.studentId and req.grade == -3:

        if req.districtId is not None:
            subset = subset[subset["DISTRICT_CODE"] == req.districtId]
        elif req.districtName:
            subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]

        
        if subset.empty:
            return {"message": "No matching data found"}

        latest_per_student = (
            subset.sort_values(by=["STUDENT_ID", "SCHOOL_YEAR"])
                  .groupby("STUDENT_ID")
                  .tail(1)
        )

        year_2024_rows = subset[subset["SCHOOL_YEAR"] == 2024]

        if year_2024_rows.empty:
            return {"message": "No 2024 data found in this district."}

        # Attendance 2024
        present_days = year_2024_rows["Total_Days_Present"].astype(float)
        enrolled_days = year_2024_rows["Total_Days_Enrolled"].astype(float)
        attendance_2024 = round((present_days.sum() / enrolled_days.sum()) * 100, 1)

        # CHANGED: Use District_aggregate instead of mean of individual predictions
        district_aggregate = latest_per_student["District_aggregate"].iloc[0]  # All students in same district should have same value
        predicted_2025 = round(float(district_aggregate) * 100, 1) if pd.notna(district_aggregate) else round(latest_per_student["Predictions"].astype(float).mean() * 100, 1)
        
        total_days = round(enrolled_days.mean(), 1)

        # Metrics computation using real attendance data
        metrics = []
        for year in range(2019, 2025):
            year_data = subset[subset["SCHOOL_YEAR"] == year]
            if year_data.empty:
                continue

            present_sum = year_data["Total_Days_Present"].astype(float).sum()
            enrolled_sum = year_data["Total_Days_Enrolled"].astype(float).sum()
            unexcused_mean = year_data["Total_Days_Unexcused_Absent"].astype(float).mean()
            present_mean = year_data["Total_Days_Present"].astype(float).mean()

            if enrolled_sum > 0:
                attendance_rate = round((present_sum / enrolled_sum) * 100)
            else:
                attendance_rate = None

            metrics.append(classes.StudentMetrics(
                year=str(year),
                attendanceRate=attendance_rate,
                unexcused=int(round(unexcused_mean)) if pd.notna(unexcused_mean) else None,
                present=int(round(present_mean)) if pd.notna(present_mean) else None,
                total=int(round(year_data["Total_Days_Enrolled"].astype(float).mean()))
            ))

        # Trend computation using real attendance percentages
        trend = []
        for year in range(2019, 2025):
            year_data = subset[subset["SCHOOL_YEAR"] == year]
            if year_data.empty:
                continue

            present_sum = year_data["Total_Days_Present"].astype(float).sum()
            enrolled_sum = year_data["Total_Days_Enrolled"].astype(float).sum()

            if enrolled_sum > 0:
                avg_attendance = (present_sum / enrolled_sum) * 100
                trend.append(classes.StudentTrend(
                    year=str(year),
                    value=int(round(avg_attendance)),
                    isPredicted=False
                ))

        # CHANGED: Use District_aggregate for trend prediction
        if pd.notna(district_aggregate):
            trend.append(classes.StudentTrend(
                year="2025",
                value=int(round(float(district_aggregate) * 100)),
                isPredicted=True
            ))

        return classes.DataResponse(
            previousAttendance=attendance_2024,
            predictedAttendance=predicted_2025,
            predictedValues=classes.AttendanceValues(
                year='2025',
            predictedAttendance=predicted_2025,
            totalDays=total_days
        ),
            metrics=classes.StudentMetrics(sorted(metrics, key=lambda x: x.year)),
            trend=classes.StudentTrend(sorted(trend, key=lambda x: x.year))
        )

    return {"message": "Only district-level filter is supported in this version."}


#---------------------------------------------------------------------------------------------------------------------------------------------------------
#SCHOOL DATA BY FILTERS
@app.post("/SchoolData", response_model=classes.DataResponse)
def get_school_summary(req: classes.SchoolSummaryRequest):
    subset = df.copy()

    if req.districtId is not None:
        subset = subset[subset["DISTRICT_CODE"] == req.districtId]
    elif req.districtName:
        subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]
    if req.locationID is not None:
        subset = subset[subset["LOCATION_ID"] == req.locationID]
    elif req.schoolName:
        subset = subset[subset["SCHOOL_NAME"].str.strip().str.lower() == req.schoolName.strip().lower()]

    if subset.empty:
        return {"message": "No matching data found"}

    latest_per_student = (
        subset.sort_values(by=["STUDENT_ID", "SCHOOL_YEAR"])
              .groupby("STUDENT_ID")
              .tail(1)
    )

    year_2024_rows = latest_per_student[latest_per_student["SCHOOL_YEAR"] == 2024]

    if year_2024_rows.empty:
        return {"message": "No 2024 data found in this school."}

    present_days = year_2024_rows["Total_Days_Present"].astype(float)
    enrolled_days = year_2024_rows["Total_Days_Enrolled"].astype(float)
    attendance_2024 = round((present_days.sum() / enrolled_days.sum()) * 100, 1)

    # CHANGED: Use School_aggregate instead of mean of individual predictions
    school_aggregate = latest_per_student["School_aggregate"].iloc[0]  # All students in same school should have same value
    predicted_2025 = round(float(school_aggregate) * 100, 1) if pd.notna(school_aggregate) else round(latest_per_student["Predictions"].astype(float).mean() * 100, 1)
    
    total_days = round(enrolled_days.mean(), 1)

    # Metrics computation
    metrics = []
    for year in range(2019, 2025):
        year_subset = subset[subset["SCHOOL_YEAR"] == year]
        if year_subset.empty:
            continue

        present = year_subset["Total_Days_Present"].astype(float).sum()
        enrolled = year_subset["Total_Days_Enrolled"].astype(float).sum()
        attendance_rate = int(round((present / enrolled) * 100)) if enrolled > 0 else None
        present_mean = year_subset["Total_Days_Present"].astype(float).mean()

        total = int(round(year_subset["Total_Days_Enrolled"].astype(float).mean()))
        unexcused = (
            int(round(year_subset["Total_Days_Unexcused_Absent"].astype(float).mean()))
            if year_subset["Total_Days_Unexcused_Absent"].notna().any() else None
        )

        metrics.append(classes.StudentMetrics(
            year=str(year),
            attendanceRate=attendance_rate,
            unexcused=unexcused,
            present=int(round(present_mean)) if pd.notna(present_mean) else None,
            total=total
        ))

    # Trend computation
    trend = []
    for year in range(2019, 2025):
        year_subset = subset[subset["SCHOOL_YEAR"] == year]
        if year_subset.empty:
            continue

        present = year_subset["Total_Days_Present"].astype(float).sum()
        enrolled = year_subset["Total_Days_Enrolled"].astype(float).sum()
        avg_attendance = (present / enrolled) if enrolled > 0 else None

        if avg_attendance is not None:
            trend.append(classes.StudentTrend(
                year=str(year),
                value=int(round(avg_attendance * 100)),
                isPredicted=False
            ))

    # CHANGED: Use School_aggregate for trend prediction
    if pd.notna(school_aggregate):
        trend.append(classes.StudentTrend(
            year="2025",
            value=int(round(float(school_aggregate) * 100)),
            isPredicted=True
        ))

    return classes.DataResponse(
            previousAttendance=attendance_2024,
            predictedAttendance=predicted_2025,
            predictedValues=classes.AttendanceValues(
                year='2025',
            predictedAttendance=predicted_2025,
            totalDays=total_days
        ),
            metrics=classes.StudentMetrics(sorted(metrics, key=lambda x: x.year)),
            trend=classes.StudentTrend(sorted(trend, key=lambda x: x.year))
        )
    


#---------------------------------------------------------------------------------------------------------------------------------------------------------
#GRADE DATA BY FILTERS
@app.post("/GradeDetails", repsonse_model=classes.DataResponse)
def get_grade_summary(req: classes.SchoolSummaryRequest):
    subset = df.copy()

    if req.districtName:
        subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]
    if req.schoolName:
        subset = subset[subset["SCHOOL_NAME"].str.strip().str.lower() == req.schoolName.strip().lower()]
    if req.grade != -3:
        subset = subset[subset["STUDENT_GRADE_LEVEL"] == req.grade]

    if subset.empty:
        return {"message": "No matching data found"}

    latest_per_student = (
        subset.sort_values(by=["STUDENT_ID", "SCHOOL_YEAR"])
              .groupby("STUDENT_ID")
              .tail(1)
    )

    year_2024_rows = latest_per_student[latest_per_student["SCHOOL_YEAR"] == 2024]

    if year_2024_rows.empty:
        return {"message": "No 2024 data found in this grade scope."}

    present_days = year_2024_rows["Total_Days_Present"].astype(float)
    enrolled_days = year_2024_rows["Total_Days_Enrolled"].astype(float)
    attendance_2024 = round((present_days.sum() / enrolled_days.sum()) * 100, 1)

    # CHANGED: Use Grade_aggregate instead of mean of individual predictions
    grade_aggregate = latest_per_student["Grade_aggregate"].iloc[0]  # All students in same grade should have same value
    predicted_2025 = round(float(grade_aggregate) * 100, 1) if pd.notna(grade_aggregate) else round(latest_per_student["Predictions"].astype(float).mean() * 100, 1)
    
    total_days = round(enrolled_days.mean(), 1)

    # Metrics computation
    metrics = []
    for year in range(2019, 2025):
        year_subset = subset[subset["SCHOOL_YEAR"] == year]
        if year_subset.empty:
            continue

        present = year_subset["Total_Days_Present"].astype(float).sum()
        enrolled = year_subset["Total_Days_Enrolled"].astype(float).sum()
        attendance_rate = int(round((present / enrolled) * 100)) if enrolled > 0 else None
        present_mean = year_subset["Total_Days_Present"].astype(float).mean()

        total = int(round(year_subset["Total_Days_Enrolled"].astype(float).mean()))
        unexcused = (
            int(round(year_subset["Total_Days_Unexcused_Absent"].astype(float).mean()))
            if year_subset["Total_Days_Unexcused_Absent"].notna().any() else None
        )

        metrics.append(classes.StudentMetrics(
            year=str(year),
            attendanceRate=attendance_rate,
            unexcused=unexcused,
            present=int(round(present_mean)) if pd.notna(present_mean) else None,
            total=total
        ))

    # Trend computation
    trend = []
    for year in range(2019, 2025):
        year_subset = subset[subset["SCHOOL_YEAR"] == year]
        if year_subset.empty:
            continue

        present = year_subset["Total_Days_Present"].astype(float).sum()
        enrolled = year_subset["Total_Days_Enrolled"].astype(float).sum()
        avg_attendance = (present / enrolled) if enrolled > 0 else None

        if avg_attendance is not None:
            trend.append(classes.StudentTrend(
                year=str(year),
                value=int(round(avg_attendance * 100)),
                isPredicted=False
            ))

    # CHANGED: Use Grade_aggregate for trend prediction
    if pd.notna(grade_aggregate):
        trend.append(classes.StudentTrend(
            year="2025",
            value=int(round(float(grade_aggregate) * 100)),
            isPredicted=True
        ))

    return classes.DataResponse(
            previousAttendance=attendance_2024,
            predictedAttendance=predicted_2025,
            predictedValues=classes.AttendanceValues(
                year='2025',
            predictedAttendance=predicted_2025,
            totalDays=total_days
        ),
            metrics=classes.StudentMetrics(sorted(metrics, key=lambda x: x.year)),
            trend=classes.StudentTrend(sorted(trend, key=lambda x: x.year))
        )


@app.post("/StudentDetails", response_model=classes.DataResponse)
def get_student_summary(req: classes.SchoolSummaryRequest):
    subset = df.copy()

    if req.districtName:
        subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]
    if req.schoolName:
        subset = subset[subset["SCHOOL_NAME"].str.strip().str.lower() == req.schoolName.strip().lower()]
    if req.studentId:
        subset = subset[subset["STUDENT_ID"] == req.studentId]
    elif req.grade != -3:
        subset = subset[subset["STUDENT_GRADE_LEVEL"] == req.grade]

    if subset.empty:
        return {"message": "No matching data found"}

    latest_row = subset.sort_values(by="SCHOOL_YEAR").iloc[-1]

    # Get row for 2024 if exists
    year_2024_row = subset[subset["SCHOOL_YEAR"] == 2024].iloc[-1] if not subset[subset["SCHOOL_YEAR"] == 2024].empty else None

    if year_2024_row is not None:
        present_days = float(year_2024_row["Total_Days_Present"])
        enrolled_days = float(year_2024_row["Total_Days_Enrolled"])
        attendance_2024 = round((present_days / enrolled_days) * 100, 1)
        total_days = round(enrolled_days, 1)
    else:
        attendance_2024 = None
        total_days = None

    district_aggregate = latest_row["District_aggregate"] if "District_aggregate" in latest_row and pd.notna(latest_row["District_aggregate"]) else None
    predicted_2025 = round(float(district_aggregate) * 100, 1) if district_aggregate is not None else (round(float(latest_row["Predictions"])*100, 1) if "Predictions" in latest_row else None)

    # Metrics
    metrics = []
    for year in range(2019, 2025):
        row = subset[subset["SCHOOL_YEAR"] == year]
        if row.empty:
            continue

        present = row["Total_Days_Present"].values[0]
        enrolled = row["Total_Days_Enrolled"].values[0]
        present_days_value = int(round(present)) if pd.notna(present) else None

        if pd.notna(present) and pd.notna(enrolled) and enrolled > 0:
            attendance_rate = int(round((present / enrolled) * 100))
        else:
            attendance_rate = None
 
        total = int(round(row["Total_Days_Enrolled"].values[0]))
        unexcused = int(round(row["Total_Days_Unexcused_Absent"].values[0])) if row["Total_Days_Unexcused_Absent"].notna().any() else None

        metrics.append(classes.StudentMetrics(
            year=str(year),
            attendanceRate=attendance_rate,
            unexcused=unexcused,
            present=present_days_value,
            total=total
        ))

    # Trend
    trend = []
    for year in range(2019, 2025):
        row = subset[subset["SCHOOL_YEAR"] == year]
        if row.empty:
            continue

        present = row["Total_Days_Present"].values[0]
        enrolled = row["Total_Days_Enrolled"].values[0]

        if pd.notna(present) and pd.notna(enrolled) and enrolled > 0:
            avg_attendance = (present / enrolled) 
            trend.append(classes.StudentTrend(
                year=str(year),
                value=int(round(avg_attendance * 100)),
                isPredicted=False
            ))

    if district_aggregate is not None:
        trend.append(classes.StudentTrend(
            year="2025",
            value=int(round(float(district_aggregate) * 100)),
            isPredicted=True
        ))
    elif not np.isnan(latest_row["Predictions"]):
        trend.append(classes.StudentTrend(
            year="2025",
            value=int(round(latest_row["Predictions"] * 100)),
            isPredicted=True
        ))

    return classes.DataResponse(
            previousAttendance=attendance_2024,
            predictedAttendance=predicted_2025,
            predictedValues=classes.AttendanceValues(
                year='2025',
            predictedAttendance=predicted_2025,
            totalDays=total_days
        ),
            metrics=classes.StudentMetrics(sorted(metrics, key=lambda x: x.year)),
            trend=classes.StudentTrend(sorted(trend, key=lambda x: x.year))
        )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

