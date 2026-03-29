// @AI-HINT: Test file for the Button component.
// This file demonstrates how to test UI components with React Testing Library,
// including testing different variants, interactions, and accessibility.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '@/app/components/Button/Button';

describe('Button Component', () => {
  test('renders with default variant and children', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('primary');
  });

  test('renders with secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    
    const button = screen.getByRole('button', { name: /secondary/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('secondary');
  });

  test('renders with destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    
    const button = screen.getByRole('button', { name: /delete/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('destructive');
  });

  test('renders with outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    
    const button = screen.getByRole('button', { name: /outline/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('outline');
  });

  test('renders with ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    
    const button = screen.getByRole('button', { name: /ghost/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('ghost');
  });

  test('renders with link variant', () => {
    render(<Button variant="link">Link</Button>);
    
    const button = screen.getByRole('button', { name: /link/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('link');
  });

  test('applies correct size classes', () => {
    const { rerender } = render(<Button size="small">Small</Button>);
    let button = screen.getByRole('button', { name: /small/i });
    expect(button).toHaveClass('small');
    
    rerender(<Button size="large">Large</Button>);
    button = screen.getByRole('button', { name: /large/i });
    expect(button).toHaveClass('large');
  });

  test('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick handler when disabled', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    const button = screen.getByRole('button', { name: /disabled/i });
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('is accessible with proper aria attributes', () => {
    render(<Button aria-label="Accessible button">Click me</Button>);
    
    const button = screen.getByRole('button', { name: /accessible button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Accessible button');
  });
});
