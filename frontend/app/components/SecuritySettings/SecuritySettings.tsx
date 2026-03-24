// @AI-HINT: Reusable Security Settings component for all user roles. Handles password change, 2FA, and login history.
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Shield, Key, History, Laptop } from 'lucide-react'
import { PageTransition, ScrollReveal, StaggerContainer, StaggerItem } from '@/app/components/Animations';
import Button from '@/app/components/Button/Button';
import LinkedAccounts from '@/app/components/LinkedAccounts/LinkedAccounts';

import common from './SecuritySettings.common.module.css';
import light from './SecuritySettings.light.module.css';
import dark from './SecuritySettings.dark.module.css';

const SecuritySettings: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);
    try {
      const { default: api } = await import('@/lib/api');
      await api.auth.changePassword(currentPassword, newPassword);
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className={cn(common.container, themed.container)}>
        <ScrollReveal>
          <header className={common.header}>
            <h1 className={cn(common.title, themed.title)}>Security Settings</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>
              Manage your password, 2FA, and connected devices.
            </p>
          </header>
        </ScrollReveal>

        <StaggerContainer>
          {/* Password Section */}
          <StaggerItem className={cn(common.section, themed.section)}>
            <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>
              <Key size={20} /> Change Password
            </h2>
            <form onSubmit={handlePasswordUpdate}>
              {error && (
                <div className={cn(common.errorMessage, themed.errorMessage)}>
                  {error}
                </div>
              )}
              {success && (
                <div className={cn(common.successMessage, themed.successMessage)}>
                  {success}
                </div>
              )}
              <div className={common.formGroup}>
                <label htmlFor="current-password" className={cn(common.label, themed.label)}>Current Password</label>
                <input 
                  id="current-password"
                  type="password" 
                  className={cn(common.input, themed.input)} 
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className={common.formGroup}>
                <label htmlFor="new-password" className={cn(common.label, themed.label)}>New Password</label>
                <input 
                  id="new-password"
                  type="password" 
                  className={cn(common.input, themed.input)} 
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className={common.formGroup}>
                <label htmlFor="confirm-password" className={cn(common.label, themed.label)}>Confirm New Password</label>
                <input 
                  id="confirm-password"
                  type="password" 
                  className={cn(common.input, themed.input)} 
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" variant="primary" isLoading={loading}>
                Update Password
              </Button>
            </form>
          </StaggerItem>

          {/* Linked Social Accounts */}
          <StaggerItem>
            <LinkedAccounts />
          </StaggerItem>

          {/* 2FA Section */}
          <StaggerItem className={cn(common.section, themed.section)}>
            <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>
              <Shield size={20} /> Two-Factor Authentication
            </h2>
            <div className={cn(common.row, themed.row)}>
              <div className={common.rowInfo}>
                <div className={cn(common.rowTitle, themed.rowTitle)}>Authenticator App</div>
                <div className={cn(common.rowDesc, themed.rowDesc)}>Use Google Authenticator or Authy</div>
              </div>
              <span className={cn(common.badge, themed.badgeWarning)}>Not Configured</span>
              <Button variant="outline" size="sm">Setup</Button>
            </div>
            <div className={cn(common.row, themed.row)}>
              <div className={common.rowInfo}>
                <div className={cn(common.rowTitle, themed.rowTitle)}>SMS Authentication</div>
                <div className={cn(common.rowDesc, themed.rowDesc)}>Receive codes via SMS</div>
              </div>
              <span className={cn(common.badge, themed.badgeSuccess)}>Enabled</span>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
          </StaggerItem>

          {/* Login History */}
          <StaggerItem className={cn(common.section, themed.section)}>
            <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>
              <History size={20} /> Recent Login Activity
            </h2>
            <div className={common.historyList}>
              {[
                { device: 'Windows PC - Chrome', location: 'New York, USA', time: 'Just now', current: true },
                { device: 'iPhone 13 - Safari', location: 'New York, USA', time: '2 hours ago', current: false },
                { device: 'MacBook Pro - Firefox', location: 'Boston, USA', time: 'Yesterday', current: false },
              ].map((login, i) => (
                <div key={i} className={cn(common.historyItem, themed.historyItem)}>
                  <div className={common.deviceInfo}>
                    <Laptop size={16} className={common.deviceIcon} />
                    <div>
                      <div className={cn(common.rowTitle, themed.rowTitle)}>{login.device}</div>
                      <div className={cn(common.rowDesc, themed.rowDesc)}>
                        {login.location} • {login.time}
                      </div>
                    </div>
                  </div>
                  {login.current && (
                    <span className={cn(common.badge, themed.badgeSuccess)}>Current Session</span>
                  )}
                </div>
              ))}
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  );
};

export default SecuritySettings;
