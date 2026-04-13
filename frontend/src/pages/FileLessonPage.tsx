import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseStore } from '../store/courseStore';
import { useProgressStore } from '../store/progressStore';
import { FileText, Download, ArrowLeft, CheckCircle2, Loader2, Maximize2, Minimize2, FileIcon, Image as ImageIcon, FileVideo, Presentation, AlertCircle } from 'lucide-react';
import api, { resolveMediaUrl } from '../lib/api';
import * as mammoth from 'mammoth/mammoth.browser';
import * as XLSX from 'xlsx';

/**
 * Detect file category from MIME type or file extension
 */
function getFileCategory(fileType?: string, fileName?: string): 'pdf' | 'image' | 'video' | 'office-doc' | 'office-docx' | 'office-ppt' | 'office-xls' | 'text' | 'unknown' {
    const mime = (fileType || '').toLowerCase();
    const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';

    if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
    if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
    if (mime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video';
    
    // Explicitly separate docx from doc for mammoth rendering
    if (ext === 'docx' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'office-docx';
    if (ext === 'doc' || mime === 'application/msword') return 'office-doc';
    
    if (mime.includes('presentation') || mime === 'application/vnd.ms-powerpoint' || ['ppt', 'pptx'].includes(ext)) return 'office-ppt';
    if (mime.includes('spreadsheet') || mime === 'application/vnd.ms-excel' || ['xls', 'xlsx', 'csv'].includes(ext)) return 'office-xls';
    if (mime.startsWith('text/') || ['txt', 'md', 'json', 'html', 'css', 'js', 'ts', 'py'].includes(ext)) return 'text';
    
    return 'unknown';
}

function getCategoryLabel(cat: string): { label: string; color: string; bg: string; icon: React.ReactNode } {
    switch (cat) {
        case 'pdf':        return { label: 'PDF Document', color: '#DC2626', bg: '#FEF2F2', icon: <FileText className="w-8 h-8 text-red-600" /> };
        case 'image':      return { label: 'Image', color: '#16A34A', bg: '#F0FDF4', icon: <ImageIcon className="w-8 h-8 text-green-600" /> };
        case 'video':      return { label: 'Video', color: '#1B3A6B', bg: '#EFF6FF', icon: <FileVideo className="w-8 h-8 text-navy" /> };
        case 'office-docx': 
        case 'office-doc': return { label: 'Word Document', color: '#2563EB', bg: '#EFF6FF', icon: <FileIcon className="w-8 h-8 text-blue-600" /> };
        case 'office-ppt': return { label: 'Presentation', color: '#D97706', bg: '#FFFBEB', icon: <Presentation className="w-8 h-8 text-amber-600" /> };
        case 'office-xls': return { label: 'Spreadsheet', color: '#16A34A', bg: '#F0FDF4', icon: <FileIcon className="w-8 h-8 text-green-600" /> };
        case 'text':       return { label: 'Text File', color: '#6B7280', bg: '#F9FAFB', icon: <FileText className="w-8 h-8 text-gray-500" /> };
        default:           return { label: 'File', color: '#6B7280', bg: '#F5F0E8', icon: <FileIcon className="w-8 h-8 text-gray-500" /> };
    }
}

// Helper: Check if running on localhost
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export default function FileLessonPage() {
    const { activityId, courseId } = useParams();
    const navigate = useNavigate();
    const { coursesList } = useCourseStore();
    const { markDone, activityStatus } = useProgressStore();

    const [apiActivity, setApiActivity] = useState<any>(null);
    const [apiCourse, setApiCourse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Parsed content for text, docx, or xlsx files
    const [textContent, setTextContent] = useState<string | null>(null);
    const [parsedDocxHtml, setParsedDocxHtml] = useState<string | null>(null);
    const [parsedXlsxHtml, setParsedXlsxHtml] = useState<string | null>(null);

    // Try to find in store first
    let storeActivity: any = null;
    let storeCourse: any = null;
    let moduleOrder = 0;
    
    if (coursesList) {
        for (const c of coursesList) {
            if (c.modules) {
                for (const m of c.modules) {
                    const a = m.activities?.find((x: any) => x.id === activityId);
                    if (a && a.type === 'file') {
                        storeActivity = a;
                        storeCourse = c;
                        moduleOrder = m.order;
                        break;
                    }
                }
            }
            if (storeActivity) break;
        }
    }

    const activity = storeActivity || apiActivity;
    const course = storeCourse || apiCourse;

    // Fetch API activity if not in store
    useEffect(() => {
        if (storeActivity || !activityId) return;
        setLoading(true);
        api.get(`/api/activities/${activityId}`)
            .then(res => {
                if (res.data.success) {
                    setApiActivity(res.data.activity);
                    setApiCourse(res.data.course);
                }
            })
            .catch(err => console.error('Failed to fetch activity:', err))
            .finally(() => setLoading(false));
    }, [activityId, storeActivity]);

    const isCompleted = activityStatus[activityId!] === 'completed';

    // Mark done when loaded
    useEffect(() => {
        if (!activity || isCompleted) return;
        markDone(activity.id, courseId);
    }, [activity, isCompleted, markDone, courseId]);

    // Parse various file types locally
    useEffect(() => {
        if (!activity?.fileUrl && !activity?.file_url) return;
        const rawUrl = activity.fileUrl || activity.file_url;
        const resolvedUrl = resolveMediaUrl(rawUrl);
        const cat = getFileCategory(activity.fileType, activity.fileName || activity.title);
        
        const fetchFileArrayBuffer = async () => {
            const res = await fetch(resolvedUrl);
            if (!res.ok) throw new Error('Network response not ok');
            return await res.arrayBuffer();
        };

        if (cat === 'text') {
            fetch(resolvedUrl)
                .then(r => r.text())
                .then(setTextContent)
                .catch(() => setTextContent('Unable to load file content.'));
        } 
        else if (cat === 'office-docx') {
            fetchFileArrayBuffer()
                .then(buffer => mammoth.convertToHtml({ arrayBuffer: buffer }))
                .then(result => setParsedDocxHtml(result.value))
                .catch(err => {
                    console.error('Docx parse error:', err);
                    setParsedDocxHtml('<p class="text-red-500 font-bold p-4">Error previewing DOCX locally. Please use the download button.</p>');
                });
        }
        else if (cat === 'office-xls') {
            fetchFileArrayBuffer()
                .then(buffer => {
                    const wb = XLSX.read(buffer, { type: 'array' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const htmlStr = XLSX.utils.sheet_to_html(ws, { id: 'data-table', editable: false });
                    setParsedXlsxHtml(htmlStr);
                })
                .catch(err => {
                    console.error('XLSX parse error:', err);
                    setParsedXlsxHtml('<p class="text-red-500 font-bold p-4">Error previewing Spreadsheet locally. Please use the download button.</p>');
                });
        }
    }, [activity?.fileUrl, activity?.file_url, activity?.fileType, activity?.fileName, activity?.title]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!activity || !course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
                <p className="text-xl font-serif text-accent font-bold mb-4">Lesson component not found.</p>
                <button onClick={() => navigate(-1)} className="text-primary hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        );
    }

    const rawFileUrl = activity.fileUrl || activity.file_url || '';
    const fileUrl = rawFileUrl ? resolveMediaUrl(rawFileUrl) : '';
    const fileName = activity.fileName || activity.file_name || activity.title;
    const fileType = activity.fileType || activity.file_type || '';
    const fileSize = activity.fileSize || activity.file_size;

    const category = getFileCategory(fileType, fileName);
    const catConfig = getCategoryLabel(category);

    // Build Google Docs Viewer URL for Office files
    const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    // Build Office Online Viewer URL (alternative)
    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

    const renderViewer = () => {
        if (!fileUrl) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-4 sm:p-12 text-center">
                    <FileText className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="font-serif font-bold text-xl text-navy mb-2">No file uploaded</h3>
                    <p className="text-muted">This activity doesn't have a file attached yet.</p>
                </div>
            );
        }

        switch (category) {
            case 'pdf':
                return (
                    <iframe
                        src={fileUrl}
                        className="w-full h-full border-0"
                        title={activity.title}
                        style={{ minHeight: isFullscreen ? '100vh' : '700px' }}
                    />
                );

            case 'image':
                return (
                    <div className="flex items-center justify-center h-full p-4 sm:p-8 bg-slate-900/5 min-h-[50vh]">
                        <img
                            src={fileUrl}
                            alt={activity.title}
                            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
                        />
                    </div>
                );

            case 'video':
                return (
                    <div className="flex items-center justify-center h-full bg-black min-h-[50vh]">
                        <video
                            src={fileUrl}
                            controls
                            className="w-full max-h-[80vh]"
                            controlsList="nodownload"
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                );

            case 'office-docx':
                if (parsedDocxHtml) {
                    return (
                        <div className="w-full h-full overflow-y-auto bg-slate-100 p-2 sm:p-8">
                            <div 
                                className="max-w-4xl mx-auto bg-white shadow-lg border border-slate-200 p-8 sm:p-16 prose prose-slate max-w-none"
                                style={{ minHeight: '800px' }}
                                dangerouslySetInnerHTML={{ __html: parsedDocxHtml }} 
                            />
                        </div>
                    );
                }
                return (
                    <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                        <p className="text-muted font-medium">Parsing Word document locally...</p>
                    </div>
                );

            case 'office-xls':
                if (parsedXlsxHtml) {
                    return (
                        <div className="w-full h-full overflow-auto bg-white p-2 sm:p-6" style={{ minHeight: '600px' }}>
                            <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
                                <style>
                                    {`
                                    #data-table { border-collapse: collapse; width: 100%; font-size: 14px; text-align: left; }
                                    #data-table td, #data-table th { border: 1px solid #e2e8f0; padding: 8px 12px; }
                                    #data-table tr:nth-child(even) { background-color: #f8fafc; }
                                    #data-table tr:hover { background-color: #f1f5f9; }
                                    `}
                                </style>
                                <div dangerouslySetInnerHTML={{ __html: parsedXlsxHtml }} />
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                        <p className="text-muted font-medium">Parsing Spreadsheet locally...</p>
                    </div>
                );

            case 'office-doc':
            case 'office-ppt':
                return (
                    <div className="w-full h-full flex flex-col bg-slate-50 relative">
                        {isLocalhost && (
                            <div className="bg-amber-100 border-b border-amber-200 px-4 py-3 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-900 leading-snug">
                                    <strong>Localhost Warning:</strong> Google/Office previews cannot access files on <code>localhost</code>. 
                                    The preview below will fail. Please <strong>Download</strong> the file to view it during local development. (It will work perfectly once deployed publicly).
                                </div>
                            </div>
                        )}
                        <div className="bg-white border-b border-border px-4 py-2 flex items-center justify-between shadow-sm z-10">
                            <span className="text-xs font-bold text-muted truncate pr-2">
                                Viewing via Google Docs Viewer
                            </span>
                            <div className="flex gap-2 shrink-0">
                                <a
                                    href={fileUrl}
                                    download
                                    className="text-xs font-bold text-primary hover:underline"
                                >
                                    Force Download
                                </a>
                            </div>
                        </div>
                        <iframe
                            src={googleViewerUrl}
                            className="w-full flex-1 border-0"
                            title={activity.title}
                            style={{ minHeight: isFullscreen ? 'calc(100vh - 40px)' : '660px' }}
                            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        />
                    </div>
                );

            case 'text':
                return (
                    <div className="p-4 sm:p-8 overflow-auto h-full bg-white" style={{ minHeight: isFullscreen ? '100vh' : '50vh' }}>
                        <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm text-navy leading-relaxed bg-slate-50 p-4 sm:p-6 rounded-xl border border-border">
                            {textContent || 'Loading...'}
                        </pre>
                    </div>
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full p-8 sm:p-12 text-center min-h-[50vh]">
                        <FileIcon className="w-16 h-16 text-slate-300 mb-4" />
                        <h3 className="font-serif font-bold text-xl text-navy mb-2">Preview not available</h3>
                        <p className="text-muted mb-6 max-w-md">
                            This file type ({fileType || 'unknown'}) cannot be previewed inline. Please download it to view.
                        </p>
                        <a
                            href={fileUrl}
                            download
                            className="px-6 py-3 bg-primary hover:bg-navy text-white font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2 mx-auto"
                        >
                            <Download className="w-5 h-5" />
                            Download File
                        </a>
                    </div>
                );
        }
    };

    // Fullscreen mode
    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-50 bg-white flex flex-col">
                <div className="bg-navy text-white px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-md">
                    <div className="flex items-center gap-3 w-full max-w-[70%]">
                        <button onClick={() => setIsFullscreen(false)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors shrink-0">
                            <Minimize2 className="w-5 h-5" />
                        </button>
                        <h1 className="font-serif font-bold text-sm truncate">{activity.title}</h1>
                    </div>
                    <a href={fileUrl} download className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-colors shrink-0">
                        <Download className="w-4 h-4 hidden sm:block" /> Download
                    </a>
                </div>
                <div className="flex-1 overflow-hidden relative">
                    {renderViewer()}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-surface pb-24 flex flex-col relative w-full overflow-x-hidden">
            {/* Header */}
            <div className="bg-white border-b border-border sticky top-0 z-20 shadow-sm px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    <button onClick={() => navigate(`/course/${course?.id}`)} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-colors text-navy shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-muted truncate">Module {moduleOrder} · {catConfig.label}</p>
                        <h1 className="font-serif font-bold text-navy text-base sm:text-lg leading-tight truncate">{activity.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                    {isCompleted && (
                        <span className="flex items-center gap-1.5 sm:gap-2 text-success font-bold text-xs sm:text-sm bg-success/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-success/20">
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                            <span className="hidden sm:inline">Completed</span>
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">

                {/* File Info Bar */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full">
                        <div className="p-3 rounded-xl shrink-0" style={{ backgroundColor: catConfig.bg }}>
                            {catConfig.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="font-serif font-bold text-navy text-base sm:text-lg leading-tight truncate w-full">{fileName}</h2>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted mt-1 sm:mt-1.5">
                                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap" style={{ color: catConfig.color, backgroundColor: catConfig.bg }}>
                                    {catConfig.label}
                                </span>
                                {fileSize && (
                                    <>
                                        <span className="hidden sm:inline">•</span>
                                        <span className="whitespace-nowrap">{typeof fileSize === 'number' ? `${(fileSize / 1024 / 1024).toFixed(1)} MB` : fileSize}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                        <button
                            onClick={() => setIsFullscreen(true)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-navy bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-border"
                        >
                            <Maximize2 className="w-4 h-4" /> <span className="hidden sm:inline">Fullscreen</span>
                        </button>
                        <a
                            href={fileUrl}
                            download
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-primary hover:bg-navy text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm"
                        >
                            <Download className="w-4 h-4" /> Download
                        </a>
                    </div>
                </div>

                {/* Inline Viewer */}
                <div className="flex-1 bg-white rounded-2xl border border-border shadow-sm overflow-hidden relative" style={{ minHeight: '500px' }}>
                    {renderViewer()}
                </div>

            </div>
        </div>
    );
}
