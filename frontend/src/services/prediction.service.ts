import axiosInstance from "@/lib/axios";
import { Student } from "@/types";

/* ---------- request & response shapes ---------- */

export interface FilterRequest {
  districtId?: number;
  locationID?: number; // <-- must match FastAPI’s field
  studentId?: number;
  grade?: number;
}

export interface AttendanceResponse {
  previousAttendance?: number;
  predictedAttendance?: number;
  predictedValues?: {
    year: string;
    predictedAttendance: number;
    totalDays: number;
  };
  metrics?: any[];
  trends?: any[];
  message?: string;
}

export interface InitialDataResponse {
  districts: { id: number; name: string }[];
  schools: { id: number; name: string; districtId: number }[];
  students: Student[];
}

/* ---------- service implementation ---------- */

class AttendanceService {
  async getInitialData(): Promise<InitialDataResponse> {
    const res = await axiosInstance.get("/students");
    return {
      districts: res.data.districts ?? [],
      schools: res.data.schools ?? [],
      students: res.data.students ?? [],
    };
  }

  async getAllDistrictsData(): Promise<AttendanceResponse> {
    const res = await axiosInstance.get("/AllDistrictsData");
    return res.data;
  }

  async getDistrictData(body: FilterRequest): Promise<AttendanceResponse> {
    const res = await axiosInstance.post("/DistrictData", body);
    return res.data;
  }

  async getSchoolData(body: FilterRequest): Promise<AttendanceResponse> {
    const res = await axiosInstance.post("/SchoolData", body);
    return res.data;
  }

  async getGradeData(body: FilterRequest): Promise<AttendanceResponse> {
    const res = await axiosInstance.post("/GradeDetails", body);
    return res.data;
  }

  async getStudentData(body: FilterRequest): Promise<AttendanceResponse> {
    const res = await axiosInstance.post("/StudentDetails", body);
    return res.data;
  }
}

const attendanceService = new AttendanceService();
export default attendanceService;
