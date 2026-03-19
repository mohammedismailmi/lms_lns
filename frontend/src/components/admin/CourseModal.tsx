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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border bg-surface">
          <h2 className="text-2xl font-serif font-bold text-navy">
            {existingCourse ? 'Edit Course' : 'Create New Course'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-navy mb-1.5 uppercase tracking-wider text-xs">Course Name</label>
                <input 
                {...register('name')} 
                className="w-full bg-white border border-border rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                placeholder="e.g. Introduction to Quantum Computing"
                />
                {errors.name && <p className="text-accent text-xs mt-1.5 font-bold">{errors.name.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-bold text-navy mb-1.5 uppercase tracking-wider text-xs">Section / Class</label>
                <input 
                {...register('section')} 
                className="w-full bg-white border border-border rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                placeholder="e.g. Section A · Fall 2026"
                />
                {errors.section && <p className="text-accent text-xs mt-1.5 font-bold">{errors.section.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-bold text-navy mb-1.5 uppercase tracking-wider text-xs">Category</label>
                <select 
                {...register('category')} 
                className="w-full bg-white border border-border rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                >
                    <option value="AI/ML">AI / ML</option>
                    <option value="Science">Science</option>
                    <option value="Arts">Arts</option>
                    <option value="Business">Business</option>
                    <option value="Default">Default</option>
                </select>
                {errors.category && <p className="text-accent text-xs mt-1.5 font-bold">{errors.category.message}</p>}
            </div>

            <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-navy mb-1.5 uppercase tracking-wider text-xs">Assigned Instructor</label>
                <select 
                {...register('instructorId')} 
                className="w-full bg-white border border-border rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                >
                    <option value="">Select an instructor...</option>
                    {instructors.map(ins => (
                        <option key={ins.id} value={ins.id}>{ins.name} ({ins.email})</option>
                    ))}
                </select>
                {errors.instructorId && <p className="text-accent text-xs mt-1.5 font-bold">{errors.instructorId.message}</p>}
            </div>

            <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-navy mb-1.5 uppercase tracking-wider text-xs">Course Description</label>
                <textarea 
                {...register('description')} 
                rows={3}
                className="w-full bg-white border border-border rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm resize-none"
                placeholder="Enter a brief overview of what this course entails..."
                />
            </div>

            <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-navy mb-2 uppercase tracking-wider text-xs">Thumbnail Theme Color</label>
                <div className="flex gap-3">
                    {PALETTE.map(color => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={cn(
                                "w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center shadow-sm",
                                selectedColor === color ? "border-navy scale-110" : "border-transparent hover:scale-105"
                            )}
                            style={{ backgroundColor: color }}
                        >
                            {selectedColor === color && <Check className="w-5 h-5 text-white mix-blend-difference" />}
                        </button>
                    ))}
                </div>
            </div>

          </div>

          <div className="flex gap-3 justify-end pt-5 mt-6 border-t border-border">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-navy transition-colors shadow-sm"
            >
              {existingCourse ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
