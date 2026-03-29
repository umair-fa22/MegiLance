// @AI-HINT: Support ticket wizard for creating help requests with categorization and attachments
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import WizardContainer from '@/app/components/organisms/Wizard/WizardContainer/WizardContainer';
import commonStyles from './SupportTicketWizard.common.module.css';
import lightStyles from './SupportTicketWizard.light.module.css';
import darkStyles from './SupportTicketWizard.dark.module.css';
import { LifeBuoy, Tag, FileUp, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

interface Attachment {
  id: string;
  file: File;
  description: string;
}

interface TicketData {
  category: string;
  subcategory: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  attachments: Attachment[];
  contactMethod: 'email' | 'phone' | 'chat';
  contactDetails: string;
}

interface SupportTicketWizardProps {
  userId: string;
  userEmail: string;
}

const CATEGORIES = {
  account: {
    label: 'Account & Billing',
    icon: '👤',
    subcategories: [
      'Login Issues',
      'Password Reset',
      'Payment Problems',
      'Subscription Management',
      'Account Deletion'
    ]
  },
  technical: {
    label: 'Technical Issues',
    icon: '⚙️',
    subcategories: [
      'Bug Report',
      'Performance Issues',
      'Feature Not Working',
      'Error Messages',
      'Integration Problems'
    ]
  },
  project: {
    label: 'Project & Contracts',
    icon: '📋',
    subcategories: [
      'Contract Disputes',
      'Payment Delays',
      'Project Cancellation',
      'Milestone Issues',
      'Communication Problems'
    ]
  },
  security: {
    label: 'Security & Privacy',
    icon: '🔒',
    subcategories: [
      'Account Security',
      'Suspicious Activity',
      'Data Privacy',
      'Report Abuse',
      'Fraud Report'
    ]
  },
  other: {
    label: 'Other',
    icon: '💬',
    subcategories: [
      'General Inquiry',
      'Feature Request',
      'Feedback',
      'Partnership',
      'Other'
    ]
  }
};

export default function SupportTicketWizard({ userId, userEmail }: SupportTicketWizardProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [ticketData, setTicketData] = useState<TicketData>({
    category: '',
    subcategory: '',
    priority: 'medium',
    subject: '',
    description: '',
    attachments: [],
    contactMethod: 'email',
    contactDetails: userEmail
  });

  const addAttachment = (files: FileList | null) => {
    if (!files) return;
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = Array.from(files).filter(file => {
      if (file.size > maxSize) {
        showToast(`${file.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    const newAttachments: Attachment[] = validFiles.map(file => ({
      id: `${Date.now()}-${file.name}`,
      file,
      description: ''
    }));

    setTicketData({
      ...ticketData,
      attachments: [...ticketData.attachments, ...newAttachments]
    });
  };

  const updateAttachment = (id: string, description: string) => {
    setTicketData({
      ...ticketData,
      attachments: ticketData.attachments.map(a =>
        a.id === id ? { ...a, description } : a
      )
    });
  };

  const removeAttachment = (id: string) => {
    setTicketData({
      ...ticketData,
      attachments: ticketData.attachments.filter(a => a.id !== id)
    });
  };

  // STEP 1: Category Selection
  const Step1Category = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.header}>
        <LifeBuoy className={commonStyles.icon} />
        <div>
          <h2>How Can We Help?</h2>
          <p>Select the category that best describes your issue</p>
        </div>
      </div>

      <div className={commonStyles.categoryGrid}>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <div
            key={key}
            className={cn(
              commonStyles.categoryCard,
              themeStyles.categoryCard,
              ticketData.category === key && commonStyles.categorySelected,
              ticketData.category === key && themeStyles.categorySelected
            )}
            onClick={() => setTicketData({ ...ticketData, category: key, subcategory: '' })}
          >
            <div className={commonStyles.categoryIcon}>{cat.icon}</div>
            <h4>{cat.label}</h4>
          </div>
        ))}
      </div>

      {ticketData.category && (
        <div className={commonStyles.subcategorySection}>
          <h3>Select Specific Issue</h3>
          <div className={commonStyles.subcategoryGrid}>
            {CATEGORIES[ticketData.category as keyof typeof CATEGORIES].subcategories.map(sub => (
              <div
                key={sub}
                className={cn(
                  commonStyles.subcategoryCard,
                  themeStyles.subcategoryCard,
                  ticketData.subcategory === sub && commonStyles.subcategorySelected,
                  ticketData.subcategory === sub && themeStyles.subcategorySelected
                )}
                onClick={() => setTicketData({ ...ticketData, subcategory: sub })}
              >
                <Tag className={commonStyles.tagIcon} />
                {sub}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // STEP 2: Issue Details
  const Step2Details = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.header}>
        <Tag className={commonStyles.icon} />
        <div>
          <h2>Describe Your Issue</h2>
          <p>Provide details to help us assist you better</p>
        </div>
      </div>

      <div className={commonStyles.prioritySection}>
        <label>Priority Level</label>
        <div className={commonStyles.priorityGrid}>
          {[
            { value: 'low', label: 'Low', desc: 'General questions' },
            { value: 'medium', label: 'Medium', desc: 'Needs attention' },
            { value: 'high', label: 'High', desc: 'Urgent issue' },
            { value: 'urgent', label: 'Urgent', desc: 'Critical problem' }
          ].map(p => (
            <div
              key={p.value}
              className={cn(
                commonStyles.priorityCard,
                themeStyles.priorityCard,
                commonStyles[`priority${p.value.charAt(0).toUpperCase() + p.value.slice(1)}`],
                ticketData.priority === p.value && commonStyles.prioritySelected,
                ticketData.priority === p.value && themeStyles.prioritySelected
              )}
              onClick={() => setTicketData({ ...ticketData, priority: p.value as any })}
            >
              <strong>{p.label}</strong>
              <span>{p.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={commonStyles.formGroup}>
        <label>Subject *</label>
        <input
          type="text"
          value={ticketData.subject}
          onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
          placeholder="Brief summary of your issue..."
          maxLength={100}
          className={cn(commonStyles.input, themeStyles.input)}
          aria-label="Ticket subject"
        />
        <div className={commonStyles.charCount}>{ticketData.subject.length}/100</div>
      </div>

      <div className={commonStyles.formGroup}>
        <label>Detailed Description *</label>
        <textarea
          value={ticketData.description}
          onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
          placeholder="Please provide as much detail as possible:&#10;- What were you trying to do?&#10;- What happened instead?&#10;- When did this start?&#10;- Steps to reproduce (if applicable)"
          rows={8}
          className={cn(commonStyles.textarea, themeStyles.textarea)}
          aria-label="Issue description"
        />
        <div className={commonStyles.charCount}>{ticketData.description.length} characters</div>
      </div>

      <div className={cn(commonStyles.tipBox, themeStyles.tipBox)}>
        <strong>💡 Tip:</strong> Include specific error messages, timestamps, and steps you've already tried.
      </div>
    </div>
  );

  // STEP 3: Attachments
  const Step3Attachments = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.header}>
        <FileUp className={commonStyles.icon} />
        <div>
          <h2>Add Attachments</h2>
          <p>Upload screenshots or files that help explain your issue (optional)</p>
        </div>
      </div>

      <div className={cn(commonStyles.uploadBox, themeStyles.uploadBox)}>
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt,.log"
          onChange={(e) => addAttachment(e.target.files)}
          id="ticket-attachments"
          className={commonStyles.hiddenInput}
        />
        <label htmlFor="ticket-attachments" className={cn(commonStyles.uploadButton, themeStyles.uploadButton)}>
          <FileUp />
          Select Files
        </label>
        <p className={commonStyles.uploadHint}>
          Accepted: Images, Documents, Logs • Max 10MB per file
        </p>
      </div>

      {ticketData.attachments.length > 0 && (
        <div className={commonStyles.attachmentList}>
          <h4>Attachments ({ticketData.attachments.length})</h4>
          {ticketData.attachments.map(attachment => (
            <div key={attachment.id} className={cn(commonStyles.attachmentItem, themeStyles.attachmentItem)}>
              <div className={commonStyles.attachmentHeader}>
                <strong>{attachment.file.name}</strong>
                <span>{(attachment.file.size / 1024).toFixed(1)} KB</span>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className={commonStyles.removeButton}
                >
                  Remove
                </button>
              </div>
              <input
                type="text"
                value={attachment.description}
                onChange={(e) => updateAttachment(attachment.id, e.target.value)}
                placeholder="Brief description of this file (optional)..."
                className={cn(commonStyles.input, themeStyles.input)}
                aria-label="Attachment description"
              />
            </div>
          ))}
        </div>
      )}

      <div className={commonStyles.formGroup}>
        <label>Preferred Contact Method</label>
        <div className={commonStyles.contactGrid}>
          {[
            { value: 'email', label: '📧 Email', desc: 'Responses within 24 hours' },
            { value: 'phone', label: '📞 Phone', desc: 'Callback within 4 hours' },
            { value: 'chat', label: '💬 Chat', desc: 'Live support (if available)' }
          ].map(method => (
            <div
              key={method.value}
              className={cn(
                commonStyles.contactCard,
                themeStyles.contactCard,
                ticketData.contactMethod === method.value && commonStyles.contactSelected,
                ticketData.contactMethod === method.value && themeStyles.contactSelected
              )}
              onClick={() => setTicketData({ ...ticketData, contactMethod: method.value as any })}
            >
              <div>{method.label}</div>
              <small>{method.desc}</small>
            </div>
          ))}
        </div>
      </div>

      {ticketData.contactMethod === 'phone' && (
        <div className={commonStyles.formGroup}>
          <label>Phone Number</label>
          <input
            type="tel"
            value={ticketData.contactDetails}
            onChange={(e) => setTicketData({ ...ticketData, contactDetails: e.target.value })}
            placeholder="+1 (555) 123-4567"
            className={cn(commonStyles.input, themeStyles.input)}
            aria-label="Phone number"
          />
        </div>
      )}
    </div>
  );

  // STEP 4: Review
  const Step4Review = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.successIcon}>
        <CheckCircle />
      </div>
      <h2 className={commonStyles.reviewTitle}>Review Your Support Ticket</h2>

      <div className={cn(commonStyles.summaryCard, themeStyles.summaryCard)}>
        <h3>Category & Priority</h3>
        <div className={commonStyles.summaryRow}>
          <span>Category:</span>
          <strong>{CATEGORIES[ticketData.category as keyof typeof CATEGORIES]?.label}</strong>
        </div>
        <div className={commonStyles.summaryRow}>
          <span>Issue:</span>
          <strong>{ticketData.subcategory}</strong>
        </div>
        <div className={commonStyles.summaryRow}>
          <span>Priority:</span>
          <strong className={cn(commonStyles.priorityBadge, commonStyles[`badge${ticketData.priority}`])}>
            {ticketData.priority.toUpperCase()}
          </strong>
        </div>
      </div>

      <div className={cn(commonStyles.summaryCard, themeStyles.summaryCard)}>
        <h3>Issue Details</h3>
        <div className={commonStyles.summaryRow}>
          <span>Subject:</span>
          <strong>{ticketData.subject}</strong>
        </div>
        <div className={commonStyles.descriptionBox}>
          <p>{ticketData.description}</p>
        </div>
      </div>

      {ticketData.attachments.length > 0 && (
        <div className={cn(commonStyles.summaryCard, themeStyles.summaryCard)}>
          <h3>Attachments ({ticketData.attachments.length})</h3>
          <ul className={commonStyles.attachmentSummary}>
            {ticketData.attachments.map(a => (
              <li key={a.id}>{a.file.name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={cn(commonStyles.summaryCard, themeStyles.summaryCard)}>
        <h3>Contact Information</h3>
        <div className={commonStyles.summaryRow}>
          <span>Method:</span>
          <strong>{ticketData.contactMethod.toUpperCase()}</strong>
        </div>
        <div className={commonStyles.summaryRow}>
          <span>Details:</span>
          <strong>{ticketData.contactDetails}</strong>
        </div>
      </div>

      <div className={cn(commonStyles.responseBox, themeStyles.responseBox)}>
        <h4>Expected Response Time</h4>
        <p>
          {ticketData.priority === 'urgent' && 'Within 2 hours'}
          {ticketData.priority === 'high' && 'Within 4 hours'}
          {ticketData.priority === 'medium' && 'Within 24 hours'}
          {ticketData.priority === 'low' && 'Within 48 hours'}
        </p>
        <small>You'll receive updates via {ticketData.contactMethod}</small>
      </div>
    </div>
  );

  const validateStep1 = async () => {
    if (!ticketData.category || !ticketData.subcategory) {
      showToast('Please select a category and subcategory');
      return false;
    }
    return true;
  };

  const validateStep2 = async () => {
    if (ticketData.subject.length < 10) {
      showToast('Subject must be at least 10 characters');
      return false;
    }
    if (ticketData.description.length < 50) {
      showToast('Description must be at least 50 characters');
      return false;
    }
    return true;
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('category', ticketData.category);
      formData.append('subcategory', ticketData.subcategory);
      formData.append('priority', ticketData.priority);
      formData.append('subject', ticketData.subject);
      formData.append('description', ticketData.description);
      formData.append('contact_method', ticketData.contactMethod);
      formData.append('contact_details', ticketData.contactDetails);

      ticketData.attachments.forEach((attachment, index) => {
        formData.append(`attachment_${index}`, attachment.file);
        formData.append(`attachment_${index}_description`, attachment.description);
      });

      await api.supportTickets.create(formData);
      router.push('/support/tickets');
    } catch (error) {
      console.error('Error:', error);
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      id: 'category',
      title: 'Category',
      description: 'Select issue type',
      component: <Step1Category />,
      validate: validateStep1
    },
    {
      id: 'details',
      title: 'Details',
      description: 'Describe issue',
      component: <Step2Details />,
      validate: validateStep2
    },
    {
      id: 'attachments',
      title: 'Attachments',
      description: 'Add files',
      component: <Step3Attachments />
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Confirm & submit',
      component: <Step4Review />
    }
  ];

  return (
    <>
      <WizardContainer
        title="Create Support Ticket"
        subtitle="Get help from our support team"
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onComplete={handleComplete}
        isLoading={isSubmitting}
        completeBtnText="Submit Ticket"
      />
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, padding: '12px 24px',
          borderRadius: 8, color: '#fff', zIndex: 9999, fontSize: 14,
          backgroundColor: toast.type === 'success' ? '#27AE60' : '#e81123',
        }}>
          {toast.message}
        </div>
      )}
    </>
  );
}
