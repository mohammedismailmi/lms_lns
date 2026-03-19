import React, { useState } from 'react';
import { LiveClassActivity as LiveType } from '../../lib/mockData';
import { useAuthStore } from '../../store/authStore';
import { useProgressStore } from '../../store/progressStore';
import { Video, Calendar, Clock, Download, Upload, ExternalLink, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../lib/api';

interface Props {
    activity: LiveType;
}

export default function LiveClassActivity({ activity }: Props) {
    const { user } = useAuthStore();
    const { markDone, activityStatus } = useProgressStore();

    const [meetLink, setMeetLink] = useState(activity.meetLink);
    const [transcript, setTranscript] = useState(activity.transcriptUrl);

    const isCompleted = activityStatus[activity.id] === 'completed';
    const isInstructor = user?.role === 'admin' || user?.role === 'instructor';

    const scheduledTime = new Date(activity.scheduledAt);
    const now = new Date();
    const isLive = now >= new Date(scheduledTime.getTime() - 15 * 60000); // Activable 15 mins before
    const isPast = now >= new Date(scheduledTime.getTime() + activity.durationMinutes * 60000);

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
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden" id={`activity-${activity.id}`}>
            {/* Header Banner */}
            <div className={cn(
                "px-6 py-4 flex items-center gap-3 text-white",
                isLive && !isPast ? "bg-accent" : "bg-navy"
            )}>
                <Video className="w-6 h-6" />
                <h2 className="text-xl font-serif font-bold truncate flex-1">{activity.title}</h2>
                {isLive && !isPast && (
                    <span className="bg-white text-accent px-2 py-1 rounded text-xs font-bold uppercase tracking-wider animate-pulse shadow-sm">
                        Live Now
                    </span>
                )}
            </div>

            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3 text-ink">
                            <Calendar className="w-5 h-5 text-muted" />
                            <span className="font-medium">{scheduledTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-3 text-ink">
                            <Clock className="w-5 h-5 text-muted" />
                            <span className="font-medium">
                                {scheduledTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                <span className="text-muted text-sm ml-2">({activity.durationMinutes} mins)</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-ink">
                            <div className="w-5 h-5 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-[10px] text-muted">
                                {activity.instructorName.charAt(0)}
                            </div>
                            <span className="font-medium text-muted">Instructor: <span className="text-ink">{activity.instructorName}</span></span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center items-start md:items-end gap-3 min-w-[200px]">
                        {isInstructor ? (
                            <button
                                onClick={meetLink ? handleJoinClass : handleStartClass}
                                disabled={loading}
                                className="w-full bg-primary hover:bg-navy text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                <ExternalLink className="w-5 h-5" />
                                {loading ? 'Generating...' : (meetLink ? 'Rejoin Call' : 'Start & Generate Link')}
                            </button>
                        ) : (
                            <button
                                onClick={handleJoinClass}
                                disabled={!isLive || !meetLink || isPast}
                                className="w-full disabled:bg-slate-100 disabled:text-muted disabled:cursor-not-allowed bg-highlight hover:bg-yellow-600 text-navy px-6 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <ExternalLink className="w-5 h-5" />
                                Join Class
                            </button>
                        )}

                        {meetLink && isInstructor && (
                            <p className="text-xs text-muted font-mono">{meetLink}</p>
                        )}
                    </div>
                </div>

                {/* Post-Class Actions */}
                {(isPast || transcript) && (
                    <div className="pt-6 border-t border-border mt-2">
                        <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-4">Class Materials</h4>

                        {transcript ? (
                            <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border">
                                <div className="flex gap-3 items-center">
                                    <FileText className="w-6 h-6 text-primary" />
                                    <div>
                                        <p className="font-bold text-ink text-sm">Class Transcript & Notes</p>
                                        <p className="text-xs text-muted">PDF • Auto-generated</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => window.open(transcript, '_blank')}
                                    className="text-primary hover:text-navy font-bold text-sm flex gap-1 items-center"
                                >
                                    <Download className="w-4 h-4" /> Download
                                </button>
                            </div>
                        ) : isInstructor ? (
                            <button
                                onClick={handleUploadTranscript}
                                className="w-full border-2 border-dashed border-border hover:border-primary text-muted hover:text-primary rounded-xl py-6 flex flex-col items-center justify-center gap-2 transition-colors bg-slate-50"
                            >
                                <Upload className="w-6 h-6" />
                                <span className="font-medium text-sm">Upload Transcript for Students</span>
                            </button>
                        ) : (
                            <p className="text-sm text-muted italic">Transcript will be available shortly.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
