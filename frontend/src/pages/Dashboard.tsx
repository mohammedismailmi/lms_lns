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
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-serif font-bold text-navy mb-2">Platform Dashboard</h1>
                <p className="text-slate-500 font-medium tracking-wide">Welcome back, {user?.name}. Here's what's happening across your platform.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Upcoming Events */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-serif font-bold text-navy flex items-center gap-2">
                                <Video className="w-5 h-5 text-highlight" />
                                Upcoming Scheduled Events
                            </h2>
                        </div>

                        {loading ? (
                            <div className="py-8 text-center text-muted font-serif italic animate-pulse">
                                Loading events...
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-12">
                                <CalendarIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="font-serif text-lg text-navy">No upcoming sessions scheduled</p>
                                <p className="text-sm mt-1 text-muted">Sessions you schedule will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sessions.map((event) => {
                                    const dt = event.date_time ? formatEventDate(event.date_time) : null;
                                    return (
                                        <div key={event.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-border hover:border-slate-300 hover:shadow-md transition-all bg-surface">
                                            <div className="flex gap-4 items-start">
                                                {dt && (
                                                    <div className="bg-white border border-border rounded-lg p-3 flex flex-col items-center justify-center min-w-[70px] shadow-sm">
                                                        <span className="text-xs font-bold text-muted uppercase tracking-wider">{dt.month}</span>
                                                        <span className="text-xl font-bold text-navy">{dt.day}</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-navy text-lg">{event.title}</h3>
                                                    {dt && (
                                                        <div className="flex items-center gap-4 text-sm text-muted mt-2 font-medium">
                                                            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {dt.time}</span>
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
