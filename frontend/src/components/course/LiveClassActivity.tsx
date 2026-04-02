import React, { useState } from 'react';
import { LiveClassActivity as LiveType } from '../../lib/mockData';
import { useAuthStore } from '../../store/authStore';
import { useProgressStore } from '../../store/progressStore';
import { Video, Calendar, Clock, Download, Upload, ExternalLink, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../lib/api';

interface Props {
    activity: any;
    courseFaculty?: string;
}

export default function LiveClassActivity({ activity, courseFaculty }: Props) {
    const { user } = useAuthStore();
    const { markDone, activityStatus } = useProgressStore();

    const [meetLink, setMeetLink] = useState(activity.meetLink);
    const [transcript, setTranscript] = useState(activity.transcriptUrl);

    const isCompleted = activityStatus[activity.id] === 'completed';
    const isInstructor = user?.role === 'admin' || user?.role === 'instructor';

    const scheduledAtStr = activity.scheduledAt || activity.scheduled_at;
    const scheduledTime = scheduledAtStr ? new Date(scheduledAtStr) : new Date();
    const now = new Date();
    const isLive = scheduledAtStr ? (now >= new Date(scheduledTime.getTime() - 15 * 60000)) : false;
    const isPast = (scheduledAtStr && activity.durationMinutes) ? (now >= new Date(scheduledTime.getTime() + activity.durationMinutes * 60000)) : false;

    const [loading, setLoading] = useState(false);

    const handleStartClass = async () => {
        setLoading(true);
        try {
            const res = await api.post('/api/live-sessions/create', { activityId: activity.id });
            if (res.data.success && res.data.session) {
                setMeetLink(res.data.session.meet_link);
            }
        } catch (err) {
            console.error('Failed to create live session:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClass = () => {
        if (meetLink) {
            markDone(activity.id);
            window.open(meetLink, '_blank');
        }
    };

    const handleUploadTranscript = () => {
        // Mock upload
        setTimeout(() => {
            setTranscript('/mock-transcript.pdf');
        }, 1000);
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-premium border border-border/40 overflow-hidden hover:shadow-2xl transition-all duration-500 group/live" id={`activity-${activity.id}`}>
            {/* Header Banner */}
            <div className={cn(
                "px-8 py-6 md:py-8 flex items-center gap-4 text-white relative overflow-hidden",
                isLive && !isPast ? "bg-gradient-to-r from-accent to-red-600" : "bg-gradient-to-r from-navy to-slate-800"
            )}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg shrink-0 group-hover/live:rotate-3 transition-transform">
                    <Video className="w-8 h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-black truncate flex-1 tracking-tight z-10">{activity.title}</h2>
                {isLive && !isPast && (
                    <span className="bg-white text-accent px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest animate-pulse shadow-xl z-10 border border-white">
                        LIVE NOW
                    </span>
                )}
            </div>

            <div className="p-8 md:p-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:items-center justify-between mb-10">
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-4 text-ink">
                            <div className="p-2 bg-slate-50 rounded-xl border border-border/50">
                                <Calendar className="w-6 h-6 text-primary" />
                            </div>
                            <span className="font-black text-lg text-navy tracking-tight">{scheduledTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-4 text-ink">
                            <div className="p-2 bg-slate-50 rounded-xl border border-border/50">
                                <Clock className="w-6 h-6 text-primary" />
                            </div>
                            <span className="font-black text-lg text-navy tracking-tight">
                                {scheduledTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                <span className="text-muted text-sm ml-3 opacity-60 font-medium">({activity.durationMinutes} minutes session)</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-ink">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-navy to-slate-700 text-white flex items-center justify-center font-black text-sm shadow-md border border-white/10">
                                {(activity.instructorName || courseFaculty || 'U').charAt(0)}
                            </div>
                            <span className="font-bold text-muted text-lg">Lead Instructor: <span className="text-navy font-black tracking-tight">{activity.instructorName || courseFaculty || 'Unassigned Faculty'}</span></span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center items-start lg:items-end gap-4 min-w-[280px]">
                        {isInstructor ? (
                            <button
                                onClick={meetLink ? handleJoinClass : handleStartClass}
                                disabled={loading}
                                className="w-full bg-navy hover:bg-primary text-white px-8 py-5 rounded-2xl font-black transition-all shadow-xl hover:shadow-primary/30 flex justify-center items-center gap-3 disabled:opacity-50 text-lg group/call"
                            >
                                <ExternalLink className="w-6 h-6 group-hover/call:translate-x-1 group-hover/call:-translate-y-1 transition-transform" />
                                {loading ? 'Provisioning...' : (meetLink ? 'Resume Session' : 'Activate Live Stream')}
                            </button>
                        ) : (
                            <button
                                onClick={handleJoinClass}
                                disabled={!isLive || !meetLink || isPast}
                                className="w-full disabled:bg-slate-100 disabled:text-muted disabled:cursor-not-allowed bg-highlight hover:bg-yellow-500 text-navy px-8 py-5 rounded-2xl font-black transition-all shadow-xl hover:shadow-highlight/30 flex items-center justify-center gap-3 text-lg group/join"
                            >
                                <ExternalLink className="w-6 h-6 group-hover/join:translate-x-1 group-hover/join:-translate-y-1 transition-transform" />
                                Participate in Class
                            </button>
                        )}

                        {meetLink && isInstructor && (
                            <p className="text-[10px] text-muted font-black uppercase tracking-widest opacity-40 select-all">{meetLink}</p>
                        )}
                    </div>
                </div>

                {/* Post-Class Actions */}
                {(isPast || transcript) && (
                    <div className="pt-10 border-t border-border/40 mt-4">
                        <h4 className="text-xs font-black text-navy uppercase tracking-[0.2em] mb-6 opacity-40">Session Archive & Resources</h4>

                        {transcript ? (
                            <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-surface rounded-[2rem] border border-border/60 shadow-inner group-hover/live:border-primary/20 transition-colors gap-6">
                                <div className="flex gap-4 items-center w-full sm:w-auto">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                                        <FileText className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-black text-navy text-lg tracking-tight">Session Transcript & Insights</p>
                                        <p className="text-xs text-muted font-bold opacity-60 uppercase tracking-widest">Digital Resource • Archive</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => window.open(transcript, '_blank')}
                                    className="w-full sm:w-auto text-navy bg-white hover:bg-slate-50 border border-border/60 px-6 py-3 rounded-xl font-black text-sm flex gap-2 items-center justify-center shadow-sm transition-all hover:shadow-md"
                                >
                                    <Download className="w-5 h-5" /> Download PDF
                                </button>
                            </div>
                        ) : isInstructor ? (
                            <button
                                onClick={handleUploadTranscript}
                                className="w-full border-4 border-dashed border-slate-100 hover:border-primary/30 text-muted hover:text-primary rounded-[2rem] py-10 flex flex-col items-center justify-center gap-3 transition-all bg-surface/50 hover:bg-primary/[0.02]"
                            >
                                <Upload className="w-8 h-8 opacity-40" />
                                <span className="font-black text-base tracking-tight uppercase opacity-60">Upload Session Transcript</span>
                            </button>
                        ) : (
                            <div className="p-8 text-center bg-slate-50 rounded-[2rem] border border-border/40">
                                <p className="text-base text-muted italic font-medium opacity-60">Digital transcript and session materials are being processed and will be available shortly.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
