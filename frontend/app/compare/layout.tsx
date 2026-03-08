// @AI-HINT: Layout for compare pages - wraps in PublicLayout for consistent header/footer
import React from 'react';
import PublicLayout from '../layouts/PublicLayout/PublicLayout';

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
