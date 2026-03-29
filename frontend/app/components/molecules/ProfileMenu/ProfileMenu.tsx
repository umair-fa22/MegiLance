// @AI-HINT: This is the ProfileMenu component for user avatar, dropdown, and account actions. It features a professional, themed design with icons and accessible states. All styles are per-component only.

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import UserAvatar from '@/app/components/atoms/UserAvatar/UserAvatar';
import StatusIndicator, { FeatureStatus } from '@/app/components/molecules/StatusIndicator/StatusIndicator';
import commonStyles from './ProfileMenu.common.module.css';
import lightStyles from './ProfileMenu.light.module.css';
import darkStyles from './ProfileMenu.dark.module.css';

// Define the structure for a menu item
export interface ProfileMenuItem {
  href?: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  status?: FeatureStatus;
}

// Define the props for the ProfileMenu component
export interface ProfileMenuProps {
  userName: string;
  userEmail?: string;
  userImageUrl?: string;
  menuItems: ProfileMenuItem[];
  className?: string;
  theme?: 'light' | 'dark';
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({
  userName,
  userEmail,
  userImageUrl,
  menuItems,
  className = '',
  theme: themeProp,
}) => {
  const { resolvedTheme } = useTheme();
  const currentTheme = themeProp || resolvedTheme;
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const themeStyles = currentTheme === 'dark' ? darkStyles : lightStyles;

  const toggleMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (onClick?: () => void) => {
    if (onClick) {
      onClick();
    }
    setIsOpen(false);
  };

  const renderContent = (item: ProfileMenuItem) => (
    <>
      <span className={cn(commonStyles.itemIcon, themeStyles.itemIcon)}>{item.icon}</span>
      {item.status && (
        <StatusIndicator status={item.status} className="ml-auto scale-75" />
      )}
      <span className={cn(commonStyles.itemLabel, themeStyles.itemLabel)}>{item.label}</span>
    </>
  );

  return (
    <div className={cn(commonStyles.profileMenu, className)} ref={menuRef}>
      <button
        type="button"
        className={cn(commonStyles.trigger, themeStyles.trigger)}
        onClick={toggleMenu}
        aria-haspopup="true"
        aria-expanded={isOpen ? 'true' : 'false'}
        aria-label={`Open user menu for ${userName}`}
        title={`Open user menu for ${userName}`}
      >
        <UserAvatar name={userName} src={userImageUrl} size="medium" />
      </button>

      <div className={cn(commonStyles.dropdown, themeStyles.dropdown, isOpen && commonStyles.dropdownOpen)}>
        <div className={cn(commonStyles.header, themeStyles.header)}>
          <div className={cn(commonStyles.userDetails)}>
            <p className={cn(commonStyles.userName, themeStyles.userName)}>{userName}</p>
            {userEmail && <p className={cn(commonStyles.userEmail, themeStyles.userEmail)}>{userEmail}</p>}
          </div>
        </div>
        <ul className={cn(commonStyles.items)} role="menu" aria-orientation="vertical">
          {menuItems.map((item) => (
            <li key={item.label} role="none">
              {item.href ? (
                <Link
                  href={item.href}
                  role="menuitem"
                  className={cn(commonStyles.item, themeStyles.item)}
                  onClick={() => handleItemClick(item.onClick)}
                  title={item.label}
                >
                  {renderContent(item)}
                </Link>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  className={cn(commonStyles.item, themeStyles.item)}
                  onClick={() => handleItemClick(item.onClick)}
                  title={item.label}
                >
                  {renderContent(item)}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProfileMenu;
