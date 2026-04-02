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
            <div className="p-4 border-b border-border flex justify-between items-center">
                <h2 className="text-lg font-serif font-bold text-navy flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" /> Personal Calendar
                </h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 hover:text-navy px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Event
                </button>
            </div>
            <div className="p-4">
                {loading ? (
                    <p className="text-xs text-muted italic">Loading events...</p>
                ) : events.length === 0 ? (
                    <div className="text-center py-6">
                        <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-muted font-serif italic">No upcoming events. Your calendar is clear!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {events.map(ev => (
                            <div key={ev.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:border-primary/30 transition-colors">
                                <div>
                                    <h4 className="font-bold text-navy text-xs">{ev.title}</h4>
                                    <p className="text-[10px] text-muted font-medium mt-0.5">
                                        {new Date(ev.date_time * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(ev.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Event Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface">
                            <h3 className="text-base font-serif font-bold text-navy">Add Calendar Event</h3>
                            <button onClick={() => { setShowAddModal(false); setAddError(''); }} className="p-1 hover:bg-slate-200 rounded transition group">
                                <X className="w-4 h-4 text-muted group-hover:text-navy transition-colors" />
                            </button>
                        </div>
                        <div className="p-5 space-y-3.5">
                            <div>
                                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Event Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Study Group, Deadline"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    className="w-full border border-border rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface shadow-inner"
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleAddEvent()}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    value={newDateTime}
                                    onChange={e => setNewDateTime(e.target.value)}
                                    className="w-full border border-border rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface shadow-inner"
                                />
                            </div>
                            {addError && <p className="text-red-600 text-[10px] font-bold">{addError}</p>}
                            <div className="flex gap-2.5 pt-1.5">
                                <button type="button" onClick={() => { setShowAddModal(false); setAddError(''); }}
                                    className="flex-1 px-4 py-2 border border-border rounded-lg font-bold text-muted hover:bg-surface transition text-xs">
                                    Cancel
                                </button>
                                <button onClick={handleAddEvent}
                                    className="flex-1 px-4 py-2 bg-navy hover:bg-primary text-white rounded-lg font-bold transition shadow-sm text-xs">
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
