from pydantic import BaseModel
from typing import List, Optional


class Student(BaseModel):
    id: str
    locationId: int
    grade: str
    schoolName: str
    districtName: str
    districtId: int
 
class District(BaseModel):
    id: int
    name: str
 
class School(BaseModel):
    id: int
    name: str
    districtId: int
 
class StudentsResponse(BaseModel):
    districts: List[District]
    schools: List[School]
    students: List[Student]
 
class DataRequest(BaseModel):
    studentId: Optional[int] = None
    grade: Optional[int] = -3
    districtId: Optional[int] = None
    locationID: Optional[int] = None
 
class StudentMetrics(BaseModel):
    year: str
    attendanceRate: Optional[float]
    unexcused: Optional[float]
    present: Optional[float]
    total: Optional[int]
 
class StudentTrend(BaseModel):
    year: str
    value: float
    isPredicted: bool

class AttendanceValues(BaseModel):
    year: str
    predictedAttendance: float
    totalDays: float | None

class DataResponse(BaseModel):
    previousAttendance: float | None
    predictedAttendance: float
    predictedValues: AttendanceValues
    metrics: List[StudentMetrics]
    trends: List[StudentTrend]
 