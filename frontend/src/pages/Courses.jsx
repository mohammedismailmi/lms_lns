import React from "react";

export default function Courses() {
    const courses = [
        { id: 1, title: "React Fundamentals", desc: "Learn the basics of React." },
        { id: 2, title: "Advanced Javascript", desc: "Master the language of the web." },
        { id: 3, title: "Cloudflare Workers", desc: "Deploy serverless functions with ease." },
    ];

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Courses</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {courses.map((c) => (
                    <div key={c.id} className="border p-4 rounded-lg shadow hover:shadow-md transition">
                        <h2 className="text-xl font-semibold mb-2">{c.title}</h2>
                        <p className="text-gray-600">{c.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
