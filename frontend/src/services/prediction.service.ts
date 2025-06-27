// import axiosInstance from "@/lib/axios";
// import { Student, AttendanceData, RiskCategory } from "@/types";

// class PredictionService {
//   async getStudents(): Promise<Student[]> {
//     const res = await axiosInstance.get("/students");
//     return res.data;
//   }

//   async getStudentDetails(studentId: string): Promise<{
//     risk: RiskCategory;
//     predictedAttendance: AttendanceData;
//     probability2025: number;
//   }> {
//     const res = await axiosInstance.get(`/StudentDetails/StudentID/${studentId}`);
//     return res.data;
//   }

//   async getStudentMetrics(studentId: string): Promise<AttendanceData[]> {
//     const res = await axiosInstance.get(`/StudentMetrics/StudentID/${studentId}`);
//     return res.data;
//   }

//   async getStudentTrend(studentId: string): Promise<any[]> {
//     const res = await axiosInstance.get(`/StudentTrend/StudentID/${studentId}`);
//     return res.data;
//   }
// }

// // Export an instance of the service
// const predictionService = new PredictionService();
// export default predictionService;


import axiosInstance from "@/lib/axios";
import { Student } from "@/types";

// Types for API requests and responses
interface FilterRequest {
  districtId?: number;
  schoolId?: number;
  studentId?: number;
  grade?: number;
}

interface AttendanceResponse {
  attendance2024?: number;
  predicted2025?: number;
  metrics?: any[];
  trend?: any[];
  predictedAttendance?: any;
  message?: string;
}

interface InitialDataResponse {
  districts: { id: number; name: string }[];
  schools: { id: number; name: string; districtId: number }[];
  students: Student[];
}

class AttendanceService {
  /**
   * Get initial data including districts, schools, and students
   */
  async getInitialData(): Promise<InitialDataResponse> {
    const response = await axiosInstance.get("/students");
    return {
      districts: response.data.districts ?? [],
      schools: response.data.schools ?? [],
      students: response.data.students ?? []
    };
  }

  /**
   * Get attendance data for all districts combined
   */
  async getAllDistrictsData(): Promise<AttendanceResponse> {
    const response = await axiosInstance.get("/AllDistrictsData");
    return response.data;
  }

  /**
   * Get attendance data filtered by district
   */
  async getDistrictData(filters: FilterRequest): Promise<AttendanceResponse> {
    const response = await axiosInstance.post("/DistrictData/ByFilters", filters);
    return response.data;
  }

  /**
   * Get attendance data filtered by school
   */
  async getSchoolData(filters: FilterRequest): Promise<AttendanceResponse> {
    const response = await axiosInstance.post("/SchoolData/ByFilters", filters);
    return response.data;
  }

  /**
   * Get attendance data filtered by grade
   */
  async getGradeData(filters: FilterRequest): Promise<AttendanceResponse> {
    const response = await axiosInstance.post("/GradeDetails/ByFilters", filters);
    return response.data;
  }

  /**
   * Get attendance data for a specific student
   */
  async getStudentData(filters: FilterRequest): Promise<AttendanceResponse> {
    const response = await axiosInstance.post("/StudentDetails/ByFilters", filters);
    return response.data;
  }
}

// Export an instance of the service
const attendanceService = new AttendanceService();
export default attendanceService;

// Also export the types for use in other files
export type {
  FilterRequest,
  AttendanceResponse,
  InitialDataResponse
};