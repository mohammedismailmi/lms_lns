import React, { useState, useEffect } from 'react';
import { useCourseStore } from '../store/courseStore';
import { Search, Plus, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminCourseCard from '../components/admin/AdminCourseCard';
import CourseModal from '../components/admin/CourseModal';
import AssignInstructorModal from '../components/admin/AssignInstructorModal';
import { Course } from '../lib/mockData';

export default function AdminCoursesPage() {
    const { getAllCourses, hydrateCourses } = useCourseStore();
    
    useEffect(() => { hydrateCourses(); }, []);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | undefined>(undefined);
    const [assigningCourse, setAssigningCourse] = useState<Course | undefined>(undefined);

    const allCourses = getAllCourses();
    const filteredCourses = allCourses.filter(c => 
        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.faculty || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openCreate = () => {
        setEditingCourse(undefined);
        setIsModalOpen(true);
    };

    const openEdit = (course: Course) => {
        setEditingCourse(course);
        setIsModalOpen(true);
    };

    const openAssign = (course: Course) => {
        setAssigningCourse(course);
        setIsAssignModalOpen(true);
    };

    return (
        <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-6 pb-20">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link to="/admin" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 mb-1.5">
                        <ChevronLeft className="w-2.5 h-2.5" /> Back to Admin Hub
                    </Link>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-navy tracking-tight">All Courses</h2>
                    <p className="text-muted text-xs mt-0.5 opacity-80">Full control matrix for creating, mapping, and dropping internal platform courses.</p>
                </div>
                <button 
                    onClick={openCreate}
                    className="flex items-center gap-1.5 px-4 py-2 bg-navy text-white rounded-xl hover:bg-primary transition-all font-bold shadow-lg shadow-navy/20 w-max text-xs active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Course</span>
                </button>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-premium border border-border/40 flex flex-col md:flex-row gap-5 mb-6 items-center bg-[radial-gradient(circle_at_top_right,_#1b3a6b05,_transparent)]">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted font-bold" />
                    <input
                        type="text"
                        placeholder="Filter by course name, taxonomy, or faculty..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface text-navy placeholder:text-muted rounded-xl py-2.5 pl-10 pr-4 border border-border/40 focus:outline-none focus:ring-4 focus:ring-primary/10 text-xs font-bold shadow-inner transition-all"
                    />
                </div>
            </div>

            {allCourses.length === 0 ? (
                <div className="py-16 text-center border border-border/40 rounded-2xl bg-white shadow-sm">
                    <p className="font-serif text-xl text-navy font-black mb-1">No Platform Courses Found</p>
                    <p className="text-muted text-xs">Generate a course to begin enrolling.</p>
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="py-16 text-center border border-border/40 rounded-2xl bg-white shadow-sm">
                    <p className="font-serif text-base text-muted font-bold">No courses match your search criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
                    {filteredCourses.map(course => (
                        <AdminCourseCard 
                            key={course.id} 
                            course={course} 
                            onEdit={openEdit}
                            onAssign={openAssign}
                        />
                    ))}
                </div>
            )}

            <CourseModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                existingCourse={editingCourse}
            />

            {assigningCourse && (
                <AssignInstructorModal
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    courseId={assigningCourse.id}
                    courseName={assigningCourse.name}
                    currentInstructorId={(assigningCourse as any).instructorId}
                />
            )}

        </div>
    );
}
