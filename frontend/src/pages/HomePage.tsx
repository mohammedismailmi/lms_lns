import React from 'react';
import WelcomeBanner from '../components/home/WelcomeBanner';
import StarredCourses from '../components/home/StarredCourses';
import RecommendedCourses from '../components/home/RecommendedCourses';
import AllCourses from '../components/home/AllCourses';

export default function HomePage() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 pb-24">
            <WelcomeBanner />
            <StarredCourses />
            <RecommendedCourses />
            <AllCourses />
        </div>
    );
}
