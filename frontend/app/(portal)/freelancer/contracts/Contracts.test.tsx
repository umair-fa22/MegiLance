// @AI-HINT: Test file for the Contracts component. Tests rendering, loading states, and component extraction integrity.

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>;
  return { __esModule: true, default: MockLink };
});

// Mock animation components
jest.mock('@/app/components/Animations/PageTransition', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/app/components/Animations/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock API
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    contracts: {
      list: jest.fn().mockResolvedValue({ items: [] }),
    },
  },
}));
jest.mock('@/lib/api/core', () => ({
  apiFetch: jest.fn().mockResolvedValue({}),
}));

// Mock hooks
jest.mock('@/app/lib/hooks/usePersistedState', () => ({
  usePersistedState: <T,>(key: string, init: T): [T, jest.Mock] => [init, jest.fn()],
}));
jest.mock('@/app/lib/hooks/useSelection', () => ({
  useSelection: () => ({
    selected: [], isSelected: () => false, toggle: jest.fn(),
    clear: jest.fn(), selectMany: jest.fn(), deselectMany: jest.fn(), count: 0,
  }),
}));
jest.mock('@/app/lib/hooks/useColumnVisibility', () => ({
  useColumnVisibility: () => ({
    visible: ['projectTitle', 'clientName', 'value', 'status', 'contract', 'actions'],
    toggle: jest.fn(), setAll: jest.fn(),
  }),
}));

// Mock Toast
jest.mock('@/app/components/Toast', () => ({
  useToaster: () => ({ notify: jest.fn() }),
}));

// Mock child components
jest.mock('@/app/components/Button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
jest.mock('@/app/components/Badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));
jest.mock('@/app/components/Modal', () => ({
  Modal: ({ children, isOpen }: any) => isOpen ? <div data-testid="modal">{children}</div> : null,
}));
jest.mock('@/app/components/DataDisplay', () => ({
  DataToolbar: () => <div data-testid="data-toolbar" />,
  DensityToggle: () => <div data-testid="density-toggle" />,
  ColumnVisibilityMenu: () => <div data-testid="column-menu" />,
  SavedViewsMenu: () => <div data-testid="saved-views" />,
  SelectionBar: () => <div data-testid="selection-bar" />,
  TableSkeleton: () => <div data-testid="table-skeleton" />,
  VirtualTableBody: ({ items, renderRow }: any) => <tbody>{items.map(renderRow)}</tbody>,
  PaginationBar: () => <div data-testid="pagination-bar" />,
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Loader2: (props: any) => <svg {...props} data-testid="loader" />,
}));

import Contracts from './Contracts';

describe('Contracts Component', () => {
  test('renders the page title', async () => {
    render(<Contracts />);
    await waitFor(() => {
      expect(screen.getByText('Your Contracts')).toBeInTheDocument();
    });
  });

  test('renders subtitle text', async () => {
    render(<Contracts />);
    await waitFor(() => {
      expect(screen.getByText(/View and manage all your smart contracts/i)).toBeInTheDocument();
    });
  });

  test('shows loading state initially', () => {
    render(<Contracts />);
    expect(screen.getByText(/Loading contracts/i)).toBeInTheDocument();
  });

  test('shows empty state when no contracts loaded', async () => {
    render(<Contracts />);
    await waitFor(() => {
      expect(screen.getByText(/No contracts found/i)).toBeInTheDocument();
    });
  });

  test('page.tsx re-exports Contracts component', () => {
    // Verify the page wrapper correctly delegates to Contracts
    const pageModule = require('./page');
    expect(pageModule.default).toBeDefined();
  });
});
