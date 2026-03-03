// @AI-HINT: Test file for the Features page component. Tests rendering, category filtering, and accessibility.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

// Mock the Animations barrel export
jest.mock('@/components/Animations', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const icon = ({ ...props }: any) => <svg {...props} data-testid="lucide-icon" />;
  return new Proxy({}, { get: () => icon });
});

import Features from './Features';

describe('Features Component', () => {
  test('renders the page title and description', () => {
    render(<Features />);
    expect(screen.getByText(/Everything you need to/i)).toBeInTheDocument();
    expect(screen.getByText(/freelance smarter/i)).toBeInTheDocument();
  });

  test('renders the hero stats', () => {
    render(<Features />);
    const liveElements = screen.getAllByText('Live');
    expect(liveElements.length).toBeGreaterThan(0);
    expect(screen.getAllByText('In Beta').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Coming Soon').length).toBeGreaterThan(0);
  });

  test('renders All category tab as active by default', () => {
    render(<Features />);
    const allTab = screen.getByRole('tab', { name: /all/i });
    expect(allTab).toHaveAttribute('aria-selected', 'true');
  });

  test('renders all category tabs', () => {
    render(<Features />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(6); // All + 5 categories
  });

  test('filters features when a category tab is clicked', () => {
    render(<Features />);

    const paymentsTab = screen.getByRole('tab', { name: /payments/i });
    fireEvent.click(paymentsTab);

    expect(paymentsTab).toHaveAttribute('aria-selected', 'true');
    const allTab = screen.getByRole('tab', { name: /all/i });
    expect(allTab).toHaveAttribute('aria-selected', 'false');
  });

  test('renders feature cards with status pills', () => {
    render(<Features />);
    const livePills = screen.getAllByText('Live');
    expect(livePills.length).toBeGreaterThan(1); // hero stat + cards
  });

  test('renders CTA section', () => {
    render(<Features />);
    expect(screen.getByText(/Ready to get started/i)).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    const freelancerLink = links.find(l => l.getAttribute('href') === '/signup/freelancer');
    expect(freelancerLink).toBeDefined();
  });

  test('has proper ARIA tablist role on category navigation', () => {
    render(<Features />);
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
  });

  test('renders all feature cards when All tab is active', () => {
    render(<Features />);
    const articles = screen.getAllByRole('article');
    expect(articles.length).toBe(20);
  });
});
