// @AI-HINT: This is a data-rich, interactive project card for client-side project lists, featuring avatars, progress, and an action menu.
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Briefcase, MessageSquare, CreditCard } from 'lucide-react';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import ProgressBar from '@/app/components/ProgressBar/ProgressBar';
import ActionMenu from '@/app/components/ActionMenu/ActionMenu';
import Badge, { BadgeProps } from '@/app/components/Badge/Badge';
import common from './ProjectCard.common.module.css';
import light from './ProjectCard.light.module.css';
import dark from './ProjectCard.dark.module.css';

export interface Freelancer {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface ProjectCardProps {
  id: string;
  title: string;
  status: 'In Progress' | 'Completed' | 'Pending' | 'Cancelled';
  progress: number;
  budget: number;
  paid: number;
  freelancers: Freelancer[];
  updatedAt: string;
  // Optional props passed in some dashboards/lists
  clientName?: string;
  postedTime?: string;
  tags?: string[];
}

const statusVariantMap: Record<ProjectCardProps['status'], NonNullable<BadgeProps['variant']>> = {
  'In Progress': 'info',
  'Completed': 'success',
  'Pending': 'warning',
  'Cancelled': 'danger',
};

const ProjectCard: React.FC<ProjectCardProps> = (props) => {
  const { id, title, status, progress, budget, paid, freelancers, updatedAt } = props;
  const { resolvedTheme } = useTheme();

  const themed = resolvedTheme === 'dark' ? dark : light;

  const menuItems = [
    { label: 'View Details', icon: Briefcase, href: `/client/projects/${id}` },
    { label: 'Make Payment', icon: CreditCard, href: `/client/projects/${id}/payments` },
    { label: 'Contact Team', icon: MessageSquare, href: `/client/messages?project=${id}` },
  ];

  return (
    <article className={cn(common.card, themed.theme)} aria-label={`Project: ${title}`}>
      <div className={common.cardHeader}>
        <h3 className={cn(common.title, themed.title)}>
          <Link href={`/client/projects/${id}`} className={cn(common.titleLink, themed.titleLink)}>{title}</Link>
        </h3>
        <ActionMenu items={menuItems} trigger={<MoreHorizontal size={20} aria-hidden="true" />} />
      </div>

      <div className={common.cardContent}>
        <div className={common.statusRow}>
          <Badge variant={statusVariantMap[status] as BadgeProps['variant']} size="small">{status}</Badge>
          <div className={cn(common.financials, themed.financials)}>
            <span className={cn(common.paid, themed.paid)}>${paid.toLocaleString()}</span>
            <span className={cn(common.budget, themed.budget)}>/ ${budget.toLocaleString()}</span>
          </div>
        </div>
        <ProgressBar progress={progress} aria-label={`Project progress: ${progress}%`} />
      </div>

      <div className={common.cardFooter}>
        <div className={common.avatarStack}>
          {freelancers.slice(0, 3).map(f => (
            <UserAvatar key={f.id} src={f.avatarUrl} name={f.name} size={24} />
          ))}
          {freelancers.length > 3 && (
            <div className={cn(common.moreAvatars, themed.moreAvatars)} aria-label={`${freelancers.length - 3} more team members`}>
              +{freelancers.length - 3}
            </div>
          )}
        </div>
        <span className={cn(common.updatedAt, themed.updatedAt)}>Updated {updatedAt}</span>
      </div>
    </article>
  );
};

export default ProjectCard;
