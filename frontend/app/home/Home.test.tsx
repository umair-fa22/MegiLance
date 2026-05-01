// @AI-HINT: Test file for the Home page component.
// Tests that all major sections render and are present.

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

// Mock sub-components with relative paths matching Home.tsx imports
jest.mock('./components/Hero/Hero', () => {
  return () => <div>Hero Section</div>;
});
jest.mock('./components/TrustIndicators', () => {
  return () => <div data-testid="trust-indicators">Trust Indicators</div>;
});
jest.mock('./components/ProjectStats', () => {
  return () => <div data-testid="project-stats">Project Stats</div>;
});
jest.mock('./components/WhyMegiLance', () => {
  return () => <div data-testid="why-megilance">Why MegiLance</div>;
});
jest.mock('./components/Features', () => {
  return () => <div data-testid="features-section">Features Section</div>;
});
jest.mock('./components/FeaturesStatus', () => {
  return () => <div data-testid="features-status">Features Status</div>;
});
jest.mock('./components/HowItWorks', () => {
  return () => <div data-testid="how-it-works">How It Works Section</div>;
});
jest.mock('./components/PoweredByAI', () => {
  return () => <div data-testid="powered-by-ai">Powered By AI</div>;
});
jest.mock('./components/Testimonials', () => {
  return () => <div data-testid="testimonials">Testimonials Section</div>;
});

// Mock animation utilities from parent
jest.mock('../components/Animations/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('../components/Animations/PageTransition', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('../components/Animations/GlobeBackground', () => {
  return () => <div data-testid="globe-background">Globe Background</div>;
});

import Home from '@/app/home/Home';

describe('Home Page Component', () => {
  test('renders major sections', () => {
    render(<Home />);
    
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('trust-indicators')).toBeInTheDocument();
    expect(screen.getByTestId('features-section')).toBeInTheDocument();
    expect(screen.getByTestId('how-it-works')).toBeInTheDocument();
    expect(screen.getByTestId('testimonials')).toBeInTheDocument();
  });

  test('renders page with theme-aware structure', () => {
    render(<Home />);
    // Verify the page renders without crashing (theme-dependent rendering)
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });
});
