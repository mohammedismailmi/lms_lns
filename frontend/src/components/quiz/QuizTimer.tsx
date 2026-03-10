import React, { useEffect } from 'react';
import { useQuizStore } from '../../store/quizStore';
import { Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
    onTimeUp: () => void;
}

export default function QuizTimer({ onTimeUp }: Props) {
    const { timeRemaining, tickTimer, isTerminated } = useQuizStore();

    useEffect(() => {
        if (isTerminated || timeRemaining <= 0) return;

        const interval = setInterval(() => {
            tickTimer();
        }, 1000);

        return () => clearInterval(interval);
    }, [isTerminated, timeRemaining, tickTimer]);

    useEffect(() => {
        if (timeRemaining === 0 && !isTerminated) {
            onTimeUp();
        }
    }, [timeRemaining, isTerminated, onTimeUp]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isUrgent = timeRemaining > 0 && timeRemaining <= 300; // < 5 mins

    return (
        <div className={cn(
            "px-6 py-4 rounded-xl border flex items-center justify-center gap-3 shadow-sm",
            isUrgent
                ? "bg-accent/10 border-accent/30 text-accent animate-[pulse_2s_ease-in-out_infinite]"
                : "bg-surface border-border text-navy"
        )}>
            <Clock className={cn("w-6 h-6", isUrgent ? "text-accent" : "text-primary")} />
            <span className="font-serif text-3xl font-bold tracking-wider relative top-[1px]">
                {formatTime(timeRemaining)}
            </span>
        </div>
    );
}
