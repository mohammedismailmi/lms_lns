import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import WelcomeBanner from '../components/home/WelcomeBanner';
import StarredCourses from '../components/home/StarredCourses';
import RecommendedCourses from '../components/home/RecommendedCourses';
import CourseCard from '../components/home/CourseCard';
import { useCourseStore } from '../store/courseStore';
import { useProgressStore } from '../store/progressStore';
import { useAuthStore } from '../store/authStore';
import { Search, X } from 'lucide-react';

export default function LearnerHomePage() {
    const { user } = useAuthStore();
    const { getEnrolledCourses, coursesList, hydrateCourses, hydrateEnrollments } = useCourseStore();
    const { hydrateProgress } = useProgressStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    
    // Sync URL query param to local state
    useEffect(() => {
        const q = searchParams.get('q');
        if (q) setSearchQuery(q);
    }, [searchParams]);

    React.useEffect(() => {
        hydrateCourses();
        if (user) {
            hydrateEnrollments(user.id);
            hydrateProgress();
        }
    }, [hydrateCourses, hydrateEnrollments, hydrateProgress, user]);

    const enrolledCourses = user ? getEnrolledCourses(user.id) : [];
    const unenrolledCourses = coursesList.filter(c => !enrolledCourses.find(ec => ec.id === c.id));
    
    const isSearching = searchQuery.trim().length > 0;
    const q = searchQuery.toLowerCase();
    
    const filteredEnrolled = enrolledCourses.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.category.toLowerCase().includes(q) ||
        (c.faculty || '').toLowerCase().includes(q)
    );

    const filteredUnenrolled = unenrolledCourses.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.category.toLowerCase().includes(q) ||
        (c.faculty || '').toLowerCase().includes(q)
    );

    const clearSearch = () => {
        setSearchQuery('');
        setSearchParams({});
    };

    return (
        <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-8 pb-20">
            <WelcomeBanner />

            {/* Search Bar - Right-aligned, before Recommended */}
            <div className="flex justify-end">
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white text-ink placeholder:text-muted rounded-2xl py-2.5 pl-10 pr-10 border border-border/40 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 text-sm font-bold transition-all shadow-sm hover:shadow-md"
                    />
                    {isSearching && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-navy transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {!isSearching && <StarredCourses />}
            {!isSearching && <RecommendedCourses />}
            
            {/* My Registered Modules */}
            <section>
                <div className="flex items-center gap-2 mb-4.5">
                    <div className="w-1.5 h-6 bg-navy rounded-full" />
                    <h2 className="text-xl font-serif font-black text-navy tracking-tight">
                        {isSearching ? `Search Results for "${searchQuery}"` : 'My Registered Modules'}
                    </h2>
                </div>
                
                {filteredEnrolled.length === 0 && !isSearching ? (
                    <div className="py-8 text-center border border-border/40 rounded-2xl bg-surface/50 shadow-inner">
                        <p className="font-serif text-base text-muted font-bold mt-2">You are not enrolled in any courses yet.</p>
                        <p className="text-[10px] text-muted italic mt-1 opacity-70">Enroll in a course from the Discovery section to begin.</p>
                    </div>
                ) : filteredEnrolled.length === 0 && isSearching ? (
                    <div className="py-6 text-center border border-border/40 rounded-2xl bg-surface/50 shadow-inner">
                        <p className="font-serif text-sm text-muted font-bold">No enrolled courses match your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
                        {filteredEnrolled.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                )}
            </section>

            {/* Discover / Unenrolled courses */}
            {(isSearching ? filteredUnenrolled.length > 0 : unenrolledCourses.length > 0) && (
            <section className="pt-8 border-t border-border/40 mt-8">
                <div className="flex flex-col mb-4.5">
                    <h2 className="text-xl font-serif font-black text-navy tracking-tight">
                        {isSearching ? 'Other Available Courses' : 'Discover New Courses'}
                    </h2>
                    <p className="text-muted text-xs mt-0.5 opacity-80">Expand your knowledge with these available modules.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
                    {(isSearching ? filteredUnenrolled : unenrolledCourses).map(course => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            </section>
            )}
        </div>
    );
}
