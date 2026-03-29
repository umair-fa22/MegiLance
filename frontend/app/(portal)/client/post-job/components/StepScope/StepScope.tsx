// @AI-HINT: Enhanced StepScope with real-time validation, character/word counts, accessibility, and smart suggestions
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Lightbulb, Info } from 'lucide-react';
import Textarea from '@/app/components/atoms/Textarea/Textarea';
import TagsInput from '@/app/components/atoms/TagsInput/TagsInput';
import { PostJobData, PostJobErrors } from '../../PostJob.types';

import common from './StepScope.common.module.css';
import light from './StepScope.light.module.css';
import dark from './StepScope.dark.module.css';

interface StepScopeProps {
  data: PostJobData;
  updateData: (update: Partial<PostJobData>) => void;
  errors: PostJobErrors;
}

// Validation constants
const MIN_DESCRIPTION_LENGTH = 50;
const RECOMMENDED_DESCRIPTION_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const MIN_SKILLS = 1;
const MAX_SKILLS = 15;
const RECOMMENDED_SKILLS = 5;

// Popular skills suggestions based on category (would be fetched from API in production)
const SKILL_SUGGESTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'PostgreSQL',
  'AWS', 'Docker', 'GraphQL', 'REST API', 'Git', 'Agile', 'UI/UX', 'Figma'
];

const StepScope: React.FC<StepScopeProps> = ({ data, updateData, errors }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const [showTips, setShowTips] = useState(false);

  // Calculate description metrics
  const descriptionMetrics = useMemo(() => {
    const charCount = data.description.length;
    const wordCount = data.description.trim() ? data.description.trim().split(/\s+/).length : 0;
    const isMinMet = charCount >= MIN_DESCRIPTION_LENGTH;
    const isRecommendedMet = charCount >= RECOMMENDED_DESCRIPTION_LENGTH;
    const isNearMax = charCount >= MAX_DESCRIPTION_LENGTH * 0.9;
    const progress = Math.min((charCount / RECOMMENDED_DESCRIPTION_LENGTH) * 100, 100);
    
    return { charCount, wordCount, isMinMet, isRecommendedMet, isNearMax, progress };
  }, [data.description]);

  // Calculate skills metrics
  const skillsMetrics = useMemo(() => {
    const count = data.skills.length;
    const isMinMet = count >= MIN_SKILLS;
    const isRecommendedMet = count >= RECOMMENDED_SKILLS;
    const isMaxReached = count >= MAX_SKILLS;
    
    return { count, isMinMet, isRecommendedMet, isMaxReached };
  }, [data.skills]);

  // Filter suggestions based on what's already selected
  const filteredSuggestions = useMemo(() => {
    return SKILL_SUGGESTIONS.filter(
      skill => !data.skills.some(s => s.toLowerCase() === skill.toLowerCase())
    ).slice(0, 6);
  }, [data.skills]);

  // Handle quick add skill
  const handleQuickAddSkill = useCallback((skill: string) => {
    if (data.skills.length < MAX_SKILLS && !data.skills.includes(skill)) {
      updateData({ skills: [...data.skills, skill] });
    }
  }, [data.skills, updateData]);

  // Validation status indicator
  const ValidationStatus = ({ isValid, message }: { isValid: boolean; message: string }) => (
    <div className={cn(common.validationStatus, isValid ? common.valid : common.invalid)}>
      {isValid ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
      <span>{message}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={common.container}
      role="region"
      aria-label="Project Scope Step"
    >
      <div className={common.headerRow}>
        <div>
          <h2 className={cn(common.title, themed.title)}>Define the Scope</h2>
          <p className={cn(common.subtitle, themed.subtitle)}>Provide a detailed description and the skills required.</p>
        </div>
        <button
          type="button"
          className={cn(common.tipButton, themed.tipButton)}
          onClick={() => setShowTips(!showTips)}
          aria-expanded={showTips}
          aria-controls="scope-tips"
        >
          <Lightbulb size={18} />
          <span>Tips</span>
        </button>
      </div>

      <AnimatePresence>
        {showTips && (
          <motion.div
            id="scope-tips"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(common.tipsBox, themed.tipsBox)}
          >
            <h4><Info size={16} /> Writing Tips</h4>
            <ul>
              <li>Be specific about project deliverables and expectations</li>
              <li>Include any technical requirements or constraints</li>
              <li>Mention your preferred communication style</li>
              <li>Add 5+ relevant skills for better matching</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={common.form_group}>
        <Textarea
          id="job-description"
          label="Job Description"
          value={data.description}
          onChange={(e) => updateData({ description: e.target.value })}
          placeholder="Describe the project scope, deliverables, timeline, and any other important details...\n\nExample: We are looking for an experienced React developer to build a customer dashboard. The dashboard should include user authentication, data visualization charts, and integration with our REST API. Timeline is 4-6 weeks."
          error={errors.description}
          required
          rows={8}
          maxLength={MAX_DESCRIPTION_LENGTH}
          showCharacterCount
          aria-describedby="description-help description-metrics"
        />
        
        {/* Description metrics and validation */}
        <div id="description-metrics" className={common.metricsRow}>
          <div className={common.metrics}>
            <span className={cn(
              common.metricItem,
              descriptionMetrics.isNearMax && common.warning
            )}>
              {descriptionMetrics.charCount.toLocaleString()} / {MAX_DESCRIPTION_LENGTH.toLocaleString()} characters
            </span>
            <span className={common.metricDivider}>•</span>
            <span className={common.metricItem}>
              {descriptionMetrics.wordCount} words
            </span>
          </div>
          
          <div className={common.validationRow}>
            <ValidationStatus 
              isValid={descriptionMetrics.isMinMet} 
              message={`Min ${MIN_DESCRIPTION_LENGTH} chars`} 
            />
            {descriptionMetrics.isMinMet && (
              <ValidationStatus 
                isValid={descriptionMetrics.isRecommendedMet} 
                message={`Recommended ${RECOMMENDED_DESCRIPTION_LENGTH}+ chars`} 
              />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className={common.progressBar} role="progressbar" aria-valuenow={descriptionMetrics.progress} aria-valuemin={0} aria-valuemax={100}>
          <motion.div 
            className={cn(
              common.progressFill,
              themed.progressFill,
              descriptionMetrics.isRecommendedMet && common.progressComplete
            )}
            initial={{ width: 0 }}
            animate={{ width: `${descriptionMetrics.progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className={common.form_group}>
        <TagsInput
          id="job-skills"
          label="Required Skills"
          tags={data.skills}
          onTagsChange={(newSkills) => updateData({ skills: newSkills.slice(0, MAX_SKILLS) })}
          placeholder={skillsMetrics.isMaxReached ? `Maximum ${MAX_SKILLS} skills reached` : "Add a skill and press Enter"}
          error={errors.skills}
          disabled={skillsMetrics.isMaxReached}
          aria-describedby="skills-help skills-metrics"
        />
        
        {/* Skills metrics */}
        <div id="skills-metrics" className={common.metricsRow}>
          <span className={cn(
            common.metricItem,
            skillsMetrics.isMaxReached && common.warning
          )}>
            {skillsMetrics.count} / {MAX_SKILLS} skills
          </span>
          <ValidationStatus 
            isValid={skillsMetrics.isMinMet} 
            message={`Add at least ${MIN_SKILLS} skill`} 
          />
        </div>

        {/* Quick add suggestions */}
        {filteredSuggestions.length > 0 && !skillsMetrics.isMaxReached && (
          <div className={common.suggestionsSection}>
            <span className={cn(common.suggestionsLabel, themed.suggestionsLabel)}>Popular skills:</span>
            <div className={common.suggestionsList} role="list" aria-label="Suggested skills">
              {filteredSuggestions.map(skill => (
                <button
                  key={skill}
                  type="button"
                  className={cn(common.suggestionChip, themed.suggestionChip)}
                  onClick={() => handleQuickAddSkill(skill)}
                  aria-label={`Add ${skill} skill`}
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>
        )}

        <p id="skills-help" className={cn(common.help, themed.help)}>
          These skills will be used to match you with the best freelancers. Add {RECOMMENDED_SKILLS}+ skills for optimal matching.
        </p>
      </div>
    </motion.div>
  );
};

export default StepScope;
