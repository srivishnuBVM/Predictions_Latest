// import React, { useState, useEffect } from "react";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { ChevronDown, ChevronUp, Globe, AlertCircle, Download } from "lucide-react";

// // Declare the global property to fix TypeScript errors
// declare global {
//   interface Window {
//     _schoolGradeMap: Record<string, any>;
//   }
// }

// const AlertsDashboard = () => {
//   const [district, setDistrict] = useState("");
//   const [school, setSchool] = useState("");
//   const [grade, setGrade] = useState("");

//   const [districtOptions, setDistrictOptions] = useState([]);
//   const [schoolOptions, setSchoolOptions] = useState([]);
//   const [gradeOptions, setGradeOptions] = useState([]);

//   const [analysisData, setAnalysisData] = useState(null);
//   const [loading, setLoading] = useState(true); // Start with loading true for initial data fetch
//   const [error, setError] = useState(null);
//   const [isGlobalView, setIsGlobalView] = useState(false);
//   const [allSchoolOptions, setAllSchoolOptions] = useState([]);
//   const [allGradeOptions, setAllGradeOptions] = useState([]);
  
//   // Store hierarchical data from the backend
//   const [hierarchicalData, setHierarchicalData] = useState([]);

//   const [showFilters, setShowFilters] = useState(true);
//   const [isInitialLoad, setIsInitialLoad] = useState(true);
//   const [loadTimer, setLoadTimer] = useState(null);

//   // Combined fetch function to reduce multiple requests
//   const fetchInitialData = async () => {
//     setLoading(true);
//     setError(null);

//     // Clear any existing timer
//     if (loadTimer) {
//       clearTimeout(loadTimer);
//     }

//     try {
//       // Try to fetch filter options first
//       const filterRes = await fetch(`http://127.0.0.1:8001/api/filter-options`);
      
//       if (filterRes.ok) {
//         const filterData = await filterRes.json();
        
//         setDistrictOptions(filterData.districts || []);
//         setAllSchoolOptions(filterData.schools || []);
//         setAllGradeOptions(filterData.grades || []); 
//         setGradeOptions(filterData.grades || []);    
//         setSchoolOptions([]);
        
//         // Store school to grade mapping for direct lookup
//         const schoolGradeMap = new Map();
        
//         // If filter options were successful, try to fetch global analysis
//         try {
//           const analysisRes = await fetch(`http://127.0.0.1:8001/api/global-analysis`);
//           if (analysisRes.ok) {
//             const analysisData = await analysisRes.json();
//             setAnalysisData(analysisData);
//             setIsGlobalView(true);
//             setIsInitialLoad(false);
//           } else {
//             throw new Error("Failed to load dashboard data");
//           }
//         } catch (analysisErr) {
//           console.error("Error fetching analysis:", analysisErr);
//         }
//       } else {
//         // If server is not ready, set a simple loading message
//         setError("Server is starting up. Please wait...");
        
//         // Schedule a single retry with increasing timeout
//         const timer = setTimeout(() => {
//           fetchInitialData();
//         }, 3000);
        
//         setLoadTimer(timer);
//       }
//     } catch (err) {
//       console.error("Error fetching initial data:", err);
      
//       // Schedule a single retry
//       const timer = setTimeout(() => {
//         fetchInitialData();
//       }, 3000);
      
//       setLoadTimer(timer);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchInitialData();
    
//     // Cleanup function to clear any pending timeouts
//     return () => {
//       if (loadTimer) {
//         clearTimeout(loadTimer);
//       }
//     };
//   }, []);

//   useEffect(() => {
//     const trimmedDistrict = district.trim();
//     if (trimmedDistrict) {
//       const filteredSchools = allSchoolOptions.filter(
//         (s) => s.district.trim() === trimmedDistrict
//       );
//       setSchoolOptions(filteredSchools);
//     } else {
//       setSchoolOptions(allSchoolOptions); // Show all schools if no district selected
//     }
  
//     // Don't reset selected school unless it becomes invalid
//     if (
//       school &&
//       trimmedDistrict &&
//       !allSchoolOptions.find(
//         (s) => s.district.trim() === trimmedDistrict && s.value === school
//       )
//     ) {
//       setSchool("");
//     }
  
//     // Always reset grade when district changes
//     setGrade("");
    
//     // Reset grade options to all available when district changes
//     setGradeOptions(allGradeOptions);
//   }, [district, allSchoolOptions]);
  
//   // Update grade options when school changes - OPTIMIZED VERSION
//   useEffect(() => {
//     // Skip if no school selected
//     if (!school) {
//       setGradeOptions(allGradeOptions);
//       setGrade("");
//       return;
//     }
    
//     // Show loading state for grades dropdown
//     setGradeOptions([{ value: "loading", label: "Loading grades..." }]);
    
//     // PARALLEL API CALLS FOR PERFORMANCE
//     const getGradesForSchool = async () => {
//       // Use grades from allGradeOptions instead of hardcoded values
//       const availableGrades = allGradeOptions.map(grade => grade.value);
      
//       // Make all API calls in parallel for much faster response
//       const promises = availableGrades.map(grade => 
//         fetch(`http://127.0.0.1:8001/api/analysis?school_name=${encodeURIComponent(school)}&grade_level=${grade}`)
//           .then(res => {
//             if (res.ok) {
//               return res.json().then(data => {
//                 if (data?.summary_statistics?.total_students > 0) {
//                   // Return the grade if it has students
//                   return grade;
//                 }
//                 return null;
//               });
//             }
//             return null; // Skip errors - they just mean this grade doesn't exist
//           })
//           .catch(() => null) // Silently handle errors
//       );
      
//       // Wait for all API calls to complete in parallel
//       const results = await Promise.all(promises);
      
//       // Filter out nulls to get valid grades
//       const validGradeValues = results.filter(Boolean);
      
//       if (validGradeValues.length > 0) {
//         // Map to grade objects from allGradeOptions
//         const validGrades = validGradeValues
//           .map(value => allGradeOptions.find(g => g.value === value))
//           .filter(Boolean); // Remove any undefined values
        
//         setGradeOptions(validGrades);
//       } else {
//         // Fallback to all grades if none found
//         setGradeOptions(allGradeOptions);
//       }
      
//       // Reset selected grade
//       setGrade("");
//     };
    
//     // Execute with small timeout to ensure UI responsiveness
//     const timerId = setTimeout(() => {
//       getGradesForSchool();
//     }, 100);
    
//     // Cleanup on unmount or when school changes
//     return () => clearTimeout(timerId);
//   }, [school, allGradeOptions]);

//   const fetchAnalysis = async () => {
//     setLoading(true);
//     setError(null);
//     setIsGlobalView(false);
  
//     try {
//       const params = new URLSearchParams();
//       if (district) params.append("district_name", district.trimEnd() + " ");
//       if (school) params.append("school_name", school);
//       if (grade) params.append("grade_level", grade);
  
//       const res = await fetch(`http://127.0.0.1:8001/api/analysis?${params.toString()}`, {
//         method: "GET",
//         headers: { Accept: "application/json" },
//       });
  
//       if (!res.ok) {
//         if (res.status === 503) {
//           setError("Server is starting up. Please wait...");
//           return;
//         } else {
//           throw new Error("Failed to load dashboard data");
//         }
//       }
  
//       const contentType = res.headers.get("content-type");
//       if (!contentType || !contentType.includes("application/json")) {
//         throw new Error("Invalid response format");
//       }
  
//       const data = await res.json();
//       setAnalysisData(data);
//       setError(null);
//     } catch (err) {
//       console.error("Error fetching analysis:", err);
//       if (!err.message.includes("starting up")) {
//         setError("Failed to load data. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchGlobalAnalysis = async () => {
//     setLoading(true);
//     setError(null);
//     setIsGlobalView(true);
    
//     try {
//       const res = await fetch(`http://127.0.0.1:8001/api/global-analysis`, {
//         method: "GET",
//         headers: { Accept: "application/json" },
//       });

//       if (!res.ok) {
//         if (res.status === 503) {
//           setError("Server is starting up. Please wait...");
//           return;
//         } else {
//           throw new Error("Failed to load dashboard data");
//         }
//       }

//       const contentType = res.headers.get("content-type");
//       if (!contentType || !contentType.includes("application/json")) {
//         throw new Error("Invalid response format");
//       }

//       const data = await res.json();
//       setAnalysisData(data);
//       setError(null);
//     } catch (err) {
//       console.error("Error fetching global analysis:", err);
//       if (!err.message.includes("starting up")) {
//         setError("Failed to load data. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   const resetFilters = () => {
//     setDistrict("");
//     setSchool("");
//     setGrade("");
//     setGradeOptions(allGradeOptions); // Reset to all available grades
//     setIsGlobalView(false);
//     fetchGlobalAnalysis();
//   };

//   const handleDownloadReport = async (reportType = "summary") => {
//     try {
//       const queryParams = new URLSearchParams();
//       if (grade) queryParams.append("grade_level", grade);
//       if (school) queryParams.append("school_name", school);
//       if (district) queryParams.append("district_name", district.trimEnd() + " ");
  
//       const res = await fetch(`http://127.0.0.1:8001/api/download/${reportType}?${queryParams}`, {
//         method: "GET",
//       });
  
//       if (!res.ok) throw new Error(`Failed to download ${reportType} report`);
  
//       const blob = await res.blob();
//       const url = window.URL.createObjectURL(blob);
  
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `${reportType}_report.xlsx`;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (err) {
//       console.error("Download error:", err);
//       alert(`Failed to download ${reportType} report: ${err.message}`);
//     }
//   };
  
//   const handleDownloadBelow85Report = () => {
//     handleDownloadReport("below_85");
//   };

//   // Render loading skeleton for cards
//   const renderSkeletonCards = () => {
//     return (
//       <>
//         {[1, 2, 3, 4, 5].map((i) => (
//           <Card key={i} className="animate-pulse h-32">
//             <CardHeader className="pb-2"><div className="h-5 bg-gray-200 rounded w-24"></div></CardHeader>
//             <CardContent><div className="h-8 bg-gray-200 rounded w-16"></div></CardContent>
//           </Card>
//         ))}
//       </>
//     );
//   };

//   // Render school options with unique keys
//   const renderSchoolOptions = () => {
//     return (
//       <>
//         <option value="">Select School</option>
//         {schoolOptions.map((s, index) => (
//           <option 
//             key={`${s.value}-${s.district}-${index}`} 
//             value={s.value}
//           >
//             {s.label}
//           </option>
//         ))}
//       </>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50/50">
//       <div className="container mx-auto px-4 py-4 max-w-full">
//         {/* Header section with consistent spacing */}
//         <div className="mb-4">
//           <div className="flex justify-between items-center flex-wrap gap-2">
//             <div>
//               <h1 className="text-2xl font-bold">Alerts Dashboard</h1>
//               <p className="text-sm text-muted-foreground">Monitor alerts and notifications</p>
//             </div>
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => setShowFilters(!showFilters)}
//                 className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
//               >
//                 {showFilters ? "Hide Filters" : "Show Filters"}
//                 {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
//               </button>
//             </div>
//           </div>
//           <div className="w-full h-0.5 bg-gray-200 mt-2"></div>
//         </div>

//         <div className="flex w-full min-h-screen flex-col md:flex-row gap-4">
//           {/* Filter section with fixed width and consistent layout */}
//           {showFilters && (
//             <div className="w-full md:w-64 p-4 bg-white shadow rounded-md h-fit sticky top-4">
//               <div className="mb-4">
//                 <label className="block text-sm font-medium mb-1">District</label>
//                 <select
//                   value={district}
//                   onChange={(e) => setDistrict(e.target.value)}
//                   className="w-full p-2 border rounded text-sm"
//                   disabled={isInitialLoad}
//                 >
//                   <option value="">Select District</option>
//                   {districtOptions.map((d) => (
//                     <option key={d.value} value={d.value}>
//                       {d.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
              
//               <div className="mb-4">
//                 <label className="block text-sm font-medium mb-1">School</label>
//                 <select
//                   value={school}
//                   onChange={(e) => setSchool(e.target.value)}
//                   className="w-full p-2 border rounded text-sm"
//                   disabled={!schoolOptions.length || isInitialLoad}
//                 >
//                   {renderSchoolOptions()}
//                 </select>
//               </div>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium mb-1">Grade</label>
//                 <select
//                   value={grade}
//                   onChange={(e) => setGrade(e.target.value)}
//                   className="w-full p-2 border rounded text-sm"
//                   disabled={!gradeOptions.length || isInitialLoad}
//                 >
//                   <option value="">Select Grade</option>
//                   {gradeOptions.map((g) => (
//                     <option key={g.value} value={g.value}>
//                       {g.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div className="flex gap-2">
//                 <button
//                   onClick={fetchAnalysis}
//                   className={`bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 w-full ${
//                     isInitialLoad ? "opacity-50 cursor-not-allowed" : ""
//                   }`}
//                   disabled={isInitialLoad}
//                 >
//                   Search
//                 </button>
//                 <button
//                   onClick={resetFilters}
//                   className={`bg-gray-300 text-gray-800 px-3 py-2 rounded text-sm hover:bg-gray-400 w-full ${
//                     isInitialLoad ? "opacity-50 cursor-not-allowed" : ""
//                   }`}
//                   disabled={isInitialLoad}
//                 >
//                   Reset
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Main Dashboard with consistent card sizing */}
//           <div className="flex-1 overflow-x-auto">
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-2">
//               {/* Server starting notification */}
//               {error && (
//                 <div className="col-span-full">
//                   <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
//                     <div className="flex">
//                       <div className="flex-shrink-0">
//                         <svg className="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                         </svg>
//                       </div>
//                       <div className="ml-3">
//                         <p className="text-sm text-yellow-700">{error}</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {isGlobalView && analysisData && (
//                 <div className="col-span-full">
//                   <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
//                     <div className="flex">
//                       <div className="flex-shrink-0">
//                         <Globe className="h-5 w-5 text-blue-500" />
//                       </div>
//                       <div className="ml-3">
//                         <p className="text-sm text-blue-700">
//                           Viewing Global Analysis - Showing data for all districts, schools, and grades
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
              
//               {/* Loading state */}
//               {(loading || isInitialLoad) && !error && (
//                 <>
//                   <div className="flex justify-center items-center col-span-full mb-2">
//                     <div className="flex items-center justify-center gap-2">
//                       <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                       </svg>
//                       <p className="text-blue-700 text-sm">Loading dashboard data...</p>
//                     </div>
//                   </div>
//                   {renderSkeletonCards()}
//                 </>
//               )}
            
//               {/* Dashboard cards - standardized height and layout */}
//               {!loading && !isInitialLoad && analysisData && (
//                 <>
//                   {/* Standardized card for Total Students */}
//                   <Card className="bg-orange-50 border border-orange-200 h-32">
//                     <CardHeader className="pb-1 pt-3">
//                       <CardTitle className="text-base flex items-center gap-1">
//                         Total Students
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent className="pb-3 pt-1 flex justify-between items-center">
//                       <span className="text-xl font-semibold">
//                         {analysisData.summary_statistics.total_students}
//                       </span>
//                       <button 
//                         onClick={() => handleDownloadReport("summary")}
//                         className="text-xs bg-orange-500 text-white p-1 rounded flex items-center gap-1"
//                         title="Download Summary Report"
//                       >
//                         <Download size={12} />
//                         Export
//                       </button>
//                     </CardContent>
//                   </Card>

//                   {/* Standardized card for At Risk Students */}
//                   <Card className="h-32">
//                     <CardHeader className="pb-1 pt-3">
//                       <CardTitle className="text-base">At Risk Students</CardTitle>
//                     </CardHeader>
//                     <CardContent className="pb-3 pt-1">
//                       <span className="text-xl font-semibold">
//                         {analysisData.summary_statistics.at_risk_students}
//                       </span>
//                     </CardContent>
//                   </Card>

//                   {/* Standardized card for Below 85% Attendance */}
//                   <Card className="bg-orange-50 border-orange-200 h-32">
//                     <CardHeader className="pb-1 pt-3">
//                       <CardTitle className="text-base flex items-center gap-1">
//                         <AlertCircle size={14} className="text-orange-500" />
//                         Below 85% Attendance
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent className="pb-3 pt-1 flex justify-between items-center">
//                       <span className="text-xl font-semibold">
//                         {analysisData.summary_statistics.below_85_students}
//                       </span>
//                       <button
//                         onClick={handleDownloadBelow85Report}
//                         className="text-xs bg-orange-500 text-white p-1 rounded flex items-center gap-1"
//                         title="Download Below 85% Report"
//                       >
//                         <Download size={12} />
//                         Export
//                       </button>
//                     </CardContent>
//                   </Card>

//                   {/* Standardized card for Critical Risk Students */}
//                   <Card className="h-32">
//                     <CardHeader className="pb-1 pt-3">
//                       <CardTitle className="text-base">Critical Risk Students</CardTitle>
//                     </CardHeader>
//                     <CardContent className="pb-3 pt-1">
//                       <span className="text-xl font-semibold">
//                         {analysisData.summary_statistics.critical_risk_students}
//                       </span>
//                     </CardContent>
//                   </Card>

//                   {/* Standardized card for Tier 4 Students */}
//                   <Card className="h-32">
//                     <CardHeader className="pb-1 pt-3">
//                       <CardTitle className="text-base">Tier 4 Students</CardTitle>
//                     </CardHeader>
//                     <CardContent className="pb-3 pt-1">
//                       <span className="text-xl font-semibold">
//                         {analysisData.summary_statistics.tier4_students}
//                       </span>
//                     </CardContent>
//                   </Card>

//                   {/* Improved UI for Key Insights with fixed padding and consistent text size */}
//                   <div className="col-span-full mt-4">
//                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//                       {/* Key Insights */}
//                       {analysisData.key_insights?.length > 0 && (
//                         <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md border border-blue-100 overflow-hidden">
//                           <CardHeader className="bg-blue-100/60 py-2">
//                             <CardTitle className="text-blue-800 flex items-center gap-2 text-base">
//                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                               </svg>
//                               AI DRIVEN Key Insights
//                             </CardTitle>
//                           </CardHeader>
//                           <CardContent className="pt-2 pb-3 overflow-y-auto max-h-96">
//                             <ul className="space-y-2 text-sm">
//                               {analysisData.key_insights.map((item, index) => (
//                                 <li key={index} className="flex items-start gap-2">
//                                   <span className="text-blue-500 mt-1">•</span>
//                                   <span dangerouslySetInnerHTML={{
//                                     __html: item.insight.replace(/(\d+(\.\d+)?%?)/g, "<strong class='text-blue-700'>$1</strong>")
//                                   }} />
//                                 </li>
//                               ))}
//                             </ul>
//                           </CardContent>
//                         </Card>
//                       )}
                      
//                       {/* AI Recommendations */}
//                       {analysisData.recommendations?.length > 0 && (
//                         <Card className="bg-gradient-to-br from-green-50 to-teal-50 shadow-md border border-green-100 overflow-hidden">
//                           <CardHeader className="bg-green-100/60 py-2">
//                             <CardTitle className="text-green-800 flex items-center gap-2 text-base">
//                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                               </svg>
//                               AI Recommendations
//                             </CardTitle>
//                           </CardHeader>
//                           <CardContent className="pt-2 pb-3 overflow-y-auto max-h-96">
//                             <ul className="space-y-2 text-sm">
//                               {analysisData.recommendations.map((item, index) => (
//                                 <li key={index} className="flex items-start gap-2">
//                                   <span className="text-green-500 mt-1">•</span>
//                                   <span dangerouslySetInnerHTML={{
//                                     __html: item.recommendation.replace(/(\d+(\.\d+)?%?)/g, "<strong class='text-green-700'>$1</strong>")
//                                   }} />
//                                 </li>
//                               ))}
//                             </ul>
//                           </CardContent>
//                         </Card>
//                       )}
//                     </div>
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AlertsDashboard;

// import React, { useState, useEffect } from "react";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { ChevronDown, ChevronUp, Globe, AlertCircle, Download, ArrowDown, ArrowUp } from "lucide-react";

// // Declare the global property to fix TypeScript errors
// declare global {
//   interface Window {
//     _schoolGradeMap: Record<string, any>;
//   }
// }

// const AlertsDashboard = () => {
//   const [district, setDistrict] = useState("");
//   const [school, setSchool] = useState("");
//   const [grade, setGrade] = useState("");

//   const [districtOptions, setDistrictOptions] = useState([]);
//   const [schoolOptions, setSchoolOptions] = useState([]);
//   const [gradeOptions, setGradeOptions] = useState([]);

//   const [analysisData, setAnalysisData] = useState(null);
//   const [loading, setLoading] = useState(true); // Start with loading true for initial data fetch
//   const [error, setError] = useState(null);
//   const [isGlobalView, setIsGlobalView] = useState(false);
//   const [allSchoolOptions, setAllSchoolOptions] = useState([]);
//   const [allGradeOptions, setAllGradeOptions] = useState([]);
  
//   // Store hierarchical data from the backend
//   const [hierarchicalData, setHierarchicalData] = useState([]);

//   const [showFilters, setShowFilters] = useState(true);
//   const [isInitialLoad, setIsInitialLoad] = useState(true);
//   const [loadTimer, setLoadTimer] = useState(null);
  
//   // State for expandable sections
//   const [expandedInsights, setExpandedInsights] = useState(true);
//   const [expandedRecommendations, setExpandedRecommendations] = useState(true);

//   // Combined fetch function to reduce multiple requests
//   const fetchInitialData = async () => {
//     setLoading(true);
//     setError(null);

//     // Clear any existing timer
//     if (loadTimer) {
//       clearTimeout(loadTimer);
//     }

//     try {
//       // Try to fetch filter options first
//       const filterRes = await fetch(`http://127.0.0.1:8001/api/filter-options`);
      
//       if (filterRes.ok) {
//         const filterData = await filterRes.json();
        
//         setDistrictOptions(filterData.districts || []);
//         setAllSchoolOptions(filterData.schools || []);
//         setAllGradeOptions(filterData.grades || []); 
//         setGradeOptions(filterData.grades || []);    
//         setSchoolOptions([]);
        
//         // Store school to grade mapping for direct lookup
//         const schoolGradeMap = new Map();
        
//         // If filter options were successful, try to fetch global analysis
//         try {
//           const analysisRes = await fetch(`http://127.0.0.1:8001/api/global-analysis`);
//           if (analysisRes.ok) {
//             const analysisData = await analysisRes.json();
//             setAnalysisData(analysisData);
//             setIsGlobalView(true);
//             setIsInitialLoad(false);
//           } else {
//             throw new Error("Failed to load dashboard data");
//           }
//         } catch (analysisErr) {
//           console.error("Error fetching analysis:", analysisErr);
//         }
//       } else {
//         // If server is not ready, set a simple loading message
//         setError("Server is starting up. Please wait...");
        
//         // Schedule a single retry with increasing timeout
//         const timer = setTimeout(() => {
//           fetchInitialData();
//         }, 3000);
        
//         setLoadTimer(timer);
//       }
//     } catch (err) {
//       console.error("Error fetching initial data:", err);
      
//       // Schedule a single retry
//       const timer = setTimeout(() => {
//         fetchInitialData();
//       }, 3000);
      
//       setLoadTimer(timer);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchInitialData();
    
//     // Cleanup function to clear any pending timeouts
//     return () => {
//       if (loadTimer) {
//         clearTimeout(loadTimer);
//       }
//     };
//   }, []);

//   useEffect(() => {
//     const trimmedDistrict = district.trim();
//     if (trimmedDistrict) {
//       const filteredSchools = allSchoolOptions.filter(
//         (s) => s.district.trim() === trimmedDistrict
//       );
//       setSchoolOptions(filteredSchools);
//     } else {
//       setSchoolOptions(allSchoolOptions); // Show all schools if no district selected
//     }
  
//     // Don't reset selected school unless it becomes invalid
//     if (
//       school &&
//       trimmedDistrict &&
//       !allSchoolOptions.find(
//         (s) => s.district.trim() === trimmedDistrict && s.value === school
//       )
//     ) {
//       setSchool("");
//     }
  
//     // Always reset grade when district changes
//     setGrade("");
    
//     // Reset grade options to all available when district changes
//     setGradeOptions(allGradeOptions);
//   }, [district, allSchoolOptions]);

//   // Update grade options when school changes - OPTIMIZED VERSION
//   useEffect(() => {
//     // Skip if no school selected
//     if (!school) {
//       setGradeOptions(allGradeOptions);
//       setGrade("");
//       return;
//     }
    
//     // Show loading state for grades dropdown
//     setGradeOptions([{ value: "loading", label: "Loading grades..." }]);
    
//     // PARALLEL API CALLS FOR PERFORMANCE
//     const getGradesForSchool = async () => {
//       // Common grade levels to check
//         const availableGrades = allGradeOptions.map(grade => grade.value);
      
//       // Make all API calls in parallel for much faster response
//       const promises = availableGrades.map(grade => 
//         fetch(`http://127.0.0.1:8001/api/analysis?school_name=${encodeURIComponent(school)}&grade_level=${grade}`)
//           .then(res => {
//             if (res.ok) {
//               return res.json().then(data => {
//                 if (data?.summary_statistics?.total_students > 0) {
//                   // Return the grade if it has students
//                   return grade;
//                 }
//                 return null;
//               });
//             }
//             return null; // Skip errors - they just mean this grade doesn't exist
//           })
//           .catch(() => null) // Silently handle errors
//       );
      
//       // Wait for all API calls to complete in parallel
//       const results = await Promise.all(promises);
      
//       // Filter out nulls to get valid grades
//       const validGradeValues = results.filter(Boolean);
      
//       if (validGradeValues.length > 0) {
//         // Map to grade objects from allGradeOptions
//         const validGrades = validGradeValues
//           .map(value => allGradeOptions.find(g => g.value === value))
//           .filter(Boolean); // Remove any undefined values
        
//         setGradeOptions(validGrades);
//       } else {
//         // Fallback to all grades if none found
//         setGradeOptions(allGradeOptions);
//       }
      
//       // Reset selected grade
//       setGrade("");
//     };
    
//     // Execute with small timeout to ensure UI responsiveness
//     const timerId = setTimeout(() => {
//       getGradesForSchool();
//     }, 100);
    
//     // Cleanup on unmount or when school changes
//     return () => clearTimeout(timerId);
//   }, [school, allGradeOptions]);

//   const fetchAnalysis = async () => {
//     setLoading(true);
//     setError(null);
//     setIsGlobalView(false);
  
//     try {
//       const params = new URLSearchParams();
//       if (district) params.append("district_name", district.trimEnd() + " ");
//       if (school) params.append("school_name", school);
//       if (grade) params.append("grade_level", grade);
  
//       const res = await fetch(`http://127.0.0.1:8001/api/analysis?${params.toString()}`, {
//         method: "GET",
//         headers: { Accept: "application/json" },
//       });
  
//       if (!res.ok) {
//         if (res.status === 503) {
//           setError("Server is starting up. Please wait...");
//           return;
//         } else {
//           throw new Error("Failed to load dashboard data");
//         }
//       }

//       const contentType = res.headers.get("content-type");
//       if (!contentType || !contentType.includes("application/json")) {
//         throw new Error("Invalid response format");
//       }
  
//       const data = await res.json();
//       setAnalysisData(data);
//       setError(null);
//     } catch (err) {
//       console.error("Error fetching analysis:", err);
//       if (!err.message.includes("starting up")) {
//         setError("Failed to load data. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   const fetchGlobalAnalysis = async () => {
//     setLoading(true);
//     setError(null);
//     setIsGlobalView(true);
    
//     try {
//       const res = await fetch(`http://127.0.0.1:8001/api/global-analysis`, {
//         method: "GET",
//         headers: { Accept: "application/json" },
//       });

//       if (!res.ok) {
//         if (res.status === 503) {
//           setError("Server is starting up. Please wait...");
//           return;
//         } else {
//           throw new Error("Failed to load dashboard data");
//         }
//       }

//       const contentType = res.headers.get("content-type");
//       if (!contentType || !contentType.includes("application/json")) {
//         throw new Error("Invalid response format");
//       }

//       const data = await res.json();
//       setAnalysisData(data);
//       setError(null);
//     } catch (err) {
//       console.error("Error fetching global analysis:", err);
//       if (!err.message.includes("starting up")) {
//         setError("Failed to load data. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   const resetFilters = () => {
//     setDistrict("");
//     setSchool("");
//     setGrade("");
//     setGradeOptions(allGradeOptions); // Reset to all available grades
//     setIsGlobalView(false);
//     fetchGlobalAnalysis();
//   };

//   const handleDownloadReport = async (reportType = "summary") => {
//     try {
//       const queryParams = new URLSearchParams();
//       if (grade) queryParams.append("grade_level", grade);
//       if (school) queryParams.append("school_name", school);
//       if (district) queryParams.append("district_name", district.trimEnd() + " ");
  
//       const res = await fetch(`http://127.0.0.1:8001/api/download/${reportType}?${queryParams}`, {
//         method: "GET",
//       });
  
//       if (!res.ok) throw new Error(`Failed to download ${reportType} report`);
  
//       const blob = await res.blob();
//       const url = window.URL.createObjectURL(blob);
  
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `${reportType}_report.xlsx`;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (err) {
//       console.error("Download error:", err);
//       alert(`Failed to download ${reportType} report: ${err.message}`);
//     }
//   };
  
//   const handleDownloadBelow85Report = () => {
//     handleDownloadReport("below_85");
//   };

//   // Render loading skeleton for cards
//   const renderSkeletonCards = () => {
//     return (
//       <>
//         {[1, 2, 3, 4, 5].map((i) => (
//           <Card key={i} className="animate-pulse h-32">
//             <CardHeader className="pb-2"><div className="h-5 bg-gray-200 rounded w-24"></div></CardHeader>
//             <CardContent><div className="h-8 bg-gray-200 rounded w-16"></div></CardContent>
//           </Card>
//         ))}
//       </>
//     );
//   };

//   // Render school options with unique keys
//   const renderSchoolOptions = () => {
//     return (
//       <>
//         <option value="">Select School</option>
//         {schoolOptions.map((s, index) => (
//           <option 
//             key={`${s.value}-${s.district}-${index}`} 
//             value={s.value}
//           >
//             {s.label}
//           </option>
//         ))}
//       </>
//     );
//   };

//   // Toggle expanded state for insights and recommendations
//   const toggleInsights = () => setExpandedInsights(!expandedInsights);
//   const toggleRecommendations = () => setExpandedRecommendations(!expandedRecommendations);

//   return (
//     <div className="min-h-screen bg-gray-50/50">
//       <div className="container mx-auto px-4 py-4 max-w-full">
//         {/* Header section with consistent spacing */}
//         <div className="mb-4">
//           <div className="flex justify-between items-center flex-wrap gap-2">
//             <div>
//               <h1 className="text-2xl font-bold">Alerts Dashboard</h1>
//               <p className="text-sm text-muted-foreground">Monitor alerts and notifications</p>
//             </div>
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => setShowFilters(!showFilters)}
//                 className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
//               >
//                 {showFilters ? "Hide Filters" : "Show Filters"}
//                 {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
//               </button>
//             </div>
//           </div>
//           <div className="w-full h-0.5 bg-gray-200 mt-2"></div>
//         </div>

//         <div className="flex w-full min-h-screen flex-col lg:flex-row gap-4">
//           {/* Filter section with fixed width and consistent layout */}
//           {showFilters && (
//             <div className="w-full lg:w-64 p-4 bg-white shadow rounded-md h-fit sticky top-4">
//               <div className="mb-4">
//                 <label className="block text-sm font-medium mb-1">District</label>
//                 <select
//                   value={district}
//                   onChange={(e) => setDistrict(e.target.value)}
//                   className="w-full p-2 border rounded text-sm"
//                   disabled={isInitialLoad}
//                 >
//                   <option value="">Select District</option>
//                   {districtOptions.map((d) => (
//                     <option key={d.value} value={d.value}>
//                       {d.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
              
//               <div className="mb-4">
//                 <label className="block text-sm font-medium mb-1">School</label>
//                 <select
//                   value={school}
//                   onChange={(e) => setSchool(e.target.value)}
//                   className="w-full p-2 border rounded text-sm"
//                   disabled={!schoolOptions.length || isInitialLoad}
//                 >
//                   {renderSchoolOptions()}
//                 </select>
//               </div>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium mb-1">Grade</label>
//                 <select
//                   value={grade}
//                   onChange={(e) => setGrade(e.target.value)}
//                   className="w-full p-2 border rounded text-sm"
//                   disabled={!gradeOptions.length || isInitialLoad}
//                 >
//                   <option value="">Select Grade</option>
//                   {gradeOptions.map((g) => (
//                     <option key={g.value} value={g.value}>
//                       {g.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div className="flex gap-2">
//                 <button
//                   onClick={fetchAnalysis}
//                   className={`bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 w-full ${
//                     isInitialLoad ? "opacity-50 cursor-not-allowed" : ""
//                   }`}
//                   disabled={isInitialLoad}
//                 >
//                   Search
//                 </button>
//                 <button
//                   onClick={resetFilters}
//                   className={`bg-gray-300 text-gray-800 px-3 py-2 rounded text-sm hover:bg-gray-400 w-full ${
//                     isInitialLoad ? "opacity-50 cursor-not-allowed" : ""
//                   }`}
//                   disabled={isInitialLoad}
//                 >
//                   Reset
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Main Dashboard with improved responsive layout */}
//           <div className="flex-1 overflow-x-auto">
//             <div className="flex flex-col gap-4">
//               {/* Server starting notification */}
//               {error && (
//                 <div className="w-full">
//                   <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
//                     <div className="flex">
//                       <div className="flex-shrink-0">
//                         <svg className="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                         </svg>
//                       </div>
//                       <div className="ml-3">
//                         <p className="text-sm text-yellow-700">{error}</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {isGlobalView && analysisData && (
//                 <div className="w-full">
//                   <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
//                     <div className="flex">
//                       <div className="flex-shrink-0">
//                         <Globe className="h-5 w-5 text-blue-500" />
//                       </div>
//                       <div className="ml-3">
//                         <p className="text-sm text-blue-700">
//                           Viewing Global Analysis - Showing data for all districts, schools, and grades
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
              
//               {/* Loading state */}
//               {(loading || isInitialLoad) && !error && (
//                 <div className="w-full">
//                   <div className="flex justify-center items-center w-full mb-2">
//                     <div className="flex items-center justify-center gap-2">
//                       <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                       </svg>
//                       <p className="text-blue-700 text-sm">Loading dashboard data...</p>
//                     </div>
//                   </div>
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
//                     {renderSkeletonCards()}
//                   </div>
//                 </div>
//               )}
            
//               {/* Dashboard cards - improved responsive layout */}
//               {!loading && !isInitialLoad && analysisData && (
//                 <>
//                   {/* Summary statistics with improved grid layout */}
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
//                     {/* Total Students */}
//                     <Card className="bg-orange-50 border border-orange-200">
//                       <CardHeader className="pb-1 pt-3">
//                         <CardTitle className="text-base flex items-center gap-1">
//                           Total Students
//                         </CardTitle>
//                       </CardHeader>
//                       <CardContent className="pb-3 pt-1 flex justify-between items-center">
//                         <span className="text-2xl font-semibold">
//                           {analysisData.summary_statistics.total_students}
//                         </span>
//                         <button 
//                           onClick={() => handleDownloadReport("summary")}
//                           className="text-xs bg-orange-500 text-white p-1 rounded flex items-center gap-1"
//                           title="Download Summary Report"
//                         >
//                           <Download size={12} />
//                           Export
//                         </button>
//                       </CardContent>
//                     </Card>

//                     {/* At Risk Students */}
//                     <Card>
//                       <CardHeader className="pb-1 pt-3">
//                         <CardTitle className="text-base">At Risk Students</CardTitle>
//                       </CardHeader>
//                       <CardContent className="pb-3 pt-1">
//                         <span className="text-2xl font-semibold">
//                           {analysisData.summary_statistics.at_risk_students}
//                         </span>
//                       </CardContent>
//                     </Card>

//                     {/* Below 85% Attendance */}
//                     <Card className="bg-orange-50 border-orange-200">
//                       <CardHeader className="pb-1 pt-3">
//                         <CardTitle className="text-base flex items-center gap-1">
//                           <AlertCircle size={14} className="text-orange-500" />
//                           Below 85% Attendance
//                         </CardTitle>
//                       </CardHeader>
//                       <CardContent className="pb-3 pt-1 flex justify-between items-center">
//                         <span className="text-2xl font-semibold">
//                           {analysisData.summary_statistics.below_85_students}
//                         </span>
//                         <button
//                           onClick={handleDownloadBelow85Report}
//                           className="text-xs bg-orange-500 text-white p-1 rounded flex items-center gap-1"
//                           title="Download Below 85% Report"
//                         >
//                           <Download size={12} />
//                           Export
//                         </button>
//                       </CardContent>
//                     </Card>

//                     {/* Critical Risk Students */}
//                     <Card>
//                       <CardHeader className="pb-1 pt-3">
//                         <CardTitle className="text-base">Critical Risk Students</CardTitle>
//                       </CardHeader>
//                       <CardContent className="pb-3 pt-1">
//                         <span className="text-2xl font-semibold">
//                           {analysisData.summary_statistics.critical_risk_students}
//                         </span>
//                       </CardContent>
//                     </Card>

//                     {/* Tier 4 Students */}
//                     <Card>
//                       <CardHeader className="pb-1 pt-3">
//                         <CardTitle className="text-base">Tier 4 Students</CardTitle>
//                       </CardHeader>
//                       <CardContent className="pb-3 pt-1">
//                         <span className="text-2xl font-semibold">
//                           {analysisData.summary_statistics.tier4_students}
//                         </span>
//                       </CardContent>
//                     </Card>
//                   </div>

//                   {/* Collapsible Key Insights and Recommendations */}
//                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
//                     {/* Collapsible Key Insights */}
//                     {analysisData.key_insights?.length > 0 && (
//                       <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md border border-blue-100 overflow-hidden">
//                         <CardHeader 
//                           className="bg-blue-100/60 py-2 cursor-pointer"
//                           onClick={toggleInsights}
//                         >
//                           <CardTitle className="text-blue-800 flex items-center justify-between text-base">
//                             <div className="flex items-center gap-2">
//                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                               </svg>
//                               AI DRIVEN Key Insights
//                             </div>
//                             {expandedInsights ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
//                           </CardTitle>
//                         </CardHeader>
                        
//                         {expandedInsights && (
//                           <CardContent className="pt-2 pb-3 overflow-y-auto max-h-80">
//                             <ul className="space-y-2 text-sm">
//                               {analysisData.key_insights.map((item, index) => (
//                                 <li key={index} className="flex items-start gap-2">
//                                   <span className="text-blue-500 mt-1">•</span>
//                                   <span dangerouslySetInnerHTML={{
//                                     __html: item.insight.replace(/(\d+(\.\d+)?%?)/g, "<strong class='text-blue-700'>$1</strong>")
//                                   }} />
//                                 </li>
//                               ))}
//                             </ul>
//                           </CardContent>
//                         )}
//                       </Card>
//                     )}
                    
//                     {/* Collapsible AI Recommendations */}
//                     {analysisData.recommendations?.length > 0 && (
//                       <Card className="bg-gradient-to-br from-green-50 to-teal-50 shadow-md border border-green-100 overflow-hidden">
//                         <CardHeader 
//                           className="bg-green-100/60 py-2 cursor-pointer"
//                           onClick={toggleRecommendations}
//                         >
//                           <CardTitle className="text-green-800 flex items-center justify-between text-base">
//                             <div className="flex items-center gap-2">
//                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                               </svg>
//                               AI Recommendations
//                             </div>
//                             {expandedRecommendations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
//                           </CardTitle>
//                         </CardHeader>
                        
//                         {expandedRecommendations && (
//                           <CardContent className="pt-2 pb-3 overflow-y-auto max-h-80">
//                             <ul className="space-y-2 text-sm">
//                               {analysisData.recommendations.map((item, index) => (
//                                 <li key={index} className="flex items-start gap-2">
//                                   <span className="text-green-500 mt-1">•</span>
//                                   <span dangerouslySetInnerHTML={{
//                                     __html: item.recommendation.replace(/(\d+(\.\d+)?%?)/g, "<strong class='text-green-700'>$1</strong>")
//                                   }} />
//                                 </li>
//                               ))}
//                             </ul>
//                           </CardContent>
//                         )}
//                       </Card>
//                     )}
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
// export default AlertsDashboard;


import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Globe, AlertCircle, Download, ArrowDown, ArrowUp } from "lucide-react";

// Declare the global property to fix TypeScript errors
declare global {
  interface Window {
    _schoolGradeMap: Record<string, any>;
  }
}

const AlertsDashboard = () => {
  const [district, setDistrict] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");

  const [districtOptions, setDistrictOptions] = useState([]);
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [gradeOptions, setGradeOptions] = useState([]);

  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading true for initial data fetch
  const [error, setError] = useState(null);
  const [isGlobalView, setIsGlobalView] = useState(false);
  const [allSchoolOptions, setAllSchoolOptions] = useState([]);
  const [allGradeOptions, setAllGradeOptions] = useState([]);
  
  // Store hierarchical data from the backend
  const [hierarchicalData, setHierarchicalData] = useState([]);

  const [showFilters, setShowFilters] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loadTimer, setLoadTimer] = useState(null);
  
  // State for expandable sections
  const [expandedInsights, setExpandedInsights] = useState(true);
  const [expandedRecommendations, setExpandedRecommendations] = useState(true);

  // Combined fetch function to reduce multiple requests
  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);

    // Clear any existing timer
    if (loadTimer) {
      clearTimeout(loadTimer);
    }

    try {
      // Try to fetch filter options first
      const filterRes = await fetch(`http://127.0.0.1:8001/api/filter-options`);
      
      if (filterRes.ok) {
        const filterData = await filterRes.json();
        
        setDistrictOptions(filterData.districts || []);
        setAllSchoolOptions(filterData.schools || []);
        setAllGradeOptions(filterData.grades || []); 
        setGradeOptions(filterData.grades || []);    
        setSchoolOptions([]);
        
        // Store school to grade mapping for direct lookup
        const schoolGradeMap = new Map();
        
        // If filter options were successful, try to fetch global analysis
        try {
          const analysisRes = await fetch(`http://127.0.0.1:8001/api/global-analysis`);
          if (analysisRes.ok) {
            const analysisData = await analysisRes.json();
            setAnalysisData(analysisData);
            setIsGlobalView(true);
            setIsInitialLoad(false);
          } else {
            throw new Error("Failed to load dashboard data");
          }
        } catch (analysisErr) {
          console.error("Error fetching analysis:", analysisErr);
        }
      } else {
        // If server is not ready, set a simple loading message
        setError("Server is starting up. Please wait...");
        
        // Schedule a single retry with increasing timeout
        const timer = setTimeout(() => {
          fetchInitialData();
        }, 3000);
        
        setLoadTimer(timer);
      }
    } catch (err) {
      console.error("Error fetching initial data:", err);
      
      // Schedule a single retry
      const timer = setTimeout(() => {
        fetchInitialData();
      }, 3000);
      
      setLoadTimer(timer);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    
    // Cleanup function to clear any pending timeouts
    return () => {
      if (loadTimer) {
        clearTimeout(loadTimer);
      }
    };
  }, []);

  useEffect(() => {
    const trimmedDistrict = district.trim();
    if (trimmedDistrict) {
      const filteredSchools = allSchoolOptions.filter(
        (s) => s.district.trim() === trimmedDistrict
      );
      setSchoolOptions(filteredSchools);
    } else {
      setSchoolOptions(allSchoolOptions); // Show all schools if no district selected
    }
  
    // Don't reset selected school unless it becomes invalid
    if (
      school &&
      trimmedDistrict &&
      !allSchoolOptions.find(
        (s) => s.district.trim() === trimmedDistrict && s.value === school
      )
    ) {
      setSchool("");
    }
  
    // Always reset grade when district changes
    setGrade("");
    
    // Reset grade options to all available when district changes
    setGradeOptions(allGradeOptions);
  }, [district, allSchoolOptions]);

  // Update grade options when school changes - OPTIMIZED VERSION
  useEffect(() => {
    // Skip if no school selected
    if (!school) {
      setGradeOptions(allGradeOptions);
            setGrade("");
            return;
          }
    
    // Show loading state for grades dropdown
    setGradeOptions([{ value: "loading", label: "Loading grades..." }]);
    
    // PARALLEL API CALLS FOR PERFORMANCE
    const getGradesForSchool = async () => {
      // Common grade levels to check
        const availableGrades = allGradeOptions.map(grade => grade.value);
      
      // Make all API calls in parallel for much faster response
      const promises = availableGrades.map(grade => 
        fetch(`http://127.0.0.1:8001/api/analysis?school_name=${encodeURIComponent(school)}&grade_level=${grade}`)
          .then(res => {
            if (res.ok) {
              return res.json().then(data => {
                if (data?.summary_statistics?.total_students > 0) {
                  // Return the grade if it has students
                  return grade;
                }
                return null;
              });
            }
            return null; // Skip errors - they just mean this grade doesn't exist
          })
          .catch(() => null) // Silently handle errors
      );
      
      // Wait for all API calls to complete in parallel
      const results = await Promise.all(promises);
      
      // Filter out nulls to get valid grades
      const validGradeValues = results.filter(Boolean);
      
      if (validGradeValues.length > 0) {
        // Map to grade objects from allGradeOptions
        const validGrades = validGradeValues
          .map(value => allGradeOptions.find(g => g.value === value))
          .filter(Boolean); // Remove any undefined values
        
        setGradeOptions(validGrades);
      } else {
        // Fallback to all grades if none found
    setGradeOptions(allGradeOptions);
      }
      
      // Reset selected grade
    setGrade("");
    };
    
    // Execute with small timeout to ensure UI responsiveness
    const timerId = setTimeout(() => {
      getGradesForSchool();
    }, 100);
    
    // Cleanup on unmount or when school changes
    return () => clearTimeout(timerId);
  }, [school, allGradeOptions]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    setIsGlobalView(false);
  
    try {
      const params = new URLSearchParams();
      if (district) params.append("district_name", district.trimEnd() + " ");
      if (school) params.append("school_name", school);
      if (grade) params.append("grade_level", grade);
  
      const res = await fetch(`http://127.0.0.1:8001/api/analysis?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
  
      if (!res.ok) {
        if (res.status === 503) {
          setError("Server is starting up. Please wait...");
          return;
        } else {
          throw new Error("Failed to load dashboard data");
        }
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }
  
      const data = await res.json();
      setAnalysisData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching analysis:", err);
      if (!err.message.includes("starting up")) {
        setError("Failed to load data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const fetchGlobalAnalysis = async () => {
    setLoading(true);
    setError(null);
    setIsGlobalView(true);
    
    try {
      const res = await fetch(`http://127.0.0.1:8001/api/global-analysis`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        if (res.status === 503) {
          setError("Server is starting up. Please wait...");
          return;
        } else {
          throw new Error("Failed to load dashboard data");
        }
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }

      const data = await res.json();
      setAnalysisData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching global analysis:", err);
      if (!err.message.includes("starting up")) {
        setError("Failed to load data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const resetFilters = () => {
    setDistrict("");
    setSchool("");
    setGrade("");
    setGradeOptions(allGradeOptions); // Reset to all available grades
    setIsGlobalView(false);
    fetchGlobalAnalysis();
  };

  const handleDownloadReport = async (reportType = "summary") => {
    try {
      const queryParams = new URLSearchParams();
      if (grade) queryParams.append("grade_level", grade);
      if (school) queryParams.append("school_name", school);
      if (district) queryParams.append("district_name", district.trimEnd() + " ");
  
      const res = await fetch(`http://127.0.0.1:8001/api/download/${reportType}?${queryParams}`, {
        method: "GET",
      });
  
      if (!res.ok) throw new Error(`Failed to download ${reportType} report`);
  
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
  
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}_report.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert(`Failed to download ${reportType} report: ${err.message}`);
    }
  };
  
  const handleDownloadBelow85Report = () => {
    handleDownloadReport("below_85");
  };

  // Render loading skeleton for cards
  const renderSkeletonCards = () => {
    return (
      <>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse h-32">
            <CardHeader className="pb-2"><div className="h-5 bg-gray-200 rounded w-24"></div></CardHeader>
            <CardContent><div className="h-8 bg-gray-200 rounded w-16"></div></CardContent>
          </Card>
        ))}
      </>
    );
  };

  // Render school options with unique keys
  const renderSchoolOptions = () => {
    return (
      <>
        <option value="">Select School</option>
        {schoolOptions.map((s, index) => (
          <option 
            key={`${s.value}-${s.district}-${index}`} 
            value={s.value}
          >
            {s.label}
          </option>
        ))}
      </>
    );
  };

  // Toggle expanded state for insights and recommendations
  const toggleInsights = () => setExpandedInsights(!expandedInsights);
  const toggleRecommendations = () => setExpandedRecommendations(!expandedRecommendations);

  // Function to filter out AI pattern recognition items
  const filterOutPatternRecognition = (items) => {
    if (!items || !Array.isArray(items)) return [];
    return items.filter(item => {
      const text = item.insight || item.recommendation || '';
      return !text.includes('PATTERN RECOGNITION');
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-4 max-w-full">
        {/* Header section with consistent spacing */}
        <div className="mb-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h1 className="text-2xl font-bold">Alerts Dashboard</h1>
              <p className="text-sm text-muted-foreground">Monitor alerts and notifications</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>
          <div className="w-full h-0.5 bg-gray-200 mt-2"></div>
        </div>

        <div className="flex w-full min-h-screen flex-col lg:flex-row gap-4">
          {/* Filter section with fixed width and consistent layout */}
          {showFilters && (
            <div className="w-full lg:w-64 p-4 bg-white shadow rounded-md h-fit sticky top-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  disabled={isInitialLoad}
                >
                  <option value="">Select District</option>
                  {districtOptions.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">School</label>
                <select
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  disabled={!schoolOptions.length || isInitialLoad}
                >
                  {renderSchoolOptions()}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Grade</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  disabled={!gradeOptions.length || isInitialLoad}
                >
                  <option value="">Select Grade</option>
                  {gradeOptions.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchAnalysis}
                  className={`bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 w-full ${
                    isInitialLoad ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isInitialLoad}
                >
                  Search
                </button>
                <button
                  onClick={resetFilters}
                  className={`bg-gray-300 text-gray-800 px-3 py-2 rounded text-sm hover:bg-gray-400 w-full ${
                    isInitialLoad ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isInitialLoad}
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Main Dashboard with improved responsive layout */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex flex-col gap-4">
            {/* Server starting notification */}
            {error && (
                <div className="w-full">
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isGlobalView && analysisData && (
                <div className="w-full">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Globe className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Viewing Global Analysis - Showing data for all districts, schools, and grades
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading state */}
            {(loading || isInitialLoad) && !error && (
                <div className="w-full">
                  <div className="flex justify-center items-center w-full mb-2">
                  <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                      <p className="text-blue-700 text-sm">Loading dashboard data...</p>
                  </div>
                </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {renderSkeletonCards()}
                  </div>
                </div>
            )}
          
              {/* Dashboard cards - improved responsive layout */}
            {!loading && !isInitialLoad && analysisData && (
              <>
                  {/* Summary statistics with improved grid layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Total Students */}
                <Card className="bg-orange-50 border border-orange-200">
                      <CardHeader className="pb-1 pt-3">
                        <CardTitle className="text-base flex items-center gap-1">
                      Total Students
                    </CardTitle>
                  </CardHeader>
                      <CardContent className="pb-3 pt-1 flex justify-between items-center">
                        <span className="text-2xl font-semibold">
                      {analysisData.summary_statistics.total_students}
                    </span>
                    <button 
                      onClick={() => handleDownloadReport("summary")}
                      className="text-xs bg-orange-500 text-white p-1 rounded flex items-center gap-1"
                      title="Download Summary Report"
                    >
                      <Download size={12} />
                      Export
                    </button>
                  </CardContent>
                </Card>

                    {/* At Risk Students */}
                <Card>
                      <CardHeader className="pb-1 pt-3">
                        <CardTitle className="text-base">At Risk Students</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-3 pt-1">
                        <span className="text-2xl font-semibold">
                          {analysisData.summary_statistics.at_risk_students}
                        </span>
                      </CardContent>
                </Card>

                    {/* Below 85% Attendance */}
                <Card className="bg-orange-50 border-orange-200">
                      <CardHeader className="pb-1 pt-3">
                        <CardTitle className="text-base flex items-center gap-1">
                          <AlertCircle size={14} className="text-orange-500" />
                      Below 85% Attendance
                    </CardTitle>
                  </CardHeader>
                      <CardContent className="pb-3 pt-1 flex justify-between items-center">
                        <span className="text-2xl font-semibold">
                          {analysisData.summary_statistics.below_85_students}
                        </span>
                    <button
                      onClick={handleDownloadBelow85Report}
                      className="text-xs bg-orange-500 text-white p-1 rounded flex items-center gap-1"
                      title="Download Below 85% Report"
                    >
                      <Download size={12} />
                      Export
                    </button>
                  </CardContent>
                </Card>

                    {/* Critical Risk Students */}
                <Card>
                      <CardHeader className="pb-1 pt-3">
                        <CardTitle className="text-base">Critical Risk Students</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-3 pt-1">
                        <span className="text-2xl font-semibold">
                          {analysisData.summary_statistics.critical_risk_students}
                        </span>
                      </CardContent>
                </Card>

                    {/* Tier 4 Students */}
                <Card>
                      <CardHeader className="pb-1 pt-3">
                        <CardTitle className="text-base">Tier 4 Students</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-3 pt-1">
                        <span className="text-2xl font-semibold">
                          {analysisData.summary_statistics.tier4_students}
                        </span>
                      </CardContent>
                </Card>
                  </div>

                  {/* Collapsible Key Insights and Recommendations */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    {/* Collapsible Key Insights */}
                    {analysisData.key_insights?.length > 0 && (
                      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md border border-blue-100 overflow-hidden">
                        <CardHeader 
                          className="bg-blue-100/60 py-2 cursor-pointer"
                          onClick={toggleInsights}
                        >
                          <CardTitle className="text-blue-800 flex items-center justify-between text-base">
                            <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            AI DRIVEN Key Insights
                            </div>
                            {expandedInsights ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </CardTitle>
                        </CardHeader>
                        
                        {expandedInsights && (
                          <CardContent className="pt-2 pb-3 overflow-y-auto max-h-80">
                            <ul className="space-y-2 text-sm">
                              {filterOutPatternRecognition(analysisData.key_insights).map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span dangerouslySetInnerHTML={{
                                  __html: item.insight.replace(/(\d+(\.\d+)?%?)/g, "<strong class='text-blue-700'>$1</strong>")
                                }} />
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        )}
                      </Card>
                    )}
                    
                    {/* Collapsible AI Recommendations */}
                    {analysisData.recommendations?.length > 0 && (
                      <Card className="bg-gradient-to-br from-green-50 to-teal-50 shadow-md border border-green-100 overflow-hidden">
                        <CardHeader 
                          className="bg-green-100/60 py-2 cursor-pointer"
                          onClick={toggleRecommendations}
                        >
                          <CardTitle className="text-green-800 flex items-center justify-between text-base">
                            <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            AI Recommendations
                            </div>
                            {expandedRecommendations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </CardTitle>
                        </CardHeader>
                        
                        {expandedRecommendations && (
                          <CardContent className="pt-2 pb-3 overflow-y-auto max-h-80">
                            <ul className="space-y-2 text-sm">
                              {filterOutPatternRecognition(analysisData.recommendations).map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">•</span>
                                <span dangerouslySetInnerHTML={{
                                  __html: item.recommendation.replace(/(\d+(\.\d+)?%?)/g, "<strong class='text-green-700'>$1</strong>")
                                }} />
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        )}
                      </Card>
                    )}
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AlertsDashboard;