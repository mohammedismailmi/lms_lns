import React, { useEffect, useRef, useState } from 'react';
import { BlogActivity as BlogType } from '../../lib/mockData';
import { useProgressStore } from '../../store/progressStore';
import { FileText, CheckCircle2 } from 'lucide-react';

interface Props {
    activity: BlogType;
}

export default function BlogActivity({ activity }: Props) {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const { markDone, activityStatus } = useProgressStore();
    const [isRead, setIsRead] = useState(false);

    useEffect(() => {
        const status = activityStatus[activity.id];
        if (status === 'completed') {
            setIsRead(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsRead(true);
                    markDone(activity.id);
                    observer.disconnect();
                }
            },
            { threshold: 0.8 } // Needs to see 80% of the sentinel
        );

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }

        return () => observer.disconnect();
    }, [activity.id, activityStatus, markDone]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-border p-8 relative" id={`activity-${activity.id}`}>
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-primary">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-navy">{activity.title}</h2>
                </div>
                {isRead ? (
                    <span className="flex items-center gap-1.5 text-sm font-bold text-success bg-success/10 px-3 py-1 rounded-full border border-success/20">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                    </span>
                ) : (
                    <span className="text-sm font-medium text-muted bg-slate-100 px-3 py-1 rounded-full border border-border">
                        Keep reading to mark as complete
                    </span>
                )}
            </div>

            {/* Render mock HTML safely for the demo */}
            <div
                className="prose prose-slate max-w-none text-ink text-lg leading-relaxed font-sans"
                dangerouslySetInnerHTML={{ __html: activity.content }}
            />

            {/* Sentinel for IntersectionObserver to ping when user reaches bottom */}
            <div ref={sentinelRef} className="h-4 w-full mt-8" />
        </div>
    );
}
