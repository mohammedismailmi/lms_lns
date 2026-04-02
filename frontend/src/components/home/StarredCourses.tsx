import React from 'react';
import { useCourseStore } from '../../store/courseStore';
import { useAuthStore } from '../../store/authStore';
import CourseCard from './CourseCard';
import { Star } from 'lucide-react';

export default function StarredCourses() {
    const { starred, getEnrolledCourses } = useCourseStore();
    const { user } = useAuthStore();

    if (!user || starred.size === 0) return null;

    const enrolled = getEnrolledCourses(user.id);
    const starredList = enrolled.filter(c => starred.has(c.id));

    if (starredList.length === 0) return null;

    return (
        <section className="mb-8">
            <div className="flex items-center gap-2 mb-4.5">
                <Star className="w-5 h-5 fill-highlight text-highlight" />
                <h2 className="text-xl font-serif font-black text-highlight tracking-tight">Starred</h2>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-3 snap-x hide-scrollbar">
                {starredList.map(course => (
                    <div key={course.id} className="min-w-[280px] max-w-[340px] snap-start flex-shrink-0">
                        <CourseCard course={course} />
                    </div>
                ))}
            </div>
        </section>
    );
}
