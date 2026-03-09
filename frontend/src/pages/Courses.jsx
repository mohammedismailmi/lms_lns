import React from "react";

const PLACEHOLDER_COURSES = [
    {
        id: 1,
        title: "Introduction to React",
        description:
            "Learn the fundamentals of React including components, props, state, and hooks.",
    },
    {
        id: 2,
        title: "Advanced JavaScript",
        description:
            "Deep dive into closures, async/await, the event loop, and modern ES2024 features.",
    },
    {
        id: 3,
        title: "Cloud Architecture",
        description:
            "Understand scalable cloud design patterns using AWS, Cloudflare, and serverless functions.",
    },
];

export default function Courses() {
    return (
        <div className="min-h-screen bg-gray-50 p-10">
            <h1 className="text-4xl font-bold text-indigo-700 mb-8 text-center">
                Available Courses
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {PLACEHOLDER_COURSES.map((course) => (
                    <div
                        key={course.id}
                        className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-3 hover:shadow-lg transition-shadow"
                    >
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                            {course.id}
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            {course.title}
                        </h2>
                        <p className="text-gray-500 text-sm">{course.description}</p>
                        <button className="mt-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                            View Course
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
