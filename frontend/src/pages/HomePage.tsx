import React from 'react';
import WelcomeBanner from '../components/home/WelcomeBanner';
import StarredCourses from '../components/home/StarredCourses';
import RecommendedCourses from '../components/home/RecommendedCourses';
import AllCourses from '../components/home/AllCourses';

export default function HomePage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto space-y-8 sm:space-y-12 pb-24">
            <WelcomeBanner />
            <StarredCourses />
            <RecommendedCourses />
            <AllCourses />
        </div>
    );
}
