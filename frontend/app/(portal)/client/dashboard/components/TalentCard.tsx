import React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { MoreHorizontal, Star, MapPin, Circle } from 'lucide-react';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import commonStyles from './TalentCard.common.module.css';
import lightStyles from './TalentCard.light.module.css';
import darkStyles from './TalentCard.dark.module.css';

interface TalentCardProps {
  name: string;
  role: string;
  avatar: string;
  rating?: number;
  location?: string;
  hourlyRate?: string;
  headline?: string;
  availabilityStatus?: string;
  experienceLevel?: string;
}

const TalentCard: React.FC<TalentCardProps> = ({ name, role, avatar, rating = 5.0, location, hourlyRate, headline, availabilityStatus, experienceLevel }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  
  return (
    <div className={cn(commonStyles.card, themeStyles.card)}>
      <div className={commonStyles.header}>
        <UserAvatar name={name} src={avatar} size="medium" />
        <button className={cn(commonStyles.actionButton, themeStyles.actionButton)} aria-label="More options">
          <MoreHorizontal size={20} />
        </button>
      </div>
      
      <div className={commonStyles.info}>
        <h4 className={cn(commonStyles.name, themeStyles.name)}>{name}</h4>
        <p className={cn(commonStyles.role, themeStyles.role)}>{headline || role}</p>
        {availabilityStatus === 'available' && (
          <span className={commonStyles.availabilityBadge}>
            <Circle size={6} fill="currentColor" color="currentColor" aria-hidden="true" />
            Available
          </span>
        )}
      </div>

      <div className={commonStyles.meta}>
        <div className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
          <Star size={14} className={commonStyles.starIcon} />
          <span>{rating.toFixed(1)}</span>
        </div>
        {location && (
          <div className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
            <MapPin size={14} />
            <span>{location}</span>
          </div>
        )}
      </div>

      {hourlyRate && (
        <div className={cn(commonStyles.rate, themeStyles.rate)}>
          {hourlyRate}/hr
        </div>
      )}
    </div>
  );
};

export default TalentCard;
