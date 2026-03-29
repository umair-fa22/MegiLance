// @AI-HINT: Refund request wizard for processing payment refunds with evidence
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import WizardContainer from '@/app/components/organisms/Wizard/WizardContainer/WizardContainer';
import commonStyles from './RefundRequestWizard.common.module.css';
import lightStyles from './RefundRequestWizard.light.module.css';
import darkStyles from './RefundRequestWizard.dark.module.css';
import { Undo2, AlertTriangle, FileUp, Calculator } from 'lucide-react';
import api from '@/lib/api';

interface EvidenceFile {
  id: string;
  file: File;
  type: string;
  description: string;
}

interface RefundData {
  paymentId: string;
  originalAmount: number;
  reason: string;
  reasonDetails: string;
  refundType: 'full' | 'partial';
  refundAmount: number;
  evidence: EvidenceFile[];
  justification: string;
  bankDetails?: {
    accountHolder: string;
    accountNumber: string;
    routingNumber: string;
  };
}

interface RefundRequestWizardProps {
  paymentId: string;
  originalAmount: number;
  userId: string;
}

const REFUND_REASONS = [
  { id: 'service_not_delivered', label: 'Service Not Delivered', description: 'Work was never completed or delivered' },
  { id: 'poor_quality', label: 'Poor Quality', description: 'Delivered work does not meet agreed standards' },
  { id: 'missed_deadline', label: 'Missed Deadline', description: 'Work not completed within agreed timeframe' },
  { id: 'unauthorized_charge', label: 'Unauthorized Charge', description: 'Payment was made without authorization' },
  { id: 'duplicate_payment', label: 'Duplicate Payment', description: 'Same invoice was paid multiple times' },
  { id: 'other', label: 'Other Reason', description: 'Different reason not listed above' }
];

export default function RefundRequestWizard({
  paymentId,
  originalAmount,
  userId
}: RefundRequestWizardProps) {
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

  const [refundData, setRefundData] = useState<RefundData>({
    paymentId,
    originalAmount,
    reason: '',
    reasonDetails: '',
    refundType: 'full',
    refundAmount: originalAmount,
    evidence: [],
    justification: ''
  });

  useEffect(() => {
    if (refundData.refundType === 'full') {
      setRefundData(prev => ({ ...prev, refundAmount: originalAmount }));
    }
  }, [refundData.refundType, originalAmount]);

  const addEvidence = (files: FileList | null) => {
    if (!files) return;
    
    const newEvidence: EvidenceFile[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${file.name}`,
      file,
      type: 'document',
      description: ''
    }));

    setRefundData({
      ...refundData,
      evidence: [...refundData.evidence, ...newEvidence]
    });
  };

  const updateEvidence = (id: string, field: string, value: string) => {
    setRefundData({
      ...refundData,
      evidence: refundData.evidence.map(e =>
        e.id === id ? { ...e, [field]: value } : e
      )
    });
  };

  const removeEvidence = (id: string) => {
    setRefundData({
      ...refundData,
      evidence: refundData.evidence.filter(e => e.id !== id)
    });
  };

  // STEP 1: Reason Selection
  const Step1Reason = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.header}>
        <Undo2 className={commonStyles.icon} />
        <div>
          <h2>Refund Request</h2>
          <p>Select the reason for requesting a refund</p>
        </div>
      </div>

      <div className={cn(commonStyles.warningBox, themeStyles.warningBox)}>
        <AlertTriangle />
        <div>
          <strong>Important:</strong> Refund requests are carefully reviewed. Please provide accurate information and supporting evidence.
        </div>
      </div>

      <div className={cn(commonStyles.paymentInfo, themeStyles.paymentInfo)}>
        <div>
          <span>Payment ID:</span>
          <strong>{paymentId}</strong>
        </div>
        <div>
          <span>Original Amount:</span>
          <strong>${originalAmount.toFixed(2)}</strong>
        </div>
      </div>

      <div className={commonStyles.reasonsGrid}>
        {REFUND_REASONS.map(reason => (
          <div
            key={reason.id}
            className={cn(
              commonStyles.reasonCard,
              themeStyles.reasonCard,
              refundData.reason === reason.id && commonStyles.reasonSelected,
              refundData.reason === reason.id && themeStyles.reasonSelected
            )}
            onClick={() => setRefundData({ ...refundData, reason: reason.id })}
          >
            <h4>{reason.label}</h4>
            <p>{reason.description}</p>
          </div>
        ))}
      </div>

      {refundData.reason && (
        <div className={commonStyles.formGroup}>
          <label>Please provide more details about this issue</label>
          <textarea
            value={refundData.reasonDetails}
            onChange={(e) => setRefundData({ ...refundData, reasonDetails: e.target.value })}
            placeholder="Describe what happened and why you're requesting a refund..."
            rows={4}
            className={cn(commonStyles.textarea, themeStyles.textarea)}
            aria-label="Refund reason details"
          />
          <div className={commonStyles.charCount}>
            {refundData.reasonDetails.length}/500 characters
          </div>
        </div>
      )}
    </div>
  );

  // STEP 2: Evidence Upload
  const Step2Evidence = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.header}>
        <FileUp className={commonStyles.icon} />
        <div>
          <h2>Supporting Evidence</h2>
          <p>Upload documents to support your refund request</p>
        </div>
      </div>

      <div className={cn(commonStyles.uploadBox, themeStyles.uploadBox)}>
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(e) => addEvidence(e.target.files)}
          id="evidence-upload"
          className={commonStyles.hiddenInput}
        />
        <label htmlFor="evidence-upload" className={cn(commonStyles.uploadButton, themeStyles.uploadButton)}>
          <FileUp />
          Upload Evidence
        </label>
        <p className={commonStyles.uploadHint}>
          Accepted: PDF, Images, Documents • Max 10MB per file
        </p>
      </div>

      {refundData.evidence.length > 0 && (
        <div className={commonStyles.evidenceList}>
          <h4>Uploaded Evidence ({refundData.evidence.length})</h4>
          {refundData.evidence.map(evidence => (
            <div key={evidence.id} className={cn(commonStyles.evidenceItem, themeStyles.evidenceItem)}>
              <div className={commonStyles.evidenceHeader}>
                <strong>{evidence.file.name}</strong>
                <span>{(evidence.file.size / 1024).toFixed(0)} KB</span>
                <button
                  onClick={() => removeEvidence(evidence.id)}
                  className={commonStyles.removeButton}
                >
                  Remove
                </button>
              </div>
              <div className={commonStyles.formGroup}>
                <label>Evidence Type</label>
                <select
                  value={evidence.type}
                  onChange={(e) => updateEvidence(evidence.id, 'type', e.target.value)}
                  className={cn(commonStyles.select, themeStyles.select)}
                  aria-label="Select evidence type"
                >
                  <option value="document">Contract/Agreement</option>
                  <option value="screenshot">Screenshot</option>
                  <option value="email">Email Communication</option>
                  <option value="invoice">Invoice/Receipt</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className={commonStyles.formGroup}>
                <label>Description</label>
                <input
                  type="text"
                  value={evidence.description}
                  onChange={(e) => updateEvidence(evidence.id, 'description', e.target.value)}
                  placeholder="Briefly describe this evidence..."
                  className={cn(commonStyles.input, themeStyles.input)}
                  aria-label="Evidence description"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={cn(commonStyles.infoBox, themeStyles.infoBox)}>
        <strong>Tip:</strong> Strong evidence increases approval chances. Include contracts, communications, and proof of non-delivery or quality issues.
      </div>
    </div>
  );

  // STEP 3: Refund Calculation
  const Step3Calculation = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.header}>
        <Calculator className={commonStyles.icon} />
        <div>
          <h2>Refund Amount</h2>
          <p>Specify the amount you're requesting</p>
        </div>
      </div>

      <div className={commonStyles.refundTypeGrid}>
        <div
          className={cn(
            commonStyles.typeCard,
            themeStyles.typeCard,
            refundData.refundType === 'full' && commonStyles.typeSelected,
            refundData.refundType === 'full' && themeStyles.typeSelected
          )}
          onClick={() => setRefundData({ ...refundData, refundType: 'full' })}
        >
          <h4>Full Refund</h4>
          <div className={commonStyles.amount}>${originalAmount.toFixed(2)}</div>
          <p>Request complete refund of payment</p>
        </div>

        <div
          className={cn(
            commonStyles.typeCard,
            themeStyles.typeCard,
            refundData.refundType === 'partial' && commonStyles.typeSelected,
            refundData.refundType === 'partial' && themeStyles.typeSelected
          )}
          onClick={() => setRefundData({ ...refundData, refundType: 'partial' })}
        >
          <h4>Partial Refund</h4>
          <div className={commonStyles.amount}>Custom</div>
          <p>Request partial refund amount</p>
        </div>
      </div>

      {refundData.refundType === 'partial' && (
        <div className={commonStyles.formGroup}>
          <label>Refund Amount ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max={originalAmount}
            value={refundData.refundAmount}
            onChange={(e) => setRefundData({
              ...refundData,
              refundAmount: Math.min(parseFloat(e.target.value) || 0, originalAmount)
            })}
            className={cn(commonStyles.input, themeStyles.input)}
            aria-label="Enter refund amount"
          />
          <div className={commonStyles.helperText}>
            Maximum: ${originalAmount.toFixed(2)} (original payment amount)
          </div>
        </div>
      )}

      <div className={cn(commonStyles.calculationBox, themeStyles.calculationBox)}>
        <div className={commonStyles.calcRow}>
          <span>Original Payment:</span>
          <strong>${originalAmount.toFixed(2)}</strong>
        </div>
        <div className={commonStyles.calcRow}>
          <span>Refund Amount:</span>
          <strong className={commonStyles.refundTotal}>
            ${refundData.refundAmount.toFixed(2)}
          </strong>
        </div>
        <div className={commonStyles.calcRow}>
          <span>Processing Fee:</span>
          <strong>$0.00</strong>
        </div>
        <div className={cn(commonStyles.calcRow, commonStyles.calcTotal)}>
          <span>You Will Receive:</span>
          <strong>${refundData.refundAmount.toFixed(2)}</strong>
        </div>
      </div>

      <div className={commonStyles.formGroup}>
        <label>Justification for Refund Amount</label>
        <textarea
          value={refundData.justification}
          onChange={(e) => setRefundData({ ...refundData, justification: e.target.value })}
          placeholder="Explain why this refund amount is appropriate..."
          rows={4}
          className={cn(commonStyles.textarea, themeStyles.textarea)}
          aria-label="Refund amount justification"
        />
      </div>
    </div>
  );

  // STEP 4: Review
  const Step4Review = () => (
    <div className={commonStyles.stepContent}>
      <h2>Review Refund Request</h2>

      <div className={cn(commonStyles.summaryCard, themeStyles.summaryCard)}>
        <h3>Request Details</h3>
        <div className={commonStyles.summaryRow}>
          <span>Reason:</span>
          <strong>{REFUND_REASONS.find(r => r.id === refundData.reason)?.label}</strong>
        </div>
        <div className={commonStyles.summaryRow}>
          <span>Details:</span>
          <p>{refundData.reasonDetails}</p>
        </div>
      </div>

      <div className={cn(commonStyles.summaryCard, themeStyles.summaryCard)}>
        <h3>Evidence Provided</h3>
        <ul className={commonStyles.evidenceSummary}>
          {refundData.evidence.map(e => (
            <li key={e.id}>
              <strong>{e.file.name}</strong> - {e.type}
            </li>
          ))}
          {refundData.evidence.length === 0 && (
            <li className={commonStyles.noEvidence}>No evidence uploaded</li>
          )}
        </ul>
      </div>

      <div className={cn(commonStyles.summaryCard, themeStyles.summaryCard)}>
        <h3>Refund Amount</h3>
        <div className={commonStyles.summaryRow}>
          <span>Type:</span>
          <strong>{refundData.refundType === 'full' ? 'Full Refund' : 'Partial Refund'}</strong>
        </div>
        <div className={commonStyles.summaryRow}>
          <span>Amount:</span>
          <strong className={commonStyles.refundTotal}>${refundData.refundAmount.toFixed(2)}</strong>
        </div>
      </div>

      <div className={cn(commonStyles.processBox, themeStyles.processBox)}>
        <h4>What Happens Next?</h4>
        <ol>
          <li>Your request will be reviewed within 2-3 business days</li>
          <li>We may contact you for additional information</li>
          <li>If approved, refund will be processed to your original payment method</li>
          <li>Refunds typically arrive within 5-10 business days</li>
        </ol>
      </div>
    </div>
  );

  const validateStep1 = async () => {
    if (!refundData.reason) return false;
    if (refundData.reasonDetails.length < 50) {
      showToast('Please provide more details (minimum 50 characters)');
      return false;
    }
    return true;
  };

  const validateStep3 = async () => {
    if (refundData.refundAmount <= 0 || refundData.refundAmount > originalAmount) {
      showToast('Invalid refund amount');
      return false;
    }
    if (!refundData.justification || refundData.justification.length < 30) {
      showToast('Please provide justification for the refund amount');
      return false;
    }
    return true;
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('payment_id', paymentId);
      formData.append('user_id', userId);
      formData.append('reason', refundData.reason);
      formData.append('reason_details', refundData.reasonDetails);
      formData.append('refund_type', refundData.refundType);
      formData.append('refund_amount', refundData.refundAmount.toString());
      formData.append('justification', refundData.justification);

      refundData.evidence.forEach((evidence, index) => {
        formData.append(`evidence_${index}`, evidence.file);
        formData.append(`evidence_${index}_type`, evidence.type);
        formData.append(`evidence_${index}_description`, evidence.description);
      });

      await api.refunds.request(formData);
      router.push('/payments/refunds');
    } catch (error) {
      console.error('Error:', error);
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      id: 'reason',
      title: 'Reason',
      description: 'Select reason',
      component: <Step1Reason />,
      validate: validateStep1
    },
    {
      id: 'evidence',
      title: 'Evidence',
      description: 'Upload proof',
      component: <Step2Evidence />
    },
    {
      id: 'calculation',
      title: 'Amount',
      description: 'Set refund amount',
      component: <Step3Calculation />,
      validate: validateStep3
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Confirm request',
      component: <Step4Review />
    }
  ];

  return (
    <>
      <WizardContainer
        title="Refund Request"
        subtitle={`Payment #${paymentId}`}
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onComplete={handleComplete}
        isLoading={isSubmitting}
        completeBtnText="Submit Refund Request"
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
