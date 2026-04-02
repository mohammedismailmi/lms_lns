import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

export default function WelcomeBanner() {
    const { user } = useAuthStore();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const getRoleBadgeInfo = () => {
        if (user?.role === 'admin') {
            return {
                text: 'Platform Administrator — Full Access',
                classes: 'border-accent text-accent',
            };
        }
        if (user?.role === 'instructor') {
            return {
                text: 'Instructor',
                classes: 'border-primary text-primary',
            };
        }
        return {
            text: 'Learner',
            classes: 'border-success text-success',
        };
    };

    const roleInfo = getRoleBadgeInfo();
    const firstName = user?.name.split(' ')[0] || 'User';

    return (
        <div className="bg-white rounded-3xl p-6 shadow-premium border border-border/40 relative overflow-hidden flex justify-between items-center gap-6 bg-[radial-gradient(circle_at_top_right,_#1b3a6b05,_transparent)]">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #0F2040 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

            <div className="relative z-10 flex-1 space-y-2 text-left">
                <h2 className="text-xl sm:text-2xl font-serif font-black text-navy tracking-tight">
                    {getGreeting()}, {firstName}.
                </h2>

                <div className="inline-block mt-1">
                    <span className={cn('px-2.5 py-0.5 font-black text-[9px] uppercase tracking-widest rounded-full border-2 bg-white shadow-sm', roleInfo.classes)}>
                        {roleInfo.text}
                    </span>
                </div>
            </div>
        </div>
    );
}
