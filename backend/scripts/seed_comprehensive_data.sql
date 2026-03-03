-- ============================================================================
-- MegiLance Comprehensive Seed Data for Dev Quick Login Users
-- Covers ALL features: projects, proposals, contracts, milestones, payments,
-- escrow, invoices, reviews, disputes, conversations, messages, notifications,
-- portfolio, gigs, gig_orders, time_entries, favorites, support_tickets,
-- user_skills, user_verifications, tags, audit_logs
-- ============================================================================
-- Quick Login Users:
--   Admin:      admin@megilance.com / Admin@123       (id=1)
--   Client:     client1@example.com / Client@123      (id=2)
--   Freelancer: freelancer1@example.com / Freelancer@123 (id=5)
-- ============================================================================

-- ============================================================================
-- 1. UPDATE USER PROFILES - Rich, complete data
-- ============================================================================

-- Admin (id=1) - Full profile
UPDATE users SET
  hashed_password = '$2b$12$TdPOSxlWmbntgiLxx4ricOP/nddJstEiidd0VEVZD1G3px7e4V4hy',
  name = 'Admin User',
  bio = 'MegiLance platform administrator. Overseeing all operations, user management, dispute resolution, and platform quality assurance. Dedicated to building the best freelancing marketplace.',
  skills = 'Platform Management,User Support,Analytics,Dispute Resolution,Content Moderation',
  location = 'Lahore, Pakistan',
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 0,
  updated_at = datetime('now')
WHERE id = 1;

-- Client1 (id=2) - Primary quick login client
UPDATE users SET
  hashed_password = '$2b$12$aq6cLz6DrVBR.06H2kWU0.AHiTPKkfsI5w4n6sTHX23bR7w16jMqi',
  name = 'John Smith',
  bio = 'CEO of TechNova Solutions, a fast-growing SaaS startup based in San Francisco. We build enterprise-grade cloud solutions and are always looking for talented developers, designers, and content creators to join our projects. Over $500K spent on the platform with a 98% satisfaction rate.',
  skills = 'Project Management,Product Strategy,Business Development',
  location = 'San Francisco, CA',
  hourly_rate = NULL,
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 24500.00,
  updated_at = datetime('now')
WHERE id = 2;

-- Client2 (id=3)
UPDATE users SET
  hashed_password = '$2b$12$aq6cLz6DrVBR.06H2kWU0.AHiTPKkfsI5w4n6sTHX23bR7w16jMqi',
  name = 'Sarah Wilson',
  bio = 'Founder of InnovatePlus, a venture-backed startup disrupting the health-tech space. Looking for mobile developers, data scientists, and UI/UX designers for our next big release.',
  skills = 'Startup Growth,Healthcare Tech,Data Analytics',
  location = 'Austin, TX',
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 18200.00,
  updated_at = datetime('now')
WHERE id = 3;

-- Client3 (id=4)
UPDATE users SET
  hashed_password = '$2b$12$aq6cLz6DrVBR.06H2kWU0.AHiTPKkfsI5w4n6sTHX23bR7w16jMqi',
  name = 'Mike Johnson',
  bio = 'Director of Engineering at GlobalTech Enterprises. Managing a portfolio of enterprise software products. Extensive experience outsourcing development and design projects with Agile methodology.',
  skills = 'Enterprise Software,Agile,DevOps,Cloud Architecture',
  location = 'New York, NY',
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 31000.00,
  updated_at = datetime('now')
WHERE id = 4;

-- Freelancer1 (id=5) - Primary quick login freelancer
UPDATE users SET
  hashed_password = '$2b$12$QBf/hOgOb59ix6lU9ksJt.Y8wFi4a.xTbX0Gyskb0XqZyJZkENU/i',
  name = 'Alice Dev',
  bio = 'Senior Full-Stack Developer with 8+ years of experience building scalable web applications. Expert in React, Node.js, Python, and AWS. Delivered 50+ projects with a 4.9-star rating. Passionate about clean code, TDD, and delivering pixel-perfect UIs. Open source contributor and tech blog writer.',
  skills = 'React,Node.js,Python,TypeScript,PostgreSQL,AWS,Docker,GraphQL,Next.js,FastAPI',
  hourly_rate = 85.0,
  location = 'London, UK',
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 15750.00,
  updated_at = datetime('now')
WHERE id = 5;

-- Freelancer2 (id=6)
UPDATE users SET
  hashed_password = '$2b$12$QBf/hOgOb59ix6lU9ksJt.Y8wFi4a.xTbX0Gyskb0XqZyJZkENU/i',
  name = 'Bob Design',
  bio = 'Award-winning UI/UX Designer with 6 years of experience creating beautiful, user-centered digital experiences. Specialist in SaaS product design, design systems, and mobile app interfaces. Worked with Fortune 500 companies and Y Combinator startups.',
  skills = 'UI Design,UX Research,Figma,Adobe XD,Sketch,Prototyping,Design Systems,Framer',
  hourly_rate = 75.0,
  location = 'New York, US',
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 8400.00,
  updated_at = datetime('now')
WHERE id = 6;

-- Freelancer3 (id=7)
UPDATE users SET
  hashed_password = '$2b$12$QBf/hOgOb59ix6lU9ksJt.Y8wFi4a.xTbX0Gyskb0XqZyJZkENU/i',
  name = 'Carol Writer',
  bio = 'Professional Content Writer and SEO Specialist with 5+ years of experience. Published 500+ articles across tech, finance, and SaaS niches. Expert in long-form content, whitepapers, and API documentation. Consistently ranked in top 1% of freelancers.',
  skills = 'Content Writing,SEO,Copywriting,Blog Writing,Technical Writing,API Documentation,Ghostwriting',
  hourly_rate = 55.0,
  location = 'Toronto, CA',
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 4200.00,
  updated_at = datetime('now')
WHERE id = 7;

-- Freelancer4 (id=8)
UPDATE users SET
  hashed_password = '$2b$12$QBf/hOgOb59ix6lU9ksJt.Y8wFi4a.xTbX0Gyskb0XqZyJZkENU/i',
  name = 'Dan Market',
  bio = 'Digital Marketing Strategist with 7 years helping brands grow through data-driven campaigns. Expert in Google Ads, Meta advertising, and conversion rate optimization. Managed over $2M in ad spend with 300%+ average ROAS.',
  skills = 'Digital Marketing,SEO,Google Ads,Social Media,Analytics,Content Marketing,Email Marketing,PPC',
  hourly_rate = 65.0,
  location = 'Berlin, DE',
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 6100.00,
  updated_at = datetime('now')
WHERE id = 8;

-- Freelancer5 (id=9)
UPDATE users SET
  hashed_password = '$2b$12$QBf/hOgOb59ix6lU9ksJt.Y8wFi4a.xTbX0Gyskb0XqZyJZkENU/i',
  name = 'Eve Data',
  bio = 'Data Scientist & ML Engineer with 6+ years of experience in predictive analytics, NLP, and computer vision. Built ML pipelines processing 10M+ records daily. Published researcher with expertise in TensorFlow, PyTorch, and cloud-native ML deployments.',
  skills = 'Python,SQL,Tableau,Power BI,Machine Learning,TensorFlow,PyTorch,Data Visualization,R,Spark',
  hourly_rate = 95.0,
  location = 'Singapore, SG',
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 22000.00,
  updated_at = datetime('now')
WHERE id = 9;


-- ============================================================================
-- 2. SKILLS & CATEGORIES (ensure we have a rich set)
-- ============================================================================

INSERT OR IGNORE INTO skills (name, category, created_at) VALUES
  ('React', 'Web Development', datetime('now')),
  ('Angular', 'Web Development', datetime('now')),
  ('Vue.js', 'Web Development', datetime('now')),
  ('Node.js', 'Web Development', datetime('now')),
  ('Python', 'Web Development', datetime('now')),
  ('Django', 'Web Development', datetime('now')),
  ('FastAPI', 'Web Development', datetime('now')),
  ('PostgreSQL', 'Web Development', datetime('now')),
  ('MongoDB', 'Web Development', datetime('now')),
  ('Redis', 'Web Development', datetime('now')),
  ('GraphQL', 'Web Development', datetime('now')),
  ('REST APIs', 'Web Development', datetime('now')),
  ('TypeScript', 'Web Development', datetime('now')),
  ('Next.js', 'Web Development', datetime('now')),
  ('Docker', 'Web Development', datetime('now')),
  ('AWS', 'Cloud & DevOps', datetime('now')),
  ('React Native', 'Mobile Development', datetime('now')),
  ('Flutter', 'Mobile Development', datetime('now')),
  ('iOS', 'Mobile Development', datetime('now')),
  ('Android', 'Mobile Development', datetime('now')),
  ('Swift', 'Mobile Development', datetime('now')),
  ('Kotlin', 'Mobile Development', datetime('now')),
  ('Firebase', 'Mobile Development', datetime('now')),
  ('UI Design', 'Design', datetime('now')),
  ('UX Research', 'Design', datetime('now')),
  ('Figma', 'Design', datetime('now')),
  ('Adobe XD', 'Design', datetime('now')),
  ('Sketch', 'Design', datetime('now')),
  ('Adobe Illustrator', 'Design', datetime('now')),
  ('Adobe Photoshop', 'Design', datetime('now')),
  ('Prototyping', 'Design', datetime('now')),
  ('Design Systems', 'Design', datetime('now')),
  ('SQL', 'Data Science', datetime('now')),
  ('Machine Learning', 'Data Science', datetime('now')),
  ('Deep Learning', 'Data Science', datetime('now')),
  ('TensorFlow', 'Data Science', datetime('now')),
  ('PyTorch', 'Data Science', datetime('now')),
  ('Data Visualization', 'Data Science', datetime('now')),
  ('Tableau', 'Data Science', datetime('now')),
  ('Power BI', 'Data Science', datetime('now')),
  ('R', 'Data Science', datetime('now')),
  ('Spark', 'Data Science', datetime('now')),
  ('Technical Writing', 'Writing', datetime('now')),
  ('Copywriting', 'Writing', datetime('now')),
  ('Content Strategy', 'Writing', datetime('now')),
  ('SEO Writing', 'Writing', datetime('now')),
  ('Blog Writing', 'Writing', datetime('now')),
  ('Documentation', 'Writing', datetime('now')),
  ('Ghostwriting', 'Writing', datetime('now')),
  ('Digital Marketing', 'Marketing', datetime('now')),
  ('Social Media Marketing', 'Marketing', datetime('now')),
  ('SEO', 'Marketing', datetime('now')),
  ('SEM', 'Marketing', datetime('now')),
  ('Content Marketing', 'Marketing', datetime('now')),
  ('Email Marketing', 'Marketing', datetime('now')),
  ('Analytics', 'Marketing', datetime('now')),
  ('Google Ads', 'Marketing', datetime('now')),
  ('PPC', 'Marketing', datetime('now')),
  ('Framer', 'Design', datetime('now')),
  ('Kubernetes', 'Cloud & DevOps', datetime('now')),
  ('CI/CD', 'Cloud & DevOps', datetime('now')),
  ('Terraform', 'Cloud & DevOps', datetime('now')),
  ('Azure', 'Cloud & DevOps', datetime('now')),
  ('GCP', 'Cloud & DevOps', datetime('now'));

INSERT OR IGNORE INTO categories (name, slug, description, parent_id, icon, created_at) VALUES
  ('Web Development', 'web-development', 'Full-stack web development, frontend and backend', NULL, 'code', datetime('now')),
  ('Mobile Development', 'mobile-development', 'iOS, Android, and cross-platform mobile apps', NULL, 'smartphone', datetime('now')),
  ('Design', 'design', 'UI/UX design, graphic design, and branding', NULL, 'palette', datetime('now')),
  ('Data Science', 'data-science', 'Data analysis, machine learning, and AI', NULL, 'bar-chart', datetime('now')),
  ('Writing & Content', 'writing-content', 'Content writing, copywriting, and documentation', NULL, 'pen-tool', datetime('now')),
  ('Marketing', 'marketing', 'Digital marketing, SEO, and advertising', NULL, 'megaphone', datetime('now')),
  ('Cloud & DevOps', 'cloud-devops', 'Cloud infrastructure, CI/CD, and automation', NULL, 'cloud', datetime('now')),
  ('Blockchain', 'blockchain', 'Smart contracts, DeFi, and Web3 development', NULL, 'link', datetime('now'));


-- ============================================================================
-- 3. USER_SKILLS - Link skills to freelancers with proficiency
-- ============================================================================

-- Alice Dev (id=5) skills
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 5, id, 5, 8, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'React';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 5, id, 5, 7, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'Node.js';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 5, id, 5, 6, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'Python';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 5, id, 4, 5, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'TypeScript';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 5, id, 4, 6, 0, datetime('now'), datetime('now') FROM skills WHERE name = 'PostgreSQL';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 5, id, 4, 4, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'AWS';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 5, id, 4, 5, 0, datetime('now'), datetime('now') FROM skills WHERE name = 'Docker';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 5, id, 3, 3, 0, datetime('now'), datetime('now') FROM skills WHERE name = 'GraphQL';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 5, id, 4, 3, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'Next.js';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 5, id, 3, 2, 0, datetime('now'), datetime('now') FROM skills WHERE name = 'FastAPI';

-- Bob Design (id=6) skills
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 6, id, 5, 6, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'UI Design';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 6, id, 5, 6, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'UX Research';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 6, id, 5, 5, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'Figma';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 6, id, 4, 4, 0, datetime('now'), datetime('now') FROM skills WHERE name = 'Adobe XD';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 6, id, 4, 5, 0, datetime('now'), datetime('now') FROM skills WHERE name = 'Sketch';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 6, id, 4, 3, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'Prototyping';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 6, id, 5, 4, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'Design Systems';

-- Carol Writer (id=7) skills
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 7, id, 5, 5, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'Technical Writing';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 7, id, 5, 5, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'Copywriting';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 7, id, 4, 4, 0, datetime('now'), datetime('now') FROM skills WHERE name = 'SEO Writing';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 7, id, 5, 5, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'Blog Writing';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 7, id, 4, 3, 0, datetime('now'), datetime('now') FROM skills WHERE name = 'Documentation';

-- Dan Market (id=8) skills
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 8, id, 5, 7, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'Digital Marketing';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 8, id, 5, 6, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'SEO';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 8, id, 5, 6, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'Google Ads';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 8, id, 4, 5, 0, datetime('now'), datetime('now') FROM skills WHERE name = 'Social Media Marketing';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 8, id, 4, 4, 0, datetime('now'), datetime('now') FROM skills WHERE name = 'Analytics';

-- Eve Data (id=9) skills
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 9, id, 5, 6, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'Python';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 9, id, 5, 6, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'SQL';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 9, id, 5, 5, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'Machine Learning';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 9, id, 4, 4, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'TensorFlow';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 9, id, 4, 3, 0, datetime('now'), datetime('now') FROM skills WHERE name = 'PyTorch';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 9, id, 5, 5, 1, datetime('now'), datetime('now') FROM skills WHERE name = 'Tableau';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 9, id, 4, 4, 0, datetime('now'), datetime('now') FROM skills WHERE name = 'Power BI';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
SELECT 9, id, 3, 2, 0, datetime('now'), datetime('now') FROM skills WHERE name = 'R';


-- ============================================================================
-- 4. USER VERIFICATIONS (KYC)
-- ============================================================================

INSERT OR REPLACE INTO user_verifications (user_id, kyc_status, identity_doc_url, company_name, company_reg_number, tax_id, verified_at, updated_at)
VALUES
  (2, 'approved', '/documents/kyc/client1_id.pdf', 'TechNova Solutions Inc.', 'DE-2019-4582761', 'US-EIN-82-1234567', datetime('now', '-90 days'), datetime('now')),
  (3, 'approved', '/documents/kyc/client2_id.pdf', 'InnovatePlus LLC', 'TX-2020-9283745', 'US-EIN-47-9876543', datetime('now', '-60 days'), datetime('now')),
  (4, 'approved', '/documents/kyc/client3_id.pdf', 'GlobalTech Enterprises', 'NY-2018-1837264', 'US-EIN-31-5678901', datetime('now', '-120 days'), datetime('now')),
  (5, 'approved', '/documents/kyc/freelancer1_id.pdf', NULL, NULL, 'UK-UTR-1234567890', datetime('now', '-180 days'), datetime('now')),
  (6, 'approved', '/documents/kyc/freelancer2_id.pdf', NULL, NULL, 'US-SSN-XXX-XX-1234', datetime('now', '-150 days'), datetime('now')),
  (7, 'pending', '/documents/kyc/freelancer3_id.pdf', NULL, NULL, NULL, NULL, datetime('now')),
  (9, 'approved', '/documents/kyc/freelancer5_id.pdf', NULL, NULL, 'SG-UEN-202012345A', datetime('now', '-45 days'), datetime('now'));


-- ============================================================================
-- 5. NEW PROJECTS - Various statuses for Client1 (id=2)
-- ============================================================================

-- Clean real projects for client1 (id=2) - different statuses
INSERT INTO projects (title, description, category, budget_type, budget_min, budget_max, experience_level, estimated_duration, skills, client_id, status, created_at, updated_at)
VALUES
  ('Enterprise CRM Dashboard', 'Build a comprehensive CRM dashboard with customer management, sales pipeline tracking, analytics reporting, and team collaboration features. Must integrate with Salesforce API and support real-time data synchronization. Tech stack: React, Node.js, PostgreSQL, Redis.', 'Web Development', 'Fixed', 15000, 25000, 'Expert', '2-4 months', 'React,Node.js,PostgreSQL,Redis,REST APIs', 2, 'open', datetime('now', '-5 days'), datetime('now', '-5 days')),

  ('Mobile Health Tracker App', 'Develop a cross-platform health tracking app with features: step counting, calorie tracking, sleep monitoring, medication reminders, and doctor appointment scheduling. Must integrate with Apple HealthKit and Google Fit.', 'Mobile Development', 'Fixed', 20000, 35000, 'Expert', '3-5 months', 'React Native,Firebase,iOS,Android,REST APIs', 2, 'open', datetime('now', '-3 days'), datetime('now', '-3 days')),

  ('Company Website Redesign', 'Complete redesign of corporate website to modern standards. New homepage, about page, services, blog, careers section, and contact form. Focus on conversion optimization, SEO, and mobile-first design. Brand guidelines will be provided.', 'Design', 'Fixed', 5000, 8000, 'Intermediate', '4-6 weeks', 'UI Design,Figma,React,Next.js,SEO', 2, 'in_progress', datetime('now', '-30 days'), datetime('now', '-2 days')),

  ('API Documentation & Technical Writing', 'Write comprehensive API documentation for our REST API (200+ endpoints). Includes getting started guide, authentication docs, endpoint reference, webhook documentation, error codes, and code samples in 5 languages (Python, JavaScript, Ruby, Go, Java).', 'Writing & Content', 'Hourly', 40, 70, 'Intermediate', '2-3 months', 'Technical Writing,API Documentation,Documentation,REST APIs', 2, 'in_progress', datetime('now', '-45 days'), datetime('now', '-1 days')),

  ('SEO & Content Marketing Strategy', 'Develop and execute a 6-month SEO and content marketing strategy. Competitor analysis, keyword research, content calendar, 30 blog posts, landing page optimization, and monthly performance reports.', 'Marketing', 'Fixed', 8000, 12000, 'Intermediate', '6 months', 'SEO,Content Marketing,Blog Writing,Analytics,Digital Marketing', 2, 'open', datetime('now', '-7 days'), datetime('now', '-7 days')),

  ('Data Pipeline & Analytics Platform', 'Build an automated data pipeline to ingest data from 10+ sources (APIs, databases, CSV files), transform and clean it, and load into a data warehouse. Include a Tableau dashboard for executive reporting and real-time KPI monitoring.', 'Data Science', 'Fixed', 18000, 30000, 'Expert', '3-4 months', 'Python,SQL,Tableau,AWS,Spark,Data Visualization', 2, 'open', datetime('now', '-1 days'), datetime('now', '-1 days')),

  ('Legacy System Migration to Cloud', 'Migrate a legacy .NET monolith to microservices on AWS. Includes database migration (SQL Server to PostgreSQL), API redesign, CI/CD pipeline setup, and Kubernetes deployment. Zero-downtime cutover required.', 'Cloud & DevOps', 'Fixed', 35000, 50000, 'Expert', '4-6 months', 'AWS,Docker,Kubernetes,PostgreSQL,CI/CD,Terraform', 2, 'completed', datetime('now', '-180 days'), datetime('now', '-30 days')),

  ('E-commerce Product Recommendation Engine', 'Build an ML-powered product recommendation engine for our e-commerce platform. Collaborative filtering, content-based recommendations, and hybrid approach. Must handle 5M+ products and serve recommendations in <100ms.', 'Data Science', 'Fixed', 22000, 35000, 'Expert', '3-4 months', 'Python,Machine Learning,TensorFlow,PostgreSQL,Redis,REST APIs', 2, 'completed', datetime('now', '-200 days'), datetime('now', '-60 days'));

-- Projects for Client2 (id=3)
INSERT INTO projects (title, description, category, budget_type, budget_min, budget_max, experience_level, estimated_duration, skills, client_id, status, created_at, updated_at)
VALUES
  ('Telemedicine App MVP', 'Build an MVP for a telemedicine platform. Video consultations, appointment scheduling, prescription management, patient records, and payment integration. HIPAA-compliant. React Native frontend with FastAPI backend.', 'Mobile Development', 'Fixed', 25000, 40000, 'Expert', '3-5 months', 'React Native,FastAPI,Python,PostgreSQL,Firebase', 3, 'in_progress', datetime('now', '-60 days'), datetime('now', '-3 days')),

  ('Healthcare Analytics Dashboard', 'Interactive dashboard for healthcare KPIs: patient satisfaction, wait times, treatment outcomes, resource utilization. Real-time data from multiple hospital systems. Must meet healthcare data privacy standards.', 'Data Science', 'Fixed', 15000, 22000, 'Expert', '2-3 months', 'Python,Tableau,SQL,Data Visualization,Power BI', 3, 'open', datetime('now', '-10 days'), datetime('now', '-10 days'));

-- Projects for Client3 (id=4)
INSERT INTO projects (title, description, category, budget_type, budget_min, budget_max, experience_level, estimated_duration, skills, client_id, status, created_at, updated_at)
VALUES
  ('Blockchain Supply Chain Tracker', 'Develop a blockchain-based supply chain tracking system with smart contracts on Ethereum. Features: product provenance, QR code scanning, temperature monitoring, and compliance reporting.', 'Blockchain', 'Fixed', 30000, 45000, 'Expert', '4-6 months', 'Python,React,Node.js,PostgreSQL,Docker', 4, 'open', datetime('now', '-8 days'), datetime('now', '-8 days')),

  ('Corporate Training LMS', 'Build a Learning Management System for employee training. Course creation, video hosting, quizzes, progress tracking, certifications, and manager reporting. Must support 10K+ concurrent users.', 'Web Development', 'Fixed', 20000, 32000, 'Expert', '3-5 months', 'React,Node.js,PostgreSQL,AWS,Redis', 4, 'in_progress', datetime('now', '-75 days'), datetime('now', '-5 days'));


-- ============================================================================
-- 6. PROPOSALS - Freelancers bidding on projects
-- ============================================================================

-- Get new project IDs and add proposals
-- We'll use subqueries to reference the newly created projects

-- Alice Dev (id=5) proposals on Client1's projects
INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, created_at, updated_at)
SELECT p.id, 5,
  'Hi John, I''m very excited about this project! With 8+ years of full-stack development experience, I''ve built several similar CRM systems including a customer management platform that handles 50K+ users. I''m proficient in your entire tech stack (React, Node.js, PostgreSQL, Redis) and can start immediately. I would love to discuss the project requirements in more detail. My portfolio includes similar enterprise dashboards - please check them out!',
  19500.00, 230, 85.0, 'immediate', 'submitted',
  datetime('now', '-4 days'), datetime('now', '-4 days')
FROM projects p WHERE p.title = 'Enterprise CRM Dashboard' AND p.client_id = 2;

INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, created_at, updated_at)
SELECT p.id, 5,
  'Dear John, the Data Pipeline project caught my attention. I have extensive experience building ETL pipelines with Python, Apache Spark, and AWS services. I recently completed a similar project that processes 15M records daily with 99.9% uptime. I can deliver a robust, scalable solution within your timeline.',
  24000.00, 280, 85.0, 'immediate', 'submitted',
  datetime('now'), datetime('now')
FROM projects p WHERE p.title = 'Data Pipeline & Analytics Platform' AND p.client_id = 2;

-- Alice Dev's accepted proposal for Company Website Redesign (in_progress)
INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, created_at, updated_at)
SELECT p.id, 5,
  'Hi John, I''d be thrilled to redesign your company website. I have strong frontend skills in React and Next.js with a keen eye for modern design. I''ll work closely with your brand guidelines to create a conversion-optimized, mobile-first site. Check my portfolio for similar corporate redesign projects.',
  6500.00, 76, 85.0, 'immediate', 'accepted',
  datetime('now', '-28 days'), datetime('now', '-25 days')
FROM projects p WHERE p.title = 'Company Website Redesign' AND p.client_id = 2;

-- Bob Design (id=6) proposals
INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, created_at, updated_at)
SELECT p.id, 6,
  'Hello! As a UI/UX designer with 6 years of experience, your CRM dashboard project is right in my wheelhouse. I specialize in enterprise SaaS interfaces and have designed dashboards used by 100K+ users. I''ll create an intuitive, data-rich interface that your team will love using daily.',
  21000.00, 280, 75.0, 'immediate', 'submitted',
  datetime('now', '-3 days'), datetime('now', '-3 days')
FROM projects p WHERE p.title = 'Enterprise CRM Dashboard' AND p.client_id = 2;

INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, created_at, updated_at)
SELECT p.id, 6,
  'I would love to help redesign your corporate website! My design-first approach ensures beautiful, usable interfaces. I specialize in conversion optimization and have helped businesses increase their conversion rates by 40%+ through thoughtful UI redesigns.',
  7200.00, 96, 75.0, '1-2_weeks', 'rejected',
  datetime('now', '-29 days'), datetime('now', '-26 days')
FROM projects p WHERE p.title = 'Company Website Redesign' AND p.client_id = 2;

-- Carol Writer (id=7) proposals
INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, created_at, updated_at)
SELECT p.id, 7,
  'John, this is exactly the type of project I excel at! I''ve written API documentation for 10+ SaaS platforms including a fintech API with 300+ endpoints. I can create clear, developer-friendly docs complete with code samples, interactive examples, and searchable references. I use tools like Swagger/OpenAPI and GitBook for maximum developer experience.',
  9200.00, 168, 55.0, 'immediate', 'accepted',
  datetime('now', '-43 days'), datetime('now', '-40 days')
FROM projects p WHERE p.title = 'API Documentation & Technical Writing' AND p.client_id = 2;

INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, created_at, updated_at)
SELECT p.id, 7,
  'I specialize in SEO content strategy and have helped 20+ companies increase organic traffic by 200%+. I can develop a comprehensive content calendar, write engaging blog posts with proper keyword optimization, and provide detailed monthly analytics reports.',
  10500.00, 190, 55.0, '1-2_weeks', 'submitted',
  datetime('now', '-5 days'), datetime('now', '-5 days')
FROM projects p WHERE p.title = 'SEO & Content Marketing Strategy' AND p.client_id = 2;

-- Dan Market (id=8) proposals
INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, created_at, updated_at)
SELECT p.id, 8,
  'I have managed over $2M in ad spend with 300%+ ROAS. Your SEO and content marketing project is a perfect fit for my expertise. I''ll deliver a data-driven strategy backed by thorough competitor analysis and proven frameworks.',
  9800.00, 150, 65.0, 'immediate', 'submitted',
  datetime('now', '-6 days'), datetime('now', '-6 days')
FROM projects p WHERE p.title = 'SEO & Content Marketing Strategy' AND p.client_id = 2;

-- Eve Data (id=9) proposals
INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, created_at, updated_at)
SELECT p.id, 9,
  'This project is a perfect match for my expertise! I built a similar recommendation engine that improved click-through rates by 35% for a retail client. I''m experienced with collaborative filtering, matrix factorization, and deep learning-based recommendations at scale.',
  28000.00, 295, 95.0, 'immediate', 'submitted',
  datetime('now', '-3 days'), datetime('now', '-3 days')
FROM projects p WHERE p.title = 'Data Pipeline & Analytics Platform' AND p.client_id = 2;

INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, created_at, updated_at)
SELECT p.id, 9,
  'Your healthcare analytics dashboard is exactly the kind of project I love. I''ve built similar dashboards for 3 healthcare organizations, all HIPAA-compliant. I can deliver interactive Tableau dashboards with real-time data connections.',
  18500.00, 195, 95.0, 'immediate', 'submitted',
  datetime('now', '-8 days'), datetime('now', '-8 days')
FROM projects p WHERE p.title = 'Healthcare Analytics Dashboard' AND p.client_id = 3;

-- Proposals on Client3's projects
INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, created_at, updated_at)
SELECT p.id, 5,
  'Mike, the Corporate Training LMS sounds like an excellent project. I''ve built 3 similar platforms with video streaming, quiz engines, and progress tracking. My experience with React and AWS will ensure a scalable, reliable system that handles 10K+ concurrent users with ease.',
  26000.00, 306, 85.0, '1-2_weeks', 'accepted',
  datetime('now', '-70 days'), datetime('now', '-65 days')
FROM projects p WHERE p.title = 'Corporate Training LMS' AND p.client_id = 4;


-- ============================================================================
-- 7. CONTRACTS - Active, completed, and various statuses
-- ============================================================================

-- Contract for Company Website Redesign (Client1 + Alice Dev) - Active
INSERT INTO contracts (contract_address, project_id, freelancer_id, client_id, winning_bid_id, contract_type, amount, contract_amount, currency, hourly_rate, platform_fee, status, start_date, end_date, description, terms, created_at, updated_at)
SELECT
  'MGL-CTR-' || p.id || '-' || strftime('%s','now'),
  p.id, 5, 2,
  (SELECT id FROM proposals WHERE project_id = p.id AND freelancer_id = 5 AND status = 'accepted' LIMIT 1),
  'fixed', 6500.00, 6500.00, 'USD', NULL, 650.00,
  'active',
  datetime('now', '-25 days'), datetime('now', '+20 days'),
  'Complete redesign of TechNova corporate website with modern UI, SEO optimization, and mobile-first design.',
  '{"payment_schedule": "milestone-based", "revisions": 3, "ownership": "client", "confidentiality": true}',
  datetime('now', '-25 days'), datetime('now', '-2 days')
FROM projects p WHERE p.title = 'Company Website Redesign' AND p.client_id = 2;

-- Contract for API Documentation (Client1 + Carol Writer) - Active
INSERT INTO contracts (contract_address, project_id, freelancer_id, client_id, winning_bid_id, contract_type, amount, contract_amount, currency, hourly_rate, platform_fee, status, start_date, end_date, description, terms, created_at, updated_at)
SELECT
  'MGL-CTR-DOC-' || p.id,
  p.id, 7, 2,
  (SELECT id FROM proposals WHERE project_id = p.id AND freelancer_id = 7 AND status = 'accepted' LIMIT 1),
  'hourly', 9200.00, 9200.00, 'USD', 55.0, 920.00,
  'active',
  datetime('now', '-40 days'), datetime('now', '+50 days'),
  'Comprehensive API documentation for 200+ REST endpoints with code samples in 5 languages.',
  '{"payment_schedule": "bi-weekly", "hours_cap": 168, "revisions": "unlimited", "tools": ["Swagger", "GitBook"]}',
  datetime('now', '-40 days'), datetime('now', '-1 days')
FROM projects p WHERE p.title = 'API Documentation & Technical Writing' AND p.client_id = 2;

-- Contract for Corporate Training LMS (Client3 + Alice Dev) - Active
INSERT INTO contracts (contract_address, project_id, freelancer_id, client_id, winning_bid_id, contract_type, amount, contract_amount, currency, hourly_rate, platform_fee, status, start_date, end_date, description, terms, created_at, updated_at)
SELECT
  'MGL-CTR-LMS-' || p.id,
  p.id, 5, 4,
  (SELECT id FROM proposals WHERE project_id = p.id AND freelancer_id = 5 AND status = 'accepted' LIMIT 1),
  'fixed', 26000.00, 26000.00, 'USD', NULL, 2600.00,
  'active',
  datetime('now', '-65 days'), datetime('now', '+25 days'),
  'Build a Learning Management System for employee training with video hosting, quizzes, and certifications.',
  '{"payment_schedule": "milestone-based", "revisions": 2, "ownership": "client", "support": "30 days post-delivery"}',
  datetime('now', '-65 days'), datetime('now', '-5 days')
FROM projects p WHERE p.title = 'Corporate Training LMS' AND p.client_id = 4;

-- Contract for Legacy System Migration (Client1 + Alice Dev) - COMPLETED
INSERT INTO contracts (contract_address, project_id, freelancer_id, client_id, winning_bid_id, contract_type, amount, contract_amount, currency, hourly_rate, platform_fee, status, start_date, end_date, description, terms, created_at, updated_at)
SELECT
  'MGL-CTR-MIG-' || p.id,
  p.id, 5, 2, NULL,
  'fixed', 42000.00, 42000.00, 'USD', NULL, 4200.00,
  'completed',
  datetime('now', '-175 days'), datetime('now', '-35 days'),
  'Migrated legacy .NET monolith to AWS microservices with zero-downtime cutover.',
  '{"payment_schedule": "milestone-based", "revisions": 2, "ownership": "client"}',
  datetime('now', '-175 days'), datetime('now', '-30 days')
FROM projects p WHERE p.title = 'Legacy System Migration to Cloud' AND p.client_id = 2;

-- Contract for E-commerce Recommendation Engine (Client1 + Eve Data) - COMPLETED
INSERT INTO contracts (contract_address, project_id, freelancer_id, client_id, winning_bid_id, contract_type, amount, contract_amount, currency, hourly_rate, platform_fee, status, start_date, end_date, description, terms, created_at, updated_at)
SELECT
  'MGL-CTR-REC-' || p.id,
  p.id, 9, 2, NULL,
  'fixed', 28500.00, 28500.00, 'USD', NULL, 2850.00,
  'completed',
  datetime('now', '-195 days'), datetime('now', '-65 days'),
  'Built ML-powered product recommendation engine serving 5M+ products in <100ms.',
  '{"payment_schedule": "milestone-based", "revisions": 3}',
  datetime('now', '-195 days'), datetime('now', '-60 days')
FROM projects p WHERE p.title = 'E-commerce Product Recommendation Engine' AND p.client_id = 2;

-- Contract for Telemedicine App (Client2 + Eve Data) - Active
INSERT INTO contracts (contract_address, project_id, freelancer_id, client_id, winning_bid_id, contract_type, amount, contract_amount, currency, hourly_rate, platform_fee, status, start_date, end_date, description, terms, created_at, updated_at)
SELECT
  'MGL-CTR-TEL-' || p.id,
  p.id, 9, 3, NULL,
  'fixed', 32000.00, 32000.00, 'USD', NULL, 3200.00,
  'active',
  datetime('now', '-55 days'), datetime('now', '+30 days'),
  'Building HIPAA-compliant telemedicine platform with video consultations and appointment scheduling.',
  '{"payment_schedule": "milestone-based", "hipaa_compliant": true}',
  datetime('now', '-55 days'), datetime('now', '-3 days')
FROM projects p WHERE p.title = 'Telemedicine App MVP' AND p.client_id = 3;


-- ============================================================================
-- 8. MILESTONES - For all active and completed contracts
-- ============================================================================

-- Milestones for Company Website Redesign contract (Alice + Client1)
INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Design Mockups & Wireframes', 'Create high-fidelity mockups for all pages: homepage, about, services, blog, careers, and contact. Mobile and desktop versions.', 1950.00, datetime('now', '-10 days'), 'approved', 1, datetime('now', '-25 days'), datetime('now', '-12 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Company Website Redesign' AND c.freelancer_id = 5 AND c.client_id = 2;

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Frontend Development', 'Implement all pages in Next.js with responsive design, animations, and SEO optimization.', 2600.00, datetime('now', '+5 days'), 'in_progress', 2, datetime('now', '-25 days'), datetime('now', '-2 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Company Website Redesign' AND c.freelancer_id = 5 AND c.client_id = 2;

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Testing & Launch', 'Cross-browser testing, performance optimization, SEO audit, and deployment to production.', 1950.00, datetime('now', '+20 days'), 'pending', 3, datetime('now', '-25 days'), datetime('now', '-25 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Company Website Redesign' AND c.freelancer_id = 5 AND c.client_id = 2;

-- Milestones for API Documentation contract (Carol + Client1)
INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'API Structure & Getting Started Guide', 'Document API architecture, authentication flow, rate limiting, error codes, and quickstart guide.', 2300.00, datetime('now', '-20 days'), 'approved', 1, datetime('now', '-40 days'), datetime('now', '-22 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'API Documentation & Technical Writing' AND c.freelancer_id = 7 AND c.client_id = 2;

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Core Endpoints Documentation', 'Document 100 most critical endpoints with request/response examples and code samples.', 3450.00, datetime('now', '+10 days'), 'in_progress', 2, datetime('now', '-40 days'), datetime('now', '-5 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'API Documentation & Technical Writing' AND c.freelancer_id = 7 AND c.client_id = 2;

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Advanced Endpoints & Webhooks', 'Document remaining endpoints, webhook events, and integration guides.', 2300.00, datetime('now', '+30 days'), 'pending', 3, datetime('now', '-40 days'), datetime('now', '-40 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'API Documentation & Technical Writing' AND c.freelancer_id = 7 AND c.client_id = 2;

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Interactive Examples & Final Review', 'Add interactive API playground, SDK guides, and perform final editorial review.', 1150.00, datetime('now', '+50 days'), 'pending', 4, datetime('now', '-40 days'), datetime('now', '-40 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'API Documentation & Technical Writing' AND c.freelancer_id = 7 AND c.client_id = 2;

-- Milestones for Corporate Training LMS (Alice + Client3)
INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Architecture & Database Design', 'System architecture, database schema, and API design document.', 5200.00, datetime('now', '-45 days'), 'approved', 1, datetime('now', '-65 days'), datetime('now', '-47 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Corporate Training LMS' AND c.freelancer_id = 5 AND c.client_id = 4;

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Course Management & Video Player', 'Course CRUD, video upload/streaming, and content delivery system.', 7800.00, datetime('now', '-20 days'), 'approved', 2, datetime('now', '-65 days'), datetime('now', '-22 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Corporate Training LMS' AND c.freelancer_id = 5 AND c.client_id = 4;

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Quiz Engine & Progress Tracking', 'Quiz builder, auto-grading, progress dashboards, and certification generation.', 7800.00, datetime('now', '+5 days'), 'in_progress', 3, datetime('now', '-65 days'), datetime('now', '-5 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Corporate Training LMS' AND c.freelancer_id = 5 AND c.client_id = 4;

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Admin Panel & Load Testing', 'Manager reporting dashboard, admin controls, and load testing for 10K concurrent users.', 5200.00, datetime('now', '+25 days'), 'pending', 4, datetime('now', '-65 days'), datetime('now', '-65 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Corporate Training LMS' AND c.freelancer_id = 5 AND c.client_id = 4;

-- Milestones for Legacy Migration (COMPLETED - Alice + Client1)
INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'Architecture & Migration Plan', 'Detailed migration plan, microservice decomposition, and risk assessment.', 8400.00, datetime('now', '-155 days'), 'paid', 1, datetime('now', '-158 days'), datetime('now', '-156 days'), datetime('now', '-155 days'), datetime('now', '-175 days'), datetime('now', '-155 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Legacy System Migration to Cloud' AND c.freelancer_id = 5 AND c.client_id = 2;

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'Database Migration & API Redesign', 'Migrate SQL Server to PostgreSQL, redesign REST APIs for microservices.', 12600.00, datetime('now', '-115 days'), 'paid', 2, datetime('now', '-118 days'), datetime('now', '-116 days'), datetime('now', '-115 days'), datetime('now', '-175 days'), datetime('now', '-115 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Legacy System Migration to Cloud' AND c.freelancer_id = 5 AND c.client_id = 2;

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'CI/CD Pipeline & Kubernetes Deployment', 'Set up CI/CD with GitHub Actions, Kubernetes cluster, and monitoring.', 12600.00, datetime('now', '-70 days'), 'paid', 3, datetime('now', '-73 days'), datetime('now', '-71 days'), datetime('now', '-70 days'), datetime('now', '-175 days'), datetime('now', '-70 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Legacy System Migration to Cloud' AND c.freelancer_id = 5 AND c.client_id = 2;

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'Zero-Downtime Cutover & Monitoring', 'Execute cutover with zero downtime, set up alerts, and handoff documentation.', 8400.00, datetime('now', '-38 days'), 'paid', 4, datetime('now', '-40 days'), datetime('now', '-38 days'), datetime('now', '-37 days'), datetime('now', '-175 days'), datetime('now', '-37 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Legacy System Migration to Cloud' AND c.freelancer_id = 5 AND c.client_id = 2;

-- Milestones for Recommendation Engine (COMPLETED - Eve + Client1)
INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'Data Analysis & Model Selection', 'Analyze product catalog data, evaluate recommendation algorithms, and select optimal approach.', 7125.00, datetime('now', '-170 days'), 'paid', 1, datetime('now', '-173 days'), datetime('now', '-171 days'), datetime('now', '-170 days'), datetime('now', '-195 days'), datetime('now', '-170 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'E-commerce Product Recommendation Engine' AND c.freelancer_id = 9 AND c.client_id = 2;

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'Model Training & API Development', 'Train collaborative and content-based models, build REST API for real-time recommendations.', 11400.00, datetime('now', '-120 days'), 'paid', 2, datetime('now', '-123 days'), datetime('now', '-121 days'), datetime('now', '-120 days'), datetime('now', '-195 days'), datetime('now', '-120 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'E-commerce Product Recommendation Engine' AND c.freelancer_id = 9 AND c.client_id = 2;

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'A/B Testing & Production Deployment', 'Run A/B tests, optimize for <100ms latency, deploy to production with monitoring.', 9975.00, datetime('now', '-68 days'), 'paid', 3, datetime('now', '-70 days'), datetime('now', '-68 days'), datetime('now', '-67 days'), datetime('now', '-195 days'), datetime('now', '-67 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'E-commerce Product Recommendation Engine' AND c.freelancer_id = 9 AND c.client_id = 2;


-- ============================================================================
-- 9. PAYMENTS - Various types and statuses
-- ============================================================================

-- Milestone payments for completed Legacy Migration (Alice)
INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, payment_type, payment_method, status, transaction_id, platform_fee, freelancer_amount, description, processed_at, created_at, updated_at)
SELECT c.id, m.id, 2, 5, m.amount, 'milestone', 'platform', 'completed',
  'TXN-MIG-' || m.order_index || '-' || strftime('%s','now'),
  m.amount * 0.1, m.amount * 0.9,
  'Payment for milestone: ' || m.title,
  m.paid_at, m.paid_at, m.paid_at
FROM contracts c
JOIN projects p ON c.project_id = p.id
JOIN milestones m ON m.contract_id = c.id
WHERE p.title = 'Legacy System Migration to Cloud' AND c.freelancer_id = 5 AND c.client_id = 2 AND m.status = 'paid';

-- Milestone payments for completed Recommendation Engine (Eve)
INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, payment_type, payment_method, status, transaction_id, platform_fee, freelancer_amount, description, processed_at, created_at, updated_at)
SELECT c.id, m.id, 2, 9, m.amount, 'milestone', 'platform', 'completed',
  'TXN-REC-' || m.order_index || '-' || strftime('%s','now'),
  m.amount * 0.1, m.amount * 0.9,
  'Payment for milestone: ' || m.title,
  m.paid_at, m.paid_at, m.paid_at
FROM contracts c
JOIN projects p ON c.project_id = p.id
JOIN milestones m ON m.contract_id = c.id
WHERE p.title = 'E-commerce Product Recommendation Engine' AND c.freelancer_id = 9 AND c.client_id = 2 AND m.status = 'paid';

-- Approved milestone payment for Website Redesign (Alice)
INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, payment_type, payment_method, status, transaction_id, platform_fee, freelancer_amount, description, processed_at, created_at, updated_at)
SELECT c.id, m.id, 2, 5, 1950.00, 'milestone', 'platform', 'completed',
  'TXN-WEB-1-' || strftime('%s','now'),
  195.00, 1755.00,
  'Payment for milestone: Design Mockups & Wireframes',
  datetime('now', '-10 days'), datetime('now', '-10 days'), datetime('now', '-10 days')
FROM contracts c
JOIN projects p ON c.project_id = p.id
JOIN milestones m ON m.contract_id = c.id
WHERE p.title = 'Company Website Redesign' AND c.freelancer_id = 5 AND m.order_index = 1;

-- Approved milestone payment for API Docs (Carol)
INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, payment_type, payment_method, status, transaction_id, platform_fee, freelancer_amount, description, processed_at, created_at, updated_at)
SELECT c.id, m.id, 2, 7, 2300.00, 'milestone', 'platform', 'completed',
  'TXN-DOC-1-' || strftime('%s','now'),
  230.00, 2070.00,
  'Payment for milestone: API Structure & Getting Started Guide',
  datetime('now', '-20 days'), datetime('now', '-20 days'), datetime('now', '-20 days')
FROM contracts c
JOIN projects p ON c.project_id = p.id
JOIN milestones m ON m.contract_id = c.id
WHERE p.title = 'API Documentation & Technical Writing' AND c.freelancer_id = 7 AND m.order_index = 1;

-- LMS approved milestones payments (Alice + Client3)
INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, payment_type, payment_method, status, transaction_id, platform_fee, freelancer_amount, description, processed_at, created_at, updated_at)
SELECT c.id, m.id, 4, 5, m.amount, 'milestone', 'platform', 'completed',
  'TXN-LMS-' || m.order_index || '-' || strftime('%s','now'),
  m.amount * 0.1, m.amount * 0.9,
  'Payment for milestone: ' || m.title,
  datetime('now', '-' || (50 - m.order_index * 20) || ' days'),
  datetime('now', '-' || (50 - m.order_index * 20) || ' days'),
  datetime('now', '-' || (50 - m.order_index * 20) || ' days')
FROM contracts c
JOIN projects p ON c.project_id = p.id
JOIN milestones m ON m.contract_id = c.id
WHERE p.title = 'Corporate Training LMS' AND c.freelancer_id = 5 AND m.status = 'approved';

-- Deposit payment from Client1
INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, payment_type, payment_method, status, transaction_id, platform_fee, freelancer_amount, description, processed_at, created_at, updated_at)
VALUES (NULL, NULL, 2, NULL, 25000.00, 'deposit', 'platform', 'completed', 'TXN-DEP-C1-' || strftime('%s','now'), 0, 0, 'Account balance top-up via credit card', datetime('now', '-90 days'), datetime('now', '-90 days'), datetime('now', '-90 days'));

-- Withdrawal by Alice
INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, payment_type, payment_method, status, transaction_id, platform_fee, freelancer_amount, description, processed_at, created_at, updated_at)
VALUES (NULL, NULL, 5, NULL, 15000.00, 'withdrawal', 'platform', 'completed', 'TXN-WDR-F1-' || strftime('%s','now'), 25.00, 14975.00, 'Withdrawal to bank account (Barclays UK)', datetime('now', '-15 days'), datetime('now', '-15 days'), datetime('now', '-15 days'));

-- Pending withdrawal by Eve
INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, payment_type, payment_method, status, transaction_id, platform_fee, freelancer_amount, description, processed_at, created_at, updated_at)
VALUES (NULL, NULL, 9, NULL, 8000.00, 'withdrawal', 'platform', 'pending', 'TXN-WDR-F5-' || strftime('%s','now'), 25.00, 7975.00, 'Withdrawal to bank account (DBS Singapore)', NULL, datetime('now', '-2 days'), datetime('now', '-2 days'));


-- ============================================================================
-- 10. ESCROW - For active contracts
-- ============================================================================

-- Escrow for Website Redesign
INSERT INTO escrow (contract_id, client_id, amount, status, released_amount, released_at, expires_at, created_at, updated_at)
SELECT c.id, 2, 6500.00, 'active', 1950.00, datetime('now', '-10 days'), datetime('now', '+60 days'), datetime('now', '-25 days'), datetime('now', '-10 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Company Website Redesign' AND c.freelancer_id = 5 AND c.client_id = 2;

-- Escrow for API Documentation
INSERT INTO escrow (contract_id, client_id, amount, status, released_amount, released_at, expires_at, created_at, updated_at)
SELECT c.id, 2, 9200.00, 'active', 2300.00, datetime('now', '-20 days'), datetime('now', '+90 days'), datetime('now', '-40 days'), datetime('now', '-20 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'API Documentation & Technical Writing' AND c.freelancer_id = 7 AND c.client_id = 2;

-- Escrow for Corporate Training LMS
INSERT INTO escrow (contract_id, client_id, amount, status, released_amount, released_at, expires_at, created_at, updated_at)
SELECT c.id, 4, 26000.00, 'active', 13000.00, datetime('now', '-20 days'), datetime('now', '+60 days'), datetime('now', '-65 days'), datetime('now', '-20 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Corporate Training LMS' AND c.freelancer_id = 5 AND c.client_id = 4;

-- Escrow for Telemedicine App
INSERT INTO escrow (contract_id, client_id, amount, status, released_amount, released_at, expires_at, created_at, updated_at)
SELECT c.id, 3, 32000.00, 'active', 8000.00, datetime('now', '-30 days'), datetime('now', '+60 days'), datetime('now', '-55 days'), datetime('now', '-30 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Telemedicine App MVP' AND c.freelancer_id = 9 AND c.client_id = 3;


-- ============================================================================
-- 11. INVOICES
-- ============================================================================

-- Invoice from Alice for Website Redesign Milestone 1
INSERT INTO invoices (invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total, due_date, paid_date, status, items, notes, created_at, updated_at)
SELECT 'INV-2026-0101', c.id, 5, 2, 1950.00, 0, 1950.00, datetime('now', '-8 days'), datetime('now', '-10 days'), 'paid',
  '[{"description": "Design Mockups & Wireframes - Company Website Redesign", "quantity": 1, "rate": 1950.00, "amount": 1950.00}]',
  'Payment for completed milestone 1 of 3.', datetime('now', '-12 days'), datetime('now', '-10 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Company Website Redesign' AND c.freelancer_id = 5 AND c.client_id = 2;

-- Invoice from Carol for API Docs Milestone 1
INSERT INTO invoices (invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total, due_date, paid_date, status, items, notes, created_at, updated_at)
SELECT 'INV-2026-0102', c.id, 7, 2, 2300.00, 0, 2300.00, datetime('now', '-18 days'), datetime('now', '-20 days'), 'paid',
  '[{"description": "API Structure & Getting Started Guide", "quantity": 1, "rate": 2300.00, "amount": 2300.00}]',
  'First milestone payment for API documentation project.', datetime('now', '-22 days'), datetime('now', '-20 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'API Documentation & Technical Writing' AND c.freelancer_id = 7 AND c.client_id = 2;

-- Pending invoice from Alice for LMS Milestone 3
INSERT INTO invoices (invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total, due_date, status, items, notes, created_at, updated_at)
SELECT 'INV-2026-0103', c.id, 5, 4, 7800.00, 0, 7800.00, datetime('now', '+15 days'), 'pending',
  '[{"description": "Quiz Engine & Progress Tracking - Corporate Training LMS", "quantity": 1, "rate": 7800.00, "amount": 7800.00}]',
  'Milestone 3 in progress - expected completion within 2 weeks.', datetime('now', '-3 days'), datetime('now', '-3 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Corporate Training LMS' AND c.freelancer_id = 5 AND c.client_id = 4;

-- Invoice from Alice for completed Legacy Migration
INSERT INTO invoices (invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total, due_date, paid_date, status, items, notes, created_at, updated_at)
SELECT 'INV-2025-0050', c.id, 5, 2, 42000.00, 0, 42000.00, datetime('now', '-32 days'), datetime('now', '-35 days'), 'paid',
  '[{"description": "Architecture & Migration Plan", "quantity": 1, "rate": 8400.00, "amount": 8400.00}, {"description": "Database Migration & API Redesign", "quantity": 1, "rate": 12600.00, "amount": 12600.00}, {"description": "CI/CD Pipeline & K8s Deployment", "quantity": 1, "rate": 12600.00, "amount": 12600.00}, {"description": "Zero-Downtime Cutover", "quantity": 1, "rate": 8400.00, "amount": 8400.00}]',
  'Final invoice for Legacy System Migration project. All milestones completed successfully.', datetime('now', '-36 days'), datetime('now', '-35 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Legacy System Migration to Cloud' AND c.freelancer_id = 5 AND c.client_id = 2;

-- Overdue invoice
INSERT INTO invoices (invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total, due_date, status, items, notes, created_at, updated_at)
SELECT 'INV-2026-0104', c.id, 7, 2, 3450.00, 0, 3450.00, datetime('now', '-3 days'), 'overdue',
  '[{"description": "Core Endpoints Documentation (100 endpoints)", "quantity": 1, "rate": 3450.00, "amount": 3450.00}]',
  'Milestone 2 documentation for core API endpoints.', datetime('now', '-10 days'), datetime('now', '-3 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'API Documentation & Technical Writing' AND c.freelancer_id = 7 AND c.client_id = 2;


-- ============================================================================
-- 12. REVIEWS - For completed contracts
-- ============================================================================

-- Client1 reviews Alice for Legacy Migration
INSERT INTO reviews (contract_id, reviewer_id, reviewee_id, rating, comment, created_at, updated_at)
SELECT c.id, 2, 5, 5.0,
  'Alice is an exceptional developer! She migrated our entire legacy system to AWS microservices without any downtime. Her technical expertise, communication, and project management skills are top-notch. The CI/CD pipeline she set up has saved us countless hours. Highly recommended for any complex backend project!',
  datetime('now', '-30 days'), datetime('now', '-30 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Legacy System Migration to Cloud' AND c.freelancer_id = 5 AND c.client_id = 2;

-- Alice reviews Client1 for Legacy Migration
INSERT INTO reviews (contract_id, reviewer_id, reviewee_id, rating, comment, created_at, updated_at)
SELECT c.id, 5, 2, 5.0,
  'John is a fantastic client to work with. Clear requirements from day one, prompt feedback, and always available for clarification. The project scope was well-defined with reasonable milestones. Payment was always on time. Would love to work with TechNova again!',
  datetime('now', '-29 days'), datetime('now', '-29 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Legacy System Migration to Cloud' AND c.freelancer_id = 5 AND c.client_id = 2;

-- Client1 reviews Eve for Recommendation Engine
INSERT INTO reviews (contract_id, reviewer_id, reviewee_id, rating, comment, created_at, updated_at)
SELECT c.id, 2, 9, 4.8,
  'Eve delivered an outstanding recommendation engine that improved our conversion rate by 28%. Her ML expertise is impressive - she evaluated multiple approaches and chose the optimal one for our use case. The system handles our 5M+ product catalog with sub-100ms response times. Highly recommended for any data science project!',
  datetime('now', '-60 days'), datetime('now', '-60 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'E-commerce Product Recommendation Engine' AND c.freelancer_id = 9 AND c.client_id = 2;

-- Eve reviews Client1 for Recommendation Engine
INSERT INTO reviews (contract_id, reviewer_id, reviewee_id, rating, comment, created_at, updated_at)
SELECT c.id, 9, 2, 4.9,
  'Working with John on the recommendation engine was a great experience. He provided excellent product catalog data and was very responsive to questions. The milestone structure was fair and payment was always prompt. TechNova is a top-tier client on this platform.',
  datetime('now', '-59 days'), datetime('now', '-59 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'E-commerce Product Recommendation Engine' AND c.freelancer_id = 9 AND c.client_id = 2;

-- Reviews for the existing completed contract (id=3)
INSERT OR IGNORE INTO reviews (contract_id, reviewer_id, reviewee_id, rating, comment, created_at, updated_at)
VALUES
  (3, 2, 5, 4.8, 'Excellent work! Alice delivered a fantastic web application on time and exceeded expectations. Communication was great throughout the project.', datetime('now', '-90 days'), datetime('now', '-90 days')),
  (3, 5, 2, 5.0, 'John was a wonderful client to work with. Clear requirements, timely feedback, and professional communication. Would love to work together again!', datetime('now', '-89 days'), datetime('now', '-89 days'));


-- ============================================================================
-- 13. CONVERSATIONS & MESSAGES
-- ============================================================================

-- Update existing conversation (id=1) between Client1 and Alice
UPDATE conversations SET title = 'Company Website Redesign - Discussion', last_message_at = datetime('now', '-1 days'), updated_at = datetime('now', '-1 days') WHERE id = 1;

-- New conversation: Client1 + Carol Writer about API Docs
INSERT INTO conversations (client_id, freelancer_id, title, status, last_message_at, created_at, updated_at)
VALUES (2, 7, 'API Documentation Progress Update', 'active', datetime('now', '-2 days'), datetime('now', '-40 days'), datetime('now', '-2 days'));

-- New conversation: Client3 + Alice about LMS
INSERT INTO conversations (client_id, freelancer_id, title, status, last_message_at, created_at, updated_at)
VALUES (4, 5, 'Corporate Training LMS - Sprint Review', 'active', datetime('now', '-3 days'), datetime('now', '-65 days'), datetime('now', '-3 days'));

-- New conversation: Client1 + Eve about Recommendation Engine (archived - completed project)
INSERT INTO conversations (client_id, freelancer_id, title, status, is_archived, last_message_at, created_at, updated_at)
VALUES (2, 9, 'Recommendation Engine - Final Handoff', 'archived', 1, datetime('now', '-60 days'), datetime('now', '-195 days'), datetime('now', '-60 days'));

-- Messages for conversation between Client1 and Alice (Website Redesign)
INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, sent_at, created_at) VALUES
  (1, 2, 5, 'Hi Alice! I''ve reviewed the new mockups and they look great. Love the hero section design. Can we make the CTA button a bit more prominent?', 'text', 1, datetime('now', '-5 days'), datetime('now', '-5 days')),
  (1, 5, 2, 'Thanks John! Absolutely, I''ll increase the CTA button size and add a subtle animation to draw attention. I''ll send the updated version by end of day.', 'text', 1, datetime('now', '-5 days'), datetime('now', '-5 days')),
  (1, 5, 2, 'Here''s the updated mockup with the larger CTA button and a pulse animation on hover. Let me know what you think!', 'text', 1, datetime('now', '-4 days'), datetime('now', '-4 days')),
  (1, 2, 5, 'Perfect! That looks much better. Approved! Let''s move ahead with the frontend development. When can you start on the About page?', 'text', 1, datetime('now', '-4 days'), datetime('now', '-4 days')),
  (1, 5, 2, 'Starting on the About page today! I''ll have the Services section done by Friday. Also, I noticed the blog template needs a sidebar for categories - should I include that?', 'text', 1, datetime('now', '-3 days'), datetime('now', '-3 days')),
  (1, 2, 5, 'Yes, please include a sidebar with categories and recent posts. Also add a newsletter subscription form at the bottom of blog posts.', 'text', 1, datetime('now', '-3 days'), datetime('now', '-3 days')),
  (1, 5, 2, 'Got it! Here are the blog template options with sidebar variants. I recommend Option B with the collapsible sidebar for mobile. What do you think?', 'text', 1, datetime('now', '-2 days'), datetime('now', '-2 days')),
  (1, 2, 5, 'Option B looks great - let''s go with that. Also, can you add Open Graph meta tags for social sharing?', 'text', 1, datetime('now', '-2 days'), datetime('now', '-2 days')),
  (1, 5, 2, 'Already planned for it! I''m implementing dynamic OG tags with Next.js metadata API. Preview images will auto-generate from page content. I''ll also add structured data (JSON-LD) for SEO.', 'text', 1, datetime('now', '-1 days'), datetime('now', '-1 days')),
  (1, 2, 5, 'Excellent attention to detail! This is why I love working with you. Keep up the great work!', 'text', 0, datetime('now', '-1 days'), datetime('now', '-1 days'));

-- Messages for conversation between Client1 and Carol (API Docs)
INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, sent_at, created_at)
SELECT c.id, 2, 7, 'Hi Carol, how''s the documentation coming along? We have a developer conference next month and would love to showcase the new docs.', 'text', 1, datetime('now', '-7 days'), datetime('now', '-7 days')
FROM conversations c WHERE c.client_id = 2 AND c.freelancer_id = 7 AND c.title LIKE 'API Documentation%';

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, sent_at, created_at)
SELECT c.id, 7, 2, 'Great timing, John! I''ve completed 65 of the 100 core endpoints in milestone 2. The authentication and user management sections are fully documented with code samples in all 5 languages. Want me to prioritize any specific endpoints for the conference?', 'text', 1, datetime('now', '-7 days'), datetime('now', '-7 days')
FROM conversations c WHERE c.client_id = 2 AND c.freelancer_id = 7 AND c.title LIKE 'API Documentation%';

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, sent_at, created_at)
SELECT c.id, 2, 7, 'Yes! Please prioritize the payment processing and webhook endpoints. Those are the ones most developers ask about.', 'text', 1, datetime('now', '-6 days'), datetime('now', '-6 days')
FROM conversations c WHERE c.client_id = 2 AND c.freelancer_id = 7 AND c.title LIKE 'API Documentation%';

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, sent_at, created_at)
SELECT c.id, 7, 2, 'On it! I''ll have the payment and webhook docs ready by end of this week. I''m also adding interactive examples using our Swagger playground so developers can test endpoints directly from the docs.', 'text', 1, datetime('now', '-5 days'), datetime('now', '-5 days')
FROM conversations c WHERE c.client_id = 2 AND c.freelancer_id = 7 AND c.title LIKE 'API Documentation%';

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, sent_at, created_at)
SELECT c.id, 7, 2, 'Update: Payment processing docs are complete with flow diagrams and error handling guides. Working on webhooks now - should be done by tomorrow. Here''s a preview link to the staging docs.', 'text', 0, datetime('now', '-2 days'), datetime('now', '-2 days')
FROM conversations c WHERE c.client_id = 2 AND c.freelancer_id = 7 AND c.title LIKE 'API Documentation%';

-- Messages for conversation between Client3 and Alice (LMS)
INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, sent_at, created_at)
SELECT c.id, 4, 5, 'Alice, the quiz engine demo was impressive! The auto-grading feature is exactly what we needed. A few questions: 1) Can we add timed quizzes? 2) Can managers set passing scores per course?', 'text', 1, datetime('now', '-5 days'), datetime('now', '-5 days')
FROM conversations c WHERE c.client_id = 4 AND c.freelancer_id = 5 AND c.title LIKE 'Corporate Training%';

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, sent_at, created_at)
SELECT c.id, 5, 4, 'Thanks Mike! Great suggestions. 1) Yes, I can add a timer with configurable per-quiz time limits. 2) Absolutely - I''ll add a passing score setting in the course admin panel. Both are straightforward to implement. I''ll include them in the current milestone.', 'text', 1, datetime('now', '-4 days'), datetime('now', '-4 days')
FROM conversations c WHERE c.client_id = 4 AND c.freelancer_id = 5 AND c.title LIKE 'Corporate Training%';

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, sent_at, created_at)
SELECT c.id, 4, 5, 'Perfect! One more thing - can certificates include a QR code for verification? Our HR team wants to verify certifications easily.', 'text', 1, datetime('now', '-3 days'), datetime('now', '-3 days')
FROM conversations c WHERE c.client_id = 4 AND c.freelancer_id = 5 AND c.title LIKE 'Corporate Training%';

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, sent_at, created_at)
SELECT c.id, 5, 4, 'Great idea! I''ll generate a unique QR code per certificate that links to a verification page. It will show the employee name, course, score, and completion date. I''ll add this to the certification module.', 'text', 0, datetime('now', '-3 days'), datetime('now', '-3 days')
FROM conversations c WHERE c.client_id = 4 AND c.freelancer_id = 5 AND c.title LIKE 'Corporate Training%';


-- ============================================================================
-- 14. NOTIFICATIONS - For all roles
-- ============================================================================

-- Notifications for Admin (id=1)
INSERT INTO notifications (user_id, notification_type, title, content, data, is_read, priority, action_url, created_at) VALUES
  (1, 'system_alert', 'New User Registration Spike', '15 new users registered in the last hour. Normal average is 3/hour. Please review for potential bot activity.', '{"count": 15, "timeframe": "1h"}', 0, 'high', '/admin/users', datetime('now', '-2 hours')),
  (1, 'dispute_opened', 'New Dispute Requires Attention', 'A dispute has been opened on contract #4 - requires admin mediation.', '{"dispute_id": 1, "contract_id": 4}', 0, 'urgent', '/admin/disputes', datetime('now', '-6 hours')),
  (1, 'payment_alert', 'Large Transaction Alert', 'A withdrawal of $15,000 has been processed. Automatic review flagged.', '{"payment_id": 1, "amount": 15000}', 1, 'medium', '/admin/payments', datetime('now', '-1 days')),
  (1, 'system_alert', 'Weekly Platform Report Ready', 'Weekly analytics report is ready: 42 new projects, 128 proposals, $89K in transactions.', '{"period": "weekly"}', 0, 'low', '/admin/analytics', datetime('now', '-3 days')),
  (1, 'user_report', 'User Report: Suspicious Activity', 'User flagged for potential TOS violation. Review required.', '{"user_id": 36}', 1, 'medium', '/admin/users/36', datetime('now', '-5 days'));

-- Notifications for Client1 (id=2)
INSERT INTO notifications (user_id, notification_type, title, content, data, is_read, priority, action_url, created_at) VALUES
  (2, 'new_proposal', 'New Proposal on Enterprise CRM Dashboard', 'Alice Dev submitted a proposal for $19,500 on your Enterprise CRM Dashboard project.', '{"proposal_id": 1, "freelancer": "Alice Dev", "amount": 19500}', 0, 'medium', '/portal/client/projects', datetime('now', '-4 days')),
  (2, 'new_proposal', 'New Proposal on Enterprise CRM Dashboard', 'Bob Design submitted a proposal for $21,000 on your Enterprise CRM Dashboard project.', '{"proposal_id": 2, "freelancer": "Bob Design", "amount": 21000}', 0, 'medium', '/portal/client/projects', datetime('now', '-3 days')),
  (2, 'milestone_submitted', 'Milestone Submitted for Review', 'Alice Dev submitted "Frontend Development" for your Company Website Redesign project. Please review.', '{"milestone_id": 2}', 0, 'high', '/portal/client/contracts', datetime('now', '-2 days')),
  (2, 'new_message', 'New Message from Carol Writer', 'Carol sent an update on the API Documentation project.', '{"conversation_id": 2, "sender": "Carol Writer"}', 0, 'medium', '/portal/messages', datetime('now', '-2 days')),
  (2, 'payment_processed', 'Payment Processed Successfully', 'Your payment of $1,950 for "Design Mockups & Wireframes" has been released to Alice Dev.', '{"amount": 1950, "freelancer": "Alice Dev"}', 1, 'low', '/portal/client/payments', datetime('now', '-10 days')),
  (2, 'invoice_received', 'New Invoice from Alice Dev', 'Invoice INV-2026-0103 for $7,800 received for Corporate Training LMS milestone.', '{"invoice_number": "INV-2026-0103"}', 0, 'medium', '/portal/client/invoices', datetime('now', '-3 days')),
  (2, 'new_proposal', 'New Proposal on Data Pipeline Project', 'Eve Data submitted a proposal for $28,000 on your Data Pipeline & Analytics Platform project.', '{"proposal_id": 3, "freelancer": "Eve Data", "amount": 28000}', 0, 'medium', '/portal/client/projects', datetime('now', '-3 days')),
  (2, 'contract_completed', 'Contract Completed', 'Your contract for "Legacy System Migration to Cloud" with Alice Dev has been marked as completed. Please leave a review!', '{"contract_id": 4}', 1, 'medium', '/portal/client/reviews', datetime('now', '-30 days')),
  (2, 'review_received', 'New Review from Alice Dev', 'Alice Dev left you a 5-star review on the Legacy System Migration project.', '{"rating": 5.0}', 1, 'low', '/portal/client/reviews', datetime('now', '-29 days'));

-- Notifications for Freelancer1/Alice (id=5)
INSERT INTO notifications (user_id, notification_type, title, content, data, is_read, priority, action_url, created_at) VALUES
  (5, 'proposal_accepted', 'Proposal Accepted!', 'Congratulations! John Smith accepted your proposal for "Company Website Redesign". Contract has been created.', '{"project_title": "Company Website Redesign", "amount": 6500}', 1, 'high', '/portal/freelancer/contracts', datetime('now', '-25 days')),
  (5, 'milestone_approved', 'Milestone Approved & Paid', 'Your milestone "Design Mockups & Wireframes" has been approved. $1,950 has been released to your account.', '{"milestone_title": "Design Mockups & Wireframes", "amount": 1950}', 1, 'medium', '/portal/freelancer/earnings', datetime('now', '-10 days')),
  (5, 'new_message', 'New Message from John Smith', 'John sent a message about the Company Website Redesign project.', '{"conversation_id": 1, "sender": "John Smith"}', 0, 'medium', '/portal/messages', datetime('now', '-1 days')),
  (5, 'project_match', 'New Project Match: Enterprise CRM Dashboard', 'A new project matching your skills has been posted: Enterprise CRM Dashboard ($15K-$25K).', '{"project_id": 1}', 0, 'low', '/portal/freelancer/projects', datetime('now', '-5 days')),
  (5, 'project_match', 'New Project Match: Data Pipeline & Analytics', 'A new project matching your skills has been posted: Data Pipeline & Analytics Platform ($18K-$30K).', '{"project_id": 2}', 0, 'low', '/portal/freelancer/projects', datetime('now', '-1 days')),
  (5, 'payment_received', 'Payment Received', 'You received $37,800 (after 10% platform fee) for the Legacy System Migration project.', '{"amount": 37800}', 1, 'medium', '/portal/freelancer/earnings', datetime('now', '-30 days')),
  (5, 'withdrawal_completed', 'Withdrawal Processed', 'Your withdrawal of $15,000 to Barclays UK has been processed. Expected arrival: 2-3 business days.', '{"amount": 15000}', 1, 'medium', '/portal/freelancer/earnings', datetime('now', '-15 days')),
  (5, 'review_received', 'New 5-Star Review!', 'John Smith left you a 5-star review on the Legacy System Migration project. "Alice is an exceptional developer!"', '{"rating": 5.0}', 1, 'low', '/portal/freelancer/reviews', datetime('now', '-30 days')),
  (5, 'contract_milestone_due', 'Milestone Due Soon', 'Your milestone "Frontend Development" for Company Website Redesign is due in 5 days.', '{"milestone_title": "Frontend Development", "due_in_days": 5}', 0, 'high', '/portal/freelancer/contracts', datetime('now', '-1 days')),
  (5, 'profile_view', 'Profile View', 'Your profile was viewed 23 times this week. 5 potential clients visited your portfolio.', '{"views": 23}', 1, 'low', '/portal/freelancer/profile', datetime('now', '-7 days'));


-- ============================================================================
-- 15. PORTFOLIO ITEMS - Rich portfolios for freelancers
-- ============================================================================

-- Update and add more portfolio items for Alice (id=5)
UPDATE portfolio_items SET
  title = 'Enterprise Cloud Migration - AWS Microservices',
  description = 'Led the complete migration of a Fortune 500 company''s legacy .NET monolith to AWS microservices architecture. Reduced deployment time by 90% and infrastructure costs by 40%. Technologies: AWS ECS, RDS, ElastiCache, Terraform.',
  image_url = '/portfolio/alice-cloud-migration.jpg',
  project_url = 'https://github.com/alicedev/cloud-migration-showcase'
WHERE id = 1;

UPDATE portfolio_items SET
  title = 'Real-time E-commerce Analytics Dashboard',
  description = 'Built a real-time analytics dashboard processing 2M+ events/day for a major online retailer. Interactive charts, funnel analysis, cohort tracking, and automated alerting. Technologies: React, D3.js, Node.js, PostgreSQL, Redis.',
  image_url = '/portfolio/alice-analytics-dashboard.jpg',
  project_url = 'https://github.com/alicedev/analytics-dashboard'
WHERE id = 2;

INSERT INTO portfolio_items (freelancer_id, title, description, image_url, project_url, created_at, updated_at) VALUES
  (5, 'Open Source: React Component Library', 'Created and maintain a popular React component library with 2.5K+ GitHub stars. Includes 50+ accessible, themeable components with TypeScript support and Storybook documentation.', '/portfolio/alice-component-lib.jpg', 'https://github.com/alicedev/ui-components', datetime('now', '-120 days'), datetime('now', '-30 days')),
  (5, 'FinTech Payment Processing Platform', 'Architected a payment processing platform handling $50M+ monthly transactions. PCI-DSS compliant with multi-currency support, fraud detection, and real-time settlement. Technologies: Node.js, PostgreSQL, Stripe, Docker.', '/portfolio/alice-fintech.jpg', NULL, datetime('now', '-200 days'), datetime('now', '-100 days')),
  (5, 'Healthcare Patient Portal', 'HIPAA-compliant patient portal with appointment scheduling, medical records, telemedicine integration, and prescription management. Served 200K+ patients. Technologies: React, FastAPI, PostgreSQL, AWS.', '/portfolio/alice-healthcare.jpg', NULL, datetime('now', '-150 days'), datetime('now', '-80 days'));

-- Update Bob's portfolio
UPDATE portfolio_items SET
  title = 'SaaS Design System - 100+ Components',
  description = 'Designed and documented a comprehensive design system for a B2B SaaS platform used by 50K+ users. Includes atomic design principles, responsive patterns, dark mode support, and accessibility guidelines. Used by 12 product teams.',
  image_url = '/portfolio/bob-design-system.jpg',
  project_url = 'https://dribbble.com/bobdesign/saas-design-system'
WHERE id = 3;

INSERT INTO portfolio_items (freelancer_id, title, description, image_url, project_url, created_at, updated_at) VALUES
  (6, 'Mobile Banking App UI/UX', 'Complete UI/UX redesign for a mobile banking app serving 3M+ users. Reduced task completion time by 45% and increased user satisfaction score from 3.2 to 4.7. Featured on Behance Curated.', '/portfolio/bob-banking-app.jpg', 'https://dribbble.com/bobdesign/banking-app', datetime('now', '-90 days'), datetime('now', '-60 days')),
  (6, 'E-commerce Checkout Optimization', 'Redesigned checkout flow for a fashion e-commerce platform. Reduced cart abandonment by 32% and increased average order value by 18% through UX improvements and A/B testing.', '/portfolio/bob-ecommerce.jpg', 'https://dribbble.com/bobdesign/checkout-flow', datetime('now', '-180 days'), datetime('now', '-150 days'));

-- Carol's portfolio
UPDATE portfolio_items SET
  title = 'Stripe API Documentation',
  description = 'Authored comprehensive documentation for a payment platform''s API. Includes developer guides, code samples in 6 languages, interactive playground, and migration guides. Reduced support tickets by 60%.',
  image_url = '/portfolio/carol-api-docs.jpg',
  project_url = 'https://carolwrites.com/portfolio/stripe-docs'
WHERE id = 4;

INSERT INTO portfolio_items (freelancer_id, title, description, image_url, project_url, created_at, updated_at) VALUES
  (7, 'SaaS Company Blog - 200+ Articles', 'Grew a SaaS company blog from 0 to 150K monthly visitors through strategic content planning, SEO optimization, and thought leadership articles. Average article ranks on page 1 for target keywords.', '/portfolio/carol-saas-blog.jpg', 'https://carolwrites.com/portfolio/saas-blog', datetime('now', '-100 days'), datetime('now', '-50 days'));

-- Dan's portfolio
UPDATE portfolio_items SET
  title = 'DeFi Protocol Marketing Campaign',
  description = 'Led a comprehensive digital marketing campaign for a DeFi protocol launch. Achieved 50K community members in 3 months, $10M TVL within first week, and 200% ROI on ad spend.',
  image_url = '/portfolio/dan-defi-campaign.jpg',
  project_url = 'https://danmarket.io/case-studies/defi-launch'
WHERE id = 5;

INSERT INTO portfolio_items (freelancer_id, title, description, image_url, project_url, created_at, updated_at) VALUES
  (8, 'SaaS Growth Campaign - 500% MRR Increase', 'Designed and executed a multi-channel growth strategy for a B2B SaaS startup. Google Ads, LinkedIn, content marketing, and email nurturing. Achieved 500% MRR growth in 12 months with $1.2M ARR.', '/portfolio/dan-saas-growth.jpg', 'https://danmarket.io/case-studies/saas-growth', datetime('now', '-60 days'), datetime('now', '-30 days'));

-- Eve's portfolio
UPDATE portfolio_items SET
  title = 'ML Recommendation Engine - E-commerce',
  description = 'Built a hybrid recommendation engine combining collaborative filtering and deep learning for a major e-commerce platform. Improved click-through rates by 35% and revenue per user by 22%. Processes 5M+ products in real-time.',
  image_url = '/portfolio/eve-recommendation.jpg',
  project_url = 'https://github.com/evedata/recommendation-engine'
WHERE id = 6;

INSERT INTO portfolio_items (freelancer_id, title, description, image_url, project_url, created_at, updated_at) VALUES
  (9, 'NLP Sentiment Analysis Pipeline', 'Created an NLP pipeline for analyzing customer feedback across 50K+ reviews daily. Multi-language support, entity extraction, and trend detection. Integrated with Tableau for executive dashboards.', '/portfolio/eve-nlp-pipeline.jpg', 'https://github.com/evedata/sentiment-analysis', datetime('now', '-80 days'), datetime('now', '-40 days')),
  (9, 'Predictive Maintenance System - IoT', 'Developed a predictive maintenance system for industrial IoT sensors. Reduced equipment downtime by 45% using time-series analysis and anomaly detection. Processes 100K+ sensor readings per minute.', '/portfolio/eve-iot-maintenance.jpg', NULL, datetime('now', '-130 days'), datetime('now', '-70 days'));


-- ============================================================================
-- 16. DISPUTES
-- ============================================================================

-- Dispute on existing contract (id=1) - quality issue
INSERT INTO disputes (contract_id, raised_by, dispute_type, description, evidence, status, assigned_to, created_at, updated_at) VALUES
  (1, 3, 'quality', 'The deliverables for milestone 2 (Frontend Development) have several bugs and the UI does not match the approved mockups. Multiple responsive design issues on mobile devices. Request revision or partial refund.', '["https://screenshots.megilance.com/dispute-1/bug-report.pdf", "https://screenshots.megilance.com/dispute-1/mobile-issues.png"]', 'in_review', 1, datetime('now', '-10 days'), datetime('now', '-8 days'));

-- Dispute on existing contract (id=4) - scope change
INSERT INTO disputes (contract_id, raised_by, dispute_type, description, evidence, status, assigned_to, resolution, resolution_amount, resolved_at, created_at, updated_at) VALUES
  (4, 5, 'scope_change', 'Client requested significant additional features beyond the original scope without adjusting the budget. The chatbot integration now requires 3 additional API endpoints and a custom training pipeline that were not in the original requirements.', '["https://docs.megilance.com/dispute-2/original-scope.pdf", "https://docs.megilance.com/dispute-2/change-requests.pdf"]', 'resolved', 1, 'Agreed on additional $2,500 for the extra scope. Client will create a separate contract for the training pipeline feature.', 2500.00, datetime('now', '-5 days'), datetime('now', '-15 days'), datetime('now', '-5 days'));


-- ============================================================================
-- 17. TIME ENTRIES - For hourly contracts (API Documentation)
-- ============================================================================

INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 7, c.id,
  datetime('now', '-7 days', '+9 hours'), datetime('now', '-7 days', '+13 hours'),
  240, 'Documented authentication endpoints (login, register, refresh, 2FA). Created code samples for Python and JavaScript.', 1, 55.0, 220.00, 'approved',
  datetime('now', '-7 days'), datetime('now', '-7 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'API Documentation & Technical Writing' AND c.freelancer_id = 7;

INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 7, c.id,
  datetime('now', '-6 days', '+10 hours'), datetime('now', '-6 days', '+16 hours'),
  360, 'Documented user management and profile endpoints. Added Ruby and Go code samples. Created interactive Swagger examples.', 1, 55.0, 330.00, 'approved',
  datetime('now', '-6 days'), datetime('now', '-6 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'API Documentation & Technical Writing' AND c.freelancer_id = 7;

INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 7, c.id,
  datetime('now', '-5 days', '+9 hours'), datetime('now', '-5 days', '+14 hours'),
  300, 'Documented payment processing endpoints (Stripe integration, refunds, webhooks). Created flow diagrams.', 1, 55.0, 275.00, 'approved',
  datetime('now', '-5 days'), datetime('now', '-5 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'API Documentation & Technical Writing' AND c.freelancer_id = 7;

INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 7, c.id,
  datetime('now', '-4 days', '+10 hours'), datetime('now', '-4 days', '+15 hours'),
  300, 'Documented project and proposal endpoints. Added error code reference and rate limiting documentation.', 1, 55.0, 275.00, 'approved',
  datetime('now', '-4 days'), datetime('now', '-4 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'API Documentation & Technical Writing' AND c.freelancer_id = 7;

INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 7, c.id,
  datetime('now', '-3 days', '+9 hours'), datetime('now', '-3 days', '+12 hours'),
  180, 'Documented webhook events and retry policies. Working on Java code samples.', 1, 55.0, 165.00, 'pending',
  datetime('now', '-3 days'), datetime('now', '-3 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'API Documentation & Technical Writing' AND c.freelancer_id = 7;

INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 7, c.id,
  datetime('now', '-2 days', '+10 hours'), datetime('now', '-2 days', '+15 hours'),
  300, 'Completed payment and webhook documentation. Started contract management endpoints.', 1, 55.0, 275.00, 'pending',
  datetime('now', '-2 days'), datetime('now', '-2 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'API Documentation & Technical Writing' AND c.freelancer_id = 7;

-- Time entries for Alice on LMS (also tracks time for fixed project)
INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 5, c.id,
  datetime('now', '-4 days', '+9 hours'), datetime('now', '-4 days', '+17 hours'),
  480, 'Implemented quiz builder with multiple question types (MCQ, true/false, short answer, coding). Added timer functionality.', 1, 85.0, 680.00, 'approved',
  datetime('now', '-4 days'), datetime('now', '-4 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Corporate Training LMS' AND c.freelancer_id = 5;

INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 5, c.id,
  datetime('now', '-3 days', '+10 hours'), datetime('now', '-3 days', '+16 hours'),
  360, 'Built auto-grading system and progress tracking dashboard. Integrated pass/fail scoring per course.', 1, 85.0, 510.00, 'approved',
  datetime('now', '-3 days'), datetime('now', '-3 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Corporate Training LMS' AND c.freelancer_id = 5;

INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 5, c.id,
  datetime('now', '-2 days', '+9 hours'), datetime('now', '-2 days', '+14 hours'),
  300, 'Working on certificate generation with QR code verification. Implementing PDF export.', 1, 85.0, 425.00, 'pending',
  datetime('now', '-2 days'), datetime('now', '-2 days')
FROM contracts c JOIN projects p ON c.project_id = p.id WHERE p.title = 'Corporate Training LMS' AND c.freelancer_id = 5;


-- ============================================================================
-- 18. FAVORITES / BOOKMARKS
-- ============================================================================

-- Client1 (id=2) favorites freelancers
INSERT INTO favorites (user_id, target_type, target_id, created_at) VALUES
  (2, 'user', 5, datetime('now', '-60 days')),
  (2, 'user', 6, datetime('now', '-45 days')),
  (2, 'user', 9, datetime('now', '-30 days'));

-- Client1 favorites gigs
INSERT INTO favorites (user_id, target_type, target_id, created_at) VALUES
  (2, 'gig', 1, datetime('now', '-20 days')),
  (2, 'gig', 4, datetime('now', '-15 days'));

-- Alice (id=5) favorites projects
INSERT INTO favorites (user_id, target_type, target_id, created_at)
SELECT 5, 'project', p.id, datetime('now', '-5 days')
FROM projects p WHERE p.title = 'Enterprise CRM Dashboard' AND p.client_id = 2;

INSERT INTO favorites (user_id, target_type, target_id, created_at)
SELECT 5, 'project', p.id, datetime('now', '-1 days')
FROM projects p WHERE p.title = 'Data Pipeline & Analytics Platform' AND p.client_id = 2;

INSERT INTO favorites (user_id, target_type, target_id, created_at)
SELECT 5, 'project', p.id, datetime('now', '-8 days')
FROM projects p WHERE p.title = 'Blockchain Supply Chain Tracker' AND p.client_id = 4;

-- Eve (id=9) favorites projects
INSERT INTO favorites (user_id, target_type, target_id, created_at)
SELECT 9, 'project', p.id, datetime('now', '-10 days')
FROM projects p WHERE p.title = 'Healthcare Analytics Dashboard' AND p.client_id = 3;


-- ============================================================================
-- 19. SUPPORT TICKETS
-- ============================================================================

INSERT INTO support_tickets (user_id, subject, description, category, priority, status, assigned_to, created_at, updated_at) VALUES
  (5, 'Unable to download invoice PDF', 'When I click "Download PDF" on invoice INV-2025-0050, I get a blank page instead of the PDF file. This happens on both Chrome and Firefox. I need this for my tax records.', 'billing', 'medium', 'in_progress', 1, datetime('now', '-3 days'), datetime('now', '-2 days')),
  (2, 'Escrow release delay for completed milestone', 'Milestone "Design Mockups & Wireframes" was approved 3 days ago but the escrow hasn''t been released to the freelancer yet. The payment shows as "processing" in my dashboard.', 'payment', 'high', 'open', 1, datetime('now', '-1 days'), datetime('now', '-1 days')),
  (7, 'Profile skills not displaying correctly', 'Some of my skills show as duplicates on my public profile page. I have "SEO" listed twice even though I only added it once. This makes my profile look unprofessional.', 'account', 'low', 'resolved', 1, datetime('now', '-10 days'), datetime('now', '-8 days')),
  (3, 'Feature Request: Bulk Milestone Approval', 'When a freelancer completes multiple milestones, I have to approve them one by one. It would be great to have a bulk approval option to save time.', 'feature_request', 'low', 'open', NULL, datetime('now', '-5 days'), datetime('now', '-5 days')),
  (9, 'Account verification taking too long', 'I submitted my KYC documents 2 weeks ago and the status is still showing as "pending". Can someone expedite the review?', 'verification', 'medium', 'resolved', 1, datetime('now', '-14 days'), datetime('now', '-12 days'));


-- ============================================================================
-- 20. GIG ORDERS
-- ============================================================================

-- Order for Alice's gig from Client2
INSERT INTO gig_orders (order_number, gig_id, buyer_id, seller_id, package_tier, package_title, package_description, quantity, base_price, service_fee, total_price, status, delivery_days, deadline, revisions_allowed, payment_status, created_at, updated_at) VALUES
  ('GIG-ORD-20260201', 1, 3, 5, 'standard', 'Full Stack Web App - Standard', 'Complete web application with 5-8 pages, REST API, database setup, and deployment.', 1, 500.00, 50.00, 550.00, 'in_progress', 14, datetime('now', '+10 days'), 2, 'completed', datetime('now', '-4 days'), datetime('now', '-4 days')),
  ('GIG-ORD-20260202', 1, 4, 5, 'premium', 'Full Stack Web App - Premium', 'Enterprise web application with 10+ pages, microservices, CI/CD, testing, and documentation.', 1, 1200.00, 120.00, 1320.00, 'delivered', 21, datetime('now', '+5 days'), 3, 'completed', datetime('now', '-20 days'), datetime('now', '-2 days'));

-- Order for Bob's gig from Client1
INSERT INTO gig_orders (order_number, gig_id, buyer_id, seller_id, package_tier, package_title, package_description, quantity, base_price, service_fee, total_price, status, delivery_days, deadline, delivered_at, completed_at, revisions_allowed, revisions_used, payment_status, created_at, updated_at) VALUES
  ('GIG-ORD-20260105', 2, 2, 6, 'standard', 'UI/UX Design - Standard', 'Complete UI/UX design for up to 10 screens with responsive layouts and prototype.', 1, 350.00, 35.00, 385.00, 'completed', 10, datetime('now', '-20 days'), datetime('now', '-22 days'), datetime('now', '-20 days'), 2, 1, 'released', datetime('now', '-30 days'), datetime('now', '-20 days'));

-- Order for Eve's gig from Client1
INSERT INTO gig_orders (order_number, gig_id, buyer_id, seller_id, package_tier, package_title, package_description, quantity, base_price, service_fee, total_price, status, delivery_days, deadline, revisions_allowed, payment_status, created_at, updated_at) VALUES
  ('GIG-ORD-20260210', 4, 2, 9, 'basic', 'Data Analysis - Basic', 'Exploratory data analysis with visualizations and insights report.', 1, 180.00, 18.00, 198.00, 'in_progress', 7, datetime('now', '+5 days'), 1, 'completed', datetime('now', '-2 days'), datetime('now', '-2 days'));

-- Order for Carol's gig from Client3
INSERT INTO gig_orders (order_number, gig_id, buyer_id, seller_id, package_tier, package_title, package_description, quantity, base_price, service_fee, total_price, status, delivery_days, deadline, delivered_at, completed_at, revisions_allowed, revisions_used, payment_status, created_at, updated_at) VALUES
  ('GIG-ORD-20260108', 3, 3, 7, 'premium', 'SEO Content Package - Premium', '10 SEO-optimized articles (2000+ words each) with keyword research and meta descriptions.', 1, 300.00, 30.00, 330.00, 'completed', 14, datetime('now', '-25 days'), datetime('now', '-27 days'), datetime('now', '-25 days'), 2, 0, 'released', datetime('now', '-40 days'), datetime('now', '-25 days'));


-- ============================================================================
-- 21. GIG REVIEWS
-- ============================================================================

-- Review for Bob's completed gig order
INSERT INTO gig_reviews (order_id, gig_id, reviewer_id, seller_id, rating_communication, rating_service, rating_delivery, rating_recommendation, rating_overall, review_text, is_public, is_verified_purchase, created_at, updated_at)
SELECT go.id, 2, 2, 6, 5, 5, 5, 5, 5.0,
  'Bob delivered exceptional UI/UX designs that exceeded our expectations. The wireframes were detailed, the prototype was interactive and polished, and the final designs were pixel-perfect. Highly recommend for any design project!',
  1, 1, datetime('now', '-19 days'), datetime('now', '-19 days')
FROM gig_orders go WHERE go.order_number = 'GIG-ORD-20260105';

-- Review for Carol's completed gig order
INSERT INTO gig_reviews (order_id, gig_id, reviewer_id, seller_id, rating_communication, rating_service, rating_delivery, rating_recommendation, rating_overall, review_text, seller_response, seller_responded_at, is_public, is_verified_purchase, created_at, updated_at)
SELECT go.id, 3, 3, 7, 5, 4, 5, 5, 4.75,
  'Carol''s writing is top-notch! All 10 articles were well-researched, engaging, and optimized for our target keywords. We''ve already seen a 15% increase in organic traffic. The only minor issue was a couple of articles needed minor factual corrections, but Carol fixed them immediately.',
  'Thank you Sarah! It was a pleasure working on your health-tech content. Happy to hear about the traffic increase! I''m always available for revisions and future projects.',
  datetime('now', '-24 days'),
  1, 1, datetime('now', '-24 days'), datetime('now', '-24 days')
FROM gig_orders go WHERE go.order_number = 'GIG-ORD-20260108';


-- ============================================================================
-- 22. TAGS
-- ============================================================================

INSERT OR IGNORE INTO tags (name, slug, type, usage_count, created_at, updated_at) VALUES
  ('react', 'react', 'skill', 45, datetime('now'), datetime('now')),
  ('python', 'python', 'skill', 38, datetime('now'), datetime('now')),
  ('node.js', 'nodejs', 'skill', 35, datetime('now'), datetime('now')),
  ('design', 'design', 'category', 28, datetime('now'), datetime('now')),
  ('mobile', 'mobile', 'category', 25, datetime('now'), datetime('now')),
  ('machine-learning', 'machine-learning', 'skill', 22, datetime('now'), datetime('now')),
  ('aws', 'aws', 'skill', 20, datetime('now'), datetime('now')),
  ('frontend', 'frontend', 'category', 30, datetime('now'), datetime('now')),
  ('backend', 'backend', 'category', 28, datetime('now'), datetime('now')),
  ('devops', 'devops', 'category', 18, datetime('now'), datetime('now')),
  ('seo', 'seo', 'skill', 15, datetime('now'), datetime('now')),
  ('urgent', 'urgent', 'priority', 8, datetime('now'), datetime('now')),
  ('remote', 'remote', 'work_type', 50, datetime('now'), datetime('now')),
  ('full-time', 'full-time', 'work_type', 12, datetime('now'), datetime('now')),
  ('startup', 'startup', 'industry', 20, datetime('now'), datetime('now'));


-- ============================================================================
-- 23. AUDIT LOGS - For admin visibility
-- ============================================================================

INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values, new_values, ip_address, created_at) VALUES
  (2, 'project', 1, 'create', NULL, '{"title": "Enterprise CRM Dashboard", "budget": "$15K-25K"}', '192.168.1.100', datetime('now', '-5 days')),
  (5, 'proposal', 1, 'create', NULL, '{"project": "Enterprise CRM Dashboard", "bid": 19500}', '10.0.0.50', datetime('now', '-4 days')),
  (2, 'contract', 1, 'create', NULL, '{"freelancer": "Alice Dev", "amount": 6500}', '192.168.1.100', datetime('now', '-25 days')),
  (2, 'milestone', 1, 'approve', '{"status": "submitted"}', '{"status": "approved"}', '192.168.1.100', datetime('now', '-12 days')),
  (5, 'payment', 1, 'withdrawal', NULL, '{"amount": 15000, "method": "bank_transfer"}', '10.0.0.50', datetime('now', '-15 days')),
  (1, 'dispute', 1, 'assign', '{"assigned_to": null}', '{"assigned_to": 1}', '172.16.0.1', datetime('now', '-9 days')),
  (1, 'dispute', 2, 'resolve', '{"status": "in_review"}', '{"status": "resolved", "resolution_amount": 2500}', '172.16.0.1', datetime('now', '-5 days')),
  (3, 'project', 2, 'create', NULL, '{"title": "Telemedicine App MVP", "budget": "$25K-40K"}', '192.168.2.50', datetime('now', '-60 days')),
  (7, 'support_ticket', 1, 'create', NULL, '{"subject": "Unable to download invoice PDF"}', '10.0.0.70', datetime('now', '-3 days')),
  (2, 'gig_order', 1, 'create', NULL, '{"gig": "UI/UX Design - Standard", "amount": 385}', '192.168.1.100', datetime('now', '-30 days'));


-- ============================================================================
-- DONE! All comprehensive data seeded.
-- ============================================================================
