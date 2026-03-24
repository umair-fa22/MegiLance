// @AI-HINT: Enhanced profile completion wizard with progress tracking, skip options, profile score, and completion celebration
'use client';

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { 
  User, Briefcase, Award, FileText, Link2, Sparkles,
  CheckCircle, ArrowRight, ArrowLeft, SkipForward,
  Rocket, Star, TrendingUp, Eye, Zap
} from 'lucide-react';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Textarea from '@/app/components/Textarea/Textarea';
import Select from '@/app/components/Select/Select';
import TagsInput from '@/app/components/TagsInput/TagsInput';
import FileUpload from '@/app/components/FileUpload/FileUpload';

import commonStyles from './ProfileWizard.common.module.css';
import lightStyles from './ProfileWizard.light.module.css';
import darkStyles from './ProfileWizard.dark.module.css';

interface ProfileData {
  firstName: string;
  lastName: string;
  title: string;
  bio: string;
  location: string;
  timezone: string;
  avatarUrl: string;
  skills: string[];
  hourlyRate: string;
  experienceLevel: string;
  availability: string;
  languages: string[];
  portfolioItems: PortfolioItem[];
  phoneNumber: string;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
}

interface PortfolioItem {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  tags: string[];
}

const steps = [
  { id: 1, title: 'Basic Info', icon: User, description: 'Tell us about yourself', required: true },
  { id: 2, title: 'Professional', icon: Briefcase, description: 'Your skills & expertise', required: true },
  { id: 3, title: 'Portfolio', icon: FileText, description: 'Showcase your work', required: false },
  { id: 4, title: 'Links & Verify', icon: Link2, description: 'Connect your profiles', required: false },
];

const timezoneOptions = [
  { value: 'Pacific/Honolulu', label: 'Hawaii (GMT-10)' },
  { value: 'America/Los_Angeles', label: 'US Pacific (GMT-8)' },
  { value: 'America/Denver', label: 'US Mountain (GMT-7)' },
  { value: 'America/Chicago', label: 'US Central (GMT-6)' },
  { value: 'America/New_York', label: 'US East (GMT-5)' },
  { value: 'America/Sao_Paulo', label: 'Brazil (GMT-3)' },
  { value: 'Europe/London', label: 'UK (GMT+0)' },
  { value: 'Europe/Paris', label: 'Central Europe (GMT+1)' },
  { value: 'Europe/Istanbul', label: 'Turkey (GMT+3)' },
  { value: 'Asia/Dubai', label: 'UAE (GMT+4)' },
  { value: 'Asia/Karachi', label: 'Pakistan (GMT+5)' },
  { value: 'Asia/Kolkata', label: 'India (GMT+5:30)' },
  { value: 'Asia/Bangkok', label: 'Thailand (GMT+7)' },
  { value: 'Asia/Shanghai', label: 'China (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Japan (GMT+9)' },
  { value: 'Australia/Sydney', label: 'Australia (GMT+11)' },
];

export default function ProfileWizard() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const [existingName, setExistingName] = useState('');
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    title: '',
    bio: '',
    location: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Karachi',
    avatarUrl: '',
    skills: [],
    hourlyRate: '',
    experienceLevel: '',
    availability: '',
    languages: ['English'],
    portfolioItems: [],
    phoneNumber: '',
    linkedinUrl: '',
    githubUrl: '',
    websiteUrl: '',
  });

  // Load existing profile data on mount
  useEffect(() => {
    const loadExisting = async () => {
      try {
        const data: any = await api.auth.me();
        if (data) {
          const nameParts = (data.full_name || '').split(' ');
          setExistingName(data.full_name || '');
          setProfileData(prev => ({
            ...prev,
            firstName: nameParts[0] || prev.firstName,
            lastName: nameParts.slice(1).join(' ') || prev.lastName,
            title: data.title || prev.title,
            bio: data.bio || prev.bio,
            location: data.location || prev.location,
            timezone: data.timezone || prev.timezone,
            avatarUrl: data.profile_image_url || prev.avatarUrl,
            skills: Array.isArray(data.skills) ? data.skills : prev.skills,
            hourlyRate: data.hourly_rate ? String(data.hourly_rate) : prev.hourlyRate,
            experienceLevel: data.experience_level || prev.experienceLevel,
            availability: data.availability_status || prev.availability,
            languages: Array.isArray(data.languages) && data.languages.length > 0 ? data.languages : prev.languages,
            phoneNumber: data.phone_number || prev.phoneNumber,
            linkedinUrl: data.linkedin_url || prev.linkedinUrl,
            githubUrl: data.github_url || prev.githubUrl,
            websiteUrl: data.website_url || prev.websiteUrl,
          }));
        }
      } catch { /* first visit - no data yet */ }
    };
    loadExisting();
  }, []);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const s = useMemo(() => {
    const merge = (key: string) => cn((commonStyles as any)[key], (themeStyles as any)[key]);
    return {
      container: merge('container'),
      header: merge('header'),
      title: merge('title'),
      subtitle: merge('subtitle'),
      progressBar: merge('progressBar'),
      progressFill: merge('progressFill'),
      stepsIndicator: merge('stepsIndicator'),
      step: merge('step'),
      stepActive: merge('stepActive'),
      stepCompleted: merge('stepCompleted'),
      stepIcon: merge('stepIcon'),
      stepTitle: merge('stepTitle'),
      content: merge('content'),
      formGrid: merge('formGrid'),
      actions: merge('actions'),
      profileScore: merge('profileScore'),
      scoreCircle: merge('scoreCircle'),
      scoreLabel: merge('scoreLabel'),
      scoreHints: merge('scoreHints'),
      hintItem: merge('hintItem'),
      hintDone: merge('hintDone'),
      stepDescription: merge('stepDescription'),
      completionCard: merge('completionCard'),
      completionTitle: merge('completionTitle'),
      completionSubtitle: merge('completionSubtitle'),
      completionActions: merge('completionActions'),
      completionStats: merge('completionStats'),
      completionStat: merge('completionStat'),
      portfolioEmpty: merge('portfolioEmpty'),
      portfolioCard: merge('portfolioCard'),
      portfolioCardHeader: merge('portfolioCardHeader'),
      portfolioCardBody: merge('portfolioCardBody'),
      errorText: merge('errorText'),
      skipLink: merge('skipLink'),
    };
  }, [resolvedTheme, themeStyles]);

  // Profile completion score
  const profileScore = useMemo(() => {
    let score = 0;
    const hints: { label: string; done: boolean }[] = [];
    
    const check = (label: string, condition: boolean, points: number) => {
      hints.push({ label, done: condition });
      if (condition) score += points;
    };
    
    check('Add your name', !!(profileData.firstName && profileData.lastName), 10);
    check('Set professional title', !!profileData.title, 10);
    check('Write a bio (50+ chars)', profileData.bio.length >= 50, 15);
    check('Upload a profile photo', !!profileData.avatarUrl, 10);
    check('Add location', !!profileData.location, 5);
    check('Add at least 3 skills', profileData.skills.length >= 3, 15);
    check('Set your hourly rate', !!profileData.hourlyRate && parseFloat(profileData.hourlyRate) > 0, 10);
    check('Choose experience level', !!profileData.experienceLevel, 5);
    check('Set availability', !!profileData.availability, 5);
    check('Add a portfolio item', profileData.portfolioItems.length > 0, 5);
    check('Add phone number', !!profileData.phoneNumber, 5);
    check('Link a social profile', !!(profileData.linkedinUrl || profileData.githubUrl || profileData.websiteUrl), 5);
    
    return { score, hints };
  }, [profileData]);

  const progress = (currentStep / steps.length) * 100;

  const handleNext = async () => {
    if (validateStep()) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        await handleSubmit();
      }
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1:
        if (!profileData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!profileData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!profileData.title.trim()) newErrors.title = 'Professional title is required';
        if (profileData.bio && profileData.bio.length > 0 && profileData.bio.length < 50) {
          newErrors.bio = 'Bio must be at least 50 characters (or leave empty for now)';
        }
        break;
      case 2:
        if (profileData.skills.length === 0) {
          newErrors.skills = 'Add at least one skill';
        }
        if (profileData.hourlyRate && parseFloat(profileData.hourlyRate) < 0) {
          newErrors.hourlyRate = 'Rate cannot be negative';
        }
        break;
      // Steps 3 and 4 are optional - no validation required
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.users.completeProfile({
        first_name: profileData.firstName.trim(),
        last_name: profileData.lastName.trim(),
        title: profileData.title.trim(),
        headline: profileData.title.trim(),
        bio: profileData.bio.trim() || undefined,
        location: profileData.location.trim() || undefined,
        timezone: profileData.timezone || undefined,
        profile_image_url: profileData.avatarUrl || undefined,
        skills: profileData.skills.length > 0 ? profileData.skills.join(', ') : undefined,
        hourly_rate: profileData.hourlyRate ? parseFloat(profileData.hourlyRate) : undefined,
        experience_level: profileData.experienceLevel || undefined,
        availability_status: profileData.availability || undefined,
        languages: profileData.languages.length > 0 ? profileData.languages.join(', ') : undefined,
        phone_number: profileData.phoneNumber.trim() || undefined,
        linkedin_url: profileData.linkedinUrl.trim() || undefined,
        github_url: profileData.githubUrl.trim() || undefined,
        website_url: profileData.websiteUrl.trim() || undefined,
      } as unknown as Record<string, unknown>);
      setCompleted(true);
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to save profile' });
    } finally {
      setLoading(false);
    }
  };

  const addPortfolioItem = () => {
    setProfileData({
      ...profileData,
      portfolioItems: [
        ...profileData.portfolioItems,
        { title: '', description: '', url: '', imageUrl: '', tags: [] },
      ],
    });
  };

  const removePortfolioItem = (index: number) => {
    setProfileData({
      ...profileData,
      portfolioItems: profileData.portfolioItems.filter((_, i) => i !== index),
    });
  };

  const updatePortfolioItem = (index: number, field: string, value: string | string[]) => {
    const updated = [...profileData.portfolioItems];
    updated[index] = { ...updated[index], [field]: value };
    setProfileData({ ...profileData, portfolioItems: updated });
  };

  // Completion celebration screen
  if (completed) {
    return (
      <div className={s.container}>
        <div className={s.completionCard}>
          <Rocket size={48} aria-hidden="true" />
          <h1 className={s.completionTitle}>
            Welcome to MegiLance{existingName ? `, ${existingName.split(' ')[0]}` : ''}!
          </h1>
          <p className={s.completionSubtitle}>
            Your profile is {profileScore.score >= 80 ? 'looking great' : 'set up'}! 
            {profileScore.score < 80 && ' You can complete more details from your profile page anytime.'}
          </p>
          <div className={s.completionStats}>
            <div className={s.completionStat}>
              <Zap size={20} aria-hidden="true" />
              <span>Profile Score: {profileScore.score}%</span>
            </div>
            <div className={s.completionStat}>
              <Star size={20} aria-hidden="true" />
              <span>{profileData.skills.length} Skills Added</span>
            </div>
            <div className={s.completionStat}>
              <Eye size={20} aria-hidden="true" />
              <span>Profile is Live</span>
            </div>
          </div>
          <div className={s.completionActions}>
            <Button variant="primary" size="lg" onClick={() => router.push('/freelancer/dashboard')}>
              <Rocket size={18} aria-hidden="true" />
              Go to Dashboard
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push('/freelancer/jobs')}>
              <Briefcase size={18} aria-hidden="true" />
              Browse Projects
            </Button>
            <Button variant="ghost" onClick={() => router.push('/freelancer/profile')}>
              Complete Full Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h1 className={s.title}>Complete Your Profile</h1>
        <p className={s.subtitle}>
          Let&apos;s set up your professional profile to start winning projects
        </p>
      </div>

      {/* Profile Score */}
      <div className={s.profileScore}>
        <div className={s.scoreCircle}>
          <svg viewBox="0 0 36 36" width="64" height="64">
            <path
              d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.15"
            />
            <path
              d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray={`${profileScore.score}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <span>{profileScore.score}%</span>
        </div>
        <div className={s.scoreLabel}>
          <TrendingUp size={14} aria-hidden="true" />
          Profile Strength
        </div>
        <div className={s.scoreHints}>
          {profileScore.hints.filter(h => !h.done).slice(0, 3).map((hint, i) => (
            <span key={i} className={s.hintItem}>{hint.label}</span>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className={s.progressBar}>
        <div className={s.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* Steps Indicator */}
      <div className={s.stepsIndicator}>
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => {
              // Allow clicking back to completed steps
              if (step.id < currentStep) setCurrentStep(step.id);
            }}
            className={cn(
              s.step,
              currentStep === step.id && s.stepActive,
              currentStep > step.id && s.stepCompleted
            )}
            aria-current={currentStep === step.id ? 'step' : undefined}
          >
            <div className={s.stepIcon}>
              {currentStep > step.id ? (
                <CheckCircle size={24} />
              ) : (
                <step.icon size={24} />
              )}
            </div>
            <div className={s.stepTitle}>{step.title}</div>
            <div className={s.stepDescription}>
              {step.required ? 'Required' : 'Optional'}
            </div>
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div className={s.content}>
        {currentStep === 1 && (
          <div className={s.formGrid}>
            <div className={commonStyles.colSpan2}>
              <FileUpload
                label="Profile Picture"
                accept="image/*"
                maxSize={5}
                uploadType="avatar"
                onUploadComplete={(url) => setProfileData({ ...profileData, avatarUrl: url })}
              />
            </div>
            <Input
              name="firstName"
              label="First Name *"
              placeholder="John"
              value={profileData.firstName}
              onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
              error={errors.firstName}
            />
            <Input
              name="lastName"
              label="Last Name *"
              placeholder="Doe"
              value={profileData.lastName}
              onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
              error={errors.lastName}
            />
            <div className={commonStyles.colSpan2}>
              <Input
                name="title"
                label="Professional Title *"
                placeholder="Full Stack Developer | UI/UX Designer | Data Scientist"
                value={profileData.title}
                onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                error={errors.title}
                helpText="This is the first thing clients see. Make it specific and compelling."
              />
            </div>
            <div className={commonStyles.colSpan2}>
              <Textarea
                name="bio"
                label="Professional Bio"
                placeholder="Tell clients about your experience, skills, and what makes you unique. What problems do you solve? What's your approach?"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                error={errors.bio}
                rows={6}
                helpText={`${profileData.bio.length}/500 characters${profileData.bio.length > 0 && profileData.bio.length < 50 ? ' (minimum 50)' : ''}`}
              />
            </div>
            <Input
              name="location"
              label="Location"
              placeholder="Karachi, Pakistan"
              value={profileData.location}
              onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
              helpText="Helps clients find freelancers in their timezone"
            />
            <Select
              id="timezone"
              label="Timezone"
              value={profileData.timezone}
              onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
              options={timezoneOptions}
            />
          </div>
        )}

        {currentStep === 2 && (
          <div className={s.formGrid}>
            <div className={commonStyles.colSpan2}>
              <TagsInput
                id="skills"
                label="Skills * (the more the better)"
                placeholder="e.g., React, Node.js, Python, UI Design, SEO"
                tags={profileData.skills}
                onTagsChange={(skills) => setProfileData({ ...profileData, skills })}
                error={errors.skills}
              />
            </div>
            <Input
              name="hourlyRate"
              type="number"
              label="Hourly Rate ($)"
              placeholder="25"
              value={profileData.hourlyRate}
              onChange={(e) => setProfileData({ ...profileData, hourlyRate: e.target.value })}
              error={errors.hourlyRate}
              helpText="You can update this anytime. Research similar profiles for market rates."
            />
            <Select
              id="experienceLevel"
              label="Experience Level"
              value={profileData.experienceLevel}
              onChange={(e) => setProfileData({ ...profileData, experienceLevel: e.target.value })}
              options={[
                { value: '', label: 'Select level' },
                { value: 'entry', label: 'Entry Level (0-2 years)' },
                { value: 'intermediate', label: 'Intermediate (2-5 years)' },
                { value: 'expert', label: 'Expert (5+ years)' },
              ]}
            />
            <Select
              id="availability"
              label="Availability"
              value={profileData.availability}
              onChange={(e) => setProfileData({ ...profileData, availability: e.target.value })}
              options={[
                { value: '', label: 'Select availability' },
                { value: 'full-time', label: 'Full-time (40+ hrs/week)' },
                { value: 'part-time', label: 'Part-time (20-40 hrs/week)' },
                { value: 'as-needed', label: 'As Needed (<20 hrs/week)' },
              ]}
            />
            <div className={commonStyles.colSpan2}>
              <TagsInput
                id="languages"
                label="Languages"
                placeholder="e.g., English, Urdu, Arabic"
                tags={profileData.languages}
                onTagsChange={(languages) => setProfileData({ ...profileData, languages })}
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <div className={commonStyles.portfolioHeader}>
              <div>
                <h3 className={commonStyles.portfolioTitle}>Portfolio Items</h3>
                <p className={commonStyles.portfolioSubtitle}>
                  Optional but highly recommended — profiles with portfolio items get 3x more invitations
                </p>
              </div>
              <Button variant="secondary" onClick={addPortfolioItem}>
                Add Portfolio Item
              </Button>
            </div>
            
            {profileData.portfolioItems.length === 0 && (
              <div className={s.portfolioEmpty}>
                <FileText size={48} aria-hidden="true" />
                <p>No portfolio items yet.</p>
                <p>Showcase your best work to attract more clients!</p>
                <Button variant="outline" onClick={addPortfolioItem}>
                  Add Your First Project
                </Button>
              </div>
            )}
            
            {profileData.portfolioItems.map((item, index) => (
              <div key={index} className={s.portfolioCard}>
                <div className={s.portfolioCardHeader}>
                  <h4>Portfolio Item #{index + 1}</h4>
                  <Button variant="danger" size="sm" onClick={() => removePortfolioItem(index)}>
                    Remove
                  </Button>
                </div>
                <div className={s.portfolioCardBody}>
                  <FileUpload
                    label="Portfolio Image"
                    accept="image/*"
                    maxSize={10}
                    uploadType="portfolio"
                    onUploadComplete={(url) => updatePortfolioItem(index, 'imageUrl', url)}
                  />
                  <div className={s.formGrid}>
                    <Input
                      name={`portfolio-title-${index}`}
                      label="Project Title"
                      placeholder="E-commerce Website"
                      value={item.title}
                      onChange={(e) => updatePortfolioItem(index, 'title', e.target.value)}
                    />
                    <Input
                      name={`portfolio-url-${index}`}
                      label="Project URL"
                      placeholder="https://example.com"
                      value={item.url}
                      onChange={(e) => updatePortfolioItem(index, 'url', e.target.value)}
                    />
                    <div className={commonStyles.colSpan2}>
                      <Textarea
                        name={`portfolio-description-${index}`}
                        label="Description"
                        placeholder="Describe the project, your role, and technologies used..."
                        value={item.description}
                        onChange={(e) => updatePortfolioItem(index, 'description', e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className={commonStyles.colSpan2}>
                      <TagsInput
                        id={`portfolio-tags-${index}`}
                        label="Technologies"
                        placeholder="e.g., React, Node.js"
                        tags={item.tags}
                        onTagsChange={(tags) => updatePortfolioItem(index, 'tags', tags)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {errors.portfolio && (
              <div className={s.errorText}>{errors.portfolio}</div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className={s.formGrid}>
            <div className={commonStyles.colSpan2}>
              <Input
                name="phoneNumber"
                label="Phone Number"
                placeholder="+92 300 1234567"
                value={profileData.phoneNumber}
                onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                error={errors.phoneNumber}
                helpText="For verification and important notifications (optional)"
              />
            </div>
            <Input
              name="linkedinUrl"
              label="LinkedIn Profile"
              placeholder="https://linkedin.com/in/yourprofile"
              value={profileData.linkedinUrl}
              onChange={(e) => setProfileData({ ...profileData, linkedinUrl: e.target.value })}
              helpText="Boosts your profile credibility"
            />
            <Input
              name="githubUrl"
              label="GitHub Profile"
              placeholder="https://github.com/yourusername"
              value={profileData.githubUrl}
              onChange={(e) => setProfileData({ ...profileData, githubUrl: e.target.value })}
            />
            <div className={commonStyles.colSpan2}>
              <Input
                name="websiteUrl"
                label="Personal Website / Portfolio"
                placeholder="https://yourwebsite.com"
                value={profileData.websiteUrl}
                onChange={(e) => setProfileData({ ...profileData, websiteUrl: e.target.value })}
              />
            </div>
          </div>
        )}

        {errors.general && (
          <div className={s.errorText}>{errors.general}</div>
        )}
      </div>

      {/* Actions */}
      <div className={s.actions}>
        <div>
          {currentStep > 1 && (
            <Button variant="secondary" onClick={handleBack} disabled={loading}>
              <ArrowLeft size={16} aria-hidden="true" />
              Back
            </Button>
          )}
        </div>
        <div className={commonStyles.actionsRight}>
          {!steps[currentStep - 1].required && (
            <button type="button" className={s.skipLink} onClick={handleSkip} disabled={loading}>
              <SkipForward size={14} aria-hidden="true" />
              Skip for now
            </button>
          )}
          <Button variant="primary" onClick={handleNext} isLoading={loading} disabled={loading}>
            {currentStep < steps.length ? (
              <>
                Next Step
                <ArrowRight size={16} aria-hidden="true" />
              </>
            ) : (
              <>
                <Sparkles size={16} aria-hidden="true" />
                Complete Profile
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
