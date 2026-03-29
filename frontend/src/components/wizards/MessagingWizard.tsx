// @AI-HINT: Messaging wizard for initiating new conversations with attachments and templates
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import WizardContainer from '@/app/components/organisms/Wizard/WizardContainer/WizardContainer';
import Modal from '@/app/components/organisms/Modal/Modal';
import commonStyles from './MessagingWizard.common.module.css';
import lightStyles from './MessagingWizard.light.module.css';
import darkStyles from './MessagingWizard.dark.module.css';
import {
  Search,
  User,
  Briefcase,
  FileText,
  CircleHelp,
  DollarSign,
  FileUp,
  Trash2,
  Paperclip,
  Info
} from 'lucide-react';

type MessagePurpose = 'project_inquiry' | 'proposal_discussion' | 'contract_question' | 'general';
type RecipientType = 'freelancer' | 'client';

interface Attachment {
  id: string;
  file: File;
  name: string;
  size: number;
}

interface Recipient {
  id: string;
  name: string;
  type: RecipientType;
  avatar?: string;
  title?: string;
  rating?: number;
}

interface MessageData {
  // Step 1: Recipient
  recipient: Recipient | null;
  searchQuery: string;
  
  // Step 2: Purpose
  purpose: MessagePurpose;
  relatedProjectId?: string;
  relatedContractId?: string;
  
  // Step 3: Message
  subject: string;
  message: string;
  useTemplate: boolean;
  selectedTemplate?: string;
  
  // Step 4: Attachments
  attachments: Attachment[];
}

interface MessagingWizardProps {
  userId: string;
  userType: RecipientType;
  preselectedRecipient?: Recipient;
  relatedProjectId?: string;
  onComplete?: (conversationId: string) => void;
}

const MESSAGE_TEMPLATES = {
  project_inquiry: {
    subject: 'Inquiry about Your Project',
    message: `Hi [Name],

I came across your project and I'm very interested in working with you. I have [X years] of experience in [your expertise] and believe I can deliver excellent results.

I'd love to discuss:
- Project requirements and timeline
- Your expected deliverables
- Budget and milestones

Would you be available for a brief call to discuss this opportunity?

Best regards`
  },
  proposal_discussion: {
    subject: 'Following Up on My Proposal',
    message: `Hi [Name],

I wanted to follow up on the proposal I submitted for [project name]. I'm excited about the opportunity to work on this project.

I'm available to:
- Answer any questions about my approach
- Adjust the timeline or deliverables
- Discuss the budget

Please let me know if you need any additional information.

Looking forward to hearing from you!`
  },
  contract_question: {
    subject: 'Question About Contract Terms',
    message: `Hi [Name],

I have a question regarding our contract for [project name]. I want to ensure we're aligned on:

[Specific question or clarification needed]

Could we discuss this at your earliest convenience?

Thank you!`
  },
  general: {
    subject: '',
    message: ''
  }
};

export default function MessagingWizard({
  userId,
  userType,
  preselectedRecipient,
  relatedProjectId,
  onComplete
}: MessagingWizardProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [messageData, setMessageData] = useState<MessageData>({
    recipient: preselectedRecipient || null,
    searchQuery: '',
    purpose: 'general',
    relatedProjectId,
    subject: '',
    message: '',
    useTemplate: false,
    attachments: []
  });

  useEffect(() => {
    const draft = localStorage.getItem('messaging_draft');
    if (draft && !preselectedRecipient) {
      try {
        const parsedDraft = JSON.parse(draft);
        setMessageData(parsedDraft);
      } catch (error) {
        console.error('Failed to parse draft:', error);
      }
    }
  }, [preselectedRecipient]);

  const saveDraft = () => {
    localStorage.setItem('messaging_draft', JSON.stringify(messageData));
  };

  // Search for recipients
  const searchRecipients = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const targetType = userType === 'client' ? 'freelancer' : 'client';
      const results = await api.users.search(query, targetType) as any;
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchRecipients(messageData.searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [messageData.searchQuery]);

  // Apply template
  const applyTemplate = (purpose: MessagePurpose) => {
    const template = MESSAGE_TEMPLATES[purpose];
    setMessageData({
      ...messageData,
      purpose,
      subject: template.subject,
      message: template.message,
      useTemplate: true,
      selectedTemplate: purpose
    });
  };

  // Add attachment
  const addAttachment = (file: File) => {
    const newAttachment: Attachment = {
      id: Date.now().toString(),
      file,
      name: file.name,
      size: file.size
    };
    setMessageData({
      ...messageData,
      attachments: [...messageData.attachments, newAttachment]
    });
  };

  // Remove attachment
  const removeAttachment = (id: string) => {
    setMessageData({
      ...messageData,
      attachments: messageData.attachments.filter(a => a.id !== id)
    });
  };

  // STEP 1: Recipient Selection
  const Step1Recipient = () => (
    <div className={commonStyles.stepContent}>
      {preselectedRecipient ? (
        <div className={cn(commonStyles.selectedRecipient, themeStyles.selectedRecipient)}>
          <div className={commonStyles.recipientAvatar}>
            {preselectedRecipient.avatar ? (
              <img src={preselectedRecipient.avatar} alt={preselectedRecipient.name} />
            ) : (
              <User />
            )}
          </div>
          <div className={commonStyles.recipientInfo}>
            <h3>{preselectedRecipient.name}</h3>
            {preselectedRecipient.title && <p>{preselectedRecipient.title}</p>}
            {preselectedRecipient.rating && (
              <div className={commonStyles.rating}>⭐ {preselectedRecipient.rating.toFixed(1)}</div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className={commonStyles.searchBox}>
            <Search className={commonStyles.searchIcon} />
            <input
              type="text"
              placeholder={`Search for ${userType === 'client' ? 'freelancers' : 'clients'}...`}
              value={messageData.searchQuery}
              onChange={(e) => setMessageData({ ...messageData, searchQuery: e.target.value })}
              className={cn(commonStyles.searchInput, themeStyles.searchInput)}
              aria-label="Search for recipients"
            />
          </div>

          {isSearching && (
            <div className={commonStyles.searchStatus}>Searching...</div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className={commonStyles.searchResults}>
              <h4>Search Results ({searchResults.length})</h4>
              {searchResults.map((recipient) => (
                <div
                  key={recipient.id}
                  className={cn(
                    commonStyles.recipientCard,
                    themeStyles.recipientCard,
                    messageData.recipient?.id === recipient.id && commonStyles.recipientCardSelected,
                    messageData.recipient?.id === recipient.id && themeStyles.recipientCardSelected
                  )}
                  onClick={() => setMessageData({ ...messageData, recipient })}
                >
                  <div className={commonStyles.recipientAvatar}>
                    {recipient.avatar ? (
                      <img src={recipient.avatar} alt={recipient.name} />
                    ) : (
                      <User />
                    )}
                  </div>
                  <div className={commonStyles.recipientInfo}>
                    <h4>{recipient.name}</h4>
                    {recipient.title && <p>{recipient.title}</p>}
                    {recipient.rating && (
                      <div className={commonStyles.rating}>⭐ {recipient.rating.toFixed(1)}</div>
                    )}
                  </div>
                  <div className={commonStyles.recipientType}>
                    {recipient.type === 'freelancer' ? <Briefcase /> : <DollarSign />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isSearching && messageData.searchQuery && searchResults.length === 0 && (
            <div className={cn(commonStyles.noResults, themeStyles.noResults)}>
              <p>No users found matching &quot;{messageData.searchQuery}&quot;</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  // STEP 2: Message Purpose
  const Step2Purpose = () => (
    <div className={commonStyles.stepContent}>
      <div className={cn(commonStyles.infoBox, themeStyles.infoBox)}>
        <Info />
        <p>Selecting a purpose helps us provide relevant templates and context for your message.</p>
      </div>

      <div className={commonStyles.purposeGrid}>
        <div
          className={cn(
            commonStyles.purposeCard,
            themeStyles.purposeCard,
            messageData.purpose === 'project_inquiry' && commonStyles.purposeCardSelected,
            messageData.purpose === 'project_inquiry' && themeStyles.purposeCardSelected
          )}
          onClick={() => applyTemplate('project_inquiry')}
        >
          <Briefcase className={commonStyles.purposeIcon} />
          <h4>Project Inquiry</h4>
          <p>Ask about a project or job posting</p>
        </div>

        <div
          className={cn(
            commonStyles.purposeCard,
            themeStyles.purposeCard,
            messageData.purpose === 'proposal_discussion' && commonStyles.purposeCardSelected,
            messageData.purpose === 'proposal_discussion' && themeStyles.purposeCardSelected
          )}
          onClick={() => applyTemplate('proposal_discussion')}
        >
          <DollarSign className={commonStyles.purposeIcon} />
          <h4>Proposal Discussion</h4>
          <p>Follow up on a submitted proposal</p>
        </div>

        <div
          className={cn(
            commonStyles.purposeCard,
            themeStyles.purposeCard,
            messageData.purpose === 'contract_question' && commonStyles.purposeCardSelected,
            messageData.purpose === 'contract_question' && themeStyles.purposeCardSelected
          )}
          onClick={() => applyTemplate('contract_question')}
        >
          <FileText className={commonStyles.purposeIcon} />
          <h4>Contract Question</h4>
          <p>Clarify contract terms or conditions</p>
        </div>

        <div
          className={cn(
            commonStyles.purposeCard,
            themeStyles.purposeCard,
            messageData.purpose === 'general' && commonStyles.purposeCardSelected,
            messageData.purpose === 'general' && themeStyles.purposeCardSelected
          )}
          onClick={() => setMessageData({ ...messageData, purpose: 'general', useTemplate: false })}
        >
          <CircleHelp className={commonStyles.purposeIcon} />
          <h4>General Message</h4>
          <p>Start a general conversation</p>
        </div>
      </div>

      {messageData.purpose !== 'general' && (
        <div className={cn(commonStyles.templateNotice, themeStyles.templateNotice)}>
          ✨ A message template has been applied. You can customize it in the next step.
        </div>
      )}
    </div>
  );

  // STEP 3: Compose Message
  const Step3Message = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.formGroup}>
        <label htmlFor="subject">Subject</label>
        <input
          type="text"
          id="subject"
          value={messageData.subject}
          onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
          placeholder="Enter message subject"
          maxLength={100}
        />
        <small>{messageData.subject.length}/100 characters</small>
      </div>

      <div className={commonStyles.formGroup}>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          value={messageData.message}
          onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
          placeholder="Type your message here..."
          rows={12}
          minLength={20}
        />
        <small>{messageData.message.length} characters (minimum 20)</small>
      </div>

      {messageData.useTemplate && (
        <div className={cn(commonStyles.tipBox, themeStyles.tipBox)}>
          <strong>💡 Tip:</strong> Replace placeholders like [Name], [X years], and [project name] with actual information before sending.
        </div>
      )}
    </div>
  );

  // STEP 4: Attachments
  const Step4Attachments = () => (
    <div className={commonStyles.stepContent}>
      <div className={cn(commonStyles.infoBox, themeStyles.infoBox)}>
        <Info />
        <p>Attachments are optional. You can attach relevant files like portfolios, designs, or documents (Max 10MB per file).</p>
      </div>

      <div className={commonStyles.uploadSection}>
        <input
          type="file"
          id="attachmentFile"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.zip"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (file.size > 10 * 1024 * 1024) {
                showToast('File size must be less than 10MB');
                return;
              }
              addAttachment(file);
              e.target.value = '';
            }
          }}
          className={commonStyles.hiddenInput}
        />
        
        <label
          htmlFor="attachmentFile"
          className={cn(commonStyles.uploadButton, themeStyles.uploadButton)}
        >
          <FileUp /> Add Attachment
        </label>
      </div>

      {messageData.attachments.length > 0 && (
        <div className={commonStyles.attachmentList}>
          <h4>Attachments ({messageData.attachments.length})</h4>
          {messageData.attachments.map((attachment) => (
            <div key={attachment.id} className={cn(commonStyles.attachmentItem, themeStyles.attachmentItem)}>
              <div className={commonStyles.attachmentIcon}>
                <Paperclip />
              </div>
              <div className={commonStyles.attachmentInfo}>
                <div className={commonStyles.attachmentName}>{attachment.name}</div>
                <div className={commonStyles.attachmentSize}>
                  {(attachment.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <button
                type="button"
                className={commonStyles.removeButton}
                onClick={() => removeAttachment(attachment.id)}
                aria-label="Remove attachment"
              >
                <Trash2 />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={cn(commonStyles.previewBox, themeStyles.previewBox)}>
        <h4>Message Preview</h4>
        <div className={commonStyles.previewRecipient}>
          <strong>To:</strong> {messageData.recipient?.name}
        </div>
        <div className={commonStyles.previewSubject}>
          <strong>Subject:</strong> {messageData.subject || '(No subject)'}
        </div>
        <div className={commonStyles.previewMessage}>
          {messageData.message || '(No message)'}
        </div>
        {messageData.attachments.length > 0 && (
          <div className={commonStyles.previewAttachments}>
            📎 {messageData.attachments.length} attachment(s)
          </div>
        )}
      </div>
    </div>
  );

  // Validation
  const validateStep1 = async () => {
    if (!messageData.recipient) {
      showToast('Please select a recipient');
      return false;
    }
    return true;
  };

  const validateStep3 = async () => {
    if (!messageData.subject || messageData.subject.trim().length < 3) {
      showToast('Please enter a subject (at least 3 characters)');
      return false;
    }
    if (!messageData.message || messageData.message.trim().length < 20) {
      showToast('Please enter a message (at least 20 characters)');
      return false;
    }
    return true;
  };

  // Handle completion
  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append('sender_id', userId);
      formData.append('recipient_id', messageData.recipient!.id);
      formData.append('subject', messageData.subject);
      formData.append('message', messageData.message);
      formData.append('purpose', messageData.purpose);

      if (messageData.relatedProjectId) {
        formData.append('related_project_id', messageData.relatedProjectId);
      }
      if (messageData.relatedContractId) {
        formData.append('related_contract_id', messageData.relatedContractId);
      }

      // Append attachments
      messageData.attachments.forEach((attachment, index) => {
        formData.append(`attachment_${index}`, attachment.file);
      });

      const result = await api.messages.createConversation(formData) as any;

      localStorage.removeItem('messaging_draft');
      
      if (onComplete) {
        onComplete(result.conversation_id);
      } else {
        router.push(`/messages/${result.conversation_id}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const steps = [
    {
      id: 'recipient',
      title: 'Select Recipient',
      description: 'Choose who to message',
      component: <Step1Recipient />,
      validate: validateStep1
    },
    {
      id: 'purpose',
      title: 'Message Purpose',
      description: 'What is this about?',
      component: <Step2Purpose />
    },
    {
      id: 'message',
      title: 'Compose Message',
      description: 'Write your message',
      component: <Step3Message />,
      validate: validateStep3
    },
    {
      id: 'attachments',
      title: 'Attachments',
      description: 'Add files (optional)',
      component: <Step4Attachments />
    }
  ];

  return (
    <>
      <WizardContainer
        title="New Message"
        subtitle={messageData.recipient ? `To: ${messageData.recipient.name}` : 'Compose a new message'}
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onComplete={handleComplete}
        onCancel={handleCancel}
        isLoading={isSubmitting}
        saveProgress={saveDraft}
      />
      <Modal
        isOpen={showCancelModal}
        title="Cancel Message"
        onClose={() => setShowCancelModal(false)}
        footer={
          <>
            <button onClick={() => setShowCancelModal(false)}>Continue Editing</button>
            <button onClick={() => { saveDraft(); setShowCancelModal(false); router.back(); }}>Yes, Cancel</button>
          </>
        }
      >
        <p>Are you sure you want to cancel? Your progress will be saved as a draft.</p>
      </Modal>
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
