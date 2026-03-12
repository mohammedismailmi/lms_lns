import React from 'react';

export default function InstructorDashboard() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-8">Instructor Dashboard</h1>

            <div className="space-y-8">
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-700">My Courses</h2>
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition">
                            + Create New Course
                        </button>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                        <p className="text-slate-500 font-medium">No courses created yet. Start by creating your first course!</p>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-700 mb-4">My Students</h2>
                    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                        <p className="text-slate-500 font-medium">No students enrolled in your courses yet.</p>
                    </div>
                </section>
            </div>
        </div>
    );
}
