import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, X } from 'lucide-react';
import api from '../../lib/api';

interface UserEvent {
    id: string;
    title: string;
    date_time: number;
}

export default function CalendarWidget() {
    const [events, setEvents] = useState<UserEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDateTime, setNewDateTime] = useState('');
    const [addError, setAddError] = useState('');

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
        setAddError('');
        if (!newTitle.trim()) { setAddError('Title is required'); return; }
        if (!newDateTime) { setAddError('Date and time are required'); return; }

        const dt = new Date(newDateTime);
        if (isNaN(dt.getTime())) { setAddError('Invalid date format'); return; }

        try {
            await api.post('/api/user-events', { title: newTitle, dateTime: Math.floor(dt.getTime() / 1000) });
            setNewTitle('');
            setNewDateTime('');
            setShowAddModal(false);
            fetchEvents();
        } catch(err) {
            setAddError('Failed to add event');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/api/user-events/${id}`);
            fetchEvents();
        } catch(err) {
            console.error('Failed to delete event', err);
        }
    };

    return (
        <section className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-2xl font-serif font-bold text-navy flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-primary" /> Personal Calendar
                </h2>
                <button
                    onClick={() => setShowAddModal(true)}
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

            {/* Add Event Modal — replaces old prompt() */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
                            <h3 className="text-lg font-serif font-bold text-navy">Add Calendar Event</h3>
                            <button onClick={() => { setShowAddModal(false); setAddError(''); }} className="p-1 hover:bg-slate-200 rounded transition">
                                <X className="w-5 h-5 text-muted" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Event Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Study Group, Deadline"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleAddEvent()}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    value={newDateTime}
                                    onChange={e => setNewDateTime(e.target.value)}
                                    className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            {addError && <p className="text-red-600 text-sm font-bold">{addError}</p>}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setShowAddModal(false); setAddError(''); }}
                                    className="flex-1 px-4 py-2.5 border border-border rounded-lg font-bold text-muted hover:bg-surface transition">
                                    Cancel
                                </button>
                                <button onClick={handleAddEvent}
                                    className="flex-1 px-4 py-2.5 bg-primary hover:bg-navy text-white rounded-lg font-bold transition shadow-sm">
                                    Add Event
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
