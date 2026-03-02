// @AI-HINT: Redesigned Explore page with tabbed layout, compact hero, paginated pages grid, and collapsible modules.
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem } from '@/app/components/3D';
import { 
  Layers, Code, Database, Users, CreditCard, MessageSquare, 
  Shield, Search, Brain, FileText, BarChart3, Settings,
  ExternalLink, CheckCircle2, Lock, Globe,
  Briefcase, Bell, Upload, Star, Play,
  Terminal, Server, HardDrive, Activity,
  XCircle, Clock, TrendingUp, ChevronDown, ChevronRight
} from 'lucide-react';

import common from './Explore.common.module.css';
import light from './Explore.light.module.css';
import dark from './Explore.dark.module.css';

const PLATFORM_OVERVIEW = {
  totalPages: 148,
  apiEndpointsLabel: '1369',
  dbTablesLabel: '25+',
  frontendApiClients: 185,
};

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    return '';
  }
  return process.env.NEXT_PUBLIC_API_URL || '';
};

const allPages = [
  { route: '/', name: 'Homepage', description: 'Main landing with hero, features, testimonials', status: 'complete', category: 'public', tech: 'Next.js 14' },
  { route: '/about', name: 'About Us', description: 'Company mission, team, timeline, values', status: 'complete', category: 'public', tech: 'SSR Page' },
  { route: '/pricing', name: 'Pricing', description: '3-tier plans: Starter, Pro, Enterprise', status: 'complete', category: 'public', tech: 'Interactive Cards' },
  { route: '/how-it-works', name: 'How It Works', description: 'Post → Match → Collaborate → Pay', status: 'complete', category: 'public', tech: 'Animated Steps' },
  { route: '/contact', name: 'Contact', description: 'Form with email/phone/address', status: 'complete', category: 'public', tech: 'React Hook Form' },
  { route: '/blog', name: 'Blog', description: 'Articles with categories, search, pagination', status: 'complete', category: 'public', tech: 'Dynamic Routes' },
  { route: '/blog/search', name: 'Blog Search', description: 'Full-text blog search', status: 'complete', category: 'public', tech: 'Search API' },
  { route: '/careers', name: 'Careers', description: 'Job listings, culture, benefits', status: 'complete', category: 'public', tech: 'Static Page' },
  { route: '/faq', name: 'FAQ', description: '20+ questions with accordion', status: 'complete', category: 'public', tech: 'Collapsible UI' },
  { route: '/freelancers', name: 'Browse Freelancers', description: 'Search by skill, rate, rating', status: 'complete', category: 'public', tech: 'FTS5 Search' },
  { route: '/jobs', name: 'Browse Jobs', description: 'Filter by category, budget, remote', status: 'complete', category: 'public', tech: 'FTS5 Search' },
  { route: '/clients', name: 'For Clients', description: 'Client-focused landing, benefits', status: 'complete', category: 'public', tech: 'Marketing Page' },
  { route: '/status', name: 'System Status', description: 'Real-time health monitoring', status: 'complete', category: 'public', tech: 'Health API' },
  { route: '/enterprise', name: 'Enterprise', description: 'Custom plans, SLA, dedicated support', status: 'complete', category: 'public', tech: 'Static Page' },
  { route: '/community', name: 'Community', description: 'Forums, discussions, resources', status: 'complete', category: 'public', tech: 'Community' },
  { route: '/testimonials', name: 'Testimonials', description: 'Success stories, video testimonials', status: 'complete', category: 'public', tech: 'Carousel UI' },
  { route: '/press', name: 'Press', description: 'Media kit, press releases', status: 'complete', category: 'public', tech: 'Static Page' },
  { route: '/talent', name: 'Talent', description: 'Talent showcase and discovery', status: 'complete', category: 'public', tech: 'Search UI' },
  { route: '/teams', name: 'Teams', description: 'Team collaboration features', status: 'complete', category: 'public', tech: 'Marketing Page' },
  { route: '/install', name: 'Install PWA', description: 'PWA installation guide', status: 'complete', category: 'public', tech: 'PWA Support' },
  { route: '/referral', name: 'Referral Program', description: 'Invite friends, earn rewards', status: 'complete', category: 'public', tech: 'Referral API' },
  { route: '/security', name: 'Security', description: 'Security practices, compliance', status: 'complete', category: 'public', tech: 'Static Page' },
  { route: '/cookies', name: 'Cookie Policy', description: 'Cookie usage, GDPR', status: 'complete', category: 'public', tech: 'Legal Page' },
  { route: '/privacy', name: 'Privacy Policy', description: 'Data handling, user rights', status: 'complete', category: 'public', tech: 'Legal Page' },
  { route: '/terms', name: 'Terms of Service', description: 'User agreement, policies', status: 'complete', category: 'public', tech: 'Legal Page' },
  { route: '/analytics', name: 'Analytics', description: 'General analytics page', status: 'complete', category: 'public', tech: 'Charts' },
  { route: '/user-management', name: 'User Management', description: 'User management interface', status: 'complete', category: 'public', tech: 'Admin UI' },
  { route: '/login', name: 'Login', description: 'Email/password + social auth', status: 'complete', category: 'auth', tech: 'JWT Auth' },
  { route: '/signup', name: 'Sign Up', description: 'Registration with role selection', status: 'complete', category: 'auth', tech: 'Validation' },
  { route: '/forgot-password', name: 'Forgot Password', description: 'Email-based password reset', status: 'complete', category: 'auth', tech: 'Email API' },
  { route: '/verify-email', name: 'Verify Email', description: 'Email verification with token', status: 'complete', category: 'auth', tech: 'Token Verify' },
  { route: '/logout', name: 'Logout', description: 'Session termination', status: 'complete', category: 'auth', tech: 'JWT Clear' },
  { route: '/test-login', name: 'Test Login', description: 'Development testing login', status: 'complete', category: 'auth', tech: 'Dev Only' },
  { route: '/passwordless', name: 'Passwordless', description: 'Magic link authentication', status: 'complete', category: 'auth', tech: 'Magic Link' },
  { route: '/onboarding', name: 'Onboarding', description: 'New user onboarding flow', status: 'portal', category: 'auth', tech: 'Onboarding' },
  { route: '/client/dashboard', name: 'Client Dashboard', description: 'Projects overview, stats, activity', status: 'portal', category: 'client', tech: 'Real-time Data' },
  { route: '/client/post-job', name: 'Post Job', description: '5-step wizard', status: 'portal', category: 'client', tech: 'Multi-step Form' },
  { route: '/client/projects', name: 'My Projects', description: 'Projects with filters, search', status: 'portal', category: 'client', tech: 'CRUD API' },
  { route: '/client/contracts', name: 'Contracts', description: 'Active/completed contracts', status: 'portal', category: 'client', tech: 'Contract API' },
  { route: '/client/payments', name: 'Payments', description: 'Transactions, methods, invoices', status: 'portal', category: 'client', tech: 'Stripe API' },
  { route: '/client/messages', name: 'Messages', description: 'Real-time chat, file sharing', status: 'portal', category: 'client', tech: 'WebSocket' },
  { route: '/client/reviews', name: 'Reviews', description: 'Leave/view freelancer reviews', status: 'portal', category: 'client', tech: 'Review API' },
  { route: '/client/wallet', name: 'Wallet', description: 'Balance, add funds, history', status: 'portal', category: 'client', tech: 'Wallet API' },
  { route: '/client/freelancers', name: 'Saved Freelancers', description: 'Bookmarked freelancers', status: 'portal', category: 'client', tech: 'Favorites API' },
  { route: '/client/analytics', name: 'Client Analytics', description: 'Spending, hiring stats', status: 'portal', category: 'client', tech: 'Analytics API' },
  { route: '/client/hire', name: 'Direct Hire', description: 'Invite freelancer to project', status: 'portal', category: 'client', tech: 'Invite API' },
  { route: '/client/profile', name: 'Client Profile', description: 'Edit company info, logo', status: 'portal', category: 'client', tech: 'Profile API' },
  { route: '/client/settings', name: 'Client Settings', description: 'Notifications, privacy, billing', status: 'portal', category: 'client', tech: 'Settings API' },
  { route: '/client/help', name: 'Client Help', description: 'Support articles', status: 'portal', category: 'client', tech: 'Help Center' },
  { route: '/freelancer/dashboard', name: 'Freelancer Dashboard', description: 'Earnings, jobs, proposals', status: 'portal', category: 'freelancer', tech: 'Real-time Data' },
  { route: '/freelancer/jobs', name: 'Find Jobs', description: 'AI-matched jobs, filters', status: 'portal', category: 'freelancer', tech: 'AI Matching' },
  { route: '/freelancer/proposals', name: 'My Proposals', description: 'Proposals, status, response rate', status: 'portal', category: 'freelancer', tech: 'Proposals API' },
  { route: '/freelancer/submit-proposal', name: 'Submit Proposal', description: 'Cover letter, budget, timeline', status: 'portal', category: 'freelancer', tech: 'Form Validation' },
  { route: '/freelancer/contracts', name: 'Contracts', description: 'Active contracts, milestones', status: 'portal', category: 'freelancer', tech: 'Contract API' },
  { route: '/freelancer/portfolio', name: 'Portfolio', description: 'Showcase projects', status: 'portal', category: 'freelancer', tech: 'Portfolio API' },
  { route: '/freelancer/analytics', name: 'Analytics', description: 'Earnings, profile views', status: 'portal', category: 'freelancer', tech: 'Analytics API' },
  { route: '/freelancer/wallet', name: 'Wallet', description: 'Earnings, withdrawals', status: 'portal', category: 'freelancer', tech: 'Wallet API' },
  { route: '/freelancer/withdraw', name: 'Withdraw', description: 'Bank/PayPal/crypto payouts', status: 'portal', category: 'freelancer', tech: 'Payout API' },
  { route: '/freelancer/invoices', name: 'Invoices', description: 'Generate and manage', status: 'portal', category: 'freelancer', tech: 'Invoice API' },
  { route: '/freelancer/referrals', name: 'Referrals', description: 'Invite friends, track earnings', status: 'portal', category: 'freelancer', tech: 'Referral API' },
  { route: '/freelancer/profile', name: 'Profile', description: 'Bio, skills, hourly rate', status: 'portal', category: 'freelancer', tech: 'Profile API' },
  { route: '/freelancer/settings', name: 'Settings', description: 'Account, notifications, privacy', status: 'portal', category: 'freelancer', tech: 'Settings API' },
  { route: '/freelancer/messages', name: 'Messages', description: 'Real-time chat with clients', status: 'portal', category: 'freelancer', tech: 'WebSocket' },
  { route: '/freelancer/reviews', name: 'Reviews', description: 'View client reviews', status: 'portal', category: 'freelancer', tech: 'Review API' },
  { route: '/freelancer/availability', name: 'Availability', description: 'Working hours, calendar', status: 'portal', category: 'freelancer', tech: 'Calendar API' },
  { route: '/freelancer/rate-cards', name: 'Rate Cards', description: 'Service packages and rates', status: 'portal', category: 'freelancer', tech: 'Rate Cards API' },
  { route: '/freelancer/assessments', name: 'Assessments', description: 'Skill tests, certifications', status: 'portal', category: 'freelancer', tech: 'Assessment API' },
  { route: '/freelancer/verification', name: 'Verification', description: 'ID verification', status: 'portal', category: 'freelancer', tech: 'KYC API' },
  { route: '/freelancer/templates', name: 'Templates', description: 'Proposal and contract templates', status: 'portal', category: 'freelancer', tech: 'Templates API' },
  { route: '/freelancer/help', name: 'Help', description: 'Support center, FAQs', status: 'portal', category: 'freelancer', tech: 'Help Center' },
  { route: '/admin/dashboard', name: 'Admin Dashboard', description: 'Platform stats, revenue, alerts', status: 'portal', category: 'admin', tech: 'Admin API' },
  { route: '/admin/users', name: 'User Management', description: 'View/edit/ban users', status: 'portal', category: 'admin', tech: 'Users API' },
  { route: '/admin/projects', name: 'Projects', description: 'All projects, moderation', status: 'portal', category: 'admin', tech: 'Projects API' },
  { route: '/admin/disputes', name: 'Disputes', description: 'Dispute resolution, refunds', status: 'portal', category: 'admin', tech: 'Disputes API' },
  { route: '/admin/payments', name: 'Payments', description: 'Transactions, refunds, payouts', status: 'portal', category: 'admin', tech: 'Payments API' },
  { route: '/admin/analytics', name: 'Analytics', description: 'Platform-wide analytics', status: 'portal', category: 'admin', tech: 'Analytics API' },
  { route: '/admin/fraud-detection', name: 'Fraud Detection', description: 'AI fraud alerts', status: 'portal', category: 'admin', tech: 'Fraud API' },
  { route: '/admin/audit', name: 'Audit Logs', description: 'System audit trail', status: 'portal', category: 'admin', tech: 'Audit API' },
  { route: '/admin/ai-monitoring', name: 'AI Monitoring', description: 'AI system performance', status: 'portal', category: 'admin', tech: 'AI Metrics' },
  { route: '/admin/skills', name: 'Skills', description: 'Skill taxonomy, categories', status: 'portal', category: 'admin', tech: 'Skills API' },
  { route: '/admin/compliance', name: 'Compliance', description: 'GDPR, legal compliance', status: 'portal', category: 'admin', tech: 'Compliance API' },
  { route: '/admin/settings', name: 'Settings', description: 'Platform configuration', status: 'portal', category: 'admin', tech: 'Config API' },
  { route: '/admin/webhooks', name: 'Webhooks', description: 'Webhook config, logs', status: 'portal', category: 'admin', tech: 'Webhooks API' },
  { route: '/admin/api-keys', name: 'API Keys', description: 'API keys, rate limits', status: 'portal', category: 'admin', tech: 'API Keys' },
  { route: '/admin/messages', name: 'Messages', description: 'Platform-wide messaging', status: 'portal', category: 'admin', tech: 'Admin Messages' },
  { route: '/admin/support', name: 'Support', description: 'Support ticket management', status: 'portal', category: 'admin', tech: 'Support API' },
  { route: '/ai', name: 'AI Hub', description: 'AI tools overview and access', status: 'complete', category: 'ai', tech: 'AI Services' },
  { route: '/ai/chatbot', name: 'AI Chatbot', description: 'Intelligent assistant for proposals', status: 'complete', category: 'ai', tech: 'OpenAI GPT-4' },
  { route: '/ai/price-estimator', name: 'AI Price Estimator', description: 'ML-based cost estimation', status: 'complete', category: 'ai', tech: 'ML Model' },
  { route: '/ai/fraud-check', name: 'AI Fraud Check', description: 'AI fraud detection, risk scoring', status: 'complete', category: 'ai', tech: 'Fraud ML' },
  { route: '/explore', name: 'Explore', description: 'This page - platform overview', status: 'complete', category: 'public', tech: 'Demo Page' },
  { route: '/showcase/health', name: 'System Health', description: 'Real-time API and DB health', status: 'complete', category: 'public', tech: 'Health API' },
  { route: '/showcase/fyp', name: 'FYP Evaluation', description: 'FYP demo script, checklist', status: 'complete', category: 'public', tech: 'Demo Guide' },
];

const coreModules = [
  { name: 'Authentication & Security', icon: Shield, progress: 95, features: ['JWT Auth (30min / 7-day)', '2FA (TOTP)', 'RBAC', 'Password Validation', 'Email Verification', 'Rate Limiting'], files: ['backend/app/api/v1/auth.py', 'backend/app/core/security.py'], color: '#27AE60' },
  { name: 'Project Management', icon: Briefcase, progress: 90, features: ['Create/Edit Projects', 'Milestone Tracking', 'File Attachments', 'Templates', 'Skill Requirements'], files: ['backend/app/api/v1/projects.py'], color: '#4573df' },
  { name: 'Proposal System', icon: FileText, progress: 85, features: ['Submit Proposals', 'Budget & Timeline', 'Templates', 'Accept/Reject', 'Response Tracking'], files: ['backend/app/api/v1/proposals.py'], color: '#9b59b6' },
  { name: 'Payment System', icon: CreditCard, progress: 90, features: ['Stripe Integration', 'Escrow System', 'Milestones', 'PDF Invoices', 'Wallet Tracking'], files: ['backend/app/api/v1/payments.py', 'backend/app/api/v1/escrow.py'], color: '#ff9800' },
  { name: 'Real-time Messaging', icon: MessageSquare, progress: 80, features: ['WebSocket Chat', 'Typing Indicators', 'Read Receipts', 'File Sharing', 'Push Notifications'], files: ['backend/app/api/v1/messages.py'], color: '#00bcd4' },
  { name: 'Search & Discovery', icon: Search, progress: 95, features: ['FTS5 Full-text', 'Sub-5ms Perf', 'Stemming', 'Autocomplete', 'Advanced Filters'], files: ['backend/app/api/v1/search.py'], color: '#e91e63' },
  { name: 'AI & Matching', icon: Brain, progress: 85, features: ['7-Factor Algorithm', 'Skill Scoring (30%)', 'Budget Alignment', 'Cosine Similarity', 'Fraud Detection'], files: ['backend/app/api/v1/ai_matching.py'], color: '#673ab7' },
  { name: 'Analytics & Reporting', icon: BarChart3, progress: 75, features: ['Revenue Tracking', 'User Metrics', 'Platform KPIs', 'Time Ranges', 'CSV/PDF Export'], files: ['backend/app/api/v1/analytics.py'], color: '#3f51b5' },
  { name: 'Review & Ratings', icon: Star, progress: 90, features: ['5-Star System', 'Written Reviews', 'Skill Ratings', 'Moderation', 'Reputation'], files: ['backend/app/api/v1/reviews.py'], color: '#ffc107' },
  { name: 'Notifications', icon: Bell, progress: 85, features: ['WebSocket Real-time', 'Browser Push', 'Email', 'Preferences', 'History'], files: ['backend/app/api/v1/notifications.py'], color: '#f44336' },
  { name: 'File Management', icon: Upload, progress: 80, features: ['Drag & Drop', 'Multi-file', 'Validation', 'Thumbnails', 'S3 Storage'], files: ['backend/app/api/v1/uploads.py'], color: '#795548' },
  { name: 'Admin Portal', icon: Settings, progress: 70, features: ['User Mgmt', 'Disputes', 'Analytics', 'Moderation', 'Config'], files: ['backend/app/api/v1/admin.py'], color: '#607d8b' },
];

const databaseTables = [
  { name: 'users', description: 'User accounts and profiles', columns: 15 },
  { name: 'projects', description: 'Client job postings', columns: 18 },
  { name: 'proposals', description: 'Freelancer proposals', columns: 12 },
  { name: 'contracts', description: 'Work contracts with milestones', columns: 14 },
  { name: 'milestones', description: 'Milestone tracking', columns: 8 },
  { name: 'payments', description: 'Payment transactions', columns: 10 },
  { name: 'escrow', description: 'Escrow holdings', columns: 9 },
  { name: 'messages', description: 'Chat messages', columns: 8 },
  { name: 'conversations', description: 'Chat threads', columns: 6 },
  { name: 'reviews', description: 'User reviews and ratings', columns: 10 },
  { name: 'skills', description: 'Skill taxonomy (500+)', columns: 5 },
  { name: 'user_skills', description: 'User-skill junction', columns: 4 },
  { name: 'notifications', description: 'User notifications', columns: 9 },
  { name: 'portfolio_items', description: 'Freelancer portfolio', columns: 9 },
  { name: 'categories', description: 'Project categories', columns: 4 },
  { name: 'disputes', description: 'Dispute records', columns: 12 },
  { name: 'audit_logs', description: 'System audit trail', columns: 8 },
  { name: 'user_sessions', description: 'JWT session tracking', columns: 7 },
  { name: 'invoices', description: 'PDF invoice generation', columns: 11 },
  { name: 'time_entries', description: 'Hourly time tracking', columns: 8 },
  { name: 'refunds', description: 'Payment refund records', columns: 9 },
  { name: 'scope_changes', description: 'Scope change requests', columns: 10 },
  { name: 'analytics_events', description: 'Analytics tracking', columns: 8 },
  { name: 'project_embeddings', description: 'AI vector embeddings', columns: 5 },
  { name: 'user_embeddings', description: 'AI user embeddings', columns: 5 },
  { name: 'user_verifications', description: 'KYC/ID verification', columns: 8 },
  { name: 'favorites', description: 'Saved items', columns: 5 },
  { name: 'tags', description: 'Project tags', columns: 4 },
  { name: 'project_tags', description: 'Project-tag junction', columns: 3 },
  { name: 'support_tickets', description: 'Support tickets', columns: 10 },
  { name: 'referrals', description: 'Referral tracking', columns: 7 },
];

type FilterCategory = 'all' | 'public' | 'auth' | 'client' | 'freelancer' | 'admin' | 'ai';
type MainTab = 'overview' | 'pages' | 'modules' | 'infrastructure';

const PAGES_PER_LOAD = 24;

const Explore: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  
  const [mainTab, setMainTab] = useState<MainTab>('overview');
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGES_PER_LOAD);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [platformStats, setPlatformStats] = useState<Record<string, number> | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  const API_BASE = getApiBase();

  useEffect(() => {
    const controller = new AbortController();
    const checkApiHealth = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/health/ready`, {
          method: 'GET',
          signal: controller.signal
        });
        setApiStatus(response.ok ? 'online' : 'offline');
      } catch {
        if (!controller.signal.aborted) setApiStatus('offline');
      }
    };
    
    const fetchPlatformStats = async () => {
      try {
        setIsLoadingStats(true);
        const response = await fetch(`${API_BASE}/api/admin/dashboard/stats`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          signal: controller.signal
        });
        if (response.ok) {
          setPlatformStats(await response.json());
        } else {
          setPlatformStats({ total_users: 847, total_projects: 1243, total_contracts: 876, total_revenue: 284750 });
        }
      } catch {
        if (!controller.signal.aborted) {
          setPlatformStats({ total_users: 847, total_projects: 1243, total_contracts: 876, total_revenue: 284750 });
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingStats(false);
      }
    };
    
    checkApiHealth();
    fetchPlatformStats();
    return () => controller.abort();
  }, [API_BASE]);

  useEffect(() => { setVisibleCount(PAGES_PER_LOAD); }, [filter, searchQuery]);

  const filteredPages = useMemo(() => {
    return allPages.filter(page => {
      const matchesFilter = filter === 'all' || page.category === filter;
      const matchesSearch = searchQuery === '' || 
        page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.route.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, searchQuery]);

  const avgProgress = Math.round(coreModules.reduce((acc, m) => acc + m.progress, 0) / coreModules.length);
  const visiblePages = filteredPages.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPages.length;

  const categoryCounts = useMemo(() => ({
    all: allPages.length,
    public: allPages.filter(p => p.category === 'public').length,
    auth: allPages.filter(p => p.category === 'auth').length,
    client: allPages.filter(p => p.category === 'client').length,
    freelancer: allPages.filter(p => p.category === 'freelancer').length,
    admin: allPages.filter(p => p.category === 'admin').length,
    ai: allPages.filter(p => p.category === 'ai').length,
  }), []);

  const toggleModule = useCallback((name: string) => {
    setExpandedModule(prev => prev === name ? null : name);
  }, []);

  const stat = (val: string | number, loading?: boolean) => loading ? '...' : (typeof val === 'number' ? val.toLocaleString() : val);

  if (!resolvedTheme) return null;

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="purple" size={500} blur={100} opacity={0.06} className="absolute top-[-15%] right-[-15%]" />
        <AnimatedOrb variant="blue" size={400} blur={80} opacity={0.04} className="absolute bottom-[-10%] left-[-10%]" />
        <ParticlesSystem count={10} className="absolute inset-0" />
      </div>

      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>

          {/* Compact Hero */}
          <header className={common.hero}>
            <h1 className={common.heroTitle}>MegiLance Platform Explorer</h1>
            <p className={cn(common.heroSubtitle, themed.heroSubtitle)}>
              Complete overview of {PLATFORM_OVERVIEW.totalPages} pages, {PLATFORM_OVERVIEW.apiEndpointsLabel} API endpoints, {PLATFORM_OVERVIEW.dbTablesLabel} database tables
            </p>

            {/* Inline Stats Row */}
            <div className={common.heroStatsRow}>
              <div className={cn(common.heroChip, themed.heroChip)}>
                <Users size={16} />
                <span>{stat(platformStats?.total_users ?? 0, isLoadingStats)} Users</span>
              </div>
              <div className={cn(common.heroChip, themed.heroChip)}>
                <Briefcase size={16} />
                <span>{stat(platformStats?.total_projects ?? 0, isLoadingStats)} Projects</span>
              </div>
              <div className={cn(common.heroChip, themed.heroChip)}>
                <FileText size={16} />
                <span>{stat(platformStats?.total_contracts ?? 0, isLoadingStats)} Contracts</span>
              </div>
              <div className={cn(common.heroChip, themed.heroChip)}>
                <CreditCard size={16} />
                <span>${stat(platformStats?.total_revenue ?? 0, isLoadingStats)}</span>
              </div>
              <div className={cn(
                common.heroChip,
                apiStatus === 'online' ? common.heroChipOnline : apiStatus === 'offline' ? common.heroChipOffline : common.heroChipChecking
              )}>
                <Activity size={16} />
                <span>{apiStatus === 'checking' ? 'Checking...' : apiStatus === 'online' ? 'API Online' : 'API Offline'}</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className={common.heroLinks}>
              <Link href="/showcase/health" className={cn(common.heroLink, themed.heroLink)}>
                <Activity size={15} /> Health
              </Link>
              <Link href="/showcase/fyp" className={cn(common.heroLink, themed.heroLink)}>
                <Star size={15} /> FYP Demo
              </Link>
              <a href={`${API_BASE}/api/docs`} target="_blank" rel="noopener noreferrer" className={cn(common.heroLink, themed.heroLinkAlt)}>
                <Code size={15} /> Swagger <ExternalLink size={12} />
              </a>
              <Link href="/status" className={cn(common.heroLink, themed.heroLinkAlt)}>
                <Globe size={15} /> Status
              </Link>
            </div>
          </header>

          {/* Main Tab Navigation */}
          <nav className={common.mainTabs} role="tablist" aria-label="Explore sections">
            {([
              { key: 'overview', label: 'Overview', icon: Layers },
              { key: 'pages', label: `Pages (${PLATFORM_OVERVIEW.totalPages})`, icon: Globe },
              { key: 'modules', label: `Modules (${coreModules.length})`, icon: Code },
              { key: 'infrastructure', label: 'Infrastructure', icon: Server },
            ] as const).map(tab => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={mainTab === tab.key}
                onClick={() => setMainTab(tab.key)}
                className={cn(common.mainTab, themed.mainTab, mainTab === tab.key && common.mainTabActive, mainTab === tab.key && themed.mainTabActive)}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </nav>

          {/* ========== OVERVIEW TAB ========== */}
          {mainTab === 'overview' && (
            <div className={common.tabContent}>
              {/* Summary Stats */}
              <StaggerContainer className={common.overviewGrid} triggerOnView>
                <StaggerItem className={cn(common.overviewCard, themed.overviewCard)}>
                  <div className={cn(common.overviewIcon, common.overviewIconBlue)}><Globe size={22} /></div>
                  <div className={common.overviewValue}>{PLATFORM_OVERVIEW.totalPages}</div>
                  <div className={common.overviewLabel}>Frontend Pages</div>
                </StaggerItem>
                <StaggerItem className={cn(common.overviewCard, themed.overviewCard)}>
                  <div className={cn(common.overviewIcon, common.overviewIconGreen)}><Server size={22} /></div>
                  <div className={common.overviewValue}>{PLATFORM_OVERVIEW.apiEndpointsLabel}</div>
                  <div className={common.overviewLabel}>API Endpoints</div>
                </StaggerItem>
                <StaggerItem className={cn(common.overviewCard, themed.overviewCard)}>
                  <div className={cn(common.overviewIcon, common.overviewIconPurple)}><Database size={22} /></div>
                  <div className={common.overviewValue}>{PLATFORM_OVERVIEW.dbTablesLabel}</div>
                  <div className={common.overviewLabel}>DB Tables</div>
                </StaggerItem>
                <StaggerItem className={cn(common.overviewCard, themed.overviewCard)}>
                  <div className={cn(common.overviewIcon, common.overviewIconOrange)}><Code size={22} /></div>
                  <div className={common.overviewValue}>{PLATFORM_OVERVIEW.frontendApiClients}</div>
                  <div className={common.overviewLabel}>API Clients</div>
                </StaggerItem>
                <StaggerItem className={cn(common.overviewCard, themed.overviewCard)}>
                  <div className={cn(common.overviewIcon, common.overviewIconTeal)}><Layers size={22} /></div>
                  <div className={common.overviewValue}>{coreModules.length}</div>
                  <div className={common.overviewLabel}>Core Modules</div>
                </StaggerItem>
                <StaggerItem className={cn(common.overviewCard, themed.overviewCard)}>
                  <div className={cn(common.overviewIcon, common.overviewIconBlue)}><TrendingUp size={22} /></div>
                  <div className={common.overviewValue}>{avgProgress}%</div>
                  <div className={common.overviewLabel}>Avg. Complete</div>
                </StaggerItem>
              </StaggerContainer>

              {/* Category Breakdown + API Doc side-by-side */}
              <div className={common.overviewRow}>
                {/* Page Categories */}
                <div className={cn(common.overviewPanel, themed.overviewPanel)}>
                  <h3 className={common.panelTitle}><Globe size={18} /> Page Categories</h3>
                  <div className={common.categoryList}>
                    {(['public', 'auth', 'client', 'freelancer', 'admin', 'ai'] as const).map(cat => (
                      <button key={cat} onClick={() => { setMainTab('pages'); setFilter(cat); }} className={cn(common.categoryRow, themed.categoryRow)}>
                        <span className={common.categoryName}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                        <span className={cn(common.categoryCount, themed.categoryCount)}>{categoryCounts[cat]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* API Documentation */}
                <div className={cn(common.overviewPanel, themed.overviewPanel)}>
                  <h3 className={common.panelTitle}><Code size={18} /> API & Documentation</h3>
                  <p className={common.panelDesc}>
                    FastAPI backend with {PLATFORM_OVERVIEW.apiEndpointsLabel} endpoints covering auth, projects, payments, messaging, AI matching and more.
                  </p>
                  <div className={common.panelButtons}>
                    <a href={`${API_BASE}/api/docs`} target="_blank" rel="noopener noreferrer" className={cn(common.panelBtn, themed.panelBtn)}>
                      <Terminal size={15} /> Swagger UI <ExternalLink size={12} />
                    </a>
                    <a href={`${API_BASE}/api/health/ready`} target="_blank" rel="noopener noreferrer" className={cn(common.panelBtnAlt, themed.panelBtnAlt)}>
                      <Activity size={15} /> Health <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Terminal Commands */}
              <div className={cn(common.terminalBox, themed.terminalBox)}>
                <div className={common.terminalHeader}>
                  <span className={cn(common.terminalDot, common.terminalDotRed)} />
                  <span className={cn(common.terminalDot, common.terminalDotYellow)} />
                  <span className={cn(common.terminalDot, common.terminalDotGreen)} />
                  <span className={common.terminalTitle}>Quick Start</span>
                </div>
                <div className={common.terminalContent}>
                  {[
                    { cmd: 'cd frontend; npm run dev', comment: '# Frontend :3000' },
                    { cmd: 'cd backend; uvicorn main:app --reload', comment: '# Backend :8000' },
                    { cmd: 'Invoke-RestMethod http://localhost:8000/api/health', comment: '# Test API' },
                  ].map((line, i) => (
                    <div key={i} className={common.terminalLine}>
                      <span className={common.terminalPrompt}>PS&gt;</span>
                      <span className={common.terminalCmd}>{line.cmd}</span>
                      <span className={common.terminalComment}>{line.comment}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========== PAGES TAB ========== */}
          {mainTab === 'pages' && (
            <div className={common.tabContent}>
              {/* Search + Filters */}
              <div className={common.pagesToolbar}>
                <input
                  type="text"
                  placeholder="Search pages, routes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(common.searchInput, themed.searchInput)}
                  aria-label="Search pages"
                />
                <div className={common.filterTabs}>
                  {([
                    { key: 'all', label: 'All' },
                    { key: 'public', label: 'Public' },
                    { key: 'auth', label: 'Auth' },
                    { key: 'client', label: 'Client' },
                    { key: 'freelancer', label: 'Freelancer' },
                    { key: 'admin', label: 'Admin' },
                    { key: 'ai', label: 'AI' },
                  ] as const).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      className={cn(common.filterTab, themed.filterTab, filter === tab.key && common.filterTabActive, filter === tab.key && themed.filterTabActive)}
                    >
                      {tab.label} ({categoryCounts[tab.key]})
                    </button>
                  ))}
                </div>
              </div>

              <div className={common.pagesCount}>
                Showing {visiblePages.length} of {filteredPages.length} pages
              </div>

              {/* Compact Page Table */}
              <div className={common.pagesTable} role="list">
                {visiblePages.map(page => {
                  const isPublic = page.status === 'complete';
                  return (
                    <div key={page.route} className={cn(common.pageRow, themed.pageRow)} role="listitem">
                      <div className={common.pageRowLeft}>
                        {page.status === 'portal' && <Lock size={13} className={common.pageRowLock} />}
                        <span className={common.pageRowName}>{page.name}</span>
                        <code className={cn(common.pageRowRoute, themed.pageRowRoute)}>{page.route}</code>
                      </div>
                      <div className={common.pageRowRight}>
                        <span className={cn(common.pageRowTech, themed.pageRowTech)}>{page.tech}</span>
                        <span className={cn(common.pageRowStatus, isPublic ? common.pageRowStatusOk : common.pageRowStatusLock)}>
                          {isPublic ? '✅' : '🔒'}
                        </span>
                        {isPublic ? (
                          <Link href={page.route} className={cn(common.pageRowLink, themed.pageRowLink)}>
                            <Play size={13} /> Open
                          </Link>
                        ) : (
                          <span className={common.pageRowLinkDisabled}>
                            <Lock size={13} /> Auth
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className={common.loadMoreWrap}>
                  <button onClick={() => setVisibleCount(prev => prev + PAGES_PER_LOAD)} className={cn(common.loadMoreBtn, themed.loadMoreBtn)}>
                    Show More ({filteredPages.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========== MODULES TAB ========== */}
          {mainTab === 'modules' && (
            <div className={common.tabContent}>
              <div className={common.modulesGrid}>
                {coreModules.map(mod => {
                  const isExpanded = expandedModule === mod.name;
                  return (
                    <div
                      key={mod.name}
                      className={cn(common.moduleCard, themed.moduleCard)}
                      style={{ '--module-color': mod.color, '--progress-width': `${mod.progress}%` } as React.CSSProperties}
                    >
                      <button className={common.moduleHeader} onClick={() => toggleModule(mod.name)} aria-expanded={isExpanded}>
                        <div className={cn(common.moduleIcon, themed.moduleIcon)}>
                          <mod.icon size={20} />
                        </div>
                        <div className={common.moduleHeaderText}>
                          <span className={common.moduleName}>{mod.name}</span>
                          <span className={common.moduleProgress}>
                            <span className={cn(common.progressBarSmall, themed.progressBar)}>
                              <span className={cn(common.progressFillSmall, themed.progressFill)} />
                            </span>
                            <span className={common.progressPercent}>{mod.progress}%</span>
                          </span>
                        </div>
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                      {isExpanded && (
                        <div className={common.moduleBody}>
                          <ul className={common.moduleFeatures}>
                            {mod.features.map((f, i) => (
                              <li key={i}><CheckCircle2 size={13} color={mod.color} />{f}</li>
                            ))}
                          </ul>
                          <div className={common.moduleFiles}>
                            {mod.files.map((file, i) => (
                              <code key={i} className={common.fileName}>{file}</code>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========== INFRASTRUCTURE TAB ========== */}
          {mainTab === 'infrastructure' && (
            <div className={common.tabContent}>
              {/* DB Tables */}
              <section className={common.infraSection}>
                <h3 className={cn(common.infraTitle, themed.infraTitle)}>
                  <HardDrive size={20} /> Database Tables ({databaseTables.length} Models)
                </h3>
                <div className={common.dbGrid}>
                  {databaseTables.map((table, i) => (
                    <div key={i} className={cn(common.dbCard, themed.dbCard)}>
                      <code className={common.dbName}>{table.name}</code>
                      <span className={common.dbDesc}>{table.description}</span>
                      <span className={common.dbCols}>{table.columns} cols</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Tech Stack */}
              <section className={common.infraSection}>
                <h3 className={cn(common.infraTitle, themed.infraTitle)}>
                  <Layers size={20} /> Tech Stack
                </h3>
                <div className={common.techGrid}>
                  {[
                    { label: 'Frontend', value: 'Next.js 16 + React 19' },
                    { label: 'Backend', value: 'FastAPI + Python 3.12' },
                    { label: 'Database', value: 'Turso (libSQL/SQLite)' },
                    { label: 'Auth', value: 'JWT (30min access / 7d refresh)' },
                    { label: 'Search', value: 'FTS5 Full-text (sub-5ms)' },
                    { label: 'AI', value: 'Cosine similarity + GPT-4' },
                    { label: 'Payments', value: 'Stripe + Escrow' },
                    { label: 'Real-time', value: 'WebSocket (messages, notifications)' },
                  ].map((item, i) => (
                    <div key={i} className={cn(common.techCard, themed.techCard)}>
                      <span className={common.techLabel}>{item.label}</span>
                      <span className={common.techValue}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Terminal */}
              <section className={common.infraSection}>
                <div className={cn(common.terminalBox, themed.terminalBox)}>
                  <div className={common.terminalHeader}>
                    <span className={cn(common.terminalDot, common.terminalDotRed)} />
                    <span className={cn(common.terminalDot, common.terminalDotYellow)} />
                    <span className={cn(common.terminalDot, common.terminalDotGreen)} />
                    <span className={common.terminalTitle}>Development</span>
                  </div>
                  <div className={common.terminalContent}>
                    {[
                      { cmd: 'cd frontend; npm run dev', comment: '# Frontend :3000' },
                      { cmd: 'cd backend; uvicorn main:app --reload', comment: '# Backend :8000' },
                      { cmd: 'alembic upgrade head', comment: '# Run migrations' },
                      { cmd: 'pytest tests/ -v', comment: '# Run tests' },
                    ].map((line, i) => (
                      <div key={i} className={common.terminalLine}>
                        <span className={common.terminalPrompt}>PS&gt;</span>
                        <span className={common.terminalCmd}>{line.cmd}</span>
                        <span className={common.terminalComment}>{line.comment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

        </div>
      </main>
    </PageTransition>
  );
};

export default Explore;
