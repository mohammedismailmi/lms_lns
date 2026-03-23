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
            <div className="bg-white rounded-xl shadow-sm border border-border p-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary rounded-lg text-white">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-navy">{activity.title} (Instructor)</h2>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                        <div>
                            <p className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Assignment Deadline</p>
                            <p className="text-sm font-bold text-navy flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                {activity.dueAt ? new Date(activity.dueAt).toLocaleString() : 'No deadline'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Total Submissions</p>
                            <p className="text-lg font-bold text-primary">{submissions.length}</p>
                        </div>
                    </div>

                    <h3 className="font-bold text-navy uppercase text-xs tracking-widest">Student Submissions</h3>
                    {loadingSubmissions ? (
                        <div className="py-12 text-center text-muted animate-pulse">Loading submissions...</div>
                    ) : submissions.length === 0 ? (
                        <div className="py-12 text-center text-muted font-serif italic border-2 border-dashed border-slate-100 rounded-xl">No submissions yet.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {submissions.map(sub => (
                                <div key={sub.id} className="py-4 flex items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-navy">{sub.studentName}</p>
                                            {sub.isLate === 1 && (
                                                <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-bold uppercase rounded-full border border-accent/20">LATE</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted">Submitted on {new Date(sub.submittedAt).toLocaleString()}</p>
                                        <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-bold mt-1 inline-block">Download Submission</a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {sub.grade ? (
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-success">Grade: {sub.grade}</p>
                                                <p className="text-[10px] text-muted italic">"{sub.feedback}"</p>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input id={`grade-${sub.id}`} placeholder="Grade" className="w-16 px-2 py-1 text-sm border border-border rounded-lg" />
                                                <button onClick={() => {
                                                    const grade = (document.getElementById(`grade-${sub.id}`) as HTMLInputElement).value;
                                                    handleGrade(sub.id, grade, 'Graded by system.');
                                                }} className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg transition-colors hover:bg-navy">Grade</button>
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
        <div className="bg-white rounded-xl shadow-sm border border-border p-6" id={`activity-${activity.id}`}>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-lg text-white">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-navy">{activity.title}</h2>
                </div>
                {activity.dueAt && (
                    <div className={`px-4 py-2 rounded-xl border flex flex-col items-end ${isPastDue ? 'bg-accent/5 border-accent/20' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Deadline</span>
                        <span className={`text-sm font-bold ${isPastDue ? 'text-accent' : 'text-navy'}`}>
                            {new Date(activity.dueAt).toLocaleString()}
                        </span>
                    </div>
                )}
            </div>

            <div className="bg-surface rounded-xl p-6 border border-slate-200 mb-6">
                <h3 className="font-bold text-navy mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    Instructions
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                    {activity.content || 'Please upload your completed assignment file (PDF, DOCX, or ZIP). Ensure all requirements mentioned in the module are met before submission.'}
                </p>
            </div>

            {submitted || mySubmission ? (
                <div className="bg-success/5 border border-success/20 rounded-xl p-8 text-center animate-in zoom-in-95">
                    <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-navy mb-2">Assignment Submitted</h3>
                    <p className="text-muted text-sm mb-6">
                        Submitted: {new Date(mySubmission?.submittedAt || Date.now()).toLocaleString()}
                        {mySubmission?.dueAt && new Date(mySubmission.submittedAt) > new Date(mySubmission.dueAt) && (
                            <span className="text-accent font-bold ml-2">(Late)</span>
                        )}
                    </p>
                    
                    {mySubmission?.grade ? (
                        <div className="bg-white p-4 rounded-xl border border-success/20 shadow-sm inline-block">
                            <p className="text-xs text-muted uppercase tracking-widest font-bold mb-1">Your Grade</p>
                            <p className="text-2xl font-serif font-bold text-success capitalize">{mySubmission.grade}</p>
                            {mySubmission.feedback && <p className="text-sm text-muted italic mt-2">"{mySubmission.feedback}"</p>}
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-success/30 rounded-full text-success text-xs font-bold uppercase tracking-widest">
                            Status: Pending Review
                        </div>
                    )}
                </div>
            ) : isPastDue ? (
                <div className="bg-accent/5 border border-accent/20 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-navy mb-2">Deadline Passed</h3>
                    <p className="text-muted text-sm mb-0">The submission window for this assignment has closed.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer relative group">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-muted group-hover:text-primary" />
                        </div>
                        <p className="font-bold text-navy mb-1">
                            {file ? file.name : 'Click or drag file to upload'}
                        </p>
                        <p className="text-xs text-muted uppercase tracking-widest font-medium">PDF, DOCX, ZIP (MAX 50MB)</p>
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
                        className="w-full bg-primary hover:bg-navy text-white font-bold py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {uploading ? (
                            <Clock className="w-5 h-5 animate-spin" />
                        ) : (
                            <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                        )}
                        Submit Assignment
                    </button>
                </div>
            )}
        </div>
    );
}
