// import axiosInstance from "@/lib/axios";
// import { Student, AttendanceData, RiskCategory } from "@/types";

// class AlertsService {
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
// const alertsService = new AlertsService();
// export default alertsService;

import axiosInstance from "@/lib/axios";
import { Student, AttendanceData, RiskCategory } from "@/types";

// Filter request interface to match the main component
interface FilterRequest {
  districtName?: string;
  schoolName?: string;
  studentId?: number;
  grade?: number;
}

// Response interfaces for different API endpoints
interface StudentDetailsResponse {
  risk: RiskCategory;
  predictedAttendance: AttendanceData;
  probability2025: number;
  metrics?: AttendanceData[];
  trend?: Array<{
    year: string;
    value: number;
    isPredicted: boolean;
  }>;
}

interface AggregatedDataResponse {
  attendance2024: number;
  predicted2025: number;
  metrics: Array<{
    year: string;
    attendanceRate: number;
    unexcused: number;
    present: number;
    total: number;
  }>;
  predictedAttendance: {
    year: string;
    attendanceRate: number;
    total: number;
  };
  trend: Array<{
    year: string;
    value: number;
    isPredicted: boolean;
  }>;
}

interface StudentsResponse {
  students: Student[];
}

class PredictionService {
  // Helper function to convert grade string to number (matching main component)
  private gradeStringToNumber(gradeStr: string): number {
    if (gradeStr === "Pre-Kindergarten") return -1;
    if (gradeStr === "Kindergarten") return 0;
    const match = gradeStr.match(/^(\d+)/);
    return match ? parseInt(match[1]) : -3;
  }

  // Get all students
  async getStudents(): Promise<Student[]> {
    try {
      const res = await axiosInstance.get<StudentsResponse>("/students");
      return Array.isArray(res.data.students) ? res.data.students : [];
    } catch (error) {
      console.error("Failed to fetch students", error);
      return [];
    }
  }

  // Get all districts data (when no filters are applied)
  async getAllDistrictsData(): Promise<AggregatedDataResponse | null> {
    try {
      const res = await axiosInstance.get<AggregatedDataResponse>("/AllDistrictsData");
      
      if (res.data.message) {
        console.log("API message:", res.data.message);
        return null;
      }
      
      return res.data;
    } catch (error) {
      console.error("Failed to fetch all districts data", error);
      return null;
    }
  }

  // Get district-level data
  async getDistrictData(districtName: string): Promise<AggregatedDataResponse | null> {
    try {
      const filterRequest: FilterRequest = { districtName };
      const res = await axiosInstance.post<AggregatedDataResponse>("/DistrictData/ByFilters", filterRequest);
      
      if (res.data.message) {
        console.log("API message:", res.data.message);
        return null;
      }
      
      return res.data;
    } catch (error) {
      console.error("Failed to fetch district data", error);
      return null;
    }
  }

  // Get school-level data
  async getSchoolData(schoolName: string, districtName?: string): Promise<AggregatedDataResponse | null> {
    try {
      const filterRequest: FilterRequest = { schoolName };
      if (districtName) {
        filterRequest.districtName = districtName;
      }
      
      const res = await axiosInstance.post<AggregatedDataResponse>("/SchoolData/ByFilters", filterRequest);
      
      if (res.data.message) {
        console.log("API message:", res.data.message);
        return null;
      }
      
      return res.data;
    } catch (error) {
      console.error("Failed to fetch school data", error);
      return null;
    }
  }

  // Get grade-level data
  async getGradeData(grade: string, schoolName?: string, districtName?: string): Promise<AggregatedDataResponse | null> {
    try {
      const gradeNum = this.gradeStringToNumber(grade);
      if (gradeNum === -3) {
        throw new Error("Invalid grade format");
      }

      const filterRequest: FilterRequest = { grade: gradeNum };
      if (schoolName) filterRequest.schoolName = schoolName;
      if (districtName) filterRequest.districtName = districtName;
      
      const res = await axiosInstance.post<AggregatedDataResponse>("/GradeDetails/ByFilters", filterRequest);
      
      if (res.data.message) {
        console.log("API message:", res.data.message);
        return null;
      }
      
      return res.data;
    } catch (error) {
      console.error("Failed to fetch grade data", error);
      return null;
    }
  }

  // Get student-level data
  async getStudentData(studentId: string, schoolName?: string, districtName?: string, grade?: string): Promise<StudentDetailsResponse | null> {
    try {
      const filterRequest: FilterRequest = { studentId: parseInt(studentId) };
      if (schoolName) filterRequest.schoolName = schoolName;
      if (districtName) filterRequest.districtName = districtName;
      if (grade) {
        const gradeNum = this.gradeStringToNumber(grade);
        if (gradeNum !== -3) filterRequest.grade = gradeNum;
      }
      
      const res = await axiosInstance.post<StudentDetailsResponse>("/StudentDetails/ByFilters", filterRequest);
      
      if (res.data.message) {
        console.log("API message:", res.data.message);
        return null;
      }
      
      return res.data;
    } catch (error) {
      console.error("Failed to fetch student data", error);
      return null;
    }
  }

  // Generic method to fetch data based on filters (matching main component logic)
  async getDataByFilters(filters: {
    districtId?: number | null;
    locationId?: number | null;
    grade?: string | null;
    student?: Student | null;
  }, students: Student[]): Promise<AggregatedDataResponse | StudentDetailsResponse | null> {
    const { districtId, locationId, grade, student } = filters;
    
    try {
      // Student level - highest priority
      if (student) {
        return await this.getStudentData(
          student.id,
          student.schoolName,
          student.districtName,
          student.grade
        );
      }
      
      // Grade level
      if (grade && (districtId || locationId)) {
        const schoolName = locationId ? students.find(s => s.locationId === locationId)?.schoolName : undefined;
        const districtName = districtId ? students.find(s => s.districtId === districtId)?.districtName : undefined;
        
        return await this.getGradeData(grade, schoolName, districtName);
      }
      
      // School level
      if (locationId) {
        const schoolName = students.find(s => s.locationId === locationId)?.schoolName;
        const districtName = students.find(s => s.locationId === locationId)?.districtName;
        
        if (schoolName) {
          return await this.getSchoolData(schoolName, districtName);
        }
      }
      
      // District level
      if (districtId) {
        const districtName = students.find(s => s.districtId === districtId)?.districtName;
        
        if (districtName) {
          return await this.getDistrictData(districtName);
        }
      }
      
      // No filters - all districts
      return await this.getAllDistrictsData();
      
    } catch (error) {
      console.error("Failed to fetch filtered data", error);
      return null;
    }
  }

  // Backward compatibility methods (for existing code that might still use them)
  async getStudentDetails(studentId: string): Promise<StudentDetailsResponse | null> {
    console.warn("getStudentDetails is deprecated. Use getStudentData instead.");
    return await this.getStudentData(studentId);
  }

  async getStudentMetrics(studentId: string): Promise<AttendanceData[]> {
    console.warn("getStudentMetrics is deprecated. Use getStudentData instead.");
    const data = await this.getStudentData(studentId);
    return data?.metrics || [];
  }

  async getStudentTrend(studentId: string): Promise<any[]> {
    console.warn("getStudentTrend is deprecated. Use getStudentData instead.");
    const data = await this.getStudentData(studentId);
    return data?.trend || [];
  }

  // Utility method to determine API endpoint (for debugging)
  getApiEndpoint(filters: {
    districtId?: number | null;
    locationId?: number | null;
    grade?: string | null;
    student?: Student | null;
  }): string {
    const { districtId, locationId, grade, student } = filters;
    
    if (student) return '/StudentDetails/ByFilters';
    if (grade && (districtId || locationId)) return '/GradeDetails/ByFilters';
    if (locationId) return '/SchoolData/ByFilters';
    if (districtId) return '/DistrictData/ByFilters';
    return '/AllDistrictsData';
  }
}

// Export an instance of the service
const predictionService = new PredictionService();
export default predictionService;