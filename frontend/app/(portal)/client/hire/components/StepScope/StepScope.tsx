// @/app/(portal)/client/hire/components/StepScope/StepScope.tsx
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Input from '@/app/components/atoms/Input/Input';
import { FileText } from 'lucide-react';

import common from './StepScope.common.module.css';
import light from './StepScope.light.module.css';
import dark from './StepScope.dark.module.css';

interface StepScopeProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
}

const StepScope: React.FC<StepScopeProps> = ({ title, setTitle, description, setDescription }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <section className={cn(common.section, themed.section)} aria-labelledby="scope-step-title">
      <h2 id="scope-step-title" className={cn(common.title, themed.title)}>
        Define the Scope
      </h2>
      <p className={cn(common.subtitle, themed.subtitle)}>
        Provide a clear title and detailed description of the work to be done.
      </p>
      <div className={common.formGrid}>
        <Input
          id="projectTitle"
          label="Project Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., 'Modernize React Dashboard'"
          iconBefore={<FileText size={18} aria-hidden="true" />}
          required
        />
        <div className={common.textareaWrapper}>
          <label htmlFor="projectDescription" className={cn(common.label, themed.label)}>
            Project Description
          </label>
          <textarea
            id="projectDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the project requirements, deliverables, and timeline..."
            required
            className={cn(common.textarea, themed.textarea)}
            rows={8}
          />
        </div>
      </div>
    </section>
  );
};

export default StepScope;
