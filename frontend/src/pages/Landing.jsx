import React from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "../context/TenantContext";

export default function Landing() {
    const { tenantSlug } = useTenant();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col items-center justify-center gap-6">
            <div className="text-center">
                <h1 className="text-5xl font-bold text-indigo-700 mb-2">
                    Welcome to LMS
                </h1>
                <p className="text-lg text-gray-500">
                    Tenant:{" "}
                    <span className="font-semibold text-indigo-500">{tenantSlug}</span>
                </p>
            </div>
            <button
                onClick={() => navigate("/login")}
                className="px-6 py-3 bg-indigo-600 text-white text-lg font-medium rounded-xl shadow hover:bg-indigo-700 transition-colors"
            >
                Go to Login
            </button>
        </div>
    );
}
