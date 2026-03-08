// @AI-HINT: Profile completion page - first-time onboarding for new users
'use client';

import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import ProfileWizard from '@/app/components/Profile/ProfileWizard/ProfileWizard';
import commonStyles from './CompleteProfile.common.module.css';
import lightStyles from './CompleteProfile.light.module.css';
import darkStyles from './CompleteProfile.dark.module.css';

export default function CompleteProfilePage() {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.wrapper, themeStyles.wrapper)}>
      <ProfileWizard />
    </div>
  );
}
