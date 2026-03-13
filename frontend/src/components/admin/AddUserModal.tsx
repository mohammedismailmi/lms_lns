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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-serif font-bold text-navy">Add New User</h2>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Full Name</label>
            <input 
              {...register('name')} 
              className="w-full bg-surface border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="e.g. Jane Doe"
            />
            {errors.name && <p className="text-accent text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Email Address</label>
            <input 
              {...register('email')} 
              className="w-full bg-surface border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="jane@example.com"
            />
            {errors.email && <p className="text-accent text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">System Role</label>
            <select 
              {...register('role')} 
              className="w-full bg-surface border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none transition-all"
            >
              <option value="learner">Learner</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Administrator</option>
            </select>
            {errors.role && <p className="text-accent text-xs mt-1">{errors.role.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Tenant ID</label>
            <input 
              {...register('tenantId')} 
              className="w-full bg-surface border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="e.g. uni1"
            />
            {errors.tenantId && <p className="text-accent text-xs mt-1">{errors.tenantId.message}</p>}
          </div>

          <div className="flex gap-3 justify-end pt-4 mt-6 border-t border-border">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2 rounded-lg font-medium text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2 rounded-lg font-medium bg-primary text-white hover:bg-navy transition-colors"
            >
              Add User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
