import React from 'react';
import { Course } from '../../lib/mockData';
import { useCourseStore } from '../../store/courseStore';
import { useProgressStore } from '../../store/progressStore';
import { Star, Award } from 'lucide-react';
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

    const showCertificateBadge = isInstructorCertified && progressPercent === 100;

    const getCategoryBorderColor = () => {
        switch (course.category) {
            case 'AI/ML': return 'border-l-[6px] border-l-primary';
            case 'Science': return 'border-l-[6px] border-l-success';
            case 'Arts': return 'border-l-[6px] border-l-highlight';
            case 'Business': return 'border-l-[6px] border-l-accent';
            default: return 'border-l-[6px] border-l-navy';
        }
    };

    return (
        <div className={cn('bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group', getCategoryBorderColor())}>

            <div className="p-5 flex-1 flex flex-col relative">
                {/* Star Icon */}
                <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(course.id); }}
                    className="absolute top-4 right-4 text-muted hover:text-highlight transition-all"
                >
                    <Star className={cn('w-6 h-6 transition-transform hover:scale-110 active:scale-90', isStarred && 'fill-highlight text-highlight')} />
                </button>



                <h3 className="text-xl font-serif font-bold text-navy pr-16 leading-tight mb-2">
                    {course.name}
                </h3>

                <p className="text-sm text-muted font-medium mb-6 flex-1">
                    {course.section}
                </p>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-bold font-serif text-sm shadow-sm">
                        {course.facultyInitial}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-ink">{course.faculty}</p>
                        <p className="text-xs text-muted">Instructor</p>
                    </div>
                </div>
            </div>

            <div className="bg-surface px-5 py-4 border-t border-border flex items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex justify-between text-xs font-bold text-navy mb-1.5">
                        <span>Progress</span>
                        <span>{progressPercent}% complete</span>
                    </div>
                    <div className="w-full h-2.5 bg-border rounded-full overflow-hidden">
                        <div
                            className="h-full bg-success transition-all duration-500 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                <button
                    onClick={() => navigate(`/course/${course.id}`)}
                    className="bg-navy hover:bg-primary text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors shadow-sm"
                >
                    {progressPercent > 0 ? "Continue" : "Start"}
                </button>
            </div>

        </div>
    );
}
