import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useProgressStore } from '../../store/progressStore';
import { Upload, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../lib/useToast';

interface Props {
    activity: {
        id: string;
        title: string;
        content?: string;
        dueAt?: string;
    };
    courseId?: string;
}

export default function SubmissionActivity({ activity, courseId }: Props) {
    const { user } = useAuthStore();
    const { activityStatus, markDone } = useProgressStore();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitted, setSubmitted] = useState(activityStatus[activity.id] === 'completed');
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [mySubmission, setMySubmission] = useState<any>(null);
    const [loadingMySub, setLoadingMySub] = useState(false);
    const toast = useToast();

    const isInstructor = user?.role === 'admin' || user?.role === 'instructor';

    useEffect(() => {
        if (isInstructor) {
            setLoadingSubmissions(true);
            api.get(`/api/activities/${activity.id}/submissions`)
                .then(res => setSubmissions(res.data.submissions || []))
                .catch(() => toast.error('Failed to load submissions'))
                .finally(() => setLoadingSubmissions(false));
        } else {
            setLoadingMySub(true);
            api.get(`/api/activities/${activity.id}/my-submission`)
                .then(res => setMySubmission(res.data.submission))
                .catch(() => console.error('Failed to load my submission'))
                .finally(() => setLoadingMySub(false));
        }
    }, [activity.id, isInstructor]);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await api.post(`/api/activities/${activity.id}/submit`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setSubmitted(true);
                setMySubmission(res.data.submission);
                markDone(activity.id, courseId);
                toast.success('Assignment submitted successfully!');
            }
        } catch (err) {
            toast.error('Failed to submit assignment.');
        } finally {
            setUploading(false);
        }
    };

    const handleGrade = async (subId: string, grade: string, feedback: string) => {
        try {
            await api.put(`/api/submissions/${subId}/grade`, { grade, feedback });
            toast.success('Graded successfully');
            setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, grade, feedback, status: 'graded' } : s));
        } catch (err) {
            toast.error('Failed to grade');
        }
    };

    const isPastDue = activity.dueAt && new Date() > new Date(activity.dueAt);

    if (isInstructor) {
        return (
            <div className="bg-white rounded-3xl shadow-premium border border-border/40 p-5 sm:p-7 md:p-8 hover:shadow-2xl transition-all duration-500 group/subinst">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-5 pb-5 border-b border-border/30">
                    <div className="flex items-start sm:items-center gap-3.5 w-full">
                        <div className="p-2.5 bg-primary/5 rounded-xl text-primary shrink-0 border border-primary/10 group-hover/subinst:scale-110 transition-transform">
                            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-serif font-black text-navy truncate break-words whitespace-normal tracking-tight">{activity.title} <span className="text-muted opacity-40 font-sans text-xs uppercase tracking-widest ml-2 italic">Faculty</span></h2>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-surface p-5 rounded-2xl border border-border shadow-inner mb-6">
                        <div>
                            <p className="text-[9px] text-muted uppercase tracking-widest font-black mb-1 opacity-60">Deadline System</p>
                            <p className="text-xs sm:text-sm font-black text-navy flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                {activity.dueAt ? new Date(activity.dueAt).toLocaleString() : 'Open'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-muted uppercase tracking-widest font-black mb-1 opacity-60">Submissions</p>
                            <p className="text-xl font-serif font-black text-primary leading-none">{submissions.length}</p>
                        </div>
                    </div>

                    <h3 className="font-black text-navy uppercase text-[10px] tracking-widest opacity-60 mb-3 px-1">Registrar Ledger</h3>
                    {loadingSubmissions ? (
                        <div className="py-12 text-center text-muted animate-pulse font-serif italic text-base">Retrieving...</div>
                    ) : submissions.length === 0 ? (
                        <div className="py-12 text-center text-muted font-serif italic border-2 border-dashed border-slate-50 rounded-2xl text-base">Empty.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {submissions.map(sub => (
                                <div key={sub.id} className="py-3 flex items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-navy">{sub.studentName}</p>
                                            {sub.isLate === 1 && (
                                                <span className="px-1.5 py-0.5 bg-accent/10 text-accent text-[9px] font-bold uppercase rounded-full border border-accent/20">LATE</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-muted">Received {new Date(sub.submittedAt).toLocaleDateString()}</p>
                                        <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-bold mt-0.5 inline-block">Download</a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {sub.grade ? (
                                            <div className="text-right bg-success/5 px-3 py-1.5 rounded-xl border border-success/10 shadow-sm">
                                                <p className="text-xs font-black text-success">Grade: {sub.grade}</p>
                                            </div>
                                        ) : (
                                            <div className="flex gap-1.5">
                                                <input id={`grade-${sub.id}`} placeholder="Grade" className="w-16 px-2 py-1.5 text-xs border border-border rounded-lg outline-none" />
                                                <button onClick={() => {
                                                    const grade = (document.getElementById(`grade-${sub.id}`) as HTMLInputElement).value;
                                                    handleGrade(sub.id, grade, 'Graded.');
                                                }} className="px-3 py-1.5 bg-navy text-white text-[10px] font-black rounded-lg transition-all hover:bg-primary uppercase">Grade</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-premium border border-border/40 p-5 sm:p-7 md:p-8 transition-all duration-500 hover:shadow-2xl group/sublearn" id={`activity-${activity.id}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-5 pb-5 border-b border-border/30">
                <div className="flex items-start sm:items-center gap-3.5 w-full overflow-hidden">
                    <div className="p-2.5 bg-primary/5 rounded-xl text-primary shrink-0 border border-primary/10 group-hover/sublearn:scale-110 transition-transform">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-navy truncate break-words whitespace-normal tracking-tight">{activity.title}</h2>
                </div>
                {activity.dueAt && (
                    <div className={`px-4 py-2 rounded-xl border flex flex-col items-start sm:items-end w-full sm:w-auto shrink-0 shadow-sm ${isPastDue ? 'bg-accent/5 border-accent/20' : 'bg-surface border-border/40'}`}>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted opacity-60 mb-0.5">Deadline</span>
                        <span className={`text-[10px] sm:text-xs font-black ${isPastDue ? 'text-accent' : 'text-navy'}`}>
                            {new Date(activity.dueAt).toLocaleString()}
                        </span>
                    </div>
                )}
            </div>

            <div className="bg-surface rounded-2xl p-5 md:p-6 border border-border/40 mb-8 shadow-inner group-hover/sublearn:border-primary/20 transition-colors">
                <h3 className="font-black text-navy mb-2 flex items-center gap-2.5 text-base">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    Instructions
                </h3>
                <p className="text-muted text-xs sm:text-sm leading-relaxed opacity-80 font-medium">
                    {activity.content || 'Please upload your completed assignment file for review.'}
                </p>
            </div>

            {submitted || mySubmission ? (
                <div className="bg-success/[0.03] border-2 border-dashed border-success/20 rounded-[1.75rem] p-6 md:p-10 text-center animate-in zoom-in-95 duration-500 shadow-inner">
                    <div className="w-14 h-14 bg-success rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-success/20">
                        <CheckCircle className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-serif font-black text-navy mb-2 tracking-tight">Assignment Submitted</h3>
                    <p className="text-muted text-xs sm:text-sm mb-6 font-medium">
                        Received on {new Date(mySubmission?.submittedAt || Date.now()).toLocaleDateString()}
                    </p>
                    
                    {mySubmission?.grade ? (
                        <div className="bg-white p-5 md:p-7 rounded-2xl border border-success/20 shadow-premium inline-block transition-transform hover:scale-105 duration-300">
                            <p className="text-[9px] text-muted uppercase tracking-widest font-black mb-1.5 opacity-60">Result</p>
                            <p className="text-3xl sm:text-4xl font-serif font-black text-success capitalize tracking-tighter mb-1.5">{mySubmission.grade}</p>
                            {mySubmission.feedback && <p className="text-xs text-muted italic font-medium">"{mySubmission.feedback}"</p>}
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-success/30 rounded-full text-success text-[10px] font-black uppercase tracking-widest shadow-md">
                            <Clock className="w-3.5 h-3.5" /> REVIEW PENDING
                        </div>
                    )}
                </div>
            ) : isPastDue ? (
                <div className="bg-accent/5 border-2 border-dashed border-accent/20 rounded-[1.75rem] p-6 md:p-10 text-center shadow-inner">
                    <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-accent/20">
                        <Clock className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-serif font-black text-navy mb-2 tracking-tight">Closed</h3>
                    <p className="text-muted text-xs sm:text-sm mb-0 font-medium opacity-80">The deadline has passed.</p>
                </div>
            ) : (
                <div className="space-y-5 md:space-y-6">
                    <div className="border-4 border-dashed border-slate-100 rounded-[1.75rem] p-8 md:p-12 text-center hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-500 cursor-pointer relative group flex flex-col items-center bg-surface/50 shadow-inner">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-premium border border-border/10">
                            <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-primary group-hover:text-primary/70 transition-colors" />
                        </div>
                        <p className="font-black text-navy mb-1.5 text-base sm:text-lg tracking-tight px-4 transition-colors group-hover:text-primary">
                            {file ? file.name : 'Upload Document'}
                        </p>
                        <p className="text-[9px] text-muted uppercase tracking-widest font-black opacity-40">MAX 50MB</p>
                        <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            disabled={uploading}
                        />
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full bg-navy hover:bg-primary text-white font-black py-3 sm:py-4 rounded-xl md:rounded-2xl transition-all shadow-xl hover:shadow-primary/30 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed group/btn min-h-[50px] text-base uppercase tracking-widest"
                    >
                        {uploading ? (
                            <Clock className="w-5 h-5 animate-spin" />
                        ) : (
                            <Upload className="w-5 h-5 group-hover/btn:-translate-y-1 transition-transform" />
                        )}
                        Submit
                    </button>
                </div>
            )}
        </div>
    );
}
