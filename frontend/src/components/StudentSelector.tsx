//Base data
// import React, { useEffect, useState } from "react";
// import { Student } from "@/types";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Check, ChevronDown } from "lucide-react";

// interface Props {
//   students: Student[];
//   selectedStudent: Student;
//   onSelect: (s: Student) => void;
// }

// export const StudentSelector: React.FC<Props> = ({
//   students,
//   selectedStudent,
//   onSelect,
// }) => {
//   const gradeOrder = [
//     "Pre-Kindergarten",
//     "Kindergarten",
//     "1st Grade",
//     "2nd Grade",
//     "3rd Grade",
//     "4th Grade",
//     "5th Grade",
//     "6th Grade",
//     "7th Grade",
//     "8th Grade",
//     "9th Grade",
//     "10th Grade",
//     "11th Grade",
//     "12th Grade",
//   ];

//   const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
//   const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
//   const [selectedGrade, setSelectedGrade] = useState<string | null>(null);

//   // Filter students by District Name
//   const filteredByDistrict = selectedDistrict
//     ? students.filter((s) => s.districtName === selectedDistrict)
//     : students;

//   // Get unique District Names for the dropdown
//   const districtNames = Array.from(new Set(students.map((s) => s.districtName))).sort();

//   // Filter students by Location ID (School)
//   const filteredByLocation = selectedSchool
//     ? filteredByDistrict.filter((s) => s.schoolName === selectedSchool)
//     : filteredByDistrict;

//   // Get unique Location IDs for the dropdown
//   const locationIds = Array.from(new Set(filteredByDistrict.map((s) => s.schoolName))).sort();

//   // Get unique grades available for the selected Location ID
//   const availableGrades = Array.from(
//     new Set(filteredByLocation.map((s) => s.grade))
//   ).sort((a, b) => {
//     const gradeAIndex = gradeOrder.indexOf(a);
//     const gradeBIndex = gradeOrder.indexOf(b);
//     return gradeAIndex - gradeBIndex;
//   });

//   // Filter students further by Grade
//   const filteredStudents = selectedGrade
//     ? filteredByLocation
//         .filter((s) => s.grade === selectedGrade)
//         .sort((a, b) => {
//           // Sort by Location_ID first
//           if (a.schoolName !== b.schoolName) {
//             return a.schoolName.localeCompare(b.schoolName);
//           }
//           // Sort by Grade
//           const gradeAIndex = gradeOrder.indexOf(a.grade);
//           const gradeBIndex = gradeOrder.indexOf(b.grade);
//           if (gradeAIndex !== gradeBIndex) {
//             return gradeAIndex - gradeBIndex;
//           }
//           // Sort by Student ID last
//           return a.id.localeCompare(b.id);
//         })
//     : filteredByLocation;

//   useEffect(() => {
//     console.log("Filtered students:", filteredStudents);
//   }, [filteredStudents]);

//   const DropdownLabel = ({ text, count }: { text: string; count?: number }) => (
//     <div className="flex justify-between items-center w-full">
//       <span className="font-medium">{text}</span>
//       {count !== undefined && (
//         <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
//           {count}
//         </span>
//       )}
//     </div>
//   );

//   return (
//     <div className="flex flex-col space-y-5">
//       {/* District Dropdown */}
//       <div className="space-y-2">
//         <label className="block text-base font-semibold text-gray-700">
//           District
//         </label>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button 
//               variant="outline" 
//               className="w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px]"
//             >
//               <span className="truncate">
//                 {selectedDistrict || "Select district"}
//               </span>
//               <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent className="max-h-60 overflow-y-auto w-full min-w-[240px]">
//             {districtNames.map((district) => (
//               <DropdownMenuItem
//                 key={district}
//                 onClick={() => {
//                   setSelectedDistrict(district);
//                   setSelectedSchool(null);
//                   setSelectedGrade(null);
//                 }}
//                 className="text-base py-2 cursor-pointer"
//               >
//                 <div className="flex items-center w-full">
//                   <span className="mr-2 w-4">
//                     {selectedDistrict === district && (
//                       <Check className="h-4 w-4" />
//                     )}
//                   </span>
//                   {district}
//                 </div>
//               </DropdownMenuItem>
//             ))}
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>

//       {/* School Dropdown */}
//       <div className="space-y-2">
//         <label className="block text-base font-semibold text-gray-700">
//           School
//         </label>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button 
//               variant="outline" 
//               className="w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px]"
//               disabled={!selectedDistrict}
//             >
//               <span className="truncate">
//                 {selectedSchool || "Select school"}
//               </span>
//               <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent className="max-h-60 overflow-y-auto w-full min-w-[240px]">
//             {locationIds.length === 0 ? (
//               <DropdownMenuItem disabled className="text-base py-2">
//                 No schools available
//               </DropdownMenuItem>
//             ) : (
//               locationIds.map((location) => (
//                 <DropdownMenuItem
//                   key={location}
//                   onClick={() => {
//                     setSelectedSchool(location);
//                     setSelectedGrade(null);
//                   }}
//                   className="text-base py-2 cursor-pointer"
//                 >
//                   <div className="flex items-center w-full">
//                     <span className="mr-2 w-4">
//                       {selectedSchool === location && (
//                         <Check className="h-4 w-4" />
//                       )}
//                     </span>
//                     {location}
//                   </div>
//                 </DropdownMenuItem>
//               ))
//             )}
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>

//       {/* Grade Dropdown */}
//       <div className="space-y-2">
//         <label className="block text-base font-semibold text-gray-700">
//           Grade
//         </label>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button 
//               variant="outline" 
//               className="w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px]"
//               disabled={!selectedSchool}
//             >
//               <span className="truncate">
//                 {selectedGrade || "Select grade"}
//               </span>
//               <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent className="max-h-60 overflow-y-auto w-full min-w-[240px]">
//             {availableGrades.length === 0 ? (
//               <DropdownMenuItem disabled className="text-base py-2">
//                 No grades available
//               </DropdownMenuItem>
//             ) : (
//               availableGrades.map((grade) => (
//                 <DropdownMenuItem
//                   key={grade}
//                   onClick={() => {
//                     setSelectedGrade(grade);
//                   }}
//                   className="text-base py-2 cursor-pointer"
//                 >
//                   <div className="flex items-center w-full">
//                     <span className="mr-2 w-4">
//                       {selectedGrade === grade && <Check className="h-4 w-4" />}
//                     </span>
//                     {grade}
//                   </div>
//                 </DropdownMenuItem>
//               ))
//             )}
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>

//       {/* Student Dropdown */}
//       <div className="space-y-2">
//         <label className="block text-base font-semibold text-gray-700">
//           Student
//         </label>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button
//               variant="outline"
//               className="w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px]"
//               disabled={!selectedGrade || filteredStudents.length === 0}
//             >
//               <span className="truncate">
//                 {selectedStudent?.id || "Select student"}
//               </span>
//               <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent className="max-h-60 overflow-y-auto w-full min-w-[240px]">
//             {filteredStudents.length === 0 ? (
//               <DropdownMenuItem disabled className="text-base py-2">
//                 No students available
//               </DropdownMenuItem>
//             ) : (
//               filteredStudents.map((s) => (
//                 <DropdownMenuItem
//                   key={s.id}
//                   onClick={() => {
//                     onSelect(s);
//                   }}
//                   className="text-base py-2 cursor-pointer"
//                 >
//                   <div className="flex items-center justify-between w-full">
//                     <div className="flex items-center">
//                       <span className="mr-2 w-4">
//                         {selectedStudent?.id === s.id && (
//                           <Check className="h-4 w-4" />
//                         )}
//                       </span>
//                       {s.id}
//                     </div>
//                     <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
//                       {s.grade}
//                     </span>
//                   </div>
//                 </DropdownMenuItem>
//               ))
//             )}
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>
//     </div>
//   );
// };


//1st iteration working code
// import React, { useEffect, useState } from "react";
// import { Student } from "@/types";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Check, ChevronDown, X } from "lucide-react";

// interface Props {
//   students: Student[];
//   selectedStudent: Student | null;
//   onSelect: (s: Student | null) => void;
//   onFiltersChange: (filters: {
//     district: string | null;
//     school: string | null;
//     grade: string | null;
//     student: Student | null;
//   }) => void;
//   selectedDistrict: string | null;
//   selectedSchool: string | null;
//   selectedGrade: string | null;
// }

// export const StudentSelector: React.FC<Props> = ({
//   students,
//   selectedStudent,
//   onSelect,
//   onFiltersChange,
//   selectedDistrict,
//   selectedSchool,
//   selectedGrade,
// }) => {
//   const gradeOrder = [
//     "Pre-Kindergarten",
//     "Kindergarten",
//     "1st Grade",
//     "2nd Grade",
//     "3rd Grade",
//     "4th Grade",
//     "5th Grade",
//     "6th Grade",
//     "7th Grade",
//     "8th Grade",
//     "9th Grade",
//     "10th Grade",
//     "11th Grade",
//     "12th Grade",
//   ];

//   // Internal state for managing UI state
//   const [internalDistrict, setInternalDistrict] = useState<string | null>(selectedDistrict);
//   const [internalSchool, setInternalSchool] = useState<string | null>(selectedSchool);
//   const [internalGrade, setInternalGrade] = useState<string | null>(selectedGrade);
//   const [internalStudent, setInternalStudent] = useState<Student | null>(selectedStudent);

//   // Update internal state when props change
//   useEffect(() => {
//     setInternalDistrict(selectedDistrict);
//     setInternalSchool(selectedSchool);
//     setInternalGrade(selectedGrade);
//     setInternalStudent(selectedStudent);
//   }, [selectedDistrict, selectedSchool, selectedGrade, selectedStudent]);

//   // Helper function to update filters
//   const updateFilters = (updates: {
//     district?: string | null;
//     school?: string | null;
//     grade?: string | null;
//     student?: Student | null;
//   }) => {
//     const newDistrict = updates.district !== undefined ? updates.district : internalDistrict;
//     const newSchool = updates.school !== undefined ? updates.school : internalSchool;
//     const newGrade = updates.grade !== undefined ? updates.grade : internalGrade;
//     const newStudent = updates.student !== undefined ? updates.student : internalStudent;

//     setInternalDistrict(newDistrict);
//     setInternalSchool(newSchool);
//     setInternalGrade(newGrade);
//     setInternalStudent(newStudent);

//     onFiltersChange({
//       district: newDistrict,
//       school: newSchool,
//       grade: newGrade,
//       student: newStudent,
//     });

//     if (updates.student !== undefined) {
//       onSelect(newStudent);
//     }
//   };

//   // Clear all filters
//   const clearAllFilters = () => {
//     updateFilters({
//       district: null,
//       school: null,
//       grade: null,
//       student: null,
//     });
//   };

//   // Filter students by District Name
//   const filteredByDistrict = internalDistrict
//     ? students.filter((s) => s.districtName === internalDistrict)
//     : students;

//   // Get unique District Names for the dropdown
//   const districtNames = Array.from(new Set(students.map((s) => s.districtName))).sort();

//   // Filter students by School Name
//   const filteredByLocation = internalSchool
//     ? filteredByDistrict.filter((s) => s.schoolName === internalSchool)
//     : filteredByDistrict;

//   // Get unique School Names for the dropdown (filtered by district)
//   const schoolNames = Array.from(new Set(filteredByDistrict.map((s) => s.schoolName))).sort();

//   // Get unique grades available for the selected filters
//   const availableGrades = Array.from(
//     new Set(filteredByLocation.map((s) => s.grade))
//   ).sort((a, b) => {
//     const gradeAIndex = gradeOrder.indexOf(a);
//     const gradeBIndex = gradeOrder.indexOf(b);
//     return gradeAIndex - gradeBIndex;
//   });

//   // Filter students further by Grade
//   const filteredStudents = internalGrade
//     ? filteredByLocation
//         .filter((s) => s.grade === internalGrade)
//         .sort((a, b) => {
//           // Sort by School Name first
//           if (a.schoolName !== b.schoolName) {
//             return a.schoolName.localeCompare(b.schoolName);
//           }
//           // Sort by Grade
//           const gradeAIndex = gradeOrder.indexOf(a.grade);
//           const gradeBIndex = gradeOrder.indexOf(b.grade);
//           if (gradeAIndex !== gradeBIndex) {
//             return gradeAIndex - gradeBIndex;
//           }
//           // Sort by Student ID last
//           return a.id.localeCompare(b.id);
//         })
//     : filteredByLocation;

//   // Count active filters
//   const activeFiltersCount = [internalDistrict, internalSchool, internalGrade, internalStudent].filter(Boolean).length;

//   return (
//     <div className="flex flex-col space-y-5">
//       {/* Clear Filters Button */}
//       {activeFiltersCount > 0 && (
//         <div className="flex justify-between items-center">
//           <span className="text-sm text-gray-600">
//             {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
//           </span>
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={clearAllFilters}
//             className="text-red-600 hover:text-red-700 hover:bg-red-50"
//           >
//             <X className="h-4 w-4 mr-1" />
//             Clear All
//           </Button>
//         </div>
//       )}

//       {/* District Dropdown */}
//       <div className="space-y-2">
//         <label className="block text-base font-semibold text-gray-700">
//           District
//         </label>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button 
//               variant="outline" 
//               className={`w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px] ${
//                 internalDistrict ? 'ring-2 ring-blue-200 border-blue-300' : ''
//               }`}
//             >
//               <span className="truncate">
//                 {internalDistrict || "Select district"}
//               </span>
//               <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent className="max-h-60 overflow-y-auto w-full min-w-[240px]">
//             <DropdownMenuItem
//               onClick={() => updateFilters({ 
//                 district: null, 
//                 school: null, 
//                 grade: null, 
//                 student: null 
//               })}
//               className="text-base py-2 cursor-pointer text-gray-500"
//             >
//               <div className="flex items-center w-full">
//                 <span className="mr-2 w-4">
//                   {!internalDistrict && <Check className="h-4 w-4" />}
//                 </span>
//                 All Districts
//               </div>
//             </DropdownMenuItem>
//             {districtNames.map((district) => (
//               <DropdownMenuItem
//                 key={district}
//                 onClick={() => updateFilters({ 
//                   district, 
//                   school: null, 
//                   grade: null, 
//                   student: null 
//                 })}
//                 className="text-base py-2 cursor-pointer"
//               >
//                 <div className="flex items-center w-full">
//                   <span className="mr-2 w-4">
//                     {internalDistrict === district && (
//                       <Check className="h-4 w-4" />
//                     )}
//                   </span>
//                   {district}
//                 </div>
//               </DropdownMenuItem>
//             ))}
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>

//       {/* School Dropdown */}
//       <div className="space-y-2">
//         <label className="block text-base font-semibold text-gray-700">
//           School
//         </label>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button 
//               variant="outline" 
//               className={`w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px] ${
//                 internalSchool ? 'ring-2 ring-blue-200 border-blue-300' : ''
//               }`}
//             >
//               <span className="truncate">
//                 {internalSchool || "Select school"}
//               </span>
//               <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent className="max-h-60 overflow-y-auto w-full min-w-[240px]">
//             <DropdownMenuItem
//               onClick={() => updateFilters({ 
//                 school: null, 
//                 grade: null, 
//                 student: null 
//               })}
//               className="text-base py-2 cursor-pointer text-gray-500"
//             >
//               <div className="flex items-center w-full">
//                 <span className="mr-2 w-4">
//                   {!internalSchool && <Check className="h-4 w-4" />}
//                 </span>
//                 All Schools
//               </div>
//             </DropdownMenuItem>
//             {schoolNames.length === 0 ? (
//               <DropdownMenuItem disabled className="text-base py-2">
//                 No schools available
//               </DropdownMenuItem>
//             ) : (
//               schoolNames.map((school) => (
//                 <DropdownMenuItem
//                   key={school}
//                   onClick={() => updateFilters({ 
//                     school, 
//                     grade: null, 
//                     student: null 
//                   })}
//                   className="text-base py-2 cursor-pointer"
//                 >
//                   <div className="flex items-center w-full">
//                     <span className="mr-2 w-4">
//                       {internalSchool === school && (
//                         <Check className="h-4 w-4" />
//                       )}
//                     </span>
//                     {school}
//                   </div>
//                 </DropdownMenuItem>
//               ))
//             )}
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>

//       {/* Grade Dropdown */}
//       <div className="space-y-2">
//         <label className="block text-base font-semibold text-gray-700">
//           Grade
//         </label>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button 
//               variant="outline" 
//               className={`w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px] ${
//                 internalGrade ? 'ring-2 ring-blue-200 border-blue-300' : ''
//               }`}
//             >
//               <span className="truncate">
//                 {internalGrade || "Select grade"}
//               </span>
//               <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent className="max-h-60 overflow-y-auto w-full min-w-[240px]">
//             <DropdownMenuItem
//               onClick={() => updateFilters({ 
//                 grade: null, 
//                 student: null 
//               })}
//               className="text-base py-2 cursor-pointer text-gray-500"
//             >
//               <div className="flex items-center w-full">
//                 <span className="mr-2 w-4">
//                   {!internalGrade && <Check className="h-4 w-4" />}
//                 </span>
//                 All Grades
//               </div>
//             </DropdownMenuItem>
//             {availableGrades.length === 0 ? (
//               <DropdownMenuItem disabled className="text-base py-2">
//                 No grades available
//               </DropdownMenuItem>
//             ) : (
//               availableGrades.map((grade) => (
//                 <DropdownMenuItem
//                   key={grade}
//                   onClick={() => updateFilters({ 
//                     grade, 
//                     student: null 
//                   })}
//                   className="text-base py-2 cursor-pointer"
//                 >
//                   <div className="flex items-center w-full">
//                     <span className="mr-2 w-4">
//                       {internalGrade === grade && <Check className="h-4 w-4" />}
//                     </span>
//                     {grade}
//                   </div>
//                 </DropdownMenuItem>
//               ))
//             )}
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>

//       {/* Student Dropdown */}
//       <div className="space-y-2">
//         <label className="block text-base font-semibold text-gray-700">
//           Student
//         </label>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button
//               variant="outline"
//               className={`w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px] ${
//                 internalStudent ? 'ring-2 ring-blue-200 border-blue-300' : ''
//               }`}
//             >
//               <span className="truncate">
//                 {internalStudent?.id || "Select student"}
//               </span>
//               <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent className="max-h-60 overflow-y-auto w-full min-w-[240px]">
//             <DropdownMenuItem
//               onClick={() => updateFilters({ student: null })}
//               className="text-base py-2 cursor-pointer text-gray-500"
//             >
//               <div className="flex items-center w-full">
//                 <span className="mr-2 w-4">
//                   {!internalStudent && <Check className="h-4 w-4" />}
//                 </span>
//                 No specific student
//               </div>
//             </DropdownMenuItem>
//             {filteredStudents.length === 0 ? (
//               <DropdownMenuItem disabled className="text-base py-2">
//                 No students available
//               </DropdownMenuItem>
//             ) : (
//               filteredStudents.map((s) => (
//                 <DropdownMenuItem
//                   key={s.id}
//                   onClick={() => updateFilters({ student: s })}
//                   className="text-base py-2 cursor-pointer"
//                 >
//                   <div className="flex items-center justify-between w-full">
//                     <div className="flex items-center">
//                       <span className="mr-2 w-4">
//                         {internalStudent?.id === s.id && (
//                           <Check className="h-4 w-4" />
//                         )}
//                       </span>
//                       {s.id}
//                     </div>
//                     <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
//                       {s.grade}
//                     </span>
//                   </div>
//                 </DropdownMenuItem>
//               ))
//             )}
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>

//       {/* Summary of current selection */}
//       {activeFiltersCount > 0 && (
//         <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
//           <h4 className="font-semibold text-sm text-blue-800 mb-2">Current Selection:</h4>
//           <div className="space-y-1 text-sm text-blue-700">
//             {internalDistrict && (
//               <div>District: <span className="font-medium">{internalDistrict}</span></div>
//             )}
//             {internalSchool && (
//               <div>School: <span className="font-medium">{internalSchool}</span></div>
//             )}
//             {internalGrade && (
//               <div>Grade: <span className="font-medium">{internalGrade}</span></div>
//             )}
//             {internalStudent && (
//               <div>Student: <span className="font-medium">{internalStudent.id}</span></div>
//             )}
//             {!internalStudent && (internalDistrict || internalSchool || internalGrade) && (
//               <div className="text-blue-600 font-medium">
//                 Showing aggregated data for {
//                   [
//                     internalDistrict && 'district',
//                     internalSchool && 'school', 
//                     internalGrade && 'grade'
//                   ].filter(Boolean).join(', ')
//                 }
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };



//2nd iteration with improved filtering and state management
// import React, { useMemo } from "react";
// import { Student } from "@/types";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Check, ChevronDown, X } from "lucide-react";

// interface Props {
//   students: Student[];
//   selectedStudent: Student | null;
//   onSelect: (s: Student | null) => void;
//   onFiltersChange: (filters: {
//     district: string | null;
//     school: string | null;
//     grade: string | null;
//     student: Student | null;
//   }) => void;
//   selectedDistrict: string | null;
//   selectedSchool: string | null;
//   selectedGrade: string | null;
// }

// const gradeOrder = [
//   "Pre-Kindergarten", "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade",
//   "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade",
//   "9th Grade", "10th Grade", "11th Grade", "12th Grade",
// ];

// export const StudentSelector: React.FC<Props> = ({
//   students,
//   selectedStudent,
//   onSelect,
//   onFiltersChange,
//   selectedDistrict,
//   selectedSchool,
//   selectedGrade,
// }) => {
//   // Memoized computed values
//   const {
//     districtNames,
//     schoolNames,
//     availableGrades,
//     filteredStudents,
//     activeFiltersCount
//   } = useMemo(() => {
//     // Filter students by district
//     const filteredByDistrict = selectedDistrict
//       ? students.filter(s => s.districtName === selectedDistrict)
//       : students;

//     // Filter by school
//     const filteredByLocation = selectedSchool
//       ? filteredByDistrict.filter(s => s.schoolName === selectedSchool)
//       : filteredByDistrict;

//     // Filter by grade
//     const finalFilteredStudents = selectedGrade
//       ? filteredByLocation.filter(s => s.grade === selectedGrade)
//       : filteredByLocation;

//     return {
//       districtNames: Array.from(new Set(students.map(s => s.districtName))).sort(),
//       schoolNames: Array.from(new Set(filteredByDistrict.map(s => s.schoolName))).sort(),
//       availableGrades: Array.from(new Set(filteredByLocation.map(s => s.grade)))
//         .sort((a, b) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b)),
//       filteredStudents: finalFilteredStudents.sort((a, b) => {
//         if (a.schoolName !== b.schoolName) return a.schoolName.localeCompare(b.schoolName);
//         const gradeAIndex = gradeOrder.indexOf(a.grade);
//         const gradeBIndex = gradeOrder.indexOf(b.grade);
//         if (gradeAIndex !== gradeBIndex) return gradeAIndex - gradeBIndex;
//         return a.id.localeCompare(b.id);
//       }),
//       activeFiltersCount: [selectedDistrict, selectedSchool, selectedGrade, selectedStudent]
//         .filter(Boolean).length
//     };
//   }, [students, selectedDistrict, selectedSchool, selectedGrade, selectedStudent]);

//   // Simplified update function
//   const updateFilters = (updates: Partial<{
//     district: string | null;
//     school: string | null;
//     grade: string | null;
//     student: Student | null;
//   }>) => {
//     const newFilters = {
//       district: updates.district !== undefined ? updates.district : selectedDistrict,
//       school: updates.school !== undefined ? updates.school : selectedSchool,
//       grade: updates.grade !== undefined ? updates.grade : selectedGrade,
//       student: updates.student !== undefined ? updates.student : selectedStudent,
//     };

//     onFiltersChange(newFilters);
//     if (updates.student !== undefined) {
//       onSelect(newFilters.student);
//     }
//   };

//   const clearAllFilters = () => updateFilters({
//     district: null,
//     school: null,
//     grade: null,
//     student: null,
//   });

//   // Reusable dropdown component
//   const FilterDropdown = ({ 
//     label, 
//     value, 
//     placeholder, 
//     options, 
//     onSelect, 
//     clearOthers = [] 
//   }: {
//     label: string;
//     value: string | null;
//     placeholder: string;
//     options: string[];
//     onSelect: (value: string | null) => void;
//     clearOthers?: string[];
//   }) => (
//     <div className="space-y-2">
//       <label className="block text-base font-semibold text-gray-700">{label}</label>
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button 
//             variant="outline" 
//             className={`w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px] ${
//               value ? 'ring-2 ring-blue-200 border-blue-300' : ''
//             }`}
//           >
//             <span className="truncate">{value || placeholder}</span>
//             <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent className="max-h-60 overflow-y-auto w-full min-w-[240px]">
//           <DropdownMenuItem
//             onClick={() => onSelect(null)}
//             className="text-base py-2 cursor-pointer text-gray-500"
//           >
//             <div className="flex items-center w-full">
//               <span className="mr-2 w-4">{!value && <Check className="h-4 w-4" />}</span>
//               All {label}s
//             </div>
//           </DropdownMenuItem>
//           {options.length === 0 ? (
//             <DropdownMenuItem disabled className="text-base py-2">
//               No {label.toLowerCase()}s available
//             </DropdownMenuItem>
//           ) : (
//             options.map((option) => (
//               <DropdownMenuItem
//                 key={option}
//                 onClick={() => onSelect(option)}
//                 className="text-base py-2 cursor-pointer"
//               >
//                 <div className="flex items-center w-full">
//                   <span className="mr-2 w-4">
//                     {value === option && <Check className="h-4 w-4" />}
//                   </span>
//                   {option}
//                 </div>
//               </DropdownMenuItem>
//             ))
//           )}
//         </DropdownMenuContent>
//       </DropdownMenu>
//     </div>
//   );

//   return (
//     <div className="flex flex-col space-y-5">
//       {/* Clear Filters Button */}
//       {activeFiltersCount > 0 && (
//         <div className="flex justify-between items-center">
//           <span className="text-sm text-gray-600">
//             {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
//           </span>
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={clearAllFilters}
//             className="text-red-600 hover:text-red-700 hover:bg-red-50"
//           >
//             <X className="h-4 w-4 mr-1" />
//             Clear All
//           </Button>
//         </div>
//       )}

//       {/* Filter Dropdowns */}
//       <FilterDropdown
//         label="District"
//         value={selectedDistrict}
//         placeholder="Select district"
//         options={districtNames}
//         onSelect={(district) => updateFilters({ 
//           district, 
//           school: null, 
//           grade: null, 
//           student: null 
//         })}
//       />

//       <FilterDropdown
//         label="School"
//         value={selectedSchool}
//         placeholder="Select school"
//         options={schoolNames}
//         onSelect={(school) => updateFilters({ 
//           school, 
//           grade: null, 
//           student: null 
//         })}
//       />

//       <FilterDropdown
//         label="Grade"
//         value={selectedGrade}
//         placeholder="Select grade"
//         options={availableGrades}
//         onSelect={(grade) => updateFilters({ 
//           grade, 
//           student: null 
//         })}
//       />

//       {/* Student Dropdown - Special case with additional info */}
//       <div className="space-y-2">
//         <label className="block text-base font-semibold text-gray-700">Student</label>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button
//               variant="outline"
//               className={`w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px] ${
//                 selectedStudent ? 'ring-2 ring-blue-200 border-blue-300' : ''
//               }`}
//             >
//               <span className="truncate">
//                 {selectedStudent?.id || "Select student"}
//               </span>
//               <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent className="max-h-60 overflow-y-auto w-full min-w-[240px]">
//             <DropdownMenuItem
//               onClick={() => updateFilters({ student: null })}
//               className="text-base py-2 cursor-pointer text-gray-500"
//             >
//               <div className="flex items-center w-full">
//                 <span className="mr-2 w-4">
//                   {!selectedStudent && <Check className="h-4 w-4" />}
//                 </span>
//                 No specific student
//               </div>
//             </DropdownMenuItem>
//             {filteredStudents.length === 0 ? (
//               <DropdownMenuItem disabled className="text-base py-2">
//                 No students available
//               </DropdownMenuItem>
//             ) : (
//               filteredStudents.map((s) => (
//                 <DropdownMenuItem
//                   key={s.id}
//                   onClick={() => updateFilters({ student: s })}
//                   className="text-base py-2 cursor-pointer"
//                 >
//                   <div className="flex items-center justify-between w-full">
//                     <div className="flex items-center">
//                       <span className="mr-2 w-4">
//                         {selectedStudent?.id === s.id && <Check className="h-4 w-4" />}
//                       </span>
//                       {s.id}
//                     </div>
//                     <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
//                       {s.grade}
//                     </span>
//                   </div>
//                 </DropdownMenuItem>
//               ))
//             )}
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>

//       {/* Current Selection Summary */}
//       {activeFiltersCount > 0 && (
//         <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
//           <h4 className="font-semibold text-sm text-blue-800 mb-2">Current Selection:</h4>
//           <div className="space-y-1 text-sm text-blue-700">
//             {selectedDistrict && <div>District: <span className="font-medium">{selectedDistrict}</span></div>}
//             {selectedSchool && <div>School: <span className="font-medium">{selectedSchool}</span></div>}
//             {selectedGrade && <div>Grade: <span className="font-medium">{selectedGrade}</span></div>}
//             {selectedStudent && <div>Student: <span className="font-medium">{selectedStudent.id}</span></div>}
//             {!selectedStudent && (selectedDistrict || selectedSchool || selectedGrade) && (
//               <div className="text-blue-600 font-medium">
//                 Showing aggregated data for {
//                   [
//                     selectedDistrict && 'district',
//                     selectedSchool && 'school', 
//                     selectedGrade && 'grade'
//                   ].filter(Boolean).join(', ')
//                 }
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };


// //C updated frontend
// import React, { useMemo } from "react";
// import { Student } from "@/types";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Check, ChevronDown, X, Info } from "lucide-react";

// interface Props {
//   students: Student[];
//   selectedStudent: Student | null;
//   onSelect: (s: Student | null) => void;
//   onFiltersChange: (filters: {
//     district: string | null;
//     school: string | null;
//     grade: string | null;
//     student: Student | null;
//   }) => void;
//   selectedDistrict: string | null;
//   selectedSchool: string | null;
//   selectedGrade: string | null;
// }

// const gradeOrder = [
//   "Pre-Kindergarten", "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade",
//   "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade",
//   "9th Grade", "10th Grade", "11th Grade", "12th Grade",
// ];

// export const StudentSelector: React.FC<Props> = ({
//   students,
//   selectedStudent,
//   onSelect,
//   onFiltersChange,
//   selectedDistrict,
//   selectedSchool,
//   selectedGrade,
// }) => {
//   // Memoized computed values
//   const {
//     districtNames,
//     schoolNames,
//     availableGrades,
//     filteredStudents,
//     activeFiltersCount,
//     currentApiLevel
//   } = useMemo(() => {
//     // Filter students by district
//     const filteredByDistrict = selectedDistrict
//       ? students.filter(s => s.districtName === selectedDistrict)
//       : students;

//     // Filter by school
//     const filteredByLocation = selectedSchool
//       ? filteredByDistrict.filter(s => s.schoolName === selectedSchool)
//       : filteredByDistrict;

//     // Filter by grade
//     const finalFilteredStudents = selectedGrade
//       ? filteredByLocation.filter(s => s.grade === selectedGrade)
//       : filteredByLocation;

//     // Determine current API level
//     let apiLevel = "None";
//     if (selectedStudent) {
//       apiLevel = "Student";
//     } else if (selectedGrade && (selectedDistrict || selectedSchool)) {
//       apiLevel = "Grade";
//     } else if (selectedSchool && selectedDistrict) {
//       apiLevel = "School";
//     } else if (selectedDistrict) {
//       apiLevel = "District";
//     }

//     return {
//       districtNames: Array.from(new Set(students.map(s => s.districtName))).sort(),
//       schoolNames: Array.from(new Set(filteredByDistrict.map(s => s.schoolName))).sort(),
//       availableGrades: Array.from(new Set(filteredByLocation.map(s => s.grade)))
//         .sort((a, b) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b)),
//       filteredStudents: finalFilteredStudents.sort((a, b) => {
//         if (a.schoolName !== b.schoolName) return a.schoolName.localeCompare(b.schoolName);
//         const gradeAIndex = gradeOrder.indexOf(a.grade);
//         const gradeBIndex = gradeOrder.indexOf(b.grade);
//         if (gradeAIndex !== gradeBIndex) return gradeAIndex - gradeBIndex;
//         return a.id.localeCompare(b.id);
//       }),
//       activeFiltersCount: [selectedDistrict, selectedSchool, selectedGrade, selectedStudent]
//         .filter(Boolean).length,
//       currentApiLevel: apiLevel
//     };
//   }, [students, selectedDistrict, selectedSchool, selectedGrade, selectedStudent]);

//   // Simplified update function
//   const updateFilters = (updates: Partial<{
//     district: string | null;
//     school: string | null;
//     grade: string | null;
//     student: Student | null;
//   }>) => {
//     const newFilters = {
//       district: updates.district !== undefined ? updates.district : selectedDistrict,
//       school: updates.school !== undefined ? updates.school : selectedSchool,
//       grade: updates.grade !== undefined ? updates.grade : selectedGrade,
//       student: updates.student !== undefined ? updates.student : selectedStudent,
//     };

//     onFiltersChange(newFilters);
//     if (updates.student !== undefined) {
//       onSelect(newFilters.student);
//     }
//   };

//   const clearAllFilters = () => updateFilters({
//     district: null,
//     school: null,
//     grade: null,
//     student: null,
//   });

//   // Reusable dropdown component
//   const FilterDropdown = ({ 
//     label, 
//     value, 
//     placeholder, 
//     options, 
//     onSelect, 
//     disabled = false,
//     disabledReason
//   }: {
//     label: string;
//     value: string | null;
//     placeholder: string;
//     options: string[];
//     onSelect: (value: string | null) => void;
//     disabled?: boolean;
//     disabledReason?: string;
//   }) => (
//     <div className="space-y-2">
//       <label className={`block text-base font-semibold ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
//         {label}
//         {disabled && disabledReason && (
//           <span className="ml-2 text-xs text-gray-500">({disabledReason})</span>
//         )}
//       </label>
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button 
//             variant="outline" 
//             disabled={disabled}
//             className={`w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px] ${
//               value ? 'ring-2 ring-blue-200 border-blue-300' : ''
//             } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
//           >
//             <span className="truncate">{value || placeholder}</span>
//             <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
//           </Button>
//         </DropdownMenuTrigger>
//         {!disabled && (
//           <DropdownMenuContent className="max-h-60 overflow-y-auto w-full min-w-[240px]">
//             <DropdownMenuItem
//               onClick={() => onSelect(null)}
//               className="text-base py-2 cursor-pointer text-gray-500"
//             >
//               <div className="flex items-center w-full">
//                 <span className="mr-2 w-4">{!value && <Check className="h-4 w-4" />}</span>
//                 All {label}s
//               </div>
//             </DropdownMenuItem>
//             {options.length === 0 ? (
//               <DropdownMenuItem disabled className="text-base py-2">
//                 No {label.toLowerCase()}s available
//               </DropdownMenuItem>
//             ) : (
//               options.map((option) => (
//                 <DropdownMenuItem
//                   key={option}
//                   onClick={() => onSelect(option)}
//                   className="text-base py-2 cursor-pointer"
//                 >
//                   <div className="flex items-center w-full">
//                     <span className="mr-2 w-4">
//                       {value === option && <Check className="h-4 w-4" />}
//                     </span>
//                     {option}
//                   </div>
//                 </DropdownMenuItem>
//               ))
//             )}
//           </DropdownMenuContent>
//         )}
//       </DropdownMenu>
//     </div>
//   );

//   return (
//     <div className="flex flex-col space-y-5">
//       {/* API Level Indicator */}
//       <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
//         <div className="flex items-center gap-2 mb-2">
//           <Info className="h-4 w-4 text-blue-600" />
//           <span className="text-sm font-semibold text-blue-800">Data Level: {currentApiLevel}</span>
//         </div>
//         <div className="text-xs text-blue-700">
//           {currentApiLevel === "Student" && "Individual student data"}
//           {currentApiLevel === "Grade" && "Aggregated data for specific grade"}
//           {currentApiLevel === "School" && "Aggregated data for entire school"}
//           {currentApiLevel === "District" && "Aggregated data for entire district"}
//           {currentApiLevel === "None" && "No data will be loaded"}
//         </div>
//       </div>

//       {/* Clear Filters Button */}
//       {activeFiltersCount > 0 && (
//         <div className="flex justify-between items-center">
//           <span className="text-sm text-gray-600">
//             {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
//           </span>
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={clearAllFilters}
//             className="text-red-600 hover:text-red-700 hover:bg-red-50"
//           >
//             <X className="h-4 w-4 mr-1" />
//             Clear All
//           </Button>
//         </div>
//       )}

//       {/* Filter Dropdowns */}
//       <FilterDropdown
//         label="District"
//         value={selectedDistrict}
//         placeholder="Select district"
//         options={districtNames}
//         onSelect={(district) => updateFilters({ 
//           district, 
//           school: null, 
//           grade: null, 
//           student: null 
//         })}
//       />

//       <FilterDropdown
//         label="School"
//         value={selectedSchool}
//         placeholder="Select school"
//         options={schoolNames}
//         disabled={!selectedDistrict}
//         disabledReason={!selectedDistrict ? "Select district first" : ""}
//         onSelect={(school) => updateFilters({ 
//           school, 
//           grade: null, 
//           student: null 
//         })}
//       />

//       <FilterDropdown
//         label="Grade"
//         value={selectedGrade}
//         placeholder="Select grade"
//         options={availableGrades}
//         disabled={!selectedDistrict && !selectedSchool}
//         disabledReason={!selectedDistrict && !selectedSchool ? "Select district or school first" : ""}
//         onSelect={(grade) => updateFilters({ 
//           grade, 
//           student: null 
//         })}
//       />

//       {/* Student Dropdown - Special case with additional info */}
//       <div className="space-y-2">
//         <label className={`block text-base font-semibold ${
//           (!selectedDistrict && !selectedSchool && !selectedGrade) ? 'text-gray-400' : 'text-gray-700'
//         }`}>
//           Student
//           {(!selectedDistrict && !selectedSchool && !selectedGrade) && (
//             <span className="ml-2 text-xs text-gray-500">(Select filters first)</span>
//           )}
//         </label>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button
//               variant="outline"
//               disabled={!selectedDistrict && !selectedSchool && !selectedGrade}
//               className={`w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px] ${
//                 selectedStudent ? 'ring-2 ring-blue-200 border-blue-300' : ''
//               } ${(!selectedDistrict && !selectedSchool && !selectedGrade) ? 'opacity-50 cursor-not-allowed' : ''}`}
//             >
//               <span className="truncate">
//                 {selectedStudent?.id || "Select student"}
//               </span>
//               <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
//             </Button>
//           </DropdownMenuTrigger>
//           {(selectedDistrict || selectedSchool || selectedGrade) && (
//             <DropdownMenuContent className="max-h-60 overflow-y-auto w-full min-w-[240px]">
//               <DropdownMenuItem
//                 onClick={() => updateFilters({ student: null })}
//                 className="text-base py-2 cursor-pointer text-gray-500"
//               >
//                 <div className="flex items-center w-full">
//                   <span className="mr-2 w-4">
//                     {!selectedStudent && <Check className="h-4 w-4" />}
//                   </span>
//                   No specific student
//                 </div>
//               </DropdownMenuItem>
//               {filteredStudents.length === 0 ? (
//                 <DropdownMenuItem disabled className="text-base py-2">
//                   No students available
//                 </DropdownMenuItem>
//               ) : (
//                 filteredStudents.map((s) => (
//                   <DropdownMenuItem
//                     key={s.id}
//                     onClick={() => updateFilters({ student: s })}
//                     className="text-base py-2 cursor-pointer"
//                   >
//                     <div className="flex items-center justify-between w-full">
//                       <div className="flex items-center">
//                         <span className="mr-2 w-4">
//                           {selectedStudent?.id === s.id && <Check className="h-4 w-4" />}
//                         </span>
//                         {s.id}
//                       </div>
//                       <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
//                         {s.grade}
//                       </span>
//                     </div>
//                   </DropdownMenuItem>
//                 ))
//               )}
//             </DropdownMenuContent>
//           )}
//         </DropdownMenu>
//       </div>

//       {/* Current Selection Summary */}
//       {activeFiltersCount > 0 && (
//         <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
//           <h4 className="font-semibold text-sm text-green-800 mb-2">Current Selection:</h4>
//           <div className="space-y-1 text-sm text-green-700">
//             {selectedDistrict && <div>District: <span className="font-medium">{selectedDistrict}</span></div>}
//             {selectedSchool && <div>School: <span className="font-medium">{selectedSchool}</span></div>}
//             {selectedGrade && <div>Grade: <span className="font-medium">{selectedGrade}</span></div>}
//             {selectedStudent && <div>Student: <span className="font-medium">{selectedStudent.id}</span></div>}
//             {!selectedStudent && (selectedDistrict || selectedSchool || selectedGrade) && (
//               <div className="text-green-600 font-medium">
//                 API Endpoint: /{currentApiLevel}Data/ByFilters
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Filter Selection Guidance */}
//       {currentApiLevel === "None" && (
//         <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
//           <h4 className="font-semibold text-sm text-yellow-800 mb-2">Selection Guide:</h4>
//           <div className="space-y-1 text-xs text-yellow-700">
//             <div>• <strong>District only:</strong> View district-wide attendance data</div>
//             <div>• <strong>District + School:</strong> View specific school data</div>
//             <div>• <strong>District/School + Grade:</strong> View grade-level data</div>
//             <div>• <strong>Any filters + Student:</strong> View individual student data</div>
//           </div>
//         </div>
//       )}

//       {/* Data Summary */}
//       {activeFiltersCount > 0 && filteredStudents.length > 0 && !selectedStudent && (
//         <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
//           <h4 className="font-semibold text-sm text-gray-700 mb-1">Data Summary:</h4>
//           <div className="text-xs text-gray-600">
//             {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} match your current filters
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// working version
// import React, { useMemo } from "react";
// import { Student } from "@/types";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Check, ChevronDown, X, Info } from "lucide-react";

// interface Props {
//   students: Student[];
//   selectedStudent: Student | null;
//   onSelect: (s: Student | null) => void;
//   onFiltersChange: (filters: {
//     district: string | null;
//     school: string | null;
//     grade: string | null;
//     student: Student | null;
//   }) => void;
//   selectedDistrict: string | null;
//   selectedSchool: string | null;
//   selectedGrade: string | null;
// }

// const gradeOrder = [
//   "Pre-Kindergarten", "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade",
//   "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade",
//   "9th Grade", "10th Grade", "11th Grade", "12th Grade",
// ];

// export const StudentSelector: React.FC<Props> = ({
//   students,
//   selectedStudent,
//   onSelect,
//   onFiltersChange,
//   selectedDistrict,
//   selectedSchool,
//   selectedGrade,
// }) => {
//   // Memoized computed values
//   const {
//     districtNames,
//     schoolNames,
//     availableGrades,
//     filteredStudents,
//     activeFiltersCount,
//     currentApiLevel,
//     selectionPath
//   } = useMemo(() => {
//     // Determine selection path
//     let path = "None";
//     if (selectedDistrict && selectedSchool) {
//       path = "District→School";
//     } else if (selectedDistrict && !selectedSchool) {
//       path = "District Only";
//     } else if (!selectedDistrict && selectedSchool) {
//       path = "Direct School";
//     }

//     // Get all districts and schools for independent selection
//     const allDistricts = Array.from(new Set(students.map(s => s.districtName))).sort();
//     const allSchools = Array.from(new Set(students.map(s => s.schoolName))).sort();

//     // Filter logic based on selection path
//     let filteredByLocation = students;
//     let schoolOptions = allSchools;
    
//     if (selectedDistrict && selectedSchool) {
//       // Both selected - filter by both
//       filteredByLocation = students.filter(s => 
//         s.districtName === selectedDistrict && s.schoolName === selectedSchool
//       );
//     } else if (selectedDistrict && !selectedSchool) {
//       // District only - filter by district, show schools from district
//       filteredByLocation = students.filter(s => s.districtName === selectedDistrict);
//       schoolOptions = Array.from(new Set(filteredByLocation.map(s => s.schoolName))).sort();
//     } else if (!selectedDistrict && selectedSchool) {
//       // School only - filter by school
//       filteredByLocation = students.filter(s => s.schoolName === selectedSchool);
//     }
//     // If neither selected, show all students

//     // Filter by grade
//     const finalFilteredStudents = selectedGrade
//       ? filteredByLocation.filter(s => s.grade === selectedGrade)
//       : filteredByLocation;

//     // Available grades based on current location filter
//     const grades = Array.from(new Set(filteredByLocation.map(s => s.grade)))
//       .sort((a, b) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b));

//     // Determine current API level
//     let apiLevel = "None";
//     if (selectedStudent) {
//       apiLevel = "Student";
//     } else if (selectedGrade && (selectedDistrict || selectedSchool)) {
//       apiLevel = "Grade";
//     } else if (selectedSchool && selectedDistrict) {
//       apiLevel = "School";
//     } else if (selectedDistrict) {
//       apiLevel = "District";
//     }

//     return {
//       districtNames: allDistricts,
//       schoolNames: schoolOptions,
//       availableGrades: grades,
//       filteredStudents: finalFilteredStudents.sort((a, b) => {
//         if (a.schoolName !== b.schoolName) return a.schoolName.localeCompare(b.schoolName);
//         const gradeAIndex = gradeOrder.indexOf(a.grade);
//         const gradeBIndex = gradeOrder.indexOf(b.grade);
//         if (gradeAIndex !== gradeBIndex) return gradeAIndex - gradeBIndex;
//         return a.id.localeCompare(b.id);
//       }),
//       activeFiltersCount: [selectedDistrict, selectedSchool, selectedGrade, selectedStudent]
//         .filter(Boolean).length,
//       currentApiLevel: apiLevel,
//       selectionPath: path
//     };
//   }, [students, selectedDistrict, selectedSchool, selectedGrade, selectedStudent]);

//   // Simplified update function
//   const updateFilters = (updates: Partial<{
//     district: string | null;
//     school: string | null;
//     grade: string | null;
//     student: Student | null;
//   }>) => {
//     const newFilters = {
//       district: updates.district !== undefined ? updates.district : selectedDistrict,
//       school: updates.school !== undefined ? updates.school : selectedSchool,
//       grade: updates.grade !== undefined ? updates.grade : selectedGrade,
//       student: updates.student !== undefined ? updates.student : selectedStudent,
//     };

//     onFiltersChange(newFilters);
//     if (updates.student !== undefined) {
//       onSelect(newFilters.student);
//     }
//   };

//   const clearAllFilters = () => updateFilters({
//     district: null,
//     school: null,
//     grade: null,
//     student: null,
//   });

//   // Handle district selection
//   const handleDistrictSelect = (district: string | null) => {
//     if (district) {
//       // If selecting a district, clear school, grade, and student
//       updateFilters({ 
//         district, 
//         school: null, 
//         grade: null, 
//         student: null 
//       });
//     } else {
//       // If clearing district, keep other selections if they're still valid
//       updateFilters({ district: null });
//     }
//   };

//   // Handle school selection
//   const handleSchoolSelect = (school: string | null) => {
//     if (school) {
//       // If selecting a school, clear grade and student, but keep district if it matches
//       const schoolDistrict = students.find(s => s.schoolName === school)?.districtName;
      
//       if (selectedDistrict && schoolDistrict === selectedDistrict) {
//         // Keep district if it matches the school's district
//         updateFilters({ 
//           school, 
//           grade: null, 
//           student: null 
//         });
//       } else {
//         // Clear district if it doesn't match or wasn't selected
//         updateFilters({ 
//           district: null,
//           school, 
//           grade: null, 
//           student: null 
//         });
//       }
//     } else {
//       // If clearing school, clear dependent selections
//       updateFilters({ 
//         school: null, 
//         grade: null, 
//         student: null 
//       });
//     }
//   };

//   // Reusable dropdown component
//   const FilterDropdown = ({ 
//     label, 
//     value, 
//     placeholder, 
//     options, 
//     onSelect, 
//     disabled = false,
//     disabledReason
//   }: {
//     label: string;
//     value: string | null;
//     placeholder: string;
//     options: string[];
//     onSelect: (value: string | null) => void;
//     disabled?: boolean;
//     disabledReason?: string;
//   }) => (
//     <div className="space-y-2">
//       <label className={`block text-base font-semibold ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
//         {label}
//         {disabled && disabledReason && (
//           <span className="ml-2 text-xs text-gray-500">({disabledReason})</span>
//         )}
//       </label>
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button 
//             variant="outline" 
//             disabled={disabled}
//             className={`w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px] ${
//               value ? 'ring-2 ring-blue-200 border-blue-300' : ''
//             } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
//           >
//             <span className="truncate">{value || placeholder}</span>
//             <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
//           </Button>
//         </DropdownMenuTrigger>
//         {!disabled && (
//           <DropdownMenuContent className="max-h-60 overflow-y-auto w-full min-w-[240px]">
//             <DropdownMenuItem
//               onClick={() => onSelect(null)}
//               className="text-base py-2 cursor-pointer text-gray-500"
//             >
//               <div className="flex items-center w-full">
//                 <span className="mr-2 w-4">{!value && <Check className="h-4 w-4" />}</span>
//                 All {label}s
//               </div>
//             </DropdownMenuItem>
//             {options.length === 0 ? (
//               <DropdownMenuItem disabled className="text-base py-2">
//                 No {label.toLowerCase()}s available
//               </DropdownMenuItem>
//             ) : (
//               options.map((option) => (
//                 <DropdownMenuItem
//                   key={option}
//                   onClick={() => onSelect(option)}
//                   className="text-base py-2 cursor-pointer"
//                 >
//                   <div className="flex items-center w-full">
//                     <span className="mr-2 w-4">
//                       {value === option && <Check className="h-4 w-4" />}
//                     </span>
//                     {option}
//                   </div>
//                 </DropdownMenuItem>
//               ))
//             )}
//           </DropdownMenuContent>
//         )}
//       </DropdownMenu>
//     </div>
//   );

//   return (
//     <div className="flex flex-col space-y-5">
//       {/* API Level Indicator with Selection Path */}
//       <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
//         <div className="flex items-center gap-2 mb-2">
//           <Info className="h-4 w-4 text-blue-600" />
//           <span className="text-sm font-semibold text-blue-800">Data Level: {currentApiLevel}</span>
//         </div>
//         <div className="text-xs text-blue-700 mb-1">
//           {currentApiLevel === "Student" && "Individual student data"}
//           {currentApiLevel === "Grade" && "Aggregated data for specific grade"}
//           {currentApiLevel === "School" && "Aggregated data for entire school"}
//           {currentApiLevel === "District" && "Aggregated data for entire district"}
//           {currentApiLevel === "None" && "No data will be loaded"}
//         </div>
//         {selectionPath !== "None" && (
//           <div className="text-xs text-blue-600 font-medium">
//             Selection Path: {selectionPath}
//           </div>
//         )}
//       </div>

//       {/* Clear Filters Button */}
//       {activeFiltersCount > 0 && (
//         <div className="flex justify-between items-center">
//           <span className="text-sm text-gray-600">
//             {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
//           </span>
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={clearAllFilters}
//             className="text-red-600 hover:text-red-700 hover:bg-red-50"
//           >
//             <X className="h-4 w-4 mr-1" />
//             Clear All
//           </Button>
//         </div>
//       )}

//       {/* Filter Dropdowns */}
//       <FilterDropdown
//         label="District"
//         value={selectedDistrict}
//         placeholder="Select district"
//         options={districtNames}
//         onSelect={handleDistrictSelect}
//       />

//       <FilterDropdown
//         label="School"
//         value={selectedSchool}
//         placeholder="Select school"
//         options={schoolNames}
//         onSelect={handleSchoolSelect}
//       />

//       <FilterDropdown
//         label="Grade"
//         value={selectedGrade}
//         placeholder="Select grade"
//         options={availableGrades}
//         disabled={!selectedDistrict && !selectedSchool}
//         disabledReason={!selectedDistrict && !selectedSchool ? "Select district or school first" : ""}
//         onSelect={(grade) => updateFilters({ 
//           grade, 
//           student: null 
//         })}
//       />

//       {/* Student Dropdown - Special case with additional info */}
//       <div className="space-y-2">
//         <label className={`block text-base font-semibold ${
//           (!selectedDistrict && !selectedSchool && !selectedGrade) ? 'text-gray-400' : 'text-gray-700'
//         }`}>
//           Student
//           {(!selectedDistrict && !selectedSchool && !selectedGrade) && (
//             <span className="ml-2 text-xs text-gray-500">(Select filters first)</span>
//           )}
//         </label>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button
//               variant="outline"
//               disabled={!selectedDistrict && !selectedSchool && !selectedGrade}
//               className={`w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px] ${
//                 selectedStudent ? 'ring-2 ring-blue-200 border-blue-300' : ''
//               } ${(!selectedDistrict && !selectedSchool && !selectedGrade) ? 'opacity-50 cursor-not-allowed' : ''}`}
//             >
//               <span className="truncate">
//                 {selectedStudent?.id || "Select student"}
//               </span>
//               <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
//             </Button>
//           </DropdownMenuTrigger>
//           {(selectedDistrict || selectedSchool || selectedGrade) && (
//             <DropdownMenuContent className="max-h-60 overflow-y-auto w-full min-w-[240px]">
//               <DropdownMenuItem
//                 onClick={() => updateFilters({ student: null })}
//                 className="text-base py-2 cursor-pointer text-gray-500"
//               >
//                 <div className="flex items-center w-full">
//                   <span className="mr-2 w-4">
//                     {!selectedStudent && <Check className="h-4 w-4" />}
//                   </span>
//                   No specific student
//                 </div>
//               </DropdownMenuItem>
//               {filteredStudents.length === 0 ? (
//                 <DropdownMenuItem disabled className="text-base py-2">
//                   No students available
//                 </DropdownMenuItem>
//               ) : (
//                 filteredStudents.map((s) => (
//                   <DropdownMenuItem
//                     key={s.id}
//                     onClick={() => updateFilters({ student: s })}
//                     className="text-base py-2 cursor-pointer"
//                   >
//                     <div className="flex items-center justify-between w-full">
//                       <div className="flex items-center">
//                         <span className="mr-2 w-4">
//                           {selectedStudent?.id === s.id && <Check className="h-4 w-4" />}
//                         </span>
//                         {s.id}
//                       </div>
//                       <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
//                         {s.grade}
//                       </span>
//                     </div>
//                   </DropdownMenuItem>
//                 ))
//               )}
//             </DropdownMenuContent>
//           )}
//         </DropdownMenu>
//       </div>

//       {/* Current Selection Summary */}
//       {activeFiltersCount > 0 && (
//         <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
//           <h4 className="font-semibold text-sm text-green-800 mb-2">Current Selection:</h4>
//           <div className="space-y-1 text-sm text-green-700">
//             {selectedDistrict && <div>District: <span className="font-medium">{selectedDistrict}</span></div>}
//             {selectedSchool && <div>School: <span className="font-medium">{selectedSchool}</span></div>}
//             {selectedGrade && <div>Grade: <span className="font-medium">{selectedGrade}</span></div>}
//             {selectedStudent && <div>Student: <span className="font-medium">{selectedStudent.id}</span></div>}
//             {!selectedStudent && (selectedDistrict || selectedSchool || selectedGrade) && (
//               <div className="text-green-600 font-medium">
//                 API Endpoint: /{currentApiLevel}Data/ByFilters
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Filter Selection Guidance */}
//       {currentApiLevel === "None" && (
//         <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
//           <h4 className="font-semibold text-sm text-yellow-800 mb-2">Selection Guide:</h4>
//           <div className="space-y-1 text-xs text-yellow-700">
//             <div>• <strong>District only:</strong> View district-wide attendance data</div>
//             <div>• <strong>School only:</strong> View specific school data (direct access)</div>
//             <div>• <strong>District + School:</strong> View specific school data (hierarchical)</div>
//             <div>• <strong>District/School + Grade:</strong> View grade-level data</div>
//             <div>• <strong>Any filters + Student:</strong> View individual student data</div>
//           </div>
//         </div>
//       )}

//       {/* Data Summary */}
//       {activeFiltersCount > 0 && filteredStudents.length > 0 && !selectedStudent && (
//         <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
//           <h4 className="font-semibold text-sm text-gray-700 mb-1">Data Summary:</h4>
//           <div className="text-xs text-gray-600">
//             {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} match your current filters
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };


// import React, { useMemo } from "react";
// import { Student } from "@/types";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Check, ChevronDown, X, Info } from "lucide-react";

// interface Props {
//   students: Student[];
//   selectedStudent: Student | null;
//   onSelect: (s: Student | null) => void;
//   onFiltersChange: (filters: {
//     district: string | null;
//     school: string | null;
//     grade: string | null;
//     student: Student | null;
//   }) => void;
//   selectedDistrict: string | null;
//   selectedSchool: string | null;
//   selectedGrade: string | null;
// }

// const gradeOrder = [
//   "Pre-Kindergarten", "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade",
//   "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade",
//   "9th Grade", "10th Grade", "11th Grade", "12th Grade",
// ];

// export const StudentSelector: React.FC<Props> = ({
//   students,
//   selectedStudent,
//   onSelect,
//   onFiltersChange,
//   selectedDistrict,
//   selectedSchool,
//   selectedGrade,
// }) => {
//   // Memoized computed values
//   const {
//     districtNames,
//     schoolNames,
//     availableGrades,
//     filteredStudents,
//     activeFiltersCount,
//     currentApiLevel,
//     selectionPath
//   } = useMemo(() => {
//     // Determine selection path
//     let path = "All Districts";  // Default to "All Districts" instead of "None"
//     if (selectedDistrict && selectedSchool) {
//       path = "District→School";
//     } else if (selectedDistrict && !selectedSchool) {
//       path = "District Only";
//     } else if (!selectedDistrict && selectedSchool) {
//       path = "Direct School";
//     }

//     // Get all districts and schools for independent selection
//     const allDistricts = Array.from(new Set(students.map(s => s.districtName))).sort();
//     const allSchools = Array.from(new Set(students.map(s => s.schoolName))).sort();

//     // Filter logic based on selection path
//     let filteredByLocation = students;
//     let schoolOptions = allSchools;
    
//     if (selectedDistrict && selectedSchool) {
//       // Both selected - filter by both
//       filteredByLocation = students.filter(s => 
//         s.districtName === selectedDistrict && s.schoolName === selectedSchool
//       );
//     } else if (selectedDistrict && !selectedSchool) {
//       // District only - filter by district, show schools from district
//       filteredByLocation = students.filter(s => s.districtName === selectedDistrict);
//       schoolOptions = Array.from(new Set(filteredByLocation.map(s => s.schoolName))).sort();
//     } else if (!selectedDistrict && selectedSchool) {
//       // School only - filter by school
//       filteredByLocation = students.filter(s => s.schoolName === selectedSchool);
//     }
//     // If neither selected, show all students

//     // Filter by grade
//     const finalFilteredStudents = selectedGrade
//       ? filteredByLocation.filter(s => s.grade === selectedGrade)
//       : filteredByLocation;

//     // Available grades based on current location filter
//     const grades = Array.from(new Set(filteredByLocation.map(s => s.grade)))
//       .sort((a, b) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b));

//     // Determine current API level
//     let apiLevel = "All Districts";  // Default to "All Districts"
//     if (selectedStudent) {
//       apiLevel = "Student";
//     } else if (selectedGrade && (selectedDistrict || selectedSchool)) {
//       apiLevel = "Grade";
//     } else if (selectedSchool && selectedDistrict) {
//       apiLevel = "School";
//     } else if (selectedDistrict) {
//       apiLevel = "District";
//     }

//     return {
//       districtNames: allDistricts,
//       schoolNames: schoolOptions,
//       availableGrades: grades,
//       filteredStudents: finalFilteredStudents.sort((a, b) => {
//         if (a.schoolName !== b.schoolName) return a.schoolName.localeCompare(b.schoolName);
//         const gradeAIndex = gradeOrder.indexOf(a.grade);
//         const gradeBIndex = gradeOrder.indexOf(b.grade);
//         if (gradeAIndex !== gradeBIndex) return gradeAIndex - gradeBIndex;
//         return a.id.localeCompare(b.id);
//       }),
//       activeFiltersCount: [selectedDistrict, selectedSchool, selectedGrade, selectedStudent]
//         .filter(Boolean).length,
//       currentApiLevel: apiLevel,
//       selectionPath: path
//     };
//   }, [students, selectedDistrict, selectedSchool, selectedGrade, selectedStudent]);

//   // Simplified update function
//   const updateFilters = (updates: Partial<{
//     district: string | null;
//     school: string | null;
//     grade: string | null;
//     student: Student | null;
//   }>) => {
//     const newFilters = {
//       district: updates.district !== undefined ? updates.district : selectedDistrict,
//       school: updates.school !== undefined ? updates.school : selectedSchool,
//       grade: updates.grade !== undefined ? updates.grade : selectedGrade,
//       student: updates.student !== undefined ? updates.student : selectedStudent,
//     };

//     onFiltersChange(newFilters);
//     if (updates.student !== undefined) {
//       onSelect(newFilters.student);
//     }
//   };

//   const clearAllFilters = () => updateFilters({
//     district: null,
//     school: null,
//     grade: null,
//     student: null,
//   });

//   // Handle district selection
//   const handleDistrictSelect = (district: string | null) => {
//     if (district) {
//       // If selecting a district, clear school, grade, and student
//       updateFilters({ 
//         district, 
//         school: null, 
//         grade: null, 
//         student: null 
//       });
//     } else {
//       // If clearing district, keep other selections if they're still valid
//       updateFilters({ district: null });
//     }
//   };

//   // Handle school selection
//   const handleSchoolSelect = (school: string | null) => {
//     if (school) {
//       // If selecting a school, clear grade and student, but keep district if it matches
//       const schoolDistrict = students.find(s => s.schoolName === school)?.districtName;
      
//       if (selectedDistrict && schoolDistrict === selectedDistrict) {
//         // Keep district if it matches the school's district
//         updateFilters({ 
//           school, 
//           grade: null, 
//           student: null 
//         });
//       } else {
//         // Clear district if it doesn't match or wasn't selected
//         updateFilters({ 
//           district: null,
//           school, 
//           grade: null, 
//           student: null 
//         });
//       }
//     } else {
//       // If clearing school, clear dependent selections
//       updateFilters({ 
//         school: null, 
//         grade: null, 
//         student: null 
//       });
//     }
//   };

//   // Reusable dropdown component
//   const FilterDropdown = ({ 
//     label, 
//     value, 
//     placeholder, 
//     options, 
//     onSelect, 
//     disabled = false,
//     disabledReason
//   }: {
//     label: string;
//     value: string | null;
//     placeholder: string;
//     options: string[];
//     onSelect: (value: string | null) => void;
//     disabled?: boolean;
//     disabledReason?: string;
//   }) => (
//     <div className="space-y-2">
//       <label className={`block text-base font-semibold ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
//         {label}
//         {disabled && disabledReason && (
//           <span className="ml-2 text-xs text-gray-500">({disabledReason})</span>
//         )}
//       </label>
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button 
//             variant="outline" 
//             disabled={disabled}
//             className={`w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px] ${
//               value ? 'ring-2 ring-blue-200 border-blue-300' : ''
//             } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
//           >
//             <span className="truncate">{value || placeholder}</span>
//             <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent className="w-full min-w-[200px] max-h-60 overflow-y-auto">
//           {/* Clear option */}
//           {value && (
//             <DropdownMenuItem 
//               onClick={() => onSelect(null)}
//               className="text-red-600 hover:text-red-700 hover:bg-red-50"
//             >
//               <X className="h-4 w-4 mr-2" />
//               Clear {label}
//             </DropdownMenuItem>
//           )}
          
//           {/* Options */}
//           {options.map((option) => (
//             <DropdownMenuItem
//               key={option}
//               onClick={() => onSelect(option)}
//               className={value === option ? "bg-blue-50 text-blue-700" : ""}
//             >
//               {value === option && <Check className="h-4 w-4 mr-2" />}
//               <span className={value === option ? "ml-0" : "ml-6"}>{option}</span>
//             </DropdownMenuItem>
//           ))}
          
//           {options.length === 0 && (
//             <DropdownMenuItem disabled>
//               No options available
//             </DropdownMenuItem>
//           )}
//         </DropdownMenuContent>
//       </DropdownMenu>
//     </div>
//   );

//   return (
//     <div className="space-y-6">
//       {/* Current Selection Info */}
//       <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
//         <div className="flex items-center gap-2 mb-2">
//           <Info className="h-4 w-4 text-blue-600" />
//           <span className="text-sm font-semibold text-blue-800">Current View</span>
//         </div>
//         <div className="text-sm text-blue-700">
//           <div><strong>Level:</strong> {currentApiLevel}</div>
//           <div><strong>Path:</strong> {selectionPath}</div>
//           {activeFiltersCount > 0 && (
//             <div><strong>Active Filters:</strong> {activeFiltersCount}</div>
//           )}
//         </div>
//       </div>

//       {/* Clear All Button */}
//       {activeFiltersCount > 0 && (
//         <Button 
//           onClick={clearAllFilters}
//           variant="outline"
//           className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
//         >
//           <X className="h-4 w-4 mr-2" />
//           Clear All Filters
//         </Button>
//       )}

//       {/* District Filter */}
//       <FilterDropdown
//         label="District"
//         value={selectedDistrict}
//         placeholder="Select District"
//         options={districtNames}
//         onSelect={handleDistrictSelect}
//       />

//       {/* School Filter */}
//       <FilterDropdown
//         label="School"
//         value={selectedSchool}
//         placeholder="Select School"
//         options={schoolNames}
//         onSelect={handleSchoolSelect}
//       />

//       {/* Grade Filter */}
//       <FilterDropdown
//         label="Grade"
//         value={selectedGrade}
//         placeholder="Select Grade"
//         options={availableGrades}
//         onSelect={(grade) => updateFilters({ grade, student: null })}
//         disabled={!selectedDistrict && !selectedSchool}
//         disabledReason={!selectedDistrict && !selectedSchool ? "Select district or school first" : ""}
//       />

//       {/* Student Filter */}
//       <div className="space-y-2">
//         <label className={`block text-base font-semibold ${
//           filteredStudents.length === 0 ? 'text-gray-400' : 'text-gray-700'
//         }`}>
//           Student
//           {filteredStudents.length === 0 && (
//             <span className="ml-2 text-xs text-gray-500">(No students available)</span>
//           )}
//         </label>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button 
//               variant="outline" 
//               disabled={filteredStudents.length === 0}
//               className={`w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px] ${
//                 selectedStudent ? 'ring-2 ring-blue-200 border-blue-300' : ''
//               } ${filteredStudents.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
//             >
//               <span className="truncate">
//                 {selectedStudent ? `${selectedStudent.id} (${selectedStudent.grade})` : "Select Student"}
//               </span>
//               <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent className="w-full min-w-[200px] max-h-60 overflow-y-auto">
//             {/* Clear option */}
//             {selectedStudent && (
//               <DropdownMenuItem 
//                 onClick={() => updateFilters({ student: null })}
//                 className="text-red-600 hover:text-red-700 hover:bg-red-50"
//               >
//                 <X className="h-4 w-4 mr-2" />
//                 Clear Student
//               </DropdownMenuItem>
//             )}
            
//             {/* Students */}
//             {filteredStudents.map((student) => (
//               <DropdownMenuItem
//                 key={student.id}
//                 onClick={() => updateFilters({ student })}
//                 className={selectedStudent?.id === student.id ? "bg-blue-50 text-blue-700" : ""}
//               >
//                 {selectedStudent?.id === student.id && <Check className="h-4 w-4 mr-2" />}
//                 <div className={selectedStudent?.id === student.id ? "ml-0" : "ml-6"}>
//                   <div className="font-medium">{student.id}</div>
//                   <div className="text-xs text-gray-500">
//                     {student.grade} • {student.schoolName}
//                   </div>
//                 </div>
//               </DropdownMenuItem>
//             ))}
            
//             {filteredStudents.length === 0 && (
//               <DropdownMenuItem disabled>
//                 No students available
//               </DropdownMenuItem>
//             )}
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>

//       {/* Results Summary */}
//       <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//         <div className="text-sm text-gray-600">
//           <div><strong>Available Students:</strong> {filteredStudents.length}</div>
//           <div><strong>Total Districts:</strong> {districtNames.length}</div>
//           <div><strong>Available Schools:</strong> {schoolNames.length}</div>
//           <div><strong>Available Grades:</strong> {availableGrades.length}</div>
//         </div>
//       </div>
//     </div>
//   );
// };


import React, { useMemo } from "react";
import { Student } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown, X, Info } from "lucide-react";

interface Props {
  students: Student[];
  selectedStudent: Student | null;
  onSelect: (s: Student | null) => void;
  onFiltersChange: (filters: {
    district: string | null;
    school: string | null;
    grade: string | null;
    student: Student | null;
  }) => void;
  selectedDistrict: string | null;
  selectedSchool: string | null;
  selectedGrade: string | null;
}

const gradeOrder = [
  "Pre-Kindergarten", "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade",
  "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade",
  "9th Grade", "10th Grade", "11th Grade", "12th Grade",
];

export const StudentSelector: React.FC<Props> = ({
  students,
  selectedStudent,
  onSelect,
  onFiltersChange,
  selectedDistrict,
  selectedSchool,
  selectedGrade,
}) => {
  // Memoized computed values
  const {
    districtNames,
    schoolNames,
    availableGrades,
    filteredStudents,
    activeFiltersCount,
    currentApiLevel,
    selectionPath
  } = useMemo(() => {
    // Determine selection path
    let path = "None";
    if (selectedDistrict && selectedSchool) {
      path = "District→School";
    } else if (selectedDistrict && !selectedSchool) {
      path = "District Only";
    } else if (!selectedDistrict && selectedSchool) {
      path = "Direct School";
    }

    // Get all districts and schools for independent selection
    const allDistricts = Array.from(new Set(students.map(s => s.districtName))).sort();
    const allSchools = Array.from(new Set(students.map(s => s.schoolName))).sort();

    // Filter logic based on selection path
    let filteredByLocation = students;
    let schoolOptions = allSchools;
    
    if (selectedDistrict && selectedSchool) {
      // Both selected - filter by both
      filteredByLocation = students.filter(s => 
        s.districtName === selectedDistrict && s.schoolName === selectedSchool
      );
    } else if (selectedDistrict && !selectedSchool) {
      // District only - filter by district, show schools from district
      filteredByLocation = students.filter(s => s.districtName === selectedDistrict);
      schoolOptions = Array.from(new Set(filteredByLocation.map(s => s.schoolName))).sort();
    } else if (!selectedDistrict && selectedSchool) {
      // School only - filter by school
      filteredByLocation = students.filter(s => s.schoolName === selectedSchool);
    }
    // If neither selected, show all students

    // Filter by grade
    const finalFilteredStudents = selectedGrade
      ? filteredByLocation.filter(s => s.grade === selectedGrade)
      : filteredByLocation;

    // Available grades based on current location filter
    const grades = Array.from(new Set(filteredByLocation.map(s => s.grade)))
      .sort((a, b) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b));

    // Determine current API level
    let apiLevel = "None";
    if (selectedStudent) {
      apiLevel = "Student";
    } else if (selectedGrade && (selectedDistrict || selectedSchool)) {
      apiLevel = "Grade";
    } else if (selectedSchool && selectedDistrict) {
      apiLevel = "School";
    } else if (selectedDistrict) {
      apiLevel = "District";
    }

    return {
      districtNames: allDistricts,
      schoolNames: schoolOptions,
      availableGrades: grades,
      filteredStudents: finalFilteredStudents.sort((a, b) => {
        if (a.schoolName !== b.schoolName) return a.schoolName.localeCompare(b.schoolName);
        const gradeAIndex = gradeOrder.indexOf(a.grade);
        const gradeBIndex = gradeOrder.indexOf(b.grade);
        if (gradeAIndex !== gradeBIndex) return gradeAIndex - gradeBIndex;
        return a.id.localeCompare(b.id);
      }),
      activeFiltersCount: [selectedDistrict, selectedSchool, selectedGrade, selectedStudent]
        .filter(Boolean).length,
      currentApiLevel: apiLevel,
      selectionPath: path
    };
  }, [students, selectedDistrict, selectedSchool, selectedGrade, selectedStudent]);

  // Simplified update function
  const updateFilters = (updates: Partial<{
    district: string | null;
    school: string | null;
    grade: string | null;
    student: Student | null;
  }>) => {
    const newFilters = {
      district: updates.district !== undefined ? updates.district : selectedDistrict,
      school: updates.school !== undefined ? updates.school : selectedSchool,
      grade: updates.grade !== undefined ? updates.grade : selectedGrade,
      student: updates.student !== undefined ? updates.student : selectedStudent,
    };

    onFiltersChange(newFilters);
    if (updates.student !== undefined) {
      onSelect(newFilters.student);
    }
  };

  const clearAllFilters = () => updateFilters({
    district: null,
    school: null,
    grade: null,
    student: null,
  });

  // Handle district selection
  const handleDistrictSelect = (district: string | null) => {
    if (district) {
      // If selecting a district, clear school, grade, and student
      updateFilters({ 
        district, 
        school: null, 
        grade: null, 
        student: null 
      });
    } else {
      // If clearing district, keep other selections if they're still valid
      updateFilters({ district: null });
    }
  };

  // Handle school selection
  const handleSchoolSelect = (school: string | null) => {
    if (school) {
      // If selecting a school, clear grade and student, but keep district if it matches
      const schoolDistrict = students.find(s => s.schoolName === school)?.districtName;
      
      if (selectedDistrict && schoolDistrict === selectedDistrict) {
        // Keep district if it matches the school's district
        updateFilters({ 
          school, 
          grade: null, 
          student: null 
        });
      } else {
        // Clear district if it doesn't match or wasn't selected
        updateFilters({ 
          district: null,
          school, 
          grade: null, 
          student: null 
        });
      }
    } else {
      // If clearing school, clear dependent selections
      updateFilters({ 
        school: null, 
        grade: null, 
        student: null 
      });
    }
  };

  // Reusable dropdown component
  const FilterDropdown = ({ 
    label, 
    value, 
    placeholder, 
    options, 
    onSelect, 
    disabled = false,
    disabledReason
  }: {
    label: string;
    value: string | null;
    placeholder: string;
    options: string[];
    onSelect: (value: string | null) => void;
    disabled?: boolean;
    disabledReason?: string;
  }) => (
    <div className="space-y-2">
      <label className={`block text-base font-semibold ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
        {label}
        {disabled && disabledReason && (
          <span className="ml-2 text-xs text-gray-500">({disabledReason})</span>
        )}
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            disabled={disabled}
            className={`w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px] ${
              value ? 'ring-2 ring-blue-200 border-blue-300' : ''
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="truncate">{value || placeholder}</span>
            <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        {!disabled && (
          <DropdownMenuContent className="max-h-60 overflow-y-auto w-full min-w-[240px]">
            <DropdownMenuItem
              onClick={() => onSelect(null)}
              className="text-base py-2 cursor-pointer text-gray-500"
            >
              <div className="flex items-center w-full">
                <span className="mr-2 w-4">{!value && <Check className="h-4 w-4" />}</span>
                All {label}s
              </div>
            </DropdownMenuItem>
            {options.length === 0 ? (
              <DropdownMenuItem disabled className="text-base py-2">
                No {label.toLowerCase()}s available
              </DropdownMenuItem>
            ) : (
              options.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => onSelect(option)}
                  className="text-base py-2 cursor-pointer"
                >
                  <div className="flex items-center w-full">
                    <span className="mr-2 w-4">
                      {value === option && <Check className="h-4 w-4" />}
                    </span>
                    {option}
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Current Selection Info */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-800">Data Level: {currentApiLevel}</span>
        </div>
        <div className="text-xs text-blue-700 mb-1">
          {currentApiLevel === "Student" && "Individual student data"}
          {currentApiLevel === "Grade" && "Aggregated data for specific grade"}
          {currentApiLevel === "School" && "Aggregated data for entire school"}
          {currentApiLevel === "District" && "Aggregated data for entire district"}
          {currentApiLevel === "None" && "No data will be loaded"}
        </div>
        {selectionPath !== "None" && (
          <div className="text-xs text-blue-600 font-medium">
            Selection Path: {selectionPath}
          </div>
        )}
      </div>

      {/* Clear All Button */}
      {activeFiltersCount > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      )}

      {/* District Filter */}
      <FilterDropdown
        label="District"
        value={selectedDistrict}
        placeholder="Select district"
        options={districtNames}
        onSelect={handleDistrictSelect}
      />

      {/* School Filter */}
      <FilterDropdown
        label="School"
        value={selectedSchool}
        placeholder="Select school"
        options={schoolNames}
        onSelect={handleSchoolSelect}
      />

      {/* Grade Filter */}
      <FilterDropdown
        label="Grade"
        value={selectedGrade}
        placeholder="Select grade"
        options={availableGrades}
        disabled={!selectedDistrict && !selectedSchool}
        disabledReason={!selectedDistrict && !selectedSchool ? "Select district or school first" : ""}
        onSelect={(grade) => updateFilters({ 
          grade, 
          student: null 
        })}
      />

      {/* Student Dropdown - Special case with additional info */}
      <div className="space-y-2">
        <label className={`block text-base font-semibold ${
          (!selectedDistrict && !selectedSchool && !selectedGrade) ? 'text-gray-400' : 'text-gray-700'
        }`}>
          Student
          {(!selectedDistrict && !selectedSchool && !selectedGrade) && (
            <span className="ml-2 text-xs text-gray-500">(Select filters first)</span>
          )}
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              disabled={!selectedDistrict && !selectedSchool && !selectedGrade}
              className={`w-full justify-between text-base font-normal h-10 bg-white border-[#C0D5DE] border-[1.6px] ${
                selectedStudent ? 'ring-2 ring-blue-200 border-blue-300' : ''
              } ${(!selectedDistrict && !selectedSchool && !selectedGrade) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="truncate">
                {selectedStudent?.id || "Select student"}
              </span>
              <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          {(selectedDistrict || selectedSchool || selectedGrade) && (
            <DropdownMenuContent className="max-h-60 overflow-y-auto w-full min-w-[240px]">
              <DropdownMenuItem
                onClick={() => updateFilters({ student: null })}
                className="text-base py-2 cursor-pointer text-gray-500"
              >
                <div className="flex items-center w-full">
                  <span className="mr-2 w-4">
                    {!selectedStudent && <Check className="h-4 w-4" />}
                  </span>
                  No specific student
                </div>
              </DropdownMenuItem>
              {filteredStudents.length === 0 ? (
                <DropdownMenuItem disabled className="text-base py-2">
                  No students available
                </DropdownMenuItem>
              ) : (
                filteredStudents.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => updateFilters({ student: s })}
                    className="text-base py-2 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <span className="mr-2 w-4">
                          {selectedStudent?.id === s.id && <Check className="h-4 w-4" />}
                        </span>
                        {s.id}
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {s.grade}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </div>

      {/* Current Selection Summary */}
      {activeFiltersCount > 0 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-semibold text-sm text-green-800 mb-2">Current Selection:</h4>
          <div className="space-y-1 text-sm text-green-700">
            {selectedDistrict && <div>District: <span className="font-medium">{selectedDistrict}</span></div>}
            {selectedSchool && <div>School: <span className="font-medium">{selectedSchool}</span></div>}
            {selectedGrade && <div>Grade: <span className="font-medium">{selectedGrade}</span></div>}
            {selectedStudent && <div>Student: <span className="font-medium">{selectedStudent.id}</span></div>}
            {!selectedStudent && (selectedDistrict || selectedSchool || selectedGrade) && (
              <div className="text-green-600 font-medium">
                API Endpoint: /{currentApiLevel}Data/ByFilters
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Selection Guidance */}
      {currentApiLevel === "None" && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-sm text-yellow-800 mb-2">Selection Guide:</h4>
          <div className="space-y-1 text-xs text-yellow-700">
            <div>• <strong>District only:</strong> View district-wide attendance data</div>
            <div>• <strong>School only:</strong> View specific school data (direct access)</div>
            <div>• <strong>District + School:</strong> View specific school data (hierarchical)</div>
            <div>• <strong>District/School + Grade:</strong> View grade-level data</div>
            <div>• <strong>Any filters + Student:</strong> View individual student data</div>
          </div>
        </div>
      )}

      {/* Data Summary */}
      {activeFiltersCount > 0 && filteredStudents.length > 0 && !selectedStudent && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-sm text-gray-700 mb-1">Data Summary:</h4>
          <div className="text-xs text-gray-600">
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} match your current filters
          </div>
        </div>
      )}
    </div>
  );
};