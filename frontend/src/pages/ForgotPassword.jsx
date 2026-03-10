import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
<<<<<<< HEAD
        console.log("Reset link sent to:", email);
=======
        // TODO: connect to password-reset API
        console.log("Password reset requested for", email);
>>>>>>> 0445047e6fe2c2eda9dfbcf0e37f49c8eea14ade
        setSubmitted(true);
    };

    return (
<<<<<<< HEAD
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Forgot Password</h2>
                <p className="text-sm text-slate-500 mb-6 font-medium">No worries, we'll send you reset instructions.</p>

                {submitted ? (
                    <div className="text-center">
                        <div className="text-indigo-600 font-medium mb-4 italic">Done! Reset link sent to {email}</div>
                        <button onClick={() => navigate("/login")} className="text-indigo-600 hover:underline text-sm font-semibold">Back to Login</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                            <input
                                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400"
                                placeholder="you@example.com"
                            />
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition active:scale-95 shadow-lg shadow-indigo-100">Send Reset Link</button>
                        <div className="text-center pt-2">
                            <button onClick={() => navigate("/login")} className="text-indigo-600 hover:underline text-sm font-semibold">Back to Login</button>
                        </div>
                    </form>
=======
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
            <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
                <h2 className="text-3xl font-bold text-indigo-700 mb-2 text-center">Forgot Password</h2>
                <p className="text-center text-gray-400 text-sm mb-6">
                    Enter your email and we'll send you a reset link.
                </p>

                {submitted ? (
                    <div className="text-center py-6">
                        <div className="text-5xl mb-4">📧</div>
                        <p className="text-gray-700 font-medium">Check your inbox!</p>
                        <p className="text-gray-400 text-sm mt-1">
                            A reset link has been sent to <span className="font-semibold text-indigo-600">{email}</span>
                        </p>
                        <button
                            onClick={() => navigate("/login")}
                            className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                            Back to Sign In
                        </button>
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-600" htmlFor="reset-email">Email</label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="mt-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                            >
                                Send Reset Link
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500 mt-5">
                            Remembered it?{" "}
                            <button
                                onClick={() => navigate("/login")}
                                className="text-indigo-600 font-medium hover:underline"
                            >
                                Back to Sign In
                            </button>
                        </p>
                    </>
>>>>>>> 0445047e6fe2c2eda9dfbcf0e37f49c8eea14ade
                )}
            </div>
        </div>
    );
}
