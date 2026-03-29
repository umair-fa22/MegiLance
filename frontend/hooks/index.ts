// @AI-HINT: Central exports for all custom hooks
// Import hooks from this file for cleaner imports

export { useAuth, hasValidAuthToken, type User } from './useAuth';
export { useProjects, type Project, type CreateProjectData, type ProjectFilters } from './useProjects';
export { useProposals, type Proposal, type CreateProposalData } from './useProposals';
export { useClientData, type ClientProject, type ClientPayment, type ClientFreelancer, type ClientReview } from './useClient';
export { useFreelancerData, type FreelancerProject, type FreelancerJob, type FreelancerTransaction, type FreelancerAnalytics } from './useFreelancer';
export { useDashboardData } from './useDashboardData';
export { useAdminData as useAdmin } from './useAdmin';
export { useUser } from './useUser';
export { useWebSocket, type ConnectionState } from './useWebSocket';
export { useNotifications } from './useNotifications';
export { useOnlineStatus } from './useOnlineStatus';
export { useTypingIndicator } from './useTypingIndicator';
export { default as useAnimatedCounter } from './useAnimatedCounter';
