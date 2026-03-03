INSERT INTO scope_change_requests (contract_id, requested_by, title, description, reason, status, old_amount, new_amount, old_deadline, new_deadline, created_at, updated_at)
SELECT c.id, 5, 'Additional pages: Blog and Careers section', 'The original scope included 4 pages. Client requested 2 additional sections (Blog with CMS and Careers page with job board integration).', 'Client expanded requirements after initial design approval.', 'approved', 6500.00, 8200.00, datetime('now', '+20 days'), datetime('now', '+35 days'), datetime('now', '-8 days'), datetime('now', '-6 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-WEB-%';

INSERT INTO scope_change_requests (contract_id, requested_by, title, description, reason, status, old_amount, new_amount, created_at, updated_at)
SELECT c.id, 4, 'Add mobile-responsive admin dashboard', 'Need the admin reporting dashboard to be fully mobile-responsive with touch-optimized controls for managers on the go.', 'Manager feedback from beta testing.', 'pending', 26000.00, 29500.00, datetime('now', '-2 days'), datetime('now', '-2 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-LMS-%';

INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values, new_values, ip_address, created_at) VALUES
  (2, 'project', 1, 'create', NULL, '{"title":"Enterprise CRM Dashboard"}', '192.168.1.100', datetime('now', '-5 days')),
  (5, 'proposal', 1, 'create', NULL, '{"project":"Enterprise CRM Dashboard","bid":19500}', '10.0.0.50', datetime('now', '-4 days')),
  (2, 'contract', 1, 'create', NULL, '{"freelancer":"Alice Dev","amount":6500}', '192.168.1.100', datetime('now', '-25 days')),
  (2, 'milestone', 1, 'approve', '{"status":"submitted"}', '{"status":"approved"}', '192.168.1.100', datetime('now', '-12 days')),
  (5, 'payment', 1, 'withdrawal', NULL, '{"amount":15000,"method":"bank_transfer"}', '10.0.0.50', datetime('now', '-15 days')),
  (1, 'dispute', 1, 'assign', '{"assigned_to":null}', '{"assigned_to":1}', '172.16.0.1', datetime('now', '-9 days')),
  (1, 'dispute', 2, 'resolve', '{"status":"in_review"}', '{"status":"resolved"}', '172.16.0.1', datetime('now', '-5 days')),
  (3, 'project', 2, 'create', NULL, '{"title":"Telemedicine App MVP"}', '192.168.2.50', datetime('now', '-60 days')),
  (7, 'support_ticket', 1, 'create', NULL, '{"subject":"Unable to download invoice PDF"}', '10.0.0.70', datetime('now', '-3 days')),
  (2, 'gig_order', 1, 'create', NULL, '{"gig":"UI/UX Design Standard","amount":385}', '192.168.1.100', datetime('now', '-30 days'));

INSERT INTO tags (name, slug, type, usage_count, created_at, updated_at)
  SELECT 'react', 'react', 'skill', 45, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug='react');
INSERT INTO tags (name, slug, type, usage_count, created_at, updated_at)
  SELECT 'python', 'python', 'skill', 38, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug='python');
INSERT INTO tags (name, slug, type, usage_count, created_at, updated_at)
  SELECT 'nodejs', 'nodejs', 'skill', 35, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug='nodejs');
INSERT INTO tags (name, slug, type, usage_count, created_at, updated_at)
  SELECT 'design', 'design', 'category', 28, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug='design');
INSERT INTO tags (name, slug, type, usage_count, created_at, updated_at)
  SELECT 'mobile', 'mobile', 'category', 25, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug='mobile');
INSERT INTO tags (name, slug, type, usage_count, created_at, updated_at)
  SELECT 'machine-learning', 'machine-learning', 'skill', 22, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug='machine-learning');
INSERT INTO tags (name, slug, type, usage_count, created_at, updated_at)
  SELECT 'aws', 'aws', 'skill', 20, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug='aws');
INSERT INTO tags (name, slug, type, usage_count, created_at, updated_at)
  SELECT 'frontend', 'frontend', 'category', 30, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug='frontend');
INSERT INTO tags (name, slug, type, usage_count, created_at, updated_at)
  SELECT 'backend', 'backend', 'category', 28, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug='backend');
INSERT INTO tags (name, slug, type, usage_count, created_at, updated_at)
  SELECT 'devops', 'devops', 'category', 18, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug='devops');
INSERT INTO tags (name, slug, type, usage_count, created_at, updated_at)
  SELECT 'seo', 'seo', 'skill', 15, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug='seo');
INSERT INTO tags (name, slug, type, usage_count, created_at, updated_at)
  SELECT 'remote', 'remote', 'work_type', 50, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug='remote');
INSERT INTO tags (name, slug, type, usage_count, created_at, updated_at)
  SELECT 'startup', 'startup', 'industry', 20, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug='startup');
