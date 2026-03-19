import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import api from '../../lib/api';

interface UserEvent {
    id: string;
    title: string;
    date_time: number;
}

export default function CalendarWidget() {
    const [events, setEvents] = useState<UserEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/api/user-events');
            if (res.data.success) setEvents(res.data.events);
        } catch(err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEvents(); }, []);

    const handleAddEvent = async () => {
        const title = prompt('Event Title:');
        if (!title) return;
        const dateStr = prompt('Date and Time (YYYY-MM-DD HH:mm):');
        if (!dateStr) return;
        
        const dt = new Date(dateStr);
        if (isNaN(dt.getTime())) {
            alert('Invalid date format.');
            return;
        }

        try {
            await api.post('/api/user-events', { title, dateTime: Math.floor(dt.getTime() / 1000) });
            fetchEvents();
        } catch(err) {
            alert('Failed to add event');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete event?')) return;
        try {
            await api.delete(`/api/user-events/${id}`);
            fetchEvents();
        } catch(err) {
            alert('Failed to delete event');
        }
    };

    return (
        <section className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-2xl font-serif font-bold text-navy flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-primary" /> Personal Calendar
                </h2>
                <button
                    onClick={handleAddEvent}
                    className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 hover:text-navy px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Event
                </button>
            </div>
            <div className="p-6">
                {loading ? (
                    <p className="text-muted italic">Loading events...</p>
                ) : events.length === 0 ? (
                    <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-muted font-serif italic">No upcoming events. Your calendar is clear!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {events.map(ev => (
                            <div key={ev.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-xl group hover:border-primary/30 transition-colors">
                                <div>
                                    <h4 className="font-bold text-navy">{ev.title}</h4>
                                    <p className="text-sm text-muted font-medium mt-1">
                                        {new Date(ev.date_time * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(ev.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
