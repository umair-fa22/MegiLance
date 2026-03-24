// @AI-HINT: This component displays a single, theme-aware portfolio item card. It leverages CSS variables defined in per-theme modules and scoped to the component's container, ensuring a consistent and maintainable presentation.
'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

import Button from '@/app/components/Button/Button';
import { cn } from '@/lib/utils';
import commonStyles from './PortfolioItemCard.common.module.css';
import lightStyles from './PortfolioItemCard.light.module.css';
import darkStyles from './PortfolioItemCard.dark.module.css';

export interface PortfolioItemCardProps {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  projectUrl?: string;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}

const PortfolioItemCard: React.FC<PortfolioItemCardProps> = ({ id, title, description, imageUrl, projectUrl, onDelete, onEdit }) => {
  const { resolvedTheme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  return (
    <div
      className={cn(styles.container)}
      role="region"
      aria-labelledby={`portfolio-item-title-${id}`}
    >
      <div className={styles.imageWrapper}>
        <Image src={imageUrl} alt={title} layout="fill" objectFit="cover" className={styles.image} />
      </div>
      <div className={styles.content}>
        <h3 id={`portfolio-item-title-${id}`} className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>
      <div className={styles.footer}>
        {projectUrl ? (
          <a href={projectUrl} target="_blank" rel="noopener noreferrer" aria-label={`View project ${title} (opens in a new tab)`} title={`View project ${title} (opens in a new tab)`}>
            <Button variant="secondary">View Project</Button>
          </a>
        ) : <div />} 
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={() => onEdit(id)} aria-label={`Edit ${title}`} title={`Edit ${title}`}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => onDelete(id)} aria-label={`Delete ${title}`} title={`Delete ${title}`}>Delete</Button>
        </div>
      </div>
    </div>
  );
};

export default PortfolioItemCard;
