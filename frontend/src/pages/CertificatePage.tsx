import React, { useEffect, useState } from 'react';
import { courses, tenants, Course } from '../lib/mockData';
import { useAuthStore } from '../store/authStore';
import { Printer, GraduationCap, Award, X } from 'lucide-react';
import api from '../lib/api';

interface Certificate {
    id: string;
    course_id: string;
    issue_date: number;
}

export default function CertificatePage() {
    const { user } = useAuthStore();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

    const tenant = tenants.find((t: any) => t.id === user?.tenantId);

    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                const res = await api.get('/api/certificates');
                if (res.data.success) {
                    setCertificates(res.data.certificates || []);
                }
            } catch (err) {
                console.error("Failed to fetch certificates", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCertificates();
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-surface flex items-center justify-center p-8"><p>Loading certificates...</p></div>;
    }

    if (!user || !tenant) return null;

    if (certificates.length === 0) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8">
                <div className="bg-card p-12 rounded-2xl shadow-sm border border-border text-center max-w-md">
                    <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <GraduationCap className="w-8 h-8 text-navy" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-navy mb-4">No Certificates Yet</h2>
                    <p className="text-muted">No certificates earned yet. Complete a course to earn your certificate.</p>
                </div>
            </div>
        );
    }

    const handlePrint = () => {
        window.print();
    };

    if (selectedCert) {
        const course = courses.find((c: Course) => c.id === selectedCert.course_id);
        const issueDateString = new Date(selectedCert.issue_date * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        return (
            <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-8 print:p-0 print:bg-white overflow-y-auto">
                <div className="absolute top-6 right-6 flex gap-4 print:hidden">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-highlight hover:bg-yellow-500 text-navy font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg"
                    >
                        <Printer className="w-5 h-5" /> Download / Print
                    </button>
                    <button
                        onClick={() => setSelectedCert(null)}
                        className="flex items-center justify-center w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="w-full max-w-5xl bg-white p-4 shadow-2xl relative print:shadow-none print:w-full print:max-w-none print:m-0 aspect-[1.4/1] rounded-sm flex-shrink-0">
                    <div className="absolute inset-4 border-[16px] border-double border-yellow-600/60 pointer-events-none" />
                    <div className="absolute inset-8 border border-yellow-600/30 pointer-events-none" />

                    <div className="h-full w-full flex flex-col items-center justify-center text-center p-16 bg-slate-50 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-700"></div>
                        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-700"></div>

                        <Award className="w-20 h-20 text-yellow-600 mb-6 opacity-80" strokeWidth={1.5} />
                        
                        <h2 className="text-2xl font-bold tracking-[0.2em] text-yellow-700 uppercase mb-4">
                            CERTIFICATE OF
                        </h2>
                        <h1 className="text-6xl md:text-7xl font-serif font-bold text-navy mb-12">
                            COMPLETION
                        </h1>

                        <p className="text-xl text-slate-600 italic font-serif mb-6">This certifies that</p>

                        <p className="text-5xl font-serif font-bold text-navy border-b-2 border-yellow-600/40 pb-4 px-16 inline-block mb-10 text-center w-3/4 truncate">
                            {user.name}
                        </p>

                        <p className="text-xl text-slate-600 italic font-serif mb-6">has successfully completed</p>

                        <h3 className="text-3xl font-serif font-bold text-slate-800 mb-12 w-3/4 leading-snug">
                            {course?.name}
                        </h3>

                        <div className="flex justify-between items-center w-full max-w-3xl border-t border-slate-200 pt-8 mt-auto px-8 relative">
                            <div className="text-center w-56 flex flex-col items-center">
                                <p className="text-slate-800 font-bold mb-1 text-lg">{issueDateString}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Completed On</p>
                            </div>

                            <div className="text-center flex flex-col items-center gap-1">
                                <div className="text-2xl font-bold tracking-widest text-navy uppercase opacity-90">{tenant.name}</div>
                            </div>
                            
                            <div className="text-center w-56 flex flex-col items-center">
                                <p className="text-slate-800 font-mono text-xs mb-1 truncate w-full">{selectedCert.id}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Certificate ID</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface p-8 space-y-12">
            
            <div className="max-w-5xl mx-auto space-y-2 mb-8">
                <h1 className="text-3xl font-serif font-bold text-navy">My Certificates</h1>
                <p className="text-muted">You have successfully earned {certificates.length} certificates.</p>
            </div>

            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map(cert => {
                    const course = courses.find((c: Course) => c.id === cert.course_id);
                    if (!course) return null;

                    const issueDateString = new Date(cert.issue_date * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

                    return (
                        <div key={cert.id} className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center mb-6 border border-yellow-100">
                                <Award className="w-6 h-6 text-yellow-600" />
                            </div>
                            
                            <h3 className="font-serif font-bold text-navy text-xl leading-tight mb-2 flex-grow">
                                {course.name}
                            </h3>
                            
                            <div className="flex items-center gap-2 text-sm text-muted font-medium mb-8">
                                <span className="bg-surface px-2 py-1 rounded-md border border-border">Issued: {issueDateString}</span>
                            </div>
                            
                            <button
                                onClick={() => setSelectedCert(cert)}
                                className="w-full bg-navy hover:bg-primary text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-sm"
                            >
                                View Certificate
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
