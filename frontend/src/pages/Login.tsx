import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "../lib/validations/auth";
import { apiFetch } from "../lib/api";

export default function Login() {
    const navigate = useNavigate();
    const [globalError, setGlobalError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data: LoginFormData) => {
        setGlobalError(null);
        try {
            await apiFetch("/api/auth/login", {
                method: "POST",
                data,
            });

            // Redirect to dashboard on successful login
            navigate("/dashboard");
        } catch (error: unknown) {
            setGlobalError(error instanceof Error ? error.message : "Failed to log in.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
            <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
                <h2 className="text-3xl font-bold text-indigo-700 mb-2 text-center">Sign In</h2>
                <p className="text-center text-gray-400 text-sm mb-6">Welcome back!</p>

                {globalError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200 text-center">
                        {globalError}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            className={`border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.email ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'}`}
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-gray-600" htmlFor="password">
                                Password
                            </label>
                            <button
                                type="button"
                                onClick={() => navigate("/forgot-password")}
                                className="text-xs text-indigo-500 hover:underline"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className={`border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.password ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'}`}
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`mt-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex justify-center items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isSubmitting ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-5">
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={() => navigate("/signup")}
                        className="text-indigo-600 font-medium hover:underline"
                    >
                        Sign Up
                    </button>
                </p>
            </div>
        </div>
    );
}
