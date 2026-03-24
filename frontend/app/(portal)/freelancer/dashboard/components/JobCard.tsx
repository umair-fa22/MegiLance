import React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Clock } from 'lucide-react'
import Link from 'next/link';
import Button from '@/app/components/Button/Button';
import commonStyles from './JobCard.common.module.css';
import lightStyles from './JobCard.light.module.css';
import darkStyles from './JobCard.dark.module.css';

interface JobCardProps {
  job: any;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.card, themeStyles.card)}>
      <div className={commonStyles.header}>
        <div className={commonStyles.titleWrapper}>
          <h3 className={cn(commonStyles.title, themeStyles.title)}>{job.title}</h3>
          <span className={cn(commonStyles.client, themeStyles.client)}>{job.clientName}</span>
        </div>
        <div className={cn(commonStyles.budget, themeStyles.budget)}>
          ${job.budget?.toLocaleString()}
        </div>
      </div>
      
      <div className={commonStyles.tags}>
        {job.skills?.slice(0, 3).map((skill: string) => (
          <span key={skill} className={cn(commonStyles.tag, themeStyles.tag)}>{skill}</span>
        ))}
        {job.skills?.length > 3 && (
          <span className={cn(commonStyles.tag, themeStyles.tag)}>+{job.skills.length - 3} more</span>
        )}
      </div>

      <div className={commonStyles.footer}>
        <div className={cn(commonStyles.meta, themeStyles.meta)}>
          <Clock size={14} />
          <span>Posted {new Date(job.postedTime).toLocaleDateString()}</span>
        </div>
        <Link href={`/jobs/${job.id}`}>
          <Button variant="outline" size="sm">View Job</Button>
        </Link>
      </div>
    </div>
  );
};

export default JobCard;
