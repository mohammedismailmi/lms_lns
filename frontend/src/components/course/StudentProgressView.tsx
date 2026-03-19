import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Loader2, Users } from 'lucide-react';

interface StudentRow {
    userId: string;
    name: string;
    email: string;
    completed: number;
    total: number;
    percent: number;
}

export default function StudentProgressView({ courseId }: { courseId: string }) {
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/api/courses/${courseId}/student-progress`)
            .then(res => {
                if (res.data.success) setStudents(res.data.students ?? []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [courseId]);

    if (loading) return (
        <div className="flex items-center justify-center py-16 text-muted">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading student progress...
        </div>
    );

    if (students.length === 0) return (
        <div className="text-center py-16">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="font-serif text-xl text-navy">No students enrolled yet</p>
            <p className="text-sm text-muted mt-1">Enrolled students and their progress will appear here.</p>
        </div>
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-navy text-lg">Enrolled Students ({students.length})</h3>
            </div>
            {students.map(student => (
                <div key={student.userId}
                    className="bg-surface border border-border rounded-xl p-5 hover:shadow-sm transition">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="font-bold text-navy">{student.name}</p>
                            <p className="text-xs text-muted">{student.email}</p>
                        </div>
                        <span className={`text-lg font-serif font-bold
                            ${student.percent === 100 ? 'text-green-600'
                            : student.percent > 50 ? 'text-yellow-600'
                            : 'text-red-600'}`}>
                            {student.percent}%
                        </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                student.percent === 100 ? 'bg-green-500'
                                : student.percent > 50 ? 'bg-yellow-500'
                                : 'bg-red-400'
                            }`}
                            style={{ width: `${student.percent}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted mt-2">
                        {student.completed} of {student.total} activities completed
                    </p>
                </div>
            ))}
        </div>
    );
}
