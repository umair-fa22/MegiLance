// @AI-HINT: Enhanced Freelancer Profile page with comprehensive profile fields, social links, certifications, work history, education, and shareable profile features.
'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import api from '@/lib/api';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Textarea from '@/app/components/Textarea/Textarea';
import Select from '@/app/components/Select/Select';
import { AIRateEstimator } from '@/app/components/AI';
import commonStyles from './Profile.common.module.css';
import lightStyles from './Profile.light.module.css';
import darkStyles from './Profile.dark.module.css';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';

interface Education {
  degree: string;
  institution: string;
  year: string;
  field: string;
}

interface Certification {
  name: string;
  issuer: string;
  year: string;
  url: string;
}

interface WorkHistory {
  company: string;
  role: string;
  duration: string;
  description: string;
}

interface Achievement {
  title: string;
  description: string;
  year: string;
}

const experienceLevelOptions = [
  { value: '', label: 'Choose your experience level' },
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'intermediate', label: 'Intermediate (2-5 years)' },
  { value: 'expert', label: 'Expert (5+ years)' },
];

const availabilityHoursOptions = [
  { value: '', label: 'Choose your weekly availability' },
  { value: 'full_time', label: 'Full Time (40+ hrs/week)' },
  { value: 'part_time', label: 'Part Time (20-30 hrs/week)' },
  { value: 'contract', label: 'Contract Only' },
  { value: 'hourly', label: 'Hourly Basis' },
  { value: 'not_available', label: 'Not Available' },
];

const projectSizeOptions = [
  { value: '', label: 'Choose your preferred project budget' },
  { value: 'small', label: 'Small (<$1K)' },
  { value: 'medium', label: 'Medium ($1K-$10K)' },
  { value: 'large', label: 'Large ($10K-$50K)' },
  { value: 'enterprise', label: 'Enterprise ($50K+)' },
];

const visibilityOptions = [
  { value: 'public', label: 'Public — Visible in search results and browse' },
  { value: 'unlisted', label: 'Unlisted — Only accessible via direct link' },
  { value: 'private', label: 'Private — Hidden from everyone except you' },
];

const availabilityStatusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'away', label: 'Away' },
];

const Profile: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const [rateEstimate, setRateEstimate] = useState<any>(null);
  const [estimatingRate, setEstimatingRate] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Basic fields
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState('');
  const [profileSlug, setProfileSlug] = useState('');
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [profileViews, setProfileViews] = useState(0);
  const [availabilityStatus, setAvailabilityStatus] = useState('available');
  const [profileImageUrl, setProfileImageUrl] = useState('');

  // Professional fields
  const [skills, setSkills] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number | string>(0);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState<number | string>('');
  const [availabilityHours, setAvailabilityHours] = useState('');
  const [preferredProjectSize, setPreferredProjectSize] = useState('');
  const [languages, setLanguages] = useState('');
  const [industryFocus, setIndustryFocus] = useState('');
  const [toolsAndTechnologies, setToolsAndTechnologies] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [sellerLevel, setSellerLevel] = useState('');

  // Social links
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [dribbbleUrl, setDribbbleUrl] = useState('');
  const [behanceUrl, setBehanceUrl] = useState('');
  const [stackoverflowUrl, setStackoverflowUrl] = useState('');
  const [videoIntroUrl, setVideoIntroUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Dynamic arrays
  const [education, setEducation] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [workHistory, setWorkHistory] = useState<WorkHistory[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Settings
  const [testimonialsEnabled, setTestimonialsEnabled] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data: any = await api.auth.me();
      setUserId(data.id);
      setName(data.full_name || data.name || '');
      setTitle(data.title || '');
      setTagline(data.tagline || '');
      setHeadline(data.headline || '');
      setBio(data.bio || '');
      setLocation(data.location || '');
      setTimezone(data.timezone || '');
      setProfileSlug(data.profile_slug || '');
      setProfileVisibility(data.profile_visibility || 'public');
      setProfileViews(data.profile_views || 0);
      setAvailabilityStatus(data.availability_status || 'available');
      setProfileImageUrl(data.profile_image_url || '');
      setSkills(Array.isArray(data.skills) ? data.skills.join(', ') : data.skills || '');
      setHourlyRate(data.hourly_rate || 0);
      setExperienceLevel(data.experience_level || '');
      setYearsOfExperience(data.years_of_experience ?? '');
      setAvailabilityHours(data.availability_hours || '');
      setPreferredProjectSize(data.preferred_project_size || '');
      setLanguages(Array.isArray(data.languages) ? data.languages.join(', ') : data.languages || '');
      setIndustryFocus(Array.isArray(data.industry_focus) ? data.industry_focus.join(', ') : data.industry_focus || '');
      setToolsAndTechnologies(Array.isArray(data.tools_and_technologies) ? data.tools_and_technologies.join(', ') : data.tools_and_technologies || '');
      setPortfolioUrl(data.portfolio_url || '');
      setSellerLevel(data.seller_level || 'new_seller');
      setLinkedinUrl(data.linkedin_url || '');
      setGithubUrl(data.github_url || '');
      setWebsiteUrl(data.website_url || '');
      setTwitterUrl(data.twitter_url || '');
      setDribbbleUrl(data.dribbble_url || '');
      setBehanceUrl(data.behance_url || '');
      setStackoverflowUrl(data.stackoverflow_url || '');
      setVideoIntroUrl(data.video_intro_url || '');
      setResumeUrl(data.resume_url || '');
      setPhoneNumber(data.phone_number || '');
      setEducation(Array.isArray(data.education) ? data.education : []);
      setCertifications(Array.isArray(data.certifications) ? data.certifications : []);
      setWorkHistory(Array.isArray(data.work_history) ? data.work_history : []);
      setAchievements(Array.isArray(data.achievements) ? data.achievements : []);
      setTestimonialsEnabled(data.testimonials_enabled !== false);
      setStatus('');
    } catch (error: any) {
      if (error.message?.includes('401')) {
        setStatus('Session expired. Please log in again.');
      } else {
        setStatus('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const validate = () => {
    const next: Record<string, string> = {};
    const urlFields: [string, string][] = [
      [portfolioUrl, 'portfolioUrl'], [linkedinUrl, 'linkedinUrl'], [githubUrl, 'githubUrl'],
      [websiteUrl, 'websiteUrl'], [twitterUrl, 'twitterUrl'], [dribbbleUrl, 'dribbbleUrl'],
      [behanceUrl, 'behanceUrl'], [stackoverflowUrl, 'stackoverflowUrl'],
      [videoIntroUrl, 'videoIntroUrl'], [resumeUrl, 'resumeUrl'],
    ];
    for (const [url, key] of urlFields) {
      if (url && url.trim()) {
        try { new URL(url.trim()); } catch { next[key] = 'Invalid URL'; }
      }
    }
    const rateNum = Number(hourlyRate);
    if (Number.isNaN(rateNum) || rateNum < 0) next.hourlyRate = 'Must be a positive number';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { setStatus('Please fix the errors highlighted below before saving.'); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        full_name: name,
        title, tagline, headline, bio, location, timezone,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        hourly_rate: Number(hourlyRate) || null,
        portfolio_url: portfolioUrl || null,
        experience_level: experienceLevel || null,
        years_of_experience: yearsOfExperience !== '' ? Number(yearsOfExperience) : null,
        availability_status: availabilityStatus,
        availability_hours: availabilityHours || null,
        preferred_project_size: preferredProjectSize || null,
        languages: languages.split(',').map(s => s.trim()).filter(Boolean),
        industry_focus: industryFocus.split(',').map(s => s.trim()).filter(Boolean),
        tools_and_technologies: toolsAndTechnologies.split(',').map(s => s.trim()).filter(Boolean),
        linkedin_url: linkedinUrl || null,
        github_url: githubUrl || null,
        website_url: websiteUrl || null,
        twitter_url: twitterUrl || null,
        dribbble_url: dribbbleUrl || null,
        behance_url: behanceUrl || null,
        stackoverflow_url: stackoverflowUrl || null,
        video_intro_url: videoIntroUrl || null,
        resume_url: resumeUrl || null,
        phone_number: phoneNumber || null,
        education: education.filter(e => e.degree || e.institution),
        certifications: certifications.filter(c => c.name || c.issuer),
        work_history: workHistory.filter(w => w.company || w.role),
        achievements: achievements.filter(a => a.title),
        testimonials_enabled: testimonialsEnabled,
        profile_visibility: profileVisibility,
      };
      await (api.auth as any).updateProfile(payload);
      setStatus('Profile saved successfully!');
      const updated: any = await api.auth.me();
      setProfileSlug(updated.profile_slug || '');
    } catch (error: any) {
      setStatus(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const getRateEstimate = async () => {
    setEstimatingRate(true);
    try {
      const user: any = await api.auth.me();
      const result = await (api as any).ai?.estimateFreelancerRate?.(user.id, {
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        average_rating: 0, completed_projects: 0,
      });
      setRateEstimate(result);
    } catch { /* ignore */ } finally { setEstimatingRate(false); }
  };

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/freelancers/${profileSlug || userId}`
    : '';

  const copyProfileLink = () => {
    if (profileUrl) {
      navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`, '_blank', 'noopener');
  };

  const shareToTwitter = () => {
    const text = `Check out my freelancer profile on MegiLance! ${headline || tagline || title}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`, '_blank', 'noopener');
  };

  // Dynamic array helpers
  const addEducation = () => setEducation(prev => [...prev, { degree: '', institution: '', year: '', field: '' }]);
  const removeEducation = (idx: number) => setEducation(prev => prev.filter((_, i) => i !== idx));
  const updateEducation = (idx: number, field: keyof Education, val: string) =>
    setEducation(prev => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e));

  const addCertification = () => setCertifications(prev => [...prev, { name: '', issuer: '', year: '', url: '' }]);
  const removeCertification = (idx: number) => setCertifications(prev => prev.filter((_, i) => i !== idx));
  const updateCertification = (idx: number, field: keyof Certification, val: string) =>
    setCertifications(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c));

  const addWorkHistory = () => setWorkHistory(prev => [...prev, { company: '', role: '', duration: '', description: '' }]);
  const removeWorkHistory = (idx: number) => setWorkHistory(prev => prev.filter((_, i) => i !== idx));
  const updateWorkHistory = (idx: number, field: keyof WorkHistory, val: string) =>
    setWorkHistory(prev => prev.map((w, i) => i === idx ? { ...w, [field]: val } : w));

  const addAchievement = () => setAchievements(prev => [...prev, { title: '', description: '', year: '' }]);
  const removeAchievement = (idx: number) => setAchievements(prev => prev.filter((_, i) => i !== idx));
  const updateAchievement = (idx: number, field: keyof Achievement, val: string) =>
    setAchievements(prev => prev.map((a, i) => i === idx ? { ...a, [field]: val } : a));

  const sellerLevelLabel: Record<string, string> = {
    new_seller: 'New Seller',
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
  };

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const sections = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'professional', label: 'Professional' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education & Certs' },
    { id: 'social', label: 'Links & Social' },
    { id: 'media', label: 'Media & Files' },
    { id: 'settings', label: 'Visibility' },
  ];

  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={styles.profileContainer}>
        {/* Header */}
        <ScrollReveal>
          <header className={styles.header}>
            <UserAvatar name={name} src={profileImageUrl} size="large" />
            <div className={styles.headerInfo}>
              <h1 className={styles.name}>{name || 'Your Name'}</h1>
              <p className={styles.title}>{title || 'Your Title'}</p>
              {tagline && <p className={styles.tagline}>{tagline}</p>}
              <div className={styles.headerMeta}>
                <span className={styles.rank}>{sellerLevelLabel[sellerLevel] || 'New Seller'}</span>
                <span className={styles.metaBadge}>{profileViews} views</span>
                <span className={styles.metaBadge}>
                  {availabilityStatus === 'available' ? 'Available' : availabilityStatus === 'busy' ? 'Busy' : 'Away'}
                </span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <Button variant="outline" size="sm" type="button" onClick={() => setShowShareModal(true)} title="Share your profile">
                Share Profile
              </Button>
              {profileSlug && (
                <Button variant="ghost" size="sm" type="button" onClick={() => window.open(`/freelancers/${profileSlug}`, '_blank')} title="Preview public profile">
                  Preview
                </Button>
              )}
            </div>
          </header>
        </ScrollReveal>

        {/* Section Navigation */}
        <ScrollReveal>
          <nav className={styles.sectionNav} aria-label="Profile sections">
            {sections.map(sec => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`${styles.navBtn} ${activeSection === sec.id ? styles.navBtnActive : ''}`}
                aria-current={activeSection === sec.id ? 'page' : undefined}
              >
                <span className={styles.navLabel}>{sec.label}</span>
              </button>
            ))}
          </nav>
        </ScrollReveal>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          {status && (
            <div className={styles.status} role="status" aria-live="polite">{status}</div>
          )}

          {/* BASIC INFO */}
          {activeSection === 'basic' && (
            <StaggerContainer>
              <StaggerItem className={styles.section}>
                <h2 className={styles.sectionTitle}>Basic Information</h2>
                <div className={styles.inlineSection}>
                  <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} />
                  <Input label="Professional Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Full-Stack Developer" />
                </div>
                <Input label="Tagline" value={tagline} onChange={e => setTagline(e.target.value)} placeholder="A short catchy tagline (max 200 chars)" />
                <Textarea id="headline" label="Professional Headline" value={headline} onChange={e => setHeadline(e.target.value)} rows={2} placeholder="A detailed one-liner about what you do and your expertise" />
                <Textarea id="bio" label="About Me" value={bio} onChange={e => setBio(e.target.value)} rows={6} placeholder="Tell clients about your background, expertise, and what makes you unique..." />
                <div className={styles.inlineSection}>
                  <Input label="Location" value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Country" />
                  <Input label="Timezone" value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="e.g. Asia/Karachi" />
                </div>
                <div className={styles.inlineSection}>
                  <Input label="Phone Number" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+1 234 567 8900" />
                  <Select label="Availability Status" value={availabilityStatus} onChange={e => setAvailabilityStatus(e.target.value)} options={availabilityStatusOptions} />
                </div>
              </StaggerItem>
            </StaggerContainer>
          )}

          {/* PROFESSIONAL */}
          {activeSection === 'professional' && (
            <StaggerContainer>
              <StaggerItem className={styles.section}>
                <h2 className={styles.sectionTitle}>Professional Details</h2>
                <div className={styles.section}>
                  <Input label="Skills" value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, Node.js, Python, UI Design..." />
                  <small className={styles.skillsInfo}>Separate skills with commas. These appear on your public profile.</small>
                </div>
                <div className={styles.inlineSection}>
                  <div>
                    <div className={styles.rateRow}>
                      <div className={styles.rateField}>
                        <Input label="Hourly Rate ($/hr)" type="number" value={hourlyRate}
                          aria-invalid={errors.hourlyRate ? 'true' : undefined} onChange={e => setHourlyRate(e.target.value)} />
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={getRateEstimate} isLoading={estimatingRate} className={styles.rateBtn}>
                        AI Estimate
                      </Button>
                    </div>
                    <AIRateEstimator estimate={rateEstimate} onApply={() => { if (rateEstimate) { setHourlyRate(rateEstimate.estimated_rate); setRateEstimate(null); } }} onDismiss={() => setRateEstimate(null)} />
                    {errors.hourlyRate && <p className={styles.errorText}>{errors.hourlyRate}</p>}
                  </div>
                  <Select label="Experience Level" value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)} options={experienceLevelOptions} />
                </div>
                <div className={styles.inlineSection}>
                  <Input label="Years of Experience" type="number" value={yearsOfExperience} onChange={e => setYearsOfExperience(e.target.value)} placeholder="e.g. 5" />
                  <Select label="Availability" value={availabilityHours} onChange={e => setAvailabilityHours(e.target.value)} options={availabilityHoursOptions} />
                </div>
                <div className={styles.inlineSection}>
                  <Select label="Preferred Project Size" value={preferredProjectSize} onChange={e => setPreferredProjectSize(e.target.value)} options={projectSizeOptions} />
                  <Input label="Languages" value={languages} onChange={e => setLanguages(e.target.value)} placeholder="English, Urdu, Spanish..." />
                </div>
                <Input label="Industry Focus" value={industryFocus} onChange={e => setIndustryFocus(e.target.value)} placeholder="FinTech, Healthcare, E-commerce..." />
                <Input label="Tools & Technologies" value={toolsAndTechnologies} onChange={e => setToolsAndTechnologies(e.target.value)} placeholder="VS Code, Figma, Docker, AWS..." />
              </StaggerItem>
            </StaggerContainer>
          )}

          {/* EXPERIENCE (Work History + Achievements) */}
          {activeSection === 'experience' && (
            <StaggerContainer>
              <StaggerItem className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Work Experience</h2>
                  <Button type="button" variant="ghost" size="sm" onClick={addWorkHistory}>+ Add</Button>
                </div>
                {workHistory.length === 0 ? (
                  <div className={styles.emptyArrayState}>
                    <p>Add your work experience to stand out to potential clients</p>
                    <Button type="button" variant="outline" size="sm" onClick={addWorkHistory}>+ Add Work Experience</Button>
                  </div>
                ) : workHistory.map((w, idx) => (
                  <div key={idx} className={styles.arrayCard}>
                    <div className={styles.arrayCardHeader}>
                      <span className={styles.arrayCardTitle}>Experience #{idx + 1}</span>
                      <button type="button" onClick={() => removeWorkHistory(idx)} className={styles.removeBtn} aria-label="Remove">✕</button>
                    </div>
                    <div className={styles.inlineSection}>
                      <Input label="Company" value={w.company} onChange={e => updateWorkHistory(idx, 'company', e.target.value)} />
                      <Input label="Role" value={w.role} onChange={e => updateWorkHistory(idx, 'role', e.target.value)} />
                    </div>
                    <Input label="Duration" value={w.duration} onChange={e => updateWorkHistory(idx, 'duration', e.target.value)} placeholder="e.g. Jan 2022 - Present" />
                    <Textarea id={`work-desc-${idx}`} label="Description" value={w.description} onChange={e => updateWorkHistory(idx, 'description', e.target.value)} rows={3} placeholder="Describe your responsibilities and achievements..." />
                  </div>
                ))}
              </StaggerItem>

              <StaggerItem className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Achievements & Awards</h2>
                  <Button type="button" variant="ghost" size="sm" onClick={addAchievement}>+ Add</Button>
                </div>
                {achievements.length === 0 ? (
                  <div className={styles.emptyArrayState}>
                    <p>Showcase your awards, certifications, and notable accomplishments</p>
                    <Button type="button" variant="outline" size="sm" onClick={addAchievement}>+ Add Achievement</Button>
                  </div>
                ) : achievements.map((a, idx) => (
                  <div key={idx} className={styles.arrayCard}>
                    <div className={styles.arrayCardHeader}>
                      <span className={styles.arrayCardTitle}>Achievement #{idx + 1}</span>
                      <button type="button" onClick={() => removeAchievement(idx)} className={styles.removeBtn} aria-label="Remove">✕</button>
                    </div>
                    <div className={styles.inlineSection}>
                      <Input label="Title" value={a.title} onChange={e => updateAchievement(idx, 'title', e.target.value)} />
                      <Input label="Year" value={a.year} onChange={e => updateAchievement(idx, 'year', e.target.value)} placeholder="2024" />
                    </div>
                    <Textarea id={`achievement-desc-${idx}`} label="Description" value={a.description} onChange={e => updateAchievement(idx, 'description', e.target.value)} rows={2} />
                  </div>
                ))}
              </StaggerItem>
            </StaggerContainer>
          )}

          {/* EDUCATION & CERTIFICATIONS */}
          {activeSection === 'education' && (
            <StaggerContainer>
              <StaggerItem className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Education</h2>
                  <Button type="button" variant="ghost" size="sm" onClick={addEducation}>+ Add</Button>
                </div>
                {education.length === 0 ? (
                  <div className={styles.emptyArrayState}>
                    <p>Add your educational background to build trust with clients</p>
                    <Button type="button" variant="outline" size="sm" onClick={addEducation}>+ Add Education</Button>
                  </div>
                ) : education.map((edu, idx) => (
                  <div key={idx} className={styles.arrayCard}>
                    <div className={styles.arrayCardHeader}>
                      <span className={styles.arrayCardTitle}>Education #{idx + 1}</span>
                      <button type="button" onClick={() => removeEducation(idx)} className={styles.removeBtn} aria-label="Remove">✕</button>
                    </div>
                    <div className={styles.inlineSection}>
                      <Input label="Degree" value={edu.degree} onChange={e => updateEducation(idx, 'degree', e.target.value)} placeholder="e.g. BSc Computer Science" />
                      <Input label="Institution" value={edu.institution} onChange={e => updateEducation(idx, 'institution', e.target.value)} />
                    </div>
                    <div className={styles.inlineSection}>
                      <Input label="Field of Study" value={edu.field} onChange={e => updateEducation(idx, 'field', e.target.value)} />
                      <Input label="Year" value={edu.year} onChange={e => updateEducation(idx, 'year', e.target.value)} placeholder="2020" />
                    </div>
                  </div>
                ))}
              </StaggerItem>

              <StaggerItem className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Certifications</h2>
                  <Button type="button" variant="ghost" size="sm" onClick={addCertification}>+ Add</Button>
                </div>
                {certifications.length === 0 ? (
                  <div className={styles.emptyArrayState}>
                    <p>Add certifications to verify your expertise</p>
                    <Button type="button" variant="outline" size="sm" onClick={addCertification}>+ Add Certification</Button>
                  </div>
                ) : certifications.map((cert, idx) => (
                  <div key={idx} className={styles.arrayCard}>
                    <div className={styles.arrayCardHeader}>
                      <span className={styles.arrayCardTitle}>Certification #{idx + 1}</span>
                      <button type="button" onClick={() => removeCertification(idx)} className={styles.removeBtn} aria-label="Remove">✕</button>
                    </div>
                    <div className={styles.inlineSection}>
                      <Input label="Name" value={cert.name} onChange={e => updateCertification(idx, 'name', e.target.value)} placeholder="e.g. AWS Solutions Architect" />
                      <Input label="Issued By" value={cert.issuer} onChange={e => updateCertification(idx, 'issuer', e.target.value)} placeholder="e.g. Amazon Web Services" />
                    </div>
                    <div className={styles.inlineSection}>
                      <Input label="Year" value={cert.year} onChange={e => updateCertification(idx, 'year', e.target.value)} placeholder="2024" />
                      <Input label="Verification URL" type="url" value={cert.url} onChange={e => updateCertification(idx, 'url', e.target.value)} placeholder="https://..." />
                    </div>
                  </div>
                ))}
              </StaggerItem>
            </StaggerContainer>
          )}

          {/* SOCIAL LINKS */}
          {activeSection === 'social' && (
            <StaggerContainer>
              <StaggerItem className={styles.section}>
                <h2 className={styles.sectionTitle}>Social & Professional Links</h2>
                <p className={styles.sectionDescription}>Connect your online presence to increase credibility and let clients find you elsewhere.</p>
                <div className={styles.socialGrid}>
                  <div className={styles.socialItem}>
                    <Input label="LinkedIn" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourname" error={errors.linkedinUrl} />
                  </div>
                  <div className={styles.socialItem}>
                    <Input label="GitHub" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/yourname" error={errors.githubUrl} />
                  </div>
                  <div className={styles.socialItem}>
                    <Input label="Personal Website" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://yourwebsite.com" error={errors.websiteUrl} />
                  </div>
                  <div className={styles.socialItem}>
                    <Input label="Twitter / X" value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)} placeholder="https://twitter.com/yourname" error={errors.twitterUrl} />
                  </div>
                  <div className={styles.socialItem}>
                    <Input label="Dribbble" value={dribbbleUrl} onChange={e => setDribbbleUrl(e.target.value)} placeholder="https://dribbble.com/yourname" error={errors.dribbbleUrl} />
                  </div>
                  <div className={styles.socialItem}>
                    <Input label="Behance" value={behanceUrl} onChange={e => setBehanceUrl(e.target.value)} placeholder="https://behance.net/yourname" error={errors.behanceUrl} />
                  </div>
                  <div className={styles.socialItem}>
                    <Input label="Stack Overflow" value={stackoverflowUrl} onChange={e => setStackoverflowUrl(e.target.value)} placeholder="https://stackoverflow.com/users/..." error={errors.stackoverflowUrl} />
                  </div>
                  <div className={styles.socialItem}>
                    <Input label="Portfolio URL" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} placeholder="https://portfolio.dev" error={errors.portfolioUrl} />
                  </div>
                </div>
              </StaggerItem>
            </StaggerContainer>
          )}

          {/* MEDIA & FILES */}
          {activeSection === 'media' && (
            <StaggerContainer>
              <StaggerItem className={styles.section}>
                <h2 className={styles.sectionTitle}>Media & Documents</h2>
                <p className={styles.sectionDescription}>Add a video intro, resume, or other materials to make your profile stand out.</p>
                <div className={styles.mediaSection}>
                  <div className={styles.mediaCard}>
                    <div className={styles.mediaCardContent}>
                      <h3>Video Introduction</h3>
                      <p>Add a short video pitch to introduce yourself. Upload to YouTube/Vimeo and paste the link.</p>
                      <Input label="Video URL" value={videoIntroUrl} onChange={e => setVideoIntroUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." error={errors.videoIntroUrl} />
                    </div>
                  </div>
                  <div className={styles.mediaCard}>
                    <div className={styles.mediaCardContent}>
                      <h3>Resume / CV</h3>
                      <p>Link to your resume or CV so clients can review your background in detail.</p>
                      <Input label="Resume URL" value={resumeUrl} onChange={e => setResumeUrl(e.target.value)} placeholder="https://drive.google.com/..." error={errors.resumeUrl} />
                    </div>
                  </div>
                </div>
              </StaggerItem>
            </StaggerContainer>
          )}

          {/* VISIBILITY & SETTINGS */}
          {activeSection === 'settings' && (
            <StaggerContainer>
              <StaggerItem className={styles.section}>
                <h2 className={styles.sectionTitle}>Profile Visibility & Settings</h2>
                <div className={styles.settingsCard}>
                  <div className={styles.settingRow}>
                    <div>
                      <h3>Profile Visibility</h3>
                      <p>Control who can see your profile</p>
                    </div>
                    <Select value={profileVisibility} onChange={e => setProfileVisibility(e.target.value)} options={visibilityOptions} />
                  </div>
                  <div className={styles.settingRow}>
                    <div>
                      <h3>Show Testimonials</h3>
                      <p>Allow reviews and testimonials on your public profile</p>
                    </div>
                    <label className={styles.toggleLabel}>
                      <input type="checkbox" checked={testimonialsEnabled} onChange={e => setTestimonialsEnabled(e.target.checked)} className={styles.toggleInput} />
                      <span className={styles.toggleSwitch}></span>
                    </label>
                  </div>
                </div>

                {/* Shareable Link */}
                <div className={styles.shareSection}>
                  <h3 className={styles.shareTitle}>Your Shareable Profile Link</h3>
                  <p className={styles.shareDesc}>Share this link on your resume, social media, or anywhere to get more work opportunities.</p>
                  <div className={styles.shareUrlBox}>
                    <input type="text" readOnly value={profileUrl} className={styles.shareUrlInput} aria-label="Profile URL" />
                    <Button type="button" variant="primary" size="sm" onClick={copyProfileLink}>
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className={styles.shareButtons}>
                    <Button type="button" variant="outline" size="sm" onClick={shareToLinkedIn}>Share on LinkedIn</Button>
                    <Button type="button" variant="outline" size="sm" onClick={shareToTwitter}>Share on Twitter</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: `${name} - Freelancer Profile`, text: headline || tagline || title, url: profileUrl });
                      } else {
                        copyProfileLink();
                      }
                    }}>
                      More...
                    </Button>
                  </div>
                </div>
              </StaggerItem>
            </StaggerContainer>
          )}

          {/* Save Actions */}
          <div className={styles.actions}>
            <Button variant="secondary" type="button" onClick={fetchProfile}>Reset</Button>
            <Button variant="primary" type="submit" isLoading={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>

        {/* Share Modal */}
        {showShareModal && (
          <div className={styles.modalOverlay} onClick={() => setShowShareModal(false)} role="dialog" aria-modal="true" aria-label="Share profile">
            <div className={styles.shareModal} onClick={e => e.stopPropagation()}>
              <div className={styles.shareModalHeader}>
                <h2>Share Your Profile</h2>
                <button onClick={() => setShowShareModal(false)} className={styles.closeBtn} aria-label="Close">×</button>
              </div>
              <div className={styles.shareModalContent}>
                <p>Share your freelancer profile to get noticed by potential clients!</p>
                <div className={styles.shareUrlBox}>
                  <input type="text" readOnly value={profileUrl} className={styles.shareUrlInput} aria-label="Profile URL" />
                  <Button type="button" variant="primary" size="sm" onClick={copyProfileLink}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className={styles.shareModalButtons}>
                  <Button type="button" variant="outline" onClick={shareToLinkedIn} fullWidth>
                    Share on LinkedIn
                  </Button>
                  <Button type="button" variant="outline" onClick={shareToTwitter} fullWidth>
                    Share on Twitter / X
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    window.open(`mailto:?subject=${encodeURIComponent(`Check out my freelancer profile`)}&body=${encodeURIComponent(`Hi,\n\nCheck out my freelancer profile on MegiLance:\n${profileUrl}\n\n${headline || tagline || ''}`)}`, '_self');
                  }} fullWidth>
                    Share via Email
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    window.open(`https://wa.me/?text=${encodeURIComponent(`Check out my freelancer profile: ${profileUrl}`)}`, '_blank', 'noopener');
                  }} fullWidth>
                    Share on WhatsApp
                  </Button>
                </div>
                <div className={styles.shareHints}>
                  <h4>Tips for sharing:</h4>
                  <ul>
                    <li>Add this link to your resume / CV</li>
                    <li>Include it in your email signature</li>
                    <li>Post it on professional social networks</li>
                    <li>Use it on job boards and applications</li>
                    <li>Add it to your portfolio website</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Profile;
