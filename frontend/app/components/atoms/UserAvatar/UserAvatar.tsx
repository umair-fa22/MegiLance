// @AI-HINT: This is the UserAvatar component. It displays an image if a `src` is provided, otherwise it displays the user's initials derived from the `name` prop.
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './UserAvatar.common.module.css';
import lightStyles from './UserAvatar.light.module.css';
import darkStyles from './UserAvatar.dark.module.css';

export interface UserAvatarProps {
  name: string; // Always required for initials fallback and alt text
  src?: string; // Optional image source
  size?: 'small' | 'sm' | 'medium' | 'md' | 'large' | 'lg' | number;
  className?: string;
  /** Optional click handler for interactive avatars */
  onClick?: () => void;
  /** Whether this avatar represents the current user */
  isCurrentUser?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  src,
  size = 'medium',
  className,
  onClick,
  isCurrentUser = false,
}) => {
  const { resolvedTheme } = useTheme();
  const [imageError, setImageError] = useState(false);

  if (!resolvedTheme) {
    return null; // Avoid hydration mismatch
  }
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  let sizeClass = '';
  let imageSize: number;
  let sizeAttr: string | undefined;

  if (typeof size === 'number') {
    imageSize = size;
    sizeAttr = size.toString();
  } else {
    const sizeMap: Record<string, { class: string; size: number }> = {
      small: { class: commonStyles.userAvatarSmall, size: 32 },
      sm: { class: commonStyles.userAvatarSmall, size: 32 }, // alias
      medium: { class: commonStyles.userAvatarMedium, size: 40 },
      md: { class: commonStyles.userAvatarMedium, size: 40 }, // alias
      large: { class: commonStyles.userAvatarLarge, size: 56 },
      lg: { class: commonStyles.userAvatarLarge, size: 56 }, // alias
    };
    const sizeConfig = sizeMap[size] || sizeMap['medium']; // fallback to medium
    sizeClass = sizeConfig.class;
    imageSize = sizeConfig.size;
  }

  const getInitials = (fullName: string): string => {
    if (!fullName || typeof fullName !== 'string') return '?';
    const trimmedName = fullName.trim();
    if (!trimmedName) return '?';
    
    const names = trimmedName.split(/\s+/).filter(Boolean);
    if (names.length > 1 && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return trimmedName.substring(0, 2).toUpperCase();
  };

  const avatarClasses = cn(
    commonStyles.userAvatar,
    themeStyles.userAvatar,
    sizeClass,
    onClick && commonStyles.userAvatarClickable,
    className
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  const interactiveProps = onClick
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onClick,
        onKeyDown: handleKeyDown,
        'aria-label': `${name}'s avatar${isCurrentUser ? ' (you)' : ''}`,
      }
    : {
        'aria-label': `${name}'s avatar${isCurrentUser ? ' (you)' : ''}`,
      };

  // Show initials if no src or if image failed to load
  if (!src || imageError) {
    return (
      <div 
        className={avatarClasses} 
        data-custom-size={sizeAttr}
        {...interactiveProps}
      >
        <span aria-hidden="true">{getInitials(name)}</span>
      </div>
    );
  }

  return (
    <div 
      className={avatarClasses} 
      data-custom-size={sizeAttr}
      {...interactiveProps}
    >
      <Image
        src={src}
        alt={`${name}'s avatar`}
        className={commonStyles.userAvatarImage}
        width={imageSize}
        height={imageSize}
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
        loading="lazy"
        onError={() => setImageError(true)}
      />
    </div>
  );
};

export default UserAvatar;
