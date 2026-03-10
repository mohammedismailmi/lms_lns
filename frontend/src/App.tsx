import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { TenantContextProvider } from './context/TenantContext';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';

import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';

// Placeholders until we build them
const CoursePage = () => <div className="p-8 font-serif text-2xl">Course Page Placeholder</div>;
const QuizPage = () => <div className="p-8 font-serif text-2xl">Quiz Page Placeholder</div>;
const ExamPage = () => <div className="p-8 font-serif text-2xl">Exam Page Placeholder</div>;
const CertificatePage = () => <div className="p-8 font-serif text-2xl">Certificate Page Placeholder</div>;
const AdminDashboard = () => <div className="p-8 font-serif text-2xl">Admin Dashboard Placeholder</div>;

export default function App() {
    return (
        <TenantContextProvider>
            <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Fullscreen Protected Routes outside Sidebar Layout */}
                <Route path="/quiz/:id" element={<QuizPage />} />
                <Route path="/exam/:id" element={<ExamPage />} />

                {/* Protected App Routes enclosed in Custom Layout */}
                <Route element={<Layout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/course/:courseId" element={<CoursePage />} />
                    <Route path="/certificate/:courseId" element={<CertificatePage />} />
                    <Route path="/admin" element={<AdminDashboard />} />

                    {/* Mapping old dummy routes from yesterday to redirect or placeholder */}
                    <Route path="/courses" element={<HomePage />} />
                    <Route path="/dashboard" element={<HomePage />} />
                </Route>
            </Routes>
        </TenantContextProvider>
    );
}
