// @AI-HINT: Verification Center - ID verification, trust tiers, and verified badges
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer, StaggerItem } from '@/app/components/Animations';
import { apiFetch } from '@/lib/api/core';
import Button from '@/app/components/Button/Button';
import {
  ShieldCheck, Mail, Phone, CreditCard, Target, MapPin, IdCard,
  CheckCircle, Clock, XCircle, Circle, Upload, FileText, Lock,
  ChevronRight, Award, Star, Crown, X, AlertTriangle, Info, RefreshCw
} from 'lucide-react';
import commonStyles from './Verification.common.module.css';
import lightStyles from './Verification.light.module.css';
import darkStyles from './Verification.dark.module.css';

interface VerificationItem {
  id: string;
  type: 'identity' | 'email' | 'phone' | 'payment' | 'skills' | 'address';
  name: string;
  description: string;
  status: 'verified' | 'pending' | 'unverified' | 'failed';
  verifiedAt?: string;
  required: boolean;
}

interface VerificationTier {
  id: string;
  name: string;
  level: number;
  requirements: string[];
  benefits: string[];
  badgeColor: string;
  achieved: boolean;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  email: <Mail size={22} />,
  phone: <Phone size={22} />,
  identity: <IdCard size={22} />,
  payment: <CreditCard size={22} />,
  skills: <Target size={22} />,
  address: <MapPin size={22} />,
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  basic: <Circle size={20} />,
  verified: <CheckCircle size={20} />,
  trusted: <Star size={20} />,
  elite: <Crown size={20} />,
};

export default function VerificationPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [tiers, setTiers] = useState<VerificationTier[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<VerificationItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchVerificationData();
  }, []);

  const fetchVerificationData = async () => {
    setLoading(true);
    try {
      const { verificationApi, authApi } = await import('@/lib/api') as any;

      const [verificationStatus, userProfile] = await Promise.all([
        verificationApi.getStatus().catch(() => null),
        authApi.me().catch(() => null),
      ]);

      const defaultVerifications: VerificationItem[] = [
        { id: 'v1', type: 'email', name: 'Email Verification', description: 'Verify your email address to receive notifications', status: 'unverified', required: true },
        { id: 'v2', type: 'phone', name: 'Phone Verification', description: 'Add SMS authentication for extra security', status: 'unverified', required: false },
        { id: 'v3', type: 'identity', name: 'Identity Verification', description: 'Verify your identity with government-issued ID', status: 'unverified', required: true },
        { id: 'v4', type: 'payment', name: 'Payment Method', description: 'Add a verified payment method for transactions', status: 'unverified', required: true },
        { id: 'v5', type: 'skills', name: 'Skills Assessment', description: 'Pass skill tests to earn verified skill badges', status: 'unverified', required: false },
        { id: 'v6', type: 'address', name: 'Address Verification', description: 'Verify your business or home address', status: 'unverified', required: false },
      ];

      if (verificationStatus || userProfile) {
        const emailVerified = userProfile?.email_verified || verificationStatus?.email_verified;
        const phoneVerified = userProfile?.phone_verified || verificationStatus?.phone_verified;
        const identityVerified = verificationStatus?.identity_verified;
        const paymentVerified = verificationStatus?.payment_verified;
        const skillsVerified = verificationStatus?.skills_verified;
        const addressVerified = verificationStatus?.address_verified;

        defaultVerifications[0].status = emailVerified ? 'verified' : 'unverified';
        if (emailVerified) defaultVerifications[0].verifiedAt = new Date().toISOString();

        defaultVerifications[1].status = phoneVerified ? 'verified' : 'unverified';
        if (phoneVerified) defaultVerifications[1].verifiedAt = new Date().toISOString();

        defaultVerifications[2].status = identityVerified === 'pending' ? 'pending' : identityVerified ? 'verified' : 'unverified';
        defaultVerifications[3].status = paymentVerified ? 'verified' : 'unverified';
        defaultVerifications[4].status = skillsVerified ? 'verified' : 'unverified';
        defaultVerifications[5].status = addressVerified ? 'verified' : 'unverified';
      }

      const verifiedCount = defaultVerifications.filter(v => v.status === 'verified').length;

      const defaultTiers: VerificationTier[] = [
        {
          id: 'basic', name: 'Basic', level: 1,
          requirements: ['Email verified'],
          benefits: ['Create profile', 'Browse jobs', 'Send messages'],
          badgeColor: '#94a3b8', achieved: verifiedCount >= 1
        },
        {
          id: 'verified', name: 'Verified', level: 2,
          requirements: ['Email verified', 'Phone verified', 'Payment method added'],
          benefits: ['Submit proposals', 'Priority in search', 'Verified badge'],
          badgeColor: '#3b82f6', achieved: verifiedCount >= 3
        },
        {
          id: 'trusted', name: 'Trusted', level: 3,
          requirements: ['Identity verified', 'Skills assessment passed', '5+ completed jobs'],
          benefits: ['Top search ranking', 'Reduced fees', 'Premium support', 'Trusted badge'],
          badgeColor: '#8b5cf6', achieved: verifiedCount >= 5
        },
        {
          id: 'elite', name: 'Elite', level: 4,
          requirements: ['All verifications complete', '20+ completed jobs', '4.8+ rating'],
          benefits: ['Featured profile', 'Dedicated manager', 'Exclusive opportunities', 'Elite badge'],
          badgeColor: '#f59e0b', achieved: verifiedCount >= 6
        }
      ];

      setVerifications(defaultVerifications);
      setTiers(defaultTiers);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch verification data:', error);
      }
      setVerifications([]);
      setTiers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (verification: VerificationItem) => {
    if (verification.type === 'identity' || verification.type === 'address') {
      setSelectedVerification(verification);
      setShowUploadModal(true);
    } else if (verification.type === 'skills') {
      router.push('/freelancer/assessments');
    }
  };

  const handleUpload = async () => {
    if (!selectedVerification || !selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('document_type', selectedVerification.type === 'identity' ? 'national_id' : 'address_proof');

      await apiFetch('/verification/upload-document', {
        method: 'POST',
        body: formData,
      });

      setVerifications(prev => prev.map(v =>
        v.id === selectedVerification.id ? { ...v, status: 'pending' as const } : v
      ));
      setShowUploadModal(false);
      setSelectedVerification(null);
      setSelectedFile(null);
      showToast('Document submitted for review');
    } catch (error: any) {
      showToast(error?.detail || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'failed': return <XCircle size={14} />;
      default: return <Circle size={14} />;
    }
  };

  const verifiedCount = verifications.filter(v => v.status === 'verified').length;
  const totalCount = verifications.length;
  const progressPercent = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  const currentTier = tiers.filter(t => t.achieved).pop();
  const nextTier = tiers.find(t => !t.achieved);

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div className={commonStyles.headerText}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>
                <ShieldCheck size={24} className={commonStyles.titleIcon} />
                Verification Center
              </h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Build trust and unlock more opportunities by verifying your profile
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchVerificationData}>
              <RefreshCw size={14} /> Refresh
            </Button>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={cn(commonStyles.loadingState, themeStyles.loadingState)}>
            <ShieldCheck size={32} className={commonStyles.loadingIcon} />
            Loading verification status...
          </div>
        ) : (
          <>
            {/* Progress Overview */}
            <ScrollReveal>
              <div className={cn(commonStyles.progressCard, themeStyles.progressCard)}>
                <div className={commonStyles.progressHeader}>
                  <div>
                    <h2 className={cn(commonStyles.progressTitle, themeStyles.progressTitle)}>
                      <Award size={18} /> Verification Progress
                    </h2>
                    <p className={cn(commonStyles.progressSubtitle, themeStyles.progressSubtitle)}>
                      {verifiedCount} of {totalCount} verifications complete
                    </p>
                  </div>
                  {currentTier && (
                    <div className={commonStyles.currentTier}>
                      <span className={cn(commonStyles.tierBadge, themeStyles.tierBadge)} style={{ backgroundColor: currentTier.badgeColor }}>
                        {TIER_ICONS[currentTier.id]} {currentTier.name}
                      </span>
                    </div>
                  )}
                </div>
                <div className={cn(commonStyles.progressBar, themeStyles.progressBar)}>
                  <div
                    className={cn(commonStyles.progressFill, themeStyles.progressFill)}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className={commonStyles.progressStats}>
                  <span className={cn(commonStyles.progressPercent, themeStyles.progressPercent)}>
                    {progressPercent}%
                  </span>
                  {nextTier && (
                    <p className={cn(commonStyles.nextTierHint, themeStyles.nextTierHint)}>
                      <ChevronRight size={14} /> Complete more verifications to reach <strong>{nextTier.name}</strong> tier
                    </p>
                  )}
                </div>
              </div>
            </ScrollReveal>

            {/* Tiers */}
            <div className={commonStyles.tiersSection}>
              <ScrollReveal>
                <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                  <Star size={18} /> Trust Tiers
                </h3>
              </ScrollReveal>
              <StaggerContainer className={commonStyles.tiersGrid}>
                {tiers.map((tier) => (
                  <StaggerItem
                    key={tier.id}
                    className={cn(
                      commonStyles.tierCard,
                      themeStyles.tierCard,
                      tier.achieved && commonStyles.tierAchieved,
                      tier.achieved && themeStyles.tierAchieved
                    )}
                  >
                    <div
                      className={commonStyles.tierIcon}
                      style={{ backgroundColor: tier.badgeColor }}
                    >
                      {tier.achieved ? <CheckCircle size={20} /> : TIER_ICONS[tier.id]}
                    </div>
                    <h4 className={cn(commonStyles.tierName, themeStyles.tierName)}>{tier.name}</h4>
                    <ul className={commonStyles.tierBenefits}>
                      {tier.benefits.slice(0, 2).map((benefit, idx) => (
                        <li key={idx} className={cn(commonStyles.tierBenefit, themeStyles.tierBenefit)}>
                          <CheckCircle size={10} /> {benefit}
                        </li>
                      ))}
                      {tier.benefits.length > 2 && (
                        <li className={cn(commonStyles.tierBenefit, themeStyles.tierBenefit)}>
                          +{tier.benefits.length - 2} more
                        </li>
                      )}
                    </ul>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>

            {/* Verification Items */}
            <div className={commonStyles.verificationsSection}>
              <ScrollReveal>
                <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                  <ShieldCheck size={18} /> Verifications
                </h3>
              </ScrollReveal>
              <StaggerContainer className={commonStyles.verificationsList}>
                {verifications.map(verification => (
                  <StaggerItem key={verification.id} className={cn(commonStyles.verificationCard, themeStyles.verificationCard)}>
                    <div className={cn(commonStyles.verificationIcon, themeStyles.verificationIcon)}>
                      {TYPE_ICONS[verification.type]}
                    </div>
                    <div className={commonStyles.verificationInfo}>
                      <div className={commonStyles.verificationHeader}>
                        <h4 className={cn(commonStyles.verificationName, themeStyles.verificationName)}>
                          {verification.name}
                          {verification.required && (
                            <span className={cn(commonStyles.requiredBadge, themeStyles.requiredBadge)}>Required</span>
                          )}
                        </h4>
                        <span className={cn(
                          commonStyles.status,
                          commonStyles[`status${verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}` as keyof typeof commonStyles],
                          themeStyles[`status${verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}` as keyof typeof themeStyles]
                        )}>
                          {getStatusIcon(verification.status)} {verification.status}
                        </span>
                      </div>
                      <p className={cn(commonStyles.verificationDesc, themeStyles.verificationDesc)}>
                        {verification.description}
                      </p>
                      {verification.verifiedAt && (
                        <span className={cn(commonStyles.verifiedDate, themeStyles.verifiedDate)}>
                          <CheckCircle size={12} /> Verified on {new Date(verification.verifiedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className={commonStyles.verificationAction}>
                      {verification.status === 'unverified' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleVerify(verification)}
                        >
                          Verify
                        </Button>
                      )}
                      {verification.status === 'pending' && (
                        <span className={cn(commonStyles.pendingLabel, themeStyles.pendingLabel)}>
                          <Clock size={12} /> Under Review
                        </span>
                      )}
                      {verification.status === 'failed' && (
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleVerify(verification)}
                        >
                          <RefreshCw size={14} /> Retry
                        </Button>
                      )}
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </>
        )}

        {/* Upload Modal */}
        {showUploadModal && selectedVerification && (
          <div className={commonStyles.modalOverlay} onClick={() => !uploading && setShowUploadModal(false)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
              <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
                <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                  {TYPE_ICONS[selectedVerification.type]} {selectedVerification.name}
                </h2>
                <button
                  className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                  onClick={() => !uploading && setShowUploadModal(false)}
                  disabled={uploading}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
              <div className={commonStyles.modalContent}>
                <p className={cn(commonStyles.modalDesc, themeStyles.modalDesc)}>
                  {selectedVerification.type === 'identity'
                    ? 'Please upload a clear photo of your government-issued ID (passport, driver\'s license, or national ID card).'
                    : 'Please upload a document proving your address (utility bill, bank statement, etc.).'
                  }
                </p>
                <div className={cn(commonStyles.uploadArea, themeStyles.uploadArea)}>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className={commonStyles.fileInput}
                    onChange={handleFileChange}
                  />
                  <div className={commonStyles.uploadPlaceholder}>
                    <span className={cn(commonStyles.uploadIcon, themeStyles.uploadIcon)}>
                      {selectedFile ? <CheckCircle size={28} /> : <Upload size={28} />}
                    </span>
                    <span className={cn(commonStyles.uploadText, themeStyles.uploadText)}>
                      {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </span>
                    <span className={cn(commonStyles.uploadHint, themeStyles.uploadHint)}>
                      <FileText size={12} /> PNG, JPG, or PDF up to 10MB
                    </span>
                  </div>
                </div>
                <div className={cn(commonStyles.securityNote, themeStyles.securityNote)}>
                  <Lock size={14} />
                  <span>Your documents are encrypted and handled securely. We never share your personal information.</span>
                </div>
              </div>
              <div className={cn(commonStyles.modalActions, themeStyles.modalActions)}>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  isLoading={uploading}
                >
                  <Upload size={14} /> Submit for Review
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={cn(
            commonStyles.toast,
            themeStyles.toast,
            toast.type === 'error' && themeStyles.toastError
          )}>
            {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
            {toast.message}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
