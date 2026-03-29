// @AI-HINT: This is the root layout for the authenticated section of the application (e.g., /dashboard, /projects). It uses a Next.js route group `(dashboard)` to apply the DashboardLayout to all nested routes without affecting the URL.

import React from 'react';
import DashboardLayout from '@/app/components/templates/Layouts/DashboardLayout';

export default function AuthenticatedAppLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
