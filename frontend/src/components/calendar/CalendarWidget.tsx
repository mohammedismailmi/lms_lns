import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, FileText, Video } from 'lucide-react';
import api from '../../lib/api';

export default function CalendarWidget() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        api.get('/api/calendar/events')
            .then(res => setEvents(res.data.events || []))
            .catch(err => console.error('Failed to fetch events:', err))
            .finally(() => setLoading(false));
    }, []);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
    };

    const getEventsForDay = (day: number) => {
        return events.filter(e => {
            const eventDate = new Date(e.date);
            return eventDate.getDate() === day && eventDate.getMonth() === currentDate.getMonth() && eventDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const upcomingEvents = events
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-navy/5 border border-border overflow-hidden h-full flex flex-col">
            <div className="bg-navy p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-serif font-bold flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        LMS Calendar
                    </h3>
                    <div className="flex gap-1">
                        <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
                <p className="text-2xl font-bold font-serif">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</p>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-muted uppercase tracking-widest py-1">{d}</div>
                    ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayEvents = getEventsForDay(day);
                        return (
                            <div key={day} className={`aspect-square relative flex items-center justify-center text-sm rounded-xl transition-all ${isToday(day) ? 'bg-primary text-white font-bold ring-4 ring-primary/20' : 'hover:bg-slate-50 text-navy'}`}>
                                {day}
                                <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-0.5">
                                    {dayEvents.map((e, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`w-1 h-1 rounded-full ${
                                                e.eventKind === 'deadline' ? 'bg-accent' : 
                                                e.type === 'quiz' || e.type === 'exam' ? 'bg-yellow-400' : 'bg-blue-400'
                                            }`} 
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-auto border-t border-border bg-slate-50 p-6">
                <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">Upcoming Deadlines</h4>
                <div className="space-y-4">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => <div key={i} className="h-12 bg-slate-200 animate-pulse rounded-xl" />)}
                        </div>
                    ) : upcomingEvents.length === 0 ? (
                        <p className="text-xs text-muted italic">No upcoming events found.</p>
                    ) : (
                        upcomingEvents.map(event => (
                            <div key={event.id} className="bg-white p-3 rounded-xl border border-border shadow-sm hover:border-primary/30 transition-colors cursor-pointer group">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg shrink-0 ${event.eventKind === 'deadline' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                                        {event.eventKind === 'deadline' ? <FileText className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-navy truncate group-hover:text-primary transition-colors">{event.title}</p>
                                        <p className="text-[10px] text-muted truncate mb-1">{event.courseName}</p>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted">
                                            <Clock className="w-3 h-3" />
                                            {new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
