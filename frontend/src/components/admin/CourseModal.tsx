import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCourseStore } from '../../store/courseStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../lib/useToast';
import { Course } from '../../lib/mockData';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';
import api from '../../lib/api';


const schema = z.object({
  name: z.string().min(1, 'Course Name is required'),
  section: z.string().min(1, 'Section is required'),
  category: z.enum(['AI/ML', 'Science', 'Arts', 'Business', 'Default']),
  instructorId: z.string().min(1, 'Instructor must be selected'),
  description: z.string().optional(),
  thumbnailColor: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingCourse?: Course; // if undefined, it's create mode
}

const PALETTE = [
  '#1B3A6B', // Primary Blue
  '#0F2040', // Deep Navy
  '#8B1A1A', // Accent Red
  '#2D5A27', // Forest Green
  '#C9A84C', // Warm Yellow
  '#1A1A1A', // Dark Ink
];

export default function CourseModal({ isOpen, onClose, existingCourse }: Props) {
  const { addCourse, updateCourse } = useCourseStore();
  const toast = useToast();
  const [selectedColor, setSelectedColor] = useState(existingCourse?.thumbnailColor || PALETTE[0]);
  const [instructors, setInstructors] = useState<{id:string, name:string, email:string}[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.get('/api/admin/instructors').then(res => {
        if (res.data.success) {
          setInstructors(res.data.instructors);
        }
      }).catch(err => console.error(err));
    }
  }, [isOpen]);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
        name: existingCourse?.name || '',
        section: existingCourse?.section || '',
        instructorId: (existingCourse as any)?.instructorId || '',
        category: existingCourse?.category || 'Default',
        description: existingCourse?.description || '',
    }
  });

  useEffect(() => {
    if (existingCourse) {
        reset({
            name: existingCourse.name,
            section: existingCourse.section,
            instructorId: (existingCourse as any).instructorId || '',
            category: existingCourse.category,
            description: existingCourse.description || '',
            thumbnailColor: existingCourse.thumbnailColor || PALETTE[0]
        });
        setSelectedColor(existingCourse.thumbnailColor || PALETTE[0]);
    } else {
        reset({ name: '', section: '', instructorId: '', category: 'Default', description: '', thumbnailColor: PALETTE[0] });
        setSelectedColor(PALETTE[0]);
    }
  }, [existingCourse, isOpen, reset]);

  useEffect(() => {
    setValue('thumbnailColor', selectedColor);
  }, [selectedColor, setValue]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const onSubmit = async (data: FormData) => {
    try {
        if (existingCourse) {
            await updateCourse({
                ...existingCourse,
                ...data,
                thumbnailColor: selectedColor,
            });
            toast.success('Course updated successfully');
        } else {
            await addCourse({
                ...data,
                thumbnailColor: selectedColor,
            });
            toast.success('Course created successfully');
        }
        onClose();
    } catch (err) {
        toast.error('Failed to save course');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white rounded-none sm:rounded-3xl shadow-premium w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 border border-white/20" onClick={e => e.stopPropagation()}>
        <div className="p-5 sm:p-7 border-b border-border/40 bg-surface shrink-0">
          <h2 className="text-xl sm:text-2xl font-serif font-black text-navy tracking-tight leading-tight">
            {existingCourse ? 'Course Configuration' : 'Establish New Course'}
          </h2>
          <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mt-0.5 opacity-60 italic">Academic Portfolio Management</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:p-7 space-y-6 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,_#1b3a6b05,_transparent)]">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-1 md:col-span-2">
                <label className="block text-[9px] font-black text-muted mb-1.5 uppercase tracking-[0.2em] ml-3">Course Designation / Title</label>
                <input 
                {...register('name')} 
                className="w-full bg-surface border border-border/40 rounded-xl px-4 py-3 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner font-bold text-navy text-xs"
                placeholder="e.g. Advanced Quantum Field Theory"
                />
                {errors.name && <p className="text-accent text-[9px] mt-1 font-black uppercase tracking-wider ml-3">{errors.name.message}</p>}
            </div>

            <div>
                <label className="block text-[9px] font-black text-muted mb-1.5 uppercase tracking-[0.2em] ml-3">Administrative Section</label>
                <input 
                {...register('section')} 
                className="w-full bg-surface border border-border/40 rounded-xl px-4 py-3 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner font-bold text-navy text-xs"
                placeholder="e.g. Section 402 · AY 2026-27"
                />
                {errors.section && <p className="text-accent text-[9px] mt-1 font-black uppercase tracking-wider ml-3">{errors.section.message}</p>}
            </div>

            <div>
                <label className="block text-[9px] font-black text-muted mb-1.5 uppercase tracking-[0.2em] ml-3">Subject Taxonomy</label>
                <select 
                {...register('category')} 
                className="w-full bg-surface border border-border/40 rounded-xl px-4 py-3 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner font-bold text-navy cursor-pointer appearance-none text-xs"
                >
                    <option value="AI/ML">Artificial Intelligence</option>
                    <option value="Science">Physical Sciences</option>
                    <option value="Arts">Humanities & Arts</option>
                    <option value="Business">Business Administration</option>
                    <option value="Default">Unclassified</option>
                </select>
                {errors.category && <p className="text-accent text-[9px] mt-1 font-black uppercase tracking-wider ml-3">{errors.category.message}</p>}
            </div>

            <div className="col-span-1 md:col-span-2">
                <label className="block text-[9px] font-black text-muted mb-1.5 uppercase tracking-[0.2em] ml-3">Lead Faculty Member</label>
                <select 
                {...register('instructorId')} 
                className="w-full bg-surface border border-border/40 rounded-xl px-4 py-3 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner font-bold text-navy cursor-pointer appearance-none text-xs"
                >
                    <option value="">Select qualifying instructor...</option>
                    {instructors.map(ins => (
                        <option key={ins.id} value={ins.id}>{ins.name} · {ins.email}</option>
                    ))}
                </select>
                {errors.instructorId && <p className="text-accent text-[9px] mt-1 font-black uppercase tracking-wider ml-3">{errors.instructorId.message}</p>}
            </div>

            <div className="col-span-1 md:col-span-2">
                <label className="block text-[9px] font-black text-muted mb-1.5 uppercase tracking-[0.2em] ml-3">Course Curricular Synopsis</label>
                <textarea 
                {...register('description')} 
                rows={3}
                className="w-full bg-surface border border-border/40 rounded-2xl px-4 py-3.5 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner font-medium text-navy resize-none text-xs"
                placeholder="Provide a comprehensive academic overview..."
                />
            </div>

            <div className="col-span-1 md:col-span-2">
                <label className="block text-[9px] font-black text-muted mb-3 uppercase tracking-[0.2em] ml-3">Course Visual Signature</label>
                <div className="flex flex-wrap gap-2.5 px-1.5">
                    {PALETTE.map(color => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={cn(
                                "w-10 h-10 rounded-xl border-4 transition-all flex items-center justify-center shadow-lg transform active:scale-95",
                                selectedColor === color ? "border-navy scale-110 shadow-primary/20" : "border-white hover:scale-105 hover:rotate-3 shadow-sm"
                            )}
                            style={{ backgroundColor: color }}
                        >
                            {selectedColor === color && <Check className="w-5 h-5 text-white mix-blend-difference" />}
                        </button>
                    ))}
                </div>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 mt-8 border-t border-border/40 shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-black text-muted hover:bg-slate-50 border border-border/40 transition-all text-[10px] uppercase tracking-widest active:scale-95 shadow-sm"
            >
              Discard Changes
            </button>
            <button 
              type="submit"
              className="w-full sm:w-auto px-8 py-3 rounded-xl font-black bg-navy text-white hover:bg-primary transition-all shadow-xl shadow-navy/20 hover:-translate-y-1 active:scale-95 text-[10px] uppercase tracking-widest"
            >
              {existingCourse ? 'Commit Updates' : 'Launch Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
