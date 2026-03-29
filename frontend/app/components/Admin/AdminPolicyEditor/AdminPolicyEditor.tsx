// @AI-HINT: This component provides a fully theme-aware editor for administrators to update policy documents. It uses per-component CSS modules and the cn utility for robust, maintainable styling.
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { FileText, ShieldCheck, UserCheck, Save, CheckCircle } from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';
import Textarea from '@/app/components/atoms/Textarea/Textarea';

import commonStyles from './AdminPolicyEditor.common.module.css';
import lightStyles from './AdminPolicyEditor.light.module.css';
import darkStyles from './AdminPolicyEditor.dark.module.css';

// Mock policy content
const mockPolicies = {
  terms: {
    title: 'Terms of Service',
    icon: FileText,
    content: `Welcome to MegiLance... By using our services, you agree to these terms...`,
  },
  privacy: {
    title: 'Privacy Policy',
    icon: ShieldCheck,
    content: `Your privacy is important to us... We collect data to improve our services...`,
  },
  kyc: {
    title: 'KYC Policy',
    icon: UserCheck,
    content: `Know Your Customer (KYC) guidelines require us to verify the identity of our users...`,
  },
};

type PolicyType = keyof typeof mockPolicies;

const AdminPolicyEditor: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyType>('terms');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    setContent(mockPolicies[selectedPolicy].content);
  }, [selectedPolicy]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // DEFERRED: Requires backend admin policy CRUD API endpoint
      // await api.admin.updatePolicy(selectedPolicy, content);
      await new Promise(resolve => setTimeout(resolve, 1500));
      mockPolicies[selectedPolicy].content = content;
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      // Handle save error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn(commonStyles.editorLayout, themeStyles.editorLayout)}>
      <aside className={cn(commonStyles.sidebar, themeStyles.sidebar)}>
        <h2 className={cn(commonStyles.sidebarTitle, themeStyles.sidebarTitle)}>Policies</h2>
        <nav className={commonStyles.policyNav}>
          {Object.keys(mockPolicies).map((key) => {
            const policy = mockPolicies[key as PolicyType];
            const Icon = policy.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedPolicy(key as PolicyType)}
                className={cn(
                  commonStyles.navItem,
                  themeStyles.navItem,
                  selectedPolicy === key && commonStyles.navItemActive,
                  selectedPolicy === key && themeStyles.navItemActive
                )}
              >
                <Icon size={18} className={commonStyles.navIcon} />
                <span>{policy.title}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <main className={commonStyles.mainContent}>
        <div className={cn(commonStyles.editorHeader, themeStyles.editorHeader)}>
          <h1 className={cn(commonStyles.editorTitle, themeStyles.editorTitle)}>{mockPolicies[selectedPolicy].title}</h1>
          <div className={commonStyles.editorActions}>
            {isSaved && (
              <div className={cn(commonStyles.saveConfirmation, themeStyles.saveConfirmation)}>
                <CheckCircle size={18} />
                <span>Saved!</span>
              </div>
            )}
            <Button variant="primary" onClick={handleSave} disabled={isSaving} iconBefore={isSaving ? undefined : <Save size={16} />}>
              {isSaving ? 'Saving...' : 'Save Policy'}
            </Button>
          </div>
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={cn(commonStyles.editorTextarea, themeStyles.editorTextarea)}
          wrapperClassName={commonStyles.editorTextareaWrapper}
        />
      </main>
    </div>
  );
};

export default AdminPolicyEditor;
