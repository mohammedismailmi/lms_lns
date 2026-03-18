import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { TenantContextProvider } from './context/TenantContext';
import { useAuthStore } from './store/authStore';

import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';
import ToastProvider from './components/ui/ToastProvider';

import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import LearnerHomePage from './pages/LearnerHomePage';
import InstructorHomePage from './pages/InstructorHomePage';
import AdminDashboard from './pages/AdminDashboard'; // .tsx with real API data
import AdminUsersPage from './pages/AdminUsersPage';
import AdminCoursesPage from './pages/AdminCoursesPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import TenantComingSoonPage from './pages/TenantComingSoonPage';

import CoursePage from './pages/CoursePage';
import QuizPage from './pages/QuizPage';
import ExamPage from './pages/ExamPage';
import CertificatePage from './pages/CertificatePage';

import BlogLessonPage from './pages/BlogLessonPage';
import FileLessonPage from './pages/FileLessonPage';
import VideoLessonPage from './pages/VideoLessonPage';

import Unauthorized from './pages/Unauthorized';

import AdminCoursesOverviewPage from './pages/AdminCoursesOverviewPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

// Smart redirector for root `/` handling role-based routing
const RoleRootRedirect = () => {
    const { user, isAuthenticated } = useAuthStore();
    if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
    if (user.role === 'super_admin') return <Navigate to="/superadmin" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'instructor') return <Navigate to="/teaching" replace />;
    return <Navigate to="/home" replace />; // learner fallback
};

// Smart redirector for `/courses` handling admin vs learner
const CoursesRouteDirect = () => {
    const { user } = useAuthStore();
    if (user?.role === 'admin') return <AdminCoursesPage />;
    return <Navigate to="/home" replace />;
};

export default function App() {
    const { hydrate, isLoading } = useAuthStore();

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-serif italic animate-pulse">Initializing academia platform...</p>
            </div>
        );
    }

    return (
        <TenantContextProvider>
            <ToastProvider>
                <Routes>
                    {/* Public Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* Fullscreen Protected Routes outside Sidebar Layout */}
                    <Route element={<ProtectedRoute allowedRoles={['admin', 'instructor', 'learner']} />}>
                        <Route path="/quiz/:id" element={<QuizPage />} />
                        <Route path="/exam/:id" element={<ExamPage />} />
                    </Route>

                    {/* Super Admin Route — standalone, no sidebar */}
                    <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                        <Route path="/superadmin" element={<SuperAdminDashboard />} />
                    </Route>

                    {/* Protected App Routes enclosed in Custom Layout */}
                    <Route element={<Layout />}>
                        <Route path="/" element={<RoleRootRedirect />} />

                        <Route element={<ProtectedRoute allowedRoles={['learner', 'admin']} />}>
                            <Route path="/home" element={<LearnerHomePage />} />
                        </Route>

                        <Route element={<ProtectedRoute allowedRoles={['instructor', 'admin']} />}>
                            <Route path="/teaching" element={<InstructorHomePage />} />
                            <Route path="/teaching/progress" element={<div className="p-8 font-serif text-2xl text-center mt-20">Coming Soon</div>} />
                            <Route path="/teaching/announcements" element={<div className="p-8 font-serif text-2xl text-center mt-20">Coming Soon</div>} />
                        </Route>

                        <Route element={<ProtectedRoute allowedRoles={['admin', 'instructor', 'learner']} />}>
                            <Route path="/dashboard" element={<Dashboard />} />

                            <Route path="/course/:courseId" element={<CoursePage />} />
                            <Route path="/certificates" element={<CertificatePage />} />

                            <Route path="/lesson/blog/:activityId" element={<BlogLessonPage />} />
                            <Route path="/lesson/file/:activityId" element={<FileLessonPage />} />
                            <Route path="/lesson/video/:activityId" element={<VideoLessonPage />} />
                        </Route>

                        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="/admin/users" element={<AdminUsersPage />} />
                            <Route path="/admin/courses" element={<AdminCoursesPage />} />
                            <Route path="/admin/tenants" element={<TenantComingSoonPage />} />
                            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                        </Route>

                        {/* Route accessible by admin, effectively disabled for learners via CoursesRouteDirect */}
                        <Route element={<ProtectedRoute allowedRoles={['admin', 'instructor', 'learner']} />}>
                            <Route path="/courses" element={<CoursesRouteDirect />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </ToastProvider>
        </TenantContextProvider>
    );
}
