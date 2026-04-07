import React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Calendar, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import commonStyles from './ProjectCard.common.module.css';
import lightStyles from './ProjectCard.light.module.css';
import darkStyles from './ProjectCard.dark.module.css';

interface ProjectCardProps {
  project: any;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } },
  hover: { 
    y: -5, 
    scale: 1.01,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    transition: { type: 'spring' as const, stiffness: 400, damping: 25 }
  }
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress':
        return 'blue';
      case 'completed':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const statusColor = getStatusColor(project.status);

  return (
    <motion.div 
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      whileHover="hover"
      viewport={{ once: true, amount: 0.1 }}
      className={cn(commonStyles.card, themeStyles.card)}
    >
      <div className={commonStyles.header}>
        <div className={commonStyles.titleWrapper}>
          <h3 className={cn(commonStyles.title, themeStyles.title)}>{project.title}</h3>
          <span className={cn(commonStyles.statusBadge, commonStyles[`status-${statusColor}`], themeStyles[`status-${statusColor}`])}>
            {project.status}
          </span>
        </div>
        <div className={cn(commonStyles.budget, themeStyles.budget)}>
          {project.budget}
        </div>
      </div>
      
      <div className={commonStyles.meta}>
        <div className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
          <Calendar size={14} />
          <span>Due {new Date(project.deadline || Date.now()).toLocaleDateString()}</span>
        </div>
        <div className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
          <Users size={14} />
          <span>{project.proposals_count || 0} Proposals</span>
        </div>
      </div>

      <div className={commonStyles.footer}>
        <div className={commonStyles.progressWrapper}>
          <div className={cn(commonStyles.progressBar, themeStyles.progressBar)}>
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: `${project.progress || 0}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              className={commonStyles.progressFill} 
            />
          </div>
          <span className={cn(commonStyles.progressText, themeStyles.progressText)}>{project.progress || 0}% Complete</span>
        </div>
        <Link href={`/client/projects/${project.id}`} className={cn(commonStyles.link, themeStyles.link)}>
          Details <ArrowRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
