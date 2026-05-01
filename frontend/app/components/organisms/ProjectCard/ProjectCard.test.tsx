// @AI-HINT: Test file for the ProjectCard component.
// This file demonstrates testing of a complex component with multiple sub-components,
// including testing props, user interactions, and proper rendering of data.

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectCard from '@/app/components/organisms/ProjectCard/ProjectCard';

// Mock next-themes since it relies on React Context
jest.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

// Mock next/link since it's not available in the test environment
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock sub-components to isolate the ProjectCard tests
jest.mock('@/app/components/atoms/UserAvatar/UserAvatar', () => {
  return ({ name }: { name: string }) => <div data-testid="user-avatar">{name}</div>;
});

jest.mock('@/app/components/atoms/ProgressBar/ProgressBar', () => {
  return ({ progress }: { progress: number }) => (
    <div data-testid="progress-bar">Progress: {progress}%</div>
  );
});

jest.mock('@/app/components/molecules/ActionMenu/ActionMenu', () => {
  return ({ items }: { items: any[] }) => (
    <div data-testid="action-menu">
      {items.map((item, index) => (
        <button key={index}>{item.label}</button>
      ))}
    </div>
  );
});

jest.mock('@/app/components/atoms/Badge/Badge', () => {
  return ({ children, variant }: { children: React.ReactNode; variant: string }) => (
    <div data-testid="badge" data-variant={variant}>{children}</div>
  );
});

describe('ProjectCard Component', () => {
  const mockProps = {
    id: '1',
    title: 'Build a responsive website',
    status: 'In Progress' as const,
    progress: 75,
    budget: 5000,
    paid: 3000,
    freelancers: [
      { id: '1', name: 'John Doe', avatarUrl: '/john.jpg' },
      { id: '2', name: 'Jane Smith', avatarUrl: '/jane.jpg' },
    ],
    updatedAt: '2 hours ago',
  };

  test('renders project title with link to project details', () => {
    render(<ProjectCard {...mockProps} />);
    
    const titleLink = screen.getByText('Build a responsive website');
    expect(titleLink).toBeInTheDocument();
    expect(titleLink).toHaveAttribute('href', '/client/projects/1');
  });

  test('displays project status with correct badge variant', () => {
    render(<ProjectCard {...mockProps} />);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-variant', 'info');
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  test('shows financial information with paid and budget amounts', () => {
    render(<ProjectCard {...mockProps} />);
    
    expect(screen.getByText('$3,000')).toBeInTheDocument();
    expect(screen.getByText('/ $5,000')).toBeInTheDocument();
  });

  test('renders progress bar with correct progress value', () => {
    render(<ProjectCard {...mockProps} />);
    
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveTextContent('Progress: 75%');
  });

  test('displays freelancer avatars', () => {
    render(<ProjectCard {...mockProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('shows additional freelancer count when more than 3 freelancers', () => {
    const propsWithMoreFreelancers = {
      ...mockProps,
      freelancers: [
        { id: '1', name: 'John Doe', avatarUrl: '/john.jpg' },
        { id: '2', name: 'Jane Smith', avatarUrl: '/jane.jpg' },
        { id: '3', name: 'Bob Johnson', avatarUrl: '/bob.jpg' },
        { id: '4', name: 'Alice Williams', avatarUrl: '/alice.jpg' },
      ],
    };
    
    render(<ProjectCard {...propsWithMoreFreelancers} />);
    
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  test('displays updated time information', () => {
    render(<ProjectCard {...mockProps} />);
    
    expect(screen.getByText('Updated 2 hours ago')).toBeInTheDocument();
  });

  test('renders action menu with correct items', () => {
    render(<ProjectCard {...mockProps} />);
    
    const actionMenu = screen.getByTestId('action-menu');
    expect(actionMenu).toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Make Payment')).toBeInTheDocument();
    expect(screen.getByText('Contact Team')).toBeInTheDocument();
  });

  test('shows different badge variants for different statuses', () => {
    const { rerender } = render(<ProjectCard {...mockProps} status="Completed" />);
    let badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-variant', 'success');
    
    rerender(<ProjectCard {...mockProps} status="Pending" />);
    badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-variant', 'warning');
    
    rerender(<ProjectCard {...mockProps} status="Cancelled" />);
    badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-variant', 'danger');
  });
});
