import React from 'react';
import { AssessmentActivity as AssessmentType } from '../../lib/mockData';
import { useProgressStore } from '../../store/progressStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Clock, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';

interface Props {
    activity: AssessmentType;
    courseId?: string;
}

export default function AssessmentActivity({ activity, courseId }: Props) {
    const navigate = useNavigate();
    const { activityStatus } = useProgressStore();
    const { user } = useAuthStore();

    const isCompleted = activityStatus[activity.id] === 'completed';
    const isExam = activity.type === 'exam';
    const isInstructor = user?.role === 'instructor' || user?.role === 'admin';

    return (
        <div className={`rounded-xl shadow-sm border p-8 flex flex-col md:flex-row items-center justify-between gap-6 ${isExam ? 'bg-highlight/5 border-highlight/20' : 'bg-white border-border'}`} id={`activity-${activity.id}`}>

            <div className="flex items-start gap-5">
                <div className={`p-4 rounded-xl shadow-sm ${isExam ? 'bg-highlight text-navy' : 'bg-navy text-white'}`}>
                    <FileQuestion className="w-8 h-8" />
                </div>

                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-2xl font-serif font-bold text-navy">{activity.title}</h3>
                        {isExam && (
                            <span className="bg-highlight/20 text-highlight-foreground border border-highlight/40 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider text-yellow-800">
                                Major Assessment
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4 text-sm font-medium text-muted">
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {(activity as any).duration || (activity as any).durationMinutes || 0} Mins</span>
                        <span>•</span>
                        <span>{activity.questions?.length || 0} Questions</span>
                        <span>•</span>
                        <span className="uppercase tracking-wider">{activity.type}</span>
                    </div>

                    {!isCompleted && isExam && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-accent bg-accent/5 p-3 rounded-lg border border-accent/10">
                            <AlertCircle className="w-4 h-4" />
                            This exam is proctored. Do not switch tabs.
                        </div>
                    )}
                </div>
            </div>

            <div className="min-w-[200px] w-full md:w-auto">
                {isInstructor ? (
                    <button
                        onClick={() => navigate(`/course/${courseId}/${activity.type}/${activity.id}`)}
                        className="w-full bg-navy hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                    >
                        <BarChart3 className="w-5 h-5" />
                        View Results
                    </button>
                ) : isCompleted ? (
                    <button
                        onClick={() => navigate(`/course/${courseId}/${activity.type}/${activity.id}`)}
                        className="w-full bg-success/10 border border-success/30 text-success px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-success/20 transition-all"
                    >
                        <CheckCircle2 className="w-6 h-6" />
                        <div className="text-left leading-tight">
                            <p>Submitted</p>
                            <p className="text-xs font-medium opacity-80">Review results online</p>
                        </div>
                    </button>
                ) : (
                    <button
                        onClick={() => navigate(`/course/${courseId}/${activity.type}/${activity.id}`)}
                        className={`w-full text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 ${isExam ? 'bg-accent hover:bg-red-900' : 'bg-primary hover:bg-blue-900'}`}
                    >
                        Start {isExam ? 'Exam' : 'Quiz'}
                    </button>
                )}
            </div>

        </div>
    );
}

