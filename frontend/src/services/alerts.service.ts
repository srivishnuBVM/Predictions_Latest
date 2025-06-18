// src/services/alerts.service.ts
import { from, Observable } from 'rxjs';
import axiosInstance from "@/lib/axios";

class AlertsService {
  constructor() {}

  getUserTypes(includeInactiveUserTypes: boolean = false): Observable<any> {
    return from(
      axiosInstance.get(`/AttendanceImprovementPlans/GetSchoolDistricts`)
        .then(response => response.data)
    );
  }

  getFilterOptions(): Observable<any> {
    return from(
      axiosInstance.get(`/FastApiService/GetFilterOptions`)
        .then(response => response.data)
    );
}
}

export const alertsService = new AlertsService();
