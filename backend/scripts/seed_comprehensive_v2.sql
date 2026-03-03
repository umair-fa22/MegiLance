-- ============================================================================
-- MegiLance Comprehensive Seed Data
-- Quick Login: Admin(1), Client(2), Freelancer(5)
-- ============================================================================

-- 1. UPDATE USER PROFILES WITH CORRECT PASSWORDS
UPDATE users SET
  hashed_password = '$2b$12$TdPOSxlWmbntgiLxx4ricOP/nddJstEiidd0VEVZD1G3px7e4V4hy',
  name = 'Admin User',
  bio = 'MegiLance platform administrator. Overseeing all operations, user management, dispute resolution, and platform quality assurance.',
  skills = 'Platform Management,User Support,Analytics,Dispute Resolution',
  location = 'Lahore, Pakistan',
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 0, updated_at = datetime('now')
WHERE id = 1;

UPDATE users SET
  hashed_password = '$2b$12$aq6cLz6DrVBR.06H2kWU0.AHiTPKkfsI5w4n6sTHX23bR7w16jMqi',
  name = 'John Smith',
  bio = 'CEO of TechNova Solutions, a fast-growing SaaS startup based in San Francisco. We build enterprise-grade cloud solutions and are always looking for talented developers, designers, and content creators. Over $500K spent on the platform with a 98% satisfaction rate.',
  skills = 'Project Management,Product Strategy,Business Development',
  location = 'San Francisco, CA',
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 24500.00, updated_at = datetime('now')
WHERE id = 2;

UPDATE users SET
  hashed_password = '$2b$12$aq6cLz6DrVBR.06H2kWU0.AHiTPKkfsI5w4n6sTHX23bR7w16jMqi',
  name = 'Sarah Wilson',
  bio = 'Founder of InnovatePlus, a venture-backed startup disrupting the health-tech space. Looking for mobile developers, data scientists, and UI/UX designers.',
  skills = 'Startup Growth,Healthcare Tech,Data Analytics',
  location = 'Austin, TX',
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 18200.00, updated_at = datetime('now')
WHERE id = 3;

UPDATE users SET
  hashed_password = '$2b$12$aq6cLz6DrVBR.06H2kWU0.AHiTPKkfsI5w4n6sTHX23bR7w16jMqi',
  name = 'Mike Johnson',
  bio = 'Director of Engineering at GlobalTech Enterprises. Managing a portfolio of enterprise software products with Agile methodology.',
  skills = 'Enterprise Software,Agile,DevOps,Cloud Architecture',
  location = 'New York, NY',
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 31000.00, updated_at = datetime('now')
WHERE id = 4;

UPDATE users SET
  hashed_password = '$2b$12$QBf/hOgOb59ix6lU9ksJt.Y8wFi4a.xTbX0Gyskb0XqZyJZkENU/i',
  name = 'Alice Dev',
  bio = 'Senior Full-Stack Developer with 8+ years of experience building scalable web applications. Expert in React, Node.js, Python, and AWS. Delivered 50+ projects with a 4.9-star rating. Passionate about clean code, TDD, and delivering pixel-perfect UIs.',
  skills = 'React,Node.js,Python,TypeScript,PostgreSQL,AWS,Docker,GraphQL,Next.js,FastAPI',
  hourly_rate = 85.0, location = 'London, UK',
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 15750.00, updated_at = datetime('now')
WHERE id = 5;

UPDATE users SET
  hashed_password = '$2b$12$QBf/hOgOb59ix6lU9ksJt.Y8wFi4a.xTbX0Gyskb0XqZyJZkENU/i',
  name = 'Bob Design',
  bio = 'Award-winning UI/UX Designer with 6 years of experience creating beautiful, user-centered digital experiences. Specialist in SaaS product design and design systems.',
  skills = 'UI Design,UX Research,Figma,Adobe XD,Sketch,Prototyping,Design Systems,Framer',
  hourly_rate = 75.0, location = 'New York, US',
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 8400.00, updated_at = datetime('now')
WHERE id = 6;

UPDATE users SET
  hashed_password = '$2b$12$QBf/hOgOb59ix6lU9ksJt.Y8wFi4a.xTbX0Gyskb0XqZyJZkENU/i',
  name = 'Carol Writer',
  bio = 'Professional Content Writer and SEO Specialist with 5+ years of experience. Published 500+ articles across tech, finance, and SaaS niches. Expert in long-form content and API documentation.',
  skills = 'Content Writing,SEO,Copywriting,Blog Writing,Technical Writing,API Documentation',
  hourly_rate = 55.0, location = 'Toronto, CA',
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 4200.00, updated_at = datetime('now')
WHERE id = 7;

UPDATE users SET
  hashed_password = '$2b$12$QBf/hOgOb59ix6lU9ksJt.Y8wFi4a.xTbX0Gyskb0XqZyJZkENU/i',
  name = 'Dan Market',
  bio = 'Digital Marketing Strategist with 7 years helping brands grow through data-driven campaigns. Managed over $2M in ad spend with 300%+ average ROAS.',
  skills = 'Digital Marketing,SEO,Google Ads,Social Media,Analytics,Content Marketing,Email Marketing',
  hourly_rate = 65.0, location = 'Berlin, DE',
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 6100.00, updated_at = datetime('now')
WHERE id = 8;

UPDATE users SET
  hashed_password = '$2b$12$QBf/hOgOb59ix6lU9ksJt.Y8wFi4a.xTbX0Gyskb0XqZyJZkENU/i',
  name = 'Eve Data',
  bio = 'Data Scientist and ML Engineer with 6+ years of experience in predictive analytics, NLP, and computer vision. Built ML pipelines processing 10M+ records daily.',
  skills = 'Python,SQL,Tableau,Power BI,Machine Learning,TensorFlow,PyTorch,Data Visualization,R,Spark',
  hourly_rate = 95.0, location = 'Singapore, SG',
  is_active = 1, is_verified = 1, email_verified = 1,
  account_balance = 22000.00, updated_at = datetime('now')
WHERE id = 9;


-- 2. ADD NEW SKILLS (conditional - only if not exists)
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Angular', 'Web Development', 1, 13, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Angular');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Vue.js', 'Web Development', 1, 14, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Vue.js');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Django', 'Web Development', 1, 15, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Django');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'FastAPI', 'Web Development', 1, 16, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='FastAPI');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'MongoDB', 'Web Development', 1, 17, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='MongoDB');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Redis', 'Web Development', 1, 18, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Redis');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'GraphQL', 'Web Development', 1, 19, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='GraphQL');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'REST APIs', 'Web Development', 1, 20, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='REST APIs');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'React Native', 'Mobile Development', 1, 21, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='React Native');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Flutter', 'Mobile Development', 1, 22, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Flutter');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'iOS', 'Mobile Development', 1, 23, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='iOS');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Android', 'Mobile Development', 1, 24, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Android');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Kotlin', 'Mobile Development', 1, 25, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Kotlin');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Firebase', 'Mobile Development', 1, 26, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Firebase');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'UI Design', 'Design', 1, 27, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='UI Design');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'UX Research', 'Design', 1, 28, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='UX Research');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Adobe XD', 'Design', 1, 29, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Adobe XD');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Sketch', 'Design', 1, 30, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Sketch');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Prototyping', 'Design', 1, 31, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Prototyping');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Design Systems', 'Design', 1, 32, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Design Systems');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'SQL', 'Data Science', 1, 33, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='SQL');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Deep Learning', 'Data Science', 1, 34, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Deep Learning');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'TensorFlow', 'Data Science', 1, 35, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='TensorFlow');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'PyTorch', 'Data Science', 1, 36, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='PyTorch');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Data Visualization', 'Data Science', 1, 37, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Data Visualization');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Tableau', 'Data Science', 1, 38, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Tableau');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Power BI', 'Data Science', 1, 39, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Power BI');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'R', 'Data Science', 1, 40, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='R');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Spark', 'Data Science', 1, 41, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Spark');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Technical Writing', 'Writing', 1, 42, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Technical Writing');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Copywriting', 'Writing', 1, 43, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Copywriting');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Blog Writing', 'Writing', 1, 44, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Blog Writing');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Documentation', 'Writing', 1, 45, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Documentation');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Digital Marketing', 'Marketing', 1, 46, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Digital Marketing');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Social Media Marketing', 'Marketing', 1, 47, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Social Media Marketing');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Content Marketing', 'Marketing', 1, 48, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Content Marketing');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Email Marketing', 'Marketing', 1, 49, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Email Marketing');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Analytics', 'Marketing', 1, 50, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Analytics');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Google Ads', 'Marketing', 1, 51, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Google Ads');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'PPC', 'Marketing', 1, 52, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='PPC');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Kubernetes', 'Cloud & DevOps', 1, 53, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Kubernetes');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Terraform', 'Cloud & DevOps', 1, 54, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Terraform');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'CI/CD', 'Cloud & DevOps', 1, 55, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='CI/CD');
INSERT INTO skills (name, category, is_active, sort_order, created_at, updated_at)
  SELECT 'Framer', 'Design', 1, 56, datetime('now'), datetime('now') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Framer');


-- 3. USER SKILLS (link freelancers to skills)
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 5, id, 5, 8, 1, datetime('now'), datetime('now') FROM skills WHERE name='React' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=5 AND skill_id=(SELECT id FROM skills WHERE name='React'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 5, id, 5, 7, 1, datetime('now'), datetime('now') FROM skills WHERE name='Node.js' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=5 AND skill_id=(SELECT id FROM skills WHERE name='Node.js'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 5, id, 5, 6, 1, datetime('now'), datetime('now') FROM skills WHERE name='Python' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=5 AND skill_id=(SELECT id FROM skills WHERE name='Python'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 5, id, 4, 5, 1, datetime('now'), datetime('now') FROM skills WHERE name='TypeScript' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=5 AND skill_id=(SELECT id FROM skills WHERE name='TypeScript'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 5, id, 4, 6, 0, datetime('now'), datetime('now') FROM skills WHERE name='PostgreSQL' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=5 AND skill_id=(SELECT id FROM skills WHERE name='PostgreSQL'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 5, id, 4, 4, 1, datetime('now'), datetime('now') FROM skills WHERE name='AWS' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=5 AND skill_id=(SELECT id FROM skills WHERE name='AWS'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 5, id, 4, 5, 0, datetime('now'), datetime('now') FROM skills WHERE name='Docker' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=5 AND skill_id=(SELECT id FROM skills WHERE name='Docker'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 5, id, 4, 3, 1, datetime('now'), datetime('now') FROM skills WHERE name='Next.js' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=5 AND skill_id=(SELECT id FROM skills WHERE name='Next.js'));

INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 6, id, 5, 6, 1, datetime('now'), datetime('now') FROM skills WHERE name='Figma' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=6 AND skill_id=(SELECT id FROM skills WHERE name='Figma'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 6, id, 5, 6, 1, datetime('now'), datetime('now') FROM skills WHERE name='UI Design' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=6 AND skill_id=(SELECT id FROM skills WHERE name='UI Design'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 6, id, 5, 6, 1, datetime('now'), datetime('now') FROM skills WHERE name='UX Research' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=6 AND skill_id=(SELECT id FROM skills WHERE name='UX Research'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 6, id, 5, 4, 1, datetime('now'), datetime('now') FROM skills WHERE name='Design Systems' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=6 AND skill_id=(SELECT id FROM skills WHERE name='Design Systems'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 6, id, 4, 5, 0, datetime('now'), datetime('now') FROM skills WHERE name='Sketch' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=6 AND skill_id=(SELECT id FROM skills WHERE name='Sketch'));

INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 7, id, 5, 5, 1, datetime('now'), datetime('now') FROM skills WHERE name='SEO' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=7 AND skill_id=(SELECT id FROM skills WHERE name='SEO'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 7, id, 5, 5, 1, datetime('now'), datetime('now') FROM skills WHERE name='Technical Writing' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=7 AND skill_id=(SELECT id FROM skills WHERE name='Technical Writing'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 7, id, 5, 5, 1, datetime('now'), datetime('now') FROM skills WHERE name='Copywriting' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=7 AND skill_id=(SELECT id FROM skills WHERE name='Copywriting'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 7, id, 5, 5, 1, datetime('now'), datetime('now') FROM skills WHERE name='Blog Writing' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=7 AND skill_id=(SELECT id FROM skills WHERE name='Blog Writing'));

INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 8, id, 5, 7, 1, datetime('now'), datetime('now') FROM skills WHERE name='Digital Marketing' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=8 AND skill_id=(SELECT id FROM skills WHERE name='Digital Marketing'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 8, id, 5, 6, 1, datetime('now'), datetime('now') FROM skills WHERE name='SEO' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=8 AND skill_id=(SELECT id FROM skills WHERE name='SEO'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 8, id, 5, 6, 1, datetime('now'), datetime('now') FROM skills WHERE name='Google Ads' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=8 AND skill_id=(SELECT id FROM skills WHERE name='Google Ads'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 8, id, 4, 4, 0, datetime('now'), datetime('now') FROM skills WHERE name='Analytics' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=8 AND skill_id=(SELECT id FROM skills WHERE name='Analytics'));

INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 9, id, 5, 6, 1, datetime('now'), datetime('now') FROM skills WHERE name='Python' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=9 AND skill_id=(SELECT id FROM skills WHERE name='Python'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 9, id, 5, 5, 1, datetime('now'), datetime('now') FROM skills WHERE name='Machine Learning' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=9 AND skill_id=(SELECT id FROM skills WHERE name='Machine Learning'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 9, id, 5, 5, 1, datetime('now'), datetime('now') FROM skills WHERE name='Tableau' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=9 AND skill_id=(SELECT id FROM skills WHERE name='Tableau'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 9, id, 4, 4, 0, datetime('now'), datetime('now') FROM skills WHERE name='Power BI' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=9 AND skill_id=(SELECT id FROM skills WHERE name='Power BI'));
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, created_at, updated_at)
  SELECT 9, id, 4, 4, 1, datetime('now'), datetime('now') FROM skills WHERE name='TensorFlow' AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=9 AND skill_id=(SELECT id FROM skills WHERE name='TensorFlow'));


-- 4. USER VERIFICATIONS
INSERT OR REPLACE INTO user_verifications (user_id, kyc_status, identity_doc_url, company_name, company_reg_number, tax_id, verified_at, updated_at) VALUES
  (2, 'approved', '/documents/kyc/client1_id.pdf', 'TechNova Solutions Inc.', 'DE-2019-4582761', 'US-EIN-82-1234567', datetime('now', '-90 days'), datetime('now')),
  (3, 'approved', '/documents/kyc/client2_id.pdf', 'InnovatePlus LLC', 'TX-2020-9283745', 'US-EIN-47-9876543', datetime('now', '-60 days'), datetime('now')),
  (4, 'approved', '/documents/kyc/client3_id.pdf', 'GlobalTech Enterprises', 'NY-2018-1837264', 'US-EIN-31-5678901', datetime('now', '-120 days'), datetime('now')),
  (5, 'approved', '/documents/kyc/freelancer1_id.pdf', NULL, NULL, 'UK-UTR-1234567890', datetime('now', '-180 days'), datetime('now')),
  (6, 'approved', '/documents/kyc/freelancer2_id.pdf', NULL, NULL, 'US-SSN-XXX-XX-1234', datetime('now', '-150 days'), datetime('now')),
  (7, 'pending', '/documents/kyc/freelancer3_id.pdf', NULL, NULL, NULL, NULL, datetime('now')),
  (9, 'approved', '/documents/kyc/freelancer5_id.pdf', NULL, NULL, 'SG-UEN-202012345A', datetime('now', '-45 days'), datetime('now'));


-- 5. NEW PROJECTS
INSERT INTO projects (title, description, category, budget_type, budget_min, budget_max, experience_level, estimated_duration, skills, client_id, status, created_at, updated_at) VALUES
  ('Enterprise CRM Dashboard', 'Build a comprehensive CRM dashboard with customer management, sales pipeline tracking, analytics reporting, and team collaboration features. Must integrate with Salesforce API.', 'Web Development', 'Fixed', 15000, 25000, 'Expert', '2-4 months', 'React,Node.js,PostgreSQL,Redis,REST APIs', 2, 'open', datetime('now', '-5 days'), datetime('now', '-5 days')),
  ('Mobile Health Tracker App', 'Develop a cross-platform health tracking app with step counting, calorie tracking, sleep monitoring, and medication reminders. Must integrate with Apple HealthKit and Google Fit.', 'Mobile Development', 'Fixed', 20000, 35000, 'Expert', '3-5 months', 'React Native,Firebase,iOS,Android,REST APIs', 2, 'open', datetime('now', '-3 days'), datetime('now', '-3 days')),
  ('Company Website Redesign', 'Complete redesign of corporate website. New homepage, about page, services, blog, careers, and contact form. Focus on conversion optimization, SEO, and mobile-first design.', 'Design', 'Fixed', 5000, 8000, 'Intermediate', '4-6 weeks', 'UI Design,Figma,React,Next.js,SEO', 2, 'in_progress', datetime('now', '-30 days'), datetime('now', '-2 days')),
  ('API Documentation and Technical Writing', 'Write comprehensive API documentation for our REST API with 200+ endpoints. Includes getting started guide, authentication docs, endpoint reference, webhook docs, and code samples in 5 languages.', 'Content Writing', 'Hourly', 40, 70, 'Intermediate', '2-3 months', 'Technical Writing,API Documentation,Documentation,REST APIs', 2, 'in_progress', datetime('now', '-45 days'), datetime('now', '-1 days')),
  ('SEO and Content Marketing Strategy', 'Develop and execute a 6-month SEO and content marketing strategy. Competitor analysis, keyword research, content calendar, 30 blog posts, landing page optimization, and monthly performance reports.', 'Digital Marketing', 'Fixed', 8000, 12000, 'Intermediate', '6 months', 'SEO,Content Marketing,Blog Writing,Analytics,Digital Marketing', 2, 'open', datetime('now', '-7 days'), datetime('now', '-7 days')),
  ('Data Pipeline and Analytics Platform', 'Build an automated data pipeline to ingest data from 10+ sources, transform and clean it, and load into a data warehouse. Include a Tableau dashboard for executive reporting.', 'Data Science', 'Fixed', 18000, 30000, 'Expert', '3-4 months', 'Python,SQL,Tableau,AWS,Spark,Data Visualization', 2, 'open', datetime('now', '-1 days'), datetime('now', '-1 days')),
  ('Legacy System Migration to Cloud', 'Migrate a legacy .NET monolith to microservices on AWS. Database migration, API redesign, CI/CD pipeline setup, and Kubernetes deployment.', 'Cloud & DevOps', 'Fixed', 35000, 50000, 'Expert', '4-6 months', 'AWS,Docker,Kubernetes,PostgreSQL,CI/CD,Terraform', 2, 'completed', datetime('now', '-180 days'), datetime('now', '-30 days')),
  ('E-commerce Recommendation Engine', 'Build an ML-powered product recommendation engine. Collaborative filtering, content-based recommendations, and hybrid approach. Must handle 5M+ products and serve in less than 100ms.', 'Data Science', 'Fixed', 22000, 35000, 'Expert', '3-4 months', 'Python,Machine Learning,TensorFlow,PostgreSQL,Redis', 2, 'completed', datetime('now', '-200 days'), datetime('now', '-60 days')),
  ('Telemedicine App MVP', 'Build an MVP for a telemedicine platform with video consultations, appointment scheduling, prescription management, patient records, and payment integration. HIPAA-compliant.', 'Mobile Development', 'Fixed', 25000, 40000, 'Expert', '3-5 months', 'React Native,FastAPI,Python,PostgreSQL,Firebase', 3, 'in_progress', datetime('now', '-60 days'), datetime('now', '-3 days')),
  ('Healthcare Analytics Dashboard', 'Interactive dashboard for healthcare KPIs: patient satisfaction, wait times, treatment outcomes, resource utilization. Real-time data from multiple hospital systems.', 'Data Science', 'Fixed', 15000, 22000, 'Expert', '2-3 months', 'Python,Tableau,SQL,Data Visualization,Power BI', 3, 'open', datetime('now', '-10 days'), datetime('now', '-10 days')),
  ('Blockchain Supply Chain Tracker', 'Develop a blockchain-based supply chain tracking system with smart contracts. Features: product provenance, QR code scanning, temperature monitoring, and compliance reporting.', 'Blockchain', 'Fixed', 30000, 45000, 'Expert', '4-6 months', 'Python,React,Node.js,PostgreSQL,Docker', 4, 'open', datetime('now', '-8 days'), datetime('now', '-8 days')),
  ('Corporate Training LMS', 'Build a Learning Management System for employee training. Course creation, video hosting, quizzes, progress tracking, certifications, and manager reporting. Must support 10K+ concurrent users.', 'Web Development', 'Fixed', 20000, 32000, 'Expert', '3-5 months', 'React,Node.js,PostgreSQL,AWS,Redis', 4, 'in_progress', datetime('now', '-75 days'), datetime('now', '-5 days'));


-- 6. PROPOSALS
INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, is_draft, created_at, updated_at)
SELECT p.id, 5, 'Hi John, I am very excited about this project! With 8+ years of full-stack development experience, I have built several similar CRM systems. I am proficient in your entire tech stack and can start immediately.', 19500.00, 230, 85.0, 'immediate', 'submitted', 0, datetime('now', '-4 days'), datetime('now', '-4 days')
FROM projects p WHERE p.title = 'Enterprise CRM Dashboard' AND p.client_id = 2;

INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, is_draft, created_at, updated_at)
SELECT p.id, 5, 'The Data Pipeline project caught my attention. I have extensive experience building ETL pipelines with Python, Apache Spark, and AWS services. I recently completed a similar project processing 15M records daily.', 24000.00, 280, 85.0, 'immediate', 'submitted', 0, datetime('now'), datetime('now')
FROM projects p WHERE p.title = 'Data Pipeline and Analytics Platform' AND p.client_id = 2;

INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, is_draft, created_at, updated_at)
SELECT p.id, 5, 'I would be thrilled to redesign your company website. I have strong frontend skills in React and Next.js with a keen eye for modern design. Check my portfolio for similar corporate redesign projects.', 6500.00, 76, 85.0, 'immediate', 'accepted', 0, datetime('now', '-28 days'), datetime('now', '-25 days')
FROM projects p WHERE p.title = 'Company Website Redesign' AND p.client_id = 2;

INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, is_draft, created_at, updated_at)
SELECT p.id, 6, 'Hello! As a UI/UX designer with 6 years of experience, your CRM dashboard project is right in my wheelhouse. I specialize in enterprise SaaS interfaces and have designed dashboards used by 100K+ users.', 21000.00, 280, 75.0, 'immediate', 'submitted', 0, datetime('now', '-3 days'), datetime('now', '-3 days')
FROM projects p WHERE p.title = 'Enterprise CRM Dashboard' AND p.client_id = 2;

INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, is_draft, created_at, updated_at)
SELECT p.id, 6, 'I would love to help redesign your corporate website! My design-first approach ensures beautiful, usable interfaces. I have helped businesses increase their conversion rates by 40%+ through thoughtful UI redesigns.', 7200.00, 96, 75.0, '1-2_weeks', 'rejected', 0, datetime('now', '-29 days'), datetime('now', '-26 days')
FROM projects p WHERE p.title = 'Company Website Redesign' AND p.client_id = 2;

INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, is_draft, created_at, updated_at)
SELECT p.id, 7, 'John, this is exactly the type of project I excel at! I have written API documentation for 10+ SaaS platforms. I can create clear, developer-friendly docs complete with code samples, interactive examples, and searchable references.', 9200.00, 168, 55.0, 'immediate', 'accepted', 0, datetime('now', '-43 days'), datetime('now', '-40 days')
FROM projects p WHERE p.title = 'API Documentation and Technical Writing' AND p.client_id = 2;

INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, is_draft, created_at, updated_at)
SELECT p.id, 7, 'I specialize in SEO content strategy and have helped 20+ companies increase organic traffic by 200%+. I can develop a comprehensive content calendar, write engaging blog posts with proper keyword optimization.', 10500.00, 190, 55.0, '1-2_weeks', 'submitted', 0, datetime('now', '-5 days'), datetime('now', '-5 days')
FROM projects p WHERE p.title = 'SEO and Content Marketing Strategy' AND p.client_id = 2;

INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, is_draft, created_at, updated_at)
SELECT p.id, 8, 'I have managed over $2M in ad spend with 300%+ ROAS. Your SEO and content marketing project is a perfect fit for my expertise.', 9800.00, 150, 65.0, 'immediate', 'submitted', 0, datetime('now', '-6 days'), datetime('now', '-6 days')
FROM projects p WHERE p.title = 'SEO and Content Marketing Strategy' AND p.client_id = 2;

INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, is_draft, created_at, updated_at)
SELECT p.id, 9, 'This project is a perfect match for my expertise! I built a similar recommendation engine that improved click-through rates by 35%.', 28000.00, 295, 95.0, 'immediate', 'submitted', 0, datetime('now', '-3 days'), datetime('now', '-3 days')
FROM projects p WHERE p.title = 'Data Pipeline and Analytics Platform' AND p.client_id = 2;

INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, is_draft, created_at, updated_at)
SELECT p.id, 9, 'Your healthcare analytics dashboard is exactly the kind of project I love. I have built similar dashboards for 3 healthcare organizations, all HIPAA-compliant.', 18500.00, 195, 95.0, 'immediate', 'submitted', 0, datetime('now', '-8 days'), datetime('now', '-8 days')
FROM projects p WHERE p.title = 'Healthcare Analytics Dashboard' AND p.client_id = 3;

INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_hours, hourly_rate, availability, status, is_draft, created_at, updated_at)
SELECT p.id, 5, 'Mike, the Corporate Training LMS sounds excellent. I have built 3 similar platforms with video streaming, quiz engines, and progress tracking. My experience with React and AWS ensures a scalable, reliable system.', 26000.00, 306, 85.0, '1-2_weeks', 'accepted', 0, datetime('now', '-70 days'), datetime('now', '-65 days')
FROM projects p WHERE p.title = 'Corporate Training LMS' AND p.client_id = 4;


-- 7. CONTRACTS
INSERT INTO contracts (contract_address, project_id, freelancer_id, client_id, amount, contract_amount, platform_fee, status, contract_type, currency, start_date, end_date, description, terms, created_at, updated_at)
SELECT 'MGL-CTR-WEB-' || p.id, p.id, 5, 2, 6500.00, 6500.00, 650.00, 'active', 'fixed', 'USD', datetime('now', '-25 days'), datetime('now', '+20 days'), 'Complete redesign of TechNova corporate website.', '{"payment_schedule": "milestone-based", "revisions": 3}', datetime('now', '-25 days'), datetime('now', '-2 days')
FROM projects p WHERE p.title = 'Company Website Redesign' AND p.client_id = 2;

INSERT INTO contracts (contract_address, project_id, freelancer_id, client_id, amount, contract_amount, platform_fee, status, contract_type, currency, hourly_rate, start_date, end_date, description, terms, created_at, updated_at)
SELECT 'MGL-CTR-DOC-' || p.id, p.id, 7, 2, 9200.00, 9200.00, 920.00, 'active', 'hourly', 'USD', 55.0, datetime('now', '-40 days'), datetime('now', '+50 days'), 'Comprehensive API documentation for 200+ REST endpoints.', '{"payment_schedule": "bi-weekly", "hours_cap": 168}', datetime('now', '-40 days'), datetime('now', '-1 days')
FROM projects p WHERE p.title = 'API Documentation and Technical Writing' AND p.client_id = 2;

INSERT INTO contracts (contract_address, project_id, freelancer_id, client_id, amount, contract_amount, platform_fee, status, contract_type, currency, start_date, end_date, description, terms, created_at, updated_at)
SELECT 'MGL-CTR-LMS-' || p.id, p.id, 5, 4, 26000.00, 26000.00, 2600.00, 'active', 'fixed', 'USD', datetime('now', '-65 days'), datetime('now', '+25 days'), 'Build a Learning Management System for employee training.', '{"payment_schedule": "milestone-based", "revisions": 2}', datetime('now', '-65 days'), datetime('now', '-5 days')
FROM projects p WHERE p.title = 'Corporate Training LMS' AND p.client_id = 4;

INSERT INTO contracts (contract_address, project_id, freelancer_id, client_id, amount, contract_amount, platform_fee, status, contract_type, currency, start_date, end_date, description, terms, created_at, updated_at)
SELECT 'MGL-CTR-MIG-' || p.id, p.id, 5, 2, 42000.00, 42000.00, 4200.00, 'completed', 'fixed', 'USD', datetime('now', '-175 days'), datetime('now', '-35 days'), 'Migrated legacy .NET monolith to AWS microservices.', '{"payment_schedule": "milestone-based"}', datetime('now', '-175 days'), datetime('now', '-30 days')
FROM projects p WHERE p.title = 'Legacy System Migration to Cloud' AND p.client_id = 2;

INSERT INTO contracts (contract_address, project_id, freelancer_id, client_id, amount, contract_amount, platform_fee, status, contract_type, currency, start_date, end_date, description, terms, created_at, updated_at)
SELECT 'MGL-CTR-REC-' || p.id, p.id, 9, 2, 28500.00, 28500.00, 2850.00, 'completed', 'fixed', 'USD', datetime('now', '-195 days'), datetime('now', '-65 days'), 'ML-powered product recommendation engine for 5M+ products.', '{"payment_schedule": "milestone-based"}', datetime('now', '-195 days'), datetime('now', '-60 days')
FROM projects p WHERE p.title = 'E-commerce Recommendation Engine' AND p.client_id = 2;

INSERT INTO contracts (contract_address, project_id, freelancer_id, client_id, amount, contract_amount, platform_fee, status, contract_type, currency, start_date, end_date, description, terms, created_at, updated_at)
SELECT 'MGL-CTR-TEL-' || p.id, p.id, 9, 3, 32000.00, 32000.00, 3200.00, 'active', 'fixed', 'USD', datetime('now', '-55 days'), datetime('now', '+30 days'), 'HIPAA-compliant telemedicine platform MVP.', '{"payment_schedule": "milestone-based", "hipaa_compliant": true}', datetime('now', '-55 days'), datetime('now', '-3 days')
FROM projects p WHERE p.title = 'Telemedicine App MVP' AND p.client_id = 3;


-- 8. MILESTONES
-- Website Redesign (active)
INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'Design Mockups and Wireframes', 'High-fidelity mockups for all pages.', 1950.00, datetime('now', '-10 days'), 'approved', 1, datetime('now', '-14 days'), datetime('now', '-11 days'), datetime('now', '-10 days'), datetime('now', '-25 days'), datetime('now', '-10 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-WEB-%';

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Frontend Development', 'Implement all pages in Next.js with responsive design.', 2600.00, datetime('now', '+5 days'), 'in_progress', 2, datetime('now', '-25 days'), datetime('now', '-2 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-WEB-%';

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Testing and Launch', 'Cross-browser testing, performance optimization, and deployment.', 1950.00, datetime('now', '+20 days'), 'pending', 3, datetime('now', '-25 days'), datetime('now', '-25 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-WEB-%';

-- API Documentation (active hourly)
INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'API Structure and Getting Started Guide', 'Document API architecture, authentication, rate limiting, error codes.', 2300.00, datetime('now', '-20 days'), 'approved', 1, datetime('now', '-24 days'), datetime('now', '-21 days'), datetime('now', '-20 days'), datetime('now', '-40 days'), datetime('now', '-20 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-DOC-%';

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Core Endpoints Documentation', 'Document 100 most critical endpoints with code samples.', 3450.00, datetime('now', '+10 days'), 'in_progress', 2, datetime('now', '-40 days'), datetime('now', '-5 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-DOC-%';

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Advanced Endpoints and Webhooks', 'Document remaining endpoints, webhook events, and integration guides.', 2300.00, datetime('now', '+30 days'), 'pending', 3, datetime('now', '-40 days'), datetime('now', '-40 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-DOC-%';

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Interactive Examples and Final Review', 'API playground, SDK guides, and final editorial review.', 1150.00, datetime('now', '+50 days'), 'pending', 4, datetime('now', '-40 days'), datetime('now', '-40 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-DOC-%';

-- Corporate Training LMS (active)
INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'Architecture and Database Design', 'System architecture, database schema, API design document.', 5200.00, datetime('now', '-45 days'), 'approved', 1, datetime('now', '-48 days'), datetime('now', '-46 days'), datetime('now', '-45 days'), datetime('now', '-65 days'), datetime('now', '-45 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-LMS-%';

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'Course Management and Video Player', 'Course CRUD, video upload/streaming, content delivery.', 7800.00, datetime('now', '-20 days'), 'approved', 2, datetime('now', '-23 days'), datetime('now', '-21 days'), datetime('now', '-20 days'), datetime('now', '-65 days'), datetime('now', '-20 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-LMS-%';

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Quiz Engine and Progress Tracking', 'Quiz builder, auto-grading, progress dashboards, certifications.', 7800.00, datetime('now', '+5 days'), 'in_progress', 3, datetime('now', '-65 days'), datetime('now', '-5 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-LMS-%';

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Admin Panel and Load Testing', 'Manager reporting, admin controls, load testing for 10K users.', 5200.00, datetime('now', '+25 days'), 'pending', 4, datetime('now', '-65 days'), datetime('now', '-65 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-LMS-%';

-- Legacy Migration (completed)
INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'Architecture and Migration Plan', 'Detailed migration plan, microservice decomposition.', 8400.00, datetime('now', '-155 days'), 'paid', 1, datetime('now', '-158 days'), datetime('now', '-156 days'), datetime('now', '-155 days'), datetime('now', '-175 days'), datetime('now', '-155 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-MIG-%';

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'Database Migration and API Redesign', 'Migrate SQL Server to PostgreSQL, redesign REST APIs.', 12600.00, datetime('now', '-115 days'), 'paid', 2, datetime('now', '-118 days'), datetime('now', '-116 days'), datetime('now', '-115 days'), datetime('now', '-175 days'), datetime('now', '-115 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-MIG-%';

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'CI/CD Pipeline and Kubernetes Deployment', 'CI/CD with GitHub Actions, K8s cluster, monitoring.', 12600.00, datetime('now', '-70 days'), 'paid', 3, datetime('now', '-73 days'), datetime('now', '-71 days'), datetime('now', '-70 days'), datetime('now', '-175 days'), datetime('now', '-70 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-MIG-%';

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'Zero-Downtime Cutover and Monitoring', 'Execute cutover, set up alerts, handoff documentation.', 8400.00, datetime('now', '-38 days'), 'paid', 4, datetime('now', '-40 days'), datetime('now', '-38 days'), datetime('now', '-37 days'), datetime('now', '-175 days'), datetime('now', '-37 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-MIG-%';

-- Recommendation Engine (completed)
INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'Data Analysis and Model Selection', 'Analyze product catalog, evaluate algorithms.', 7125.00, datetime('now', '-170 days'), 'paid', 1, datetime('now', '-173 days'), datetime('now', '-171 days'), datetime('now', '-170 days'), datetime('now', '-195 days'), datetime('now', '-170 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-REC-%';

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'Model Training and API Development', 'Train models, build REST API for real-time recommendations.', 11400.00, datetime('now', '-120 days'), 'paid', 2, datetime('now', '-123 days'), datetime('now', '-121 days'), datetime('now', '-120 days'), datetime('now', '-195 days'), datetime('now', '-120 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-REC-%';

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'A/B Testing and Production Deployment', 'Run A/B tests, optimize latency, deploy to production.', 9975.00, datetime('now', '-68 days'), 'paid', 3, datetime('now', '-70 days'), datetime('now', '-68 days'), datetime('now', '-67 days'), datetime('now', '-195 days'), datetime('now', '-67 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-REC-%';

-- Telemedicine (active)
INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, submitted_at, approved_at, paid_at, created_at, updated_at)
SELECT c.id, 'Backend Architecture and Auth', 'FastAPI backend, PostgreSQL schema, authentication and HIPAA audit.', 8000.00, datetime('now', '-30 days'), 'approved', 1, datetime('now', '-33 days'), datetime('now', '-31 days'), datetime('now', '-30 days'), datetime('now', '-55 days'), datetime('now', '-30 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-TEL-%';

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Video Consultations and Scheduling', 'WebRTC video calls, appointment scheduling, notifications.', 12000.00, datetime('now', '+10 days'), 'in_progress', 2, datetime('now', '-55 days'), datetime('now', '-3 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-TEL-%';

INSERT INTO milestones (contract_id, title, description, amount, due_date, status, order_index, created_at, updated_at)
SELECT c.id, 'Prescriptions, Records, and Payment', 'Prescription management, patient records, Stripe integration.', 12000.00, datetime('now', '+30 days'), 'pending', 3, datetime('now', '-55 days'), datetime('now', '-55 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-TEL-%';


-- 9. PAYMENTS
-- Legacy Migration milestone payments (Alice id=5)
INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, payment_type, payment_method, status, transaction_id, platform_fee, freelancer_amount, description, processed_at, created_at, updated_at)
SELECT c.id, m.id, 2, 5, m.amount, 'milestone', 'platform', 'completed', 'TXN-MIG-' || m.order_index, m.amount * 0.1, m.amount * 0.9, 'Payment: ' || m.title, m.paid_at, m.paid_at, m.paid_at
FROM contracts c JOIN milestones m ON m.contract_id = c.id WHERE c.contract_address LIKE 'MGL-CTR-MIG-%' AND m.status = 'paid';

-- Recommendation Engine milestone payments (Eve id=9)
INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, payment_type, payment_method, status, transaction_id, platform_fee, freelancer_amount, description, processed_at, created_at, updated_at)
SELECT c.id, m.id, 2, 9, m.amount, 'milestone', 'platform', 'completed', 'TXN-REC-' || m.order_index, m.amount * 0.1, m.amount * 0.9, 'Payment: ' || m.title, m.paid_at, m.paid_at, m.paid_at
FROM contracts c JOIN milestones m ON m.contract_id = c.id WHERE c.contract_address LIKE 'MGL-CTR-REC-%' AND m.status = 'paid';

-- Website Redesign M1 payment
INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, payment_type, payment_method, status, transaction_id, platform_fee, freelancer_amount, description, processed_at, created_at, updated_at)
SELECT c.id, m.id, 2, 5, 1950.00, 'milestone', 'platform', 'completed', 'TXN-WEB-M1', 195.00, 1755.00, 'Payment: Design Mockups', datetime('now', '-10 days'), datetime('now', '-10 days'), datetime('now', '-10 days')
FROM contracts c JOIN milestones m ON m.contract_id = c.id WHERE c.contract_address LIKE 'MGL-CTR-WEB-%' AND m.order_index = 1;

-- API Docs M1 payment
INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, payment_type, payment_method, status, transaction_id, platform_fee, freelancer_amount, description, processed_at, created_at, updated_at)
SELECT c.id, m.id, 2, 7, 2300.00, 'milestone', 'platform', 'completed', 'TXN-DOC-M1', 230.00, 2070.00, 'Payment: API Getting Started Guide', datetime('now', '-20 days'), datetime('now', '-20 days'), datetime('now', '-20 days')
FROM contracts c JOIN milestones m ON m.contract_id = c.id WHERE c.contract_address LIKE 'MGL-CTR-DOC-%' AND m.order_index = 1;

-- LMS approved milestone payments
INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, payment_type, payment_method, status, transaction_id, platform_fee, freelancer_amount, description, processed_at, created_at, updated_at)
SELECT c.id, m.id, 4, 5, m.amount, 'milestone', 'platform', 'completed', 'TXN-LMS-' || m.order_index, m.amount * 0.1, m.amount * 0.9, 'Payment: ' || m.title, m.paid_at, m.paid_at, m.paid_at
FROM contracts c JOIN milestones m ON m.contract_id = c.id WHERE c.contract_address LIKE 'MGL-CTR-LMS-%' AND m.status = 'approved';

-- Telemedicine M1 payment
INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, payment_type, payment_method, status, transaction_id, platform_fee, freelancer_amount, description, processed_at, created_at, updated_at)
SELECT c.id, m.id, 3, 9, 8000.00, 'milestone', 'platform', 'completed', 'TXN-TEL-M1', 800.00, 7200.00, 'Payment: Backend Architecture', datetime('now', '-30 days'), datetime('now', '-30 days'), datetime('now', '-30 days')
FROM contracts c JOIN milestones m ON m.contract_id = c.id WHERE c.contract_address LIKE 'MGL-CTR-TEL-%' AND m.order_index = 1;

-- Deposit and withdrawal
INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, payment_type, payment_method, status, transaction_id, platform_fee, freelancer_amount, description, processed_at, created_at, updated_at)
VALUES (NULL, NULL, 2, 2, 25000.00, 'deposit', 'platform', 'completed', 'TXN-DEP-C1', 0, 0, 'Account balance top-up via credit card', datetime('now', '-90 days'), datetime('now', '-90 days'), datetime('now', '-90 days'));

INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, payment_type, payment_method, status, transaction_id, platform_fee, freelancer_amount, description, processed_at, created_at, updated_at)
VALUES (NULL, NULL, 5, 5, 15000.00, 'withdrawal', 'platform', 'completed', 'TXN-WDR-F1', 25.00, 14975.00, 'Withdrawal to bank account (Barclays UK)', datetime('now', '-15 days'), datetime('now', '-15 days'), datetime('now', '-15 days'));

INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, payment_type, payment_method, status, transaction_id, platform_fee, freelancer_amount, description, processed_at, created_at, updated_at)
VALUES (NULL, NULL, 9, 9, 8000.00, 'withdrawal', 'platform', 'pending', 'TXN-WDR-F5', 25.00, 7975.00, 'Withdrawal to bank account (DBS Singapore)', NULL, datetime('now', '-2 days'), datetime('now', '-2 days'));


-- 10. ESCROW
INSERT INTO escrow (contract_id, client_id, amount, status, released_amount, released_at, expires_at, created_at, updated_at)
SELECT c.id, 2, 6500.00, 'active', 1950.00, datetime('now', '-10 days'), datetime('now', '+60 days'), datetime('now', '-25 days'), datetime('now', '-10 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-WEB-%';

INSERT INTO escrow (contract_id, client_id, amount, status, released_amount, released_at, expires_at, created_at, updated_at)
SELECT c.id, 2, 9200.00, 'active', 2300.00, datetime('now', '-20 days'), datetime('now', '+90 days'), datetime('now', '-40 days'), datetime('now', '-20 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-DOC-%';

INSERT INTO escrow (contract_id, client_id, amount, status, released_amount, released_at, expires_at, created_at, updated_at)
SELECT c.id, 4, 26000.00, 'active', 13000.00, datetime('now', '-20 days'), datetime('now', '+60 days'), datetime('now', '-65 days'), datetime('now', '-20 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-LMS-%';

INSERT INTO escrow (contract_id, client_id, amount, status, released_amount, released_at, expires_at, created_at, updated_at)
SELECT c.id, 3, 32000.00, 'active', 8000.00, datetime('now', '-30 days'), datetime('now', '+60 days'), datetime('now', '-55 days'), datetime('now', '-30 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-TEL-%';


-- 11. INVOICES
INSERT INTO invoices (invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total, due_date, paid_date, status, items, notes, created_at, updated_at)
SELECT 'INV-2026-0101', c.id, 5, 2, 1950.00, 0, 1950.00, datetime('now', '-8 days'), datetime('now', '-10 days'), 'paid', '[{"description": "Design Mockups", "amount": 1950}]', 'Payment for completed milestone 1.', datetime('now', '-12 days'), datetime('now', '-10 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-WEB-%';

INSERT INTO invoices (invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total, due_date, paid_date, status, items, notes, created_at, updated_at)
SELECT 'INV-2026-0102', c.id, 7, 2, 2300.00, 0, 2300.00, datetime('now', '-18 days'), datetime('now', '-20 days'), 'paid', '[{"description": "API Getting Started Guide", "amount": 2300}]', 'First milestone payment.', datetime('now', '-22 days'), datetime('now', '-20 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-DOC-%';

INSERT INTO invoices (invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total, due_date, status, items, notes, created_at, updated_at)
SELECT 'INV-2026-0103', c.id, 5, 4, 7800.00, 0, 7800.00, datetime('now', '+15 days'), 'pending', '[{"description": "Quiz Engine and Progress Tracking", "amount": 7800}]', 'Milestone 3 in progress.', datetime('now', '-3 days'), datetime('now', '-3 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-LMS-%';

INSERT INTO invoices (invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total, due_date, paid_date, status, items, notes, created_at, updated_at)
SELECT 'INV-2025-0050', c.id, 5, 2, 42000.00, 0, 42000.00, datetime('now', '-32 days'), datetime('now', '-35 days'), 'paid', '[{"description": "Legacy System Migration - All Milestones", "amount": 42000}]', 'Final invoice for completed project.', datetime('now', '-36 days'), datetime('now', '-35 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-MIG-%';

INSERT INTO invoices (invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total, due_date, status, items, notes, created_at, updated_at)
SELECT 'INV-2026-0104', c.id, 7, 2, 3450.00, 0, 3450.00, datetime('now', '-3 days'), 'overdue', '[{"description": "Core Endpoints Documentation", "amount": 3450}]', 'Milestone 2 documentation.', datetime('now', '-10 days'), datetime('now', '-3 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-DOC-%';

INSERT INTO invoices (invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total, due_date, paid_date, status, items, notes, created_at, updated_at)
SELECT 'INV-2025-0045', c.id, 9, 2, 28500.00, 0, 28500.00, datetime('now', '-62 days'), datetime('now', '-65 days'), 'paid', '[{"description": "Recommendation Engine - All Milestones", "amount": 28500}]', 'Final invoice for completed project.', datetime('now', '-66 days'), datetime('now', '-65 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-REC-%';


-- 12. REVIEWS
INSERT INTO reviews (contract_id, reviewer_id, reviewee_id, rating, comment, is_public, created_at, updated_at)
SELECT c.id, 2, 5, 5.0, 'Alice is an exceptional developer! She migrated our entire legacy system to AWS microservices without any downtime. Her technical expertise and communication are top-notch. Highly recommended!', 1, datetime('now', '-30 days'), datetime('now', '-30 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-MIG-%';

INSERT INTO reviews (contract_id, reviewer_id, reviewee_id, rating, comment, is_public, created_at, updated_at)
SELECT c.id, 5, 2, 5.0, 'John is a fantastic client. Clear requirements, prompt feedback, and always available. Payment was always on time. Would love to work with TechNova again!', 1, datetime('now', '-29 days'), datetime('now', '-29 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-MIG-%';

INSERT INTO reviews (contract_id, reviewer_id, reviewee_id, rating, comment, is_public, created_at, updated_at)
SELECT c.id, 2, 9, 4.8, 'Eve delivered an outstanding recommendation engine that improved our conversion rate by 28%. Her ML expertise is impressive. The system handles 5M+ products with sub-100ms response times!', 1, datetime('now', '-60 days'), datetime('now', '-60 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-REC-%';

INSERT INTO reviews (contract_id, reviewer_id, reviewee_id, rating, comment, is_public, created_at, updated_at)
SELECT c.id, 9, 2, 4.9, 'Working with John on the recommendation engine was a great experience. He provided excellent data and was very responsive. Top-tier client on this platform.', 1, datetime('now', '-59 days'), datetime('now', '-59 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-REC-%';


-- 13. CONVERSATIONS AND MESSAGES
INSERT INTO conversations (client_id, freelancer_id, title, status, is_archived, last_message_at, created_at, updated_at) VALUES
  (2, 5, 'Company Website Redesign Discussion', 'active', 0, datetime('now', '-1 days'), datetime('now', '-25 days'), datetime('now', '-1 days')),
  (2, 7, 'API Documentation Progress Update', 'active', 0, datetime('now', '-2 days'), datetime('now', '-40 days'), datetime('now', '-2 days')),
  (4, 5, 'Corporate Training LMS Sprint Review', 'active', 0, datetime('now', '-3 days'), datetime('now', '-65 days'), datetime('now', '-3 days')),
  (2, 9, 'Recommendation Engine Final Handoff', 'archived', 1, datetime('now', '-60 days'), datetime('now', '-195 days'), datetime('now', '-60 days')),
  (3, 9, 'Telemedicine App Progress', 'active', 0, datetime('now', '-3 days'), datetime('now', '-55 days'), datetime('now', '-3 days'));

-- Messages for Website Redesign conversation
INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, is_deleted, sent_at, created_at)
SELECT c.id, 2, 5, 'Hi Alice! I reviewed the new mockups and they look great. Love the hero section design. Can we make the CTA button a bit more prominent?', 'text', 1, 0, datetime('now', '-5 days'), datetime('now', '-5 days')
FROM conversations c WHERE c.title = 'Company Website Redesign Discussion' AND c.client_id = 2;

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, is_deleted, sent_at, created_at)
SELECT c.id, 5, 2, 'Thanks John! Absolutely, I will increase the CTA button size and add a subtle animation to draw attention. Updated version coming by end of day.', 'text', 1, 0, datetime('now', '-5 days'), datetime('now', '-5 days')
FROM conversations c WHERE c.title = 'Company Website Redesign Discussion' AND c.client_id = 2;

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, is_deleted, sent_at, created_at)
SELECT c.id, 5, 2, 'Here is the updated mockup with the larger CTA button and a pulse animation on hover. Let me know what you think!', 'text', 1, 0, datetime('now', '-4 days'), datetime('now', '-4 days')
FROM conversations c WHERE c.title = 'Company Website Redesign Discussion' AND c.client_id = 2;

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, is_deleted, sent_at, created_at)
SELECT c.id, 2, 5, 'Perfect! That looks much better. Approved! Let us move ahead with the frontend development.', 'text', 1, 0, datetime('now', '-4 days'), datetime('now', '-4 days')
FROM conversations c WHERE c.title = 'Company Website Redesign Discussion' AND c.client_id = 2;

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, is_deleted, sent_at, created_at)
SELECT c.id, 5, 2, 'Starting on the About page today! Services section done by Friday. Also, I noticed the blog template needs a sidebar for categories - should I include that?', 'text', 1, 0, datetime('now', '-3 days'), datetime('now', '-3 days')
FROM conversations c WHERE c.title = 'Company Website Redesign Discussion' AND c.client_id = 2;

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, is_deleted, sent_at, created_at)
SELECT c.id, 2, 5, 'Yes, please include a sidebar with categories and recent posts. Also add a newsletter subscription form at the bottom of blog posts.', 'text', 1, 0, datetime('now', '-3 days'), datetime('now', '-3 days')
FROM conversations c WHERE c.title = 'Company Website Redesign Discussion' AND c.client_id = 2;

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, is_deleted, sent_at, created_at)
SELECT c.id, 5, 2, 'Already implementing dynamic OG tags with Next.js metadata API. Preview images will auto-generate from page content. I will also add structured data for SEO.', 'text', 0, 0, datetime('now', '-1 days'), datetime('now', '-1 days')
FROM conversations c WHERE c.title = 'Company Website Redesign Discussion' AND c.client_id = 2;

-- Messages for API Documentation conversation
INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, is_deleted, sent_at, created_at)
SELECT c.id, 2, 7, 'Hi Carol, how is the documentation coming along? We have a developer conference next month and would love to showcase the new docs.', 'text', 1, 0, datetime('now', '-7 days'), datetime('now', '-7 days')
FROM conversations c WHERE c.title = 'API Documentation Progress Update' AND c.client_id = 2;

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, is_deleted, sent_at, created_at)
SELECT c.id, 7, 2, 'Great timing, John! I have completed 65 of the 100 core endpoints in milestone 2. Authentication and user management sections are fully documented with code samples in all 5 languages.', 'text', 1, 0, datetime('now', '-7 days'), datetime('now', '-7 days')
FROM conversations c WHERE c.title = 'API Documentation Progress Update' AND c.client_id = 2;

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, is_deleted, sent_at, created_at)
SELECT c.id, 2, 7, 'Please prioritize the payment processing and webhook endpoints. Those are the ones most developers ask about.', 'text', 1, 0, datetime('now', '-6 days'), datetime('now', '-6 days')
FROM conversations c WHERE c.title = 'API Documentation Progress Update' AND c.client_id = 2;

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, is_deleted, sent_at, created_at)
SELECT c.id, 7, 2, 'Update: Payment processing docs are complete with flow diagrams. Working on webhooks now. Here is a preview link to the staging docs.', 'text', 0, 0, datetime('now', '-2 days'), datetime('now', '-2 days')
FROM conversations c WHERE c.title = 'API Documentation Progress Update' AND c.client_id = 2;

-- Messages for LMS conversation
INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, is_deleted, sent_at, created_at)
SELECT c.id, 4, 5, 'Alice, the quiz engine demo was impressive! Can we add timed quizzes and configurable passing scores per course?', 'text', 1, 0, datetime('now', '-5 days'), datetime('now', '-5 days')
FROM conversations c WHERE c.title = 'Corporate Training LMS Sprint Review' AND c.client_id = 4;

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, is_deleted, sent_at, created_at)
SELECT c.id, 5, 4, 'Yes, both are straightforward to implement. I will add a timer with configurable per-quiz time limits and a passing score setting in the course admin panel. Included in the current milestone.', 'text', 1, 0, datetime('now', '-4 days'), datetime('now', '-4 days')
FROM conversations c WHERE c.title = 'Corporate Training LMS Sprint Review' AND c.client_id = 4;

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, is_deleted, sent_at, created_at)
SELECT c.id, 4, 5, 'Can certificates include a QR code for verification? Our HR team wants to verify certifications easily.', 'text', 1, 0, datetime('now', '-3 days'), datetime('now', '-3 days')
FROM conversations c WHERE c.title = 'Corporate Training LMS Sprint Review' AND c.client_id = 4;

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, is_deleted, sent_at, created_at)
SELECT c.id, 5, 4, 'Great idea! I will generate a unique QR code per certificate that links to a verification page showing employee name, course, score, and completion date.', 'text', 0, 0, datetime('now', '-3 days'), datetime('now', '-3 days')
FROM conversations c WHERE c.title = 'Corporate Training LMS Sprint Review' AND c.client_id = 4;


-- 14. NOTIFICATIONS
INSERT INTO notifications (user_id, notification_type, title, content, data, is_read, priority, action_url, created_at) VALUES
  (1, 'system_alert', 'New User Registration Spike', '15 new users registered in the last hour.', '{"count": 15}', 0, 'high', '/admin/users', datetime('now', '-2 hours')),
  (1, 'dispute_opened', 'New Dispute Requires Attention', 'A dispute has been opened and requires admin mediation.', '{"dispute_id": 1}', 0, 'urgent', '/admin/disputes', datetime('now', '-6 hours')),
  (1, 'payment_alert', 'Large Transaction Alert', 'A withdrawal of $15,000 has been processed.', '{"amount": 15000}', 1, 'medium', '/admin/payments', datetime('now', '-1 days')),
  (1, 'system_alert', 'Weekly Platform Report Ready', 'Weekly analytics: 42 new projects, 128 proposals, $89K in transactions.', NULL, 0, 'low', '/admin/analytics', datetime('now', '-3 days')),
  (2, 'new_proposal', 'New Proposal on CRM Dashboard', 'Alice Dev submitted a proposal for $19,500.', '{"freelancer": "Alice Dev"}', 0, 'medium', '/portal/client/projects', datetime('now', '-4 days')),
  (2, 'new_proposal', 'New Proposal on CRM Dashboard', 'Bob Design submitted a proposal for $21,000.', '{"freelancer": "Bob Design"}', 0, 'medium', '/portal/client/projects', datetime('now', '-3 days')),
  (2, 'milestone_submitted', 'Milestone Submitted for Review', 'Alice Dev submitted Frontend Development for Company Website Redesign.', NULL, 0, 'high', '/portal/client/contracts', datetime('now', '-2 days')),
  (2, 'new_message', 'New Message from Carol Writer', 'Carol sent an update on the API Documentation project.', NULL, 0, 'medium', '/portal/messages', datetime('now', '-2 days')),
  (2, 'payment_processed', 'Payment Processed Successfully', '$1,950 released to Alice Dev for Design Mockups.', '{"amount": 1950}', 1, 'low', '/portal/client/payments', datetime('now', '-10 days')),
  (2, 'contract_completed', 'Contract Completed', 'Legacy System Migration completed. Please leave a review!', NULL, 1, 'medium', '/portal/client/reviews', datetime('now', '-30 days')),
  (5, 'proposal_accepted', 'Proposal Accepted!', 'John Smith accepted your proposal for Company Website Redesign.', '{"amount": 6500}', 1, 'high', '/portal/freelancer/contracts', datetime('now', '-25 days')),
  (5, 'milestone_approved', 'Milestone Approved and Paid', 'Design Mockups milestone approved. $1,950 released to your account.', '{"amount": 1950}', 1, 'medium', '/portal/freelancer/earnings', datetime('now', '-10 days')),
  (5, 'new_message', 'New Message from John Smith', 'John sent a message about the Website Redesign project.', NULL, 0, 'medium', '/portal/messages', datetime('now', '-1 days')),
  (5, 'project_match', 'New Project Match: CRM Dashboard', 'A new project matching your skills has been posted ($15K-$25K).', NULL, 0, 'low', '/portal/freelancer/projects', datetime('now', '-5 days')),
  (5, 'payment_received', 'Payment Received', 'You received $37,800 for the Legacy System Migration project.', '{"amount": 37800}', 1, 'medium', '/portal/freelancer/earnings', datetime('now', '-30 days')),
  (5, 'withdrawal_completed', 'Withdrawal Processed', 'Your withdrawal of $15,000 to Barclays UK has been processed.', '{"amount": 15000}', 1, 'medium', '/portal/freelancer/earnings', datetime('now', '-15 days')),
  (5, 'review_received', 'New 5-Star Review!', 'John Smith left you a 5-star review on Legacy System Migration.', '{"rating": 5}', 1, 'low', '/portal/freelancer/reviews', datetime('now', '-30 days')),
  (5, 'contract_milestone_due', 'Milestone Due Soon', 'Frontend Development for Website Redesign is due in 5 days.', NULL, 0, 'high', '/portal/freelancer/contracts', datetime('now', '-1 days'));


-- 15. PORTFOLIO ITEMS - Enrich existing and add new
UPDATE portfolio_items SET title = 'Enterprise Cloud Migration - AWS Microservices', description = 'Led complete migration of a Fortune 500 legacy .NET monolith to AWS microservices. Reduced deployment time by 90% and infrastructure costs by 40%.', image_url = '/portfolio/alice-cloud-migration.jpg' WHERE id = 1;
UPDATE portfolio_items SET title = 'Real-time E-commerce Analytics Dashboard', description = 'Built a real-time analytics dashboard processing 2M+ events/day. Interactive charts, funnel analysis, cohort tracking, and automated alerting.', image_url = '/portfolio/alice-analytics-dashboard.jpg' WHERE id = 2;
UPDATE portfolio_items SET title = 'SaaS Design System - 100+ Components', description = 'Designed a comprehensive design system for a B2B SaaS platform used by 50K+ users. Includes atomic design principles, responsive patterns, dark mode support.', image_url = '/portfolio/bob-design-system.jpg' WHERE id = 3;
UPDATE portfolio_items SET title = 'Stripe API Documentation', description = 'Authored comprehensive documentation for a payment API. Developer guides, code samples in 6 languages, interactive playground. Reduced support tickets by 60%.', image_url = '/portfolio/carol-api-docs.jpg' WHERE id = 4;
UPDATE portfolio_items SET title = 'DeFi Protocol Marketing Campaign', description = 'Led a comprehensive digital marketing campaign for a DeFi protocol launch. Achieved 50K community members in 3 months, $10M TVL within first week.', image_url = '/portfolio/dan-defi-campaign.jpg' WHERE id = 5;
UPDATE portfolio_items SET title = 'ML Recommendation Engine - E-commerce', description = 'Built a hybrid recommendation engine combining collaborative filtering and deep learning. Improved click-through rates by 35% and revenue per user by 22%.', image_url = '/portfolio/eve-recommendation.jpg' WHERE id = 6;

INSERT INTO portfolio_items (freelancer_id, title, description, image_url, project_url, created_at, updated_at) VALUES
  (5, 'Open Source React Component Library', 'Created and maintain a React component library with 2.5K+ GitHub stars. 50+ accessible, themeable components with TypeScript support.', '/portfolio/alice-component-lib.jpg', 'https://github.com/alicedev/ui-components', datetime('now', '-120 days'), datetime('now', '-30 days')),
  (5, 'FinTech Payment Processing Platform', 'Architected a PCI-DSS compliant payment processing platform handling $50M+ monthly transactions with multi-currency support and fraud detection.', '/portfolio/alice-fintech.jpg', NULL, datetime('now', '-200 days'), datetime('now', '-100 days')),
  (5, 'Healthcare Patient Portal', 'HIPAA-compliant patient portal with appointment scheduling, medical records, telemedicine, and prescription management. Served 200K+ patients.', '/portfolio/alice-healthcare.jpg', NULL, datetime('now', '-150 days'), datetime('now', '-80 days')),
  (6, 'Mobile Banking App UI/UX', 'Complete UI/UX redesign for a mobile banking app serving 3M+ users. Reduced task completion time by 45%. Featured on Behance Curated.', '/portfolio/bob-banking-app.jpg', 'https://dribbble.com/bobdesign/banking-app', datetime('now', '-90 days'), datetime('now', '-60 days')),
  (6, 'E-commerce Checkout Optimization', 'Redesigned checkout flow for a fashion e-commerce platform. Reduced cart abandonment by 32% and increased average order value by 18%.', '/portfolio/bob-ecommerce.jpg', NULL, datetime('now', '-180 days'), datetime('now', '-150 days')),
  (7, 'SaaS Company Blog - 200+ Articles', 'Grew a SaaS company blog from 0 to 150K monthly visitors through strategic content planning and SEO optimization.', '/portfolio/carol-saas-blog.jpg', NULL, datetime('now', '-100 days'), datetime('now', '-50 days')),
  (8, 'SaaS Growth Campaign - 500% MRR Increase', 'Multi-channel growth strategy for a B2B SaaS startup. Google Ads, LinkedIn, content marketing. Achieved 500% MRR growth in 12 months.', '/portfolio/dan-saas-growth.jpg', NULL, datetime('now', '-60 days'), datetime('now', '-30 days')),
  (9, 'NLP Sentiment Analysis Pipeline', 'NLP pipeline analyzing 50K+ customer reviews daily. Multi-language support, entity extraction, trend detection. Integrated with Tableau dashboards.', '/portfolio/eve-nlp-pipeline.jpg', NULL, datetime('now', '-80 days'), datetime('now', '-40 days')),
  (9, 'Predictive Maintenance System - IoT', 'Predictive maintenance for industrial IoT sensors. Reduced equipment downtime by 45% using time-series analysis and anomaly detection.', '/portfolio/eve-iot-maintenance.jpg', NULL, datetime('now', '-130 days'), datetime('now', '-70 days'));


-- 16. DISPUTES
INSERT INTO disputes (contract_id, raised_by, dispute_type, description, evidence, status, assigned_to, created_at, updated_at) VALUES
  (1, 3, 'quality', 'The deliverables for milestone 2 have several bugs and the UI does not match the approved mockups. Multiple responsive design issues on mobile devices.', '["bug-report.pdf", "mobile-issues.png"]', 'in_review', 1, datetime('now', '-10 days'), datetime('now', '-8 days'));

INSERT INTO disputes (contract_id, raised_by, dispute_type, description, evidence, status, assigned_to, resolution, resolution_amount, resolved_at, created_at, updated_at) VALUES
  (4, 5, 'scope_change', 'Client requested significant additional features beyond the original scope without adjusting the budget. Chatbot integration now requires 3 additional API endpoints.', '["original-scope.pdf", "change-requests.pdf"]', 'resolved', 1, 'Agreed on additional $2,500 for the extra scope.', 2500.00, datetime('now', '-5 days'), datetime('now', '-15 days'), datetime('now', '-5 days'));


-- 17. TIME ENTRIES
INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 7, c.id, datetime('now', '-7 days', '+9 hours'), datetime('now', '-7 days', '+13 hours'), 240, 'Documented authentication endpoints. Created code samples for Python and JavaScript.', 1, 55.0, 220.00, 'approved', datetime('now', '-7 days'), datetime('now', '-7 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-DOC-%';

INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 7, c.id, datetime('now', '-6 days', '+10 hours'), datetime('now', '-6 days', '+16 hours'), 360, 'Documented user management and profile endpoints. Added Ruby and Go code samples.', 1, 55.0, 330.00, 'approved', datetime('now', '-6 days'), datetime('now', '-6 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-DOC-%';

INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 7, c.id, datetime('now', '-5 days', '+9 hours'), datetime('now', '-5 days', '+14 hours'), 300, 'Documented payment processing endpoints. Created flow diagrams.', 1, 55.0, 275.00, 'approved', datetime('now', '-5 days'), datetime('now', '-5 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-DOC-%';

INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 7, c.id, datetime('now', '-4 days', '+10 hours'), datetime('now', '-4 days', '+15 hours'), 300, 'Documented project and proposal endpoints. Added error code reference.', 1, 55.0, 275.00, 'approved', datetime('now', '-4 days'), datetime('now', '-4 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-DOC-%';

INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 7, c.id, datetime('now', '-3 days', '+9 hours'), datetime('now', '-3 days', '+12 hours'), 180, 'Documented webhook events and retry policies.', 1, 55.0, 165.00, 'pending', datetime('now', '-3 days'), datetime('now', '-3 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-DOC-%';

INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 7, c.id, datetime('now', '-2 days', '+10 hours'), datetime('now', '-2 days', '+15 hours'), 300, 'Completed payment docs. Started contract management endpoints.', 1, 55.0, 275.00, 'pending', datetime('now', '-2 days'), datetime('now', '-2 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-DOC-%';

INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 5, c.id, datetime('now', '-4 days', '+9 hours'), datetime('now', '-4 days', '+17 hours'), 480, 'Implemented quiz builder with MCQ, true/false, short answer, coding. Added timer.', 1, 85.0, 680.00, 'approved', datetime('now', '-4 days'), datetime('now', '-4 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-LMS-%';

INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 5, c.id, datetime('now', '-3 days', '+10 hours'), datetime('now', '-3 days', '+16 hours'), 360, 'Built auto-grading system and progress tracking dashboard.', 1, 85.0, 510.00, 'approved', datetime('now', '-3 days'), datetime('now', '-3 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-LMS-%';

INSERT INTO time_entries (user_id, contract_id, start_time, end_time, duration_minutes, description, billable, hourly_rate, amount, status, created_at, updated_at)
SELECT 5, c.id, datetime('now', '-2 days', '+9 hours'), datetime('now', '-2 days', '+14 hours'), 300, 'Working on certificate generation with QR code verification.', 1, 85.0, 425.00, 'pending', datetime('now', '-2 days'), datetime('now', '-2 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-LMS-%';


-- 18. FAVORITES
INSERT OR IGNORE INTO favorites (user_id, target_type, target_id, created_at) VALUES
  (2, 'user', 5, datetime('now', '-60 days')),
  (2, 'user', 6, datetime('now', '-45 days')),
  (2, 'user', 9, datetime('now', '-30 days')),
  (2, 'gig', 1, datetime('now', '-20 days')),
  (2, 'gig', 4, datetime('now', '-15 days'));

INSERT OR IGNORE INTO favorites (user_id, target_type, target_id, created_at)
SELECT 5, 'project', p.id, datetime('now', '-5 days')
FROM projects p WHERE p.title = 'Enterprise CRM Dashboard' AND p.client_id = 2;

INSERT OR IGNORE INTO favorites (user_id, target_type, target_id, created_at)
SELECT 5, 'project', p.id, datetime('now', '-1 days')
FROM projects p WHERE p.title = 'Data Pipeline and Analytics Platform' AND p.client_id = 2;

INSERT OR IGNORE INTO favorites (user_id, target_type, target_id, created_at)
SELECT 5, 'project', p.id, datetime('now', '-8 days')
FROM projects p WHERE p.title = 'Blockchain Supply Chain Tracker' AND p.client_id = 4;

INSERT OR IGNORE INTO favorites (user_id, target_type, target_id, created_at)
SELECT 9, 'project', p.id, datetime('now', '-10 days')
FROM projects p WHERE p.title = 'Healthcare Analytics Dashboard' AND p.client_id = 3;


-- 19. SUPPORT TICKETS
INSERT INTO support_tickets (user_id, subject, description, category, priority, status, assigned_to, created_at, updated_at) VALUES
  (5, 'Unable to download invoice PDF', 'When I click Download PDF on invoice INV-2025-0050, I get a blank page instead of the PDF file. This happens on both Chrome and Firefox.', 'billing', 'medium', 'in_progress', 1, datetime('now', '-3 days'), datetime('now', '-2 days')),
  (2, 'Escrow release delay for completed milestone', 'Milestone Design Mockups was approved 3 days ago but the escrow has not been released to the freelancer yet.', 'payment', 'high', 'open', 1, datetime('now', '-1 days'), datetime('now', '-1 days')),
  (7, 'Profile skills not displaying correctly', 'Some of my skills show as duplicates on my public profile page. I have SEO listed twice.', 'account', 'low', 'resolved', 1, datetime('now', '-10 days'), datetime('now', '-8 days')),
  (3, 'Feature Request: Bulk Milestone Approval', 'When a freelancer completes multiple milestones, I have to approve them one by one. A bulk approval option would be great.', 'feature_request', 'low', 'open', NULL, datetime('now', '-5 days'), datetime('now', '-5 days')),
  (9, 'Account verification taking too long', 'I submitted my KYC documents 2 weeks ago and the status is still pending.', 'verification', 'medium', 'resolved', 1, datetime('now', '-14 days'), datetime('now', '-12 days'));


-- 20. GIG ORDERS
INSERT INTO gig_orders (order_number, gig_id, buyer_id, seller_id, package_tier, package_title, package_description, quantity, base_price, service_fee, total_price, status, delivery_days, deadline, revisions_allowed, payment_status, created_at, updated_at) VALUES
  ('GIG-ORD-20260201', 1, 3, 5, 'standard', 'Full Stack Web App Standard', 'Complete web application with 5-8 pages and REST API.', 1, 500.00, 50.00, 550.00, 'in_progress', 14, datetime('now', '+10 days'), 2, 'paid', datetime('now', '-4 days'), datetime('now', '-4 days')),
  ('GIG-ORD-20260202', 1, 4, 5, 'premium', 'Full Stack Web App Premium', 'Enterprise web application with 10+ pages and microservices.', 1, 1200.00, 120.00, 1320.00, 'delivered', 21, datetime('now', '+5 days'), 3, 'paid', datetime('now', '-20 days'), datetime('now', '-2 days'));

INSERT INTO gig_orders (order_number, gig_id, buyer_id, seller_id, package_tier, package_title, package_description, quantity, base_price, service_fee, total_price, status, delivery_days, deadline, delivered_at, completed_at, revisions_allowed, revisions_used, payment_status, created_at, updated_at) VALUES
  ('GIG-ORD-20260105', 2, 2, 6, 'standard', 'UI/UX Design Standard', 'Complete UI/UX design for up to 10 screens with responsive layouts.', 1, 350.00, 35.00, 385.00, 'completed', 10, datetime('now', '-20 days'), datetime('now', '-22 days'), datetime('now', '-20 days'), 2, 1, 'released', datetime('now', '-30 days'), datetime('now', '-20 days'));

INSERT INTO gig_orders (order_number, gig_id, buyer_id, seller_id, package_tier, package_title, package_description, quantity, base_price, service_fee, total_price, status, delivery_days, deadline, revisions_allowed, payment_status, created_at, updated_at) VALUES
  ('GIG-ORD-20260210', 4, 2, 9, 'basic', 'Data Analysis Basic', 'Exploratory data analysis with visualizations and insights report.', 1, 180.00, 18.00, 198.00, 'in_progress', 7, datetime('now', '+5 days'), 1, 'paid', datetime('now', '-2 days'), datetime('now', '-2 days'));

INSERT INTO gig_orders (order_number, gig_id, buyer_id, seller_id, package_tier, package_title, package_description, quantity, base_price, service_fee, total_price, status, delivery_days, deadline, delivered_at, completed_at, revisions_allowed, revisions_used, payment_status, created_at, updated_at) VALUES
  ('GIG-ORD-20260108', 3, 3, 7, 'premium', 'SEO Content Premium', '10 SEO-optimized articles 2000+ words each with keyword research.', 1, 300.00, 30.00, 330.00, 'completed', 14, datetime('now', '-25 days'), datetime('now', '-27 days'), datetime('now', '-25 days'), 2, 0, 'released', datetime('now', '-40 days'), datetime('now', '-25 days'));


-- 21. GIG REVIEWS
INSERT INTO gig_reviews (order_id, gig_id, reviewer_id, seller_id, rating_communication, rating_service, rating_delivery, rating_recommendation, rating_overall, review_text, is_public, is_verified_purchase, created_at, updated_at)
SELECT go.id, 2, 2, 6, 5, 5, 5, 5, 5.0, 'Bob delivered exceptional UI/UX designs that exceeded our expectations. The wireframes were detailed and the prototype was polished. Highly recommend!', 1, 1, datetime('now', '-19 days'), datetime('now', '-19 days')
FROM gig_orders go WHERE go.order_number = 'GIG-ORD-20260105';

INSERT INTO gig_reviews (order_id, gig_id, reviewer_id, seller_id, rating_communication, rating_service, rating_delivery, rating_recommendation, rating_overall, review_text, seller_response, seller_responded_at, is_public, is_verified_purchase, created_at, updated_at)
SELECT go.id, 3, 3, 7, 5, 4, 5, 5, 4.75, 'Carol''s writing is top-notch! All 10 articles were well-researched and SEO-optimized. We already saw a 15% increase in organic traffic.', 'Thank you Sarah! It was a pleasure working on your health-tech content.', datetime('now', '-24 days'), 1, 1, datetime('now', '-24 days'), datetime('now', '-24 days')
FROM gig_orders go WHERE go.order_number = 'GIG-ORD-20260108';


-- 22. TAGS
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


-- 23. SCOPE CHANGE REQUESTS
INSERT INTO scope_change_requests (contract_id, requested_by, title, description, reason, status, old_amount, new_amount, old_deadline, new_deadline, created_at, updated_at)
SELECT c.id, 5, 'Additional pages: Blog and Careers section', 'The original scope included 4 pages. Client requested 2 additional sections (Blog with CMS and Careers page with job board integration).', 'Client expanded requirements after initial design approval.', 'approved', 6500.00, 8200.00, datetime('now', '+20 days'), datetime('now', '+35 days'), datetime('now', '-8 days'), datetime('now', '-6 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-WEB-%';

INSERT INTO scope_change_requests (contract_id, requested_by, title, description, reason, status, old_amount, new_amount, created_at, updated_at)
SELECT c.id, 4, 'Add mobile-responsive admin dashboard', 'Need the admin reporting dashboard to be fully mobile-responsive with touch-optimized controls for managers on the go.', 'Manager feedback from beta testing.', 'pending', 26000.00, 29500.00, datetime('now', '-2 days'), datetime('now', '-2 days')
FROM contracts c WHERE c.contract_address LIKE 'MGL-CTR-LMS-%';


-- 24. AUDIT LOGS
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
