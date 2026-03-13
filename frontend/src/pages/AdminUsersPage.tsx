import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCourseStore } from '../store/courseStore';
import { useToast } from '../lib/useToast';
import { Role, User } from '../lib/mockData';
import { Search, Plus, UserMinus, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import AddUserModal from '../components/admin/AddUserModal';
import { cn } from '../lib/utils';

export default function AdminUsersPage() {
    const { usersList, updateUserRole } = useAuthStore();
    const { getAllCourses, enrolledCourseIds, enrollUser, unenrollUser } = useCourseStore();
    const toast = useToast();

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    
    // UI tracking state
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [assignMenuOpenId, setAssignMenuOpenId] = useState<string | null>(null);
    const [confirmRemoveRole, setConfirmRemoveRole] = useState<string | null>(null);

    const allCourses = getAllCourses();

    const filteredUsers = usersList.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRolePillColor = (role: string) => {
        if (role === 'admin') return 'bg-accent text-white';
        if (role === 'instructor') return 'bg-primary text-white';
        return 'bg-success text-white';
    };

    const handleRoleChange = (userId: string, newRole: Role) => {
        updateUserRole(userId, newRole);
        toast.success('User role updated successfully');
    };

    const handleRemoveRole = (userId: string) => {
        updateUserRole(userId, 'learner'); // Base level
        setConfirmRemoveRole(null);
        toast.success('Role removed, user reverted to Learner');
    };

    const renderRoleDropdown = (user: User) => (
        <select 
            className="text-sm bg-surface border border-border rounded px-2 py-1 outline-none cursor-pointer focus:border-primary transition-colors"
            value={user.role}
            onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
        >
            <option value="admin">Admin</option>
            <option value="instructor">Instructor</option>
            <option value="learner">Learner</option>
        </select>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-navy">Manage Users</h2>
                    <p className="text-muted text-sm mt-1">Add, edit, and orchestrate platform user roles and enrollments.</p>
                </div>
                <button 
                    onClick={() => setAddModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-navy transition-colors font-medium shadow-sm w-max"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add User</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-border flex flex-col md:flex-row gap-4 mb-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-surface text-ink placeholder:text-muted rounded-lg py-2 pl-10 pr-4 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all"
                    />
                </div>
                <div className="w-full md:w-48">
                    <select 
                        value={roleFilter} 
                        onChange={(e) => setRoleFilter(e.target.value as any)}
                        className="w-full bg-surface border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="instructor">Instructor</option>
                        <option value="learner">Learner</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-border text-navy uppercase font-bold tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Tenant</th>
                                <th className="px-6 py-4">Courses</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-muted font-serif">
                                        No users found.
                                    </td>
                                </tr>
                            ) : null}
                            
                            {filteredUsers.map(user => {
                                const enrolledUserCourses = enrolledCourseIds[user.id] || [];
                                const isExpanded = expandedRow === user.id;

                                return (
                                    <React.Fragment key={user.id}>
                                        <tr className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-serif shrink-0">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-navy">{user.name}</p>
                                                        <p className="text-xs text-muted">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', getRolePillColor(user.role))}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-muted font-medium bg-surface px-2 py-1 rounded border border-border">{user.tenantId}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => setExpandedRow(isExpanded ? null : user.id)}
                                                    className="flex items-center gap-1.5 text-primary hover:text-navy transition-colors font-medium bg-primary/5 px-2 py-1 rounded-lg"
                                                >
                                                    {enrolledUserCourses.length} Enrolled
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    {renderRoleDropdown(user)}

                                                    {confirmRemoveRole === user.id ? (
                                                        <div className="flex items-center gap-2 bg-accent/10 px-2 py-1 rounded border border-accent/20">
                                                            <span className="text-xs text-accent font-bold">Remove role?</span>
                                                            <button className="text-xs text-accent hover:underline font-bold" onClick={() => handleRemoveRole(user.id)}>Yes</button>
                                                            <button className="text-xs text-muted hover:underline" onClick={() => setConfirmRemoveRole(null)}>Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => setConfirmRemoveRole(user.id)}
                                                            className="text-muted hover:text-accent p-1 transition-colors"
                                                            title="Remove Role (Demote to Learner)"
                                                        >
                                                            <UserMinus className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        
                                        {/* Expanded Row for assigning/removing courses */}
                                        {isExpanded && (
                                            <tr className="bg-slate-50 border-b border-border shadow-inner">
                                                <td colSpan={5} className="px-6 py-4">
                                                    <div className="flex flex-col gap-4 pl-11">
                                                        
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="font-serif font-bold text-navy text-sm">Active Enrollments</h4>
                                                            <div className="relative">
                                                                <button 
                                                                    onClick={() => setAssignMenuOpenId(assignMenuOpenId === user.id ? null : user.id)}
                                                                    className="text-sm font-medium bg-white border border-border px-3 py-1.5 rounded-lg text-primary hover:bg-surface transition-colors shadow-sm"
                                                                >
                                                                    {user.role === 'instructor' ? 'Assign as Faculty' : 'Assign Course'}
                                                                </button>
                                                                
                                                                {/* Assign Course Dropdown */}
                                                                {assignMenuOpenId === user.id && (
                                                                    <div className="absolute right-0 mt-2 w-64 bg-white border border-border rounded-xl shadow-xl z-10 max-h-64 overflow-y-auto">
                                                                        <div className="p-2 border-b border-border bg-surface font-bold text-xs text-navy uppercase tracking-wider sticky top-0 z-10">Select Course</div>
                                                                        {allCourses.filter(c => !enrolledUserCourses.includes(c.id)).map(course => (
                                                                            <button 
                                                                                key={course.id}
                                                                                onClick={() => {
                                                                                    enrollUser(user.id, course.id);
                                                                                    toast.success(`Assigned ${course.name} to ${user.name}`);
                                                                                    setAssignMenuOpenId(null);
                                                                                }}
                                                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium text-navy border-b border-border last:border-0 truncate"
                                                                            >
                                                                                {course.name}
                                                                            </button>
                                                                        ))}
                                                                        {allCourses.filter(c => !enrolledUserCourses.includes(c.id)).length === 0 && (
                                                                             <div className="p-4 text-center text-xs text-muted">No courses left to assign.</div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {enrolledUserCourses.length === 0 ? (
                                                            <p className="text-sm text-muted">User is not associated with any courses.</p>
                                                        ) : (
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                                                {enrolledUserCourses.map(courseId => {
                                                                    const c = allCourses.find(x => x.id === courseId);
                                                                    if (!c) return null;
                                                                    return (
                                                                        <div key={courseId} className="flex items-center justify-between bg-white border border-border p-3 rounded-lg shadow-sm">
                                                                            <span className="text-sm font-bold text-navy truncate flex-1 pr-2">{c.name}</span>
                                                                            <button 
                                                                                onClick={() => {
                                                                                    unenrollUser(user.id, courseId);
                                                                                    toast.info(`Removed ${user.name} from ${c.name}`);
                                                                                }}
                                                                                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0"
                                                                            >
                                                                                <X className="w-3 h-3" /> Remove
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddUserModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} />
        </div>
    );
}
