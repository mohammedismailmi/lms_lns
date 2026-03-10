import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCourseStore } from '../../store/courseStore';
import { Check, CheckCircle2 } from 'lucide-react';

interface Props {
    courseId: string;
}

export default function CourseCompleteButton({ courseId }: Props) {
    const { user } = useAuthStore();
    const { instructorCompleted, markCourseComplete } = useCourseStore();
    const [showModal, setShowModal] = useState(false);

    // Gating access
    if (user?.role !== 'admin' && user?.role !== 'instructor') return null;

    const isCompleted = instructorCompleted.has(courseId);

    if (isCompleted) {
        return (
            <button
                disabled
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-success text-white shadow-sm cursor-not-allowed opacity-90 transition-all"
            >
                <CheckCircle2 className="w-5 h-5" />
                Course Marked Complete
            </button>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-white text-success border-2 border-success hover:bg-success/5 transition-all shadow-sm"
            >
                <Check className="w-5 h-5" />
                Mark Course as Complete
            </button>

            {/* Confirmation Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-border animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-serif font-bold text-navy mb-4">Complete Course?</h3>
                        <p className="text-ink text-sm leading-relaxed mb-8">
                            Marking this course as complete means students who finish all activities will receive their certificate. You can still edit activities after this. Are you sure?
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 px-4 font-bold rounded-xl text-muted bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    markCourseComplete(courseId);
                                    setShowModal(false);
                                }}
                                className="flex-[2] py-3 px-4 font-bold rounded-xl text-white bg-success hover:bg-green-800 transition-colors shadow-sm"
                            >
                                Yes, Complete Course
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
