import React, { useState } from 'react';
import { Course, Module, Activity } from '../../lib/mockData';
import { useProgressStore } from '../../store/progressStore';
import { ChevronDown, ChevronRight, PlayCircle, FileText, FileVideo, Clock, Circle, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
    course: Course;
}

export default function ModuleSidebar({ course }: Props) {
    return (
        <aside className="w-[260px] flex-shrink-0 border-r border-border bg-surface h-[calc(100vh-64px)] overflow-y-auto sticky top-0 shadow-inner">
            <div className="p-4 border-b border-border bg-card sticky top-0 z-10">
                <h3 className="font-serif font-bold text-navy text-lg leading-tight">Course Modules</h3>
            </div>
            <div className="py-2">
                {course.modules.map((mod) => (
                    <ModuleRow key={mod.id} module={mod} />
                ))}
            </div>
        </aside>
    );
}

function ModuleRow({ module }: { module: Module }) {
    const [expanded, setExpanded] = useState(true);
    const { activityStatus } = useProgressStore();

    const handleScrollTo = (activityId: string) => {
        const el = document.getElementById(`activity-${activityId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.transition = 'box-shadow 0.3s ease-out';
            el.style.boxShadow = '0 0 0 4px #1B3A6B'; // temporary blue glow
            setTimeout(() => {
                el.style.boxShadow = 'none';
            }, 2000);
        }
    };

    const getModuleProgress = () => {
        if (module.activities.length === 0) return 0;
        const completed = module.activities.filter(a => activityStatus[a.id] === 'completed').length;
        return Math.round((completed / module.activities.length) * 100);
    };

    const modProgress = getModuleProgress();

    return (
        <div className="border-b border-slate-200 last:border-0 relative">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-white transition-colors group"
            >
                <div className="flex items-center gap-2 text-left flex-1 min-w-0 pr-4">
                    <div className="text-muted group-hover:text-primary transition-colors">
                        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <span className="font-bold text-sm text-navy truncate">{module.title}</span>
                </div>

                {/* Module Progress Circle */}
                <div className="w-6 h-6 flex-shrink-0 relative">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-200" strokeWidth="4" />
                        <circle
                            cx="18" cy="18" r="16" fill="none" className="stroke-success transition-all duration-500"
                            strokeWidth="4" strokeDasharray="100" strokeDashoffset={100 - modProgress}
                        />
                    </svg>
                </div>
            </button>

            {expanded && (
                <div className="bg-slate-50/50 pb-2">
                    {module.activities.map((act) => (
                        <ActivityRow
                            key={act.id}
                            activity={act}
                            onClick={() => handleScrollTo(act.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function ActivityRow({ activity, onClick }: { activity: Activity; onClick: () => void }) {
    const { activityStatus } = useProgressStore();
    const status = activityStatus[activity.id] || 'not_started';

    const getTypeIcon = () => {
        switch (activity.type) {
            case 'video': return <PlayCircle className="w-3.5 h-3.5 text-navy" />;
            case 'file': return <FileText className="w-3.5 h-3.5 text-accent" />;
            case 'blog': return <FileText className="w-3.5 h-3.5 text-primary" />;
            case 'live_class': return <Clock className="w-3.5 h-3.5 text-highlight" />;
            case 'quiz':
            case 'exam': return <FileVideo className="w-3.5 h-3.5 text-success" />;
        }
    };

    const StatusRing = () => {
        if (status === 'completed') {
            return (
                <div className="w-4 h-4 rounded-full bg-success flex items-center justify-center shrink-0 border border-success">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
            );
        }
        if (status === 'in_progress') {
            // Half-filled ring visualization using inline CSS
            return (
                <div
                    className="w-4 h-4 rounded-full shrink-0 border border-border overflow-hidden relative"
                >
                    <div className="absolute inset-0 bg-success transform scale-x-50 origin-left" />
                </div>
            );
        }
        // Hollow ring
        return <Circle className="w-4 h-4 shrink-0 text-border" strokeWidth={3} />;
    };

    return (
        <button
            onClick={onClick}
            className="w-full pl-10 pr-4 py-2 flex items-center gap-3 hover:bg-white transition-colors group text-left"
        >
            <StatusRing />
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="bg-white p-1 rounded border border-border shadow-sm group-hover:border-primary/30 transition-colors shrink-0">
                    {getTypeIcon()}
                </div>
                <p className="text-xs font-medium text-ink truncate group-hover:text-primary transition-colors">
                    {activity.title}
                </p>
            </div>
        </button>
    );
}
