import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseStore } from '../store/courseStore';
import { useProgressStore } from '../store/progressStore';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { Course, Activity } from '../lib/mockData';

export default function BlogLessonPage() {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const { coursesList } = useCourseStore();
    const { markDone, activityStatus } = useProgressStore();

    let course: Course | null = null;
    let activity: Activity | null = null;
    let moduleOrder = 0;

    for (const c of coursesList) {
        for (const m of c.modules) {
            const a = m.activities.find(x => x.id === activityId);
            if (a && a.type === 'blog') {
                activity = a;
                course = c;
                moduleOrder = m.order;
                break;
            }
        }
        if (activity) break;
    }

    const isCompleted = activityStatus[activityId!] === 'completed';
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!activity || isCompleted) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                markDone(activity.id);
            }
        }, { threshold: 1.0 });

        if (bottomRef.current) {
            observer.observe(bottomRef.current);
        }

        return () => observer.disconnect();
    }, [activity, isCompleted, markDone]);

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
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy mb-8 leading-tight">
                    {activity.title}
                </h1>

                <div className="prose prose-lg prose-slate prose-headings:font-serif prose-headings:text-navy text-ink leading-relaxed">
                    <p className="lead text-xl text-slate-600 font-serif italic mb-8">
                        This is a placeholder article for {activity.title}. In a production system, this would be fetched from a rich text CMS or Markdown parser containing the full lecture notes.
                    </p>

                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla.</p>
                    <p>Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur sodales ligula in libero.</p>

                    <h3>Fundamental Principles</h3>
                    <p>Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis. Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor. Morbi lectus risus, iaculis vel, suscipit quis, luctus non, massa. Fusce ac turpis quis ligula lacinia aliquet.</p>

                    <div className="my-12 p-6 bg-primary/5 border-l-4 border-primary rounded-r-xl">
                        <p className="font-medium text-navy m-0">
                            <strong>Key Takeaway:</strong> The rigor required to master these concepts cannot be overstated. Mastery originates from prolonged exposure to challenging abstractions.
                        </p>
                    </div>

                    <p>Mauris ipsum. Nulla metus metus, ullamcorper vel, tincidunt sed, euismod in, nibh. Quisque volutpat condimentum velit. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.</p>

                    {/* Artificially inflate height so scroll is required */}
                    <div className="h-96" />

                    <p>Nam sed tellus id magna elementum tincidunt. Donec sit amet nulla. Sed tristique arcu scelerisque tellus ultricies euismod.</p>
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
