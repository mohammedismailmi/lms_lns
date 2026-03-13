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
        <div className="bg-card rounded-2xl p-8 shadow-sm border border-border relative overflow-hidden flex justify-between items-center gap-8">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #0F2040 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

            <div className="relative z-10 flex-1 space-y-3 text-left">
                <h2 className="text-4xl font-serif font-bold text-navy">
                    {getGreeting()}, {firstName}.
                </h2>

                <div className="inline-block mt-2">
                    <span className={cn('px-3 py-1 font-semibold text-xs uppercase tracking-wide rounded-full border-2 bg-white', roleInfo.classes)}>
                        {roleInfo.text}
                    </span>
                </div>
            </div>
        </div>
    );
}
