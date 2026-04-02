import React, { useState, useEffect } from 'react';
import { Clock, Users, Video, Calendar as CalendarIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import CalendarWidget from '../components/calendar/CalendarWidget';
import api from '../lib/api';

import './Dashboard.css';

interface UpcomingSession {
    id: string;
    title: string;
    date_time?: number;
    event_date?: string;
    description?: string;
    event_type?: string;
    type?: string;
}

export default function Dashboard() {
    const { user } = useAuthStore();
    const [sessions, setSessions] = useState<UpcomingSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/user-events')
            .then(res => {
                if (res.data.success && res.data.events) {
                    // Show only future events, limit to 5
                    const now = Math.floor(Date.now() / 1000);
                    const upcoming = res.data.events
                        .filter((e: any) => e.date_time > now)
                        .slice(0, 5);
                    setSessions(upcoming);
                }
            })
            .catch(() => setSessions([]))
            .finally(() => setLoading(false));
    }, []);

    const formatEventDate = (ts: number) => {
        const d = new Date(ts * 1000);
        return {
            month: d.toLocaleDateString([], { month: 'short' }).toUpperCase(),
            day: d.getDate().toString(),
            time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
    };

    return (
        <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-xl sm:text-2xl font-serif font-black text-navy mb-1 tracking-tight">Platform Dashboard</h1>
                <p className="text-slate-500 text-xs font-semibold tracking-wide opacity-80">Welcome back, {user?.name}. Global status overview matrix.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1: Upcoming Events */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="bg-white rounded-3xl shadow-premium border border-border/40 p-5 sm:p-6 bg-[radial-gradient(circle_at_top_right,_#1b3a6b05,_transparent)]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-serif font-black text-navy flex items-center gap-2 tracking-tight">
                                <Video className="w-4.5 h-4.5 text-highlight" />
                                Upcoming Scheduled Events
                            </h2>
                        </div>

                        {loading ? (
                            <div className="py-6 text-center text-muted font-serif italic animate-pulse text-xs">
                                Initializing events matrix...
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-10 opacity-70">
                                <CalendarIcon className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                                <p className="font-serif text-base text-navy font-bold">No upcoming sessions scheduled</p>
                                <p className="text-[10px] mt-0.5 text-muted">Sessions you schedule will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sessions.map((event) => {
                                    const dt = event.date_time ? formatEventDate(event.date_time) : null;
                                    return (
                                        <div key={event.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 rounded-xl border border-border/40 hover:border-primary/20 hover:shadow-md transition-all bg-surface/50 group">
                                            <div className="flex gap-3.5 items-start">
                                                {dt && (
                                                    <div className="bg-white border border-border/40 rounded-lg p-2.5 flex flex-col items-center justify-center min-w-[64px] shadow-sm">
                                                        <span className="text-[9px] font-black text-muted uppercase tracking-widest">{dt.month}</span>
                                                        <span className="text-lg font-serif font-black text-navy">{dt.day}</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h3 className="font-black text-navy text-sm tracking-tight group-hover:text-primary transition-colors">{event.title}</h3>
                                                        {event.type && (
                                                            <span className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${
                                                                event.type === 'submission' ? 'bg-red-50 text-red-500 border border-red-100' :
                                                                (event.type === 'quiz' || event.type === 'exam') ? 'bg-orange-50 text-orange-500 border border-orange-100' :
                                                                event.type === 'live_class' ? 'bg-blue-50 text-blue-500 border border-blue-100' :
                                                                'bg-slate-50 text-slate-500 border border-slate-100'
                                                            }`}>
                                                                {event.type.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {dt && (
                                                        <div className="flex items-center gap-3.5 text-[10px] text-muted mt-1.5 font-bold">
                                                            <span className="flex items-center gap-1.5">
                                                                {event.type === 'live_class' ? <Video className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                                                {dt.time}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 2: Calendar */}
                <div className="space-y-6">
                    <CalendarWidget />
                </div>
            </div>
        </div>
    );
}
