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
        <div className="bg-white rounded-3xl shadow-premium border border-border/40 p-5 sm:p-7 md:p-8 relative hover:shadow-2xl transition-all duration-500 group/blog" id={`activity-${activity.id}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-8 border-b border-border/30 pb-6 transition-colors group-hover/blog:border-primary/20">
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 w-full">
                    <div className="p-2.5 bg-primary/5 rounded-xl text-primary shrink-0 border border-primary/10 group-hover/blog:scale-110 transition-transform shadow-inner">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-navy truncate break-words whitespace-normal tracking-tight leading-tight">{activity.title}</h2>
                </div>
                {isRead ? (
                    <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black text-success bg-success/10 px-3 py-1.5 rounded-full border border-success/20 shrink-0 shadow-sm uppercase tracking-widest">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                    </span>
                ) : (
                    <span className="text-[10px] sm:text-xs font-black text-muted bg-slate-50 px-3 py-1.5 rounded-full border border-border/60 shrink-0 text-center w-auto self-stretch sm:self-auto shadow-inner uppercase tracking-widest">
                        Read System
                    </span>
                )}
            </div>

            {/* Render mock HTML safely for the demo */}
            <div
                className="prose prose-slate max-w-none text-ink text-base leading-relaxed font-sans font-medium"
                dangerouslySetInnerHTML={{ __html: activity.content }}
            />

            {/* Sentinel for IntersectionObserver to ping when user reaches bottom */}
            <div ref={sentinelRef} className="h-4 w-full mt-8" />
        </div>
    );
}
