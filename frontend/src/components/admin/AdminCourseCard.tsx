import React, { useState } from 'react';
import { Course } from '../../lib/mockData';
import { useNavigate } from 'react-router-dom';
import { useCourseStore } from '../../store/courseStore';
import { Edit2, Settings, Trash2, UserPlus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../../lib/useToast';

interface Props {
    course: Course;
    onEdit: (course: Course) => void;
    onAssign: (course: Course) => void;
}

export default function AdminCourseCard({ course, onEdit, onAssign }: Props) {
    const navigate = useNavigate();
    const { deleteCourse } = useCourseStore();
    const toast = useToast();
    
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFadeOut, setIsFadeOut] = useState(false);

    const getBorderColor = (category: string) => {
        switch (category) {
            case 'AI/ML': return 'border-t-primary';
            case 'Science': return 'border-t-highlight';
            case 'Arts': return 'border-t-accent';
            case 'Business': return 'border-t-success';
            default: return 'border-t-slate-400';
        }
    };

    const confirmDelete = () => {
        setIsFadeOut(true);
        setTimeout(() => {
            deleteCourse(course.id);
            toast.info(`Course \"${course.name}\" deleted forever.`);
        }, 300); // match transition duration
    };

    return (
        <div className={cn(
            "bg-white rounded-xl shadow-sm border border-border overflow-hidden flex flex-col transition-all border-t-4 relative",
            getBorderColor(course.category),
            isFadeOut ? "opacity-0 scale-95" : "opacity-100 scale-100 hover:shadow-md hover:border-slate-300"
        )} style={{ transitionDuration: '300ms' }}>
            
            <div className="p-4.5 flex-1 flex flex-col pt-4">
                <div className="flex justify-between items-start mb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted bg-surface px-1.5 py-0.5 rounded">
                        {course.category}
                    </span>
                    <span className="text-[10px] font-bold text-navy bg-primary/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                        {course.totalActivities} Modules
                    </span>
                </div>

                <div 
                    className="w-12 h-1 mb-3 rounded-full" 
                    style={{ backgroundColor: course.thumbnailColor || '#1B3A6B' }} 
                />

                <h3 className="text-lg font-serif font-bold text-navy line-clamp-2 mb-0.5 leading-tight">
                    {course.name}
                </h3>
                <p className="text-xs text-muted mb-1.5 font-medium">{course.section}</p>
                <p className="text-[11px] text-slate-500 mb-5 flex-1">Faculty: {course.faculty}</p>

                {isDeleting ? (
                    <div className="bg-accent/10 p-3.5 rounded-lg border border-accent/20 animate-in fade-in zoom-in-95 duration-200">
                        <p className="text-xs font-bold text-accent mb-2.5">Delete course forever?</p>
                        <div className="flex gap-2">
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 bg-accent text-white py-1.5 rounded text-xs font-bold hover:opacity-90 transition-opacity"
                            >
                                Delete
                            </button>
                            <button 
                                onClick={() => setIsDeleting(false)}
                                className="flex-1 bg-white text-muted border border-border py-1.5 rounded text-xs font-bold hover:bg-slate-50 transition-colors"
                            >
                                Back
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <button 
                            onClick={() => onEdit(course)}
                            className="flex-1 bg-surface hover:bg-slate-100 text-navy font-bold text-xs py-2 rounded-lg transition-colors border border-border flex items-center justify-center gap-1.5"
                        >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button 
                            onClick={() => setIsDeleting(true)}
                            className="bg-surface hover:bg-accent/10 hover:text-accent hover:border-accent/30 text-muted font-bold py-2 px-2.5 rounded-lg transition-colors border border-border"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={() => onAssign(course)}
                            className="bg-surface hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-muted font-bold py-2 px-2.5 rounded-lg transition-colors border border-border"
                            title="Assign Instructor"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={() => navigate(`/course/${course.id}`)}
                            className="flex-[1.2] bg-primary hover:bg-navy text-white font-bold text-xs py-2 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5"
                        >
                            Manage <Settings className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
