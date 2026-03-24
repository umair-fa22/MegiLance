// @AI-HINT: This component displays a freelancer success story for the GlobalImpact section.

'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { MapPin, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

import commonStyles from './SuccessStoryCard.common.module.css';
import lightStyles from './SuccessStoryCard.light.module.css';
import darkStyles from './SuccessStoryCard.dark.module.css';

// --- Type Definitions ---
interface SuccessStory {
  name: string;
  role: string;
  city: string;
  achievement: string;
  quote: string;
  avatar: string; // URL to avatar image
}

interface SuccessStoryCardProps {
  story: SuccessStory;
}

// --- Main Component ---
const SuccessStoryCard: React.FC<SuccessStoryCardProps> = ({ story }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.story, themeStyles.story)}>
      <div className={commonStyles.cardContent}>
        <blockquote className={cn(commonStyles.quote, themeStyles.quote)}>
          <span className={cn(commonStyles.quoteMark, themeStyles.quoteMark)}>“</span>
          {story.quote}
        </blockquote>
        <div className={commonStyles.authorInfo}>
          <Image
            src={story.avatar}
            alt={`${story.name}'s avatar`}
            width={56}
            height={56}
            className={cn(commonStyles.avatar, themeStyles.avatar)}
          />
          <div className={commonStyles.authorDetails}>
            <p className={cn(commonStyles.name, themeStyles.name)}>{story.name}</p>
            <p className={cn(commonStyles.role, themeStyles.role)}>{story.role}</p>
            <div className={cn(commonStyles.location, themeStyles.location)}>
              <MapPin size={12} />
              <span>{story.city}, Pakistan</span>
            </div>
          </div>
        </div>
        <div className={cn(commonStyles.achievement, themeStyles.achievement)}>
          <Star size={16} className={cn(commonStyles.achievementIcon, themeStyles.achievementIcon)} />
          <span>{story.achievement}</span>
        </div>
      </div>
    </div>
  );
};

export default SuccessStoryCard;
