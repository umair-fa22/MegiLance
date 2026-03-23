// @AI-HINT: Premium AI Proposal Assistant for generating and improving proposal text
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Sparkles, PenTool, Copy, Check, RefreshCw, ArrowRight } from 'lucide-react';
import commonStyles from './AIProposalAssistant.common.module.css';
import lightStyles from './AIProposalAssistant.light.module.css';
import darkStyles from './AIProposalAssistant.dark.module.css';

interface AIProposalAssistantProps {
  onGenerate?: (type: 'generate' | 'improve') => Promise<string>;
  onInsert?: (text: string) => void;
  className?: string;
}

export default function AIProposalAssistant({
  onGenerate,
  onInsert,
  className
}: AIProposalAssistantProps) {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
  
  const [isLoading, setIsLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAction = async (type: 'generate' | 'improve') => {
    if (!onGenerate) return;
    
    setIsLoading(true);
    try {
      const text = await onGenerate(type);
      setGeneratedText(text);
    } catch {
      // AI generation failed, user will see the empty state
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container, className)}>
      <div className={commonStyles.header}>
        <div className={commonStyles.titleWrapper}>
          <Sparkles className={cn(commonStyles.icon, themeStyles.icon)} />
          <h3 className={cn(commonStyles.title, themeStyles.title)}>AI Writing Assistant</h3>
        </div>
        <div className={commonStyles.controls}>
          <button
            onClick={() => handleAction('improve')}
            disabled={isLoading}
            className={cn(commonStyles.controlButton, themeStyles.controlButton)}
          >
            <PenTool size={14} />
            Improve Writing
          </button>
          <button
            onClick={() => handleAction('generate')}
            disabled={isLoading}
            className={cn(commonStyles.controlButton, themeStyles.primaryControl)}
          >
            <Sparkles size={14} />
            Generate Draft
          </button>
        </div>
      </div>

      {isLoading && (
        <div className={commonStyles.loadingOverlay}>
          <div className={cn(commonStyles.spinner, themeStyles.icon)} />
          <span className={themeStyles.resultText}>Crafting your proposal...</span>
        </div>
      )}

      {!isLoading && generatedText && (
        <div className={cn(commonStyles.resultArea, themeStyles.resultArea)}>
          <p className={cn(commonStyles.resultText, themeStyles.resultText)}>
            {generatedText}
          </p>
          
          <div className={cn(commonStyles.resultActions, themeStyles.resultActions)}>
            <button
              onClick={handleCopy}
              className={cn(commonStyles.actionButton, themeStyles.actionButton)}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={() => handleAction('generate')}
              className={cn(commonStyles.actionButton, themeStyles.actionButton)}
            >
              <RefreshCw size={14} />
              Regenerate
            </button>
            {onInsert && (
              <button
                onClick={() => onInsert(generatedText)}
                className={cn(commonStyles.actionButton, themeStyles.primaryAction)}
              >
                Insert
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
