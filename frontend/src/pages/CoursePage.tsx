import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    LayoutList, 
    Users, 
    Plus, 
    CheckCircle, 
    Lock, 
    BookOpen, 
    Award, 
    MessageSquare,
    ChevronRight,
    Play,
    FileText,
    HelpCircle,
    Calendar,
    Clock,
    Edit2,
    Trash2
} from 'lucide-react';
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

export default function CoursePage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { getCourseProgress, recalculateCourseProgress, hydrateProgress } = useProgressStore();
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
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
        hydrateProgress();
    }, [fetchCourse, hydrateProgress]);

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
        return <div className="p-4 sm:p-8 text-center text-muted font-serif text-2xl">Loading course...</div>;
    }
    if (!course || !user) {
        return <div className="p-4 sm:p-8 text-center text-accent font-serif text-2xl">Course not found.</div>;
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
            <div className="flex h-full items-center justify-center p-4 sm:p-5 bg-surface">
                <div className="bg-white rounded-3xl shadow-premium max-w-xl w-full overflow-hidden border border-border/40">
                    <div className="bg-navy p-7 sm:p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                        <Lock className="w-10 h-10 text-highlight mx-auto mb-3 relative z-10" />
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-black text-white relative z-10 leading-tight tracking-tight">
                            {course.name}
                        </h1>
                        <p className="text-slate-300/80 mt-3 relative z-10 max-w-lg mx-auto text-xs font-medium">{course.section}</p>
                    </div>
                    <div className="p-7 sm:p-8 space-y-6">
                        <div>
                            <h3 className="text-base font-black font-serif text-navy mb-2 tracking-wide uppercase">Institutional Overview</h3>
                            <p className="text-muted leading-relaxed text-xs">
                                {course.description || "Unlock your potential through detailed rigorous tutelage by enrolling. You will gain instantaneous access to all curated course material, live webinars, and exams constructed by our high calibre instructors."}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-y border-border/40 py-4">
                            <div className="flex items-center gap-2.5">
                                <Users className="w-4 h-4 text-primary" />
                                <div>
                                    <p className="text-[8.5px] font-black text-muted uppercase tracking-widest">Faculty</p>
                                    <p className="font-bold text-navy text-xs">{course.faculty}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <BookOpen className="w-4 h-4 text-success" />
                                <div>
                                    <p className="text-[8.5px] font-black text-muted uppercase tracking-widest">Modules</p>
                                    <p className="font-bold text-navy text-xs">{course.modules.length} Segments</p>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={handleEnroll}
                            className="w-full bg-navy hover:bg-primary text-white text-base font-black py-3 rounded-xl transition-all shadow-lg shadow-navy/10 flex items-center justify-center gap-2 group active:scale-[0.98] uppercase tracking-widest text-[11px]"
                        >
                            <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                            Establish Enrollment
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-full relative w-full overflow-hidden">
            {!isInstructor && (
                <>
                    {/* Mobile sidebar toggle button */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="md:hidden fixed bottom-6 right-6 z-40 bg-primary text-white px-5 py-3 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2 transition-transform active:scale-95"
                    >
                        {sidebarOpen ? '✕ Close' : '☰ Modules'}
                    </button>

                    {/* Mobile overlay */}
                    {sidebarOpen && (
                        <div className="fixed inset-0 bg-black/60 z-20 md:hidden transition-opacity"
                             onClick={() => setSidebarOpen(false)} />
                    )}

                    <aside className={`
                        fixed md:sticky top-0 left-0 h-full md:h-[calc(100vh-4rem)]
                        w-72 md:w-64 bg-navy z-30 overflow-y-auto shadow-2xl md:shadow-none
                        transform transition-transform duration-300 ease-in-out
                        md:translate-x-0 md:flex-shrink-0
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    `}>
                        <ModuleSidebar course={course} onActivityClick={() => setSidebarOpen(false)} />
                    </aside>
                </>
            )}

            <div className="flex-1 overflow-y-auto w-full min-w-0 pb-24 md:pb-0 relative space-y-6 md:space-y-10 group">
                <div className="mx-2 md:mx-6 mt-4 md:mt-6 bg-gradient-to-br from-navy via-[#162a50] to-navy text-white px-5 md:px-8 py-6 md:py-9 rounded-3xl shadow-premium border-b-4 border-highlight/80 relative overflow-hidden transition-all duration-500">
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                    {certificateReady && (
                        <div className="mb-3 inline-flex bg-highlight text-navy px-2 py-1 rounded-lg font-black items-center gap-1.5 shadow-lg animate-in slide-in-from-top cursor-pointer hover:bg-yellow-500 transition-colors text-[8.5px] uppercase tracking-widest"
                            onClick={() => navigate(`/certificates`)}>
                            <Award className="w-3.5 h-3.5" />
                            Certificate Provisioned
                        </div>
                    )}

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 relative z-10">
                        <div className="max-w-xl min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-highlight/20 text-highlight font-black tracking-[0.2em] uppercase text-[8px] px-2 py-0.5 rounded-md border border-highlight/30">
                                    {course.category}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-black leading-[1.1] mb-3 break-words tracking-tight">
                                {course.name}
                            </h1>

                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-slate-300 font-bold text-[9px] sm:text-[10px]">
                                <span className="flex items-center gap-2 group/fac cursor-default">
                                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-white/10 flex items-center justify-center text-[9px] sm:text-[10px] text-highlight border border-white/20 shrink-0 shadow-inner group-hover/fac:scale-110 transition-transform font-black">
                                        {course.facultyInitial}
                                    </span>
                                    <span className="truncate max-w-[100px] sm:max-w-none text-white">{course.faculty}</span>
                                </span>
                                <span className="text-slate-600 font-thin opacity-30">|</span>
                                <span className="truncate max-w-[80px] sm:max-w-none opacity-70 tracking-wide">{course.section}</span>
                                <span className="text-slate-600 font-thin opacity-30">|</span>
                                <span className="flex items-center gap-1.5 whitespace-nowrap opacity-70"><Users className="w-3 h-3 text-highlight" /> {course.enrolledCount || 0} Nodes</span>
                                <span className="text-slate-600 font-thin opacity-30">|</span>
                                <Link to={`/course/${course.id}/qna`} className="flex items-center gap-1.5 text-highlight hover:text-white transition-all underline decoration-highlight/30 underline-offset-4 decoration-1 hover:decoration-white font-black uppercase tracking-tighter">
                                    <MessageSquare className="w-3 h-3" /> Q&A Index
                                </Link>
                            </div>
                        </div>

                        {isInstructor && (
                            <div className="flex flex-col gap-2.5 min-w-[200px] relative z-10">
                                <button
                                    onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                                    className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white text-white hover:text-navy font-black py-2.5 rounded-xl transition-all shadow-md backdrop-blur-sm border border-white/20 group/ann text-[9px] uppercase tracking-widest">
                                    <Plus className="w-3.5 h-3.5 group-hover/ann:rotate-90 transition-transform" /> Dispatch Broadcast
                                </button>
                                {showAnnouncementForm && (
                                    <div className="bg-card p-4 rounded-2xl border border-border shadow-2xl text-navy animate-in slide-in-from-right-4">
                                        <h4 className="font-serif font-black mb-2 text-sm tracking-wide uppercase">Broadcast Matrix</h4>
                                        <textarea
                                            value={announcementText}
                                            onChange={e => setAnnouncementText(e.target.value)}
                                            placeholder="Write message..."
                                            className="w-full bg-surface border border-border rounded-xl p-2.5 text-[10px] resize-none h-20 mb-2 focus:outline-none focus:border-primary transition-all shadow-inner font-bold"
                                        />
                                        <div className="flex justify-end gap-1.5">
                                            <button onClick={() => setShowAnnouncementForm(false)} className="px-3 py-1.5 text-[9px] text-slate-600 font-black hover:bg-slate-100 rounded-lg transition-all uppercase">Cancel</button>
                                            <button onClick={handlePostAnnouncement} disabled={postingAnnouncement} className="px-4 py-1.5 text-[9px] bg-primary text-white font-black rounded-lg transition-all shadow-lg hover:shadow-primary/30 disabled:opacity-50 uppercase">
                                                {postingAnnouncement ? '...' : 'Commit'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    <button 
                                        onClick={() => setAddModuleOpen(true)}
                                        className="flex items-center justify-center gap-1.5 bg-navy/40 hover:bg-navy/80 text-white font-black py-2.5 rounded-xl transition-all border border-white/10 text-[9px] min-h-[36px] shadow-lg backdrop-blur-sm group/mod uppercase tracking-widest"
                                    >
                                        <LayoutList className="w-3 h-3 group-hover/mod:scale-110 transition-transform" /> Module+
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('progress')}
                                        className="flex items-center justify-center gap-1.5 bg-highlight text-navy font-black py-2.5 rounded-xl hover:bg-yellow-500 transition-all border-b-2 border-yellow-700 text-[9px] min-h-[36px] shadow-lg group/prog uppercase tracking-widest"
                                    >
                                        <Users className="w-3 h-3 group-hover/prog:-translate-y-0.5 transition-transform" /> Metrics
                                    </button>
                                </div>
                                <div className="w-full scale-95 origin-right">
                                    <CourseCompleteButton courseId={course.id} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-5 py-7 max-w-4xl mx-auto space-y-7 pb-20">

                    {/* Tab bar for instructor/admin */}
                    {isInstructor && (
                        <div className="flex gap-1.5 border-b border-border/40 mb-5">
                            <button
                                onClick={() => setActiveTab('content')}
                                className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'content' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-navy'}`}
                            >
                                Curriculum Matrix
                            </button>
                            <button
                                onClick={() => setActiveTab('progress')}
                                className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'progress' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-navy'}`}
                            >
                                Analytical Metrics
                            </button>
                        </div>
                    )}

                    {activeTab === 'progress' && isInstructor ? (
                        <StudentProgressView courseId={course.id} />
                    ) : (
                    <>

                    {/* Announcements Section */}
                    {course.announcements && course.announcements.length > 0 && (
                        <div className="mb-8 space-y-4">
                            <h3 className="text-lg font-serif font-black text-navy flex items-center gap-2 uppercase tracking-wide">
                                <Award className="w-4 h-4 text-primary" /> Bulletins
                            </h3>
                            {course.announcements.map((ann: any) => (
                                <div key={ann.id} className="bg-surface border border-border/40 p-4 rounded-xl shadow-sm">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <h4 className="font-bold text-navy text-sm">{ann.title}</h4>
                                        <span className="text-[8px] font-black text-muted uppercase tracking-widest">{new Date(ann.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-700 whitespace-pre-wrap font-medium">{ann.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {course.modules.length === 0 && (
                        <div className="py-14 text-center border-2 border-dashed border-border/40 rounded-2xl bg-surface">
                            <p className="font-serif text-lg text-navy font-black opacity-40">Matrix curriculum is currently void.</p>
                            {isInstructor && <p className="text-[9px] font-black text-muted mt-2 uppercase tracking-widest">Provision a module to begin construction.</p>}
                        </div>
                    )}

                    {course.modules.map((module: any) => (
                        <div key={module.id} className="pt-3 first:pt-0 relative">

                            <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md py-3 mb-5 border-b border-border/40 flex items-center justify-between">
                                <h2 className="text-lg font-serif font-black text-navy truncate flex-1 pr-6 tracking-tight">
                                    <span className="text-muted mr-2 font-sans opacity-40 text-[9px] uppercase tracking-widest leading-none">Segment {module.order}</span>
                                    {module.title}
                                </h2>
                                <span className="text-[8.5px] font-black text-muted bg-white px-2 py-0.5 rounded-md border border-border/40 shrink-0 uppercase tracking-widest">
                                    {module.activities.length} Nodes
                                </span>
                            </div>

                            <div className="space-y-4 pl-3 md:pl-6 border-l-[1px] border-slate-200">
                                {module.activities.map((activity: any) => (
                                    <div key={activity.id} className="relative group/activity border border-transparent hover:border-border rounded-xl -ml-2 p-2 transition-all">
                                        
                                        {/* Activity Render Matrix block */}
                                        <div onClick={() => !isInstructor && !['quiz', 'exam', 'submission'].includes(activity.type) && course.id && navigate(`/course/${course.id}/lesson/${activity.type}/${activity.id}`)}
                                             className={cn("w-full transition-all", !isInstructor && !['quiz', 'exam', 'submission'].includes(activity.type) && course.id && "cursor-pointer hover:opacity-90")}>
                                            {activity.type === 'blog' && <BlogActivity activity={activity} />}
                                            {activity.type === 'file' && <FileActivity activity={activity} courseId={course.id} />}
                                            {activity.type === 'video' && <VideoActivity activity={activity} />}
                                            {activity.type === 'live_class' && <LiveClassActivity activity={activity} courseFaculty={course.faculty} />}
                                            {(activity.type === 'quiz' || activity.type === 'exam') && <AssessmentActivity activity={activity} courseId={course.id} />}
                                            {activity.type === 'submission' && <SubmissionActivity activity={activity} courseId={course.id} />}
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
                                        className="w-full py-2.5 mt-3 border-2 border-dashed border-border/30 rounded-xl text-primary/60 font-black hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Append Node to Segment {module.order}
                                    </button>
                                )}
                            </div>

                        </div>
                    ))}

                    {/* Add Module Inline Expansion */}
                    {isInstructor && (
                        <div className="pt-6 mt-6 border-t border-border/40">
                            {isAddModuleOpen ? (
                                <div className="bg-surface border border-border/40 p-5 rounded-2xl shadow-inner animate-in fade-in slide-in-from-bottom-2">
                                    <h3 className="font-serif font-black text-navy mb-3 text-sm uppercase tracking-wide">Provision New Segment</h3>
                                    <div className="flex gap-3">
                                        <input 
                                            value={newModuleTitle}
                                            onChange={e => setNewModuleTitle(e.target.value)}
                                            placeholder="Segment Identifier..."
                                            className="flex-1 px-4 py-2 rounded-xl border border-border/40 focus:ring-4 focus:ring-primary/10 outline-none text-xs font-bold"
                                            autoFocus
                                            onKeyDown={e => e.key === 'Enter' && handleAddModule()}
                                        />
                                        <button 
                                            onClick={() => setAddModuleOpen(false)}
                                            className="px-4 py-2 rounded-xl font-black text-[9px] text-muted hover:bg-white transition-all uppercase tracking-widest"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleAddModule}
                                            className="px-6 py-2 rounded-xl font-black bg-primary text-white hover:bg-navy transition-all shadow-lg shadow-primary/20 text-[9px] uppercase tracking-widest"
                                        >
                                            Commit Segment
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setAddModuleOpen(true)}
                                    className="w-full py-4 border-2 border-dashed border-border/30 rounded-2xl text-navy/40 font-black hover:bg-white hover:text-navy hover:shadow-premium hover:border-slate-300 transition-all flex flex-col items-center justify-center gap-1.5 group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                        <Plus className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                                    </div>
                                    <span className="text-[10px] uppercase tracking-widest">Provision New curriculum Segment</span>
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
