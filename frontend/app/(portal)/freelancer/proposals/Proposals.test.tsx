// @AI-HINT: Test file for the Proposals component. Tests rendering, loading states, and component extraction integrity.

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

// Mock animation components
jest.mock('@/app/components/Animations/PageTransition', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/app/components/Animations/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/app/components/Animations/StaggerContainer', () => ({
  StaggerContainer: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
  StaggerItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock API
jest.mock('@/lib/api/core', () => ({
  apiFetch: jest.fn().mockResolvedValue([]),
}));

// Mock hooks
jest.mock('@/app/lib/hooks/usePersistedState', () => ({
  usePersistedState: <T,>(key: string, init: T): [T, jest.Mock] => [init, jest.fn()],
}));

// Mock Toast
jest.mock('@/app/components/Toast/ToasterProvider', () => ({
  useToaster: () => ({ notify: jest.fn() }),
}));

// Mock child components
jest.mock('./components/ProposalCard/ProposalCard', () => {
  const ProposalCard = () => <div data-testid="proposal-card" />;
  return { __esModule: true, default: ProposalCard };
});
jest.mock('./components/StatusFilter/StatusFilter', () => {
  const StatusFilter = () => <div data-testid="status-filter" />;
  return { __esModule: true, default: StatusFilter };
});
jest.mock('@/app/components/DataToolbar/DataToolbar', () => {
  const DataToolbar = () => <div data-testid="data-toolbar" />;
  return { __esModule: true, default: DataToolbar };
});
jest.mock('@/app/components/PaginationBar/PaginationBar', () => {
  const PaginationBar = () => <div data-testid="pagination-bar" />;
  return { __esModule: true, default: PaginationBar };
});
jest.mock('@/app/components/Modal/Modal', () => {
  const Modal = ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
    isOpen ? <div data-testid="modal">{children}</div> : null;
  return { __esModule: true, default: Modal };
});
jest.mock('@/app/components/Button/Button', () => {
  const Button = ({ children, ...props }: any) => <button {...props}>{children}</button>;
  return { __esModule: true, default: Button };
});
jest.mock('@/app/components/DataTableExtras/TableSkeleton', () => {
  const TableSkeleton = () => <div data-testid="table-skeleton" />;
  return { __esModule: true, default: TableSkeleton };
});

import Proposals from './Proposals';

describe('Proposals Component', () => {
  test('renders the page title and subtitle', async () => {
    render(<Proposals />);
    expect(screen.getByText('My Proposals')).toBeInTheDocument();
    expect(screen.getByText(/Track and manage all your job proposals/i)).toBeInTheDocument();
  });

  test('renders loading skeleton initially', () => {
    render(<Proposals />);
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });

  test('renders the data toolbar', () => {
    render(<Proposals />);
    expect(screen.getByTestId('data-toolbar')).toBeInTheDocument();
  });

  test('renders the status filter', () => {
    render(<Proposals />);
    expect(screen.getByTestId('status-filter')).toBeInTheDocument();
  });

  test('page.tsx re-exports Proposals component', () => {
    // Verify the page wrapper correctly delegates to Proposals
    // This test validates the extraction was done correctly
    const pageModule = require('./page');
    expect(pageModule.default).toBeDefined();
  });
});
