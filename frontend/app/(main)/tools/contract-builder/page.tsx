// @AI-HINT: Public standalone tool page for Contract Builder
import React from 'react';
import { Metadata } from 'next';
import ContractBuilder from '@/app/components/ContractBuilder/ContractBuilder';

export const metadata: Metadata = {
  title: 'Smart Contract Builder | MegiLance Tools',
  description: 'Generate professional freelance contracts, NDAs, and service agreements instantly with AI.',
};

export default function ContractBuilderPage() {
  return (
    <main className="py-20 flex-grow">
      <ContractBuilder />
    </main>
  );
}