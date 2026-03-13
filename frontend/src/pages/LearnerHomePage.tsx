import React, { useState } from 'react';
import WelcomeBanner from '../components/home/WelcomeBanner';
import StarredCourses from '../components/home/StarredCourses';
import RecommendedCourses from '../components/home/RecommendedCourses';
import CourseCard from '../components/home/CourseCard';
import { useCourseStore } from '../store/courseStore';
import { useAuthStore } from '../store/authStore';
import { Search } from 'lucide-react';

export default function LearnerHomePage() {
    const { user } = useAuthStore();
    const { getEnrolledCourses, coursesList } = useCourseStore();
    const [searchQuery, setSearchQuery] = useState('');
    
    // Safety check, should be guarded by RoleRoute anyway
    const enrolledCourses = user ? getEnrolledCourses(user.id) : [];
    const unenrolledCourses = coursesList.filter(c => !enrolledCourses.find(ec => ec.id === c.id));
    
    const filteredCourses = enrolledCourses.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 pb-24">
            <WelcomeBanner />
            <StarredCourses />
            <RecommendedCourses />
            
            <section>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-serif font-bold text-navy">My Courses</h2>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder="Search your courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white text-ink placeholder:text-muted rounded-full py-2 pl-10 pr-4 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all"
                        />
                    </div>
                </div>
                
                {enrolledCourses.length === 0 ? (
                    <div className="py-12 text-center border border-border rounded-xl bg-surface">
                        <p className="font-serif text-lg text-muted mt-2">You are not enrolled in any courses yet.</p>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="py-12 text-center border border-border rounded-xl bg-surface">
                        <p className="font-serif text-lg text-muted mt-2">No courses match your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredCourses.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                )}
            </section>

            {unenrolledCourses.length > 0 && (
            <section className="pt-12 border-t border-border mt-12">
                <div className="flex flex-col mb-6">
                    <h2 className="text-2xl font-serif font-bold text-navy">Discover New Courses</h2>
                    <p className="text-muted text-sm mt-1">Expand your knowledge with these available modules.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {unenrolledCourses.map(course => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            </section>
            )}
        </div>
    );
}
