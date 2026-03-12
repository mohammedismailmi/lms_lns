import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { TenantContextProvider } from './context/TenantContext';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';

import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import LearnerDashboard from './pages/LearnerDashboard';
import Unauthorized from './pages/Unauthorized';

// Placeholders until we build them
const CoursePage = () => <div className="p-8 font-serif text-2xl">Course Page Placeholder</div>;
const QuizPage = () => <div className="p-8 font-serif text-2xl">Quiz Page Placeholder</div>;
const ExamPage = () => <div className="p-8 font-serif text-2xl">Exam Page Placeholder</div>;
const CertificatePage = () => <div className="p-8 font-serif text-2xl">Certificate Page Placeholder</div>;

export default function App() {
    return (
        <TenantContextProvider>
            <Routes>
                {/* Redirect root to login */}
                <Route path="/" element={<Navigate to="/login" replace />} />

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

                {/* Protected App Routes enclosed in Custom Layout */}
                <Route element={<Layout />}>
                    <Route element={<ProtectedRoute allowedRoles={['admin', 'instructor', 'learner']} />}>
                        <Route path="/dashboard/learner" element={<LearnerDashboard />} />
                        <Route path="/courses" element={<HomePage />} />
                        <Route path="/course/:courseId" element={<CoursePage />} />
                        <Route path="/certificate/:courseId" element={<CertificatePage />} />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['admin', 'instructor']} />}>
                        <Route path="/dashboard/instructor" element={<InstructorDashboard />} />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path="/dashboard/admin" element={<AdminDashboard />} />
                    </Route>

                    {/* Fallback for generic dashboard/courses paths */}
                    <Route path="/dashboard" element={<Navigate to="/dashboard/learner" replace />} />
                </Route>
            </Routes>
        </TenantContextProvider>
    );
}
