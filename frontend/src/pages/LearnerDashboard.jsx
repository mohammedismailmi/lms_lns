import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LearnerDashboard() {
    const navigate = useNavigate();

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-8">Learner Dashboard</h1>

            <div className="space-y-8">
                <section>
                    <h2 className="text-xl font-bold text-slate-700 mb-4">Continue Learning</h2>
                    <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-800">Advanced React Patterns</h3>
                            <p className="text-sm text-slate-500 font-medium">Module 4: Higher Order Components</p>
                        </div>
                        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition">
                            Resume
                        </button>
                    </div>
                </section>

                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-700">Enrolled Courses</h2>
                        <button className="text-indigo-600 font-bold text-sm hover:underline" onClick={() => navigate('/courses')}>
                            Browse More →
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="h-32 bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">Course Preview</div>
                            <div className="p-4">
                                <h3 className="font-bold text-slate-800 mb-1">Fullstack Development</h3>
                                <p className="text-xs text-slate-500 mb-4">By Instructor John Doe</p>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-indigo-600 h-full w-[45%]"></div>
                                </div>
                                <p className="text-[10px] text-right mt-1 font-bold text-indigo-600">45% Complete</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
