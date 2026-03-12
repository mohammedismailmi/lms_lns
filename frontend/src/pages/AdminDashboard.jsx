import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const navigate = useNavigate();

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-8">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-semibold text-slate-700 mb-2">Manage Users</h3>
                    <p className="text-sm text-slate-500 mb-4">Add, edit, or remove users from the platform.</p>
                    <button className="text-indigo-600 font-bold text-sm hover:underline">View Users →</button>
                </div>

                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-semibold text-slate-700 mb-2">Manage Tenants</h3>
                    <p className="text-sm text-slate-500 mb-4">Configure and manage multi-tenant settings.</p>
                    <button className="text-indigo-600 font-bold text-sm hover:underline">Configure →</button>
                </div>

                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-semibold text-slate-700 mb-2">Platform Analytics</h3>
                    <p className="text-sm text-slate-500 mb-4">View globally aggregated system metrics.</p>
                    <button className="text-indigo-600 font-bold text-sm hover:underline">View Stats →</button>
                </div>

                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-semibold text-slate-700 mb-2">All Courses</h3>
                    <p className="text-sm text-slate-500 mb-4">Oversee all course content across the LMS.</p>
                    <button className="text-indigo-600 font-bold text-sm hover:underline" onClick={() => navigate('/courses')}>Manage →</button>
                </div>
            </div>
        </div>
    );
}
