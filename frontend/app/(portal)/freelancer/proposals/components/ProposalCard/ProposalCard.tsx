// @AI-HINT: This component renders a single proposal as a modern, responsive card. It includes details like job title, client, bid amount, and status, with clear action buttons.

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Badge from '@/app/components/atoms/Badge/Badge';
import Button from '@/app/components/atoms/Button/Button';
import { Eye, Edit3, Trash2, DollarSign, Calendar, Briefcase, Sparkles, ShieldCheck } from 'lucide-react';

import commonStyles from './ProposalCard.common.module.css';
import lightStyles from './ProposalCard.light.module.css';
import darkStyles from './ProposalCard.dark.module.css';

export interface Proposal {
  id: string;
  jobTitle: string;
  clientName: string;
  status: 'Draft' | 'Submitted' | 'Interview' | 'Rejected';
  dateSubmitted: string; // ISO or YYYY-MM-DD
  bidAmount: number; // USD
  matchScore?: number;
  isClientVerified?: boolean;
}

export interface ProposalCardProps {
  proposal: Proposal;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onWithdraw: (id: string) => void;
}

const statusVariantMap: { [key in Proposal['status']]: 'default' | 'success' | 'danger' | 'secondary' | 'warning' } = {
  Submitted: 'default',
  Interview: 'success',
  Rejected: 'danger',
  Draft: 'secondary',
};

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, onView, onEdit, onWithdraw }) => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const { id, jobTitle, clientName, status, dateSubmitted, bidAmount, matchScore, isClientVerified } = proposal;

  return (
    <div className={cn(commonStyles.card, styles.card)}>
      <div className={cn(commonStyles.cardHeader, styles.cardHeader)}>
        <div className={commonStyles.headerTop}>
          {matchScore && (
            <div className={cn(commonStyles.matchBadge, styles.matchBadge)}>
              <Sparkles size={12} />
              <span>{matchScore}% Match</span>
            </div>
          )}
        </div>
        <h3 className={cn(commonStyles.jobTitle, styles.jobTitle)}>{jobTitle}</h3>
        <div className={cn(commonStyles.clientInfo, styles.clientInfo)}>
            <Briefcase size={14} />
            <span>{clientName}</span>
            {isClientVerified && (
              <ShieldCheck size={14} className={commonStyles.verifiedBadge} aria-label="Verified Client" />
            )}
        </div>
      </div>
      
      <div className={cn(commonStyles.cardBody, styles.cardBody)}>
        <div className={cn(commonStyles.detailItem, styles.detailItem)}>
            <DollarSign size={16} className={cn(commonStyles.icon, styles.icon)} />
            <span className={cn(commonStyles.detailValue, styles.detailValue)}>${bidAmount.toLocaleString()}</span>
            <span className={cn(commonStyles.detailLabel, styles.detailLabel)}>Bid Amount</span>
        </div>
        <div className={cn(commonStyles.detailItem, styles.detailItem)}>
            <Calendar size={16} className={cn(commonStyles.icon, styles.icon)} />
            <span className={cn(commonStyles.detailValue, styles.detailValue)}>{new Date(dateSubmitted).toLocaleDateString()}</span>
            <span className={cn(commonStyles.detailLabel, styles.detailLabel)}>Submitted</span>
        </div>
      </div>

      <div className={cn(commonStyles.cardFooter, styles.cardFooter)}>
        <Badge variant={statusVariantMap[status]} className={commonStyles.statusBadge}>{status}</Badge>
        <div className={cn(commonStyles.actions, styles.actions)}>
          <Button variant="ghost" size="sm" onClick={() => onView(id)} aria-label={`View proposal for ${jobTitle}`}>
            <Eye size={16} />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onEdit(id)} aria-label={`Edit proposal for ${jobTitle}`}>
            <Edit3 size={16} />
          </Button>
          {(status === 'Submitted' || status === 'Draft') && (
            <Button variant="danger" size="sm" onClick={() => onWithdraw(id)} aria-label={`Withdraw proposal for ${jobTitle}`}>
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalCard;
