import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courses } from '../lib/mockData';
import { useAuthStore } from '../store/authStore';
import { useProgressStore } from '../store/progressStore';
import { useCourseStore } from '../store/courseStore';

import ModuleSidebar from '../components/course/ModuleSidebar';
import CourseCompleteButton from '../components/course/CourseCompleteButton';
import BlogActivity from '../components/course/BlogActivity';
import FileActivity from '../components/course/FileActivity';
import VideoActivity from '../components/course/VideoActivity';
import LiveClassActivity from '../components/course/LiveClassActivity';
import AssessmentActivity from '../components/course/AssessmentActivity';

import { Users, Plus, LayoutList, Award } from 'lucide-react';

export default function CoursePage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { recalculateCourseProgress, getCourseProgress } = useProgressStore();
    const { instructorCompleted } = useCourseStore();

    const course = courses.find((c: any) => c.id === courseId);
    const isInstructor = user?.role === 'admin' || user?.role === 'instructor';

    // Track course progress live
    const allActivities = course ? course.modules.flatMap((m: any) => m.activities) : [];
    const [progress, setProgress] = useState(0);

    // Poll progress occasionally to re-render header progress (Zustand subscriptions generally handle this, but this guarantees it via hook)
    useEffect(() => {
        if (course) {
            recalculateCourseProgress(course.id, allActivities);
            const interval = setInterval(() => {
                setProgress(getCourseProgress(course.id, allActivities));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [course]);

    if (!course) {
        return <div className="p-8 text-center text-accent font-serif text-2xl">Course not found.</div>;
    }

    const certificateReady = instructorCompleted.has(course.id) && progress === 100;

    return (
        <div className="flex h-full relative">
            <ModuleSidebar course={course} />

            <div className="flex-1 overflow-y-auto w-full relative">
                {/* Course Header Banner */}
                <div className="bg-navy text-white px-10 py-12 border-b-4 border-highlight shadow-sm">
                    {certificateReady && (
                        <div className="mb-6 inline-flex bg-highlight text-navy px-4 py-2 rounded-lg font-bold items-center gap-2 shadow-lg animate-in slide-in-from-top cursor-pointer hover:bg-yellow-500 transition-colors"
                            onClick={() => navigate(`/certificate/${course.id}`)}>
                            <Award className="w-5 h-5" />
                            Certificate Available! Click to view.
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="max-w-3xl">
                            <span className="text-highlight font-bold tracking-widest uppercase text-sm mb-3 block">
                                {course.category}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight mb-4">
                                {course.name}
                            </h1>

                            <div className="flex items-center gap-6 text-slate-300 font-medium">
                                <span className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white border border-slate-600">
                                        {course.facultyInitial}
                                    </span>
                                    {course.faculty}
                                </span>
                                <span>•</span>
                                <span>{course.section}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> 142 Enrolled</span>
                            </div>
                        </div>

                        {isInstructor && (
                            <div className="flex flex-col gap-3 min-w-[240px]">
                                <button className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl transition-colors border border-primary">
                                    <Plus className="w-5 h-5" /> Post Announcement
                                </button>
                                <div className="flex gap-2 w-full">
                                    <button className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl transition-colors border border-slate-700">
                                        <LayoutList className="w-5 h-5" /> Add
                                    </button>
                                    <CourseCompleteButton courseId={course.id} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="px-10 py-12 max-w-4xl mx-auto space-y-12 pb-32">
                    {course.modules.map((module: any) => (
                        <div key={module.id} className="pt-4 first:pt-0 relative">

                            <div className="sticky top-0 z-10 bg-surface/90 backdrop-blur-md py-4 mb-6 border-b border-border flex items-center justify-between">
                                <h2 className="text-xl font-serif font-bold text-navy truncate flex-1 pr-6 tracking-wide">
                                    <span className="text-muted mr-3 font-sans opacity-50">Module {module.order}</span>
                                    {module.title}
                                </h2>
                                <span className="text-sm font-bold text-muted bg-card px-3 py-1 rounded-lg border border-border">
                                    {module.activities.length} Activities
                                </span>
                            </div>

                            <div className="space-y-8 pl-4 md:pl-8 border-l-2 border-slate-200">
                                {module.activities.map((activity: any) => {
                                    switch (activity.type) {
                                        case 'blog': return <BlogActivity key={activity.id} activity={activity} />;
                                        case 'file': return <FileActivity key={activity.id} activity={activity} />;
                                        case 'video': return <VideoActivity key={activity.id} activity={activity} />;
                                        case 'live_class': return <LiveClassActivity key={activity.id} activity={activity} />;
                                        case 'quiz':
                                        case 'exam': return <AssessmentActivity key={activity.id} activity={activity} />;
                                        default: return null;
                                    }
                                })}
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
