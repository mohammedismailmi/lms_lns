import React, { useRef, useState, useEffect } from 'react';
import { VideoActivity as VideoType } from '../../lib/mockData';
import { useProgressStore } from '../../store/progressStore';
import { PlayCircle, ShieldAlert } from 'lucide-react';

interface Props {
    activity: VideoType;
}

export default function VideoActivity({ activity }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { updateVideoProgress, markDone, videoProgress, activityStatus } = useProgressStore();

    const [furthestWatched, setFurthestWatched] = useState(0);
    const [percent, setPercent] = useState(videoProgress[activity.id] || 0);
    const [warning, setWarning] = useState('');

    const isCompleted = activityStatus[activity.id] === 'completed';

    // Restore furthestWatched strictly visually from store on mount if we want to, 
    // but standard requirement is tracking the local session or hydrating from backend.
    // We'll trust the store's percent to set initial.
    useEffect(() => {
        if (activity.durationSeconds > 0) {
            setFurthestWatched((percent / 100) * activity.durationSeconds);
        }
    }, []);

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const current = videoRef.current.currentTime;

        // Only update deepest if we are actually progressing linearly
        if (current > furthestWatched && current - furthestWatched < 2) {
            const newFurthest = current;
            setFurthestWatched(newFurthest);

            const newPercent = Math.min(100, Math.round((newFurthest / activity.durationSeconds) * 100));
            setPercent(newPercent);
            updateVideoProgress(activity.id, newPercent);

            if (newPercent >= 80 && !isCompleted) {
                markDone(activity.id);
            }
        }
    };

    const handleSeeking = () => {
        if (!videoRef.current) return;
        if (videoRef.current.currentTime > furthestWatched) {
            videoRef.current.currentTime = furthestWatched;
            setWarning('Skipping forward is disabled for this module.');
            setTimeout(() => setWarning(''), 3000);
        }
    };

    const handleRateChange = () => {
        if (!videoRef.current) return;
        if (videoRef.current.playbackRate !== 1) {
            videoRef.current.playbackRate = 1;
            setWarning('Playback speed must remain at 1x.');
            setTimeout(() => setWarning(''), 3000);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-border p-6 relative" id={`activity-${activity.id}`}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-navy rounded-lg text-white">
                    <PlayCircle className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-navy">{activity.title}</h2>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-800 shadow-inner">
                {warning && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-accent/90 backdrop-blur text-white px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-4">
                        <ShieldAlert className="w-4 h-4" />
                        {warning}
                    </div>
                )}

                <video
                    ref={videoRef}
                    src={activity.videoUrl}
                    controls
                    controlsList="nodownload"
                    onTimeUpdate={handleTimeUpdate}
                    onSeeking={handleSeeking}
                    onRateChange={handleRateChange}
                    className="w-full h-full object-contain"
                >
                    Your browser does not support the video tag.
                </video>
            </div>

            <div className="mt-6 px-4">
                <div className="flex justify-between text-sm font-bold text-navy mb-2">
                    <span>{percent}% watched</span>
                    {isCompleted ? (
                        <span className="text-success">Requirement Met ✓</span>
                    ) : (
                        <span className="text-muted">Need 80% to mark complete</span>
                    )}
                </div>

                <div className="w-full h-2.5 bg-border rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300 ease-linear"
                        style={{ width: `${percent}%` }}
                    />
                </div>

                {/* Visual threshold marker for the 80% mark */}
                <div className="relative w-full">
                    <div className="absolute top-[-10px] w-0.5 h-3 bg-accent" style={{ left: '80%' }} />
                </div>
            </div>
        </div>
    );
}
