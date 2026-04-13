import React from 'react';
import { AssessmentActivity as AssessmentType } from '../../lib/mockData';
import { useProgressStore } from '../../store/progressStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, AlertCircle, BarChart3, ClipboardList, Target } from 'lucide-react';

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
        <div className={`rounded-3xl shadow-premium border p-5 sm:p-7 md:p-8 transition-all duration-500 hover:shadow-2xl group/assess flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${isExam ? 'bg-accent/[0.03] border-accent/20' : 'bg-white border-border/40'}`} id={`activity-${activity.id}`}>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 w-full lg:w-auto overflow-hidden">
                <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-lg shrink-0 flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 group-hover/assess:scale-110 transition-transform ${isExam ? 'bg-accent text-white shadow-accent/20' : 'bg-navy text-white shadow-navy/20'}`}>
                    {isExam ? <ClipboardList className="w-7 h-7 sm:w-10 sm:h-10" /> : <Target className="w-7 h-7 sm:w-10 sm:h-10" />}
                </div>

                <div className="min-w-0 flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 mb-2.5">
                        <h3 className="text-xl sm:text-2xl font-serif font-black text-navy truncate tracking-tight">{activity.title}</h3>
                        {isExam && (
                            <span className="bg-accent/10 text-accent border border-accent/20 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-sm">
                                PROCTORED EXAM
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[10px] sm:text-xs font-bold text-muted opacity-80">
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> {(activity as any).duration || (activity as any).durationMinutes || 0} Minutes</span>
                        <span className="text-slate-300 font-thin">|</span>
                        <span className="tracking-tight">{activity.questions?.length || 0} Assessment Points</span>
                        <span className="text-slate-300 font-thin">|</span>
                        <span className="uppercase tracking-widest text-[9px] bg-slate-100 px-2 py-0.5 rounded-lg border border-border/60">{activity.type}</span>
                    </div>

                    {!isCompleted && isExam && (
                        <div className="mt-5 flex items-center gap-2.5 text-xs font-bold text-accent bg-accent/[0.05] p-3.5 rounded-xl border border-accent/10 shadow-inner">
                            <AlertCircle className="w-4 h-4" />
                            Secure Browser Mode Active
                        </div>
                    )}
                </div>
            </div>

            <div className="min-w-[200px] w-full lg:w-auto">
                {isInstructor ? (
                    <button
                        onClick={() => navigate(`/course/${courseId}/${activity.type}/${activity.id}`)}
                        className="w-full bg-navy hover:bg-primary text-white px-8 py-3.5 rounded-xl font-black transition-all shadow-xl hover:shadow-primary/30 flex items-center justify-center gap-2.5 group/btn text-sm uppercase tracking-widest"
                    >
                        <BarChart3 className="w-5 h-5 group-btn:scale-110 transition-transform" />
                        Analytics
                    </button>
                ) : isCompleted ? (
                    <button
                        onClick={() => navigate(`/course/${courseId}/${activity.type}/${activity.id}`)}
                        className="w-full bg-success/5 border-2 border-success/20 text-success px-6 py-3.5 rounded-xl font-black flex items-center justify-center gap-3 shadow-sm hover:bg-success/10 transition-all text-sm uppercase tracking-widest"
                    >
                        <CheckCircle2 className="w-6 h-6" />
                        <div className="text-left leading-tight">
                            <p>Verified</p>
                        </div>
                    </button>
                ) : (
                    <button
                        onClick={() => navigate(`/course/${courseId}/${activity.type}/${activity.id}`)}
                        className={`w-full text-white px-8 py-3.5 rounded-xl font-black transition-all shadow-xl hover:shadow-lg hover:-translate-y-1 flex items-center justify-center gap-2.5 text-sm uppercase tracking-widest ${isExam ? 'bg-accent hover:bg-red-800 shadow-accent/20' : 'bg-primary hover:bg-navy shadow-primary/20'}`}
                    >
                        {isExam ? 'Begin Exam' : 'Initiate'}
                    </button>
                )}
            </div>

        </div>
    );
}

