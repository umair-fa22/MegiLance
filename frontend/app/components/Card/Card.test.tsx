// @AI-HINT: Test file for the Card component.
// This file demonstrates testing of the Card component with various props and configurations.

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Card from '@/app/components/Card/Card';

// Mock next-themes since it relies on React Context
jest.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

// Mock icon component for testing
const MockIcon = ({ size }: { size?: number }) => (
  <svg width={size} height={size} data-testid="mock-icon" />
);

describe('Card Component', () => {
  test('renders with children content', () => {
    render(<Card>Card content</Card>);
    
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  test('renders with title', () => {
    render(<Card title="Card Title">Card content</Card>);
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  test('renders with icon when provided', () => {
    render(
      <Card title="Card Title" icon={MockIcon}>
        Card content
      </Card>
    );
    
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    expect(screen.getByText('Card Title')).toBeInTheDocument();
  });

  test('applies variant classes correctly', () => {
    const { rerender } = render(<Card variant="default">Content</Card>);
    let card = screen.getByText('Content').closest('.card');
    expect(card).toHaveClass('variant-default');
    
    rerender(<Card variant="elevated">Content</Card>);
    card = screen.getByText('Content').closest('.card');
    expect(card).toHaveClass('variant-elevated');
    
    rerender(<Card variant="outline">Content</Card>);
    card = screen.getByText('Content').closest('.card');
    expect(card).toHaveClass('variant-outline');
    
    rerender(<Card variant="filled">Content</Card>);
    card = screen.getByText('Content').closest('.card');
    expect(card).toHaveClass('variant-filled');
  });

  test('applies size classes correctly', () => {
    const { rerender } = render(<Card size="sm">Content</Card>);
    let card = screen.getByText('Content').closest('.card');
    expect(card).toHaveClass('size-sm');
    
    rerender(<Card size="md">Content</Card>);
    card = screen.getByText('Content').closest('.card');
    expect(card).toHaveClass('size-md');
    
    rerender(<Card size="lg">Content</Card>);
    card = screen.getByText('Content').closest('.card');
    expect(card).toHaveClass('size-lg');
  });

  test('shows loading state when loading prop is true', () => {
    render(<Card loading>Content</Card>);
    
    const card = screen.getByText('Content').closest('.card');
    expect(card).toHaveClass('loading');
  });

  test('applies custom className when provided', () => {
    render(<Card className="custom-class">Content</Card>);
    
    const card = screen.getByText('Content').closest('.card');
    expect(card).toHaveClass('custom-class');
  });
});