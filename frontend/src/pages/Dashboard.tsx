import React from 'react';
import { Clock, Users, Video } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import CalendarWidget from '../components/calendar/CalendarWidget';

// Tailwind overrides for react-calendar
import './Dashboard.css';

const mockEvents = [
    {
        id: 'e1',
        title: 'Weekly Q&A Session: ML Fundamentals',
        date: 'Today',
        time: '4:00 PM - 5:00 PM',
        attendees: 42,
        type: 'live'
    },
    {
        id: 'e2',
        title: 'Guest Lecture: Advanced React Patterns',
        date: 'Tomorrow',
        time: '2:00 PM - 3:30 PM',
        attendees: 128,
        type: 'webinar'
    },
    {
        id: 'e3',
        title: 'Project Group 4 Kickoff',
        date: 'Mar 18',
        time: '11:00 AM - 12:00 PM',
        attendees: 5,
        type: 'meeting'
    }
];

export default function Dashboard() {
    const { user } = useAuthStore();

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
                            <button className="text-sm font-bold text-primary hover:text-navy transition-colors">View All</button>
                        </div>

                        <div className="space-y-4">
                            {mockEvents.map((event) => (
                                <div key={event.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-border hover:border-slate-300 hover:shadow-md transition-all bg-surface">
                                    <div className="flex gap-4 items-start">
                                        <div className="bg-white border border-border rounded-lg p-3 flex flex-col items-center justify-center min-w-[70px] shadow-sm">
                                            <span className="text-xs font-bold text-muted uppercase tracking-wider">{event.date.includes('Mar') ? event.date.split(' ')[0] : 'MAR'}</span>
                                            <span className="text-xl font-bold text-navy">{event.date.includes('Mar') ? event.date.split(' ')[1] : new Date().getDate() + (event.date === 'Tomorrow' ? 1 : 0)}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-navy text-lg">{event.title}</h3>
                                            <div className="flex items-center gap-4 text-sm text-muted mt-2 font-medium">
                                                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {event.time}</span>
                                                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {event.attendees}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full md:w-auto px-6 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold rounded-lg transition-colors">
                                        Join
                                    </button>
                                </div>
                            ))}
                        </div>
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
