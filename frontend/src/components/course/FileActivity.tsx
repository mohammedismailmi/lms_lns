import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileActivity as FileType } from '../../lib/mockData';
import { useProgressStore } from '../../store/progressStore';
import { FileDown, FileIcon, FileText, FileVideo, Image } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
    activity: FileType;
    courseId?: string;
}

export default function FileActivity({ activity, courseId }: Props) {
    const { markDone, activityStatus } = useProgressStore();
    const navigate = useNavigate();
    const isCompleted = activityStatus[activity.id] === 'completed';

    const getFileIcon = () => {
        switch (activity.fileType as string) {
            case 'application/pdf': return <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />;
            case 'application/msword':
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return <FileIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />;
            case 'application/vnd.ms-powerpoint':
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': return <FileIcon className="w-6 h-6 sm:w-8 sm:h-8 text-highlight" />;
            case 'image/jpeg':
            case 'image/png': return <Image className="w-6 h-6 sm:w-8 sm:h-8 text-success" />;
            case 'video/mp4':
            case 'video/webm': return <FileVideo className="w-6 h-6 sm:w-8 sm:h-8 text-navy" />;
            default: return <FileIcon className="w-6 h-6 sm:w-8 sm:h-8 text-muted" />;
        }
    };

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        markDone(activity.id);
        if (courseId) {
            navigate(`/course/${courseId}/lesson/file/${activity.id}`);
        }
    };

    const fileTypeConfig: Record<string, {label: string, color: string, bg: string}> = {
      'application/pdf':    { label: 'PDF',   color: '#8B1A1A', bg: '#FEF2F2' },
      'video/mp4':          { label: 'Video', color: '#1B3A6B', bg: '#EFF6FF' },
      'video/webm':         { label: 'Video', color: '#1B3A6B', bg: '#EFF6FF' },
      'application/msword': { label: 'Word',  color: '#1B3A6B', bg: '#EFF6FF' },
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                            { label: 'Word',  color: '#1B3A6B', bg: '#EFF6FF' },
      'application/vnd.ms-powerpoint':
                            { label: 'PPT',   color: '#C9A84C', bg: '#FEF9EC' },
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                            { label: 'PPT',   color: '#C9A84C', bg: '#FEF9EC' },
      'image/jpeg':         { label: 'Image', color: '#2D5A27', bg: '#F0FDF4' },
      'image/png':          { label: 'Image', color: '#2D5A27', bg: '#F0FDF4' },
    };

    const config = fileTypeConfig[activity.fileType || ''] ?? { label: 'FILE', color: '#6B6B6B', bg: '#F5F0E8' };

    return (
        <div className="bg-white rounded-3xl shadow-premium border border-border/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:shadow-2xl transition-all duration-300 group/file" id={`activity-${activity.id}`}>
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 ml-1">
                <div className="p-3 sm:p-4 bg-surface rounded-xl sm:rounded-2xl border border-slate-100 shadow-inner shrink-0 group-hover/file:scale-105 transition-transform">
                    {getFileIcon()}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-xl font-serif font-black text-navy mb-1 sm:mb-1.5 truncate group-hover/file:text-primary transition-colors leading-tight">{activity.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-[10px] sm:text-xs font-bold text-muted mt-1">
                        <span
                          className="text-[9px] sm:text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest border"
                          style={{ color: config.color, backgroundColor: config.bg, borderColor: `${config.color}20` }}
                        >
                          {config.label}
                        </span>
                        <span className="text-slate-300 font-thin">|</span>
                        <span className="truncate max-w-[120px] sm:max-w-[200px] opacity-60 font-medium tracking-tighter">{activity.fileName}</span>
                    </div>
                </div>
            </div>

            <button
                onClick={handleOpen}
                className={cn(
                    "flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl font-black transition-all shadow-lg focus:ring-4 focus:ring-offset-2 text-xs sm:text-sm w-full sm:w-auto justify-center shrink-0 min-h-[44px] uppercase tracking-widest",
                    isCompleted
                        ? "bg-slate-100 text-navy hover:bg-slate-200 focus:ring-slate-200 border border-border/60"
                        : "bg-navy text-white hover:bg-primary shadow-navy/20 hover:shadow-primary/30 focus:ring-primary/30"
                )}
            >
                <FileDown className="w-4 h-4 sm:w-5 sm:h-5" />
                Explore
            </button>
        </div>
    );
}
