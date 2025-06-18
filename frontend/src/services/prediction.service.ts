// alerts.service.ts
import axiosInstance from "@/lib/axios";
import { Student, AttendanceData, RiskCategory } from "@/types";

class AlertsService {
  async getStudents(): Promise<Student[]> {
    const res = await axiosInstance.get("/students");
    return res.data;
  }

  async getStudentDetails(studentId: string): Promise<{
    risk: RiskCategory;
    predictedAttendance: AttendanceData;
    probability2025: number;
  }> {
    const res = await axiosInstance.get(`/StudentDetails/StudentID/${studentId}`);
    return res.data;
  }

  async getStudentMetrics(studentId: string): Promise<AttendanceData[]> {
    const res = await axiosInstance.get(`/StudentMetrics/StudentID/${studentId}`);
    return res.data;
  }

  async getStudentTrend(studentId: string): Promise<any[]> {
    const res = await axiosInstance.get(`/StudentTrend/StudentID/${studentId}`);
    return res.data;
  }
}

// Export an instance of the service
const alertsService = new AlertsService();
export default alertsService;
