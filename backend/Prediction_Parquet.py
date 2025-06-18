# from fastapi import FastAPI  # type: ignore
# from fastapi.middleware.cors import CORSMiddleware  # type: ignore
# from fastapi.responses import ORJSONResponse  # Faster JSON serialization
# import pandas as pd
# import numpy as np
# from pydantic import BaseModel
# from typing import List, Dict, Optional
# import re

# app = FastAPI(default_response_class=ORJSONResponse)

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:8080"],
#     allow_credentials=False,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# df = None            # Global variable to hold the DataFrame
# cached_students = []  # Global variable to cache precomputed student list

# class Student(BaseModel):
#     id: str
#     locationId: int
#     grade: str
#     schoolName: str
#     districtName: str

# class PredictedAttendance(BaseModel):
#     year: str
#     attendanceRate: int
#     absences: float
#     excused: float
#     total: int

# class StudentDetails(BaseModel):
#     attendance2024: int
#     predicted2025: int
#     predictedAttendance: PredictedAttendance

# class StudentMetric(BaseModel):
#     year: str
#     attendanceRate: int
#     absences: Optional[float]
#     excused: Optional[float]
#     lates: int
#     total: int

# class StudentTrend(BaseModel):
#     year: str
#     value: int
#     isPredicted: bool

# @app.on_event("startup")
# async def load_data():
#     global df, cached_students
#     df = pd.read_parquet("AttendanceDataProcessedPrediction.parquet")
#     print("Parquet file loaded successfully.")
#     df['STUDENT_ID'] = df['STUDENT_ID'].astype(int)

#     cached_students = []  # Precompute the student list here
#     for _, row in df.iterrows():
#         sid = int(row["STUDENT_ID"])
#         location_id = int(row.get("LOCATION_ID", -1))
#         g = row.get("STUDENT_GRADE_LEVEL_2024", np.nan)

#         grade = "Unknown Grade" if pd.isna(g) else int(g)
#         if grade == -1:
#             grade_str = 'Pre-Kindergarten'
#         elif grade == 0:
#             grade_str = "Kindergarten"
#         elif grade == 1:
#             grade_str = "1st Grade"
#         elif grade == 2:
#             grade_str = "2nd Grade"
#         elif grade == 3:
#             grade_str = "3rd Grade"
#         elif grade >= 11:
#             grade_str = f"{grade}th Grade"
#         else:
#             suffix = {1: "st", 2: "nd", 3: "rd"}.get(grade % 10, "th")
#             grade_str = f"{grade}{suffix} Grade"

#         school_name = row.get("SCHOOL_NAME", "Unknown School")
#         district_name = row.get("DISTRICT_NAME", "Unknown District")

#         cached_students.append({
#             "id": str(sid),
#             "grade": grade_str,
#             "locationId": location_id,
#             "schoolName": school_name,
#             "districtName": district_name
#         })

#     cached_students.sort(key=lambda x: x["id"])


# @app.get("/students", response_model=List[Student])
# def get_students():
#     print(f"Cached Students: {len(cached_students)}")
#     return cached_students


# @app.get("/StudentDetails/StudentID/{student_id}", response_model=Optional[StudentDetails])
# def get_student_details(student_id: int):
#     subset = df[df["STUDENT_ID"] == student_id]
#     if subset.empty:
#         return {}
#     s = subset.iloc[0]
#     a24 = int(round(float(s["ATTENDANCE_PERCENT_2024"])))
#     p25 = int(round(float(s["Predicted_2025"])))

#     total24 = s.get("TOTAL_DAYS_ENROLLED_2024", 0)
#     days25 = int(total24)
#     abs_val = round((100 - p25) / 100 * days25 * 2) / 2
#     unexc_prop = s.get("UNEXCUSED_ABSENT_PROPORTION_2024", 0.5)
#     if np.isnan(unexc_prop):
#         unexc_prop = 0.5
#     unexc = round(abs_val * unexc_prop * 2) / 2
#     exc = abs_val - unexc

#     exp = re.compile(r'^ATTENDANCE_PERCENT_\d{4}$')
#     cols = [col for col in subset.columns if exp.match(col)]
#     print(cols)
#     avg_val = subset.loc[:, cols].stack().mean(skipna=True)


#     return StudentDetails(
#         attendance2024=a24,
#         predicted2025=p25,
#         predictedAttendance=PredictedAttendance(
#             year="2025",
#             attendanceRate=p25,
#             absences=unexc + exc,
#             excused=exc,
#             total=days25
#         )
#     )


# @app.get("/StudentMetrics/StudentID/{student_id}",response_model=List[StudentMetric])
# def get_student_metrics(student_id: int):
#     subset = df[df["STUDENT_ID"] == student_id]
#     if subset.empty:
#         return []
#     s = subset.iloc[0]
#     out = []
#     for year in range(2020, 2025):
#         if year == 2025:
#             break
#         a = s.get(f"ATTENDANCE_PERCENT_{year}")
#         t = s.get(f"TOTAL_DAYS_ENROLLED_{year}")
#         ab = s.get(f"TOTAL_DAYS_ABSENT_{year}")
#         ex = s.get(f"TOTAL_DAYS_EXCUSED_ABSENT_{year}")
#         if pd.notna(a) and pd.notna(t) and t > 0:
#             out.append(StudentMetric(
#                 year=str(year),
#                 attendanceRate=int(round(a)),
#                 absences=ab if pd.notna(ab) else None,
#                 excused=ex if pd.notna(ex) else None,
#                 lates=0,
#                 total=int(t)
#             ))
#     return sorted(out, key=lambda x: x.year)


# @app.get("/StudentTrend/StudentID/{student_id}",response_model=List[StudentTrend])
# def get_student_trend(student_id: int):
#     subset = df[df["STUDENT_ID"] == student_id]
#     if subset.empty:
#         return []
#     s = subset.iloc[0]
#     trend = []
#     for year in range(2020, 2025):
#         if year == 2025:
#             break
#         a = s.get(f"ATTENDANCE_PERCENT_{year}")
#         t = s.get(f"TOTAL_DAYS_ENROLLED_{year}", 0)
#         if pd.notna(a) and t > 0:
#             trend.append(StudentTrend(year=str(year), value=int(round(a)), isPredicted=False))
#     p = s["Predicted_2025"]
#     trend.append(StudentTrend(year="2025", value=int(round(p)), isPredicted=True))
#     return trend

# class SchoolSummaryRequest(BaseModel):
#     districtName: Optional[str] = None
#     schoolName: Optional[str] = None
#     studentId: Optional[int] = None
#     grade: Optional[int] = -3

# @app.post("/StudentDetails/ByFilters")
# def get_summary_by_filters(req: SchoolSummaryRequest):
#     subset = df.copy()
#     # subset["STUDENT_GRADE_LEVEL_2024"] = subset["STUDENT_GRADE_LEVEL_2024"].astype(str)

#     # Apply filters if they exist
#     if req.districtName:
#         subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]

#     if req.schoolName:
#         subset = subset[subset["SCHOOL_NAME"].str.strip().str.lower() == req.schoolName.strip().lower()]

#     if req.studentId:
#         subset = subset[subset["STUDENT_ID"] == req.studentId]

#     if req.grade != -3:
#         subset = subset[subset["STUDENT_GRADE_LEVEL_2024"] == req.grade]

#     if subset.empty:
#         return {"message": "No matching data found"}

#     # Handle single student row (exact values)
#     if len(subset) == 1:
#         row = subset.iloc[0]
#         attendance_2024 = row["ATTENDANCE_PERCENT_2024"].astype(float).round(1)
#         predicted_2025 = row["Predicted_2025"].astype(float).round(1)
#         total_days = row["TOTAL_DAYS_ENROLLED_2024"].astype(float).round(1)

#         abs_val = round((100 - predicted_2025) / 100 * total_days * 2) / 2
#         unexc_prop = row["UNEXCUSED_ABSENT_PROPORTION_2024"]
#         if np.isnan(unexc_prop):
#             unexc_prop = 0.5
#         unexc = round(abs_val * unexc_prop * 2) / 2
#         exc = abs_val - unexc

#         return {
#             "attendance2024": attendance_2024,
#             "predicted2025": predicted_2025,
#             "predictedAttendance": {
#                 "year": "2025",
#                 "attendanceRate": predicted_2025,
#                 "absences": unexc + exc,
#                 "excused": exc,
#                 "total": total_days
#             }
#         }

#     # Handle group data (averages)
#     avg_attendance_2024 = int(round(subset["ATTENDANCE_PERCENT_2024"].mean(skipna=True)))
#     avg_predicted_2025 = int(round(subset["Predicted_2025"].mean(skipna=True)))
#     avg_days_enrolled_24 = int(round(subset["TOTAL_DAYS_ENROLLED_2024"].mean(skipna=True)))

#     abs_val = round((100 - avg_predicted_2025) / 100 * avg_days_enrolled_24 * 2) / 2
#     unexc_prop = subset["UNEXCUSED_ABSENT_PROPORTION_2024"].mean()
#     if np.isnan(unexc_prop):
#         unexc_prop = 0.5
#     unexc = round(abs_val * unexc_prop * 2) / 2
#     exc = abs_val - unexc

#     return {
#         "attendance2024": avg_attendance_2024,
#         "predicted2025": avg_predicted_2025,
#         "predictedAttendance": {
#             "year": "2025",
#             "attendanceRate": avg_predicted_2025,
#             "absences": unexc + exc,
#             "excused": exc,
#             "total": avg_days_enrolled_24
#         }
#     }

# class StudentMetrics:
#     year: str
#     attendanceRate: Optional[int]
#     absences: Optional[float]
#     excused: Optional[float]
#     total: Optional[int]

# @app.post("/StudentMetrics/ByFilters",response_model=List[StudentMetric])
# def get_student_metrics(req:SchoolSummaryRequest):
#     subset = df.copy()

#     if req.districtName:
#         subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]

#     if req.schoolName:
#         subset = subset[subset["SCHOOL_NAME"].str.strip().str.lower() == req.schoolName.strip().lower()]
    
#     if req.grade != -3:
#         subset = subset[subset["STUDENT_GRADE_LEVEL_2024"] == req.grade]
    
#     if req.studentId:
#         subset = subset[subset["STUDENT_ID"] == req.studentId]
    
#     if subset.empty:
#         return []
    
#     if len(subset) == 1:
#         s = subset.iloc[0]
#         out = []
#         for year in range(2020,2025):
#             if year == 2025:
#                 break
#             a = s.get(f"ATTENDANCE_PERCENT_{year}")
#             t = s.get(f"TOTAL_DAYS_ENROLLED_{year}")
#             ab = s.get(f"TOTAL_DAYS_ABSENT_{year}")
#             ex = s.get(f"TOTAL_DAYS_EXCUSED_ABSENT_{year}")
#             if pd.notna(a) and pd.notna(t) and t > 0:
#                 out.append(StudentMetric(
#                     year=str(year),
#                     attendanceRate=int(round(a)),
#                     absences=ab if pd.notna(ab) else None,
#                     excused=ex if pd.notna(ex) else None,
#                     lates=0,
#                     total=int(t)
#                 ))
#         return sorted(out, key=lambda x: x.year)
    
#     metrics = []
#     for year in range(2020, 2025):
#         a_col = f"ATTENDANCE_PERCENT_{year}"
#         t_col = f"TOTAL_DAYS_ENROLLED_{year}"
#         ab_col = f"TOTAL_DAYS_ABSENT_{year}"
#         ex_col = f"TOTAL_DAYS_EXCUSED_ABSENT_{year}"

#         year_data = subset[
#             (subset[t_col].notna()) & (subset[t_col] > 0) & (subset[a_col].notna())
#         ]

#         if year_data.empty:
#             continue

#         metrics.append(StudentMetric(
#             year=str(year),
#             attendanceRate=int(round(year_data[a_col].mean())),
#             absences=int(round(year_data[ab_col].mean())) if year_data[ab_col].notna().any() else None,
#             excused=int(round(year_data[ex_col].mean())) if year_data[ex_col].notna().any() else None,
#             total=int(round(year_data[t_col].mean()))
#         ))

#     return sorted(metrics, key=lambda x: x.year)
    

# class StudentTrend(BaseModel):
#     year: str
#     value: int
#     isPredicted: bool

# # Add this endpoint to your FastAPI backend (paste-2.txt)

# @app.post("/StudentSummaryTrend/ByFilters", response_model=List[StudentTrend])
# def get_student_summary_trend(req: SchoolSummaryRequest):
#     subset = df.copy()

#     # Apply filters
#     if req.districtName:
#         subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]

#     if req.schoolName:
#         subset = subset[subset["SCHOOL_NAME"].str.strip().str.lower() == req.schoolName.strip().lower()]
    
#     if req.grade != -3:
#         subset = subset[subset["STUDENT_GRADE_LEVEL_2024"] == req.grade]
    
#     if req.studentId:
#         subset = subset[subset["STUDENT_ID"] == req.studentId]
    
#     if subset.empty:
#         return []
    
#     # Handle single student (exact values)
#     if len(subset) == 1:
#         s = subset.iloc[0]
#         trend = []
#         for year in range(2020, 2025):
#             if year == 2025:
#                 break
#             a = s.get(f"ATTENDANCE_PERCENT_{year}")
#             t = s.get(f"TOTAL_DAYS_ENROLLED_{year}", 0)
#             if pd.notna(a) and t > 0:
#                 trend.append(StudentTrend(year=str(year), value=int(round(a)), isPredicted=False))
        
#         # Add predicted value
#         p = s["Predicted_2025"]
#         if pd.notna(p):
#             trend.append(StudentTrend(year="2025", value=int(round(p)), isPredicted=True))
#         return trend
    
#     # Handle group data (averages)
#     trend = []
#     for year in range(2020, 2025):
#         a_col = f"ATTENDANCE_PERCENT_{year}"
#         t_col = f"TOTAL_DAYS_ENROLLED_{year}"

#         year_data = subset[
#             (subset[t_col].notna()) & (subset[t_col] > 0) & (subset[a_col].notna())
#         ]

#         if year_data.empty:
#             continue

#         avg_attendance = year_data[a_col].mean()
#         trend.append(StudentTrend(
#             year=str(year), 
#             value=int(round(avg_attendance)), 
#             isPredicted=False
#         ))

#     # Add average predicted value for the group
#     predicted_data = subset[subset["Predicted_2025"].notna()]
#     if not predicted_data.empty:
#         avg_predicted = predicted_data["Predicted_2025"].mean()
#         trend.append(StudentTrend(
#             year="2025", 
#             value=int(round(avg_predicted)), 
#             isPredicted=True
#         ))

#     return trend



from fastapi import FastAPI  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from fastapi.responses import ORJSONResponse  # Faster JSON serialization
import pandas as pd
import numpy as np
from pydantic import BaseModel
from typing import List, Dict, Optional
import re

app = FastAPI(default_response_class=ORJSONResponse)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

df = None            # Global variable to hold the DataFrame
cached_students = []  # Global variable to cache precomputed student list

class Student(BaseModel):
    id: str
    locationId: int
    grade: str
    schoolName: str
    districtName: str

class PredictedAttendance(BaseModel):
    year: str
    attendanceRate: int
    absences: float
    excused: float
    total: int

class StudentDetails(BaseModel):
    attendance2024: int
    predicted2025: int
    predictedAttendance: PredictedAttendance

class StudentMetric(BaseModel):
    year: str
    attendanceRate: int
    absences: Optional[float]
    excused: Optional[float]
    lates: int
    total: int

class StudentTrend(BaseModel):
    year: str
    value: int
    isPredicted: bool

@app.on_event("startup")
async def load_data():
    global df, cached_students
    df = pd.read_parquet("AttendanceDataProcessedPrediction.parquet")
    print("Parquet file loaded successfully.")
    df['STUDENT_ID'] = df['STUDENT_ID'].astype(int)

    cached_students = []  # Precompute the student list here
    for _, row in df.iterrows():
        sid = int(row["STUDENT_ID"])
        location_id = int(row.get("LOCATION_ID", -1))
        g = row.get("STUDENT_GRADE_LEVEL_2024", np.nan)

        grade = "Unknown Grade" if pd.isna(g) else int(g)
        if grade == -1:
            grade_str = 'Pre-Kindergarten'
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

        school_name = row.get("SCHOOL_NAME", "Unknown School")
        district_name = row.get("DISTRICT_NAME", "Unknown District")

        cached_students.append({
            "id": str(sid),
            "grade": grade_str,
            "locationId": location_id,
            "schoolName": school_name,
            "districtName": district_name
        })

    cached_students.sort(key=lambda x: x["id"])


@app.get("/students", response_model=List[Student])
def get_students():
    print(f"Cached Students: {len(cached_students)}")
    return cached_students



class SchoolSummaryRequest(BaseModel):
    districtName: Optional[str] = None
    schoolName: Optional[str] = None
    studentId: Optional[int] = None
    grade: Optional[int] = -3

@app.post("/StudentDetails/ByFilters")
def get_summary_by_filters(req: SchoolSummaryRequest):
    subset = df.copy()
    
    if req.districtName:
        subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]

    if req.schoolName:
        subset = subset[subset["SCHOOL_NAME"].str.strip().str.lower() == req.schoolName.strip().lower()]

    if req.studentId:
        subset = subset[subset["STUDENT_ID"] == req.studentId]

    if req.grade != -3:
        subset = subset[subset["STUDENT_GRADE_LEVEL_2024"] == req.grade]

    if subset.empty:
        return {"message": "No matching data found"}

    # Handle single student row (exact values)
    if len(subset) == 1:
        row = subset.iloc[0]
        attendance_2024 = row["ATTENDANCE_PERCENT_2024"].astype(float).round(1)
        predicted_2025 = row["Predicted_2025"].astype(float).round(1)
        total_days = row["TOTAL_DAYS_ENROLLED_2024"].astype(float).round(1)

        abs_val = round((100 - predicted_2025) / 100 * total_days * 2) / 2
        unexc_prop = row["UNEXCUSED_ABSENT_PROPORTION_2024"]
        if np.isnan(unexc_prop):
            unexc_prop = 0.5
        unexc = round(abs_val * unexc_prop * 2) / 2
        exc = abs_val - unexc

        return {
            "attendance2024": attendance_2024,
            "predicted2025": predicted_2025,
            "predictedAttendance": {
                "year": "2025",
                "attendanceRate": predicted_2025,
                "absences": unexc + exc,
                "excused": exc,
                "total": total_days
            }
        }

    # Handle group data (averages)
    avg_attendance_2024 = int(round(subset["ATTENDANCE_PERCENT_2024"].mean(skipna=True)))
    avg_predicted_2025 = int(round(subset["Predicted_2025"].mean(skipna=True)))
    avg_days_enrolled_24 = int(round(subset["TOTAL_DAYS_ENROLLED_2024"].mean(skipna=True)))

    abs_val = round((100 - avg_predicted_2025) / 100 * avg_days_enrolled_24 * 2) / 2
    unexc_prop = subset["UNEXCUSED_ABSENT_PROPORTION_2024"].mean()
    if np.isnan(unexc_prop):
        unexc_prop = 0.5
    unexc = round(abs_val * unexc_prop * 2) / 2
    exc = abs_val - unexc

    return {
        "attendance2024": avg_attendance_2024,
        "predicted2025": avg_predicted_2025,
        "predictedAttendance": {
            "year": "2025",
            "attendanceRate": avg_predicted_2025,
            "absences": unexc + exc,
            "excused": exc,
            "total": avg_days_enrolled_24
        }
    }

class StudentMetrics:
    year: str
    attendanceRate: Optional[int]
    absences: Optional[float]
    excused: Optional[float]
    total: Optional[int]

@app.post("/StudentMetrics/ByFilters",response_model=List[StudentMetric])
def get_student_metrics_by_filters(req:SchoolSummaryRequest):  # Renamed to avoid conflict
    subset = df.copy()

    if req.districtName:
        subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]

    if req.schoolName:
        subset = subset[subset["SCHOOL_NAME"].str.strip().str.lower() == req.schoolName.strip().lower()]
    
    if req.grade != -3:
        subset = subset[subset["STUDENT_GRADE_LEVEL_2024"] == req.grade]
    
    if req.studentId:
        subset = subset[subset["STUDENT_ID"] == req.studentId]
    
    if subset.empty:
        return []
    
    if len(subset) == 1:
        s = subset.iloc[0]
        out = []
        for year in range(2020,2025):
            if year == 2025:
                break
            a = s.get(f"ATTENDANCE_PERCENT_{year}")
            t = s.get(f"TOTAL_DAYS_ENROLLED_{year}")
            ab = s.get(f"TOTAL_DAYS_ABSENT_{year}")
            ex = s.get(f"TOTAL_DAYS_EXCUSED_ABSENT_{year}")
            if pd.notna(a) and pd.notna(t) and t > 0:
                out.append(StudentMetric(
                    year=str(year),
                    attendanceRate=int(round(a)),
                    absences=ab if pd.notna(ab) else None,
                    excused=ex if pd.notna(ex) else None,
                    total=int(t)
                ))
        return sorted(out, key=lambda x: x.year)
    
    metrics = []
    for year in range(2020, 2025):
        a_col = f"ATTENDANCE_PERCENT_{year}"
        t_col = f"TOTAL_DAYS_ENROLLED_{year}"
        ab_col = f"TOTAL_DAYS_ABSENT_{year}"
        ex_col = f"TOTAL_DAYS_EXCUSED_ABSENT_{year}"

        year_data = subset[
            (subset[t_col].notna()) & (subset[t_col] > 0) & (subset[a_col].notna())
        ]

        if year_data.empty:
            continue

        metrics.append(StudentMetric(
            year=str(year),
            attendanceRate=int(round(year_data[a_col].mean())),
            absences=int(round(year_data[ab_col].mean())) if year_data[ab_col].notna().any() else None,
            excused=int(round(year_data[ex_col].mean())) if year_data[ex_col].notna().any() else None,
            total=int(round(year_data[t_col].mean()))
        ))

    return sorted(metrics, key=lambda x: x.year)
    

class StudentTrend(BaseModel):
    year: str
    value: int
    isPredicted: bool

# Add this endpoint to your FastAPI backend (paste-2.txt)

@app.post("/StudentSummaryTrend/ByFilters", response_model=List[StudentTrend])
def get_student_summary_trend(req: SchoolSummaryRequest):
    subset = df.copy()

    # Apply filters
    if req.districtName:
        subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]

    if req.schoolName:
        subset = subset[subset["SCHOOL_NAME"].str.strip().str.lower() == req.schoolName.strip().lower()]
    
    if req.grade != -3:
        subset = subset[subset["STUDENT_GRADE_LEVEL_2024"] == req.grade]
    
    if req.studentId:
        subset = subset[subset["STUDENT_ID"] == req.studentId]
    
    if subset.empty:
        return []
    
    # Handle single student (exact values)
    if len(subset) == 1:
        s = subset.iloc[0]
        trend = []
        for year in range(2020, 2025):
            if year == 2025:
                break
            a = s.get(f"ATTENDANCE_PERCENT_{year}")
            t = s.get(f"TOTAL_DAYS_ENROLLED_{year}", 0)
            if pd.notna(a) and t > 0:
                trend.append(StudentTrend(year=str(year), value=int(round(a)), isPredicted=False))
        
        # Add predicted value
        p = s["Predicted_2025"]
        if pd.notna(p):
            trend.append(StudentTrend(year="2025", value=int(round(p)), isPredicted=True))
        return trend
    
    # Handle group data (averages)
    trend = []
    for year in range(2020, 2025):
        a_col = f"ATTENDANCE_PERCENT_{year}"
        t_col = f"TOTAL_DAYS_ENROLLED_{year}"

        year_data = subset[
            (subset[t_col].notna()) & (subset[t_col] > 0) & (subset[a_col].notna())
        ]

        if year_data.empty:
            continue

        avg_attendance = year_data[a_col].mean()
        trend.append(StudentTrend(
            year=str(year), 
            value=int(round(avg_attendance)), 
            isPredicted=False
        ))

    # Add average predicted value for the group
    predicted_data = subset[subset["Predicted_2025"].notna()]
    if not predicted_data.empty:
        avg_predicted = predicted_data["Predicted_2025"].mean()
        trend.append(StudentTrend(
            year="2025", 
            value=int(round(avg_predicted)), 
            isPredicted=True
        ))

    return trend


    # Backend filtering endpoints for dynamic dropdowns

from fastapi import Query

def load_df():
    return pd.read_parquet("AttendanceDataProcessedPrediction.parquet")

@app.get("/districts", response_model=List[str])
def get_districts():
    global df
    return sorted(df["DISTRICT_NAME"].dropna().unique())

@app.get("/schools", response_model=List[str])
def get_schools(district: str = None):
    global df
    if district:
        schools = df[df["DISTRICT_NAME"] == district]["SCHOOL_NAME"].dropna().unique()
    else:
        schools = df["SCHOOL_NAME"].dropna().unique()
    return sorted(schools)

@app.get("/grades", response_model=List[str])
def get_grades(school: str = None):
    global df
    if school:
        grades = df[df["SCHOOL_NAME"] == school]["GRADE"].dropna().unique()
    else:
        grades = df["STUDENT_GRADE_LEVEL_2024"].dropna().unique()
    return sorted([str(g) for g in grades])

