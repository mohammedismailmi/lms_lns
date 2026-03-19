import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useProgressStore } from '../store/progressStore';
import { useCourseStore } from '../store/courseStore';
import { useToast } from '../lib/useToast';
import { Activity } from '../lib/mockData';
import { cn } from '../lib/utils';
import api from '../lib/api';

import ModuleSidebar from '../components/course/ModuleSidebar';
import CourseCompleteButton from '../components/course/CourseCompleteButton';
import BlogActivity from '../components/course/BlogActivity';
import FileActivity from '../components/course/FileActivity';
import VideoActivity from '../components/course/VideoActivity';
import LiveClassActivity from '../components/course/LiveClassActivity';
import AssessmentActivity from '../components/course/AssessmentActivity';
import SubmissionActivity from '../components/course/SubmissionActivity';
import ActivityModal from '../components/course/ActivityModal';
import StudentProgressView from '../components/course/StudentProgressView';

import { Users, Plus, LayoutList, Award, BookOpen, Clock, Lock, Edit2, Trash2, CheckCircle } from 'lucide-react';

export default function CoursePage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { recalculateCourseProgress, getCourseProgress } = useProgressStore();
    const { coursesList, enrolledCourseIds, instructorCompleted, enrollUser, addModule, addActivity, updateActivity, deleteActivity } = useCourseStore();
    const toast = useToast();

    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [isAddModuleOpen, setAddModuleOpen] = useState(false);
    const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
    const [announcementText, setAnnouncementText] = useState('');
    const [postingAnnouncement, setPostingAnnouncement] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [modalState, setModalState] = useState<{isOpen: boolean, moduleId: string | null, activity: Activity | undefined}>({
        isOpen: false,
        moduleId: null,
        activity: undefined
    });
    const [activeTab, setActiveTab] = useState<'content' | 'progress'>('content');

    const fetchCourse = React.useCallback(() => {
        setLoading(true);
        api.get(`/api/courses/${courseId}`)
            .then((res: any) => setCourse(res.data.course))
            .catch((err: any) => console.error(err))
            .finally(() => setLoading(false));
    }, [courseId]);

    const handlePostAnnouncement = async () => {
        if (!announcementText.trim()) return;
        try {
            setPostingAnnouncement(true);
            await api.post(`/api/courses/${courseId}/announcements`, { content: announcementText });
            setAnnouncementText('');
            setShowAnnouncementForm(false);
            toast.success('Announcement posted!');
            fetchCourse();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err.message || 'Failed to post announcement');
        } finally {
            setPostingAnnouncement(false);
        }
    };

    useEffect(() => {
        fetchCourse();
    }, [fetchCourse]);

    const isInstructor = user?.role === 'admin' || user?.role === 'instructor';
    const isEnrolled = isInstructor || (user && course && enrolledCourseIds[user.id] && enrolledCourseIds[user.id].includes(course.id));

    // Track course progress live
    const allActivities = course?.modules?.flatMap((m: any) => m.activities) || [];

    useEffect(() => {
        if (course && isEnrolled && allActivities.length > 0) {
            recalculateCourseProgress(course.id, allActivities);
            const interval = setInterval(() => {
                setProgress(getCourseProgress(course.id, allActivities));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [course?.id, isEnrolled, allActivities.length]);

    // Safety check
    if (loading) {
        return <div className="p-8 text-center text-muted font-serif text-2xl">Loading course...</div>;
    }
    if (!course || !user) {
        return <div className="p-8 text-center text-accent font-serif text-2xl">Course not found.</div>;
    }

    const certificateReady = instructorCompleted.has(course.id) && progress === 100 && !isInstructor;

    const handleEnroll = () => {
        enrollUser(user.id, course.id);
        toast.success(`Successfully enrolled in ${course.name}!`);
    };

    const handleAddModule = async () => {
        if (!newModuleTitle.trim()) return;
        try {
            await addModule(course.id, newModuleTitle);
            setNewModuleTitle('');
            setAddModuleOpen(false);
            toast.success('Module created successfully.');
            fetchCourse();
        } catch (err) {
            toast.error('Failed to create module');
        }
    };

    const handleSaveActivity = async (activity: Activity) => {
        if (!modalState.moduleId) return;
        try {
            if (modalState.activity) {
                await updateActivity(course.id, modalState.moduleId, activity);
                toast.success('Activity updated!');
                fetchCourse();
            } else {
                await addActivity(course.id, modalState.moduleId, activity);
                toast.success('Activity added successfully!');
                fetchCourse();
            }
        } catch (err) {
            toast.error('Failed to save activity');
        }
    };

    if (!isEnrolled) {
        // ENROLLMENT GATE
        return (
            <div className="flex h-full items-center justify-center p-8 bg-surface">
                <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full overflow-hidden border border-border">
                    <div className="bg-navy p-10 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #0F2040 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                        <Lock className="w-12 h-12 text-highlight mx-auto mb-4 relative z-10" />
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white relative z-10 leading-tight">
                            {course.name}
                        </h1>
                        <p className="text-slate-300 mt-4 relative z-10 max-w-xl mx-auto">{course.section}</p>
                    </div>
                    <div className="p-10 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold font-serif text-navy mb-2">About this Course</h3>
                            <p className="text-muted leading-relaxed">
                                {course.description || "Unlock your potential through detailed rigorous tutelage by enrolling. You will gain instantaneous access to all curated course material, live webinars, and exams constructed by our high calibre instructors."}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-y border-border py-6">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-xs font-bold text-muted uppercase tracking-wider">Faculty</p>
                                    <p className="font-bold text-navy">{course.faculty}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <BookOpen className="w-5 h-5 text-success" />
                                <div>
                                    <p className="text-xs font-bold text-muted uppercase tracking-wider">Modules</p>
                                    <p className="font-bold text-navy">{course.modules.length}</p>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={handleEnroll}
                            className="w-full bg-primary hover:bg-navy text-white text-lg font-bold py-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 group"
                        >
                            <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" /> 
                            Enroll in Course
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full relative">
            {!isInstructor && <ModuleSidebar course={course} />}

            <div className="flex-1 overflow-y-auto w-full relative">
                
                <div className="bg-navy text-white px-10 py-12 border-b-4 border-highlight shadow-sm">
                    {certificateReady && (
                        <div className="mb-6 inline-flex bg-highlight text-navy px-4 py-2 rounded-lg font-bold items-center gap-2 shadow-lg animate-in slide-in-from-top cursor-pointer hover:bg-yellow-500 transition-colors"
                            onClick={() => navigate(`/certificates`)}>
                            <Award className="w-5 h-5" />
                            Certificate Available! Click to view.
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="max-w-3xl">
                            <span className="text-highlight font-bold tracking-widest uppercase text-sm mb-3 block">
                                {course.category}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight mb-4">
                                {course.name}
                            </h1>

                            <div className="flex items-center gap-6 text-slate-300 font-medium">
                                <span className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white border border-slate-600">
                                        {course.facultyInitial}
                                    </span>
                                    {course.faculty}
                                </span>
                                <span>•</span>
                                <span>{course.section}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Enrolled</span>
                            </div>
                        </div>

                        {isInstructor && (
                            <div className="flex flex-col gap-3 min-w-[240px]">
                                <button
                                    onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                                    className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl transition-colors border border-primary">
                                    <Plus className="w-5 h-5" /> Post Announcement
                                </button>
                                {showAnnouncementForm && (
                                    <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
                                        <textarea
                                            value={announcementText}
                                            onChange={e => setAnnouncementText(e.target.value)}
                                            placeholder="Write your announcement..."
                                            className="w-full border border-border rounded-lg p-3 text-sm resize-none h-24 mb-3 focus:outline-none focus:border-primary"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setShowAnnouncementForm(false)} className="px-3 py-1.5 text-sm text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                                            <button onClick={handlePostAnnouncement} disabled={postingAnnouncement} className="px-4 py-1.5 text-sm bg-primary text-white font-bold rounded-lg transition-colors disabled:opacity-50">
                                                {postingAnnouncement ? 'Posting...' : 'Post'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-2 w-full">
                                    <button 
                                        onClick={() => setAddModuleOpen(true)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl transition-colors border border-slate-700"
                                    >
                                        <LayoutList className="w-5 h-5" /> Add Module
                                    </button>
                                    <CourseCompleteButton courseId={course.id} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-10 py-12 max-w-4xl mx-auto space-y-12 pb-32">

                    {/* Tab bar for instructor/admin */}
                    {isInstructor && (
                        <div className="flex gap-2 border-b border-border mb-6">
                            <button
                                onClick={() => setActiveTab('content')}
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'content' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-navy'}`}
                            >
                                Course Content
                            </button>
                            <button
                                onClick={() => setActiveTab('progress')}
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'progress' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-navy'}`}
                            >
                                Student Progress
                            </button>
                        </div>
                    )}

                    {activeTab === 'progress' && isInstructor ? (
                        <StudentProgressView courseId={course.id} />
                    ) : (
                    <>

                    {/* Announcements Section */}
                    {course.announcements && course.announcements.length > 0 && (
                        <div className="mb-10 space-y-4">
                            <h3 className="text-xl font-serif font-bold text-navy flex items-center gap-2">
                                <Award className="w-5 h-5 text-primary" /> Announcements
                            </h3>
                            {course.announcements.map((ann: any) => (
                                <div key={ann.id} className="bg-blue-50/50 border border-blue-100 p-5 rounded-xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-navy">{ann.title}</h4>
                                        <span className="text-xs text-muted">{new Date(ann.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{ann.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {course.modules.length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl bg-surface">
                            <p className="font-serif text-xl text-navy">Curriculum is empty.</p>
                            {isInstructor && <p className="text-muted mt-2">Add a module to begin constructing your course.</p>}
                        </div>
                    )}

                    {course.modules.map((module: any) => (
                        <div key={module.id} className="pt-4 first:pt-0 relative">

                            <div className="sticky top-0 z-10 bg-surface/90 backdrop-blur-md py-4 mb-6 border-b border-border flex items-center justify-between">
                                <h2 className="text-xl font-serif font-bold text-navy truncate flex-1 pr-6 tracking-wide">
                                    <span className="text-muted mr-3 font-sans opacity-50">Module {module.order}</span>
                                    {module.title}
                                </h2>
                                <span className="text-sm font-bold text-muted bg-card px-3 py-1 rounded-lg border border-border shrink-0">
                                    {module.activities.length} Activities
                                </span>
                            </div>

                            <div className="space-y-6 pl-4 md:pl-8 border-l-2 border-slate-200">
                                {module.activities.map((activity: any) => (
                                    <div key={activity.id} className="relative group/activity border border-transparent hover:border-border rounded-xl -ml-2 p-2 transition-all">
                                        
                                        {/* Activity Render Matrix block */}
                                        <div onClick={() => !isInstructor && activity.type !== 'quiz' && activity.type !== 'exam' && navigate(`/lesson/${activity.type}/${activity.id}`)}
                                             className={cn("w-full transition-all", !isInstructor && activity.type !== 'quiz' && activity.type !== 'exam' && "cursor-pointer hover:opacity-90")}>
                                            {activity.type === 'blog' && <BlogActivity activity={activity} />}
                                            {activity.type === 'file' && <FileActivity activity={activity} />}
                                            {activity.type === 'video' && <VideoActivity activity={activity} />}
                                            {activity.type === 'live_class' && <LiveClassActivity activity={activity} />}
                                            {(activity.type === 'quiz' || activity.type === 'exam') && <AssessmentActivity activity={activity} />}
                                            {activity.type === 'submission' && <SubmissionActivity activity={activity} />}
                                        </div>

                                        {isInstructor && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover/activity:opacity-100 transition-opacity bg-white p-2 border border-border shadow-sm rounded-xl">
                                                <button 
                                                    onClick={() => setModalState({ isOpen: true, moduleId: module.id, activity })}
                                                    className="p-1.5 text-navy hover:bg-slate-100 rounded transition-colors" title="Edit Activity"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={async () => {
                                                        try {
                                                            await deleteActivity(course.id, module.id, activity.id);
                                                            toast.info('Activity deleted');
                                                            fetchCourse();
                                                        } catch (err) {
                                                            console.error(err);
                                                        }
                                                    }}
                                                    className="p-1.5 text-accent hover:bg-accent/10 rounded transition-colors" title="Delete Activity"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isInstructor && (
                                    <button 
                                        onClick={() => setModalState({ isOpen: true, moduleId: module.id, activity: undefined })}
                                        className="w-full py-4 mt-4 border-2 border-dashed border-border rounded-xl text-primary font-bold hover:bg-primary/5 hover:border-primary/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" /> Add Activity to Module {module.order}
                                    </button>
                                )}
                            </div>

                        </div>
                    ))}

                    {/* Add Module Inline Expansion */}
                    {isInstructor && (
                        <div className="pt-8 mt-8 border-t border-border">
                            {isAddModuleOpen ? (
                                <div className="bg-slate-50 border border-border p-6 rounded-2xl shadow-inner animate-in fade-in slide-in-from-bottom-2">
                                    <h3 className="font-serif font-bold text-navy mb-4">Create New Module</h3>
                                    <div className="flex gap-4">
                                        <input 
                                            value={newModuleTitle}
                                            onChange={e => setNewModuleTitle(e.target.value)}
                                            placeholder="e.g. Advanced Thermodynamics"
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-border focus:ring-1 focus:ring-primary outline-none"
                                            autoFocus
                                            onKeyDown={e => e.key === 'Enter' && handleAddModule()}
                                        />
                                        <button 
                                            onClick={() => setAddModuleOpen(false)}
                                            className="px-6 py-2.5 rounded-xl font-bold text-muted hover:bg-white hover:border border border-transparent transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleAddModule}
                                            className="px-8 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-navy transition-all shadow-sm"
                                        >
                                            Save Module
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setAddModuleOpen(true)}
                                    className="w-full py-6 border-2 border-dashed border-border rounded-2xl text-navy font-bold hover:bg-white hover:shadow-sm hover:border-slate-300 transition-all flex flex-col items-center justify-center gap-2 group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                        <Plus className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
                                    </div>
                                    Create New Module
                                </button>
                            )}
                        </div>
                    )}
                    </> )}
                </div>
            </div>

            <ActivityModal 
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, moduleId: null, activity: undefined })}
                existingActivity={modalState.activity}
                onSave={handleSaveActivity}
            />
        </div>
    );
}
