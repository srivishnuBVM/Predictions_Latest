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
 
class SchoolSummaryRequest(BaseModel):
    districtName: Optional[str] = None
    schoolName: Optional[str] = None
    studentId: Optional[int] = None
    grade: Optional[int] = -3
    districtId: Optional[int] = None
    locationID: Optional[int] = None
 
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

class AttendanceValues(BaseModel):
    year: str
    preictedAttendance: float
    totalDays: float

class DataResponse(BaseModel):
    previousAttendance: float
    predictedAttendance: float
    predictedValues: AttendanceValues
    metrics: List[StudentMetrics]
    trends: List[StudentTrend]
 