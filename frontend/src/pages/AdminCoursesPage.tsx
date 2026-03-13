import React, { useState } from 'react';
import { useCourseStore } from '../store/courseStore';
import { Search, Plus } from 'lucide-react';
import AdminCourseCard from '../components/admin/AdminCourseCard';
import CourseModal from '../components/admin/CourseModal';
import { Course } from '../lib/mockData';

export default function AdminCoursesPage() {
    const { getAllCourses } = useCourseStore();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | undefined>(undefined);

    const allCourses = getAllCourses();
    const filteredCourses = allCourses.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.faculty.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openCreate = () => {
        setEditingCourse(undefined);
        setIsModalOpen(true);
    };

    const openEdit = (course: Course) => {
        setEditingCourse(course);
        setIsModalOpen(true);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-navy">All Courses</h2>
                    <p className="text-muted text-sm mt-1">Full control matrix for creating, mapping, and dropping internal platform courses.</p>
                </div>
                <button 
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-navy transition-colors font-medium shadow-sm w-max"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create Course</span>
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-border flex flex-col md:flex-row gap-4 mb-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                        type="text"
                        placeholder="Search by course name, category, or instructor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface text-ink placeholder:text-muted rounded-lg py-2 pl-10 pr-4 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all"
                    />
                </div>
            </div>

            {allCourses.length === 0 ? (
                <div className="py-24 text-center border border-border rounded-xl bg-white shadow-sm">
                    <p className="font-serif text-2xl text-navy font-bold mb-2">No Platform Courses Found</p>
                    <p className="text-muted">Generate a course to begin enrolling.</p>
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="py-24 text-center border border-border rounded-xl bg-white shadow-sm">
                    <p className="font-serif text-lg text-muted">No courses match your search criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCourses.map(course => (
                        <AdminCourseCard 
                            key={course.id} 
                            course={course} 
                            onEdit={openEdit}
                        />
                    ))}
                </div>
            )}

            <CourseModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                existingCourse={editingCourse}
            />

        </div>
    );
}
