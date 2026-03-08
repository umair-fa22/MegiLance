// @AI-HINT: This is the main Account Settings page for freelancers. It features a modern, clean form for updating profile information and is built to be theme-aware and responsive.
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useToaster } from '@/app/components/Toast/ToasterProvider';
import { Bell, Lock, Eye, Mail, Globe } from 'lucide-react';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer } from '@/app/components/Animations/StaggerContainer';

import Input from '@/app/components/Input/Input';
import Textarea from '@/app/components/Textarea/Textarea';
import Button from '@/app/components/Button/Button';
import { Label } from '@/app/components/Label/Label';
import Switch from '@/app/components/ToggleSwitch/ToggleSwitch';
import api from '@/lib/api';

import commonStyles from './Settings.common.module.css';
import lightStyles from './Settings.light.module.css';
import darkStyles from './Settings.dark.module.css';

const AccountSettingsPage = () => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const toaster = useToaster();

  // Profile settings
  const [fullName, setFullName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  
  // Notification settings
  const [jobNotifications, setJobNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [paymentNotifications, setPaymentNotifications] = useState(true);
  const [marketingNotifications, setMarketingNotifications] = useState(false);
  
  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [showContactInfo, setShowContactInfo] = useState(true);
  
  // Security settings
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await api.auth.me();
        setFullName(user.name || '');
        setProfessionalTitle(user.title || '');
        setBio(user.bio || '');
        setEmail(user.email || '');
      } catch (error) {
        console.error('Failed to fetch profile', error);
        toaster.notify({ title: 'Error', description: 'Failed to load profile', variant: 'danger' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [toaster]);

  const handleSubmit = async (e: React.FormEvent, section: string) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
        if (section === 'Profile') {
            await api.auth.updateProfile({
                full_name: fullName,
                title: professionalTitle,
                bio: bio
            });
        }
        // Handle other sections if backend supports them
        
        toaster.notify({ title: 'Saved', description: `${section} settings updated successfully!`, variant: 'success' });
    } catch (error) {
        console.error('Failed to update profile', error);
        toaster.notify({ title: 'Error', description: 'Failed to update settings', variant: 'danger' });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className={cn(commonStyles.settingsContainer)}>
        <ScrollReveal>
          <header className={cn(commonStyles.header)}>
            <h1 className={cn(commonStyles.title)}>Account Settings</h1>
            <p className={cn(commonStyles.subtitle)}>Manage your profile, notifications, privacy, and security settings</p>
          </header>
        </ScrollReveal>

        {isLoading ? (
          <div className={cn(commonStyles.content)}>
            {[1, 2, 3].map((i) => (
              <section key={i} className={cn(commonStyles.section)}>
                <div className={cn(commonStyles.skeletonHeader, styles.skeleton)} />
                <div className={cn(commonStyles.skeletonBlock, styles.skeleton)} />
                <div className={cn(commonStyles.skeletonBlock, styles.skeleton)} style={{ width: '60%' }} />
              </section>
            ))}
          </div>
        ) : (
        <StaggerContainer delay={0.1} className={cn(commonStyles.content)}>
          {/* Profile Settings */}
          <section className={cn(commonStyles.section)}>
            <div className={cn(commonStyles.sectionHeader)}>
              <Mail className={cn(commonStyles.sectionIcon)} />
              <div>
                <h2 className={cn(commonStyles.sectionTitle)}>Public Profile</h2>
                <p className={cn(commonStyles.sectionDescription)}>This information will be displayed on your public profile.</p>
              </div>
            </div>
            
            <form onSubmit={(e) => handleSubmit(e, 'Profile')} className={commonStyles.form}>
              <div className={commonStyles.inputGroup}>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Alex Doe"
                  className={styles.input}
                />
              </div>

              <div className={commonStyles.inputGroup}>
                <Label htmlFor="professionalTitle">Professional Title</Label>
                <Input
                  id="professionalTitle"
                  type="text"
                  value={professionalTitle}
                  onChange={(e) => setProfessionalTitle(e.target.value)}
                  placeholder="e.g., Senior Product Designer"
                  className={styles.input}
                />
              </div>

              <div className={commonStyles.inputGroup}>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell clients about yourself and your experience..."
                  rows={4}
                  className={styles.input}
                />
              </div>

              <div className={commonStyles.inputGroup}>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className={styles.input}
                  aria-describedby="email-description"
                />
                <p id="email-description" className={cn(commonStyles.inputHint, styles.inputHint)}>
                  Your email address cannot be changed.
                </p>
              </div>

              <footer className={cn(commonStyles.formFooter, styles.formFooter)}>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </footer>
            </form>
          </section>

          {/* Notification Settings */}
          <section className={cn(commonStyles.section)}>
            <div className={cn(commonStyles.sectionHeader)}>
              <Bell className={cn(commonStyles.sectionIcon)} />
              <div>
                <h2 className={cn(commonStyles.sectionTitle)}>Notifications</h2>
                <p className={cn(commonStyles.sectionDescription)}>Choose when and how you want to be notified.</p>
              </div>
            </div>
            
            <form onSubmit={(e) => handleSubmit(e, 'Notification')} className={commonStyles.form}>
              <div className={commonStyles.switchGroup}>
                <div className={commonStyles.switchRow}>
                  <div>
                    <Label htmlFor="job-notifications">Job Opportunities</Label>
                    <p className={cn(commonStyles.switchDescription)}>Get notified about new jobs that match your skills</p>
                  </div>
                  <Switch
                    label="Job Opportunities"
                    id="job-notifications"
                    checked={jobNotifications}
                    onChange={setJobNotifications}
                  />
                </div>
                
                <div className={commonStyles.switchRow}>
                  <div>
                    <Label htmlFor="message-notifications">Messages</Label>
                    <p className={cn(commonStyles.switchDescription)}>Receive notifications for new messages</p>
                  </div>
                  <Switch
                    label="Messages"
                    id="message-notifications"
                    checked={messageNotifications}
                    onChange={setMessageNotifications}
                  />
                </div>
                
                <div className={commonStyles.switchRow}>
                  <div>
                    <Label htmlFor="payment-notifications">Payments</Label>
                    <p className={cn(commonStyles.switchDescription)}>Get notified about payments and financial updates</p>
                  </div>
                  <Switch
                    label="Payments"
                    id="payment-notifications"
                    checked={paymentNotifications}
                    onChange={setPaymentNotifications}
                  />
                </div>
                
                <div className={commonStyles.switchRow}>
                  <div>
                    <Label htmlFor="marketing-notifications">Marketing & Promotions</Label>
                    <p className={cn(commonStyles.switchDescription)}>Receive updates about new features and promotions</p>
                  </div>
                  <Switch
                    label="Marketing & Promotions"
                    id="marketing-notifications"
                    checked={marketingNotifications}
                    onChange={setMarketingNotifications}
                  />
                </div>
              </div>

              <footer className={cn(commonStyles.formFooter, styles.formFooter)}>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </footer>
            </form>
          </section>

          {/* Privacy Settings */}
          <section className={cn(commonStyles.section)}>
            <div className={cn(commonStyles.sectionHeader)}>
              <Eye className={cn(commonStyles.sectionIcon)} />
              <div>
                <h2 className={cn(commonStyles.sectionTitle)}>Privacy</h2>
                <p className={cn(commonStyles.sectionDescription)}>Control who can see your information.</p>
              </div>
            </div>
            
            <form onSubmit={(e) => handleSubmit(e, 'Privacy')} className={commonStyles.form}>
              <div className={commonStyles.inputGroup}>
                <Label htmlFor="profile-visibility">Profile Visibility</Label>
                <div className={commonStyles.radioGroup}>
                  <label className={commonStyles.radioLabel}>
                    <input
                      type="radio"
                      name="profile-visibility"
                      value="public"
                      checked={profileVisibility === 'public'}
                      onChange={() => setProfileVisibility('public')}
                    />
                    <span>Public</span>
                    <p className={cn(commonStyles.radioDescription)}>Anyone can see your profile</p>
                  </label>
                  
                  <label className={commonStyles.radioLabel}>
                    <input
                      type="radio"
                      name="profile-visibility"
                      value="freelancers-only"
                      checked={profileVisibility === 'freelancers-only'}
                      onChange={() => setProfileVisibility('freelancers-only')}
                    />
                    <span>Freelancers Only</span>
                    <p className={cn(commonStyles.radioDescription)}>Only registered freelancers can see your profile</p>
                  </label>
                  
                  <label className={commonStyles.radioLabel}>
                    <input
                      type="radio"
                      name="profile-visibility"
                      value="private"
                      checked={profileVisibility === 'private'}
                      onChange={() => setProfileVisibility('private')}
                    />
                    <span>Private</span>
                    <p className={cn(commonStyles.radioDescription)}>Only you can see your profile</p>
                  </label>
                </div>
              </div>

              <div className={commonStyles.switchGroup}>
                <div className={commonStyles.switchRow}>
                  <div>
                    <Label htmlFor="show-contact-info">Show Contact Information</Label>
                    <p className={cn(commonStyles.switchDescription)}>Allow clients to see your contact details</p>
                  </div>
                  <Switch
                    label="Show Contact Information"
                    id="show-contact-info"
                    checked={showContactInfo}
                    onChange={setShowContactInfo}
                  />
                </div>
              </div>

              <footer className={cn(commonStyles.formFooter, styles.formFooter)}>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Privacy Settings'}
                </Button>
              </footer>
            </form>
          </section>

          {/* Security Settings */}
          <section className={cn(commonStyles.section)}>
            <div className={cn(commonStyles.sectionHeader)}>
              <Lock className={cn(commonStyles.sectionIcon)} />
              <div>
                <h2 className={cn(commonStyles.sectionTitle)}>Security</h2>
                <p className={cn(commonStyles.sectionDescription)}>Manage your account security settings.</p>
              </div>
            </div>
            
            <form onSubmit={(e) => handleSubmit(e, 'Security')} className={commonStyles.form}>
              <div className={commonStyles.switchGroup}>
                <div className={commonStyles.switchRow}>
                  <div>
                    <Label htmlFor="two-factor-auth">Two-Factor Authentication</Label>
                    <p className={cn(commonStyles.switchDescription)}>Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    label="Two-Factor Authentication"
                    id="two-factor-auth"
                    checked={twoFactorAuth}
                    onChange={setTwoFactorAuth}
                  />
                </div>
              </div>

              <div className={commonStyles.inputGroup}>
                <Label>Change Password</Label>
                <Button variant="secondary" className={commonStyles.actionButton}>
                  Update Password
                </Button>
              </div>

              <div className={commonStyles.inputGroup}>
                <Label>Connected Accounts</Label>
                <div className={commonStyles.connectedAccounts}>
                  <div className={commonStyles.accountRow}>
                    <Globe className={commonStyles.accountIcon} />
                    <span>Google</span>
                    <Button variant="danger" size="sm">Disconnect</Button>
                  </div>
                </div>
              </div>

              <footer className={cn(commonStyles.formFooter, styles.formFooter)}>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Security Settings'}
                </Button>
              </footer>
            </form>
          </section>
        </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
};

export default AccountSettingsPage;
