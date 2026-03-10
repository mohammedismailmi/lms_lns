import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';

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
        <div className="bg-card rounded-2xl p-8 shadow-sm border border-border relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Subtle paper dot texture pseudo-element could be added via standard CSS, mock it with minimal generic radial gradient logic here */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #0F2040 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

            <div className="relative z-10 flex-1 space-y-3 text-center md:text-left">
                <h2 className="text-4xl font-serif font-bold text-navy">
                    {getGreeting()}, {firstName}.
                </h2>

                <div className="inline-block mt-2">
                    <span className={cn('px-3 py-1 font-semibold text-xs uppercase tracking-wide rounded-full border-2 bg-white', roleInfo.classes)}>
                        {roleInfo.text}
                    </span>
                </div>
            </div>

            <div className="relative z-10 flex gap-4 w-full md:w-auto">
                <StatCard icon={<BookOpen className="w-5 h-5 text-primary" />} label="Enrolled" value="6" />
                <StatCard icon={<Clock className="w-5 h-5 text-highlight" />} label="In Progress" value="2" />
                <StatCard icon={<CheckCircle className="w-5 h-5 text-success" />} label="Completed" value="0" />
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
    return (
        <div className="bg-white px-6 py-4 rounded-xl border border-border flex items-center gap-4 shadow-sm flex-1 md:flex-none">
            <div className="p-3 bg-surface rounded-lg border border-slate-100">
                {icon}
            </div>
            <div>
                <p className="text-2xl font-bold font-serif text-navy leading-none mb-1">{value}</p>
                <p className="text-xs text-muted font-medium uppercase tracking-wider">{label}</p>
            </div>
        </div>
    );
}
