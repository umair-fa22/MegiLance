// @AI-HINT: Wrapper hook to provide a shadcn-like `useToast` API on top of our ToasterProvider.
'use client';

import { useToaster } from './ToasterProvider';

export type ToastArgs = {
  title?: string;
  description?: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  duration?: number;
};

export function useToast() {
  const toaster = useToaster();

  const toast = (args: ToastArgs) => {
    return toaster.notify({
      title: args.title,
      description: args.description,
      variant: args.variant ?? 'info',
      duration: args.duration ?? 4000,
    });
  };

  return { toast, dismiss: toaster.dismiss };
}
