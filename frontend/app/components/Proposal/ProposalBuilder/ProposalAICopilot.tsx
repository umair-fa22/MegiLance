// @AI-HINT: AI Copilot for generating proposals
'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Bot, Sparkles, X, Check } from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';
import Select from '@/app/components/molecules/Select/Select';
import api from '@/lib/api';

import commonStyles from './ProposalAICopilot.common.module.css';
import lightStyles from './ProposalAICopilot.light.module.css';
import darkStyles from './ProposalAICopilot.dark.module.css';

interface ProposalAICopilotProps {
  projectTitle: string;
  projectDescription: string;
  onApply: (coverLetter: string) => void;
}

export default function ProposalAICopilot({
  projectTitle,
  projectDescription,
  onApply
}: ProposalAICopilotProps) {
  const { resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState('professional');
  const [generatedContent, setGeneratedContent] = useState('');

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    optionsGrid: cn(commonStyles.optionsGrid, themeStyles.optionsGrid),
    actions: cn(commonStyles.actions, themeStyles.actions),
    previewArea: cn(commonStyles.previewArea, themeStyles.previewArea),
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // In a real app, we would get user skills/experience from their profile
      // For now, we'll mock them or let the backend handle it if it has access to current_user
      const response = await api.aiWriting.generateProposal({
        project_title: projectTitle,
        project_description: projectDescription,
        user_skills: ['React', 'Next.js', 'TypeScript'], // This should come from user profile
        tone: tone
      });

      setGeneratedContent(response.content);
    } catch {
      setGeneratedContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onApply(generatedContent);
    setIsOpen(false);
    setGeneratedContent('');
  };

  if (!isOpen) {
    return (
      <div className="mb-6">
        <Button 
          variant="secondary" 
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-dashed border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
        >
          <Bot size={16} />
          <span>Generate Proposal with AI</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-full">
          <Bot className="text-blue-700 dark:text-blue-200" size={16} />
        </div>
        <div>
          <h3 className={styles.title}>AI Proposal Assistant</h3>
          <p className="text-xs opacity-70">I'll read the project details and draft a proposal for you.</p>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="ml-auto opacity-50 hover:opacity-100"
        >
          <X size={16} />
        </button>
      </div>

      <div className={styles.optionsGrid}>
        <div>
          <label className="text-xs font-bold uppercase mb-1 block opacity-70">Tone</label>
          <Select
            id="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            options={[
              { value: 'professional', label: 'Professional' },
              { value: 'friendly', label: 'Friendly & Enthusiastic' },
              { value: 'confident', label: 'Confident & Direct' },
              { value: 'persuasive', label: 'Persuasive' },
            ]}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          variant="ghost"
          onClick={() => setIsOpen(false)}
          disabled={loading}
          size="sm"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleGenerate}
          isLoading={loading}
          disabled={loading}
          size="sm"
        >
          <Sparkles size={14} className="mr-2" />
          Generate Draft
        </Button>
      </div>

      {generatedContent && (
        <div className="mt-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold">Preview</h4>
            <Button onClick={handleApply} variant="success" size="sm">
              <Check size={14} className="mr-2" /> Use This
            </Button>
          </div>
          <div className={styles.previewArea}>
            {generatedContent}
          </div>
        </div>
      )}
    </div>
  );
};
