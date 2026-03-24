// @AI-HINT: Enhanced second step with collapsible sections, icons, and better readability.
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  DollarSign, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Lock,
  Scale
} from 'lucide-react';

import { ProposalData, ProposalErrors } from '../../SubmitProposal.types';
import { Label } from '@/app/components/Label/Label';
import Checkbox from '@/app/components/Checkbox/Checkbox';

import common from './StepTerms.common.module.css';
import light from './StepTerms.light.module.css';
import dark from './StepTerms.dark.module.css';

interface StepTermsProps {
  data: ProposalData;
  updateData: (update: Partial<ProposalData>) => void;
  errors: ProposalErrors;
}

const termsSections = [
  {
    id: 'project',
    icon: FileText,
    title: 'Project Terms',
    items: [
      { text: 'Proposals are binding once submitted and cannot be modified', icon: Lock },
      { text: 'Work begins only after the client accepts your proposal', icon: CheckCircle },
      { text: 'All work must comply with our quality standards and policies', icon: Shield },
      { text: 'Communication should remain within the platform', icon: AlertCircle },
    ],
  },
  {
    id: 'payment',
    icon: DollarSign,
    title: 'Payment Terms',
    items: [
      { text: 'Payments are processed through our secure escrow system', icon: Lock },
      { text: 'Funds are released upon milestone completion and client approval', icon: CheckCircle },
      { text: 'Platform fee of 10% is deducted from each payment', icon: DollarSign },
      { text: 'Payments are processed within 3-5 business days', icon: AlertCircle },
    ],
  },
  {
    id: 'dispute',
    icon: Scale,
    title: 'Dispute Resolution',
    items: [
      { text: 'Disputes are handled through our mediation process', icon: Shield },
      { text: 'Both parties must provide evidence for dispute claims', icon: FileText },
      { text: 'Final decisions are binding on all parties', icon: Lock },
      { text: 'Refunds are subject to our refund policy', icon: DollarSign },
    ],
  },
];

const StepTerms: React.FC<StepTermsProps> = ({ data, updateData, errors }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const [expandedSections, setExpandedSections] = useState<string[]>(['project', 'payment', 'dispute']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const allSectionsExpanded = expandedSections.length === termsSections.length;

  const toggleAll = () => {
    if (allSectionsExpanded) {
      setExpandedSections([]);
    } else {
      setExpandedSections(termsSections.map(s => s.id));
    }
  };

  return (
    <div className={cn(common.container, themed.container)}>
      <div className={common.header}>
        <h2 className={cn(common.title, themed.title)}>Terms & Conditions</h2>
        <p className={cn(common.description, themed.description)}>
          Please review and accept our terms before submitting your proposal.
        </p>
      </div>

      <div className={common.content}>
        <div className={cn(common.toggleAllRow, themed.toggleAllRow)}>
          <button
            type="button"
            onClick={toggleAll}
            className={cn(common.toggleAllButton, themed.toggleAllButton)}
          >
            {allSectionsExpanded ? (
              <>
                <ChevronUp size={14} />
                Collapse All
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                Expand All
              </>
            )}
          </button>
        </div>

        {termsSections.map((section) => {
          const SectionIcon = section.icon;
          const isExpanded = expandedSections.includes(section.id);

          return (
            <div 
              key={section.id} 
              className={cn(common.termsSection, themed.termsSection)}
            >
              <button
                type="button"
                className={cn(common.sectionHeader, themed.sectionHeader)}
                onClick={() => toggleSection(section.id)}
                aria-expanded={isExpanded}
                aria-controls={`section-${section.id}`}
              >
                <div className={cn(common.sectionTitleWrapper, themed.sectionTitleWrapper)}>
                  <SectionIcon size={20} className={cn(common.sectionIcon, themed.sectionIcon)} />
                  <h3 className={cn(common.sectionTitle, themed.sectionTitle)}>
                    {section.title}
                  </h3>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={20} />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    id={`section-${section.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={common.overflowHidden}
                  >
                    <ul className={cn(common.termsList, themed.termsList)}>
                      {section.items.map((item, index) => {
                        const ItemIcon = item.icon;
                        return (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(common.termsItem, themed.termsItem)}
                          >
                            <ItemIcon size={14} className={cn(common.itemIcon, themed.itemIcon)} />
                            <span>{item.text}</span>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        <motion.div 
          className={cn(
            common.agreement, 
            themed.agreement,
            data.termsAccepted && common.agreementAccepted,
            data.termsAccepted && themed.agreementAccepted
          )}
          animate={{ 
            scale: data.termsAccepted ? [1, 1.02, 1] : 1 
          }}
          transition={{ duration: 0.2 }}
        >
          <Checkbox
            id="termsAccepted"
            name="termsAccepted"
            checked={data.termsAccepted}
            onChange={(e) => updateData({ termsAccepted: e.target.checked })}
            aria-describedby={errors.termsAccepted ? "termsAccepted-error" : undefined}
          >
            <Label htmlFor="termsAccepted" className={cn(common.agreementLabel, themed.agreementLabel)}>
              <Shield size={16} />
              I have read and agree to the terms and conditions outlined above
            </Label>
          </Checkbox>
          
          {errors.termsAccepted && (
            <motion.p 
              id="termsAccepted-error" 
              className={cn(common.error, themed.error)}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={14} />
              {errors.termsAccepted}
            </motion.p>
          )}
        </motion.div>

        {data.termsAccepted && (
          <motion.div 
            className={cn(common.successMessage, themed.successMessage)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CheckCircle size={16} />
            <span>You're all set! Click Next to review your proposal.</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StepTerms;
