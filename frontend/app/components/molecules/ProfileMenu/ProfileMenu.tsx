'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import UserAvatar from '@/app/components/atoms/UserAvatar/UserAvatar';
import StatusIndicator, { FeatureStatus } from '@/app/components/molecules/StatusIndicator/StatusIndicator';
import { useFloating, offset, flip, shift, autoUpdate, FloatingPortal } from '@floating-ui/react';
import commonStyles from './ProfileMenu.common.module.css';
import lightStyles from './ProfileMenu.light.module.css';
import darkStyles from './ProfileMenu.dark.module.css';

export interface ProfileMenuItem {
  href?: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  status?: FeatureStatus;
}

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
  
  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-end',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const themeStyles = currentTheme === 'dark' ? darkStyles : lightStyles;

  const toggleMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        refs.reference.current && !(refs.reference.current as HTMLElement).contains(event.target as Node) &&
        refs.floating.current && !(refs.floating.current as HTMLElement).contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, refs]);

  const handleItemClick = (onClick?: () => void) => {
    if (onClick) onClick();
    setIsOpen(false);
  };

  const renderContent = (item: ProfileMenuItem) => (
    <>
      <span className={cn(commonStyles.itemIcon, themeStyles.itemIcon)}>{item.icon}</span>
      {item.status && <StatusIndicator status={item.status} className="ml-auto scale-75" />}
      <span className={cn(commonStyles.itemLabel, themeStyles.itemLabel)}>{item.label}</span>
    </>
  );

  return (
    <div className={cn(commonStyles.profileMenu, className)}>
      <button
        ref={refs.setReference}
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

      <FloatingPortal>
        {isOpen && (
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, zIndex: 1000 }}
            className={cn(commonStyles.dropdown, themeStyles.dropdown, commonStyles.dropdownOpen)}
          >
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
        )}
      </FloatingPortal>
    </div>
  );
};

export default ProfileMenu;
