// @AI-HINT: Dispute resolution wizard for handling contract disputes with evidence submission
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { getAuthToken } from '@/lib/api';
import WizardContainer from '@/app/components/organisms/Wizard/WizardContainer/WizardContainer';
import Modal from '@/app/components/organisms/Modal/Modal';
import commonStyles from './DisputeWizard.common.module.css';
import lightStyles from './DisputeWizard.light.module.css';
import darkStyles from './DisputeWizard.dark.module.css';
import {
  AlertTriangle,
  FileText,
  DollarSign,
  Clock,
  FileUp,
  CheckCircle,
  Trash2,
  Info
} from 'lucide-react';
import api from '@/lib/api';

type DisputeType = 'payment' | 'quality' | 'deadline' | 'scope' | 'communication' | 'other';
type ResolutionPreference = 'refund' | 'revision' | 'mediation' | 'partial_refund';

interface EvidenceFile {
  id: string;
  file: File;
  type: 'screenshot' | 'document' | 'chat_log' | 'other';
  description: string;
}

interface DisputeData {
  contractId: string;
  projectName?: string;
  otherPartyName?: string;
  
  // Step 1: Type
  disputeType: DisputeType;
  customType?: string;
  
  // Step 2: Evidence
  evidence: EvidenceFile[];
  chatLogs: boolean;
  screenshots: boolean;
  documents: boolean;
  
  // Step 3: Explanation
  title: string;
  description: string;
  desiredOutcome: string;
  timeline: string;
  
  // Step 4: Resolution
  resolutionPreference: ResolutionPreference;
  refundAmount?: number;
  revisionDetails?: string;
  additionalNotes?: string;
  
  // Step 5: Review
  agreedToTerms: boolean;
  understoodProcess: boolean;
}

interface DisputeWizardProps {
  contractId: string;
  projectName?: string;
  otherPartyName?: string;
  userId: string;
  onComplete?: (disputeId: string) => void;
}

export default function DisputeWizard({
  contractId,
  projectName,
  otherPartyName,
  userId,
  onComplete
}: DisputeWizardProps) {
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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [skipEvidence, setSkipEvidence] = useState(false);
  const [disputeData, setDisputeData] = useState<DisputeData>({
    contractId,
    projectName,
    otherPartyName,
    disputeType: 'payment',
    evidence: [],
    chatLogs: false,
    screenshots: false,
    documents: false,
    title: '',
    description: '',
    desiredOutcome: '',
    timeline: '',
    resolutionPreference: 'mediation',
    agreedToTerms: false,
    understoodProcess: false
  });

  useEffect(() => {
    const draft = localStorage.getItem(`dispute_draft_${contractId}`);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setDisputeData(parsedDraft);
      } catch (error) {
        console.error('Failed to parse draft:', error);
      }
    }
  }, [contractId]);

  const saveDraft = () => {
    localStorage.setItem(`dispute_draft_${contractId}`, JSON.stringify(disputeData));
  };

  // Add evidence file
  const addEvidence = (file: File, type: EvidenceFile['type'], description: string) => {
    const newEvidence: EvidenceFile = {
      id: Date.now().toString(),
      file,
      type,
      description
    };
    setDisputeData({
      ...disputeData,
      evidence: [...disputeData.evidence, newEvidence]
    });
  };

  // Remove evidence
  const removeEvidence = (id: string) => {
    setDisputeData({
      ...disputeData,
      evidence: disputeData.evidence.filter(e => e.id !== id)
    });
  };

  // STEP 1: Dispute Type
  const Step1DisputeType = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.warningBox}>
        <AlertTriangle />
        <div>
          <h3>Before Filing a Dispute</h3>
          <p>We recommend trying to resolve the issue directly with the other party first. Disputes can affect both parties&apos; ratings and take time to resolve.</p>
        </div>
      </div>

      <div className={commonStyles.contractInfo}>
        <FileText />
        <div>
          <div className={commonStyles.label}>Contract:</div>
          <div className={commonStyles.value}>{projectName || contractId}</div>
        </div>
        <div>
          <div className={commonStyles.label}>Other Party:</div>
          <div className={commonStyles.value}>{otherPartyName || 'Unknown'}</div>
        </div>
      </div>

      <div className={commonStyles.formGroup}>
        <label>What is the primary issue?</label>
        <div className={commonStyles.typeGrid}>
          <div
            className={cn(
              commonStyles.typeCard,
              themeStyles.typeCard,
              disputeData.disputeType === 'payment' && commonStyles.typeCardSelected,
              disputeData.disputeType === 'payment' && themeStyles.typeCardSelected
            )}
            onClick={() => setDisputeData({ ...disputeData, disputeType: 'payment' })}
          >
            <DollarSign className={commonStyles.typeIcon} />
            <h4>Payment Issue</h4>
            <p>Non-payment, partial payment, or payment disputes</p>
          </div>

          <div
            className={cn(
              commonStyles.typeCard,
              themeStyles.typeCard,
              disputeData.disputeType === 'quality' && commonStyles.typeCardSelected,
              disputeData.disputeType === 'quality' && themeStyles.typeCardSelected
            )}
            onClick={() => setDisputeData({ ...disputeData, disputeType: 'quality' })}
          >
            <CheckCircle className={commonStyles.typeIcon} />
            <h4>Quality of Work</h4>
            <p>Work doesn&apos;t meet agreed standards or requirements</p>
          </div>

          <div
            className={cn(
              commonStyles.typeCard,
              themeStyles.typeCard,
              disputeData.disputeType === 'deadline' && commonStyles.typeCardSelected,
              disputeData.disputeType === 'deadline' && themeStyles.typeCardSelected
            )}
            onClick={() => setDisputeData({ ...disputeData, disputeType: 'deadline' })}
          >
            <Clock className={commonStyles.typeIcon} />
            <h4>Missed Deadline</h4>
            <p>Work not delivered by agreed deadline</p>
          </div>

          <div
            className={cn(
              commonStyles.typeCard,
              themeStyles.typeCard,
              disputeData.disputeType === 'scope' && commonStyles.typeCardSelected,
              disputeData.disputeType === 'scope' && themeStyles.typeCardSelected
            )}
            onClick={() => setDisputeData({ ...disputeData, disputeType: 'scope' })}
          >
            <FileText className={commonStyles.typeIcon} />
            <h4>Scope Creep</h4>
            <p>Work outside the agreed scope</p>
          </div>

          <div
            className={cn(
              commonStyles.typeCard,
              themeStyles.typeCard,
              disputeData.disputeType === 'communication' && commonStyles.typeCardSelected,
              disputeData.disputeType === 'communication' && themeStyles.typeCardSelected
            )}
            onClick={() => setDisputeData({ ...disputeData, disputeType: 'communication' })}
          >
            <Info className={commonStyles.typeIcon} />
            <h4>Communication</h4>
            <p>Lack of communication or unresponsiveness</p>
          </div>

          <div
            className={cn(
              commonStyles.typeCard,
              themeStyles.typeCard,
              disputeData.disputeType === 'other' && commonStyles.typeCardSelected,
              disputeData.disputeType === 'other' && themeStyles.typeCardSelected
            )}
            onClick={() => setDisputeData({ ...disputeData, disputeType: 'other' })}
          >
            <AlertTriangle className={commonStyles.typeIcon} />
            <h4>Other Issue</h4>
            <p>Different type of dispute</p>
          </div>
        </div>
      </div>

      {disputeData.disputeType === 'other' && (
        <div className={commonStyles.formGroup}>
          <label htmlFor="customType">Please specify the issue</label>
          <input
            type="text"
            id="customType"
            value={disputeData.customType || ''}
            onChange={(e) => setDisputeData({ ...disputeData, customType: e.target.value })}
            placeholder="Describe the type of issue"
          />
        </div>
      )}
    </div>
  );

  // STEP 2: Evidence
  const Step2Evidence = () => {
    const [newFileType, setNewFileType] = useState<EvidenceFile['type']>('screenshot');
    const [newFileDesc, setNewFileDesc] = useState('');

    return (
      <div className={commonStyles.stepContent}>
        <div className={cn(commonStyles.infoBox, themeStyles.infoBox)}>
          <Info />
          <p>Strong evidence increases the likelihood of a favorable resolution. Upload relevant screenshots, documents, chat logs, or other supporting materials.</p>
        </div>

        <div className={commonStyles.formGroup}>
          <label>Upload Evidence</label>
          <div className={commonStyles.uploadSection}>
            <input
              type="file"
              id="evidenceFile"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && newFileDesc) {
                  addEvidence(file, newFileType, newFileDesc);
                  setNewFileDesc('');
                  e.target.value = '';
                } else if (file && !newFileDesc) {
                  showToast('Please add a description for this file');
                }
              }}
              className={commonStyles.hiddenInput}
            />
            
            <div className={commonStyles.uploadControls}>
              <select
                value={newFileType}
                onChange={(e) => setNewFileType(e.target.value as EvidenceFile['type'])}
                className={commonStyles.typeSelect}
                aria-label="Select evidence file type"
              >
                <option value="screenshot">Screenshot</option>
                <option value="document">Document</option>
                <option value="chat_log">Chat Log</option>
                <option value="other">Other</option>
              </select>

              <input
                type="text"
                value={newFileDesc}
                onChange={(e) => setNewFileDesc(e.target.value)}
                placeholder="Brief description of this evidence"
                className={commonStyles.descInput}
                aria-label="Evidence file description"
              />

              <label
                htmlFor="evidenceFile"
                className={cn(commonStyles.uploadButton, themeStyles.uploadButton)}
              >
                <FileUp /> Upload File
              </label>
            </div>
          </div>
        </div>

        {disputeData.evidence.length > 0 && (
          <div className={commonStyles.evidenceList}>
            <h4>Uploaded Evidence ({disputeData.evidence.length})</h4>
            {disputeData.evidence.map((evidence) => (
              <div key={evidence.id} className={cn(commonStyles.evidenceItem, themeStyles.evidenceItem)}>
                <div className={commonStyles.evidenceIcon}>
                  <FileUp />
                </div>
                <div className={commonStyles.evidenceInfo}>
                  <div className={commonStyles.evidenceName}>{evidence.file.name}</div>
                  <div className={commonStyles.evidenceDesc}>{evidence.description}</div>
                  <div className={commonStyles.evidenceMeta}>
                    {evidence.type} • {(evidence.file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <button
                  type="button"
                  className={commonStyles.removeButton}
                  onClick={() => removeEvidence(evidence.id)}
                  aria-label="Remove evidence file"
                >
                  <Trash2 />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={commonStyles.evidenceChecklist}>
          <h4>Evidence Checklist</h4>
          <label className={commonStyles.checkboxLabel}>
            <input
              type="checkbox"
              checked={disputeData.screenshots}
              onChange={(e) => setDisputeData({ ...disputeData, screenshots: e.target.checked })}
            />
            <span>I have relevant screenshots</span>
          </label>
          <label className={commonStyles.checkboxLabel}>
            <input
              type="checkbox"
              checked={disputeData.chatLogs}
              onChange={(e) => setDisputeData({ ...disputeData, chatLogs: e.target.checked })}
            />
            <span>I have chat/email communication logs</span>
          </label>
          <label className={commonStyles.checkboxLabel}>
            <input
              type="checkbox"
              checked={disputeData.documents}
              onChange={(e) => setDisputeData({ ...disputeData, documents: e.target.checked })}
            />
            <span>I have relevant documents/files</span>
          </label>
        </div>
      </div>
    );
  };

  // STEP 3: Explanation
  const Step3Explanation = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.formGroup}>
        <label htmlFor="title">Dispute Title</label>
        <input
          type="text"
          id="title"
          value={disputeData.title}
          onChange={(e) => setDisputeData({ ...disputeData, title: e.target.value })}
          placeholder="Brief summary of the issue"
          maxLength={100}
        />
        <small>{disputeData.title.length}/100 characters</small>
      </div>

      <div className={commonStyles.formGroup}>
        <label htmlFor="description">Detailed Description</label>
        <textarea
          id="description"
          value={disputeData.description}
          onChange={(e) => setDisputeData({ ...disputeData, description: e.target.value })}
          placeholder="Provide a detailed explanation of what happened, including dates, communications, and any relevant context..."
          rows={8}
          minLength={100}
        />
        <small>{disputeData.description.length} characters (minimum 100)</small>
      </div>

      <div className={commonStyles.formGroup}>
        <label htmlFor="timeline">Timeline of Events</label>
        <textarea
          id="timeline"
          value={disputeData.timeline}
          onChange={(e) => setDisputeData({ ...disputeData, timeline: e.target.value })}
          placeholder="List key events chronologically (e.g., 'Nov 1 - Contract signed, Nov 5 - First deliverable due, Nov 10 - Issue occurred...')"
          rows={5}
        />
      </div>

      <div className={commonStyles.formGroup}>
        <label htmlFor="desiredOutcome">Desired Outcome</label>
        <textarea
          id="desiredOutcome"
          value={disputeData.desiredOutcome}
          onChange={(e) => setDisputeData({ ...disputeData, desiredOutcome: e.target.value })}
          placeholder="What would you like to happen to resolve this dispute?"
          rows={4}
        />
      </div>

      <div className={cn(commonStyles.tipBox, themeStyles.tipBox)}>
        <strong>💡 Pro Tip:</strong> Be professional, factual, and specific. Include dates, amounts, and quote relevant parts of your contract. Avoid emotional language.
      </div>
    </div>
  );

  // STEP 4: Resolution Preference
  const Step4Resolution = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.formGroup}>
        <label>Preferred Resolution</label>
        <div className={commonStyles.resolutionGrid}>
          <div
            className={cn(
              commonStyles.resolutionCard,
              themeStyles.resolutionCard,
              disputeData.resolutionPreference === 'refund' && commonStyles.resolutionCardSelected,
              disputeData.resolutionPreference === 'refund' && themeStyles.resolutionCardSelected
            )}
            onClick={() => setDisputeData({ ...disputeData, resolutionPreference: 'refund' })}
          >
            <DollarSign className={commonStyles.resolutionIcon} />
            <h4>Full Refund</h4>
            <p>Request complete refund of payment</p>
          </div>

          <div
            className={cn(
              commonStyles.resolutionCard,
              themeStyles.resolutionCard,
              disputeData.resolutionPreference === 'partial_refund' && commonStyles.resolutionCardSelected,
              disputeData.resolutionPreference === 'partial_refund' && themeStyles.resolutionCardSelected
            )}
            onClick={() => setDisputeData({ ...disputeData, resolutionPreference: 'partial_refund' })}
          >
            <DollarSign className={commonStyles.resolutionIcon} />
            <h4>Partial Refund</h4>
            <p>Request refund for incomplete work</p>
          </div>

          <div
            className={cn(
              commonStyles.resolutionCard,
              themeStyles.resolutionCard,
              disputeData.resolutionPreference === 'revision' && commonStyles.resolutionCardSelected,
              disputeData.resolutionPreference === 'revision' && themeStyles.resolutionCardSelected
            )}
            onClick={() => setDisputeData({ ...disputeData, resolutionPreference: 'revision' })}
          >
            <CheckCircle className={commonStyles.resolutionIcon} />
            <h4>Work Revision</h4>
            <p>Request changes to meet requirements</p>
          </div>

          <div
            className={cn(
              commonStyles.resolutionCard,
              themeStyles.resolutionCard,
              disputeData.resolutionPreference === 'mediation' && commonStyles.resolutionCardSelected,
              disputeData.resolutionPreference === 'mediation' && themeStyles.resolutionCardSelected
            )}
            onClick={() => setDisputeData({ ...disputeData, resolutionPreference: 'mediation' })}
          >
            <Info className={commonStyles.resolutionIcon} />
            <h4>Mediation</h4>
            <p>Let our team help find a solution</p>
          </div>
        </div>
      </div>

      {disputeData.resolutionPreference === 'partial_refund' && (
        <div className={commonStyles.formGroup}>
          <label htmlFor="refundAmount">Refund Amount Requested</label>
          <div className={commonStyles.amountInput}>
            <span className={commonStyles.currencySymbol}>$</span>
            <input
              type="number"
              id="refundAmount"
              value={disputeData.refundAmount || ''}
              onChange={(e) => setDisputeData({ ...disputeData, refundAmount: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
        </div>
      )}

      {disputeData.resolutionPreference === 'revision' && (
        <div className={commonStyles.formGroup}>
          <label htmlFor="revisionDetails">Revision Details</label>
          <textarea
            id="revisionDetails"
            value={disputeData.revisionDetails || ''}
            onChange={(e) => setDisputeData({ ...disputeData, revisionDetails: e.target.value })}
            placeholder="Specify what needs to be revised and how..."
            rows={5}
          />
        </div>
      )}

      <div className={commonStyles.formGroup}>
        <label htmlFor="additionalNotes">Additional Notes (Optional)</label>
        <textarea
          id="additionalNotes"
          value={disputeData.additionalNotes || ''}
          onChange={(e) => setDisputeData({ ...disputeData, additionalNotes: e.target.value })}
          placeholder="Any other information that might help resolve this dispute..."
          rows={4}
        />
      </div>
    </div>
  );

  // STEP 5: Review & Submit
  const Step5Review = () => (
    <div className={commonStyles.stepContent}>
      <div className={cn(commonStyles.summaryBox, themeStyles.summaryBox)}>
        <h3>Dispute Summary</h3>

        <div className={commonStyles.summarySection}>
          <div className={commonStyles.summaryLabel}>Contract:</div>
          <div className={commonStyles.summaryValue}>{projectName || contractId}</div>
        </div>

        <div className={commonStyles.summarySection}>
          <div className={commonStyles.summaryLabel}>Issue Type:</div>
          <div className={commonStyles.summaryValue}>
            {disputeData.disputeType === 'payment' && 'Payment Issue'}
            {disputeData.disputeType === 'quality' && 'Quality of Work'}
            {disputeData.disputeType === 'deadline' && 'Missed Deadline'}
            {disputeData.disputeType === 'scope' && 'Scope Creep'}
            {disputeData.disputeType === 'communication' && 'Communication'}
            {disputeData.disputeType === 'other' && (disputeData.customType || 'Other')}
          </div>
        </div>

        <div className={commonStyles.summarySection}>
          <div className={commonStyles.summaryLabel}>Title:</div>
          <div className={commonStyles.summaryValue}>{disputeData.title}</div>
        </div>

        <div className={commonStyles.summarySection}>
          <div className={commonStyles.summaryLabel}>Evidence Files:</div>
          <div className={commonStyles.summaryValue}>{disputeData.evidence.length} file(s)</div>
        </div>

        <div className={commonStyles.summarySection}>
          <div className={commonStyles.summaryLabel}>Preferred Resolution:</div>
          <div className={commonStyles.summaryValue}>
            {disputeData.resolutionPreference === 'refund' && 'Full Refund'}
            {disputeData.resolutionPreference === 'partial_refund' && `Partial Refund ($${disputeData.refundAmount?.toFixed(2)})`}
            {disputeData.resolutionPreference === 'revision' && 'Work Revision'}
            {disputeData.resolutionPreference === 'mediation' && 'Mediation'}
          </div>
        </div>
      </div>

      <div className={cn(commonStyles.processBox, themeStyles.processBox)}>
        <h4>What Happens Next?</h4>
        <ol>
          <li>Your dispute will be reviewed by our team within 24 hours</li>
          <li>The other party will be notified and given 48 hours to respond</li>
          <li>Our mediation team will review all evidence and communications</li>
          <li>A resolution will be proposed within 5-7 business days</li>
          <li>Both parties will have the opportunity to accept or appeal</li>
        </ol>
      </div>

      <div className={commonStyles.agreementSection}>
        <label className={commonStyles.checkboxLabel}>
          <input
            type="checkbox"
            checked={disputeData.understoodProcess}
            onChange={(e) => setDisputeData({ ...disputeData, understoodProcess: e.target.checked })}
          />
          <span>I understand the dispute resolution process and timeline</span>
        </label>

        <label className={commonStyles.checkboxLabel}>
          <input
            type="checkbox"
            checked={disputeData.agreedToTerms}
            onChange={(e) => setDisputeData({ ...disputeData, agreedToTerms: e.target.checked })}
          />
          <span>I agree to abide by the mediation decision and MegiLance&apos;s dispute resolution terms</span>
        </label>
      </div>

      <div className={cn(commonStyles.warningBox, themeStyles.warningBox)}>
        <AlertTriangle />
        <p><strong>Important:</strong> Filing a false or fraudulent dispute may result in account suspension. Please ensure all information provided is accurate and truthful.</p>
      </div>
    </div>
  );

  // Validation
  const validateStep1 = async () => {
    if (disputeData.disputeType === 'other' && !disputeData.customType) {
      showToast('Please specify the type of issue');
      return false;
    }
    return true;
  };

  const validateStep2 = async () => {
    if (disputeData.evidence.length === 0 && !skipEvidence) {
      setShowEvidenceModal(true);
      return false;
    }
    return true;
  };

  const validateStep3 = async () => {
    if (!disputeData.title || disputeData.title.length < 10) {
      showToast('Please provide a descriptive title (at least 10 characters)');
      return false;
    }
    if (!disputeData.description || disputeData.description.length < 100) {
      showToast('Please provide a detailed description (at least 100 characters)');
      return false;
    }
    if (!disputeData.desiredOutcome) {
      showToast('Please specify your desired outcome');
      return false;
    }
    return true;
  };

  const validateStep5 = async () => {
    if (!disputeData.understoodProcess || !disputeData.agreedToTerms) {
      showToast('Please agree to the terms and confirm you understand the process');
      return false;
    }
    return true;
  };

  // Handle completion
  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      const token = getAuthToken();
      const formData = new FormData();

      formData.append('contract_id', contractId);
      formData.append('user_id', userId);
      formData.append('dispute_type', disputeData.disputeType);
      formData.append('title', disputeData.title);
      formData.append('description', disputeData.description);
      formData.append('timeline', disputeData.timeline);
      formData.append('desired_outcome', disputeData.desiredOutcome);
      formData.append('resolution_preference', disputeData.resolutionPreference);

      if (disputeData.customType) formData.append('custom_type', disputeData.customType);
      if (disputeData.refundAmount) formData.append('refund_amount', disputeData.refundAmount.toString());
      if (disputeData.revisionDetails) formData.append('revision_details', disputeData.revisionDetails);
      if (disputeData.additionalNotes) formData.append('additional_notes', disputeData.additionalNotes);

      // Append evidence files
      disputeData.evidence.forEach((evidence, index) => {
        formData.append(`evidence_${index}`, evidence.file);
        formData.append(`evidence_${index}_type`, evidence.type);
        formData.append(`evidence_${index}_description`, evidence.description);
      });

      const result = await api.disputes.create(formData) as any;

      localStorage.removeItem(`dispute_draft_${contractId}`);
      showToast('Dispute submitted successfully. Our team will review it within 24 hours.', 'success');

      if (onComplete) {
        onComplete(result.id);
      } else {
        router.push(`/portal/disputes/${result.id}`);
      }
    } catch (error) {
      console.error('Error submitting dispute:', error);
      showToast('Failed to submit dispute. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const steps = [
    {
      id: 'type',
      title: 'Dispute Type',
      description: 'Select the issue type',
      component: <Step1DisputeType />,
      validate: validateStep1
    },
    {
      id: 'evidence',
      title: 'Evidence',
      description: 'Upload supporting documents',
      component: <Step2Evidence />,
      validate: validateStep2
    },
    {
      id: 'explanation',
      title: 'Explanation',
      description: 'Describe the issue',
      component: <Step3Explanation />,
      validate: validateStep3
    },
    {
      id: 'resolution',
      title: 'Resolution',
      description: 'Preferred outcome',
      component: <Step4Resolution />
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Confirm and submit',
      component: <Step5Review />,
      validate: validateStep5
    }
  ];

  return (
    <>
      <WizardContainer
        title="File a Dispute"
        subtitle={`Contract: ${projectName || contractId}`}
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
        title="Cancel Dispute Filing"
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
      <Modal
        isOpen={showEvidenceModal}
        title="No Evidence Uploaded"
        onClose={() => setShowEvidenceModal(false)}
        footer={
          <>
            <button onClick={() => setShowEvidenceModal(false)}>Go Back</button>
            <button onClick={() => { setSkipEvidence(true); setShowEvidenceModal(false); setCurrentStep(2); }}>Continue Without Evidence</button>
          </>
        }
      >
        <p>You haven&apos;t uploaded any evidence. Disputes with evidence are more likely to be resolved favorably. Continue anyway?</p>
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
