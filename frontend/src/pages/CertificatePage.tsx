import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courses, tenants } from '../lib/mockData';
import { useAuthStore } from '../store/authStore';
import { useProgressStore } from '../store/progressStore';
import { useCourseStore } from '../store/courseStore';
import { Printer } from 'lucide-react';

export default function CertificatePage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { getCourseProgress, recalculateCourseProgress } = useProgressStore();
    const { instructorCompleted } = useCourseStore();

    const [date] = useState(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

    const course = courses.find((c: any) => c.id === courseId);
    const tenant = tenants.find((t: any) => t.id === user?.tenantId);

    // Validate condition gate
    useEffect(() => {
        if (!course) return;
        const allActivities = course.modules.flatMap((m: any) => m.activities);
        recalculateCourseProgress(course.id, allActivities);
        const progress = getCourseProgress(course.id, allActivities);

        if (!instructorCompleted.has(course.id) || progress !== 100) {
            // Not allowed to view certificate yet
            navigate(`/course/${course.id}`);
        }
    }, [course]);

    if (!course || !tenant || !user) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8 font-serif">
            <div className="mb-8 w-full max-w-5xl flex justify-end print:hidden">
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-navy hover:bg-primary text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md"
                >
                    <Printer className="w-5 h-5" /> Download Certificate
                </button>
            </div>

            <div className="w-full max-w-5xl bg-card p-4 mx-auto shadow-2xl relative print:shadow-none print:w-full print:max-w-none print:m-0 aspect-[1.4/1]">
                {/* Decorative inner border */}
                <div className="absolute inset-4 border-[16px] border-double border-success/80 pointer-events-none" />
                <div className="absolute inset-8 border border-success/30 pointer-events-none" />

                <div className="h-full w-full flex flex-col items-center justify-center text-center p-16">
                    <h2 className="text-3xl font-bold tracking-widest text-success uppercase mb-16 opacity-80">
                        {tenant.name}
                    </h2>

                    <h1 className="text-5xl md:text-7xl font-bold text-navy mb-12" style={{ fontStyle: 'italic' }}>
                        Certificate of Completion
                    </h1>

                    <p className="text-xl text-muted italic mb-6">This certifies that</p>

                    <p className="text-4xl font-bold text-ink border-b border-border pb-2 px-16 inline-block mb-10">
                        {user.name}
                    </p>

                    <p className="text-xl text-muted italic mb-6">has successfully completed</p>

                    <h3 className="text-3xl font-bold text-navy mb-12">
                        {course.name}
                    </h3>

                    <div className="flex justify-between w-full max-w-3xl mt-auto">
                        <div className="text-center w-64 border-t border-navy/30 pt-4 mt-8">
                            <p className="font-bold text-navy" style={{ fontFamily: 'cursive', fontSize: '1.25rem' }}>{course.faculty}</p>
                            <p className="text-sm font-sans font-medium text-muted mt-2">Course Instructor</p>
                        </div>
                        <div className="text-center w-64 border-t border-navy/30 pt-4 mt-8 text-navy font-bold">
                            <p className="text-xl">{date}</p>
                            <p className="text-sm font-sans font-medium text-muted mt-2">Date Completed</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
