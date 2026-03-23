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
        <div className="p-8 max-w-7xl mx-auto space-y-12 pb-24">
            
            <div className="bg-card rounded-2xl p-8 shadow-sm border border-border flex justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #0F2040 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                
                <div className="relative z-10 space-y-3">
                    <h2 className="text-4xl font-serif font-bold text-navy">
                        Welcome back, {firstName}.
                    </h2>
                    <div className="inline-block mt-2">
                        <span className="px-3 py-1 font-semibold text-xs uppercase tracking-wide rounded-full border-2 bg-white border-primary text-primary">
                            Instructor
                        </span>
                    </div>
                </div>
            </div>

            <section>
                <h2 className="text-2xl font-serif font-bold text-navy mb-6">Courses You Are Teaching</h2>
                
                {teachingCourses.length === 0 ? (
                    <div className="py-12 text-center border border-border rounded-xl bg-surface">
                        <p className="font-serif text-lg text-muted">You have not been assigned any courses yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {teachingCourses.map(course => (
                            <InstructorCourseCard key={course.id} course={course} />
                        ))}
                    </div>
                )}
            </section>

        </div>
    );
}
