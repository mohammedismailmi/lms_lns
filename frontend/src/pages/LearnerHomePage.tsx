import React, { useState } from 'react';
import WelcomeBanner from '../components/home/WelcomeBanner';
import StarredCourses from '../components/home/StarredCourses';
import RecommendedCourses from '../components/home/RecommendedCourses';
import CourseCard from '../components/home/CourseCard';
import { useCourseStore } from '../store/courseStore';
import { useProgressStore } from '../store/progressStore';
import { useAuthStore } from '../store/authStore';
import { Search } from 'lucide-react';

export default function LearnerHomePage() {
    const { user } = useAuthStore();
    const { getEnrolledCourses, coursesList, hydrateCourses, hydrateEnrollments } = useCourseStore();
    const { hydrateProgress } = useProgressStore();
    const [searchQuery, setSearchQuery] = useState('');
    
    React.useEffect(() => {
        hydrateCourses();
        if (user) {
            hydrateEnrollments(user.id);
            hydrateProgress();
        }
    }, [hydrateCourses, hydrateEnrollments, hydrateProgress, user]);

    // Safety check, should be guarded by RoleRoute anyway
    const enrolledCourses = user ? getEnrolledCourses(user.id) : [];
    const unenrolledCourses = coursesList.filter(c => !enrolledCourses.find(ec => ec.id === c.id));
    
    const filteredCourses = enrolledCourses.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-8 pb-20">
            <WelcomeBanner />
            <StarredCourses />
            <RecommendedCourses />
            
            <section>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4.5">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-navy rounded-full" />
                        <h2 className="text-xl font-serif font-black text-navy tracking-tight">My Registered Modules</h2>
                    </div>
                    <div className="relative w-full md:w-56">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                        <input
                            type="text"
                            placeholder="Search modules..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white text-ink placeholder:text-muted rounded-xl py-1.5 pl-9 pr-4 border border-border/40 focus:outline-none focus:ring-4 focus:ring-primary/10 text-xs font-bold transition-all shadow-sm"
                        />
                    </div>
                </div>
                
                {enrolledCourses.length === 0 ? (
                    <div className="py-8 text-center border border-border/40 rounded-2xl bg-surface/50 shadow-inner">
                        <p className="font-serif text-base text-muted font-bold mt-2">You are not enrolled in any courses yet.</p>
                        <p className="text-[10px] text-muted italic mt-1 opacity-70">Enroll in a course from the Discovery section to begin.</p>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="py-8 text-center border border-border/40 rounded-2xl bg-surface/50 shadow-inner">
                        <p className="font-serif text-base text-muted font-bold mt-2">No modules match your search filter.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
                        {filteredCourses.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                )}
            </section>

            {unenrolledCourses.length > 0 && (
            <section className="pt-8 border-t border-border/40 mt-8">
                <div className="flex flex-col mb-4.5">
                    <h2 className="text-xl font-serif font-black text-navy tracking-tight">Discover New Courses</h2>
                    <p className="text-muted text-xs mt-0.5 opacity-80">Expand your knowledge with these available modules.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
                    {unenrolledCourses.map(course => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            </section>
            )}
        </div>
    );
}
