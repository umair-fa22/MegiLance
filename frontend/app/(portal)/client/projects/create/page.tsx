// @AI-HINT: Create Project page with AI-powered Price Estimation
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowLeft, Save } from 'lucide-react'
import api, { aiApi } from '@/lib/api';
import Input from '@/app/components/atoms/Input/Input';
import Select from '@/app/components/molecules/Select/Select';
import Button from '@/app/components/atoms/Button/Button';
import { AIPriceEstimator } from '@/app/components/AI';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import common from './CreateProject.common.module.css';
import light from './CreateProject.light.module.css';
import dark from './CreateProject.dark.module.css';

const CATEGORIES = [
  { value: 'web-development', label: 'Web Development' },
  { value: 'mobile-development', label: 'Mobile Development' },
  { value: 'design', label: 'Design & Creative' },
  { value: 'writing', label: 'Writing & Translation' },
  { value: 'admin-support', label: 'Admin Support' },
  { value: 'data-science', label: 'Data Science & Analytics' },
  { value: 'marketing', label: 'Sales & Marketing' },
];

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
];

export default function CreateProjectPage() {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'light' ? light : dark;
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget_min: '',
    budget_max: '',
    experience_level: 'intermediate',
    skills: '', // Comma separated
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);

  // Debounce logic for AI estimation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.description.length > 50 && formData.category) {
        getAiEstimate();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.description, formData.category, formData.skills]);

  const getAiEstimate = async () => {
    setIsEstimating(true);
    try {
      const skillsList = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      const result = await aiApi.estimatePrice({
        category: formData.category,
        skills_required: skillsList,
        description: formData.description,
        complexity: formData.experience_level
      });
      setEstimate(result);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to get estimate:', error);
      }
    } finally {
      setIsEstimating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.projects.create({
        ...formData,
        budget_min: Number(formData.budget_min),
        budget_max: Number(formData.budget_max),
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean)
      });
      router.push('/portal/client/projects');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to create project:', error);
      }
      // Handle error (show toast, etc.)
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyEstimate = () => {
    if (estimate) {
      setFormData(prev => ({
        ...prev,
        budget_min: estimate.low_estimate.toString(),
        budget_max: estimate.high_estimate.toString()
      }));
    }
  };

  return (
    <PageTransition>
      <div className={cn(common.container, theme.theme)}>
        <header className={common.header}>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            iconBefore={<ArrowLeft size={16} />}
            className="mb-4"
          >
            Back to Projects
          </Button>
          <h1 className={common.title}>Post a New Project</h1>
          <p className={common.subtitle}>Describe your project and get matched with top talent.</p>
        </header>

        <form onSubmit={handleSubmit} className={common.form}>
          <div className={cn(common.section, theme.section)}>
            <h2 className={common.sectionTitle}>Project Details</h2>
            
            <Input
              label="Project Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Build a React Native App for Food Delivery"
              required
            />

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className="w-full p-3 rounded-md border bg-transparent focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="Describe your project in detail..."
                required
              />
            </div>

            <div className={common.row}>
              <div className={common.col}>
                <Select
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  options={[{ value: '', label: 'Select Category' }, ...CATEGORIES]}
                  required
                />
              </div>
              <div className={common.col}>
                <Select
                  label="Experience Level"
                  name="experience_level"
                  value={formData.experience_level}
                  onChange={handleChange}
                  options={EXPERIENCE_LEVELS}
                />
              </div>
            </div>

            <Input
              label="Required Skills (comma separated)"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g. React, Node.js, TypeScript"
            />
          </div>

          {/* AI Price Estimation */}
          <AIPriceEstimator 
            estimate={estimate}
            isLoading={isEstimating}
            onApply={applyEstimate}
            onDismiss={() => setEstimate(null)}
            className="mb-6"
          />

          <div className={cn(common.section, theme.section)}>
            <h2 className={common.sectionTitle}>Budget</h2>
            <div className={common.row}>
              <div className={common.col}>
                <Input
                  label="Minimum Budget ($)"
                  name="budget_min"
                  type="number"
                  value={formData.budget_min}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className={common.col}>
                <Input
                  label="Maximum Budget ($)"
                  name="budget_max"
                  type="number"
                  value={formData.budget_max}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          <div className={common.actions}>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={isSubmitting}
              iconBefore={<Save size={16} />}
            >
              Post Project
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
