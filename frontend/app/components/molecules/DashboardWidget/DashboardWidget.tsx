// @AI-HINT: This is the refactored DashboardWidget, a premium, theme-aware component for displaying key metrics. It uses CSS modules, framer-motion for animations, and a more polished design.
import React, { useId } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

import common from './DashboardWidget.common.module.css';
import light from './DashboardWidget.light.module.css';
import dark from './DashboardWidget.dark.module.css';

export interface DashboardWidgetProps {
  title: string;
  value?: string | number;
  icon?: React.ElementType;
  trend?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  loading?: boolean;
  iconColor?: string;
  style?: React.CSSProperties;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({ 
  title, 
  value,
  icon: Icon,
  trend,
  onClick,
  children,
  className,
  loading,
  iconColor,
  style,
}) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const titleId = useId();

  const isClickable = !!onClick;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  const motionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Simple skeleton when loading
  if (loading) {
    return (
      <div className={cn(common.widget, themed.widget, common.loading, className)} aria-busy="true">
        <div className={common.header}>
          <div className={cn(common.iconWrapper, themed.iconWrapper)} />
          <div className={common.titleSkeleton} />
        </div>
        <div className={common.body}>
          <div className={common.valueSkeleton} />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={motionVariants}
      className={cn(common.widget, themed.widget, isClickable && common.clickable, className)}
      aria-labelledby={titleId}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      title={isClickable ? `View details for ${title}` : undefined}
      style={style}
    >
      <div className={common.header}>
        <div 
          className={cn(common.iconWrapper, themed.iconWrapper)} 
          data-icon-color={iconColor}
        >
          {Icon && <Icon size={20} />}
        </div>
        <h3 id={titleId} className={cn(common.title, themed.title)}>{title}</h3>
      </div>

      <div className={common.body}>
        {children ? (
          <div className={common.content}>{children}</div>
        ) : (
          <p className={cn(common.value, themed.value)}>{value}</p>
        )}
      </div>
      
      {trend && <div className={common.footer}>{trend}</div>}
    </motion.div>
  );
};

export default DashboardWidget;
