// @AI-HINT: Barrel file — re-exports all API modules and provides backward-compatible default export

// Core utilities
export { apiFetch, APIError, getAuthToken, setAuthToken, clearAuthData, getRefreshToken, setRefreshToken, invalidateCache, isOnline } from './core';
export type { ResourceId } from './core';

// Auth
export { authApi, socialAuthApi, twoFactorApi } from './auth';

// Projects & contracts
export { projectsApi, contractsApi, proposalsApi, milestonesApi } from './projects';

// Payments
export { paymentsApi, paymentMethodsApi, walletApi, invoicesApi, escrowApi, refundsApi, payoutMethodsApi, multiCurrencyApi } from './payments';

// Messaging & realtime
export { messagesApi, notificationsApi, communicationApi, realtimeApi } from './messaging';

// Search & discovery
export { searchApi, categoriesApi, tagsApi, favoritesApi, searchesApi, searchAnalyticsApi } from './search';

// Users & profiles
export { usersApi, portalApi, verificationApi, portfolioApi, portfolioShowcaseApi, skillsApi, publicProfileApi } from './users';

// Admin & analytics
export { adminApi, analyticsApi, metricsApi, auditTrailApi, complianceApi, featureFlagsApi } from './admin';

// Marketplace
export { gigsApi, jobAlertsApi, clientApi, supportTicketsApi, matchingApi, disputesApi, reviewsApi, reviewResponsesApi } from './marketplace';

// Features
export { referralApi, careerApi, availabilityApi, rateCardsApi, proposalTemplatesApi, gamificationApi, timeEntriesApi } from './features';

// Integrations
export { webhooksApi, apiKeysApi, teamsApi, workflowApi, brandingApi, emailTemplatesApi, integrationsApi } from './integrations';

// AI
export { aiApi, aiWritingApi, fraudDetectionApi } from './ai';

// Content & misc
export { knowledgeBaseApi, legalDocsApi, videoCallsApi, activityFeedApi, uploadsApi, externalProjectsApi, userFeedbackApi } from './content';

// Workroom & data export
export { workroomApi } from './workroom';
export { dataExportApi } from './dataExport';

// --- Backward-compatible default export ---
import { authApi, socialAuthApi, twoFactorApi } from './auth';
import { projectsApi, contractsApi, proposalsApi, milestonesApi } from './projects';
import { paymentsApi, paymentMethodsApi, walletApi, invoicesApi, escrowApi, refundsApi, payoutMethodsApi, multiCurrencyApi } from './payments';
import { messagesApi, notificationsApi, communicationApi, realtimeApi } from './messaging';
import { searchApi, categoriesApi, tagsApi, favoritesApi, searchesApi, searchAnalyticsApi } from './search';
import { usersApi, portalApi, verificationApi, portfolioApi, portfolioShowcaseApi, skillsApi, publicProfileApi } from './users';
import { adminApi, analyticsApi, metricsApi, auditTrailApi, complianceApi, featureFlagsApi } from './admin';
import { gigsApi, jobAlertsApi, clientApi, supportTicketsApi, matchingApi, disputesApi, reviewsApi, reviewResponsesApi } from './marketplace';
import { referralApi, careerApi, availabilityApi, rateCardsApi, proposalTemplatesApi, gamificationApi, timeEntriesApi } from './features';
import { webhooksApi, apiKeysApi, teamsApi, workflowApi, brandingApi, emailTemplatesApi, integrationsApi } from './integrations';
import { aiApi, aiWritingApi, fraudDetectionApi } from './ai';
import { knowledgeBaseApi, legalDocsApi, videoCallsApi, activityFeedApi, uploadsApi, externalProjectsApi, userFeedbackApi } from './content';
import { workroomApi } from './workroom';
import { dataExportApi } from './dataExport';

export default {
  auth: authApi,
  analytics: analyticsApi,
  timeEntries: timeEntriesApi,
  invoices: invoicesApi,
  escrow: escrowApi,
  categories: categoriesApi,
  tags: tagsApi,
  favorites: favoritesApi,
  supportTickets: supportTicketsApi,
  refunds: refundsApi,
  search: searchApi,
  projects: projectsApi,
  contracts: contractsApi,
  proposals: proposalsApi,
  messages: messagesApi,
  notifications: notificationsApi,
  payments: paymentsApi,
  reviews: reviewsApi,
  jobAlerts: jobAlertsApi,
  portal: portalApi,
  admin: adminApi,
  client: clientApi,
  skills: skillsApi,
  portfolio: portfolioApi,
  payoutMethods: payoutMethodsApi,
  paymentMethods: paymentMethodsApi,
  users: usersApi,
  milestones: milestonesApi,
  disputes: disputesApi,
  searches: searchesApi,
  uploads: uploadsApi,
  verification: verificationApi,
  ai: aiApi,
  aiWriting: aiWritingApi,
  socialAuth: socialAuthApi,
  referral: referralApi,
  career: careerApi,
  availability: availabilityApi,
  rateCards: rateCardsApi,
  proposalTemplates: proposalTemplatesApi,
  auditTrail: auditTrailApi,
  branding: brandingApi,
  communication: communicationApi,
  metrics: metricsApi,
  searchAnalytics: searchAnalyticsApi,
  compliance: complianceApi,
  twoFactor: twoFactorApi,
  webhooks: webhooksApi,
  apiKeys: apiKeysApi,
  teams: teamsApi,
  wallet: walletApi,
  gigs: gigsApi,
  workflow: workflowApi,
  knowledgeBase: knowledgeBaseApi,
  multiCurrency: multiCurrencyApi,
  matching: matchingApi,
  gamification: gamificationApi,
  fraudDetection: fraudDetectionApi,
  videoCalls: videoCallsApi,
  legalDocs: legalDocsApi,
  portfolioShowcase: portfolioShowcaseApi,
  reviewResponses: reviewResponsesApi,
  externalProjects: externalProjectsApi,
  activityFeed: activityFeedApi,
  realtime: realtimeApi,
  publicProfile: publicProfileApi,
  workroom: workroomApi,
  dataExport: dataExportApi,
};
