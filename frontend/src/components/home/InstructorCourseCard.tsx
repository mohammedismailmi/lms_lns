import React from 'react';
import { Course } from '../../lib/mockData';
import { useNavigate } from 'react-router-dom';
import { useCourseStore } from '../../store/courseStore';
import { Users, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
    course: Course;
}

export default function InstructorCourseCard({ course }: Props) {
    const navigate = useNavigate();
    const { enrolledCourseIds } = useCourseStore();

    // Calculate number of enrolled students across the entire array of user -> course bindings
    const enrolledCount = Object.values(enrolledCourseIds).filter(courseIds => courseIds.includes(course.id)).length;

    // Static placeholder mock rate as strict individual user progress isn't tracked in global global progressStore structure yet
    const mockCompletionRate = 65; 

    const getBorderColor = (category: string) => {
        switch (category) {
            case 'AI/ML': return 'border-t-primary';
            case 'Science': return 'border-t-highlight';
            case 'Arts': return 'border-t-accent';
            case 'Business': return 'border-t-success';
            default: return 'border-t-slate-400';
        }
    };

    return (
        <div className={cn(
            "bg-white rounded-xl shadow-sm border border-border overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-slate-300 border-t-4",
            getBorderColor(course.category)
        )}>
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted bg-surface px-2 py-1 rounded">
                        {course.category}
                    </span>
                </div>

                <h3 className="text-xl font-serif font-bold text-navy line-clamp-2 mb-2 leading-tight">
                    {course.name}
                </h3>
                <p className="text-sm text-muted mb-6 flex-1">{course.section}</p>

                <div className="flex items-center gap-4 py-4 border-y border-border mb-6">
                    <div className="flex-1 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <div>
                            <p className="text-xs text-muted font-medium uppercase tracking-wider">Students</p>
                            <p className="text-lg font-bold text-navy font-serif leading-none">{enrolledCount}</p>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex-1 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        <div>
                            <p className="text-xs text-muted font-medium uppercase tracking-wider">Avg. Done</p>
                            <p className="text-lg font-bold text-navy font-serif leading-none">{mockCompletionRate}%</p>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => navigate(`/course/${course.id}`)}
                    className="w-full bg-primary hover:bg-navy text-white font-medium py-3 rounded-xl transition-colors active:scale-[0.98]"
                >
                    Manage Course
                </button>
            </div>
        </div>
    );
}
