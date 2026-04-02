import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseStore } from '../store/courseStore';
import { useProgressStore } from '../store/progressStore';
import { CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function BlogLessonPage() {
    const { activityId, courseId } = useParams();
    const navigate = useNavigate();
    const { coursesList } = useCourseStore();
    const { markDone, activityStatus } = useProgressStore();

    const [apiActivity, setApiActivity] = useState<any>(null);
    const [apiCourse, setApiCourse] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Try to find in store first
    let storeActivity: any = null;
    let storeCourse: any = null;
    let moduleOrder = 0;
    for (const c of coursesList) {
        for (const m of c.modules) {
            const a = m.activities.find((x: any) => x.id === activityId);
            if (a && a.type === 'blog') {
                storeActivity = a;
                storeCourse = c;
                moduleOrder = m.order;
                break;
            }
        }
        if (storeActivity) break;
    }

    const activity = storeActivity || apiActivity;
    const course = storeCourse || apiCourse;

    // If not found in store, fetch from API
    useEffect(() => {
        if (storeActivity || !activityId) return;
        setLoading(true);
        api.get(`/api/activities/${activityId}`)
            .then(res => {
                if (res.data.success) {
                    setApiActivity(res.data.activity);
                    setApiCourse(res.data.course);
                }
            })
            .catch(err => console.error('Failed to fetch activity:', err))
            .finally(() => setLoading(false));
    }, [activityId, storeActivity]);

    const isCompleted = activityStatus[activityId!] === 'completed';
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!activity || isCompleted) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                markDone(activity.id, courseId);
            }
        }, { threshold: 1.0 });

        if (bottomRef.current) {
            observer.observe(bottomRef.current);
        }

        return () => observer.disconnect();
    }, [activity, isCompleted, markDone]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!activity || !course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <p className="text-xl font-serif text-accent font-bold mb-4">Lesson component not found or invalid type map.</p>
                <button onClick={() => navigate(-1)} className="text-primary hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-surface pb-24">
            {/* Header */}
            <div className="bg-white border-b border-border sticky top-0 z-20 shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/course/${course?.id}`)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-navy">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <p className="text-xs uppercase tracking-wider font-bold text-muted">Module {moduleOrder} · Reading</p>
                        <h1 className="font-serif font-bold text-navy text-lg leading-tight">{activity.title}</h1>
                    </div>
                </div>

                {isCompleted ? (
                    <span className="flex items-center gap-2 text-success font-bold text-sm bg-success/10 px-3 py-1.5 rounded-lg border border-success/20">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                    </span>
                ) : (
                    <span className="flex items-center gap-2 text-muted font-bold text-sm bg-slate-100 px-3 py-1.5 rounded-lg border border-border">
                        Scroll to complete
                    </span>
                )}
            </div>

            {/* Reading Layout */}
            <div className="max-w-prose mx-auto mt-12 px-6">
                <h1 className="text-2xl sm:text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-navy mb-8 leading-tight">
                    {activity.title}
                </h1>

                <div className="prose prose-lg prose-slate prose-headings:font-serif prose-headings:text-navy text-ink leading-relaxed">
                    {activity.content ? (
                        <div dangerouslySetInnerHTML={{ __html: activity.content }} />
                    ) : (
                        <>
                            <p className="lead text-xl text-slate-600 font-serif italic mb-8">
                                This is a placeholder article for {activity.title}. In a production system, this would be fetched from a rich text CMS or Markdown parser containing the full lecture notes.
                            </p>
                            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.</p>
                        </>
                    )}

                    <div className="h-96" />
                </div>

                {/* Intersection Observer Target */}
                <div ref={bottomRef} className="mt-24 pt-12 border-t border-border flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="font-serif font-bold text-2xl text-navy mb-2">You've reached the end.</h3>
                    <p className="text-muted mb-8">This reading material has been automatically marked as complete.</p>
                    <button
                        onClick={() => navigate(`/course/${course?.id}`)}
                        className="px-8 py-3 bg-navy hover:bg-primary text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        Return to Curriculum
                    </button>
                </div>
            </div>
        </div>
    );
}
