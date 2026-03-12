import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Unauthorized() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const userRole = user?.role || localStorage.getItem("user_role");

    const getDashboardPath = () => {
        console.log("Unauthorized redirect for role:", userRole);
        switch (userRole) {
            case 'admin': return '/dashboard/admin';
            case 'instructor': return '/dashboard/instructor';
            case 'learner': return '/dashboard/learner';
            default: return '/login';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-12 rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-800 mb-3">Access Denied</h1>
                <p className="text-slate-500 mb-8 font-medium">You don't have permission to view this page. Please contact your administrator if you believe this is an error.</p>

                <button
                    onClick={() => navigate(getDashboardPath())}
                    className="bg-indigo-600 text-white font-extrabold px-8 py-3 rounded-xl hover:bg-indigo-700 transition active:scale-[0.95] shadow-lg shadow-indigo-100 ring-2 ring-indigo-50"
                >
                    Return to My Dashboard
                </button>
            </div>
        </div>
    );
}
