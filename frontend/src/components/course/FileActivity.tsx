import React from 'react';
import { FileActivity as FileType } from '../../lib/mockData';
import { useProgressStore } from '../../store/progressStore';
import { FileDown, FileIcon, FileText, FileVideo, Image } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
    activity: FileType;
}

export default function FileActivity({ activity }: Props) {
    const { markDone, activityStatus } = useProgressStore();
    const isCompleted = activityStatus[activity.id] === 'completed';

    const getFileIcon = () => {
        switch (activity.fileType) {
            case 'pdf': return <FileText className="w-8 h-8 text-accent" />;
            case 'doc': return <FileIcon className="w-8 h-8 text-primary" />;
            case 'ppt': return <FileIcon className="w-8 h-8 text-highlight" />;
            case 'image': return <Image className="w-8 h-8 text-success" />;
            case 'video': return <FileVideo className="w-8 h-8 text-navy" />;
            default: return <FileIcon className="w-8 h-8 text-muted" />;
        }
    };

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation(); // prevent triggering the CoursePage's card click
        markDone(activity.id);
        window.open(activity.fileUrl, '_blank');
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-border p-6 flex flex-col md:flex-row items-center justify-between gap-6" id={`activity-${activity.id}`}>
            <div className="flex items-center gap-5">
                <div className="p-4 bg-surface rounded-2xl border border-slate-100 shadow-sm">
                    {getFileIcon()}
                </div>
                <div>
                    <h3 className="text-xl font-serif font-bold text-navy mb-1">{activity.title}</h3>
                    <div className="flex items-center gap-3 text-sm font-medium text-muted">
                        <span className="uppercase tracking-wider">{activity.fileType}</span>
                        <span>•</span>
                        <span>{activity.fileSize}</span>
                        <span>•</span>
                        <span className="truncate max-w-[200px]">{activity.fileName}</span>
                    </div>
                </div>
            </div>

            <button
                onClick={handleOpen}
                className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm focus:ring-2 focus:ring-offset-2",
                    isCompleted
                        ? "bg-slate-100 text-navy hover:bg-slate-200 focus:ring-slate-300 border border-border"
                        : "bg-primary text-white hover:bg-navy focus:ring-primary"
                )}
            >
                <FileDown className="w-5 h-5" />
                Open File
            </button>
        </div>
    );
}
