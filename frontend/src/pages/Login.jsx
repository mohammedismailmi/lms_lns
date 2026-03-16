import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation } from "react-router-dom";

import { useAuthStore } from "../store/authStore";
import TenantSelector from "../components/auth/TenantSelector";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const login = useAuthStore((state) => state.login);
    const [apiError, setApiError] = useState("");
    const [selectedTenantId, setSelectedTenantId] = useState(null);
    const [tenantError, setTenantError] = useState(null);
    const [isSuperAdminMode, setIsSuperAdminMode] = useState(false);

    // Pre-select tenant from signup redirect
    const preSelectedTenant = location.state?.tenantId;
    useEffect(() => {
        if (preSelectedTenant) setSelectedTenantId(preSelectedTenant);
    }, [preSelectedTenant]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data) => {
        setApiError("");
        setTenantError(null);

        if (!isSuperAdminMode && !selectedTenantId) {
            setTenantError("Please select your institution");
            return;
        }

        const result = await login(
            data.email,
            data.password,
            isSuperAdminMode ? undefined : selectedTenantId
        );

        if (result.success) {
            setTimeout(() => {
                const user = useAuthStore.getState().user;
                if (user?.role === 'super_admin') navigate("/superadmin");
                else if (user?.role === 'admin') navigate("/courses");
                else if (user?.role === 'instructor') navigate("/teaching");
                else navigate("/home");
            }, 50);
        } else {
            setApiError(result.error || "Login failed. Please check your credentials.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">
                    {isSuperAdminMode ? "Platform Admin" : "Sign In"}
                </h2>
                <p className="text-sm text-slate-500 mb-8 font-medium italic">
                    {isSuperAdminMode
                        ? "Sign in to the platform management console."
                        : "Welcome back! Please enter your details."}
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Tenant Selector — hidden in super admin mode */}
                    {!isSuperAdminMode && (
                        <TenantSelector
                            value={selectedTenantId}
                            onChange={(id) => {
                                setSelectedTenantId(id);
                                setTenantError(null);
                            }}
                            error={tenantError}
                        />
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                        <input
                            {...register("email")}
                            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.email ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-indigo-500"
                                }`}
                            placeholder="you@example.com"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-semibold text-slate-700">Password</label>
                            <button
                                type="button"
                                onClick={() => navigate("/forgot-password")}
                                className="text-xs text-indigo-600 hover:underline font-bold"
                            >
                                Forgot?
                            </button>
                        </div>
                        <input
                            type="password"
                            {...register("password")}
                            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.password ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-indigo-500"
                                }`}
                            placeholder="••••••••"
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white font-extrabold py-3 rounded-xl hover:bg-indigo-700 transition active:scale-[0.98] shadow-lg shadow-indigo-100 mt-2"
                    >
                        Sign In
                    </button>
                    {apiError && <p className="text-red-600 text-sm font-bold text-center mt-4">{apiError}</p>}
                </form>

                <div className="mt-8 text-center text-sm font-medium">
                    <span className="text-slate-500 uppercase tracking-widest text-[10px]">New here?</span>
                    <button
                        onClick={() => navigate("/signup")}
                        className="ml-2 text-indigo-600 hover:underline font-bold"
                    >
                        Create Account
                    </button>
                </div>

                {/* Super Admin Toggle */}
                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setIsSuperAdminMode(!isSuperAdminMode);
                            setApiError("");
                            setTenantError(null);
                        }}
                        className="text-[11px] text-slate-400 hover:text-slate-600 transition font-medium"
                    >
                        {isSuperAdminMode
                            ? "← Back to regular sign in"
                            : "Platform administrator? Sign in here"}
                    </button>
                </div>
            </div>
        </div>
    );
}
