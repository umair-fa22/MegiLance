// @AI-HINT: Activity Timeline — vertical timeline showing recent activities with connector lines and animated entries
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, AlertTriangle, XCircle, Info, Clock,
  UserPlus, FileText, CreditCard, MessageSquare, Star,
  Briefcase, Shield, Package,
} from 'lucide-react';

import commonStyles from './ActivityTimeline.common.module.css';
import lightStyles from './ActivityTimeline.light.module.css';
import darkStyles from './ActivityTimeline.dark.module.css';

export interface TimelineEvent {
  id: string;
  actor: string;
  action: string;
  target?: string;
  targetHref?: string;
  timestamp: string;
  type: 'success' | 'warning' | 'danger' | 'info' | 'purple';
  category?: string;
  badge?: string;
}

const DOT_ICONS: Record<string, React.ElementType> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
  purple: Star,
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  maxItems?: number;
  emptyMessage?: string;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  events,
  maxItems = 6,
  emptyMessage = 'No recent activity',
}) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const displayEvents = events.slice(0, maxItems);

  if (displayEvents.length === 0) {
    return (
      <div className={cn(commonStyles.emptyTimeline, themeStyles.emptyTimeline)}>
        <Clock size={28} />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={commonStyles.timeline} role="feed" aria-label="Activity timeline">
      {displayEvents.map((event) => {
        const DotIcon = DOT_ICONS[event.type] || Info;
        const dotColorClass = commonStyles[`dot${event.type.charAt(0).toUpperCase() + event.type.slice(1)}`];

        return (
          <div key={event.id} className={cn(commonStyles.timelineItem, themeStyles.timelineItem)} role="article">
            <div className={cn(commonStyles.timelineDot, dotColorClass)}>
              <DotIcon />
            </div>
            <div className={commonStyles.timelineContent}>
              <div className={commonStyles.timelineHeader}>
                <span className={cn(commonStyles.timelineActor, themeStyles.timelineActor)}>
                  {event.actor}
                </span>
                <span className={cn(commonStyles.timelineAction, themeStyles.timelineAction)}>
                  {event.action}
                </span>
                {event.target && (
                  event.targetHref ? (
                    <a href={event.targetHref} className={cn(commonStyles.timelineTarget, themeStyles.timelineTarget)}>
                      {event.target}
                    </a>
                  ) : (
                    <span className={cn(commonStyles.timelineTarget, themeStyles.timelineTarget)}>
                      {event.target}
                    </span>
                  )
                )}
              </div>
              <div className={commonStyles.timelineMeta}>
                <span className={cn(commonStyles.timelineTime, themeStyles.timelineTime)}>
                  {formatRelativeTime(event.timestamp)}
                </span>
                {event.badge && (
                  <span className={cn(commonStyles.timelineBadge, themeStyles.timelineBadge)}>
                    {event.badge}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityTimeline;
