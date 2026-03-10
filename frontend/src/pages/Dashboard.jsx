import React from "react";

<<<<<<< HEAD
export default function Dashboard() {
    const role = localStorage.getItem("role") || "learner";

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-4 text-gray-700">
                Welcome to your dashboard! You are logged in as a <span className="font-bold text-indigo-600 capitalize">{role}</span>.
            </p>
=======
const roleMessages = {
    admin: "You have full access to manage the platform, users, and courses.",
    instructor: "You can create and manage your courses and track learner progress.",
    learner: "Explore your enrolled courses and continue your learning journey.",
};

export default function Dashboard() {
    const role = localStorage.getItem("role") || "learner";
    const message = roleMessages[role] || roleMessages.learner;

    const roleColors = {
        admin: "text-red-600",
        instructor: "text-amber-600",
        learner: "text-indigo-600",
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 gap-4">
            <div className="bg-white shadow-lg rounded-2xl p-10 max-w-lg w-full text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Dashboard</h1>
                <p className="text-sm text-gray-400 mb-6">
                    Logged in as:{" "}
                    <span className={`font-semibold capitalize ${roleColors[role] || "text-indigo-600"}`}>
                        {role}
                    </span>
                </p>
                <p className="text-gray-600 text-lg">{message}</p>
            </div>
>>>>>>> 0445047e6fe2c2eda9dfbcf0e37f49c8eea14ade
        </div>
    );
}
