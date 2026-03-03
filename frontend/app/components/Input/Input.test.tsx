// @AI-HINT: Test file for the Input component.
// This file demonstrates comprehensive testing of the Input component,
// including testing props, user interactions, and various states.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Input from '@/app/components/Input/Input';

// Mock next-themes since it relies on React Context
jest.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

describe('Input Component', () => {
  test('renders with label', () => {
    render(<Input label="Email" />);
    
    const input = screen.getByRole('textbox');
    const label = screen.getByText('Email');
    
    expect(input).toBeInTheDocument();
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', input.id);
  });

  test('renders with placeholder', () => {
    render(<Input placeholder="Enter your email" />);
    
    const input = screen.getByPlaceholderText('Enter your email');
    expect(input).toBeInTheDocument();
  });

  test('renders with initial value', () => {
    render(<Input value="test@example.com" />);
    
    const input = screen.getByDisplayValue('test@example.com');
    expect(input).toBeInTheDocument();
  });

  test('handles user input', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    
    expect(input).toHaveValue('test@example.com');
  });

  test('displays error message when error prop is provided', () => {
    render(<Input label="Email" error="Please enter a valid email" />);
    
    const errorMessage = screen.getByText('Please enter a valid email');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('errorMessage');
  });

  test('displays help text when provided', () => {
    render(<Input label="Email" helpText="We will never share your email" />);
    
    const helpText = screen.getByText('We will never share your email');
    expect(helpText).toBeInTheDocument();
    expect(helpText).toHaveClass('helpText');
  });

  test('shows character counter when characterLimit is set', () => {
    render(<Input characterLimit={100} value="Test input" />);
    
    const characterCounter = screen.getByText('10/100');
    expect(characterCounter).toBeInTheDocument();
  });

  test('toggles password visibility when showPasswordToggle is true', () => {
    render(<Input type="password" label="Password" showPasswordToggle />);
    
    const passwordInput = screen.getByLabelText('Password');
    const toggleButton = screen.getByLabelText('Show password');
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('applies disabled state correctly', () => {
    render(<Input disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  test('renders with iconBefore and iconAfter', () => {
    const IconBefore = () => <span>IconBefore</span>;
    const IconAfter = () => <span>IconAfter</span>;
    
    render(<Input iconBefore={<IconBefore />} iconAfter={<IconAfter />} />);
    
    expect(screen.getByText('IconBefore')).toBeInTheDocument();
    expect(screen.getByText('IconAfter')).toBeInTheDocument();
  });

  test('renders with addonBefore and addonAfter', () => {
    render(<Input addonBefore="$" addonAfter=".00" />);
    
    expect(screen.getByText('$')).toBeInTheDocument();
    expect(screen.getByText('.00')).toBeInTheDocument();
  });

  test('applies fullWidth class when fullWidth prop is true', () => {
    render(<Input fullWidth />);
    
    const wrapper = screen.getByRole('textbox').closest('.inputWrapper');
    expect(wrapper).toHaveClass('inputWrapperFullWidth');
  });

  test('focuses and blurs correctly', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    const wrapper = input.closest('.inputWrapper');
    
    fireEvent.focus(input);
    expect(wrapper).toHaveClass('inputWrapperFocused');
    
    fireEvent.blur(input);
    expect(wrapper).not.toHaveClass('inputWrapperFocused');
  });
});