// @AI-HINT: Proposal builder with templates, drafts, and AI assistance
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { 
  FileText, Save, SendHorizontal, Lightbulb,
  Clock, Banknote, CalendarDays
} from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';
import Input from '@/app/components/atoms/Input/Input';
import Textarea from '@/app/components/atoms/Textarea/Textarea';
import Select from '@/app/components/molecules/Select/Select';
import FileUpload from '@/app/components/molecules/FileUpload/FileUpload';
import api from '@/lib/api';
import ProposalAICopilot from './ProposalAICopilot';
import UpsellSuggestions from '../UpsellSuggestions/UpsellSuggestions';

import commonStyles from './ProposalBuilder.common.module.css';
import lightStyles from './ProposalBuilder.light.module.css';
import darkStyles from './ProposalBuilder.dark.module.css';

interface ProposalData {
  coverLetter: string;
  bidAmount: string;
  estimatedHours: string;
  hourlyRate: string;
  availability: string;
  attachments: string[];
  milestones: Milestone[];
}

interface Milestone {
  description: string;
  amount: string;
  dueDate: string;
}

interface ProposalBuilderProps {
  projectId: number;
  projectTitle: string;
  projectDescription: string;
  projectBudget: { min: number; max: number };
  onSubmit?: () => void;
}

const proposalTemplates = [
  {
    id: 'web-dev',
    name: 'Web Development',
    content: `Dear Client,

I'm excited about your project and believe I'm the perfect fit for this work. With [X] years of experience in web development, I've successfully delivered similar projects.

**Why I'm the Right Choice:**
- Expertise in [technologies]
- Proven track record with [number] completed projects
- Strong communication and timely delivery

**My Approach:**
1. Analyze requirements thoroughly
2. Create detailed technical specifications
3. Develop with clean, maintainable code
4. Test rigorously before delivery
5. Provide ongoing support

I'm available to start immediately and can commit [hours/week] to ensure timely completion.

Looking forward to discussing this further!

Best regards`
  },
  {
    id: 'design',
    name: 'Design & Creative',
    content: `Hello!

I'm a professional designer with a passion for creating polished visuals. Your project caught my attention, and I'd love to bring your vision to life.

**What I Offer:**
- Modern, user-centric design approach
- Multiple revision rounds included
- Source files in all formats
- Brand consistency across all deliverables

**Design Process:**
1. Discovery & Research
2. Concept Development
3. Design Refinement
4. Final Delivery & Support

I've attached my portfolio showcasing similar work. Let's create something amazing together!

Cheers`
  },
  {
    id: 'writing',
    name: 'Writing & Content',
    content: `Hi there,

As a professional content writer, I specialize in creating engaging, SEO-optimized content that drives results.

**My Services Include:**
- Thorough research on your topic
- SEO keyword integration
- Engaging, conversion-focused copy
- Unlimited revisions
- Plagiarism-free, original content

**Delivery:**
I can deliver [word count] words per [timeframe] with guaranteed quality.

Looking forward to working with you!

Best`
  }
];

export default function ProposalBuilder({
  projectId,
  projectDescription,
  projectTitle,
  projectBudget,
  onSubmit
}: ProposalBuilderProps) {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftId, setDraftId] = useState<number | null>(null);
  
  const [proposalData, setProposalData] = useState<ProposalData>({
    coverLetter: '',
    bidAmount: '',
    estimatedHours: '',
    hourlyRate: '',
    availability: '',
    attachments: [],
    milestones: [],
  });

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    subtitle: cn(commonStyles.subtitle, themeStyles.subtitle),
    content: cn(commonStyles.content, themeStyles.content),
    sidebar: cn(commonStyles.sidebar, themeStyles.sidebar),
    templateCard: cn(commonStyles.templateCard, themeStyles.templateCard),
    mainForm: cn(commonStyles.mainForm, themeStyles.mainForm),
    formSection: cn(commonStyles.formSection, themeStyles.formSection),
    sectionTitle: cn(commonStyles.sectionTitle, themeStyles.sectionTitle),
    formGrid: cn(commonStyles.formGrid, themeStyles.formGrid),
    actions: cn(commonStyles.actions, themeStyles.actions),
    tip: cn(commonStyles.tip, themeStyles.tip),
  };

  // Load draft if exists
  useEffect(() => {
    loadDraft();
  }, [projectId]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (proposalData.coverLetter.length > 50) {
        saveDraft();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [proposalData]);

  const loadDraft = async () => {
    try {
      const drafts: any = await api.proposals.getDrafts(projectId);
      
      if (drafts && drafts.length > 0) {
        const draft = drafts[0];
        setDraftId(draft.id);
        setProposalData({
          coverLetter: draft.cover_letter || '',
          bidAmount: draft.bid_amount?.toString() || '',
          estimatedHours: draft.estimated_hours?.toString() || '',
          hourlyRate: draft.hourly_rate?.toString() || '',
          availability: draft.availability || '',
          attachments: JSON.parse(draft.attachments || '[]'),
          milestones: [],
        });
      }
    } catch {
      // Failed to load draft
    }
  };

  const saveDraft = async () => {
    setSavingDraft(true);
    try {
      const payload = {
        project_id: projectId,
        cover_letter: proposalData.coverLetter,
        bid_amount: parseFloat(proposalData.bidAmount) || 0,
        estimated_hours: parseInt(proposalData.estimatedHours) || 0,
        hourly_rate: parseFloat(proposalData.hourlyRate) || 0,
        availability: proposalData.availability,
      };

      let draft: any;
      if (draftId) {
        draft = await api.proposals.update(draftId, payload);
      } else {
        draft = await api.proposals.saveDraft(payload);
      }

      if (draft && !draftId) {
        setDraftId(draft.id);
      }
    } catch {
      // Draft save failed, user can retry
    } finally {
      setSavingDraft(false);
    }
  };

  const useTemplate = (template: typeof proposalTemplates[0]) => {
    setProposalData({ ...proposalData, coverLetter: template.content });
  };
  const handleAIApply = (content: string) => {
    setProposalData({ ...proposalData, coverLetter: content });
  };

  const handleAddUpsell = (suggestion: { title: string; description: string }) => {
    setProposalData(prev => ({
      ...prev,
      coverLetter: prev.coverLetter + `\n\n**Proposed Add-on: ${suggestion.title}**\n${suggestion.description}`
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!proposalData.coverLetter || proposalData.coverLetter.length < 100) {
      newErrors.coverLetter = 'Cover letter must be at least 100 characters';
    }
    if (!proposalData.bidAmount || parseFloat(proposalData.bidAmount) <= 0) {
      newErrors.bidAmount = 'Bid amount is required';
    }
    if (!proposalData.estimatedHours || parseInt(proposalData.estimatedHours) <= 0) {
      newErrors.estimatedHours = 'Estimated hours is required';
    }
    if (!proposalData.availability) {
      newErrors.availability = 'Please select your availability';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      const payload = {
        project_id: projectId,
        cover_letter: proposalData.coverLetter,
        bid_amount: parseFloat(proposalData.bidAmount),
        estimated_hours: parseInt(proposalData.estimatedHours),
        hourly_rate: parseFloat(proposalData.hourlyRate),
        availability: proposalData.availability,
      };

      if (draftId) {
        // Submit existing draft
        await api.proposals.submitDraft(draftId);
      } else {
        await api.proposals.create(payload);
      }

      onSubmit?.();
      router.push(`/projects/${projectId}?submitted=true`);
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to submit proposal' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Submit Proposal</h1>
        <p className={styles.subtitle}>Project: {projectTitle}</p>
      </div>

      <div className={styles.content}>
        {/* Sidebar - Templates */}
        <div className={styles.sidebar}>
          <h3 className={styles.sectionTitle}>
            <Lightbulb size={16} className="mr-2" />
            Quick Start Templates
          </h3>
          {proposalTemplates.map((template) => (
            <div key={template.id} className={styles.templateCard}>
              <h4>{template.name}</h4>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => useTemplate(template)}
              >
                Use Template
              </Button>
            </div>
          ))}
          
          <div className={styles.tip}>
            <Lightbulb size={14} />
            <div>
              <strong>Pro Tip:</strong> Personalize the template with specific details about the client's project to stand out!
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className={styles.mainForm}>
            <ProposalAICopilot 
              projectTitle={projectTitle}
              projectDescription={projectDescription}
              onApply={handleAIApply}
            />

            <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <FileText size={16} className="mr-2" />
              Cover Letter
            </h3>
            <Textarea
              name="coverLetter"
              placeholder="Introduce yourself and explain why you're the perfect fit for this project..."
              value={proposalData.coverLetter}
              onChange={(e) => setProposalData({ ...proposalData, coverLetter: e.target.value })}
              error={errors.coverLetter}
              rows={12}
              helpText={`${proposalData.coverLetter.length} characters (minimum 100)`}
            />
            
            <UpsellSuggestions 
              projectDescription={projectDescription}
              proposalContent={proposalData.coverLetter}
              onAdd={handleAddUpsell}
            />
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <Banknote size={16} className="mr-2" />
              Pricing & Timeline
            </h3>
            <div className={styles.formGrid}>
              <Input
                name="bidAmount"
                type="number"
                label="Total Bid Amount (PKR)"
                placeholder="50000"
                value={proposalData.bidAmount}
                onChange={(e) => setProposalData({ ...proposalData, bidAmount: e.target.value })}
                error={errors.bidAmount}
                helpText={`Client budget: PKR ${projectBudget.min} - ${projectBudget.max}`}
              />
              <Input
                name="estimatedHours"
                type="number"
                label="Estimated Hours"
                placeholder="40"
                value={proposalData.estimatedHours}
                onChange={(e) => setProposalData({ ...proposalData, estimatedHours: e.target.value })}
                error={errors.estimatedHours}
              />
              <Input
                name="hourlyRate"
                type="number"
                label="Your Hourly Rate (PKR)"
                placeholder="2000"
                value={proposalData.hourlyRate}
                onChange={(e) => setProposalData({ ...proposalData, hourlyRate: e.target.value })}
              />
              <Select
                id="availability"
                label="Availability"
                value={proposalData.availability}
                onChange={(e) => setProposalData({ ...proposalData, availability: e.target.value })}
                options={[
                  { value: '', label: 'Select availability' },
                  { value: 'immediate', label: 'Available Immediately' },
                  { value: '1-2_weeks', label: 'Available in 1-2 weeks' },
                  { value: '1_month', label: 'Available in 1 month' },
                  { value: 'flexible', label: 'Flexible' },
                ]}
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <FileText size={16} className="mr-2" />
              Attachments (Optional)
            </h3>
            <FileUpload
              accept=".pdf,.doc,.docx,image/*"
              maxSize={10}
              uploadType="document"
              onUploadComplete={(url) => setProposalData({ 
                ...proposalData, 
                attachments: [...proposalData.attachments, url] 
              })}
            />
          </div>

          {errors.general && (
            <div className="text-red-500 text-center mt-4">{errors.general}</div>
          )}

          <div className={styles.actions}>
            <Button
              variant="secondary"
              onClick={saveDraft}
              isLoading={savingDraft}
              disabled={loading}
            >
              <Save size={16} className="mr-2" />
              {savingDraft ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={loading}
              disabled={loading || savingDraft}
            >
              <SendHorizontal size={16} className="mr-2" />
              Submit Proposal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
