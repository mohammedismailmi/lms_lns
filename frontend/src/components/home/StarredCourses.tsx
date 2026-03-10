import React from 'react';
import { courses } from '../../lib/mockData';
import { useCourseStore } from '../../store/courseStore';
import CourseCard from './CourseCard';
import { Star } from 'lucide-react';

export default function StarredCourses() {
    const { starred } = useCourseStore();

    if (starred.size === 0) return null;

    const starredList = courses.filter(c => starred.has(c.id));

    return (
        <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
                <Star className="w-6 h-6 fill-highlight text-highlight" />
                <h2 className="text-2xl font-serif font-bold text-highlight">Starred</h2>
            </div>

            <div className="flex overflow-x-auto gap-6 pb-4 snap-x hide-scrollbar">
                {starredList.map(course => (
                    <div key={course.id} className="min-w-[320px] max-w-[360px] snap-start flex-shrink-0">
                        <CourseCard course={course} />
                    </div>
                ))}
            </div>
        </section>
    );
}
