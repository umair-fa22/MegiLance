// @AI-HINT: Command Palette — Spotlight-like command search for quick navigation, actions, and search across the portal.
'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  Search, LayoutDashboard, Briefcase, FileText, CreditCard,
  MessageSquare, Bell, User, Settings, BarChart3, Users,
  Package, TrendingUp, Star, HelpCircle, Shield, Calendar,
  Wallet, Eye, Globe, Heart, Clock, Award, Video, Lock,
  Plus, ArrowRight,
} from 'lucide-react';

import commonStyles from './CommandPalette.common.module.css';
import lightStyles from './CommandPalette.light.module.css';
import darkStyles from './CommandPalette.dark.module.css';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: React.ElementType;
  group: string;
  keywords?: string[];
  shortcut?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Briefcase, FileText, CreditCard, MessageSquare,
  Bell, User, Settings, BarChart3, Users, Package, TrendingUp,
  Star, HelpCircle, Shield, Calendar, Wallet, Eye, Globe, Heart,
  Clock, Award, Video, Lock, Plus, Search, ArrowRight,
};

function getCommandsForRole(role: string): CommandItem[] {
  const common: CommandItem[] = [
    { id: 'messages', label: 'Messages', description: 'View conversations', href: `/${role}/messages`, icon: MessageSquare, group: 'Navigate', keywords: ['chat', 'inbox'] },
    { id: 'notifications', label: 'Notifications', description: 'View alerts', href: `/${role}/notifications`, icon: Bell, group: 'Navigate', keywords: ['alerts'] },
    { id: 'profile', label: 'Profile', description: 'Edit your profile', href: `/${role}/profile`, icon: User, group: 'Navigate' },
    { id: 'settings', label: 'Settings', description: 'Account settings', href: `/${role}/settings`, icon: Settings, group: 'Navigate' },
    { id: 'security', label: 'Security', description: 'Password & 2FA', href: `/${role}/security`, icon: Lock, group: 'Navigate' },
    { id: 'help', label: 'Help Center', description: 'Get support', href: `/${role}/help`, icon: HelpCircle, group: 'Navigate' },
  ];

  if (role === 'client') {
    return [
      { id: 'dashboard', label: 'Dashboard', description: 'Client overview', href: '/client/dashboard', icon: LayoutDashboard, group: 'Navigate', shortcut: '⌘1' },
      { id: 'post-job', label: 'Post a Job', description: 'Create a new job posting', href: '/client/post-job', icon: Plus, group: 'Actions', keywords: ['create', 'new', 'hire'] },
      { id: 'hire', label: 'Hire Talent', description: 'Find and hire freelancers', href: '/client/hire', icon: Users, group: 'Actions', keywords: ['search', 'find', 'talent'] },
      { id: 'projects', label: 'Projects', description: 'Manage your projects', href: '/client/projects', icon: Briefcase, group: 'Navigate', keywords: ['work'] },
      { id: 'contracts', label: 'Contracts', description: 'View contracts', href: '/client/contracts', icon: FileText, group: 'Navigate' },
      { id: 'payments', label: 'Payments', description: 'Payment history', href: '/client/payments', icon: CreditCard, group: 'Navigate', keywords: ['billing', 'money'] },
      { id: 'analytics', label: 'Analytics', description: 'Spending & insights', href: '/client/analytics', icon: BarChart3, group: 'Navigate' },
      { id: 'escrow', label: 'Escrow', description: 'Escrow management', href: '/client/escrow', icon: Shield, group: 'Navigate' },
      { id: 'wallet', label: 'Wallet', description: 'Wallet balance', href: '/client/wallet', icon: Wallet, group: 'Navigate' },
      { id: 'reviews', label: 'Reviews', description: 'Freelancer reviews', href: '/client/reviews', icon: Star, group: 'Navigate' },
      ...common,
    ];
  }

  if (role === 'freelancer') {
    return [
      { id: 'dashboard', label: 'Dashboard', description: 'Freelancer overview', href: '/freelancer/dashboard', icon: LayoutDashboard, group: 'Navigate', shortcut: '⌘1' },
      { id: 'find-work', label: 'Find Work', description: 'Browse available jobs', href: '/freelancer/jobs', icon: Search, group: 'Actions', keywords: ['search', 'jobs', 'Browse'] },
      { id: 'submit-proposal', label: 'Submit Proposal', description: 'Apply for a job', href: '/freelancer/submit-proposal', icon: Plus, group: 'Actions', keywords: ['apply'] },
      { id: 'my-jobs', label: 'My Jobs', description: 'Active work', href: '/freelancer/my-jobs', icon: Briefcase, group: 'Navigate' },
      { id: 'proposals', label: 'Proposals', description: 'Sent proposals', href: '/freelancer/proposals', icon: FileText, group: 'Navigate' },
      { id: 'gigs', label: 'Gigs', description: 'Your services', href: '/freelancer/gigs', icon: Package, group: 'Navigate' },
      { id: 'earnings', label: 'Earnings', description: 'Revenue tracking', href: '/freelancer/earnings', icon: TrendingUp, group: 'Navigate', keywords: ['money', 'income'] },
      { id: 'wallet', label: 'Wallet', description: 'Balance & withdraw', href: '/freelancer/wallet', icon: Wallet, group: 'Navigate' },
      { id: 'portfolio', label: 'Portfolio', description: 'Showcase work', href: '/freelancer/portfolio', icon: Eye, group: 'Navigate' },
      { id: 'analytics', label: 'Analytics', description: 'Performance stats', href: '/freelancer/analytics', icon: BarChart3, group: 'Navigate' },
      { id: 'skills', label: 'Skills', description: 'Manage skills', href: '/freelancer/skills', icon: Award, group: 'Navigate' },
      { id: 'time-tracking', label: 'Time Tracking', description: 'Log hours', href: '/freelancer/time-entries', icon: Clock, group: 'Navigate' },
      ...common,
    ];
  }

  if (role === 'admin') {
    return [
      { id: 'dashboard', label: 'Dashboard', description: 'Admin overview', href: '/admin/dashboard', icon: LayoutDashboard, group: 'Navigate', shortcut: '⌘1' },
      { id: 'users', label: 'User Management', description: 'Manage all users', href: '/admin/users', icon: Users, group: 'Management', keywords: ['accounts'] },
      { id: 'disputes', label: 'Disputes', description: 'Resolve conflicts', href: '/admin/disputes', icon: Shield, group: 'Management' },
      { id: 'fraud', label: 'Fraud Detection', description: 'Review flagged items', href: '/admin/fraud-detection', icon: Shield, group: 'Management' },
      { id: 'analytics', label: 'Analytics', description: 'Platform insights', href: '/admin/analytics', icon: BarChart3, group: 'Navigate' },
      { id: 'payments', label: 'Payments', description: 'Transaction overview', href: '/admin/payments', icon: CreditCard, group: 'Navigate' },
      { id: 'audit', label: 'Audit Logs', description: 'System audit trail', href: '/admin/audit', icon: FileText, group: 'Navigate' },
      { id: 'health', label: 'System Health', description: 'Server & service status', href: '/admin/health', icon: TrendingUp, group: 'Navigate' },
      { id: 'feature-flags', label: 'Feature Flags', description: 'Toggle features', href: '/admin/feature-flags', icon: Globe, group: 'System' },
      { id: 'moderation', label: 'Moderation', description: 'Content review', href: '/admin/moderation', icon: Eye, group: 'Management' },
      ...common,
    ];
  }

  return common;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, userRole = 'client' }) => {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const commands = useMemo(() => getCommandsForRole(userRole), [userRole]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.description?.toLowerCase().includes(q) ||
      cmd.keywords?.some(k => k.toLowerCase().includes(q))
    );
  }, [query, commands]);

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach(cmd => {
      const existing = map.get(cmd.group) || [];
      existing.push(cmd);
      map.set(cmd.group, existing);
    });
    return map;
  }, [filtered]);

  const flatItems = useMemo(() => filtered, [filtered]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector(`[data-index="${activeIndex}"]`);
    if (active) active.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleSelect = useCallback((item: CommandItem) => {
    onClose();
    router.push(item.href);
  }, [onClose, router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[activeIndex]) handleSelect(flatItems[activeIndex]);
    }
  }, [flatItems, activeIndex, handleSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(commonStyles.overlay, themeStyles.overlay)}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className={cn(commonStyles.palette, themeStyles.palette)} onKeyDown={handleKeyDown}>
        {/* Search Input */}
        <div className={cn(commonStyles.searchSection)}>
          <Search size={18} className={commonStyles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={cn(commonStyles.searchInput, themeStyles.searchInput)}
            placeholder="Search commands, pages, actions..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            aria-label="Search commands"
            autoComplete="off"
          />
          <span className={cn(commonStyles.shortcutHint, themeStyles.shortcutHint)}>ESC</span>
        </div>

        <div className={cn(commonStyles.divider, themeStyles.divider)} />

        {/* Results */}
        <div className={commonStyles.resultsList} ref={listRef} role="listbox">
          {flatItems.length === 0 ? (
            <div className={commonStyles.emptyState}>
              <Search size={24} />
              <p>No results for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            Array.from(groups.entries()).map(([group, items]) => (
              <div key={group}>
                <div className={cn(commonStyles.groupLabel, themeStyles.groupLabel)}>{group}</div>
                {items.map((item) => {
                  const globalIdx = flatItems.indexOf(item);
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      data-index={globalIdx}
                      className={cn(
                        commonStyles.resultItem,
                        themeStyles.resultItem,
                        globalIdx === activeIndex && commonStyles.resultItemActive,
                        globalIdx === activeIndex && themeStyles.resultItemActive
                      )}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                      role="option"
                      aria-selected={globalIdx === activeIndex}
                    >
                      <div className={cn(commonStyles.resultIcon, themeStyles.resultIcon)}>
                        <Icon size={16} />
                      </div>
                      <div className={commonStyles.resultText}>
                        <div className={cn(commonStyles.resultLabel, themeStyles.resultLabel)}>{item.label}</div>
                        {item.description && (
                          <div className={cn(commonStyles.resultDescription, themeStyles.resultDescription)}>
                            {item.description}
                          </div>
                        )}
                      </div>
                      {item.shortcut && (
                        <span className={cn(commonStyles.resultShortcut, themeStyles.resultShortcut)}>
                          {item.shortcut}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={cn(commonStyles.footer, themeStyles.footer)}>
          <div className={commonStyles.footerKeys}>
            <span className={commonStyles.footerKey}><kbd>↑↓</kbd> navigate</span>
            <span className={commonStyles.footerKey}><kbd>↵</kbd> select</span>
            <span className={commonStyles.footerKey}><kbd>esc</kbd> close</span>
          </div>
          <span>MegiLance</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
