import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Calendar as CalendarIcon, Clock, Users, Video } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';

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

const mockAssignments: Record<string, string[]> = {
    '2026-03-16': ['React Hooks Quiz', 'Submit Project Proposal'],
    '2026-03-20': ['Midterm Exam: Ethics'],
    '2026-03-25': ['Peer Review Deadline']
};

export default function Dashboard() {
    const { user } = useAuthStore();
    const [date, setDate] = useState<Date>(new Date());

    // Format date for looking up mock assignments natively (YYYY-MM-DD)
    // Be careful with timezones, using local string
    const formatDate = (val: Date) => {
        const d = new Date(val);
        const month = '' + (d.getMonth() + 1);
        const day = '' + d.getDate();
        const year = d.getFullYear();
        return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
    };

    const selectedDateStr = formatDate(date as Date);
    const dayAssignments = mockAssignments[selectedDateStr] || [];

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
                    <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
                        <h2 className="text-xl font-serif font-bold text-navy mb-6 flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-primary" />
                            Academic Calendar
                        </h2>

                        <div className="react-calendar-wrapper">
                            <Calendar
                                onChange={(val) => setDate(val as Date)}
                                value={date}
                                className="border-none w-full font-sans"
                                tileClassName={({ date, view }) => {
                                    if (view === 'month') {
                                        const dateStr = formatDate(date);
                                        if (mockAssignments[dateStr]) {
                                            return 'has-assignments';
                                        }
                                    }
                                    return null;
                                }}
                                tileContent={({ date, view }) => {
                                    if (view === 'month') {
                                        const dateStr = formatDate(date);
                                        if (mockAssignments[dateStr]) {
                                            return <div className="mx-auto mt-1 w-1.5 h-1.5 bg-accent rounded-full"></div>;
                                        }
                                    }
                                    return null;
                                }}
                            />
                        </div>

                        {/* Selected Date Assignments Popup/List */}
                        <div className="mt-8 pt-6 border-t border-border">
                            <h3 className="font-bold text-navy mb-4 flex items-center justify-between">
                                Tasks for {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                <span className={cn("text-xs px-2 py-1 rounded-full", dayAssignments.length > 0 ? "bg-accent/10 text-accent" : "bg-slate-100 text-slate-500")}>
                                    {dayAssignments.length} due
                                </span>
                            </h3>

                            {dayAssignments.length > 0 ? (
                                <ul className="space-y-3">
                                    {dayAssignments.map((task: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm font-medium text-slate-700 bg-surface p-3 rounded-lg border border-border">
                                            <div className="mt-0.5 w-2 h-2 rounded-full bg-accent shrink-0" />
                                            {task}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted font-medium italic text-center py-4">No tasks due on this date.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
