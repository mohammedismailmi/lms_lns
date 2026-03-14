import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

import api from "../lib/api";

const signUpSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function SignUp() {
    const navigate = useNavigate();
    const [apiError, setApiError] = useState("");
    const [apiSuccess, setApiSuccess] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(signUpSchema),
    });

    const onSubmit = async (data) => {
        setApiError("");
        setApiSuccess("");

        try {
            const response = await api.post('/api/auth/register', {
                name: data.name,
                email: data.email,
                password: data.password,
                tenant_id: "t1",
                role: "learner"
            });

            if (response.data.success) {
                setApiSuccess("Account created! Redirecting to sign in...");
                setTimeout(() => navigate("/login"), 1500);
            }
        } catch (err) {
            setApiError(err.response?.data?.message || "Failed to create account. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
                <h2 className="text-3xl font-bold text-slate-800 mb-2 font-display uppercase tracking-tight">Create Account</h2>
                <p className="text-sm text-slate-400 mb-8 font-medium">Join our learning community today.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                        <input
                            {...register("name")}
                            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition ${errors.name ? "border-red-500 focus:ring-red-100" : "border-slate-200 focus:ring-indigo-500"
                                }`}
                            placeholder="Jane Doe"
                        />
                        {errors.name && <p className="text-red-500 text-[11px] mt-1 font-bold">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                        <input
                            {...register("email")}
                            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition ${errors.email ? "border-red-500 focus:ring-red-100" : "border-slate-200 focus:ring-indigo-500"
                                }`}
                            placeholder="jane@example.com"
                        />
                        {errors.email && <p className="text-red-500 text-[11px] mt-1 font-bold">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                        <input
                            type="password"
                            {...register("password")}
                            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition ${errors.password ? "border-red-500 focus:ring-red-100" : "border-slate-200 focus:ring-indigo-500"
                                }`}
                            placeholder="••••••••"
                        />
                        {errors.password && <p className="text-red-500 text-[11px] mt-1 font-bold">{errors.password.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm Password</label>
                        <input
                            type="password"
                            {...register("confirmPassword")}
                            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition ${errors.confirmPassword ? "border-red-500 focus:ring-red-100" : "border-slate-200 focus:ring-indigo-500"
                                }`}
                            placeholder="••••••••"
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-[11px] mt-1 font-bold">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition active:scale-[0.98] shadow-lg shadow-slate-200 mt-4 text-sm"
                    >
                        Get Started
                    </button>
                    {apiError && <p className="text-red-600 text-sm font-bold text-center mt-4">{apiError}</p>}
                    {apiSuccess && <p className="text-green-600 text-sm font-bold text-center mt-4">{apiSuccess}</p>}
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-500 font-medium italic">
                        Already have an account?{" "}
                        <button onClick={() => navigate("/login")} className="text-indigo-600 hover:underline font-bold not-italic">Sign In</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
