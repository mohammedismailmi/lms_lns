import React from 'react';
import { courses } from '../../lib/mockData';
import CourseCard from './CourseCard';

export default function AllCourses() {
    return (
        <section>
            <h2 className="text-2xl font-serif font-bold text-navy mb-6">All Courses</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.map(course => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>
        </section>
    );
}
