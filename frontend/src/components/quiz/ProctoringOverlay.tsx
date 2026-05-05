import React, { useEffect, useState } from 'react';
import { useQuizStore } from '../../store/quizStore';
import { AlertOctagon, TerminalSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AIProctor from './AIProctor';

interface Props {
    isProctored: boolean;
    onAutoSubmit: () => void;
}

export default function ProctoringOverlay({ isProctored, onAutoSubmit }: Props) {
    const { tabSwitchCount, incrementTabSwitch, isTerminated, terminateQuiz } = useQuizStore();
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const navigate = useNavigate();
    const lastSwitchTime = React.useRef(0);

    const triggerTabSwitch = () => {
        const now = Date.now();
        if (now - lastSwitchTime.current < 1500) return;
        lastSwitchTime.current = now;

        incrementTabSwitch();
        setShowWarning(true);
        setCountdown(5);
    };

    useEffect(() => {
        if (!isProctored || isTerminated) return;

        const handleVisibilityChange = () => {
            if (document.hidden) triggerTabSwitch();
        };

        const handleBlur = () => {
            // Small timeout to prevent false positives when clicking inside iframe/etc
            setTimeout(() => {
                if (!document.hasFocus()) triggerTabSwitch();
            }, 100);
        };

        // Delay listener registration so route-navigation blur doesn't trigger false violations
        const mountDelay = setTimeout(() => {
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('blur', handleBlur);
        }, 2000);

        return () => {
            clearTimeout(mountDelay);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [isProctored, isTerminated, incrementTabSwitch]);

    useEffect(() => {
        if (showWarning && countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }

        if (showWarning && countdown === 0) {
            setShowWarning(false);

            // Check for termination
            if (tabSwitchCount >= 3) {
                terminateQuiz();
            }
        }
    }, [showWarning, countdown, tabSwitchCount, terminateQuiz]);

    useEffect(() => {
        if (isTerminated) {
            onAutoSubmit();
            const timer = setTimeout(() => {
                // Redirection handled by parent or just stays in terminated state until submitted
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isTerminated, onAutoSubmit]);

    if (!isProctored) return null;

    return (
        <>
            <AIProctor onViolation={triggerTabSwitch} />
            
            {isTerminated && (
                <div className="fixed inset-0 z-[100] bg-black text-green-500 font-mono flex flex-col items-center justify-center p-8">
                    <TerminalSquare className="w-16 h-16 mb-6 animate-pulse" />
                    <h1 className="text-2xl font-bold mb-4">SYSTEM TERMINATED</h1>
                    <p className="text-lg opacity-80 mb-2">{'>'} Maximum navigation violations exceeded.</p>
                    <p className="text-lg opacity-80 mb-8">{'>'} Auto-submitting current responses...</p>
                    <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 animate-[pulse_1s_ease-in-out_infinite]" style={{ width: '100%' }} />
                    </div>
                </div>
            )}

            {showWarning && !isTerminated && (
                <div className="fixed inset-0 z-[100] bg-accent/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-white select-none">
                    <AlertOctagon className="w-24 h-24 mb-8 animate-bounce" />
                    <h1 className="text-4xl font-serif font-bold mb-4 text-center">Navigation Violation Detected</h1>
                    <p className="text-xl mb-8 font-medium">
                        Warning {tabSwitchCount} of 3. You must remain on this tab.
                    </p>

                    <div className="w-80 h-3 bg-white/20 rounded-full overflow-hidden mb-4">
                        <div
                            className="h-full bg-white transition-all duration-1000 ease-linear"
                            style={{ width: `${(countdown / 5) * 100}%` }}
                        />
                    </div>
                    <p className="text-sm font-bold tracking-widest uppercase">Returning to exam in {countdown}s</p>
                </div>
            )}
        </>
    );
}
