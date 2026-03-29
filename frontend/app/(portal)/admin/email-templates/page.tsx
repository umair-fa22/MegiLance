// @AI-HINT: Admin Email Templates page wrapper
'use client';

import dynamic from 'next/dynamic';
import Loading from '@/app/components/atoms/Loading/Loading';

const EmailTemplates = dynamic(() => import('./EmailTemplates'), {
  loading: () => <Loading text="Loading email templates..." />,
  ssr: false,
});

export default function AdminEmailTemplatesPage() {
  return <EmailTemplates />;
}
