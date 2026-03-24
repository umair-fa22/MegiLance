// @AI-HINT: Contract Creation Wizard - 4-step contract setup with templates
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import WizardContainer, { WizardStep } from '@/app/components/Wizard/WizardContainer/WizardContainer';
import Select from '@/app/components/Select/Select';
import Input from '@/app/components/Input/Input';
import Textarea from '@/app/components/Textarea/Textarea';
import Button from '@/app/components/Button/Button';
import { FileText, CheckCircle, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import type { ContractCreateData } from '@/types/api';

import commonStyles from './ContractWizard.common.module.css';
import lightStyles from './ContractWizard.light.module.css';
import darkStyles from './ContractWizard.dark.module.css';

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: string;
  dueDate: string;
  deliverables: string[];
}

interface ContractData {
  template: 'standard' | 'nda' | 'hourly' | 'milestone';
  projectId?: string;
  freelancerId?: string;
  
  // Step 1: Terms
  title: string;
  scope: string;
  deliverables: string[];
  startDate: string;
  endDate: string;
  
  // Step 2: Payment
  paymentType: 'fixed' | 'hourly' | 'retainer';
  totalAmount: string;
  hourlyRate: string;
  estimatedHours: string;
  retainerAmount: string;
  retainerFrequency: 'weekly' | 'monthly';
  milestones: Milestone[];
  
  // Step 3: Legal
  ipRights: 'client' | 'freelancer' | 'shared';
  confidentiality: boolean;
  terminationNotice: string;
  revisionRounds: string;
  
  // Step 4: Signature
  clientSignature: string;
  freelancerSignature: string;
}

interface ContractWizardProps {
  projectId?: string;
  freelancerId?: string;
  proposalData?: any;
}

const ContractWizard: React.FC<ContractWizardProps> = ({ 
  projectId, 
  freelancerId,
  proposalData 
}) => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [contractData, setContractData] = useState<ContractData>({
    template: 'standard',
    projectId,
    freelancerId,
    title: proposalData?.projectTitle || '',
    scope: proposalData?.scope || '',
    deliverables: [],
    startDate: '',
    endDate: '',
    paymentType: proposalData?.budgetType || 'fixed',
    totalAmount: proposalData?.bidAmount?.toString() || '',
    hourlyRate: proposalData?.hourlyRate?.toString() || '',
    estimatedHours: proposalData?.estimatedHours?.toString() || '',
    retainerAmount: '',
    retainerFrequency: 'monthly',
    milestones: [],
    ipRights: 'client',
    confidentiality: true,
    terminationNotice: '14',
    revisionRounds: '2',
    clientSignature: '',
    freelancerSignature: '',
  });

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    stepContent: cn(commonStyles.stepContent, themeStyles.stepContent),
    templateGrid: cn(commonStyles.templateGrid, themeStyles.templateGrid),
    templateCard: cn(commonStyles.templateCard, themeStyles.templateCard),
    templateCardSelected: cn(commonStyles.templateCardSelected, themeStyles.templateCardSelected),
    formGroup: cn(commonStyles.formGroup, themeStyles.formGroup),
    label: cn(commonStyles.label, themeStyles.label),
    deliverablesList: cn(commonStyles.deliverablesList, themeStyles.deliverablesList),
    deliverableItem: cn(commonStyles.deliverableItem, themeStyles.deliverableItem),
    milestoneCard: cn(commonStyles.milestoneCard, themeStyles.milestoneCard),
    signatureBox: cn(commonStyles.signatureBox, themeStyles.signatureBox),
    reviewSection: cn(commonStyles.reviewSection, themeStyles.reviewSection),
    sectionTitle: cn(commonStyles.sectionTitle, themeStyles.sectionTitle),
    textSmallMuted: cn(commonStyles.textSmall, commonStyles.textMuted),
    gridCols2: commonStyles.gridCols2,
    gridCols2Small: commonStyles.gridCols2Small,
    flexBetween: commonStyles.flexBetween,
    milestoneHeader: commonStyles.milestoneHeader,
    milestoneTitle: commonStyles.milestoneTitle,
    mb3: commonStyles.mb3,
    mb4: commonStyles.mb4,
    mt1: commonStyles.mt1,
    mt2: commonStyles.mt2,
    mr2: commonStyles.mr2,
    checkboxContainer: commonStyles.checkboxContainer,
    checkbox: commonStyles.checkbox,
    listDisc: commonStyles.listDisc,
    inlineIcon: commonStyles.inlineIcon,
  };

  const addDeliverable = () => {
    setContractData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, ''],
    }));
  };

  const updateDeliverable = (index: number, value: string) => {
    const updated = [...contractData.deliverables];
    updated[index] = value;
    setContractData(prev => ({ ...prev, deliverables: updated }));
  };

  const removeDeliverable = (index: number) => {
    setContractData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index),
    }));
  };

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title: '',
      description: '',
      amount: '',
      dueDate: '',
      deliverables: [],
    };
    setContractData(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone],
    }));
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: any) => {
    setContractData(prev => ({
      ...prev,
      milestones: prev.milestones.map(m =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    }));
  };

  const removeMilestone = (id: string) => {
    setContractData(prev => ({
      ...prev,
      milestones: prev.milestones.filter(m => m.id !== id),
    }));
  };

  const validateStep1 = () => {
    if (!contractData.title.trim()) {
      showToast('Please enter a contract title', 'error');
      return false;
    }
    if (!contractData.scope.trim() || contractData.scope.length < 50) {
      showToast('Please provide a detailed scope (minimum 50 characters)', 'error');
      return false;
    }
    if (contractData.deliverables.filter(d => d.trim()).length === 0) {
      showToast('Please add at least one deliverable', 'error');
      return false;
    }
    if (!contractData.startDate || !contractData.endDate) {
      showToast('Please specify start and end dates', 'error');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (contractData.paymentType === 'fixed') {
      if (!contractData.totalAmount || parseFloat(contractData.totalAmount) <= 0) {
        showToast('Please enter a valid total amount', 'error');
        return false;
      }
      if (contractData.milestones.length === 0) {
        showToast('Please add at least one milestone for payment tracking', 'error');
        return false;
      }
    } else if (contractData.paymentType === 'hourly') {
      if (!contractData.hourlyRate || parseFloat(contractData.hourlyRate) <= 0) {
        showToast('Please enter a valid hourly rate', 'error');
        return false;
      }
      if (!contractData.estimatedHours || parseFloat(contractData.estimatedHours) <= 0) {
        showToast('Please enter estimated hours', 'error');
        return false;
      }
    } else if (contractData.paymentType === 'retainer') {
      if (!contractData.retainerAmount || parseFloat(contractData.retainerAmount) <= 0) {
        showToast('Please enter a valid retainer amount', 'error');
        return false;
      }
    }
    return true;
  };

  const validateStep3 = () => {
    if (!contractData.terminationNotice || parseInt(contractData.terminationNotice) < 0) {
      showToast('Please specify termination notice period (days)', 'error');
      return false;
    }
    return true;
  };

  const handleComplete = async () => {
    if (!contractData.clientSignature.trim()) {
      showToast('Please provide your digital signature', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        project_id: contractData.projectId ? parseInt(contractData.projectId) : undefined,
        freelancer_id: contractData.freelancerId ? parseInt(contractData.freelancerId) : undefined,
        contract_type: contractData.paymentType,
        amount: contractData.paymentType === 'fixed' 
            ? parseFloat(contractData.totalAmount) 
            : contractData.paymentType === 'hourly'
                ? parseFloat(contractData.estimatedHours) * parseFloat(contractData.hourlyRate)
                : parseFloat(contractData.retainerAmount),
        hourly_rate: contractData.hourlyRate ? parseFloat(contractData.hourlyRate) : null,
        retainer_amount: contractData.retainerAmount ? parseFloat(contractData.retainerAmount) : null,
        retainer_frequency: contractData.retainerFrequency,
        description: contractData.scope,
        start_date: contractData.startDate ? new Date(contractData.startDate).toISOString() : null,
        end_date: contractData.endDate ? new Date(contractData.endDate).toISOString() : null,
        terms: JSON.stringify({
            title: contractData.title,
            deliverables: contractData.deliverables.filter(d => d.trim()),
            ip_rights: contractData.ipRights,
            confidentiality: contractData.confidentiality,
            termination_notice: contractData.terminationNotice,
            revision_rounds: contractData.revisionRounds,
            client_signature: contractData.clientSignature,
            freelancer_signature: contractData.freelancerSignature
        }),
        milestones: JSON.stringify(contractData.milestones)
      };

      const contract: any = await api.contracts.create(payload as ContractCreateData);

      if (contract && contract.id) {
        router.push(`/contracts/${contract.id}`);
      } else {
        showToast('Failed to create contract. Please try again.', 'error');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Contract creation failed:', error);
      }
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };


  // Step 1: Contract Terms
  const Step1Terms = (
    <div className={styles.stepContent}>
      <div className={styles.templateGrid}>
        {[
          { value: 'standard', label: 'Standard Contract', desc: 'General freelance work' },
          { value: 'nda', label: 'NDA Contract', desc: 'Includes confidentiality' },
          { value: 'hourly', label: 'Hourly Contract', desc: 'Time-based billing' },
          { value: 'milestone', label: 'Milestone Contract', desc: 'Payment by deliverables' },
        ].map(template => (
          <div
            key={template.value}
            className={cn(
              styles.templateCard,
              contractData.template === template.value && styles.templateCardSelected
            )}
            onClick={() => setContractData(prev => ({ ...prev, template: template.value as any }))}
          >
            <FileText size={32} />
            <h3>{template.label}</h3>
            <p>{template.desc}</p>
          </div>
        ))}
      </div>

      <div className={styles.formGroup}>
        <Input
          id="title"
          label="Contract Title"
          value={contractData.title}
          onChange={(e) => setContractData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="E.g., Website Development Contract"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <Textarea
          id="scope"
          label="Scope of Work"
          value={contractData.scope}
          onChange={(e) => setContractData(prev => ({ ...prev, scope: e.target.value }))}
          placeholder="Detailed description of work to be performed..."
          rows={6}
          required
        />
        <span className={styles.textSmallMuted}>{contractData.scope.length}/500 characters</span>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Deliverables</label>
        <div className={styles.deliverablesList}>
          {contractData.deliverables.map((deliverable, index) => (
            <div key={index} className={styles.deliverableItem}>
              <Input
                value={deliverable}
                onChange={(e) => updateDeliverable(index, e.target.value)}
                placeholder={`Deliverable ${index + 1}`}
              />
              <Button
                variant="danger"
                size="sm"
                onClick={() => removeDeliverable(index)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={addDeliverable}>
          <Plus size={14} className={styles.mr2} />
          Add Deliverable
        </Button>
      </div>

      <div className={styles.gridCols2}>
        <Input
          id="startDate"
          type="date"
          label="Start Date"
          value={contractData.startDate}
          onChange={(e) => setContractData(prev => ({ ...prev, startDate: e.target.value }))}
          required
        />
        <Input
          id="endDate"
          type="date"
          label="End Date"
          value={contractData.endDate}
          onChange={(e) => setContractData(prev => ({ ...prev, endDate: e.target.value }))}
          required
        />
      </div>
    </div>
  );

  // Step 2: Payment Structure
  const Step2Payment = (
    <div className={styles.stepContent}>
      <div className={styles.formGroup}>
        <Select
          id="paymentType"
          label="Payment Type"
          value={contractData.paymentType}
          onChange={(e) => setContractData(prev => ({ ...prev, paymentType: e.target.value as any }))}
          options={[
            { value: 'fixed', label: 'Fixed Price' },
            { value: 'hourly', label: 'Hourly Rate' },
            { value: 'retainer', label: 'Retainer' },
          ]}
        />
      </div>

      {contractData.paymentType === 'fixed' ? (
        <>
          <div className={styles.formGroup}>
            <Input
              id="totalAmount"
              type="number"
              label="Total Contract Amount (USD)"
              value={contractData.totalAmount}
              onChange={(e) => setContractData(prev => ({ ...prev, totalAmount: e.target.value }))}
              placeholder="5000"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Payment Milestones</label>
            {contractData.milestones.map((milestone) => (
              <div key={milestone.id} className={styles.milestoneCard}>
                <div className={styles.milestoneHeader}>
                  <h4 className={styles.milestoneTitle}>Milestone</h4>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeMilestone(milestone.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
                <Input
                  label="Title"
                  value={milestone.title}
                  onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                  placeholder="Phase 1: Design"
                />
                <Textarea
                  label="Description"
                  value={milestone.description}
                  onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                  placeholder="Deliverables for this milestone..."
                  rows={3}
                />
                <div className={styles.gridCols2Small}>
                  <Input
                    type="number"
                    label="Amount (USD)"
                    value={milestone.amount}
                    onChange={(e) => updateMilestone(milestone.id, 'amount', e.target.value)}
                    placeholder="1000"
                  />
                  <Input
                    type="date"
                    label="Due Date"
                    value={milestone.dueDate}
                    onChange={(e) => updateMilestone(milestone.id, 'dueDate', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addMilestone}>
              <Plus size={14} className={styles.mr2} />
              Add Milestone
            </Button>
          </div>
        </>
      ) : contractData.paymentType === 'hourly' ? (
        <div className={styles.gridCols2}>
          <Input
            id="hourlyRate"
            type="number"
            label="Hourly Rate (USD)"
            value={contractData.hourlyRate}
            onChange={(e) => setContractData(prev => ({ ...prev, hourlyRate: e.target.value }))}
            placeholder="50"
            required
          />
          <Input
            id="estimatedHours"
            type="number"
            label="Estimated Hours"
            value={contractData.estimatedHours}
            onChange={(e) => setContractData(prev => ({ ...prev, estimatedHours: e.target.value }))}
            placeholder="100"
            required
          />
        </div>
      ) : (
        <div className={styles.gridCols2}>
          <Input
            id="retainerAmount"
            type="number"
            label="Retainer Amount (USD)"
            value={contractData.retainerAmount}
            onChange={(e) => setContractData(prev => ({ ...prev, retainerAmount: e.target.value }))}
            placeholder="2000"
            required
          />
          <Select
            id="retainerFrequency"
            label="Frequency"
            value={contractData.retainerFrequency}
            onChange={(e) => setContractData(prev => ({ ...prev, retainerFrequency: e.target.value as any }))}
            options={[
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ]}
          />
        </div>
      )}
    </div>
  );

  // Step 3: Legal Terms
  const Step3Legal = (
    <div className={styles.stepContent}>
      <div className={styles.formGroup}>
        <Select
          id="ipRights"
          label="Intellectual Property Rights"
          value={contractData.ipRights}
          onChange={(e) => setContractData(prev => ({ ...prev, ipRights: e.target.value as any }))}
          options={[
            { value: 'client', label: 'Client owns all IP rights' },
            { value: 'freelancer', label: 'Freelancer retains IP rights' },
            { value: 'shared', label: 'Shared IP rights' },
          ]}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.checkboxContainer}>
          <input
            type="checkbox"
            checked={contractData.confidentiality}
            onChange={(e) => setContractData(prev => ({ ...prev, confidentiality: e.target.checked }))}
            className={styles.checkbox}
          />
          <span>Include Confidentiality Agreement (NDA)</span>
        </label>
        <p className={cn(styles.textSmallMuted, styles.mt2)}>
          Both parties agree to keep project information confidential
        </p>
      </div>

      <div className={styles.formGroup}>
        <Input
          id="terminationNotice"
          type="number"
          label="Termination Notice Period (days)"
          value={contractData.terminationNotice}
          onChange={(e) => setContractData(prev => ({ ...prev, terminationNotice: e.target.value }))}
          placeholder="14"
          required
        />
        <p className={cn(styles.textSmallMuted, styles.mt1)}>
          Either party can terminate with this notice period
        </p>
      </div>

      <div className={styles.formGroup}>
        <Input
          id="revisionRounds"
          type="number"
          label="Number of Revision Rounds Included"
          value={contractData.revisionRounds}
          onChange={(e) => setContractData(prev => ({ ...prev, revisionRounds: e.target.value }))}
          placeholder="2"
          required
        />
      </div>
    </div>
  );

  // Step 4: Review & Sign
  const Step4Review = (
    <div className={styles.stepContent}>
      <div className={styles.reviewSection}>
        <h3 className={styles.sectionTitle}>Contract Summary</h3>
        
        <div className={styles.mb4}>
          <strong>Title:</strong> {contractData.title}
        </div>
        <div className={styles.mb4}>
          <strong>Duration:</strong> {contractData.startDate} to {contractData.endDate}
        </div>
        <div className={styles.mb4}>
          <strong>Payment:</strong>{' '}
          {contractData.paymentType === 'fixed' 
            ? `$${contractData.totalAmount} (Fixed)` 
            : contractData.paymentType === 'hourly'
            ? `$${contractData.hourlyRate}/hr (Estimated ${contractData.estimatedHours} hours)`
            : `$${contractData.retainerAmount} / ${contractData.retainerFrequency} (Retainer)`}
        </div>
        <div className={styles.mb4}>
          <strong>Deliverables:</strong>
          <ul className={styles.listDisc}>
            {contractData.deliverables.filter(d => d.trim()).map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
        <div className={styles.mb4}>
          <strong>IP Rights:</strong> {contractData.ipRights === 'client' ? 'Client owns all IP' : contractData.ipRights === 'freelancer' ? 'Freelancer retains IP' : 'Shared ownership'}
        </div>
        <div className={styles.mb4}>
          <strong>NDA:</strong> {contractData.confidentiality ? 'Yes' : 'No'}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Your Digital Signature</label>
        <div className={styles.signatureBox}>
          <Input
            id="clientSignature"
            value={contractData.clientSignature}
            onChange={(e) => setContractData(prev => ({ ...prev, clientSignature: e.target.value }))}
            placeholder="Type your full name to sign"
            required
          />
          <p className={cn(styles.textSmallMuted, styles.mt2)}>
            <CheckCircle size={16} className={styles.inlineIcon} />
            By signing, you agree to all terms and conditions
          </p>
        </div>
      </div>
    </div>
  );

  const steps: WizardStep[] = [
    {
      id: 'terms',
      title: 'Contract Terms',
      description: 'Scope and deliverables',
      component: Step1Terms,
      validate: validateStep1,
    },
    {
      id: 'payment',
      title: 'Payment Structure',
      description: 'Pricing and milestones',
      component: Step2Payment,
      validate: validateStep2,
    },
    {
      id: 'legal',
      title: 'Legal Terms',
      description: 'IP, NDA, termination',
      component: Step3Legal,
      validate: validateStep3,
    },
    {
      id: 'review',
      title: 'Review & Sign',
      description: 'Final confirmation',
      component: Step4Review,
    },
  ];

  return (<>
    <WizardContainer
      title="Create Contract"
      subtitle="Set up a legally binding agreement"
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onComplete={handleComplete}
      onCancel={() => router.back()}
      isLoading={submitting}
      canGoBack={true}
      saveProgress={() => {
        localStorage.setItem('contract_draft', JSON.stringify(contractData));
        showToast('Progress saved!', 'success');
      }}
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
  </>);
};

export default ContractWizard;
