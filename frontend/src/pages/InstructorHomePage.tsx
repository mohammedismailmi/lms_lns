import React, { useEffect } from 'react';
import InstructorCourseCard from '../components/home/InstructorCourseCard';
import { useCourseStore } from '../store/courseStore';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import { Users, BellRing } from 'lucide-react';

export default function InstructorHomePage() {
    const { user } = useAuthStore();
    const { getTeachingCourses, hydrateCourses, hydrateEnrollments } = useCourseStore();
    
    useEffect(() => {
        hydrateCourses();
        if (user) {
            hydrateEnrollments(user.id);
        }
    }, [hydrateCourses, hydrateEnrollments, user]);

    if (!user) return null;
    
    const teachingCourses = getTeachingCourses(user.name);
    const firstName = user.name.split(' ')[0] || 'User';

    return (
        <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-8 pb-20">
            
            <div className="bg-white rounded-3xl p-6 shadow-premium border border-border/40 flex justify-between items-center gap-6 relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_#1b3a6b05,_transparent)]">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #0F2040 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                
                <div className="relative z-10 space-y-2">
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-navy tracking-tight">
                        Welcome back, {firstName}.
                    </h2>
                    <div className="inline-block mt-1">
                        <span className="px-2.5 py-0.5 font-black text-[9px] uppercase tracking-widest rounded-full border-2 bg-white border-primary text-primary shadow-sm">
                            Platform Faculty
                        </span>
                    </div>
                </div>
                <div className="relative z-10 h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                </div>
            </div>

            <section>
                <div className="flex items-center gap-2 mb-4.5">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <h2 className="text-lg font-serif font-black text-navy tracking-tight">Courses You Are Teaching</h2>
                </div>
                
                {teachingCourses.length === 0 ? (
                    <div className="py-8 text-center border border-border/40 rounded-2xl bg-surface/50 shadow-inner">
                        <p className="font-serif text-base text-muted font-bold">You have not been assigned any courses yet.</p>
                        <p className="text-[10px] text-muted italic mt-1 opacity-70">New assignments will appear here once provisioned by Admin.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
                        {teachingCourses.map(course => (
                            <InstructorCourseCard key={course.id} course={course} />
                        ))}
                    </div>
                )}
            </section>

        </div>
    );
}
