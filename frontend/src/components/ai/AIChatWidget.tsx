import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import { useCourseStore } from '../../store/courseStore';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

function getPageContext(pathname: string, params: any): { page: string; courseId?: string } {
    if (pathname.includes('/course/')) return { page: 'course', courseId: params.courseId || params.id };
    if (pathname.includes('/admin')) return { page: 'admin' };
    if (pathname.includes('/certificate')) return { page: 'certificate' };
    if (pathname.includes('/quiz') || pathname.includes('/exam')) return { page: 'quiz' };
    return { page: 'dashboard' };
}

function getContextLabel(ctx: { page: string; courseId?: string }) {
    if (ctx.page === 'course') return 'Course View';
    if (ctx.page === 'admin') return 'Admin Panel';
    if (ctx.page === 'certificate') return 'Certificates';
    if (ctx.page === 'quiz') return 'Quiz Mode';
    return 'Dashboard';
}

export default function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const location = useLocation();
    const params = useParams();
    const { fetchCourse } = useCourseStore();

    const ctx = getPageContext(location.pathname, params);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) inputRef.current.focus();
    }, [isOpen]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim(), timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/api/ai/chat', { message: userMsg.content, context: ctx });
            if (res.data.success) {
                setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: res.data.reply, timestamp: new Date() }]);
                if (res.data.executed && ctx.courseId) {
                    fetchCourse(ctx.courseId);
                }
            } else {
                setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: res.data.message || 'Sorry, I could not process that.', timestamp: new Date() }]);
            }
        } catch (err: any) {
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Connection error. Please try again.', timestamp: new Date() }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-navy text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center group"
                    title="Academic Assistant"
                >
                    <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                </button>
            )}

            {/* Chat Drawer */}
            {isOpen && (
                <div className="fixed bottom-0 right-0 z-50 w-[380px] h-full max-h-screen bg-white shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <div className="bg-navy text-white p-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-sm">Academic Assistant</h3>
                                <p className="text-[11px] text-white/60">Context: {getContextLabel(ctx)}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors p-1">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.length === 0 && (
                            <div className="text-center py-12">
                                <Bot className="w-12 h-12 text-primary/30 mx-auto mb-3" />
                                <p className="text-sm text-muted font-serif">Ask me anything about your courses, assignments, or progress.</p>
                                <div className="mt-4 space-y-2">
                                    {['What are my pending tasks?', 'Summarize my progress', 'Help me study for my exam'].map(q => (
                                        <button
                                            key={q}
                                            onClick={() => { setInput(q); }}
                                            className="block w-full text-left text-xs bg-white border border-border rounded-lg px-3 py-2 text-muted hover:text-navy hover:border-primary/30 transition-colors"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-primary text-white rounded-br-md'
                                        : 'bg-white border border-border text-ink rounded-bl-md shadow-sm'
                                }`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-border bg-white shrink-0">
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask a question..."
                                className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted"
                                disabled={loading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || loading}
                                className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-navy transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
