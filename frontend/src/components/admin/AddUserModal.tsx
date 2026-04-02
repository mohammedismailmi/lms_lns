import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../lib/useToast';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'instructor', 'learner']),
  tenantId: z.string().min(1, 'Tenant ID is required'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddUserModal({ isOpen, onClose }: Props) {
  const { addUser } = useAuthStore();
  const toast = useToast();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'learner', tenantId: 'uni1' } 
  });

  // Close on esc hook
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const onSubmit = (data: FormData) => {
    addUser({
      id: 'u' + Math.random().toString(36).substring(2, 9),
      ...data
    });
    toast.success('User added successfully');
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white rounded-none sm:rounded-3xl shadow-premium w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 border border-white/20" onClick={e => e.stopPropagation()}>
        <div className="p-5 sm:p-6 border-b border-border/40 bg-surface shrink-0">
          <h2 className="text-xl sm:text-2xl font-serif font-black text-navy tracking-tight">Provision User</h2>
          <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mt-0.5 opacity-60 italic">Identity & Access Management</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:p-7 space-y-5 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,_#1b3a6b05,_transparent)]">
          <div className="space-y-1.5">
            <label className="block text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-3">Full Identity Name</label>
            <input 
              {...register('name')} 
              className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner font-bold text-navy text-xs"
              placeholder="e.g. Dr. Jane Smith"
            />
            {errors.name && <p className="text-accent text-[9px] mt-1 font-black uppercase tracking-wider ml-3">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-3">Corporate Email Address</label>
            <input 
              {...register('email')} 
              className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner font-bold text-navy text-xs"
              placeholder="jane.smith@institution.edu"
            />
            {errors.email && <p className="text-accent text-[9px] mt-1 font-black uppercase tracking-wider ml-3">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-3">System Classification</label>
            <select 
              {...register('role')} 
              className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner font-bold text-navy cursor-pointer appearance-none text-xs"
            >
              <option value="learner">Learner / Student</option>
              <option value="instructor">Faculty / Instructor</option>
              <option value="admin">System Administrator</option>
            </select>
            {errors.role && <p className="text-accent text-[9px] mt-1 font-black uppercase tracking-wider ml-3">{errors.role.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-3">Institutional Tenant ID</label>
            <input 
              {...register('tenantId')} 
              className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner font-bold text-navy text-xs"
              placeholder="e.g. UNIVERSITY_GLOBAL_01"
            />
            {errors.tenantId && <p className="text-accent text-[9px] mt-1 font-black uppercase tracking-wider ml-3">{errors.tenantId.message}</p>}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 mt-8 border-t border-border/40 shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-black text-muted hover:bg-slate-50 border border-border/40 transition-all text-[10px] uppercase tracking-widest active:scale-95 shadow-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="w-full sm:w-auto px-7 py-3 rounded-xl font-black bg-navy text-white hover:bg-primary transition-all shadow-xl shadow-navy/20 hover:-translate-y-1 active:scale-95 text-[10px] uppercase tracking-widest"
            >
              Provision User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
