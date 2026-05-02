-- Clean database script - removes all user data
-- Deletion order respects foreign key relationships
PRAGMA foreign_keys = OFF;

DELETE FROM chatbot_conversations;
DELETE FROM chatbot_messages;
DELETE FROM conversations;
DELETE FROM messages;
DELETE FROM notifications;
DELETE FROM proposals;
DELETE FROM gig_orders;
DELETE FROM gig_reviews;
DELETE FROM gigs;
DELETE FROM projects;
DELETE FROM contracts;
DELETE FROM milestones;
DELETE FROM escrow;
DELETE FROM payments;
DELETE FROM invoices;
DELETE FROM payout_schedules;
DELETE FROM reviews;
DELETE FROM portfolio_items;
DELETE FROM skill_graph_user_skills;
DELETE FROM user_skills;
DELETE FROM user_sessions;
DELETE FROM user_subscriptions;
DELETE FROM users;

PRAGMA foreign_keys = ON;

SELECT COUNT(*) as users_remaining FROM users;
SELECT COUNT(*) as projects_remaining FROM projects;
