# #---------------------------------------------------------------------------------------------------------------------------------------------------------------
# # IMPORTS
# from fastapi import FastAPI 
# from fastapi.middleware.cors import CORSMiddleware 
# from fastapi.responses import ORJSONResponse  
# from contextlib import asynccontextmanager
# import pandas as pd
# import numpy as np
# from pydantic import BaseModel
# from typing import List, Dict, Optional
# import re
# import threading

# df = None            
# cached_students = []  

# #---------------------------------------------------------------------------------------------------------------------------------------------------------------
# #CLASS MODELS
# class Student(BaseModel):
#     id: str
#     locationId: int
#     grade: str
#     schoolName: str
#     districtName: str

# class SchoolSummaryRequest(BaseModel):
#     districtName: Optional[str] = None
#     schoolName: Optional[str] = None
#     studentId: Optional[int] = None
#     grade: Optional[int] = -3

# class StudentMetrics(BaseModel):
#     year: str
#     attendanceRate: Optional[int]
#     unexcused: Optional[float]
#     total: Optional[int]

# class StudentTrend(BaseModel):
#     year: str
#     value: int
#     isPredicted: bool

# # ---------------------------------------------------------------------------------------------------------------------------------------------------------------
# # ON STARTUP, LOAD DATA
# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     background_thread = threading.Thread(target=load_and_process_data)
#     background_thread.daemon = True
#     background_thread.start()
#     yield
# #---------------------------------------------------------------------------------------------------------------------------------------------------------------
# # Create FastAPI app with ORJSONResponse as default response class

# app = FastAPI(default_response_class=ORJSONResponse, lifespan=lifespan)

# def load_and_process_data():
#     global df, cached_students
#     df = pd.read_parquet("Data/students.parquet")
#     cached_students = []  

#     for sid in df['STUDENT_ID'].unique():
#             row = df[df['STUDENT_ID'] == sid].iloc[-1]
#             sid = int(row["STUDENT_ID"])
#             # location_id = int(row.get("LOCATION_ID", -1))
#             g = row.get("STUDENT_GRADE_LEVEL", np.nan)

#             grade = "Unknown Grade" if pd.isna(g) else int(g)
#             if grade == -1:
#                 grade_str = 'Pre-Kindergarten'
#             elif grade == 0:
#                 grade_str = "Kindergarten"
#             elif grade == 1:
#                 grade_str = "1st Grade"
#             elif grade == 2:
#                 grade_str = "2nd Grade"
#             elif grade == 3:
#                 grade_str = "3rd Grade"
#             elif grade >= 11:
#                 grade_str = f"{grade}th Grade"
#             else:
#                 suffix = {1: "st", 2: "nd", 3: "rd"}.get(grade % 10, "th")
#                 grade_str = f"{grade}{suffix} Grade"

#             school_name = row.get("SCHOOL_NAME", "Unknown School")
#             district_name = row.get("DISTRICT_NAME", "Unknown District")

#             cached_students.append({
#                 "id": str(sid),
#                 "grade": grade_str,
#                 # "locationId": location_id,
#                 "schoolName": school_name,
#                 "districtName": district_name
#             })

#     cached_students.sort(key=lambda x: x["id"])
#     return cached_students, df


# #---------------------------------------------------------------------------------------------------------------------------------------------------------
# # Endpoint to get all students
# @app.get("/students", response_model=List[Student])
# def get_students():
#     print(f"Cached Students: {len(cached_students)}")
#     return cached_students[:100]

# #---------------------------------------------------------------------------------------------------------------------------------------------------------
# #DISTRICT DATA BY FILTERS
# @app.post("/DistrictData/ByFilters")
# def get_district_summary(req: SchoolSummaryRequest):
#     subset = df.copy()
#     print("All Student IDs:", df['STUDENT_ID'].unique().tolist()[:10])

#     if req.districtName and not req.schoolName and not req.studentId and req.grade == -3:

#         subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]
        
#         if subset.empty:
#             return {"message": "No matching data found"}

#         latest_per_student = (
#             subset.sort_values(by=["STUDENT_ID", "SCHOOL_YEAR"])
#                   .groupby("STUDENT_ID")
#                   .tail(1)
#         )

#         year_2024_rows = subset[subset["SCHOOL_YEAR"] == 2024]

#         if year_2024_rows.empty:
#             return {"message": "No 2024 data found in this district."}

  
#         present_days = year_2024_rows["Total_Days_Present"].astype(float)
#         enrolled_days = year_2024_rows["Total_Days_Enrolled"].astype(float)
#         attendance_2024 = round((present_days.sum() / enrolled_days.sum()) * 100, 1)

#         predicted_2025 = round(latest_per_student["Predictions"].astype(float).mean()*100, 1)
#         total_days = round(enrolled_days.mean(), 1)

#         # Metrics computation
#         metrics = []
#         for year in range(2019, 2025):
#             a_col = subset[subset["SCHOOL_YEAR"] == year].loc[:, 'Predictions']
#             t_col = subset[subset["SCHOOL_YEAR"] == year].loc[:, 'Total_Days_Enrolled']
#             unex_col = subset[subset["SCHOOL_YEAR"] == year].loc[:, 'Total_Days_Unexcused_Absent']
#             #ab_col = subset[subset["SCHOOL_YEAR"] == year].loc[:, 'Total_Days_Absent']

#             # year_data = subset[
#             #     (subset[t_col].notna()) & (subset[t_col] > 0) & (subset[a_col].notna())
#             # ]

#             #add later
#             # if year_data.empty:
#             #     continue

#             metrics.append(StudentMetrics(
#                 year=str(year),
#                 attendanceRate=int(round(a_col.mean()*100)),
#                 #absences=int(round(year_data[ab_col].mean())) if year_data[ab_col].notna().any() else None,
#                 unexcused=int(round(unex_col.mean())) if unex_col.notna().any() else None,
#                 total=int(round(t_col.mean()))
#             ))

#         # Trend computation
#         trend = []
#         for year in range(2019, 2025):
#             a_col = subset[subset["SCHOOL_YEAR"] == year].loc[:, 'Predictions']
#             t_col = subset[subset["SCHOOL_YEAR"] == year].loc[:, 'Total_Days_Enrolled']

#             # year_data = subset[
#             #     (subset[t_col].notna()) & (subset[t_col] > 0) & (subset[a_col].notna())
#             # ]

#             # if year_data.empty:
#             #     continue

#             avg_attendance = a_col.mean()
#             trend.append(StudentTrend(
#                 year=str(year),
#                 value=int(round(avg_attendance)*100),
#                 isPredicted=False
#             ))

#         if latest_per_student["Predictions"].notna().any():
#             avg_predicted = latest_per_student["Predictions"].astype(float).mean() * 100
#             trend.append(StudentTrend(
#                 year="2025",
#                 value=int(round(avg_predicted)),
#                 isPredicted=True
#             ))

#         return {
#             "attendance2024": attendance_2024,
#             "predicted2025": predicted_2025,
#             "predictedAttendance": {
#                 "year": "2025",
#                 "attendanceRate": predicted_2025,
#                 "total": total_days
#             },
#             "metrics": sorted(metrics, key=lambda x: x.year),
#             "trend": sorted(trend, key=lambda x: x.year)
#         }

#     return {"message": "Only district-level filter is supported in this version."}

# #---------------------------------------------------------------------------------------------------------------------------------------------------------
# #SCHOOL DATA BY FILTERS
# @app.post("/SchoolData/ByFilters")
# def get_school_summary(req: SchoolSummaryRequest):
#     subset = df.copy()

#     if req.districtName:
#         subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]
#     if req.schoolName:
#         subset = subset[subset["SCHOOL_NAME"].str.strip().str.lower() == req.schoolName.strip().lower()]

#     if subset.empty:
#         return {"message": "No matching data found"}

#     latest_per_student = (
#         subset.sort_values(by=["STUDENT_ID", "SCHOOL_YEAR"])
#               .groupby("STUDENT_ID")
#               .tail(1)
#     )

#     year_2024_rows = latest_per_student[latest_per_student["SCHOOL_YEAR"] == 2024]

#     if year_2024_rows.empty:
#         return {"message": "No 2024 data found in this school."}

#     present_days = year_2024_rows["Total_Days_Present"].astype(float)
#     enrolled_days = year_2024_rows["Total_Days_Enrolled"].astype(float)
#     attendance_2024 = round((present_days.sum() / enrolled_days.sum()) * 100, 1)

#     predicted_2025 = round(latest_per_student["Predictions"].astype(float).mean()*100, 1)
#     total_days = round(enrolled_days.mean(), 1)

#     # Metrics computation
#     metrics = []
#     for year in range(2019, 2025):
#         year_subset = subset[subset["SCHOOL_YEAR"] == year]
#         if year_subset.empty:
#             continue

#         attendance_rate = int(round(year_subset["Predictions"].astype(float).mean() * 100))
#         total = int(round(year_subset["Total_Days_Enrolled"].astype(float).mean()))
#         unexcused = int(round(year_subset["Total_Days_Unexcused_Absent"].astype(float).mean())) if year_subset["Total_Days_Unexcused_Absent"].notna().any() else None

#         metrics.append(StudentMetrics(
#             year=str(year),
#             attendanceRate=attendance_rate,
#             absences=None,
#             unexcused=unexcused,
#             total=total
#         ))

#     # Trend computation
#     trend = []
#     for year in range(2019, 2025):
#         year_subset = subset[subset["SCHOOL_YEAR"] == year]
#         if year_subset.empty:
#             continue

#         avg_attendance = year_subset["Predictions"].astype(float).mean()
#         trend.append(StudentTrend(
#             year=str(year),
#             value=int(round(avg_attendance * 100)),
#             isPredicted=False
#         ))

#     if latest_per_student["Predictions"].notna().any():
#         avg_predicted = latest_per_student["Predictions"].astype(float).mean() * 100
#         trend.append(StudentTrend(
#             year="2025",
#             value=int(round(avg_predicted)),
#             isPredicted=True
#         ))


#     return {
#         "attendance2024": attendance_2024,
#         "predicted2025": predicted_2025,
#         "predictedAttendance": {
#             "year": "2025",
#             "attendanceRate": predicted_2025,
#             "total": total_days
#         },
#         "metrics": sorted(metrics, key=lambda x: x.year),
#         "trend": sorted(trend, key=lambda x: x.year)
#     }
    


# #---------------------------------------------------------------------------------------------------------------------------------------------------------
# #GRADE DATA BY FILTERS
# @app.post("/GradeDetails/ByFilters")
# def get_grade_summary(req: SchoolSummaryRequest):
#     subset = df.copy()

#     if req.districtName:
#         subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]
#     if req.schoolName:
#         subset = subset[subset["SCHOOL_NAME"].str.strip().str.lower() == req.schoolName.strip().lower()]
#     if req.grade != -3:
#         subset = subset[subset["STUDENT_GRADE_LEVEL"] == req.grade]

#     if subset.empty:
#         return {"message": "No matching data found"}

#     latest_per_student = (
#         subset.sort_values(by=["STUDENT_ID", "SCHOOL_YEAR"])
#               .groupby("STUDENT_ID")
#               .tail(1)
#     )

#     year_2024_rows = latest_per_student[latest_per_student["SCHOOL_YEAR"] == 2024]

#     if year_2024_rows.empty:
#         return {"message": "No 2024 data found in this grade scope."}

#     present_days = year_2024_rows["Total_Days_Present"].astype(float)
#     enrolled_days = year_2024_rows["Total_Days_Enrolled"].astype(float)
#     attendance_2024 = round((present_days.sum() / enrolled_days.sum()) * 100, 1)

#     predicted_2025 = round(latest_per_student["Predictions"].astype(float).mean()*100, 1)
#     total_days = round(enrolled_days.mean(), 1)

#     # Metrics computation
#     metrics = []
#     for year in range(2019, 2025):
#         year_subset = subset[subset["SCHOOL_YEAR"] == year]
#         if year_subset.empty:
#             continue

#         attendance_rate = int(round(year_subset["Predictions"].astype(float).mean() * 100))
#         total = int(round(year_subset["Total_Days_Enrolled"].astype(float).mean()))
#         unexcused = int(round(year_subset["Total_Days_Unexcused_Absent"].astype(float).mean())) if year_subset["Total_Days_Unexcused_Absent"].notna().any() else None

#         metrics.append(StudentMetrics(
#             year=str(year),
#             attendanceRate=attendance_rate,
#             absences=None,
#             unexcused=unexcused,
#             total=total
#         ))

#     # Trend computation
#     trend = []
#     for year in range(2019, 2025):
#         year_subset = subset[subset["SCHOOL_YEAR"] == year]
#         if year_subset.empty:
#             continue

#         avg_attendance = year_subset["Predictions"].astype(float).mean()
#         trend.append(StudentTrend(
#             year=str(year),
#             value=int(round(avg_attendance * 100)),
#             isPredicted=False
#         ))

#     if latest_per_student["Predictions"].notna().any():
#         avg_predicted = latest_per_student["Predictions"].astype(float).mean() * 100
#         trend.append(StudentTrend(
#             year="2025",
#             value=int(round(avg_predicted)),
#             isPredicted=True
#         ))

#     return {
#         "attendance2024": attendance_2024,
#         "predicted2025": predicted_2025,
#         "predictedAttendance": {
#             "year": "2025",
#             "attendanceRate": predicted_2025,
#             "total": total_days
#         },
#         "metrics": sorted(metrics, key=lambda x: x.year),
#         "trend": sorted(trend, key=lambda x: x.year)
#     }


# #---------------------------------------------------------------------------------------------------------------------------------------------------------
# #STUDENT DATA BY FILTERS

# @app.post("/StudentDetails/ByFilters")
# def get_student_summary(req: SchoolSummaryRequest):
#     subset = df.copy()

#     if req.districtName:
#         subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]
#     if req.schoolName:
#         subset = subset[subset["SCHOOL_NAME"].str.strip().str.lower() == req.schoolName.strip().lower()]
#     if req.studentId:
#         subset = subset[subset["STUDENT_ID"] == req.studentId]
#     if req.grade != -3:
#         subset = subset[subset["STUDENT_GRADE_LEVEL"] == req.grade]

#     if subset.empty:
#         return {"message": "No matching data found"}

#     # Sort and get latest row (usually 2024 or recent)
#     latest_row = subset.sort_values(by="SCHOOL_YEAR").iloc[-1]

#     # Get row for 2024 if exists
#     year_2024_row = subset[subset["SCHOOL_YEAR"] == 2024].iloc[-1] if not subset[subset["SCHOOL_YEAR"] == 2024].empty else None

#     if year_2024_row is not None:
#         present_days = float(year_2024_row["Total_Days_Present"])
#         enrolled_days = float(year_2024_row["Total_Days_Enrolled"])
#         attendance_2024 = round((present_days / enrolled_days) * 100, 1)
#         total_days = round(enrolled_days, 1)
#     else:
#         attendance_2024 = None
#         total_days = None

#     predicted_2025 = round(float(latest_row["Predictions"])*100, 1) if "Predictions" in latest_row else None

#     # Metrics
#     metrics = []
#     for year in range(2019, 2025):
#         row = subset[subset["SCHOOL_YEAR"] == year]
#         if row.empty:
#             continue

#         attendance_rate = int(round(row["Predictions"].values[0] * 100))
#         total = int(round(row["Total_Days_Enrolled"].values[0]))
#         unexcused = int(round(row["Total_Days_Unexcused_Absent"].values[0])) if row["Total_Days_Unexcused_Absent"].notna().any() else None

#         metrics.append(StudentMetrics(
#             year=str(year),
#             attendanceRate=attendance_rate,
#             absences=None,
#             unexcused=unexcused,
#             total=total
#         ))

#     # Trend
#     trend = []
#     for year in range(2019, 2025):
#         row = subset[subset["SCHOOL_YEAR"] == year]
#         if row.empty:
#             continue

#         avg_attendance = row["Predictions"].values[0]
#         trend.append(StudentTrend(
#             year=str(year),
#             value=int(round(avg_attendance * 100)),
#             isPredicted=False
#         ))

#     if not np.isnan(latest_row["Predictions"]):
#         trend.append(StudentTrend(
#             year="2025",
#             value=int(round(latest_row["Predictions"] * 100)),
#             isPredicted=True
#         ))

#     return {
#         "attendance2024": attendance_2024,
#         "predicted2025": predicted_2025,
#         "predictedAttendance": {
#             "year": "2025",
#             "attendanceRate": predicted_2025,
#             "total": total_days
#         },
#         "metrics": sorted(metrics, key=lambda x: x.year),
#         "trend": sorted(trend, key=lambda x: x.year)
#     }


# #---------------------------------------------------------------------------------------------------------------------------------------------------------
# # CORS Middleware to allow requests from the frontend

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:8080"],
#     allow_credentials=False,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# #---------------------------------------------------------------------------------------------------------------------------------------------------------
# # Run the app using: uvicorn backend.Prediction_Latest:app --reload


# #Backend code
# #-------------------------------------------------------------------------------------------------------------
# # IMPORTS
# from fastapi import FastAPI 
# from fastapi.middleware.cors import CORSMiddleware 
# from fastapi.responses import ORJSONResponse  
# from contextlib import asynccontextmanager
# import pandas as pd
# import numpy as np
# from pydantic import BaseModel
# from typing import List, Dict, Optional
# import re
# import threading

# df = None            
# cached_students = []  
# cached_aggregated_data = {}

# #---------------------------------------------------------------------------------------------------------------------------------------------------------------
# #CLASS MODELS
# class Student(BaseModel):
#     id: str
#     locationId: int
#     grade: str
#     schoolName: str
#     districtName: str

# class SchoolSummaryRequest(BaseModel):
#     districtName: Optional[str] = None
#     schoolName: Optional[str] = None
#     studentId: Optional[int] = None
#     grade: Optional[int] = -3

# class StudentMetrics(BaseModel):
#     year: str
#     attendanceRate: Optional[int]
#     unexcused: Optional[float]
#     total: Optional[int]

# class StudentTrend(BaseModel):
#     year: str
#     value: int
#     isPredicted: bool

# class AggregatedDistrictData(BaseModel):
#     attendance2024: float
#     predicted2025: float
#     predictedAttendance: Dict
#     metrics: List[StudentMetrics]
#     trend: List[StudentTrend]

# class StudentsResponse(BaseModel):
#     students: List[Student]
#     aggregatedData: AggregatedDistrictData

# # ---------------------------------------------------------------------------------------------------------------------------------------------------------------
# # ON STARTUP, LOAD DATA
# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     background_thread = threading.Thread(target=load_and_process_data)
#     background_thread.daemon = True
#     background_thread.start()
#     yield
# #---------------------------------------------------------------------------------------------------------------------------------------------------------------
# # Create FastAPI app with ORJSONResponse as default response class

# app = FastAPI(default_response_class=ORJSONResponse, lifespan=lifespan)



# def load_and_process_data():
#     global df, cached_students, cached_aggregated_data
#     df = pd.read_parquet("Data/students_agg.parquet")
#     cached_students = []  
    
#     # Process student data
#     for sid in df['STUDENT_ID'].unique():
#         row = df[df['STUDENT_ID'] == sid].iloc[-1]
#         sid = int(row["STUDENT_ID"])
#         # location_id = int(row.get("LOCATION_ID", -1))
#         g = row.get("STUDENT_GRADE_LEVEL", np.nan)

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
#             # "locationId": location_id,
#             "schoolName": school_name,
#             "districtName": district_name
#         })

#     cached_students.sort(key=lambda x: x["id"])
    
#     # Calculate and cache aggregated district data
    
#     return cached_students, df

# #---------------------------------------------------------------------------------------------------------------------------------------------------------
# # Endpoint to get all students with aggregated data
# @app.get("/students")
# def get_students():
#     print(f"Cached Students: {len(cached_students)}")
#     print(f"Aggregated Data Available: {bool(cached_aggregated_data)}")
    
#     return {
#         "students": cached_students[:10000],
#         "aggregatedData": cached_aggregated_data
#     }
# #---------------------------------------------------------------------------------------------------------------------------------------------------------
# #DISTRICT DATA BY FILTERS
# @app.post("/DistrictData/ByFilters")
# def get_district_summary(req: SchoolSummaryRequest):
#     subset = df.copy()
#     print("All Student IDs:", df['STUDENT_ID'].unique().tolist()[:10])

#     if req.districtName and not req.schoolName and not req.studentId and req.grade == -3:

#         subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]
        
#         if subset.empty:
#             return {"message": "No matching data found"}

#         latest_per_student = (
#             subset.sort_values(by=["STUDENT_ID", "SCHOOL_YEAR"])
#                   .groupby("STUDENT_ID")
#                   .tail(1)
#         )

#         year_2024_rows = subset[subset["SCHOOL_YEAR"] == 2024]

#         if year_2024_rows.empty:
#             return {"message": "No 2024 data found in this district."}

#         # Attendance 2024
#         present_days = year_2024_rows["Total_Days_Present"].astype(float)
#         enrolled_days = year_2024_rows["Total_Days_Enrolled"].astype(float)
#         attendance_2024 = round((present_days.sum() / enrolled_days.sum()) * 100, 1)

#         # Predicted attendance for 2025
#         predicted_2025 = round(latest_per_student["Predictions"].astype(float).mean() * 100, 1)
#         total_days = round(enrolled_days.mean(), 1)

#         # Metrics computation using real attendance data
#         metrics = []
#         for year in range(2019, 2025):
#             year_data = subset[subset["SCHOOL_YEAR"] == year]
#             if year_data.empty:
#                 continue

#             present_sum = year_data["Total_Days_Present"].astype(float).sum()
#             enrolled_sum = year_data["Total_Days_Enrolled"].astype(float).sum()
#             unexcused_mean = year_data["Total_Days_Unexcused_Absent"].astype(float).mean()

#             if enrolled_sum > 0:
#                 attendance_rate = round((present_sum / enrolled_sum) * 100)
#             else:
#                 attendance_rate = None

#             metrics.append(StudentMetrics(
#                 year=str(year),
#                 attendanceRate=attendance_rate,
#                 unexcused=int(round(unexcused_mean)) if pd.notna(unexcused_mean) else None,
#                 total=int(round(year_data["Total_Days_Enrolled"].astype(float).mean()))
#             ))

#         # Trend computation using real attendance percentages
#         trend = []
#         for year in range(2019, 2025):
#             year_data = subset[subset["SCHOOL_YEAR"] == year]
#             if year_data.empty:
#                 continue

#             present_sum = year_data["Total_Days_Present"].astype(float).sum()
#             enrolled_sum = year_data["Total_Days_Enrolled"].astype(float).sum()

#             if enrolled_sum > 0:
#                 avg_attendance = (present_sum / enrolled_sum) * 100
#                 trend.append(StudentTrend(
#                     year=str(year),
#                     value=int(round(avg_attendance)),
#                     isPredicted=False
#                 ))

#         if latest_per_student["Predictions"].notna().any():
#             avg_predicted = latest_per_student["Predictions"].astype(float).mean() * 100
#             trend.append(StudentTrend(
#                 year="2025",
#                 value=int(round(avg_predicted)),
#                 isPredicted=True
#             ))

#         return {
#             "attendance2024": attendance_2024,
#             "predicted2025": predicted_2025,
#             "predictedAttendance": {
#                 "year": "2025",
#                 "attendanceRate": predicted_2025,
#                 "total": total_days
#             },
#             "metrics": sorted(metrics, key=lambda x: x.year),
#             "trend": sorted(trend, key=lambda x: x.year)
#         }

#     return {"message": "Only district-level filter is supported in this version."}


# #---------------------------------------------------------------------------------------------------------------------------------------------------------
# #SCHOOL DATA BY FILTERS
# @app.post("/SchoolData/ByFilters")
# def get_school_summary(req: SchoolSummaryRequest):
#     subset = df.copy()

#     if req.districtName:
#         subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]
#     if req.schoolName:
#         subset = subset[subset["SCHOOL_NAME"].str.strip().str.lower() == req.schoolName.strip().lower()]

#     if subset.empty:
#         return {"message": "No matching data found"}

#     latest_per_student = (
#         subset.sort_values(by=["STUDENT_ID", "SCHOOL_YEAR"])
#               .groupby("STUDENT_ID")
#               .tail(1)
#     )

#     year_2024_rows = latest_per_student[latest_per_student["SCHOOL_YEAR"] == 2024]

#     if year_2024_rows.empty:
#         return {"message": "No 2024 data found in this school."}

#     present_days = year_2024_rows["Total_Days_Present"].astype(float)
#     enrolled_days = year_2024_rows["Total_Days_Enrolled"].astype(float)
#     attendance_2024 = round((present_days.sum() / enrolled_days.sum()) * 100, 1)

#     predicted_2025 = round(latest_per_student["Predictions"].astype(float).mean()*100, 1)
#     total_days = round(enrolled_days.mean(), 1)

#     # Metrics computation
#     metrics = []
#     for year in range(2019, 2025):
#         year_subset = subset[subset["SCHOOL_YEAR"] == year]
#         if year_subset.empty:
#             continue

#         present = year_subset["Total_Days_Present"].astype(float).sum()
#         enrolled = year_subset["Total_Days_Enrolled"].astype(float).sum()
#         attendance_rate = int(round((present / enrolled) * 100)) if enrolled > 0 else None

#         total = int(round(year_subset["Total_Days_Enrolled"].astype(float).mean()))
#         unexcused = (
#             int(round(year_subset["Total_Days_Unexcused_Absent"].astype(float).mean()))
#             if year_subset["Total_Days_Unexcused_Absent"].notna().any() else None
#         )

#         metrics.append(StudentMetrics(
#             year=str(year),
#             attendanceRate=attendance_rate,
#             unexcused=unexcused,
#             total=total
#         ))

# # Trend computation
#     trend = []
#     for year in range(2019, 2025):
#         year_subset = subset[subset["SCHOOL_YEAR"] == year]
#         if year_subset.empty:
#             continue

#         present = year_subset["Total_Days_Present"].astype(float).sum()
#         enrolled = year_subset["Total_Days_Enrolled"].astype(float).sum()
#         avg_attendance = (present / enrolled) if enrolled > 0 else None

#         if avg_attendance is not None:
#             trend.append(StudentTrend(
#                 year=str(year),
#                 value=int(round(avg_attendance * 100)),
#                 isPredicted=False
#             ))

#     return {
#         "attendance2024": attendance_2024,
#         "predicted2025": predicted_2025,
#         "predictedAttendance": {
#             "year": "2025",
#             "attendanceRate": predicted_2025,
#             "total": total_days
#         },
#         "metrics": sorted(metrics, key=lambda x: x.year),
#         "trend": sorted(trend, key=lambda x: x.year)
#     }
    


# #---------------------------------------------------------------------------------------------------------------------------------------------------------
# #GRADE DATA BY FILTERS
# @app.post("/GradeDetails/ByFilters")
# def get_grade_summary(req: SchoolSummaryRequest):
#     subset = df.copy()

#     if req.districtName:
#         subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]
#     if req.schoolName:
#         subset = subset[subset["SCHOOL_NAME"].str.strip().str.lower() == req.schoolName.strip().lower()]
#     if req.grade != -3:
#         subset = subset[subset["STUDENT_GRADE_LEVEL"] == req.grade]

#     if subset.empty:
#         return {"message": "No matching data found"}

#     latest_per_student = (
#         subset.sort_values(by=["STUDENT_ID", "SCHOOL_YEAR"])
#               .groupby("STUDENT_ID")
#               .tail(1)
#     )

#     year_2024_rows = latest_per_student[latest_per_student["SCHOOL_YEAR"] == 2024]

#     if year_2024_rows.empty:
#         return {"message": "No 2024 data found in this grade scope."}

#     present_days = year_2024_rows["Total_Days_Present"].astype(float)
#     enrolled_days = year_2024_rows["Total_Days_Enrolled"].astype(float)
#     attendance_2024 = round((present_days.sum() / enrolled_days.sum()) * 100, 1)

#     predicted_2025 = round(latest_per_student["Predictions"].astype(float).mean()*100, 1)
#     total_days = round(enrolled_days.mean(), 1)

#     # Metrics computation
#     metrics = []
#     for year in range(2019, 2025):
#         year_subset = subset[subset["SCHOOL_YEAR"] == year]
#         if year_subset.empty:
#             continue

#         present = year_subset["Total_Days_Present"].astype(float).sum()
#         enrolled = year_subset["Total_Days_Enrolled"].astype(float).sum()
#         attendance_rate = int(round((present / enrolled) * 100)) if enrolled > 0 else None

#         total = int(round(year_subset["Total_Days_Enrolled"].astype(float).mean()))
#         unexcused = (
#             int(round(year_subset["Total_Days_Unexcused_Absent"].astype(float).mean()))
#             if year_subset["Total_Days_Unexcused_Absent"].notna().any() else None
#         )

#         metrics.append(StudentMetrics(
#             year=str(year),
#             attendanceRate=attendance_rate,
#             unexcused=unexcused,
#             total=total
#         ))

# # Trend computation
#     trend = []
#     for year in range(2019, 2025):
#         year_subset = subset[subset["SCHOOL_YEAR"] == year]
#         if year_subset.empty:
#             continue

#         present = year_subset["Total_Days_Present"].astype(float).sum()
#         enrolled = year_subset["Total_Days_Enrolled"].astype(float).sum()
#         avg_attendance = (present / enrolled) if enrolled > 0 else None

#         if avg_attendance is not None:
#             trend.append(StudentTrend(
#                 year=str(year),
#                 value=int(round(avg_attendance * 100)),
#                 isPredicted=False
#             ))


#     if latest_per_student["Predictions"].notna().any():
#         avg_predicted = latest_per_student["Predictions"].astype(float).mean() * 100
#         trend.append(StudentTrend(
#             year="2025",
#             value=int(round(avg_predicted)),
#             isPredicted=True
#         ))

#     return {
#         "attendance2024": attendance_2024,
#         "predicted2025": predicted_2025,
#         "predictedAttendance": {
#             "year": "2025",
#             "attendanceRate": predicted_2025,
#             "total": total_days
#         },
#         "metrics": sorted(metrics, key=lambda x: x.year),
#         "trend": sorted(trend, key=lambda x: x.year)
#     }


# #---------------------------------------------------------------------------------------------------------------------------------------------------------
# #STUDENT DATA BY FILTERS

# @app.post("/StudentDetails/ByFilters")
# def get_student_summary(req: SchoolSummaryRequest):
#     subset = df.copy()

#     if req.districtName:
#         subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]
#     if req.schoolName:
#         subset = subset[subset["SCHOOL_NAME"].str.strip().str.lower() == req.schoolName.strip().lower()]
#     if req.studentId:
#         subset = subset[subset["STUDENT_ID"] == req.studentId]
#     if req.grade != -3:
#         subset = subset[subset["STUDENT_GRADE_LEVEL"] == req.grade]

#     if subset.empty:
#         return {"message": "No matching data found"}

#     # Sort and get latest row (usually 2024 or recent)
#     latest_row = subset.sort_values(by="SCHOOL_YEAR").iloc[-1]

#     # Get row for 2024 if exists
#     year_2024_row = subset[subset["SCHOOL_YEAR"] == 2024].iloc[-1] if not subset[subset["SCHOOL_YEAR"] == 2024].empty else None

#     if year_2024_row is not None:
#         present_days = float(year_2024_row["Total_Days_Present"])
#         enrolled_days = float(year_2024_row["Total_Days_Enrolled"])
#         attendance_2024 = round((present_days / enrolled_days) * 100, 1)
#         total_days = round(enrolled_days, 1)
#     else:
#         attendance_2024 = None
#         total_days = None

#     predicted_2025 = round(float(latest_row["Predictions"])*100, 1) if "Predictions" in latest_row else None

#     # Metrics
#     metrics = []
#     for year in range(2019, 2025):
#         row = subset[subset["SCHOOL_YEAR"] == year]
#         if row.empty:
#             continue

#         present = row["Total_Days_Present"].values[0]
#         enrolled = row["Total_Days_Enrolled"].values[0]

#         if pd.notna(present) and pd.notna(enrolled) and enrolled > 0:
#             attendance_rate = int(round((present / enrolled) * 100))
#         else:
#             attendance_rate = None
 
#         total = int(round(row["Total_Days_Enrolled"].values[0]))
#         unexcused = int(round(row["Total_Days_Unexcused_Absent"].values[0])) if row["Total_Days_Unexcused_Absent"].notna().any() else None

#         metrics.append(StudentMetrics(
#             year=str(year),
#             attendanceRate=attendance_rate,
#             unexcused=unexcused,
#             total=total
#         ))

#     # Trend
#     trend = []
#     for year in range(2019, 2025):
#         row = subset[subset["SCHOOL_YEAR"] == year]
#         if row.empty:
#             continue

#         present = row["Total_Days_Present"].values[0]
#         enrolled = row["Total_Days_Enrolled"].values[0]

#         if pd.notna(present) and pd.notna(enrolled) and enrolled > 0:
#             avg_attendance = (present / enrolled) 
#         trend.append(StudentTrend(
#             year=str(year),
#             value=int(round(avg_attendance * 100)),
#             isPredicted=False
#         ))

#     if not np.isnan(latest_row["Predictions"]):
#         trend.append(StudentTrend(
#             year="2025",
#             value=int(round(latest_row["Predictions"] * 100)),
#             isPredicted=True
#         ))

#     return {
#         "attendance2024": attendance_2024,
#         "predicted2025": predicted_2025,
#         "predictedAttendance": {
#             "year": "2025",
#             "attendanceRate": predicted_2025,
#             "total": total_days
#         },
#         "metrics": sorted(metrics, key=lambda x: x.year),
#         "trend": sorted(trend, key=lambda x: x.year)
#     }

# #---------------------------------------------------------------------------------------------------------------------------------------------------------
# # CORS Middleware to allow requests from the frontend

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:8080"],
#     allow_credentials=False,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# #---------------------------------------------------------------------------------------------------------------------------------------------------------
# # Run the app using: uvicorn backend.Prediction_Latest:app --reload



##aggregate code
#Backend code
#-------------------------------------------------------------------------------------------------------------
#IMPORTS
from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware 
from fastapi.responses import ORJSONResponse  
from contextlib import asynccontextmanager
import pandas as pd
import numpy as np
from pydantic import BaseModel
from typing import List, Dict, Optional
import re
import threading

df = None            
cached_students = []  
cached_aggregated_data = {}

#---------------------------------------------------------------------------------------------------------------------------------------------------------------
#CLASS MODELS
class Student(BaseModel):
    id: str
    locationId: int
    grade: str
    schoolName: str
    districtName: str
    districtId : str

class SchoolSummaryRequest(BaseModel):
    districtName: Optional[str] = None
    schoolName: Optional[str] = None
    studentId: Optional[int] = None
    grade: Optional[int] = -3

class StudentMetrics(BaseModel):
    year: str
    attendanceRate: Optional[int]
    unexcused: Optional[float]
    present: Optional[float]
    total: Optional[int]

class StudentTrend(BaseModel):
    year: str
    value: int
    isPredicted: bool

class StudentsResponse(BaseModel):
    students: List[Student]

# ---------------------------------------------------------------------------------------------------------------------------------------------------------------
# ON STARTUP, LOAD DATA
@asynccontextmanager
async def lifespan(app: FastAPI):
    background_thread = threading.Thread(target=load_and_process_data)
    background_thread.daemon = True
    background_thread.start()
    yield
#---------------------------------------------------------------------------------------------------------------------------------------------------------------
# Create FastAPI app with ORJSONResponse as default response class

app = FastAPI(default_response_class=ORJSONResponse, lifespan=lifespan)

def load_and_process_data():
    global df, cached_students, cached_aggregated_data
    df = pd.read_parquet("Data/students_agg.parquet")
    cached_students = []  
    
    # Process student data
    for sid in df['STUDENT_ID'].unique():
        row = df[df['STUDENT_ID'] == sid].iloc[-1]
        sid = int(row["STUDENT_ID"])
        # location_id = int(row.get("LOCATION_ID", -1))
        g = row.get("STUDENT_GRADE_LEVEL", np.nan)

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
        location_id = int(row.get("LOCATION_ID", -1)) if "LOCATION_ID" in row else -1
        district_id = int(row.get("DISTRICT_CODE",-1)) if "DISTRICT_CODE" in row else -1


        cached_students.append({
            "id": str(sid),
            "grade": grade_str,
            "districtId": district_id,
            "districtName": district_name,
            "locationId": location_id,
            "schoolName": school_name,
        })

    cached_students.sort(key=lambda x: x["id"])
    
    # Calculate and cache aggregated district data
    
    return cached_students, df

#---------------------------------------------------------------------------------------------------------------------------------------------------------
# Endpoint to get all students with aggregated data
@app.get("/students")
def get_students():
    print(f"Cached Students: {len(cached_students)}")
    print(f"Aggregated Data Available: {bool(cached_aggregated_data)}")
    
    return {
        "students": cached_students[:100000]
    }

#---------------------------------------------------------------------------------------------------------------------------------------------------------------
#all district aggregate Endpoint
@app.get("/AllDistrictsData")
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

        metrics.append(StudentMetrics(
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
            trend.append(StudentTrend(
                year=str(year),
                value=int(round(avg_attendance)),
                isPredicted=False
            ))

    # Add prediction for 2025 using average of district aggregates
    if not all_district_predictions.empty:
        trend.append(StudentTrend(
            year="2025",
            value=int(round(all_district_predictions.mean() * 100)),
            isPredicted=True
        ))

    return {
        "attendance2024": attendance_2024,
        "predicted2025": predicted_2025,
        "predictedAttendance": {
            "year": "2025",
            "attendanceRate": predicted_2025,
            "total": total_days
        },
        "metrics": sorted(metrics, key=lambda x: x.year),
        "trend": sorted(trend, key=lambda x: x.year)
    }
#---------------------------------------------------------------------------------------------------------------------------------------------------------
#DISTRICT DATA BY FILTERS
@app.post("/DistrictData/ByFilters")
def get_district_summary(req: SchoolSummaryRequest):
    subset = df.copy()
    print("All Student IDs:", df['STUDENT_ID'].unique().tolist()[:10])

    if req.districtName and not req.schoolName and not req.studentId and req.grade == -3:

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

            metrics.append(StudentMetrics(
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
                trend.append(StudentTrend(
                    year=str(year),
                    value=int(round(avg_attendance)),
                    isPredicted=False
                ))

        # CHANGED: Use District_aggregate for trend prediction
        if pd.notna(district_aggregate):
            trend.append(StudentTrend(
                year="2025",
                value=int(round(float(district_aggregate) * 100)),
                isPredicted=True
            ))

        return {
            "attendance2024": attendance_2024,
            "predicted2025": predicted_2025,
            "predictedAttendance": {
                "year": "2025",
                "attendanceRate": predicted_2025,
                "total": total_days
            },
            "metrics": sorted(metrics, key=lambda x: x.year),
            "trend": sorted(trend, key=lambda x: x.year)
        }

    return {"message": "Only district-level filter is supported in this version."}


#---------------------------------------------------------------------------------------------------------------------------------------------------------
#SCHOOL DATA BY FILTERS
@app.post("/SchoolData/ByFilters")
def get_school_summary(req: SchoolSummaryRequest):
    subset = df.copy()

    if req.districtName:
        subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]
    if req.schoolName:
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

        metrics.append(StudentMetrics(
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
            trend.append(StudentTrend(
                year=str(year),
                value=int(round(avg_attendance * 100)),
                isPredicted=False
            ))

    # CHANGED: Use School_aggregate for trend prediction
    if pd.notna(school_aggregate):
        trend.append(StudentTrend(
            year="2025",
            value=int(round(float(school_aggregate) * 100)),
            isPredicted=True
        ))

    return {
        "attendance2024": attendance_2024,
        "predicted2025": predicted_2025,
        "predictedAttendance": {
            "year": "2025",
            "attendanceRate": predicted_2025,
            "total": total_days
        },
        "metrics": sorted(metrics, key=lambda x: x.year),
        "trend": sorted(trend, key=lambda x: x.year)
    }
    


#---------------------------------------------------------------------------------------------------------------------------------------------------------
#GRADE DATA BY FILTERS
@app.post("/GradeDetails/ByFilters")
def get_grade_summary(req: SchoolSummaryRequest):
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

        metrics.append(StudentMetrics(
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
            trend.append(StudentTrend(
                year=str(year),
                value=int(round(avg_attendance * 100)),
                isPredicted=False
            ))

    # CHANGED: Use Grade_aggregate for trend prediction
    if pd.notna(grade_aggregate):
        trend.append(StudentTrend(
            year="2025",
            value=int(round(float(grade_aggregate) * 100)),
            isPredicted=True
        ))

    return {
        "attendance2024": attendance_2024,
        "predicted2025": predicted_2025,
        "predictedAttendance": {
            "year": "2025",
            "attendanceRate": predicted_2025,
            "total": total_days
        },
        "metrics": sorted(metrics, key=lambda x: x.year),
        "trend": sorted(trend, key=lambda x: x.year)
    }


#---------------------------------------------------------------------------------------------------------------------------------------------------------
#STUDENT DATA BY FILTERS

@app.post("/StudentDetails/ByFilters")
def get_student_summary(req: SchoolSummaryRequest):
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

    # Sort and get latest row (usually 2024 or recent)
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

    # CHANGED: For individual students, use District_aggregate of their district
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

        metrics.append(StudentMetrics(
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
            trend.append(StudentTrend(
                year=str(year),
                value=int(round(avg_attendance * 100)),
                isPredicted=False
            ))

    # CHANGED: Use District_aggregate for student's trend prediction
    if district_aggregate is not None:
        trend.append(StudentTrend(
            year="2025",
            value=int(round(float(district_aggregate) * 100)),
            isPredicted=True
        ))
    elif not np.isnan(latest_row["Predictions"]):
        trend.append(StudentTrend(
            year="2025",
            value=int(round(latest_row["Predictions"] * 100)),
            isPredicted=True
        ))

    return {
        "attendance2024": attendance_2024,
        "predicted2025": predicted_2025,
        "predictedAttendance": {
            "year": "2025",
            "attendanceRate": predicted_2025,
            "total": total_days
        },
        "metrics": sorted(metrics, key=lambda x: x.year),
        "trend": sorted(trend, key=lambda x: x.year)
    }

#---------------------------------------------------------------------------------------------------------------------------------------------------------
# CORS Middleware to allow requests from the frontend

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

#---------------------------------------------------------------------------------------------------------------------------------------------------------
# Run the app using: uvicorn backend.Prediction_Latest:app --reload

# from fastapi import FastAPI 
# from fastapi.middleware.cors import CORSMiddleware 
# from fastapi.responses import ORJSONResponse  
# from contextlib import asynccontextmanager
# import pandas as pd
# import numpy as np
# from pydantic import BaseModel
# from typing import List, Dict, Optional, Tuple
# import re
# import threading
# from enum import Enum

# # Global variables
# df = None            
# cached_students = []  
# cached_aggregated_data = {}

# #---------------------------------------------------------------------------------------------------------------------------------------------------------------
# # ENUMS AND CONSTANTS

# class AnalysisLevel(Enum):
#     ALL_DISTRICTS = "all_districts"
#     DISTRICT = "district" 
#     SCHOOL = "school"
#     GRADE = "grade"
#     STUDENT = "student"

# YEAR_RANGE = range(2019, 2025)
# CURRENT_YEAR = 2024
# PREDICTION_YEAR = 2025

# #---------------------------------------------------------------------------------------------------------------------------------------------------------------
# # CLASS MODELS

# class Student(BaseModel):
#     id: str
#     locationId: int
#     grade: str
#     schoolName: str
#     districtName: str

# class SchoolSummaryRequest(BaseModel):
#     districtName: Optional[str] = None
#     schoolName: Optional[str] = None
#     studentId: Optional[int] = None
#     grade: Optional[int] = -3

# class StudentMetrics(BaseModel):
#     year: str
#     attendanceRate: Optional[int]
#     unexcused: Optional[float]
#     present: Optional[float]
#     total: Optional[int]

# class StudentTrend(BaseModel):
#     year: str
#     value: int
#     isPredicted: bool

# class AggregatedDistrictData(BaseModel):
#     attendance2024: float
#     predicted2025: float
#     predictedAttendance: Dict
#     metrics: List[StudentMetrics]
#     trend: List[StudentTrend]

# class StudentsResponse(BaseModel):
#     students: List[Student]
#     aggregatedData: AggregatedDistrictData

# #---------------------------------------------------------------------------------------------------------------------------------------------------------------
# # UTILITY FUNCTIONS

# def get_grade_string(grade_num) -> str:
#     """Convert numeric grade to readable string format"""
#     if pd.isna(grade_num):
#         return "Unknown Grade"
    
#     grade = int(grade_num)
#     if grade == -1:
#         return 'Pre-Kindergarten'
#     elif grade == 0:
#         return "Kindergarten"
#     elif grade == 1:
#         return "1st Grade"
#     elif grade == 2:
#         return "2nd Grade"
#     elif grade == 3:
#         return "3rd Grade"
#     elif grade >= 11:
#         return f"{grade}th Grade"
#     else:
#         suffix = {1: "st", 2: "nd", 3: "rd"}.get(grade % 10, "th")
#         return f"{grade}{suffix} Grade"

# def safe_round(value, decimals=1):
#     """Safely round a value, handling NaN cases"""
#     return round(float(value), decimals) if pd.notna(value) else None

# def safe_int_round(value):
#     """Safely round to integer, handling NaN cases"""
#     return int(round(float(value))) if pd.notna(value) else None

# #---------------------------------------------------------------------------------------------------------------------------------------------------------------
# # DATA FILTERING FUNCTIONS

# def apply_filters(df: pd.DataFrame, req: SchoolSummaryRequest) -> pd.DataFrame:
#     """Apply filters to dataframe based on request parameters"""
#     subset = df.copy()
    
#     if req.districtName:
#         subset = subset[subset["DISTRICT_NAME"].str.strip().str.lower() == req.districtName.strip().lower()]
    
#     if req.schoolName:
#         subset = subset[subset["SCHOOL_NAME"].str.strip().str.lower() == req.schoolName.strip().lower()]
    
#     if req.studentId:
#         subset = subset[subset["STUDENT_ID"] == req.studentId]
    
#     if req.grade != -3:
#         subset = subset[subset["STUDENT_GRADE_LEVEL"] == req.grade]
    
#     return subset

# def get_latest_per_student(df: pd.DataFrame) -> pd.DataFrame:
#     """Get latest record per student"""
#     return (df.sort_values(by=["STUDENT_ID", "SCHOOL_YEAR"])
#              .groupby("STUDENT_ID")
#              .tail(1))

# def validate_data(subset: pd.DataFrame, year_data: pd.DataFrame, context: str) -> Optional[str]:
#     """Validate data and return error message if invalid"""
#     if subset.empty:
#         return "No matching data found"
    
#     if year_data.empty:
#         return f"No {CURRENT_YEAR} data found in this {context}."
    
#     return None

# #---------------------------------------------------------------------------------------------------------------------------------------------------------------
# # CALCULATION FUNCTIONS

# def calculate_attendance_rate(present_days: pd.Series, enrolled_days: pd.Series) -> float:
#     """Calculate attendance rate from present and enrolled days"""
#     present_sum = present_days.astype(float).sum()
#     enrolled_sum = enrolled_days.astype(float).sum()
#     return round((present_sum / enrolled_sum) * 100, 1) if enrolled_sum > 0 else 0

# def get_aggregate_column(level: AnalysisLevel) -> str:
#     """Get the appropriate aggregate column based on analysis level"""
#     aggregate_mapping = {
#         AnalysisLevel.ALL_DISTRICTS: "District_aggregate",
#         AnalysisLevel.DISTRICT: "District_aggregate", 
#         AnalysisLevel.SCHOOL: "School_aggregate",
#         AnalysisLevel.GRADE: "Grade_aggregate",
#         AnalysisLevel.STUDENT: "District_aggregate"  # Students use district aggregate
#     }
#     return aggregate_mapping[level]

# def calculate_prediction(latest_data: pd.DataFrame, level: AnalysisLevel) -> float:
#     """Calculate 2025 prediction based on analysis level"""
#     aggregate_col = get_aggregate_column(level)
    
#     if level == AnalysisLevel.ALL_DISTRICTS:
#         # For all districts, use mean of all district aggregates
#         all_predictions = latest_data[aggregate_col].dropna()
#         if not all_predictions.empty:
#             return round(all_predictions.mean() * 100, 1)
#         # Fallback to individual predictions
#         return round(latest_data["Predictions"].astype(float).mean() * 100, 1)
#     else:
#         # For specific contexts, use the aggregate value
#         aggregate_value = latest_data[aggregate_col].iloc[0]
#         if pd.notna(aggregate_value):
#             return round(float(aggregate_value) * 100, 1)
#         # Fallback to individual predictions mean
#         return round(latest_data["Predictions"].astype(float).mean() * 100, 1)

# def generate_metrics(subset: pd.DataFrame, level: AnalysisLevel) -> List[StudentMetrics]:
#     """Generate metrics for all years based on analysis level"""
#     metrics = []
    
#     for year in YEAR_RANGE:
#         year_data = subset[subset["SCHOOL_YEAR"] == year]
#         if year_data.empty:
#             continue

#         # Calculate attendance rate
#         present_sum = year_data["Total_Days_Present"].astype(float).sum()
#         enrolled_sum = year_data["Total_Days_Enrolled"].astype(float).sum()
#         attendance_rate = safe_int_round((present_sum / enrolled_sum) * 100) if enrolled_sum > 0 else None
        
#         # Calculate other metrics
#         if level == AnalysisLevel.STUDENT:
#             # For individual students, use actual values not means
#             unexcused = safe_int_round(year_data["Total_Days_Unexcused_Absent"].values[0]) if year_data["Total_Days_Unexcused_Absent"].notna().any() else None
#             present = safe_int_round(year_data["Total_Days_Present"].values[0])
#             total = safe_int_round(year_data["Total_Days_Enrolled"].values[0])
#         else:
#             # For aggregated levels, use means
#             unexcused = safe_int_round(year_data["Total_Days_Unexcused_Absent"].astype(float).mean()) if year_data["Total_Days_Unexcused_Absent"].notna().any() else None
#             present = safe_int_round(year_data["Total_Days_Present"].astype(float).mean())
#             total = safe_int_round(year_data["Total_Days_Enrolled"].astype(float).mean())

#         metrics.append(StudentMetrics(
#             year=str(year),
#             attendanceRate=attendance_rate,
#             unexcused=unexcused,
#             present=present,
#             total=total
#         ))
    
#     return metrics

# def generate_trend(subset: pd.DataFrame, latest_data: pd.DataFrame, level: AnalysisLevel) -> List[StudentTrend]:
#     """Generate trend data for all years plus prediction"""
#     trend = []
    
#     # Historical trends
#     for year in YEAR_RANGE:
#         year_data = subset[subset["SCHOOL_YEAR"] == year]
#         if year_data.empty:
#             continue

#         present_sum = year_data["Total_Days_Present"].astype(float).sum()
#         enrolled_sum = year_data["Total_Days_Enrolled"].astype(float).sum()

#         if enrolled_sum > 0:
#             avg_attendance = (present_sum / enrolled_sum) * 100
#             trend.append(StudentTrend(
#                 year=str(year),
#                 value=int(round(avg_attendance)),
#                 isPredicted=False
#             ))

#     # Add prediction
#     aggregate_col = get_aggregate_column(level)
    
#     if level == AnalysisLevel.ALL_DISTRICTS:
#         all_predictions = latest_data[aggregate_col].dropna()
#         if not all_predictions.empty:
#             prediction_value = int(round(all_predictions.mean() * 100))
#         else:
#             prediction_value = int(round(latest_data["Predictions"].astype(float).mean() * 100))
#     else:
#         aggregate_value = latest_data[aggregate_col].iloc[0] if not latest_data.empty else None
#         if pd.notna(aggregate_value):
#             prediction_value = int(round(float(aggregate_value) * 100))
#         else:
#             # Fallback for student level
#             if level == AnalysisLevel.STUDENT and "Predictions" in latest_data.columns:
#                 prediction_value = int(round(latest_data["Predictions"].iloc[0] * 100))
#             else:
#                 prediction_value = int(round(latest_data["Predictions"].astype(float).mean() * 100))
    
#     trend.append(StudentTrend(
#         year=str(PREDICTION_YEAR),
#         value=prediction_value,
#         isPredicted=True
#     ))
    
#     return trend

# def build_response(subset: pd.DataFrame, latest_data: pd.DataFrame, level: AnalysisLevel, context: str = "scope") -> dict:
#     """Build standardized response for all endpoints"""
#     # Get 2024 data
#     if level == AnalysisLevel.STUDENT:
#         year_2024_data = subset[subset["SCHOOL_YEAR"] == CURRENT_YEAR]
#     else:
#         year_2024_data = latest_data[latest_data["SCHOOL_YEAR"] == CURRENT_YEAR]
    
#     # Validate data
#     error_msg = validate_data(subset, year_2024_data, context)
#     if error_msg:
#         return {"message": error_msg}
    
#     # Calculate 2024 attendance
#     present_days = year_2024_data["Total_Days_Present"].astype(float)
#     enrolled_days = year_2024_data["Total_Days_Enrolled"].astype(float)
#     attendance_2024 = calculate_attendance_rate(present_days, enrolled_days)
    
#     # Calculate prediction
#     predicted_2025 = calculate_prediction(latest_data, level)
    
#     # Calculate average total days
#     total_days = safe_round(enrolled_days.mean())
    
#     # Generate metrics and trends
#     metrics = generate_metrics(subset, level)
#     trend = generate_trend(subset, latest_data, level)
    
#     return {
#         "attendance2024": attendance_2024,
#         "predicted2025": predicted_2025,
#         "predictedAttendance": {
#             "year": str(PREDICTION_YEAR),
#             "attendanceRate": predicted_2025,
#             "total": total_days
#         },
#         "metrics": sorted(metrics, key=lambda x: x.year),
#         "trend": sorted(trend, key=lambda x: x.year)
#     }

# #---------------------------------------------------------------------------------------------------------------------------------------------------------------
# # DATA LOADING AND PROCESSING

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     background_thread = threading.Thread(target=load_and_process_data)
#     background_thread.daemon = True
#     background_thread.start()
#     yield

# def load_and_process_data():
#     global df, cached_students, cached_aggregated_data
#     df = pd.read_parquet("Data/students_agg.parquet")
#     cached_students = []  
    
#     # Process student data
#     for sid in df['STUDENT_ID'].unique():
#         row = df[df['STUDENT_ID'] == sid].iloc[-1]
#         sid = int(row["STUDENT_ID"])
#         grade = row.get("STUDENT_GRADE_LEVEL", np.nan)
#         grade_str = get_grade_string(grade)
#         school_name = row.get("SCHOOL_NAME", "Unknown School")
#         district_name = row.get("DISTRICT_NAME", "Unknown District")

#         cached_students.append({
#             "id": str(sid),
#             "grade": grade_str,
#             "schoolName": school_name,
#             "districtName": district_name
#         })

#     cached_students.sort(key=lambda x: x["id"])
#     return cached_students, df

# #---------------------------------------------------------------------------------------------------------------------------------------------------------------
# # FASTAPI APP SETUP

# app = FastAPI(default_response_class=ORJSONResponse, lifespan=lifespan)

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:8080"],
#     allow_credentials=False,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# #---------------------------------------------------------------------------------------------------------------------------------------------------------------
# # API ENDPOINTS

# @app.get("/students")
# def get_students():
#     print(f"Cached Students: {len(cached_students)}")
#     print(f"Aggregated Data Available: {bool(cached_aggregated_data)}")
    
#     return {
#         "students": cached_students[:100000],
#         "aggregatedData": cached_aggregated_data
#     }

# @app.get("/AllDistrictsData")
# def get_all_districts_summary():
#     """Get aggregated data across all districts"""
#     global df
    
#     if df is None or df.empty:
#         return {"message": "No data available"}
    
#     subset = df.copy()
#     latest_per_student = get_latest_per_student(subset)
    
#     return build_response(subset, latest_per_student, AnalysisLevel.ALL_DISTRICTS, "all districts")

# @app.post("/DistrictData/ByFilters")
# def get_district_summary(req: SchoolSummaryRequest):
#     global df
    
#     # Only support district-level filtering for this endpoint
#     if not req.districtName or req.schoolName or req.studentId or req.grade != -3:
#         return {"message": "Only district-level filter is supported in this version."}
    
#     subset = apply_filters(df, req)
#     latest_per_student = get_latest_per_student(subset)
    
#     return build_response(subset, latest_per_student, AnalysisLevel.DISTRICT, "district")

# @app.post("/SchoolData/ByFilters")
# def get_school_summary(req: SchoolSummaryRequest):
#     global df
    
#     subset = apply_filters(df, req)
#     latest_per_student = get_latest_per_student(subset)
    
#     return build_response(subset, latest_per_student, AnalysisLevel.SCHOOL, "school")

# @app.post("/GradeDetails/ByFilters")
# def get_grade_summary(req: SchoolSummaryRequest):
#     global df
    
#     subset = apply_filters(df, req)
#     latest_per_student = get_latest_per_student(subset)
    
#     return build_response(subset, latest_per_student, AnalysisLevel.GRADE, "grade scope")

# @app.post("/StudentDetails/ByFilters")
# def get_student_summary(req: SchoolSummaryRequest):
#     global df
    
#     subset = apply_filters(df, req)
#     # For student level, we work with the full subset, not just latest per student
#     latest_row = subset.sort_values(by="SCHOOL_YEAR").iloc[-1:] if not subset.empty else pd.DataFrame()
    
#     return build_response(subset, latest_row, AnalysisLevel.STUDENT, "student scope")