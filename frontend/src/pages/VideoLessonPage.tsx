import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseStore } from '../store/courseStore';
import { useProgressStore } from '../store/progressStore';
import { Play, Pause, Volume2, VolumeX, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Course, Activity } from '../lib/mockData';
import { cn } from '../lib/utils';
import { useToast } from '../lib/useToast';

export default function VideoLessonPage() {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { coursesList } = useCourseStore();
    const { markDone, activityStatus } = useProgressStore();

    let course: Course | null = null;
    let activity: Activity | null = null;
    let moduleOrder = 0;

    for (const c of coursesList) {
        for (const m of c.modules) {
            const a = m.activities.find(x => x.id === activityId);
            if (a && a.type === 'video') {
                activity = a;
                course = c;
                moduleOrder = m.order;
                break;
            }
        }
        if (activity) break;
    }

    const isInitiallyCompleted = activityStatus[activityId!] === 'completed';
    const [isCompleted, setIsCompleted] = useState(isInitiallyCompleted);

    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0); // 0 to 100
    const [isMuted, setIsMuted] = useState(false);

    // Prevent seeking forward memory block
    const [maxProgressReached, setMaxProgressReached] = useState(0);

    // Provide a valid dummy video so native events fire (e.g. big buck bunny generic)
    const MOCK_VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4";

    useEffect(() => {
        if (!videoRef.current) return;
        videoRef.current.playbackRate = 1.0; // Strictly enforce 1x
    }, []);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current || !activity) return;
        const current = videoRef.current.currentTime;
        const total = videoRef.current.duration;

        if (!total) return;

        const currentProgress = (current / total) * 100;

        // Prevent native or JS seeking forward if constraints bypass UI
        if (currentProgress > maxProgressReached + 5) { // 5% buffer for streaming skips
            videoRef.current.currentTime = (maxProgressReached / 100) * total;
            // Notify user
            toast.info("Fast forwarding is disabled for this lecture.");
            return;
        }

        setProgress(currentProgress);
        if (currentProgress > maxProgressReached) {
            setMaxProgressReached(currentProgress);
        }

        // 80% completion requirement
        if (currentProgress >= 80 && !isCompleted) {
            markDone(activity.id);
            setIsCompleted(true);
            toast.success("Lecture requirements met! Marked as complete.");
        }
    };

    // Timeline scrubbing logic - only backwards allowed
    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;

        if (percent * 100 > maxProgressReached) {
            toast.info("Seeking forward is disabled.");
            return;
        }

        videoRef.current.currentTime = percent * videoRef.current.duration;
        setProgress(percent * 100);
    };

    if (!activity || !course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <p className="text-xl font-serif text-accent font-bold mb-4">Lesson component not found.</p>
                <button onClick={() => navigate(-1)} className="text-primary hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen bg-navy flex flex-col">
            {/* Header Overlay */}
            <div className="bg-navy border-b border-slate-800 z-20 shrink-0 px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/course/${course?.id}`)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Module {moduleOrder} · Video Lecture</p>
                        <h1 className="font-serif font-bold text-lg leading-tight truncate max-w-lg">{activity.title}</h1>
                    </div>
                </div>

                {isCompleted ? (
                    <span className="flex items-center gap-2 text-success font-bold text-sm bg-success/10 px-3 py-1.5 rounded-lg border border-success/20">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                    </span>
                ) : (
                    <span className="flex items-center gap-2 text-slate-300 font-bold text-sm bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                        Watch 80% to complete
                    </span>
                )}
            </div>

            {/* Video Canvas */}
            <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                <video
                    ref={videoRef}
                    className="w-full h-full object-contain pointer-events-none"
                    src={activity.videoUrl || MOCK_VIDEO_URL}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    controls={false} // completely disable native controls
                />

                {/* Big center play button when paused */}
                {!isPlaying && (
                    <button
                        onClick={togglePlay}
                        className="absolute w-20 h-20 bg-primary/90 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl backdrop-blur-md border-2 border-white/20 pl-2"
                    >
                        <Play className="w-8 h-8" />
                    </button>
                )}
            </div>

            {/* Custom Control Bar */}
            <div className="bg-navy shrink-0 px-6 py-4 border-t border-slate-800 text-white select-none">

                {/* Custom Timeline */}
                <div
                    className="h-2.5 bg-slate-800 rounded-full mb-6 cursor-pointer relative overflow-hidden group border border-slate-700"
                    onClick={handleTimelineClick}
                >
                    <div
                        className="absolute left-0 top-0 bottom-0 bg-slate-600 transition-all pointer-events-none"
                        style={{ width: `${maxProgressReached}%` }}
                    />
                    <div
                        className="absolute left-0 top-0 bottom-0 bg-primary transition-all pointer-events-none flex items-center justify-end"
                        style={{ width: `${progress}%` }}
                    >
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={togglePlay} className="hover:text-primary transition-colors">
                            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
                        </button>

                        <div className="flex items-center gap-4 border-l border-slate-700 pl-6">
                            <button onClick={toggleMute} className="hover:text-primary transition-colors">
                                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-800 px-2 py-1 rounded">1.0x Speed</span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate(`/course/${course?.id}`)}
                        className="px-5 py-2 font-bold text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
                    >
                        Return to Course
                    </button>
                </div>
            </div>
        </div>
    );
}
