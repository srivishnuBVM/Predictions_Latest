// //id based
// import React, { useEffect, useState, useCallback } from "react";
// import { Student, AttendanceData, RiskCategory } from "@/types";
// import { StudentSelector } from "@/components/StudentSelector";
// import { AttendanceTrend } from "@/components/AttendanceTrend";
// import { AttendanceHistory } from "@/components/AttendanceHistory";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { CalendarCheck2, Filter } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { setAuthToken } from "@/lib/axios";
// import axios from 'axios';

// interface FilterRequest {
//   districtId?: number;
//   schoolId?: number;
//   studentId?: number;
//   grade?: number;
// }

// interface Filters {
//   district: number | null;
//   school: number | null;
//   grade: string | null;
//   student: Student | null;
// }

// const API = "http://localhost:8000";

// const gradeStringToNumber = (gradeStr: string): number => {
//   if (gradeStr === "Pre-Kindergarten") return -1;
//   if (gradeStr === "Kindergarten") return 0;
//   const match = gradeStr.match(/^(\d+)/);
//   return match ? parseInt(match[1]) : -3;
// };

// const Index: React.FC = () => {
//   // State management
//   const [students, setStudents] = useState<Student[]>([]);
//   const [attendanceData, setAttendanceData] = useState<any>(null);
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
//   // Filter state now uses IDs
//   const [filters, setFilters] = useState<Filters>({
//     district: null,
//     school: null,
//     grade: null,
//     student: null,
//   });
  
//   const { token } = useAuth();
  
//   const axiosInstance = axios.create({ baseURL: API });

//   useEffect(() => {
//     setAuthToken(token);
//   }, [token]);

//   // Fetch students on mount
//   useEffect(() => {
//     axiosInstance.get('/students')
//       .then((r) => {
//         const studentsData = Array.isArray(r.data.students) ? r.data.students : [];
//         setStudents(studentsData);
//       })
//       .catch((error) => {
//         console.error("Failed to fetch students", error);
//         setStudents([]);
//       });
//   }, []);

//   // Helper functions to get names from IDs
//   const getDistrictName = (id: number) => students.find(s => s.districtId === id)?.districtName || "Unknown";
//   const getSchoolName = (id: number) => students.find(s => s.locationId === id)?.schoolName || "Unknown";

//   // Determine which API endpoint to use based on filter hierarchy
//   const getApiEndpoint = useCallback(() => {
//     const { district, school, grade, student } = filters;
    
//     // Student level - highest priority
//     if (student) {
//       return '/StudentDetails/ByFilters';
//     }
    
//     // Grade level
//     if (grade && (district || school)) {
//       return '/GradeDetails/ByFilters';
//     }
    
//     // School level
//     if (school) {
//       return '/SchoolData/ByFilters';
//     }
    
//     // District level
//     if (district) {
//       return '/DistrictData/ByFilters';
//     }
    
//     // If no filters selected, show all districts data
//     return '/AllDistrictsData';
//   }, [filters]);

//   // Fetch filtered data
//   const fetchFilteredData = useCallback(async () => {
//     const { district, school, grade, student } = filters;
    
//     const endpoint = getApiEndpoint();
//     if (!endpoint) {
//       setAttendanceData(null);
//       return;
//     }

//     try {
//       // Handle AllDistrictsData endpoint (GET request)
//       if (endpoint === '/AllDistrictsData') {
//         console.log('Calling AllDistrictsData endpoint');
//         const response = await axiosInstance.get(endpoint);
        
//         if (response.data.message) {
//           console.log("API message:", response.data.message);
//           setAttendanceData(null);
//           return;
//         }
        
//         setAttendanceData(response.data);
//         return;
//       }

//       // Handle other endpoints (POST requests with filters)
//       const filterRequest: FilterRequest = {};
      
//       // Build filter request using IDs
//       if (district) filterRequest.districtId = district;
//       if (school) filterRequest.schoolId = school;
//       if (grade) {
//         const gradeNum = gradeStringToNumber(grade);
//         if (gradeNum !== -3) filterRequest.grade = gradeNum;
//       }
//       if (student) {
//         filterRequest.studentId = parseInt(student.id);
//       }

//       console.log(`Calling ${endpoint} with filters:`, filterRequest);
      
//       const response = await axiosInstance.post(endpoint, filterRequest);
      
//       if (response.data.message) {
//         console.log("API message:", response.data.message);
//         setAttendanceData(null);
//         return;
//       }
      
//       setAttendanceData(response.data);

//     } catch (error) {
//       console.error("Failed to fetch filtered data", error);
//       setAttendanceData(null);
//     }
//   }, [filters, getApiEndpoint]);

//   useEffect(() => {
//     fetchFilteredData();
//   }, [fetchFilteredData]);

//   // Helper functions for display
//   const getDisplayInfo = () => {
//     const { district, school, grade, student } = filters;
    
//     // Handle case when no filters are selected
//     if (!district && !school && !grade && !student) {
//       return {
//         title: "All Districts Combined",
//         subtitle: (
//           <div className="flex gap-4 text-sm text-gray-500 mt-1">
//             <span>Showing aggregated data across all districts</span>
//             <span>Total Students: {students.length}</span>
//           </div>
//         )
//       };
//     }
    
//     if (student) {
//       return {
//         title: `Student: ${student.id}`,
//         subtitle: (
//           <div className="flex gap-4 text-sm text-gray-500 mt-1">
//             <span>Grade: {student.grade}</span>
//             <span>School: {student.schoolName}</span>
//             <span>District: {student.districtName}</span>
//           </div>
//         )
//       };
//     }
    
//     const parts = [];
//     if (grade) parts.push(`Grade: ${grade}`);
//     if (school) parts.push(`School: ${getSchoolName(school)}`);
//     if (district) parts.push(`District: ${getDistrictName(district)}`);
    
//     return {
//       title: parts.length > 0 ? parts.join(" | ") : "No filters selected",
//       subtitle: <div className="text-sm text-gray-500 mt-1">Showing aggregated data for selected filters</div>
//     };
//   };

//   // Process attendance data for components
//   const processedData = React.useMemo(() => {
//     if (!attendanceData) {
//       return {
//         history: [],
//         pred: null,
//         trend: []
//       };
//     }

//     // Convert metrics to history format
//     const history = attendanceData.metrics ? attendanceData.metrics.map((metric: any) => ({
//       year: parseInt(metric.year),
//       attendanceRate: metric.attendanceRate,
//       unexcused: metric.unexcused,
//       present: metric.present,
//       total: metric.total
//     })) : [];

//     // Get predicted attendance
//     const pred = attendanceData.predictedAttendance ? {
//       year: parseInt(attendanceData.predictedAttendance.year),
//       attendanceRate: attendanceData.predictedAttendance.attendanceRate,
//       total: attendanceData.predictedAttendance.total
//     } : null;

//     // Get trend data
//     const trend = attendanceData.trend ? attendanceData.trend.map((item: any) => ({
//       year: parseInt(item.year),
//       value: item.value,
//       isPredicted: item.isPredicted
//     })) : [];

//     return { history, pred, trend };
//   }, [attendanceData]);

//   const { history, pred, trend } = processedData;

//   // Calculate metrics
//   const curr = history[history.length - 1] ?? null;
//   const prev = history[history.length - 2] ?? null;
//   const { title, subtitle } = getDisplayInfo();

//   // Metric card component
//   const MetricCard = ({ 
//     title, 
//     value, 
//     comparison, 
//     comparisonYear 
//   }: { 
//     title: string; 
//     value: string; 
//     comparison?: number; 
//     comparisonYear?: number; 
//   }) => (
//     <Card className="bg-white border border-[#C0D5DE] shadow-sm hover:shadow-md transition-shadow">
//       <CardHeader className="pb-2">
//         <CardTitle className="text-base text-gray-600">{title}</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="flex items-baseline justify-between">
//           <div className="flex items-center">
//             <CalendarCheck2 className="h-5 w-5 text-[#03787c] mr-2" />
//             <div className="text-3xl font-bold">{value}</div>
//           </div>
//           <div className="text-right">
//             {comparison !== undefined && comparisonYear ? (
//               <>
//                 <div className={`font-semibold ${comparison >= 0 ? "text-[#03787c]" : "text-red-600"}`}>
//                   {comparison >= 0 ? "▲" : "▼"}{Math.abs(comparison)}%
//                 </div>
//                 <p className="text-xs text-gray-500">vs {comparisonYear}</p>
//               </>
//             ) : (
//               <div className="text-sm">N/A</div>
//             )}
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );

//   return (
//     <div className="min-h-screen bg-gray-50/50">
//       {/* Header */}
//       <header className="w-full bg-white border-b border-gray-200 shadow-sm">
//         <div className="px-6 py-4">
//           <h1 className="text-2xl font-bold text-gray-800">AI-Driven Attendance Analytics</h1>
//           <p className="text-gray-500 mt-1">Track and analyze student attendance patterns</p>
//         </div>
//       </header>

//       <div className="w-full flex">
//         {/* Sidebar */}
//         <aside className={`bg-white border-r border-[#C0D5DE] shadow-sm transition-all duration-300 ${
//           sidebarCollapsed ? "w-14" : "w-80"
//         } h-[calc(100vh-73px)] sticky top-[73px]`}>
//           {!sidebarCollapsed ? (
//             <div className="p-5">
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-lg font-bold text-gray-700">Filters</h2>
//                 <button 
//                   onClick={() => setSidebarCollapsed(true)}
//                   className="text-gray-500 hover:text-gray-700 focus:outline-none"
//                 >
//                   <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                     <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
//                   </svg>
//                 </button>
//               </div>
//               <StudentSelector
//                 students={students}
//                 selectedStudent={filters.student}
//                 onSelect={(student) => setFilters(prev => ({ ...prev, student }))}
//                 onFiltersChange={setFilters}
//                 selectedDistrict={filters.district}
//                 selectedSchool={filters.school}
//                 selectedGrade={filters.grade}
//               />
//             </div>
//           ) : (
//             <div className="flex flex-col items-center pt-5">
//               <button 
//                 onClick={() => setSidebarCollapsed(false)}
//                 className="flex flex-col items-center justify-center p-2 text-[#03787c] hover:text-[#026266] focus:outline-none"
//               >
//                 <Filter className="h-6 w-6 mb-1" />
//                 <span className="text-xs rotate-90 mt-2">Filters</span>
//               </button>
//             </div>
//           )}
//         </aside>
        
//         {/* Main Content */}
//         <main className="flex-1 p-6 bg-gray-50">
//           {/* Info Header */}
//           <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
//             <h2 className="text-xl font-bold">{title}</h2>
//             {subtitle}
//           </div>

//           {/* Show current API endpoint being used (for debugging) */}
//           <div className="bg-blue-50 rounded-lg p-3 mb-6 text-sm text-blue-700">
//             <strong>Current API:</strong> {getApiEndpoint() || 'None selected'}
//             {attendanceData && (
//               <div className="mt-1">
//                 <strong>Data available:</strong> 
//                 Attendance 2024: {attendanceData.attendance2024}%, 
//                 Predicted 2025: {attendanceData.predicted2025}%
//               </div>
//             )}
//           </div>

//           {/* Metrics Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
//             <MetricCard
//               title="Attendance Rate (2024)"
//               value={attendanceData?.attendance2024 ? `${attendanceData.attendance2024}%` : "--"}
//               comparison={curr && prev ? curr.attendanceRate - prev.attendanceRate : undefined}
//               comparisonYear={prev?.year}
//             />
            
//             <MetricCard
//               title="AI Predicted Attendance (2025)"
//               value={attendanceData?.predicted2025 ? `${attendanceData.predicted2025}%` : "--"}
//               comparison={attendanceData && curr ? attendanceData.predicted2025 - curr.attendanceRate : undefined}
//               comparisonYear={curr?.year}
//             />
//           </div>

//           {/* Charts */}
//           {trend.length > 0 && (
//             <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
//               <h3 className="text-lg font-bold mb-4">Attendance Trend</h3>
//               <AttendanceTrend data={trend} />
//             </div>
//           )}

//           {history.length > 0 && pred && (
//             <div className="bg-white rounded-lg shadow-sm p-6">
//               <h3 className="text-lg font-bold mb-4">Attendance History</h3>
//               <AttendanceHistory history={history} predicted={pred} />
//             </div>
//           )}

//           {/* Show raw data for debugging */}
//           {attendanceData && (
//             <div className="bg-gray-100 rounded-lg p-4 mt-6">
//               <h4 className="font-bold mb-2">Debug - Raw API Response:</h4>
//               <pre className="text-xs overflow-auto max-h-64">
//                 {JSON.stringify(attendanceData, null, 2)}
//               </pre>
//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// };

// export default Index;


//final code
// import React, { useEffect, useState, useCallback, useMemo } from "react"
// import axios from "axios"
// import { Student } from "@/types"
// import { StudentSelector } from "@/components/StudentSelector"
// import { AttendanceTrend } from "@/components/AttendanceTrend"
// import { AttendanceHistory } from "@/components/AttendanceHistory"
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
// import { CalendarCheck2 } from "lucide-react"
// import { useAuth } from "@/contexts/AuthContext"
// import { setAuthToken } from "@/lib/axios"

// interface FilterRequest {
//   districtId?: number
//   schoolId?: number
//   studentId?: number
//   grade?: number
// }

// interface Filters {
//   district: number | null
//   school: number | null
//   grade: string | null
//   student: Student | null
// }

// const API = "http://localhost:8000"

// const gradeStringToNumber = (gradeStr: string): number => {
//   if (gradeStr === "Pre-Kindergarten") return -1
//   if (gradeStr === "Kindergarten") return 0
//   const m = gradeStr.match(/^(\d+)/)
//   return m ? parseInt(m[1]) : -3
// }

// const Index: React.FC = () => {
//   const [districts, setDistricts] = useState<{ id: number; name: string }[]>([])
//   const [schools, setSchools] = useState<{ id: number; name: string; districtId: number }[]>([])
//   const [students, setStudents] = useState<Student[]>([])
//   const [attendanceData, setAttendanceData] = useState<any>(null)
//   const [filters, setFilters] = useState<Filters>({ district: null, school: null, grade: null, student: null })
//   const { token } = useAuth()
//   const axiosInstance = axios.create({ baseURL: API })

//   useEffect(() => setAuthToken(token), [token])

//   useEffect(() => {
//     axiosInstance.get("/students").then(r => {
//       setDistricts(r.data.districts ?? [])
//       setSchools(r.data.schools ?? [])
//       setStudents(r.data.students ?? [])
//     })
//   }, [])

//   const getApiEndpoint = useCallback(() => {
//     const { district, school, grade, student } = filters
//     if (student) return "/StudentDetails/ByFilters"
//     if (grade && (district || school)) return "/GradeDetails/ByFilters"
//     if (school) return "/SchoolData/ByFilters"
//     if (district) return "/DistrictData/ByFilters"
//     return "/AllDistrictsData"
//   }, [filters])

//   const fetchData = useCallback(async () => {
//     const { district, school, grade, student } = filters
//     const endpoint = getApiEndpoint()
//     if (endpoint === "/AllDistrictsData") {
//       const { data } = await axiosInstance.get(endpoint)
//       setAttendanceData(data.message ? null : data)
//       return
//     }
//     const body: FilterRequest = {}
//     if (district) body.districtId = district
//     if (school) body.schoolId = school
//     if (grade) {
//       const g = gradeStringToNumber(grade)
//       if (g !== -3) body.grade = g
//     }
//     if (student) body.studentId = parseInt(student.id)
//     const { data } = await axiosInstance.post(endpoint, body)
//     setAttendanceData(data.message ? null : data)
//   }, [filters, getApiEndpoint])

//   useEffect(() => {
//     fetchData()
//   }, [fetchData])

//   const processed = useMemo(() => {
//     if (!attendanceData) return { history: [], trend: [], pred: null }
//     const history = attendanceData.metrics?.map((m: any) => ({ year: parseInt(m.year), attendanceRate: m.attendanceRate, unexcused: m.unexcused, present: m.present, total: m.total })) ?? []
//     const pred = attendanceData.predictedAttendance ? { year: parseInt(attendanceData.predictedAttendance.year), attendanceRate: attendanceData.predictedAttendance.attendanceRate, total: attendanceData.predictedAttendance.total } : null
//     const trend = attendanceData.trend?.map((t: any) => ({ year: parseInt(t.year), value: t.value, isPredicted: t.isPredicted })) ?? []
//     return { history, trend, pred }
//   }, [attendanceData])

//   const curr = processed.history[processed.history.length - 1] ?? null
//   const prev = processed.history[processed.history.length - 2] ?? null

//   const MetricCard = ({ title, value, comparison, comparisonYear }: { title: string; value: string; comparison?: number; comparisonYear?: number }) => (
//     <Card className="bg-white border border-[#C0D5DE] shadow-sm">
//       <CardHeader className="pb-2">
//         <CardTitle className="text-base text-gray-600">{title}</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="flex items-baseline justify-between">
//           <div className="flex items-center">
//             <CalendarCheck2 className="h-5 w-5 text-[#03787c] mr-2" />
//             <div className="text-3xl font-bold">{value}</div>
//           </div>
//           <div className="text-right">
//             {comparison !== undefined && comparisonYear ? (
//               <>
//                 <div className={`font-semibold ${comparison >= 0 ? "text-[#03787c]" : "text-red-600"}`}>{`${comparison >= 0 ? "▲" : "▼"}${Math.abs(comparison)}%`}</div>
//                 <p className="text-xs text-gray-500">{`vs ${comparisonYear}`}</p>
//               </>
//             ) : (
//               <div className="text-sm">N/A</div>
//             )}
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   )

//   return (
//     <div className="min-h-screen bg-gray-50/50">
//       <header className="w-full bg-white border-b border-gray-200 shadow-sm">
//         <div className="px-6 py-4">
//           <h1 className="text-2xl font-bold text-gray-800">AI-Driven Attendance Analytics</h1>
//           <p className="text-gray-500 mt-1">Track and analyze student attendance patterns</p>
//         </div>
//       </header>
//       <div className="w-full flex">
//         <aside className="bg-white border-r border-[#C0D5DE] shadow-sm w-80 h-[calc(100vh-73px)] sticky top-[73px] p-5">
//           <StudentSelector students={students} selectedStudent={filters.student} onSelect={s => setFilters(prev => ({ ...prev, student: s }))} onFiltersChange={setFilters} selectedDistrict={filters.district} selectedSchool={filters.school} selectedGrade={filters.grade} />
//         </aside>
//         <main className="flex-1 p-6 bg-gray-50">
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
//             <MetricCard title="Attendance Rate (2024)" value={attendanceData?.attendance2024 ? `${attendanceData.attendance2024}%` : "--"} comparison={curr && prev ? curr.attendanceRate - prev.attendanceRate : undefined} comparisonYear={prev?.year} />
//             <MetricCard title="AI Predicted Attendance (2025)" value={attendanceData?.predicted2025 ? `${attendanceData.predicted2025}%` : "--"} comparison={attendanceData && curr ? attendanceData.predicted2025 - curr.attendanceRate : undefined} comparisonYear={curr?.year} />
//           </div>
//           {processed.trend.length > 0 && (
//             <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
//               <h3 className="text-lg font-bold mb-4">Attendance Trend</h3>
//               <AttendanceTrend data={processed.trend} />
//             </div>
//           )}
//           {processed.history.length > 0 && processed.pred && (
//             <div className="bg-white rounded-lg shadow-sm p-6">
//               <h3 className="text-lg font-bold mb-4">Attendance History</h3>
//               <AttendanceHistory history={processed.history} predicted={processed.pred} />
//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   )
// }

// export default Index


//loading states
// import React, { useEffect, useState, useCallback, useMemo } from "react"
// import axios from "axios"
// import { Student } from "@/types"
// import { StudentSelector } from "@/components/StudentSelector"
// import { AttendanceTrend } from "@/components/AttendanceTrend"
// import { AttendanceHistory } from "@/components/AttendanceHistory"
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
// import { CalendarCheck2, Loader2 } from "lucide-react"
// import { useAuth } from "@/contexts/AuthContext"
// import { setAuthToken } from "@/lib/axios"

// interface FilterRequest {
//   districtId?: number
//   schoolId?: number
//   studentId?: number
//   grade?: number
// }

// interface Filters {
//   district: number | null
//   school: number | null
//   grade: string | null
//   student: Student | null
// }

// const API = "http://localhost:8000"

// const gradeStringToNumber = (gradeStr: string): number => {
//   if (gradeStr === "Pre-Kindergarten") return -1
//   if (gradeStr === "Kindergarten") return 0
//   const m = gradeStr.match(/^(\d+)/)
//   return m ? parseInt(m[1]) : -3
// }

// const Index: React.FC = () => {
//   const [districts, setDistricts] = useState<{ id: number; name: string }[]>([])
//   const [schools, setSchools] = useState<{ id: number; name: string; districtId: number }[]>([])
//   const [students, setStudents] = useState<Student[]>([])
//   const [attendanceData, setAttendanceData] = useState<any>(null)
//   const [filters, setFilters] = useState<Filters>({ district: null, school: null, grade: null, student: null })
//   const [isInitialLoading, setIsInitialLoading] = useState(true)
//   const [isDataLoading, setIsDataLoading] = useState(false)
//   const { token } = useAuth()
//   const axiosInstance = axios.create({ baseURL: API })

//   useEffect(() => setAuthToken(token), [token])

//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         setIsInitialLoading(true)
//         const response = await axiosInstance.get("/students")
//         setDistricts(response.data.districts ?? [])
//         setSchools(response.data.schools ?? [])
//         setStudents(response.data.students ?? [])
//       } catch (error) {
//         console.error("Failed to fetch initial data:", error)
//       } finally {
//         setIsInitialLoading(false)
//       }
//     }

//     fetchInitialData()
//   }, [])

//   const getApiEndpoint = useCallback(() => {
//     const { district, school, grade, student } = filters
//     if (student) return "/StudentDetails/ByFilters"
//     if (grade && (district || school)) return "/GradeDetails/ByFilters"
//     if (school) return "/SchoolData/ByFilters"
//     if (district) return "/DistrictData/ByFilters"
//     return "/AllDistrictsData"
//   }, [filters])

//   const fetchData = useCallback(async () => {
//     if (isInitialLoading) return // Don't fetch attendance data until initial data is loaded
    
//     try {
//       setIsDataLoading(true)
//       const { district, school, grade, student } = filters
//       const endpoint = getApiEndpoint()
      
//       if (endpoint === "/AllDistrictsData") {
//         const { data } = await axiosInstance.get(endpoint)
//         setAttendanceData(data.message ? null : data)
//         return
//       }
      
//       const body: FilterRequest = {}
//       if (district) body.districtId = district
//       if (school) body.schoolId = school
//       if (grade) {
//         const g = gradeStringToNumber(grade)
//         if (g !== -3) body.grade = g
//       }
//       if (student) body.studentId = parseInt(student.id)
      
//       const { data } = await axiosInstance.post(endpoint, body)
//       setAttendanceData(data.message ? null : data)
//     } catch (error) {
//       console.error("Failed to fetch attendance data:", error)
//       setAttendanceData(null)
//     } finally {
//       setIsDataLoading(false)
//     }
//   }, [filters, getApiEndpoint, isInitialLoading])

//   useEffect(() => {
//     fetchData()
//   }, [fetchData])

//   const processed = useMemo(() => {
//     if (!attendanceData) return { history: [], trend: [], pred: null }
//     const history = attendanceData.metrics?.map((m: any) => ({ year: parseInt(m.year), attendanceRate: m.attendanceRate, unexcused: m.unexcused, present: m.present, total: m.total })) ?? []
//     const pred = attendanceData.predictedAttendance ? { year: parseInt(attendanceData.predictedAttendance.year), attendanceRate: attendanceData.predictedAttendance.attendanceRate, total: attendanceData.predictedAttendance.total } : null
//     const trend = attendanceData.trend?.map((t: any) => ({ year: parseInt(t.year), value: t.value, isPredicted: t.isPredicted })) ?? []
//     return { history, trend, pred }
//   }, [attendanceData])

//   const curr = processed.history[processed.history.length - 1] ?? null
//   const prev = processed.history[processed.history.length - 2] ?? null

//   const MetricCard = ({ title, value, comparison, comparisonYear }: { title: string; value: string; comparison?: number; comparisonYear?: number }) => (
//     <Card className="bg-white border border-[#C0D5DE] shadow-sm">
//       <CardHeader className="pb-2">
//         <CardTitle className="text-base text-gray-600">{title}</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="flex items-baseline justify-between">
//           <div className="flex items-center">
//             <CalendarCheck2 className="h-5 w-5 text-[#03787c] mr-2" />
//             <div className="text-3xl font-bold">{value}</div>
//           </div>
//           <div className="text-right">
//             {comparison !== undefined && comparisonYear ? (
//               <>
//                 <div className={`font-semibold ${comparison >= 0 ? "text-[#03787c]" : "text-red-600"}`}>{`${comparison >= 0 ? "▲" : "▼"}${Math.abs(comparison)}%`}</div>
//                 <p className="text-xs text-gray-500">{`vs ${comparisonYear}`}</p>
//               </>
//             ) : (
//               <div className="text-sm">N/A</div>
//             )}
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   )

//   // Show initial loading screen
//   if (isInitialLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50/50">
//         <header className="w-full bg-white border-b border-gray-200 shadow-sm">
//           <div className="px-6 py-4">
//             <h1 className="text-2xl font-bold text-gray-800">AI-Driven Attendance Analytics</h1>
//             <p className="text-gray-500 mt-1">Track and analyze student attendance patterns</p>
//           </div>
//         </header>
//         <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
//           <div className="text-center">
//             <Loader2 className="h-8 w-8 animate-spin text-[#03787c] mx-auto mb-4" />
//             <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Application</h2>
//             <p className="text-gray-500">Fetching districts, schools, and students...</p>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gray-50/50">
//       <header className="w-full bg-white border-b border-gray-200 shadow-sm">
//         <div className="px-6 py-4">
//           <h1 className="text-2xl font-bold text-gray-800">AI-Driven Attendance Analytics</h1>
//           <p className="text-gray-500 mt-1">Track and analyze student attendance patterns</p>
//         </div>
//       </header>
//       <div className="w-full flex">
//         <aside className="bg-white border-r border-[#C0D5DE] shadow-sm w-80 h-[calc(100vh-73px)] sticky top-[73px] p-5">
//           <StudentSelector 
//             students={students} 
//             selectedStudent={filters.student} 
//             onSelect={s => setFilters(prev => ({ ...prev, student: s }))} 
//             onFiltersChange={setFilters} 
//             selectedDistrict={filters.district} 
//             selectedSchool={filters.school} 
//             selectedGrade={filters.grade} 
//           />
//         </aside>
//         <main className="flex-1 p-6 bg-gray-50 relative">
//           {/* Data loading overlay */}
//           {isDataLoading && (
//             <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
//               <div className="text-center">
//                 <Loader2 className="h-6 w-6 animate-spin text-[#03787c] mx-auto mb-2" />
//                 <p className="text-sm text-gray-600">Loading attendance data...</p>
//               </div>
//             </div>
//           )}
          
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
//             <MetricCard 
//               title="Attendance Rate (2024)" 
//               value={attendanceData?.attendance2024 ? `${attendanceData.attendance2024}%` : "--"} 
//               comparison={curr && prev ? curr.attendanceRate - prev.attendanceRate : undefined} 
//               comparisonYear={prev?.year} 
//             />
//             <MetricCard 
//               title="AI Predicted Attendance (2025)" 
//               value={attendanceData?.predicted2025 ? `${attendanceData.predicted2025}%` : "--"} 
//               comparison={attendanceData && curr ? attendanceData.predicted2025 - curr.attendanceRate : undefined} 
//               comparisonYear={curr?.year} 
//             />
//           </div>
          
//           {processed.trend.length > 0 && (
//             <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
//               <h3 className="text-lg font-bold mb-4">Attendance Trend</h3>
//               <AttendanceTrend data={processed.trend} />
//             </div>
//           )}
          
//           {processed.history.length > 0 && processed.pred && (
//             <div className="bg-white rounded-lg shadow-sm p-6">
//               <h3 className="text-lg font-bold mb-4">Attendance History</h3>
//               <AttendanceHistory history={processed.history} predicted={processed.pred} />
//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   )
// }

// export default Index


//Index with service layer
import React, { useEffect, useState, useCallback, useMemo } from "react"
import { Student } from "@/types"
import { StudentSelector } from "@/components/StudentSelector"
import { AttendanceTrend } from "@/components/AttendanceTrend"
import { AttendanceHistory } from "@/components/AttendanceHistory"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { CalendarCheck2, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { setAuthToken } from "@/lib/axios"
import attendanceService, { AttendanceResponse, FilterRequest } from "@/services/prediction.service"

interface Filters {
  district: number | null
  school: number | null
  grade: string | null
  student: Student | null
}

const gradeStringToNumber = (gradeStr: string): number => {
  if (gradeStr === "Pre-Kindergarten") return -1
  if (gradeStr === "Kindergarten") return 0
  const m = gradeStr.match(/^(\d+)/)
  return m ? parseInt(m[1]) : -3
}

const Index: React.FC = () => {
  const [districts, setDistricts] = useState<{ id: number; name: string }[]>([])
  const [schools, setSchools] = useState<{ id: number; name: string; districtId: number }[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceResponse | null>(null)
  const [filters, setFilters] = useState<Filters>({ district: null, school: null, grade: null, student: null })
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isDataLoading, setIsDataLoading] = useState(false)
  
  const { token } = useAuth()

  useEffect(() => {
    console.log("Auth Token:", token)
    setAuthToken(token)
  }, [token])
  

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsInitialLoading(true)
        const data = await attendanceService.getInitialData()
        setDistricts(data.districts)
        setSchools(data.schools)
        setStudents(data.students)
      } catch (error) {
        console.error("Failed to fetch initial data:", error)
      } finally {
        setIsInitialLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  const fetchData = useCallback(async () => {
    if (isInitialLoading) return // Don't fetch attendance data until initial data is loaded
    
    try {
      setIsDataLoading(true)
      const { district, school, grade, student } = filters
      
      // If no filters, get all districts data
      if (!district && !school && !grade && !student) {
        const data = await attendanceService.getAllDistrictsData()
        setAttendanceData(data.message ? null : data)
        return
      }
      
      // Build request body
      const body: FilterRequest = {}
      if (district) body.districtId = district
      if (school) body.schoolId = school
      if (grade) {
        const g = gradeStringToNumber(grade)
        if (g !== -3) body.grade = g
      }
      if (student) body.studentId = parseInt(student.id)
      
      // Determine which API to call based on filters
      let data: AttendanceResponse
      if (student) {
        data = await attendanceService.getStudentData(body)
      } else if (grade && (district || school)) {
        data = await attendanceService.getGradeData(body)
      } else if (school) {
        data = await attendanceService.getSchoolData(body)
      } else if (district) {
        data = await attendanceService.getDistrictData(body)
      } else {
        data = await attendanceService.getAllDistrictsData()
      }
      
      setAttendanceData(data.message ? null : data)
    } catch (error) {
      console.error("Failed to fetch attendance data:", error)
      setAttendanceData(null)
    } finally {
      setIsDataLoading(false)
    }
  }, [filters, isInitialLoading])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const processed = useMemo(() => {
    if (!attendanceData) return { history: [], trend: [], pred: null }
    const history = attendanceData.metrics?.map((m: any) => ({ 
      year: parseInt(m.year), 
      attendanceRate: m.attendanceRate, 
      unexcused: m.unexcused, 
      present: m.present, 
      total: m.total 
    })) ?? []
    const pred = attendanceData.predictedAttendance ? { 
      year: parseInt(attendanceData.predictedAttendance.year), 
      attendanceRate: attendanceData.predictedAttendance.attendanceRate, 
      total: attendanceData.predictedAttendance.total 
    } : null
    const trend = attendanceData.trend?.map((t: any) => ({ 
      year: parseInt(t.year), 
      value: t.value, 
      isPredicted: t.isPredicted 
    })) ?? []
    return { history, trend, pred }
  }, [attendanceData])

  const curr = processed.history[processed.history.length - 1] ?? null
  const prev = processed.history[processed.history.length - 2] ?? null

  const MetricCard = ({ title, value, comparison, comparisonYear }: { 
    title: string; 
    value: string; 
    comparison?: number; 
    comparisonYear?: number 
  }) => (
    <Card className="bg-white border border-[#C0D5DE] shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="flex items-center">
            <CalendarCheck2 className="h-5 w-5 text-[#03787c] mr-2" />
            <div className="text-3xl font-bold">{value}</div>
          </div>
          <div className="text-right">
            {comparison !== undefined && comparisonYear ? (
              <>
                <div className={`font-semibold ${comparison >= 0 ? "text-[#03787c]" : "text-red-600"}`}>
                  {`${comparison >= 0 ? "▲" : "▼"}${Math.abs(comparison)}%`}
                </div>
                <p className="text-xs text-gray-500">{`vs ${comparisonYear}`}</p>
              </>
            ) : (
              <div className="text-sm">N/A</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Show initial loading screen
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <header className="w-full bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800">AI-Driven Attendance Analytics</h1>
            <p className="text-gray-500 mt-1">Track and analyze student attendance patterns</p>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#03787c] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Application</h2>
            <p className="text-gray-500">Fetching districts, schools, and students...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">AI-Driven Attendance Analytics</h1>
          <p className="text-gray-500 mt-1">Track and analyze student attendance patterns</p>
        </div>
      </header>
      <div className="w-full flex">
        <aside className="bg-white border-r border-[#C0D5DE] shadow-sm w-80 h-[calc(100vh-73px)] sticky top-[73px] p-5">
          <StudentSelector 
            students={students} 
            selectedStudent={filters.student} 
            onSelect={s => setFilters(prev => ({ ...prev, student: s }))} 
            onFiltersChange={setFilters} 
            selectedDistrict={filters.district} 
            selectedSchool={filters.school} 
            selectedGrade={filters.grade} 
          />
        </aside>
        <main className="flex-1 p-6 bg-gray-50 relative">
          {/* Data loading overlay */}
          {isDataLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#03787c] mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading attendance data...</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <MetricCard 
              title="Attendance Rate (2024)" 
              value={attendanceData?.attendance2024 ? `${attendanceData.attendance2024}%` : "--"} 
              comparison={curr && prev ? curr.attendanceRate - prev.attendanceRate : undefined} 
              comparisonYear={prev?.year} 
            />
            <MetricCard 
              title="AI Predicted Attendance (2025)" 
              value={attendanceData?.predicted2025 ? `${attendanceData.predicted2025}%` : "--"} 
              comparison={attendanceData && curr ? attendanceData.predicted2025 - curr.attendanceRate : undefined} 
              comparisonYear={curr?.year} 
            />
          </div>
          
          {processed.trend.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Attendance Trend</h3>
              <AttendanceTrend data={processed.trend} />
            </div>
          )}
          
          {processed.history.length > 0 && processed.pred && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">Attendance History</h3>
              <AttendanceHistory history={processed.history} predicted={processed.pred} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Index;