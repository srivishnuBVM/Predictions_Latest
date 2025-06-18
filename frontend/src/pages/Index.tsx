// Base Code
// import React, { useEffect, useState } from "react";
// import { Student, AttendanceData, RiskCategory } from "@/types";
// import { StudentSelector } from "@/components/StudentSelector";
// import { AttendanceTrend } from "@/components/AttendanceTrend";
// // import { RiskIndicator } from "@/components/RiskIndicator";(base level)
// import { AttendanceHistory } from "@/components/AttendanceHistory";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { CalendarCheck2, Filter } from "lucide-react";
// // import { Download } from "lucide-react";
// // import { Separator } from "@/components/ui/separator";
// import { useAuth } from "@/contexts/AuthContext";
// import axiosInstance, { setAuthToken } from "@/lib/axios";
// import axios from 'axios';
// import alertsService from "@/services/prediction.service";

// const Index: React.FC = () => {
//   const [students, setStudents] = useState<Student[]>([]);
//   const [selected, setSelected] = useState<Student | null>(null);
//   const [history, setHistory] = useState<AttendanceData[]>([]);
//   const [pred, setPred] = useState<AttendanceData | null>(null);
//   const [risk, setRisk] = useState<RiskCategory | null>(null);
//   const [trend, setTrend] = useState<any[]>([]);
//   const [probability, setProbability] = useState<number | null>(null);
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//   const { token } = useAuth();

//   const API = "http://localhost:8000";

//   const axiosInstance = axios.create({
//     baseURL: API
//   });

//   useEffect(() => {
//     setAuthToken(token);
//   }, [token]);

//   // useEffect(() => {
//   //   axiosInstance.get('/students')
//   //     .then((r) => {
//   //       setStudents(r.data);
//   //       console.log(r.data);
//   //       setSelected(r.data[0]);
//   //     });
//   // }, []);

//   useEffect(() => {
//     axiosInstance.get('/students')
//       .then((r) => {
//         const studentsData = r.data;
//         if (Array.isArray(studentsData) && studentsData.length > 0) {
//           setStudents(studentsData);
//           setSelected(studentsData[1]);
//         } else {
//           setStudents([]);
//           setSelected(null); // no students available
//         }
//       })
//       .catch((error) => {
//         console.error("Failed to fetch students", error);
//         setStudents([]);
//         setSelected(null);
//       });
//   }, []);

//   // useEffect(() => {
//   //   alertsService.getStudents()
//   //     .then((studentsData) => {
//   //       if (Array.isArray(studentsData) && studentsData.length > 0) {
//   //         setStudents(studentsData);
//   //         setSelected(studentsData[1]);
//   //       } else {
//   //         setStudents([]);
//   //         setSelected(null);
//   //       }
//   //     })
//   //     .catch((error) => {
//   //       console.error("Failed to fetch students", error);
//   //       setStudents([]);
//   //       setSelected(null);
//   //     });
//   // }, []);
  

//   // useEffect(() => {
//   //   if (!selected) return;
//   //   const id = selected.id;

//   //   axiosInstance.get(`/StudentDetails/StudentID/${id}`)
//   //     .then((r) => {
//   //       setRisk(r.data.risk);
//   //       setPred(r.data.predictedAttendance);
//   //       setProbability(r.data.probability2025);
//   //     });

//   //   axiosInstance.get(`/StudentMetrics/StudentID/${id}`)
//   //     .then((r) => setHistory(r.data));

//   //   axiosInstance.get(`/StudentTrend/StudentID/${id}`)
//   //     .then((r) => setTrend(r.data));
//   // }, [selected]);

//   useEffect(() => {
//     if (!selected) return;
//     const id = selected.id;
  
//     alertsService.getStudentDetails(id).then((data) => {
//       setRisk(data.risk);
//       setPred(data.predictedAttendance);
//       setProbability(data.probability2025);
//     });
  
//     alertsService.getStudentMetrics(id).then(setHistory);
//     alertsService.getStudentTrend(id).then(setTrend);
//   }, [selected]);

//   const prev = history[history.length - 2] ?? null;
//   const curr = history[history.length - 1] ?? null;

//   return (
//     <div className="min-h-screen bg-gray-50/50">
//       {/* Top Header Bar */}
//       <header className="w-full bg-white border-b border-gray-200 shadow-sm">
//         <div className="px-6 py-4">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-800">
//               AI-Driven Attendance Analytics
//             </h1>
//             <p className="text-gray-500 mt-1">
//               Track and analyze student attendance patterns
//             </p>
//           </div>
//         </div>
//       </header>

//       {/* Main Content Area */}
//       <div className="w-full flex">
//         {/* Left sidebar with filters - collapsible */}
//         <aside className={`bg-white border-r border-[#C0D5DE] shadow-sm transition-all duration-300 ${sidebarCollapsed ? "w-14" : "w-80"} h-[calc(100vh-73px)] sticky top-[73px]`}>
//           {!sidebarCollapsed ? (
//             <div className="p-5">
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-lg font-bold text-gray-700">Filters</h2>
//                 <button 
//                   onClick={() => setSidebarCollapsed(true)}
//                   className="text-gray-500 hover:text-gray-700 focus:outline-none"
//                 >
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                     <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
//                   </svg>
//                 </button>
//               </div>
//               {selected && (
//                 <StudentSelector
//                   students={students}
//                   selectedStudent={selected}
//                   onSelect={setSelected}
//                 />
//               )}
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
        
//         {/* Right side with main content */}
//         <main className="flex-1 p-6 bg-gray-50">
//           {/* Student Info Header */}
//           {selected && (
//             <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
//               <div className="flex justify-between items-center">
//                 <div>
//                   <h2 className="text-xl font-bold">Student: {selected.id}</h2>
//                   <div className="flex gap-4 text-sm text-gray-500 mt-1">
//                     <span>Grade: {selected.grade}</span>
//                     <span>School: {selected.schoolName}</span>
//                     <span>District: {selected.districtName}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Metrics Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
//             {/* Attendance Rate */}
//             <Card className="bg-white border border-[#C0D5DE] shadow-sm hover:shadow-md transition-shadow">
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-base text-gray-600">
//                   Attendance Rate (2024)
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex items-baseline justify-between">
//                   <div className="flex items-center">
//                     <CalendarCheck2 className="h-5 w-5 text-[#03787c] mr-2" />
//                     <div className="text-3xl font-bold">
//                       {curr ? `${curr.attendanceRate}%` : "--"}
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     {curr && prev ? (
//                       <>
//                         <div
//                           className={
//                             curr.attendanceRate - prev.attendanceRate >= 0
//                               ? "text-[#03787c] font-semibold"
//                               : "text-red-600 font-semibold"
//                           }
//                         >
//                           {curr.attendanceRate - prev.attendanceRate >= 0 ? "▲" : "▼"}
//                           {Math.abs(curr.attendanceRate - prev.attendanceRate)}%
//                         </div>
//                         <p className="text-xs text-gray-500">
//                           vs {prev.year}
//                         </p>
//                       </>
//                     ) : (
//                       <div className="text-sm">N/A</div>
//                     )}
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
            
//             {/* Predicted Attendance */}
//             <Card className="bg-white border border-[#C0D5DE] shadow-sm hover:shadow-md transition-shadow">
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-base text-gray-600">
//                   AI Predicted Attendance (2025)
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex items-baseline justify-between">
//                   <div className="flex items-center">
//                     <CalendarCheck2 className="h-5 w-5 text-[#03787c] mr-2" />
//                     <div className="text-3xl font-bold">
//                       {pred ? `${pred.attendanceRate}%` : "--"}
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     {pred && curr ? (
//                       <>
//                         <div
//                           className={
//                             pred.attendanceRate - curr.attendanceRate >= 0
//                               ? "text-[#03787c] font-semibold"
//                               : "text-red-600 font-semibold"
//                           }
//                         >
//                           {pred.attendanceRate - curr.attendanceRate >= 0 ? "▲" : "▼"}
//                           {Math.abs(pred.attendanceRate - curr.attendanceRate)}%
//                         </div>
//                         <p className="text-xs text-gray-500">
//                           vs {curr.year}
//                         </p>
//                       </>
//                     ) : (
//                       <div className="text-sm">N/A</div>
//                     )}
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Trend Chart */}
//           <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
//             <h3 className="text-lg font-bold mb-4">Attendance Trend</h3>
//             <AttendanceTrend data={trend} />
//           </div>

//           {/* Attendance History */}
//           {curr && pred && (
//             <div className="bg-white rounded-lg shadow-sm p-6">
//               <h3 className="text-lg font-bold mb-4">Attendance History</h3>
//               <AttendanceHistory history={history} predicted={pred} />
//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// };

// export default Index;




//1st iteration with basic structure 
// import React, { useEffect, useState } from "react";
// import { Student, AttendanceData, RiskCategory } from "@/types";
// import { StudentSelector } from "@/components/StudentSelector";
// import { AttendanceTrend } from "@/components/AttendanceTrend";
// // import { RiskIndicator } from "@/components/RiskIndicator";
// import { AttendanceHistory } from "@/components/AttendanceHistory";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { CalendarCheck2, Filter } from "lucide-react";
// // import { Download } from "lucide-react";
// // import { Separator } from "@/components/ui/separator";
// import { useAuth } from "@/contexts/AuthContext";
// import axiosInstance, { setAuthToken } from "@/lib/axios";
// import axios from 'axios';
// import alertsService from "@/services/prediction.service";

// interface FilterRequest {
//   districtName?: string;
//   schoolName?: string;
//   studentId?: number;
//   grade?: number;
// }

// const Index: React.FC = () => {
//   const [students, setStudents] = useState<Student[]>([]);
//   const [selected, setSelected] = useState<Student | null>(null);
//   const [history, setHistory] = useState<AttendanceData[]>([]);
//   const [pred, setPred] = useState<AttendanceData | null>(null);
//   const [risk, setRisk] = useState<RiskCategory | null>(null);
//   const [trend, setTrend] = useState<any[]>([]);
//   const [probability, setProbability] = useState<number | null>(null);
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
//   // Filter states
//   const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
//   const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
//   const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  
//   const { token } = useAuth();

//   const API = "http://localhost:8000";

//   const axiosInstance = axios.create({
//     baseURL: API
//   });

//   useEffect(() => {
//     setAuthToken(token);
//   }, [token]);

//   useEffect(() => {
//     axiosInstance.get('/students')
//       .then((r) => {
//         const studentsData = r.data;
//         if (Array.isArray(studentsData) && studentsData.length > 0) {
//           setStudents(studentsData);
//           setSelected(studentsData[1]);
//         } else {
//           setStudents([]);
//           setSelected(null);
//         }
//       })
//       .catch((error) => {
//         console.error("Failed to fetch students", error);
//         setStudents([]);
//         setSelected(null);
//       });
//   }, []);

//   // Helper function to convert grade string to number
//   const gradeStringToNumber = (gradeStr: string): number => {
//     if (gradeStr === "Pre-Kindergarten") return -1;
//     if (gradeStr === "Kindergarten") return 0;
    
//     const match = gradeStr.match(/^(\d+)/);
//     if (match) {
//       return parseInt(match[1]);
//     }
//     return -3; // Default value for unknown grades
//   };

//   // Function to fetch data based on current filters
//   const fetchFilteredData = async () => {
//     if (!selectedDistrict && !selectedSchool && !selectedGrade && !selected) {
//       // Clear data if no filters are selected
//       setPred(null);
//       setHistory([]);
//       setTrend([]);
//       setRisk(null);
//       setProbability(null);
//       return;
//     }

//     const filterRequest: FilterRequest = {};
    
//     if (selectedDistrict) {
//       filterRequest.districtName = selectedDistrict;
//     }
    
//     if (selectedSchool) {
//       filterRequest.schoolName = selectedSchool;
//     }
    
//     if (selectedGrade) {
//       const gradeNum = gradeStringToNumber(selectedGrade);
//       if (gradeNum !== -3) {
//         filterRequest.grade = gradeNum;
//       }
//     }
    
//     if (selected && !selectedDistrict && !selectedSchool && !selectedGrade) {
//       // If a specific student is selected but no other filters, use student ID
//       filterRequest.studentId = parseInt(selected.id);
//     }

//     try {
//       // Fetch student details using filters
//       const detailsResponse = await axiosInstance.post('/StudentDetails/ByFilters', filterRequest);
//       if (detailsResponse.data && !detailsResponse.data.message) {
//         setPred(detailsResponse.data.predictedAttendance);
//         // Note: The backend doesn't return risk and probability for filtered data
//         // You might need to add these to the backend response or handle differently
//         setRisk(null);
//         setProbability(null);
//       }

//       // Fetch student metrics using filters
//       const metricsResponse = await axiosInstance.post('/StudentMetrics/ByFilters', filterRequest);
//       if (metricsResponse.data && Array.isArray(metricsResponse.data)) {
//         setHistory(metricsResponse.data);
//       }

//       // Fetch student trend using filters
//       const trendResponse = await axiosInstance.post('/StudentSummaryTrend/ByFilters', filterRequest);
//       if (trendResponse.data && Array.isArray(trendResponse.data)) {
//         setTrend(trendResponse.data);
//       }

//     } catch (error) {
//       console.error("Failed to fetch filtered data", error);
//       setPred(null);
//       setHistory([]);
//       setTrend([]);
//       setRisk(null);
//       setProbability(null);
//     }
//   };

//   // Effect to fetch data when filters change
//   useEffect(() => {
//     fetchFilteredData();
//   }, [selectedDistrict, selectedSchool, selectedGrade, selected]);

//   // Handle filter updates from StudentSelector
//   const handleFilterUpdate = (filters: {
//     district: string | null;
//     school: string | null;
//     grade: string | null;
//     student: Student | null;
//   }) => {
//     setSelectedDistrict(filters.district);
//     setSelectedSchool(filters.school);
//     setSelectedGrade(filters.grade);
//     setSelected(filters.student);
//   };

//   const prev = history[history.length - 2] ?? null;
//   const curr = history[history.length - 1] ?? null;

//   // Get display title based on current filters
//   const getDisplayTitle = () => {
//     if (selected && !selectedDistrict && !selectedSchool && !selectedGrade) {
//       return `Student: ${selected.id}`;
//     }
    
//     const parts = [];
//     if (selectedGrade) parts.push(`Grade: ${selectedGrade}`);
//     if (selectedSchool) parts.push(`School: ${selectedSchool}`);
//     if (selectedDistrict) parts.push(`District: ${selectedDistrict}`);
    
//     return parts.length > 0 ? parts.join(" | ") : "No filters selected";
//   };

//   const getDisplaySubtitle = () => {
//     if (selected && !selectedDistrict && !selectedSchool && !selectedGrade) {
//       return (
//         <div className="flex gap-4 text-sm text-gray-500 mt-1">
//           <span>Grade: {selected.grade}</span>
//           <span>School: {selected.schoolName}</span>
//           <span>District: {selected.districtName}</span>
//         </div>
//       );
//     }
    
//     return (
//       <div className="text-sm text-gray-500 mt-1">
//         Showing aggregated data for selected filters
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50/50">
//       {/* Top Header Bar */}
//       <header className="w-full bg-white border-b border-gray-200 shadow-sm">
//         <div className="px-6 py-4">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-800">
//               AI-Driven Attendance Analytics
//             </h1>
//             <p className="text-gray-500 mt-1">
//               Track and analyze student attendance patterns
//             </p>
//           </div>
//         </div>
//       </header>

//       {/* Main Content Area */}
//       <div className="w-full flex">
//         {/* Left sidebar with filters - collapsible */}
//         <aside className={`bg-white border-r border-[#C0D5DE] shadow-sm transition-all duration-300 ${sidebarCollapsed ? "w-14" : "w-80"} h-[calc(100vh-73px)] sticky top-[73px]`}>
//           {!sidebarCollapsed ? (
//             <div className="p-5">
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-lg font-bold text-gray-700">Filters</h2>
//                 <button 
//                   onClick={() => setSidebarCollapsed(true)}
//                   className="text-gray-500 hover:text-gray-700 focus:outline-none"
//                 >
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                     <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
//                   </svg>
//                 </button>
//               </div>
//               <StudentSelector
//                 students={students}
//                 selectedStudent={selected}
//                 onSelect={setSelected}
//                 onFiltersChange={handleFilterUpdate}
//                 selectedDistrict={selectedDistrict}
//                 selectedSchool={selectedSchool}
//                 selectedGrade={selectedGrade}
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
        
//         {/* Right side with main content */}
//         <main className="flex-1 p-6 bg-gray-50">
//           {/* Student/Filter Info Header */}
//           <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
//             <div className="flex justify-between items-center">
//               <div>
//                 <h2 className="text-xl font-bold">{getDisplayTitle()}</h2>
//                 {getDisplaySubtitle()}
//               </div>
//             </div>
//           </div>

//           {/* Metrics Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
//             {/* Attendance Rate */}
//             <Card className="bg-white border border-[#C0D5DE] shadow-sm hover:shadow-md transition-shadow">
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-base text-gray-600">
//                   Attendance Rate (2024)
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex items-baseline justify-between">
//                   <div className="flex items-center">
//                     <CalendarCheck2 className="h-5 w-5 text-[#03787c] mr-2" />
//                     <div className="text-3xl font-bold">
//                       {curr ? `${curr.attendanceRate}%` : "--"}
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     {curr && prev ? (
//                       <>
//                         <div
//                           className={
//                             curr.attendanceRate - prev.attendanceRate >= 0
//                               ? "text-[#03787c] font-semibold"
//                               : "text-red-600 font-semibold"
//                           }
//                         >
//                           {curr.attendanceRate - prev.attendanceRate >= 0 ? "▲" : "▼"}
//                           {Math.abs(curr.attendanceRate - prev.attendanceRate)}%
//                         </div>
//                         <p className="text-xs text-gray-500">
//                           vs {prev.year}
//                         </p>
//                       </>
//                     ) : (
//                       <div className="text-sm">N/A</div>
//                     )}
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
            
//             {/* Predicted Attendance */}
//             <Card className="bg-white border border-[#C0D5DE] shadow-sm hover:shadow-md transition-shadow">
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-base text-gray-600">
//                   AI Predicted Attendance (2025)
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex items-baseline justify-between">
//                   <div className="flex items-center">
//                     <CalendarCheck2 className="h-5 w-5 text-[#03787c] mr-2" />
//                     <div className="text-3xl font-bold">
//                       {pred ? `${pred.attendanceRate}%` : "--"}
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     {pred && curr ? (
//                       <>
//                         <div
//                           className={
//                             pred.attendanceRate - curr.attendanceRate >= 0
//                               ? "text-[#03787c] font-semibold"
//                               : "text-red-600 font-semibold"
//                           }
//                         >
//                           {pred.attendanceRate - curr.attendanceRate >= 0 ? "▲" : "▼"}
//                           {Math.abs(pred.attendanceRate - curr.attendanceRate)}%
//                         </div>
//                         <p className="text-xs text-gray-500">
//                           vs {curr.year}
//                         </p>
//                       </>
//                     ) : (
//                       <div className="text-sm">N/A</div>
//                     )}
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Trend Chart */}
//           <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
//             <h3 className="text-lg font-bold mb-4">Attendance Trend</h3>
//             <AttendanceTrend data={trend} />
//           </div>

//           {/* Attendance History */}
//           {curr && pred && (
//             <div className="bg-white rounded-lg shadow-sm p-6">
//               <h3 className="text-lg font-bold mb-4">Attendance History</h3>
//               <AttendanceHistory history={history} predicted={pred} />
//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// };

// export default Index;

//2nd iteration with improved filter handling and error handling
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
//   districtName?: string;
//   schoolName?: string;
//   studentId?: number;
//   grade?: number;
// }

// interface Filters {
//   district: string | null;
//   school: string | null;
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
//   const [history, setHistory] = useState<AttendanceData[]>([]);
//   const [pred, setPred] = useState<AttendanceData | null>(null);
//   const [trend, setTrend] = useState<any[]>([]);
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
//   // Combined filter state
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
//         const studentsData = Array.isArray(r.data) ? r.data : [];
//         setStudents(studentsData);
//         if (studentsData.length > 1) {
//           setFilters(prev => ({ ...prev, student: studentsData[1] }));
//         }
//       })
//       .catch((error) => {
//         console.error("Failed to fetch students", error);
//         setStudents([]);
//       });
//   }, []);

//   // Fetch filtered data
//   const fetchFilteredData = useCallback(async () => {
//     const { district, school, grade, student } = filters;
    
//     // Clear data if no filters are selected
//     if (!district && !school && !grade && !student) {
//       setPred(null);
//       setHistory([]);
//       setTrend([]);
//       return;
//     }

//     const filterRequest: FilterRequest = {};
    
//     if (district) filterRequest.districtName = district;
//     if (school) filterRequest.schoolName = school;
//     if (grade) {
//       const gradeNum = gradeStringToNumber(grade);
//       if (gradeNum !== -3) filterRequest.grade = gradeNum;
//     }
//     if (student && !district && !school && !grade) {
//       filterRequest.studentId = parseInt(student.id);
//     }

//     try {
//       const [detailsResponse, metricsResponse, trendResponse] = await Promise.all([
//         axiosInstance.post('/StudentDetails/ByFilters', filterRequest),
//         axiosInstance.post('/StudentMetrics/ByFilters', filterRequest),
//         axiosInstance.post('/StudentSummaryTrend/ByFilters', filterRequest)
//       ]);

//       setPred(detailsResponse.data?.predictedAttendance || null);
//       setHistory(Array.isArray(metricsResponse.data) ? metricsResponse.data : []);
//       setTrend(Array.isArray(trendResponse.data) ? trendResponse.data : []);

//     } catch (error) {
//       console.error("Failed to fetch filtered data", error);
//       setPred(null);
//       setHistory([]);
//       setTrend([]);
//     }
//   }, [filters]);

//   useEffect(() => {
//     fetchFilteredData();
//   }, [fetchFilteredData]);

//   // Helper functions for display
//   const getDisplayInfo = () => {
//     const { district, school, grade, student } = filters;
    
//     if (student && !district && !school && !grade) {
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
//     if (school) parts.push(`School: ${school}`);
//     if (district) parts.push(`District: ${district}`);
    
//     return {
//       title: parts.length > 0 ? parts.join(" | ") : "No filters selected",
//       subtitle: <div className="text-sm text-gray-500 mt-1">Showing aggregated data for selected filters</div>
//     };
//   };

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

//           {/* Metrics Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
//             <MetricCard
//               title="Attendance Rate (2024)"
//               value={curr ? `${curr.attendanceRate}%` : "--"}
//               comparison={curr && prev ? curr.attendanceRate - prev.attendanceRate : undefined}
//               comparisonYear={prev?.year}
//             />
            
//             <MetricCard
//               title="AI Predicted Attendance (2025)"
//               value={pred ? `${pred.attendanceRate}%` : "--"}
//               comparison={pred && curr ? pred.attendanceRate - curr.attendanceRate : undefined}
//               comparisonYear={curr?.year}
//             />
//           </div>

//           {/* Charts */}
//           <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
//             <h3 className="text-lg font-bold mb-4">Attendance Trend</h3>
//             <AttendanceTrend data={trend} />
//           </div>

//           {curr && pred && (
//             <div className="bg-white rounded-lg shadow-sm p-6">
//               <h3 className="text-lg font-bold mb-4">Attendance History</h3>
//               <AttendanceHistory history={history} predicted={pred} />
//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// };

// export default Index;


//3rd with student_ID
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
//   districtName?: string;
//   schoolName?: string;
//   studentId?: number;
//   grade?: number;
// }

// interface Filters {
//   district: string | null;
//   school: string | null;
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
//   const [history, setHistory] = useState<AttendanceData[]>([]);
//   const [pred, setPred] = useState<AttendanceData | null>(null);
//   const [trend, setTrend] = useState<any[]>([]);
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
//   // Combined filter state
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
//         const studentsData = Array.isArray(r.data) ? r.data : [];
//         setStudents(studentsData);
//         if (studentsData.length > 1) {
//           setFilters(prev => ({ ...prev, student: studentsData[1] }));
//         }
//       })
//       .catch((error) => {
//         console.error("Failed to fetch students", error);
//         setStudents([]);
//       });
//   }, []);

//   // Fetch filtered data
//   const fetchFilteredData = useCallback(async () => {
//     const { district, school, grade, student } = filters;
    
//     // Clear data if no filters are selected
//     if (!district && !school && !grade && !student) {
//       setPred(null);
//       setHistory([]);
//       setTrend([]);
//       return;
//     }

//     const filterRequest: FilterRequest = {};
    
//     if (district) filterRequest.districtName = district;
//     if (school) filterRequest.schoolName = school;
//     if (grade) {
//       const gradeNum = gradeStringToNumber(grade);
//       if (gradeNum !== -3) filterRequest.grade = gradeNum;
//     }
//     // Always include studentId if a student is selected, regardless of other filters
//     if (student) {
//       filterRequest.studentId = parseInt(student.id);
//     }

//     try {
//       const [detailsResponse, metricsResponse, trendResponse] = await Promise.all([
//         axiosInstance.post('/StudentDetails/ByFilters', filterRequest),
//         axiosInstance.post('/StudentMetrics/ByFilters', filterRequest),
//         axiosInstance.post('/StudentSummaryTrend/ByFilters', filterRequest)
//       ]);

//       setPred(detailsResponse.data?.predictedAttendance || null);
//       setHistory(Array.isArray(metricsResponse.data) ? metricsResponse.data : []);
//       setTrend(Array.isArray(trendResponse.data) ? trendResponse.data : []);

//     } catch (error) {
//       console.error("Failed to fetch filtered data", error);
//       setPred(null);
//       setHistory([]);
//       setTrend([]);
//     }
//   }, [filters]);

//   useEffect(() => {
//     fetchFilteredData();
//   }, [fetchFilteredData]);

//   // Helper functions for display
//   const getDisplayInfo = () => {
//     const { district, school, grade, student } = filters;
    
//     if (student && !district && !school && !grade) {
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
//     if (school) parts.push(`School: ${school}`);
//     if (district) parts.push(`District: ${district}`);
    
//     return {
//       title: parts.length > 0 ? parts.join(" | ") : "No filters selected",
//       subtitle: <div className="text-sm text-gray-500 mt-1">Showing aggregated data for selected filters</div>
//     };
//   };

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

//           {/* Metrics Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
//             <MetricCard
//               title="Attendance Rate (2024)"
//               value={curr ? `${curr.attendanceRate}%` : "--"}
//               comparison={curr && prev ? curr.attendanceRate - prev.attendanceRate : undefined}
//               comparisonYear={prev?.year}
//             />
            
//             <MetricCard
//               title="AI Predicted Attendance (2025)"
//               value={pred ? `${pred.attendanceRate}%` : "--"}
//               comparison={pred && curr ? pred.attendanceRate - curr.attendanceRate : undefined}
//               comparisonYear={curr?.year}
//             />
//           </div>

//           {/* Charts */}
//           <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
//             <h3 className="text-lg font-bold mb-4">Attendance Trend</h3>
//             <AttendanceTrend data={trend} />
//           </div>

//           {curr && pred && (
//             <div className="bg-white rounded-lg shadow-sm p-6">
//               <h3 className="text-lg font-bold mb-4">Attendance History</h3>
//               <AttendanceHistory history={history} predicted={pred} />
//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// };

// export default Index;



//Claude recent
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
//   districtName?: string;
//   schoolName?: string;
//   studentId?: number;
//   grade?: number;
// }

// interface Filters {
//   district: string | null;
//   school: string | null;
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
  
//   // Combined filter state
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
//         if (studentsData.length > 1) {
//           setFilters(prev => ({ ...prev, student: studentsData[1] }));
//         }
//       })
//       .catch((error) => {
//         console.error("Failed to fetch students", error);
//         setStudents([]);
//       });
//   }, []);

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
//     if (school ) {
//       return '/SchoolData/ByFilters';
//     }
    
//     // District level
//     if (district) {
//       return '/DistrictData/ByFilters';
//     }
    
//     return null;
//   }, [filters]);

//   // Fetch filtered data
//   const fetchFilteredData = useCallback(async () => {
//     const { district, school, grade, student } = filters;
    
//     // Clear data if no filters are selected
//     if (!district && !school && !grade && !student) {
//       setAttendanceData(null);
//       return;
//     }

//     const endpoint = getApiEndpoint();
//     if (!endpoint) {
//       setAttendanceData(null);
//       return;
//     }

//     const filterRequest: FilterRequest = {};
    
//     // Build filter request based on selected filters
//     if (district) filterRequest.districtName = district;
//     if (school) filterRequest.schoolName = school;
//     if (grade) {
//       const gradeNum = gradeStringToNumber(grade);
//       if (gradeNum !== -3) filterRequest.grade = gradeNum;
//     }
//     if (student) {
//       filterRequest.studentId = parseInt(student.id);
//     }

//     try {
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
//     if (school) parts.push(`School: ${school}`);
//     if (district) parts.push(`District: ${district}`);
    
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


//Modified Index.tsx - Key changes for all districts on startup

import React, { useEffect, useState, useCallback } from "react";
import { Student, AttendanceData, RiskCategory } from "@/types";
import { StudentSelector } from "@/components/StudentSelector";
import { AttendanceTrend } from "@/components/AttendanceTrend";
import { AttendanceHistory } from "@/components/AttendanceHistory";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarCheck2, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { setAuthToken } from "@/lib/axios";
import axios from 'axios';

interface FilterRequest {
  districtName?: string;
  schoolName?: string;
  studentId?: number;
  grade?: number;
}

interface Filters {
  district: string | null;
  school: string | null;
  grade: string | null;
  student: Student | null;
}

const API = "http://localhost:8000";

const gradeStringToNumber = (gradeStr: string): number => {
  if (gradeStr === "Pre-Kindergarten") return -1;
  if (gradeStr === "Kindergarten") return 0;
  const match = gradeStr.match(/^(\d+)/);
  return match ? parseInt(match[1]) : -3;
};

const Index: React.FC = () => {
  // State management
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Combined filter state - ALL START AS NULL
  const [filters, setFilters] = useState<Filters>({
    district: null,
    school: null,
    grade: null,
    student: null,
  });
  
  const { token } = useAuth();
  
  const axiosInstance = axios.create({ baseURL: API });

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  // Fetch students on mount
  useEffect(() => {
    axiosInstance.get('/students')
      .then((r) => {
        const studentsData = Array.isArray(r.data.students) ? r.data.students : [];
        setStudents(studentsData);
        // REMOVED: Auto-selection of student - now starts with no filters
      })
      .catch((error) => {
        console.error("Failed to fetch students", error);
        setStudents([]);
      });
  }, []);

  // Determine which API endpoint to use based on filter hierarchy
  const getApiEndpoint = useCallback(() => {
    const { district, school, grade, student } = filters;
    
    // Student level - highest priority
    if (student) {
      return '/StudentDetails/ByFilters';
    }
    
    // Grade level
    if (grade && (district || school)) {
      return '/GradeDetails/ByFilters';
    }
    
    // School level
    if (school) {
      return '/SchoolData/ByFilters';
    }
    
    // District level
    if (district) {
      return '/DistrictData/ByFilters';
    }
    
    // NEW: If no filters selected, show all districts data
    return '/AllDistrictsData';
  }, [filters]);

  // Fetch filtered data
  const fetchFilteredData = useCallback(async () => {
    const { district, school, grade, student } = filters;
    
    const endpoint = getApiEndpoint();
    if (!endpoint) {
      setAttendanceData(null);
      return;
    }

    try {
      // NEW: Handle AllDistrictsData endpoint (GET request)
      if (endpoint === '/AllDistrictsData') {
        console.log('Calling AllDistrictsData endpoint');
        const response = await axiosInstance.get(endpoint);
        
        if (response.data.message) {
          console.log("API message:", response.data.message);
          setAttendanceData(null);
          return;
        }
        
        setAttendanceData(response.data);
        return;
      }

      // Handle other endpoints (POST requests with filters)
      const filterRequest: FilterRequest = {};
      
      // Build filter request based on selected filters
      if (district) filterRequest.districtName = district;
      if (school) filterRequest.schoolName = school;
      if (grade) {
        const gradeNum = gradeStringToNumber(grade);
        if (gradeNum !== -3) filterRequest.grade = gradeNum;
      }
      if (student) {
        filterRequest.studentId = parseInt(student.id);
      }

      console.log(`Calling ${endpoint} with filters:`, filterRequest);
      
      const response = await axiosInstance.post(endpoint, filterRequest);
      
      if (response.data.message) {
        console.log("API message:", response.data.message);
        setAttendanceData(null);
        return;
      }
      
      setAttendanceData(response.data);

    } catch (error) {
      console.error("Failed to fetch filtered data", error);
      setAttendanceData(null);
    }
  }, [filters, getApiEndpoint]);

  useEffect(() => {
    fetchFilteredData();
  }, [fetchFilteredData]);

  // Helper functions for display
  const getDisplayInfo = () => {
    const { district, school, grade, student } = filters;
    
    // NEW: Handle case when no filters are selected
    if (!district && !school && !grade && !student) {
      return {
        title: "All Districts Combined",
        subtitle: (
          <div className="flex gap-4 text-sm text-gray-500 mt-1">
            <span>Showing aggregated data across all districts</span>
            <span>Total Students: {students.length}</span>
          </div>
        )
      };
    }
    
    if (student) {
      return {
        title: `Student: ${student.id}`,
        subtitle: (
          <div className="flex gap-4 text-sm text-gray-500 mt-1">
            <span>Grade: {student.grade}</span>
            <span>School: {student.schoolName}</span>
            <span>District: {student.districtName}</span>
          </div>
        )
      };
    }
    
    const parts = [];
    if (grade) parts.push(`Grade: ${grade}`);
    if (school) parts.push(`School: ${school}`);
    if (district) parts.push(`District: ${district}`);
    
    return {
      title: parts.length > 0 ? parts.join(" | ") : "No filters selected",
      subtitle: <div className="text-sm text-gray-500 mt-1">Showing aggregated data for selected filters</div>
    };
  };

  // Process attendance data for components
  const processedData = React.useMemo(() => {
    if (!attendanceData) {
      return {
        history: [],
        pred: null,
        trend: []
      };
    }

    // Convert metrics to history format
    const history = attendanceData.metrics ? attendanceData.metrics.map((metric: any) => ({
      year: parseInt(metric.year),
      attendanceRate: metric.attendanceRate,
      unexcused: metric.unexcused,
      present: metric.present,
      total: metric.total
    })) : [];

    // Get predicted attendance
    const pred = attendanceData.predictedAttendance ? {
      year: parseInt(attendanceData.predictedAttendance.year),
      attendanceRate: attendanceData.predictedAttendance.attendanceRate,
      total: attendanceData.predictedAttendance.total
    } : null;

    // Get trend data
    const trend = attendanceData.trend ? attendanceData.trend.map((item: any) => ({
      year: parseInt(item.year),
      value: item.value,
      isPredicted: item.isPredicted
    })) : [];

    return { history, pred, trend };
  }, [attendanceData]);

  const { history, pred, trend } = processedData;

  // Calculate metrics
  const curr = history[history.length - 1] ?? null;
  const prev = history[history.length - 2] ?? null;
  const { title, subtitle } = getDisplayInfo();

  // Metric card component
  const MetricCard = ({ 
    title, 
    value, 
    comparison, 
    comparisonYear 
  }: { 
    title: string; 
    value: string; 
    comparison?: number; 
    comparisonYear?: number; 
  }) => (
    <Card className="bg-white border border-[#C0D5DE] shadow-sm hover:shadow-md transition-shadow">
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
                  {comparison >= 0 ? "▲" : "▼"}{Math.abs(comparison)}%
                </div>
                <p className="text-xs text-gray-500">vs {comparisonYear}</p>
              </>
            ) : (
              <div className="text-sm">N/A</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">AI-Driven Attendance Analytics</h1>
          <p className="text-gray-500 mt-1">Track and analyze student attendance patterns</p>
        </div>
      </header>

      <div className="w-full flex">
        {/* Sidebar */}
        <aside className={`bg-white border-r border-[#C0D5DE] shadow-sm transition-all duration-300 ${
          sidebarCollapsed ? "w-14" : "w-80"
        } h-[calc(100vh-73px)] sticky top-[73px]`}>
          {!sidebarCollapsed ? (
            <div className="p-5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-700">Filters</h2>
                <button 
                  onClick={() => setSidebarCollapsed(true)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <StudentSelector
                students={students}
                selectedStudent={filters.student}
                onSelect={(student) => setFilters(prev => ({ ...prev, student }))}
                onFiltersChange={setFilters}
                selectedDistrict={filters.district}
                selectedSchool={filters.school}
                selectedGrade={filters.grade}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center pt-5">
              <button 
                onClick={() => setSidebarCollapsed(false)}
                className="flex flex-col items-center justify-center p-2 text-[#03787c] hover:text-[#026266] focus:outline-none"
              >
                <Filter className="h-6 w-6 mb-1" />
                <span className="text-xs rotate-90 mt-2">Filters</span>
              </button>
            </div>
          )}
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-6 bg-gray-50">
          {/* Info Header */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <h2 className="text-xl font-bold">{title}</h2>
            {subtitle}
          </div>

          {/* Show current API endpoint being used (for debugging) */}
          <div className="bg-blue-50 rounded-lg p-3 mb-6 text-sm text-blue-700">
            <strong>Current API:</strong> {getApiEndpoint() || 'None selected'}
            {attendanceData && (
              <div className="mt-1">
                <strong>Data available:</strong> 
                Attendance 2024: {attendanceData.attendance2024}%, 
                Predicted 2025: {attendanceData.predicted2025}%
              </div>
            )}
          </div>

          {/* Metrics Cards */}
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

          {/* Charts */}
          {trend.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Attendance Trend</h3>
              <AttendanceTrend data={trend} />
            </div>
          )}

          {history.length > 0 && pred && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">Attendance History</h3>
              <AttendanceHistory history={history} predicted={pred} />
            </div>
          )}

          {/* Show raw data for debugging */}
          {attendanceData && (
            <div className="bg-gray-100 rounded-lg p-4 mt-6">
              <h4 className="font-bold mb-2">Debug - Raw API Response:</h4>
              <pre className="text-xs overflow-auto max-h-64">
                {JSON.stringify(attendanceData, null, 2)}
              </pre>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;