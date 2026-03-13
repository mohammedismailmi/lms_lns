import React from 'react';
import { useCourseStore } from '../../store/courseStore';
import { useAuthStore } from '../../store/authStore';
import { useProgressStore } from '../../store/progressStore';
import CourseCard from './CourseCard';

export default function RecommendedCourses() {
    const { getCourseProgress } = useProgressStore();
    const { getEnrolledCourses } = useCourseStore();
    const { user } = useAuthStore();

    if (!user) return null;
    const enrolled = getEnrolledCourses(user.id);

    const recommended = enrolled
        .map(course => {
            const allActivities = course.modules.flatMap(m => m.activities);
            const progress = getCourseProgress(course.id, allActivities);
            return { course, progress };
        })
        .filter(item => item.progress < 30) // Only recommend courses barely started
        .sort((a, b) => a.progress - b.progress)
        .map(item => item.course);

    if (recommended.length === 0) return null;

    return (
        <section className="mb-12">
            <h2 className="text-2xl font-serif font-bold text-navy mb-6">Recommended for You</h2>

            <div className="flex overflow-x-auto gap-6 pb-4 snap-x hide-scrollbar">
                {recommended.map(course => (
                    <div key={course.id} className="min-w-[320px] max-w-[360px] snap-start flex-shrink-0">
                        <CourseCard course={course} />
                    </div>
                ))}
            </div>
        </section>
    );
}
