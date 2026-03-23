import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    MessageSquare, 
    ArrowLeft, 
    Send, 
    User, 
    Clock, 
    Plus,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    MoreVertical
} from 'lucide-react';
import { toast } from '../lib/useToast';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useCourseStore } from '../store/courseStore';

interface Question {
    id: string;
    title: string;
    content: string;
    user_id: string;
    user_name: string;
    created_at: number;
}

interface Answer {
    id: string;
    content: string;
    user_id: string;
    user_name: string;
    user_role: string;
    created_at: number;
}

export default function CourseQnAPage() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { coursesList, fetchCourse } = useCourseStore();
    
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAskForm, setShowAskForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
    const [replyContent, setReplyContent] = useState<Record<string, string>>({});

    const course = coursesList.find(c => c.id === courseId);

    useEffect(() => {
        if (courseId) {
            fetchQuestions();
            if (!course) fetchCourse(courseId);
        }
    }, [courseId]);

    const fetchQuestions = async () => {
        try {
            const res = await api.get(`/api/courses/${courseId}/questions`);
            if (res.data.success) {
                setQuestions(res.data.questions);
            }
        } catch (err) {
            toast.error('Failed to load questions');
        } finally {
            setLoading(false);
        }
    };

    const fetchAnswers = async (questionId: string) => {
        try {
            const res = await api.get(`/api/questions/${questionId}/answers`);
            if (res.data.success) {
                setAnswers(prev => ({ ...prev, [questionId]: res.data.answers }));
            }
        } catch (err) {
            toast.error('Failed to load answers');
        }
    };

    const handleAskQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim()) return;

        try {
            const res = await api.post(`/api/courses/${courseId}/questions`, {
                title: newTitle,
                content: newContent
            });
            if (res.data.success) {
                toast.success('Question posted!');
                setNewTitle('');
                setNewContent('');
                setShowAskForm(false);
                fetchQuestions();
            }
        } catch (err) {
            toast.error('Failed to post question');
        }
    };

    const handlePostAnswer = async (questionId: string) => {
        const content = replyContent[questionId];
        if (!content?.trim()) return;

        try {
            const res = await api.post(`/api/questions/${questionId}/answers`, { content });
            if (res.data.success) {
                toast.success('Reply posted!');
                setReplyContent(prev => ({ ...prev, [questionId]: '' }));
                fetchAnswers(questionId);
            }
        } catch (err) {
            toast.error('Failed to post reply');
        }
    };

    const toggleExpand = (questionId: string) => {
        if (expandedQuestionId === questionId) {
            setExpandedQuestionId(null);
        } else {
            setExpandedQuestionId(questionId);
            if (!answers[questionId]) {
                fetchAnswers(questionId);
            }
        }
    };

    const formatDate = (ts: number) => {
        const date = new Date(ts * 1000);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-surface pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(`/course/${courseId}`)}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-serif font-bold text-navy truncate max-w-[400px]">
                                Q&A: {course?.name}
                            </h1>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> {questions.length} Questions
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowAskForm(!showAskForm)}
                        className="bg-navy text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-navy-light transition-all shadow-sm"
                    >
                        {showAskForm ? 'Close' : <><Plus className="w-4 h-4" /> Ask a Question</>}
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 mt-8">
                {/* Ask Form */}
                {showAskForm && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <h2 className="text-lg font-bold text-navy mb-4">What's your question?</h2>
                        <form onSubmit={handleAskQuestion} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input 
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="e.g. How do I optimize my React rendering?"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy/10 focus:border-navy outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Details</label>
                                <textarea 
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    placeholder="Describe your question in detail..."
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy/10 focus:border-navy outline-none transition-all resize-none"
                                    required
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <button 
                                    type="submit"
                                    className="bg-navy text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-navy-light transition-all shadow-md"
                                >
                                    Post Question <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Questions List */}
                <div className="space-y-6">
                    {questions.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-navy mb-2">No questions yet</h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Be the first one to start a discussion! Your instructors and peers are here to help.
                            </p>
                        </div>
                    ) : (
                        questions.map(q => (
                            <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:border-slate-300">
                                <div 
                                    className="p-6 cursor-pointer"
                                    onClick={() => toggleExpand(q.id)}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <User className="w-3 h-3 text-slate-500" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{q.user_name}</span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {formatDate(q.created_at)}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-navy mb-2 group-hover:text-highlight transition-colors">
                                                {q.title}
                                            </h3>
                                            <p className={`text-slate-600 text-sm ${expandedQuestionId === q.id ? '' : 'line-clamp-2'}`}>
                                                {q.content}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 text-slate-400">
                                            {expandedQuestionId === q.id ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                                {answers[q.id]?.length || 0} Replies
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Answers Section */}
                                {expandedQuestionId === q.id && (
                                    <div className="bg-slate-50/50 border-t border-slate-100 p-6 animate-in fade-in duration-300">
                                        <div className="space-y-6 mb-8">
                                            {answers[q.id]?.map(a => (
                                                <div key={a.id} className="flex gap-4">
                                                    <div className="flex-shrink-0">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${a.user_role === 'instructor' || a.user_role === 'admin' ? 'bg-navy text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                            <User className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-bold text-slate-900">{a.user_name}</span>
                                                            {(a.user_role === 'instructor' || a.user_role === 'admin') && (
                                                                <span className="bg-navy/10 text-navy text-[10px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-0.5">
                                                                    <CheckCircle className="w-2.5 h-2.5" /> Staff
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-slate-400">• {formatDate(a.created_at)}</span>
                                                        </div>
                                                        <div className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                                            {a.content}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Reply Box */}
                                        <div className="flex gap-4 items-start pt-2">
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white">
                                                    <User className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <div className="flex-1 relative">
                                                <textarea 
                                                    value={replyContent[q.id] || ''}
                                                    onChange={(e) => setReplyContent(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                    placeholder="Write your response..."
                                                    className="w-full px-4 py-3 pr-14 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-navy/10 focus:border-navy outline-none transition-all resize-none text-sm"
                                                    rows={2}
                                                />
                                                <button 
                                                    onClick={() => handlePostAnswer(q.id)}
                                                    disabled={!replyContent[q.id]?.trim()}
                                                    className="absolute right-3 bottom-3 p-2 bg-navy text-white rounded-xl hover:bg-navy-light disabled:opacity-30 disabled:hover:bg-navy transition-all shadow-sm"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
