import React from 'react';
import { Course } from '../../lib/mockData';
import { useCourseStore } from '../../store/courseStore';
import { useProgressStore } from '../../store/progressStore';
import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface Props {
    course: Course;
}

export default function CourseCard({ course }: Props) {
    const navigate = useNavigate();
    const { starred, toggleStar, instructorCompleted } = useCourseStore();
    const { getCourseProgress } = useProgressStore();

    const isStarred = starred.has(course.id);
    const isInstructorCertified = instructorCompleted.has(course.id);
    // Flatten activities from all modules to calculate progress
    const allActivities = course.modules.flatMap(m => m.activities);
    const progressPercent = allActivities.length > 0 
        ? getCourseProgress(course.id, allActivities)
        : (course.progressPercent || 0);

    const getCategoryStyles = () => {
        switch (course.category) {
            case 'AI/ML': return 'bg-primary/10 text-primary border-primary/20';
            case 'Science': return 'bg-success/10 text-success border-success/20';
            case 'Arts': return 'bg-highlight/10 text-navy border-highlight/20';
            case 'Business': return 'bg-accent/10 text-accent border-accent/20';
            default: return 'bg-navy/10 text-navy border-navy/20';
        }
    };

    return (
        <div 
            onClick={() => navigate(`/course/${course.id}`)}
            className="group bg-card rounded-[1.4rem] border border-border/60 shadow-sm hover:shadow-premium hover:-translate-y-1.5 transition-all duration-500 flex flex-col overflow-hidden h-full cursor-pointer relative"
        >
            <div className="absolute top-3 left-3 z-10">
                <span className={cn('px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-sm', getCategoryStyles())}>
                    {course.category}
                </span>
            </div>

            <div className="p-5 flex-1 flex flex-col relative pt-10">
                {/* Star Icon (Made tap-friendly) */}
                <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(course.id); }}
                    className="absolute top-3 right-3 text-muted hover:text-highlight transition-all min-h-[36px] min-w-[36px] flex items-center justify-center bg-surface/50 rounded-xl backdrop-blur-sm border border-border/20 shadow-sm hover:scale-110 active:scale-95"
                    aria-label={isStarred ? "Unstar course" : "Star course"}
                >
                    <Star className={cn('w-4 h-4 transition-transform', isStarred && 'fill-highlight text-highlight')} />
                </button>


                <h3 className="text-lg sm:text-xl font-serif font-black text-navy pr-8 leading-[1.2] mb-2 line-clamp-2 transition-colors group-hover:text-primary">
                    {course.name}
                </h3>

                <p className="text-xs text-muted font-bold mb-4 flex-1 line-clamp-2 opacity-80 leading-relaxed">
                    {course.section}
                </p>

                <div className="flex items-center gap-3 mt-auto">
                    <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-navy to-slate-800 text-white flex items-center justify-center font-black font-serif text-xs shadow-lg border border-white/10 group-hover:rotate-6 transition-transform">
                        {course.facultyInitial}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-black text-ink truncate tracking-tight">{course.faculty}</p>
                        <p className="text-[9px] text-muted font-bold truncate opacity-60 uppercase tracking-tighter">Instructor</p>
                    </div>
                </div>
            </div>

            <div className="bg-surface/50 backdrop-blur-sm px-5 py-3.5 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[80px]">
                    <div className="flex justify-between text-[9px] font-black text-navy mb-1.5 uppercase tracking-widest opacity-60">
                        <span>Progress</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-border/40 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-success to-emerald-400 transition-all duration-1000 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                   <div className="bg-navy hover:bg-primary text-white font-black py-2 px-4 rounded-xl text-[10px] sm:text-xs transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center group-hover:scale-105">
                        {progressPercent > 0 ? "Continue" : "Begin"}
                    </div>
                </div>
            </div>

        </div>
    );
}
