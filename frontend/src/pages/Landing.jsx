import React from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "../context/TenantContext";

export default function Landing() {
    const navigate = useNavigate();
    const { tenantSlug } = useTenant();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-blue-700 flex flex-col items-center justify-center text-white p-4">
            <div className="text-center space-y-6 max-w-2xl">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                    Welcome to <span className="text-indigo-200 uppercase">{tenantSlug}</span> LMS
                </h1>
                <p className="text-xl text-indigo-100 opacity-90">
                    The all-in-one learning platform for modern teams. Build, deliver, and track your courses with ease.
                </p>
                <div className="pt-8">
                    <button
                        onClick={() => navigate("/login")}
                        className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl shadow-lg hover:bg-indigo-50 transition-all transform hover:scale-105 active:scale-95 text-lg"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        </div>
    );
}
