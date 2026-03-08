// @AI-HINT: Project creation page for clients to post new projects
'use client';

import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import ProjectWizard from '@/app/components/Project/ProjectWizard/ProjectWizard';
import commonStyles from './CreateProject.common.module.css';
import lightStyles from './CreateProject.light.module.css';
import darkStyles from './CreateProject.dark.module.css';

export default function CreateProjectPage() {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.wrapper, themeStyles.wrapper)}>
      <ProjectWizard />
    </div>
  );
}
