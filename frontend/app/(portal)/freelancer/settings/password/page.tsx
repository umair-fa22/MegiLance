// @AI-HINT: This is the Password Settings page. It includes a secure form for updating passwords, complete with a strength indicator and toaster notifications for a premium user experience.
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useToaster } from '@/app/components/molecules/Toast/ToasterProvider';
import { apiFetch } from '@/lib/api/core';

import Input from '@/app/components/atoms/Input/Input';
import Button from '@/app/components/atoms/Button/Button';
import { Label } from '@/app/components/atoms/Label/Label';
import PasswordStrength from './components/PasswordStrength/PasswordStrength';

import commonStyles from '../Settings.common.module.css';
import lightStyles from '../Settings.light.module.css';
import darkStyles from '../Settings.dark.module.css';

const PasswordSettingsPage = () => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const toaster = useToaster();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toaster.notify({ title: 'Password mismatch', description: 'New passwords do not match.', variant: 'danger' });
      return;
    }
    if (newPassword.length < 8) {
      toaster.notify({ title: 'Weak password', description: 'Password must be at least 8 characters long.', variant: 'warning' });
      return;
    }

    setIsSaving(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toaster.notify({ title: 'Updated', description: 'Password updated successfully!', variant: 'success' });
    } catch (err: any) {
      toaster.notify({ 
        title: 'Error', 
        description: err.message || 'Failed to update password. Please try again.', 
        variant: 'danger' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn(commonStyles.formContainer, styles.formContainer)}>
      <header className={cn(commonStyles.formHeader, styles.formHeader)}>
        <h2 className={cn(commonStyles.formTitle, styles.formTitle)}>Password</h2>
        <p className={cn(commonStyles.formDescription, styles.formDescription)}>
          Update your password. Choose a strong and unique password.
        </p>
      </header>

      <form onSubmit={handleSubmit} className={commonStyles.form}>
        <div className={commonStyles.inputGroup}>
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
            required
            className={styles.input}
          />
        </div>

        <div className={commonStyles.inputGroup}>
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter your new password"
            required
            className={styles.input}
          />
          <PasswordStrength password={newPassword} />
        </div>

        <div className={commonStyles.inputGroup}>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            required
            className={styles.input}
          />
        </div>

        <footer className={cn(commonStyles.formFooter, styles.formFooter)}>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Updating...' : 'Update Password'}
          </Button>
        </footer>
      </form>
    </div>
  );
};

export default PasswordSettingsPage;
