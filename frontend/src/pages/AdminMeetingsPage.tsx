import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Loader2 } from 'lucide-react';
import api from '../lib/api';

interface MeetingEvent {
    id: string;
    title: string;
    date_time: number;
    created_at: number;
}

export default function AdminMeetingsPage() {
    const { user } = useAuthStore();
    const [events, setEvents] = useState<MeetingEvent[]>([]);
    const [loading, setLoading] = useState(true);

    if (user?.role !== 'admin' && user?.role !== 'instructor') return <Navigate to="/" replace />;

    useEffect(() => {
        api.get('/api/user-events')
            .then(res => {
                if (res.data.success) setEvents(res.data.events);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-4 sm:p-8 max-w-[1200px] mx-auto pb-24">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/admin" className="p-2 hover:bg-slate-100 rounded-lg transition">
                    <ArrowLeft className="w-5 h-5 text-navy" />
                </Link>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy">All Scheduled Meetings</h1>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-muted">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading meetings...
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-border">
                    <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="font-serif text-lg text-navy">No meetings scheduled</p>
                    <p className="text-sm text-muted mt-1">Meetings you schedule will appear here.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {events.map(ev => (
                        <div key={ev.id} className="bg-white rounded-xl border border-border p-5 flex items-center justify-between hover:shadow-sm transition">
                            <div>
                                <h3 className="font-bold text-navy text-lg">{ev.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-muted mt-1">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(ev.date_time * 1000).toLocaleDateString([], { dateStyle: 'medium' })}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {new Date(ev.date_time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                ev.date_time * 1000 > Date.now() ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                                {ev.date_time * 1000 > Date.now() ? 'Upcoming' : 'Past'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
