import React, { useState } from 'react';
import WelcomeBanner from '../components/home/WelcomeBanner';
import CourseCard from '../components/home/CourseCard';
import { useCourseStore } from '../store/courseStore';
import { Search } from 'lucide-react';

export default function AdminCoursesOverviewPage() {
    // Navigates strictly to the Admin Overview that reflects the old HomePage behaviour
    // but without Stats block and mapping the full directory
    const { getAllCourses } = useCourseStore();
    const [searchQuery, setSearchQuery] = useState('');
    
    const allCourses = getAllCourses();
    const filteredCourses = allCourses.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 pb-24">
            <WelcomeBanner />
            
            <section>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-serif font-bold text-navy">Platform Catalog</h2>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder="Search catalog..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white text-ink placeholder:text-muted rounded-full py-2 pl-10 pr-4 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all"
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCourses.map(course => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            </section>
        </div>
    );
}
