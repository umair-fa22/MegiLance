// @AI-HINT: This is the DefaultLayout, used for public-facing pages like Home, About, etc. It includes the main Header and Footer.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Header from '@/app/components/Header/Header';
import Footer from '@/app/components/Footer/Footer';
import commonStyles from './DefaultLayout.common.module.css';
import lightStyles from './DefaultLayout.light.module.css';
import darkStyles from './DefaultLayout.dark.module.css';

interface DefaultLayoutProps {
  children: React.ReactNode;
}

const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;


  return (
    <div className={cn(commonStyles.layout, themeStyles.layout)}>
      <Header />
      <main className={commonStyles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default DefaultLayout;
