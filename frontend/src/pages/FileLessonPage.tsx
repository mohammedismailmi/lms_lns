import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseStore } from '../store/courseStore';
import { useProgressStore } from '../store/progressStore';
import { FileText, Download, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function FileLessonPage() {
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
            if (a && a.type === 'file') {
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

    useEffect(() => {
        if (!activity || isCompleted) return;
        markDone(activity.id, courseId);
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
                <p className="text-xl font-serif text-accent font-bold mb-4">Lesson component not found.</p>
                <button onClick={() => navigate(-1)} className="text-primary hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-surface pb-24 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-border sticky top-0 z-20 shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/course/${course?.id}`)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-navy">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <p className="text-xs uppercase tracking-wider font-bold text-muted">Module {moduleOrder} · Document</p>
                        <h1 className="font-serif font-bold text-navy text-lg leading-tight">{activity.title}</h1>
                    </div>
                </div>

                {isCompleted && (
                    <span className="flex items-center gap-2 text-success font-bold text-sm bg-success/10 px-3 py-1.5 rounded-lg border border-success/20">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                    </span>
                )}
            </div>

            <div className="flex-1 max-w-5xl w-full mx-auto p-8 flex flex-col gap-8">

                <div className="bg-white rounded-2xl p-8 border border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #0F2040 2px, transparent 2px)', backgroundSize: '24px 24px' }} />

                    <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                        <div className="w-16 h-16 bg-highlight/20 text-highlight rounded-2xl flex items-center justify-center shrink-0 border border-highlight/30">
                            <FileText className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-navy leading-tight">{activity.fileName || activity.title}</h2>
                            <p className="text-muted font-medium flex items-center gap-3 mt-1 text-sm">
                                <span>{activity.fileType || 'PDF Document'}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span>{activity.fileSize ? `${(activity.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}</span>
                                {activity.durationMinutes && (
                                    <>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                        <span>{activity.durationMinutes} min read</span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    <a href={activity.fileUrl || "#"} download className="w-full md:w-auto px-8 py-3.5 bg-primary hover:bg-navy text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-3 relative z-10 shrink-0">
                        <Download className="w-5 h-5 text-white/80" />
                        Download File
                    </a>
                </div>

                {/* PDF Embed or Preview */}
                <div className="flex-1 bg-slate-200/50 rounded-2xl border-2 border-dashed border-border flex items-center justify-center min-h-[600px] overflow-hidden">
                    {activity.fileUrl ? (
                        <iframe src={activity.fileUrl} className="w-full h-full min-h-[600px]" title={activity.title} />
                    ) : (
                        <div className="text-center p-8">
                            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4 opacity-50" />
                            <h3 className="font-serif font-bold text-xl text-navy mb-2">Document Preview</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                Click the Download button above to view the document.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
