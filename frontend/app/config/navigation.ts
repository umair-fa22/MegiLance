// @AI-HINT: Centralized navigation configuration for MegiLance application. Contains all navigation items for different user types and sections.
// Icons are referenced by string identifiers to avoid Next.js 15 server component issues.

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  description?: string;
  badge?: string | number;
  submenu?: NavItem[];
  status?: string;
  section?: string; // Optional section header to display above this item
}

export interface ProfileMenuItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon: string; // String identifier for icon
}

// Main public navigation (for home page, marketing pages)
export const publicNavItems: NavItem[] = [
  { label: 'Home', href: '/', icon: 'FaHome' },
  { label: 'How It Works', href: '/how-it-works', icon: 'FaInfoCircle' },
  { label: 'Explore', href: '/explore', icon: 'FaSearch' },
  { label: 'Pricing', href: '/pricing', icon: 'FaMoneyBillWave' },
];

// Footer navigation links
export const footerNavItems = {
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Blog', href: '/blog' },
  ],
  services: [
    { label: 'For Freelancers', href: '/freelancers' },
    { label: 'For Clients', href: '/clients' },
    { label: 'Pricing', href: '/pricing' },
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};

// Dashboard navigation (general authenticated users) - REMOVED
// All users should use role-specific navigation (freelancer, client, or admin)
export const dashboardNavItems: NavItem[] = [];

// Freelancer-specific navigation — streamlined to essential items only
export const freelancerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/freelancer/dashboard', icon: 'LayoutDashboard', section: 'Overview' },
  { label: 'Find Work', href: '/freelancer/jobs', icon: 'Search' },
  { label: 'My Projects', href: '/freelancer/projects', icon: 'Briefcase', section: 'Work' },
  { label: 'Proposals', href: '/freelancer/proposals', icon: 'FileText' },
  { label: 'Contracts', href: '/freelancer/contracts', icon: 'FolderGit2' },
  { label: 'Messages', href: '/freelancer/messages', icon: 'MessageSquare', section: 'Communication' },
  { label: 'Notifications', href: '/freelancer/notifications', icon: 'Bell' },
  { label: 'Earnings', href: '/freelancer/earnings', icon: 'Wallet', section: 'Finance' },
  { label: 'Profile', href: '/freelancer/profile', icon: 'User', section: 'Account' },
  { label: 'Reviews', href: '/freelancer/reviews', icon: 'Star' },
  { label: 'Settings', href: '/freelancer/settings', icon: 'Settings' },
];

// Client-specific navigation — streamlined to essential items only
export const clientNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/client/dashboard', icon: 'LayoutDashboard', section: 'Overview' },
  { label: 'Post a Project', href: '/client/post-job', icon: 'TrendingUp' },
  { label: 'My Projects', href: '/client/projects', icon: 'Briefcase', section: 'Projects' },
  { label: 'Contracts', href: '/client/contracts', icon: 'FileText' },
  { label: 'Messages', href: '/client/messages', icon: 'MessageSquare', section: 'Communication' },
  { label: 'Notifications', href: '/client/notifications', icon: 'Bell' },
  { label: 'Payments', href: '/client/payments', icon: 'CreditCard', section: 'Finance' },
  { label: 'Find Talent', href: '/client/search', icon: 'Search', section: 'Hiring' },
  { label: 'Profile', href: '/client/profile', icon: 'User', section: 'Account' },
  { label: 'Reviews', href: '/client/reviews', icon: 'Star' },
  { label: 'Settings', href: '/client/settings', icon: 'Settings' },
];

// Admin navigation — streamlined to essential management items
export const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard', section: 'Overview' },
  { label: 'Analytics', href: '/admin/analytics', icon: 'LineChart' },
  { label: 'Users', href: '/admin/users', icon: 'Users', section: 'Management' },
  { label: 'Projects', href: '/admin/projects', icon: 'Briefcase' },
  { label: 'Messages', href: '/admin/messages', icon: 'MessageSquare' },
  { label: 'Disputes', href: '/admin/disputes', icon: 'Gavel' },
  { label: 'Payments', href: '/admin/payments', icon: 'CreditCard', section: 'Financial' },
  { label: 'Content Moderation', href: '/admin/moderation', icon: 'ShieldAlert', section: 'Security' },
  { label: 'Audit Logs', href: '/admin/audit', icon: 'FileText' },
  { label: 'System Health', href: '/admin/health', icon: 'Activity', section: 'System' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
];

// AI Tools navigation
export const aiToolsNavItems: NavItem[] = [
  { label: 'Chatbot', href: '/ai/chatbot', icon: 'Bot' },
  { label: 'Price Estimator', href: '/ai/price-estimator', icon: 'CreditCard' },
  { label: 'Fraud Check', href: '/ai/fraud-check', icon: 'ShieldAlert' },
];

// Profile menu items (common across all user types)
export const profileMenuItems: ProfileMenuItem[] = [
  { label: 'My Profile', href: '/profile', icon: 'FaUser' },
  { label: 'Settings', href: '/settings', icon: 'FaCogs' },
  { label: 'Notifications', href: '/notifications', icon: 'FaBell' },
  { label: 'Logout', onClick: () => {
    if (typeof window !== 'undefined') {
      // Clear all auth data and redirect
      window.localStorage.removeItem('auth_token');
      window.localStorage.removeItem('refresh_token');
      window.localStorage.removeItem('user');
      window.localStorage.removeItem('portal_area');
      window.location.href = '/login';
    }
  }, icon: 'FaSignOutAlt' },
];

// Quick access links for different user types
export const quickAccessLinks = {
  freelancer: [
    { label: 'Find Jobs', href: '/jobs' },
    { label: 'My Proposals', href: '/freelancer/my-jobs' },
    { label: 'Earnings', href: '/freelancer/wallet' },
    { label: 'Messages', href: '/freelancer/messages' },
  ],
  client: [
    { label: 'Post a Job', href: '/client/post-job' },
    { label: 'Find Freelancers', href: '/freelancers' },
    { label: 'My Projects', href: '/client/projects' },
    { label: 'Messages', href: '/client/messages' },
  ],
  admin: [
    { label: 'User Management', href: '/admin/users' },
    { label: 'System Health', href: '/admin/ai-monitoring' },
    { label: 'Support Queue', href: '/admin/support' },
    { label: 'Audit Logs', href: '/admin/audit' },
  ],
};

// Utility function to get navigation items based on user type
export const getNavigationForUserType = (userType: 'freelancer' | 'client' | 'admin' | 'public' = 'public'): NavItem[] => {
  switch (userType) {
    case 'freelancer':
      return freelancerNavItems;
    case 'client':
      return clientNavItems;
    case 'admin':
      return adminNavItems;
    case 'public':
    default:
      return publicNavItems;
  }
};

// Breadcrumb configuration
export const breadcrumbConfig: Record<string, string[]> = {
  '/projects': ['Projects'],

  // ── Freelancer breadcrumbs ──────────────────────────────────
  '/freelancer/dashboard': ['Freelancer', 'Dashboard'],
  '/freelancer/activity': ['Freelancer', 'Activity'],
  '/freelancer/projects': ['Freelancer', 'Projects'],
  '/freelancer/my-jobs': ['Freelancer', 'My Jobs'],
  '/freelancer/jobs': ['Freelancer', 'Browse Jobs'],
  '/freelancer/gigs': ['Freelancer', 'Gigs'],
  '/freelancer/proposals': ['Freelancer', 'Proposals'],
  '/freelancer/submit-proposal': ['Freelancer', 'Submit Proposal'],
  '/freelancer/contracts': ['Freelancer', 'Contracts'],
  '/freelancer/payments': ['Freelancer', 'Payments'],
  '/freelancer/earnings': ['Freelancer', 'Earnings'],
  '/freelancer/rate-cards': ['Freelancer', 'Rate Cards'],
  '/freelancer/subscription': ['Freelancer', 'Subscription'],
  '/freelancer/messages': ['Freelancer', 'Messages'],
  '/freelancer/notifications': ['Freelancer', 'Notifications'],
  '/freelancer/calendar': ['Freelancer', 'Calendar'],
  '/freelancer/reviews': ['Freelancer', 'Reviews'],
  '/freelancer/portfolio': ['Freelancer', 'Portfolio'],
  '/freelancer/profile': ['Freelancer', 'Profile'],
  '/freelancer/assessments': ['Freelancer', 'Assessments'],
  '/freelancer/career': ['Freelancer', 'Career'],
  '/freelancer/files': ['Freelancer', 'Files'],
  '/freelancer/notes': ['Freelancer', 'Notes'],
  '/freelancer/templates': ['Freelancer', 'Templates'],
  '/freelancer/workflows': ['Freelancer', 'Workflows'],
  '/freelancer/integrations': ['Freelancer', 'Integrations'],
  '/freelancer/legal': ['Freelancer', 'Legal'],
  '/freelancer/verification': ['Freelancer', 'Verification'],
  '/freelancer/video-calls': ['Freelancer', 'Video Calls'],
  '/freelancer/communication': ['Freelancer', 'Communication'],
  '/freelancer/feedback': ['Freelancer', 'Feedback'],
  '/freelancer/disputes': ['Freelancer', 'Disputes'],
  '/freelancer/favorites': ['Freelancer', 'Favorites'],
  '/freelancer/settings': ['Freelancer', 'Settings'],
  '/freelancer/help': ['Freelancer', 'Help'],

  // ── Client breadcrumbs ──────────────────────────────────────
  '/client/dashboard': ['Client', 'Dashboard'],
  '/client/projects': ['Client', 'Projects'],
  '/client/post-job': ['Client', 'Post Job'],
  '/client/contracts': ['Client', 'Contracts'],
  '/client/payments': ['Client', 'Payments'],
  '/client/messages': ['Client', 'Messages'],
  '/client/notifications': ['Client', 'Notifications'],
  '/client/calendar': ['Client', 'Calendar'],
  '/client/reviews': ['Client', 'Reviews'],
  '/client/reports': ['Client', 'Reports'],
  '/client/find-freelancers': ['Client', 'Find Freelancers'],
  '/client/favorites': ['Client', 'Favorites'],
  '/client/disputes': ['Client', 'Disputes'],
  '/client/video-calls': ['Client', 'Video Calls'],
  '/client/profile': ['Client', 'Profile'],
  '/client/settings': ['Client', 'Settings'],
  '/client/help': ['Client', 'Help'],
  '/client/escrow': ['Client', 'Escrow'],
  '/client/wallet': ['Client', 'Wallet'],
  '/client/analytics': ['Client', 'Analytics'],
  '/client/invoices': ['Client', 'Invoices'],
  '/client/hire': ['Client', 'Hire'],
  '/client/search': ['Client', 'Talent Search'],
  '/client/freelancers': ['Client', 'Browse Freelancers'],
  '/client/security': ['Client', 'Security'],

  // ── Admin breadcrumbs ───────────────────────────────────────
  '/admin/dashboard': ['Admin', 'Dashboard'],
  '/admin/analytics': ['Admin', 'Analytics'],
  '/admin/metrics': ['Admin', 'Metrics'],
  '/admin/search-analytics': ['Admin', 'Search Analytics'],
  '/admin/users': ['Admin', 'Users'],
  '/admin/projects': ['Admin', 'Projects'],
  '/admin/messages': ['Admin', 'Messages'],
  '/admin/disputes': ['Admin', 'Disputes'],
  '/admin/categories': ['Admin', 'Categories'],
  '/admin/skills': ['Admin', 'Skills'],
  '/admin/tags': ['Admin', 'Tags'],
  '/admin/blog': ['Admin', 'Blog'],
  '/admin/branding': ['Admin', 'Branding'],
  '/admin/payments': ['Admin', 'Payments'],
  '/admin/refunds': ['Admin', 'Refunds'],
  '/admin/billing': ['Admin', 'Billing'],
  '/admin/moderation': ['Admin', 'Content Moderation'],
  '/admin/fraud-detection': ['Admin', 'Fraud Detection'],
  '/admin/security': ['Admin', 'Security'],
  '/admin/audit': ['Admin', 'Audit Logs'],
  '/admin/compliance': ['Admin', 'Compliance'],
  '/admin/ai-monitoring': ['Admin', 'AI Monitoring'],
  '/admin/health': ['Admin', 'System Health'],
  '/admin/api-keys': ['Admin', 'API Keys'],
  '/admin/webhooks': ['Admin', 'Webhooks'],
  '/admin/calendar': ['Admin', 'Calendar'],
  '/admin/export': ['Admin', 'Data Export'],
  '/admin/feedback': ['Admin', 'Feedback'],
  '/admin/video-calls': ['Admin', 'Video Calls'],
  '/admin/support': ['Admin', 'Support'],
  '/admin/help': ['Admin', 'Help'],
  '/admin/reports': ['Admin', 'Reports'],
  '/admin/email-templates': ['Admin', 'Email Templates'],
  '/admin/feature-flags': ['Admin', 'Feature Flags'],
  '/admin/integrations': ['Admin', 'Integrations'],
  '/admin/profile': ['Admin', 'Profile'],
  '/admin/settings': ['Admin', 'Settings'],

  // ── Shared / fallback ───────────────────────────────────────
  '/Settings': ['Dashboard', 'Settings'],
  '/Profile': ['Dashboard', 'Profile'],
};
