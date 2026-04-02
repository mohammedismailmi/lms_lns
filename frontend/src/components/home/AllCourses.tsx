import React from 'react';
import { courses } from '../../lib/mockData';
import CourseCard from './CourseCard';

export default function AllCourses() {
    return (
        <section>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-navy mb-4 sm:mb-6">All Courses</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {courses.map(course => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>
        </section>
    );
}
