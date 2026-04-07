// @AI-HINT: Referral program page - Invite friends, earn rewards, ambassador tiers
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { referralApi as _referralApi } from '@/lib/api';
import Card from '@/app/components/molecules/Card/Card';
import Badge from '@/app/components/atoms/Badge/Badge';
import ProgressBar from '@/app/components/atoms/ProgressBar/ProgressBar';
import Button from '@/app/components/atoms/Button/Button';
import Input from '@/app/components/atoms/Input/Input';
import Loader from '@/app/components/atoms/Loader/Loader';
import { Modal } from '@/app/components/organisms/Modal';
import { PageTransition, ScrollReveal, StaggerContainer, StaggerItem } from '@/app/components/Animations';
import {
  Users, UserCheck, DollarSign, TrendingUp, Copy, Check, Share2, Mail,
  Gift, Target, Award, Star, Crown, ChevronRight, Link, Send, X, Plus,
  Clock, CheckCircle, AlertCircle, Eye, Zap
} from 'lucide-react';
import commonStyles from './Referral.common.module.css';
import lightStyles from './Referral.light.module.css';
import darkStyles from './Referral.dark.module.css';

const referralApi: any = _referralApi;

interface ReferralCode {
  code: string;
  uses_count: number;
  reward_per_referral: number;
}

interface ReferralStats {
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  conversion_rate: number;
}

interface Referral {
  id: string;
  referred_email: string;
  status: string;
  reward_amount: number;
  reward_paid: boolean;
  created_at: string;
}

const AMBASSADOR_TIERS = [
  { name: 'Starter', min: 0, max: 4, icon: Star, color: '#94a3b8', reward: '$25', perks: ['Basic referral link', 'Standard rewards'] },
  { name: 'Bronze', min: 5, max: 14, icon: Award, color: '#cd7f32', reward: '$30', perks: ['10% bonus rewards', 'Priority support'] },
  { name: 'Silver', min: 15, max: 29, icon: Award, color: '#c0c0c0', reward: '$40', perks: ['20% bonus rewards', 'Custom referral page'] },
  { name: 'Gold', min: 30, max: 49, icon: Crown, color: '#ffd700', reward: '$50', perks: ['30% bonus rewards', 'Featured ambassador badge'] },
  { name: 'Platinum', min: 50, max: Infinity, icon: Crown, color: '#e5e4e2', reward: '$75', perks: ['50% bonus rewards', 'VIP ambassador status', 'Exclusive events'] },
];

const TAB_ITEMS = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'referrals', label: 'My Referrals', icon: Users },
  { id: 'rewards', label: 'Rewards', icon: Gift },
  { id: 'leaderboard', label: 'Leaderboard', icon: TrendingUp },
];

export default function ReferralPage() {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [milestones, setMilestones] = useState<any>(null);
  const [shareLinks, setShareLinks] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [inviteEmails, setInviteEmails] = useState<string[]>(['']);
  const [inviteMessage, setInviteMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadReferralData = useCallback(async () => {
    try {
      setLoading(true);
      const [codeData, statsData, referralsData, milestonesData, shareLinksData] = await Promise.all([
        referralApi.getMyCode().catch(() => null),
        referralApi.getStats().catch(() => null),
        referralApi.getMyReferrals().catch(() => []),
        referralApi.getMilestones().catch(() => null),
        referralApi.getShareLinks().catch(() => null),
      ]);
      setCode(codeData);
      setStats(statsData);
      setReferrals(referralsData || []);
      setMilestones(milestonesData);
      setShareLinks(shareLinksData);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load referral data:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferralData();
  }, [loadReferralData]);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  }, []);

  // Theme check after all hooks
  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const addEmailField = () => {
    if (inviteEmails.length < 5) {
      setInviteEmails([...inviteEmails, '']);
    }
  };

  const updateEmail = (index: number, value: string) => {
    const updated = [...inviteEmails];
    updated[index] = value;
    setInviteEmails(updated);
  };

  const removeEmailField = (index: number) => {
    if (inviteEmails.length > 1) {
      setInviteEmails(inviteEmails.filter((_, i) => i !== index));
    }
  };

  const sendInvites = async () => {
    const validEmails = inviteEmails.filter(e => e.trim());
    if (validEmails.length === 0) return;
    try {
      setSending(true);
      await Promise.all(
        validEmails.map(email => referralApi.sendInvite(email, inviteMessage).catch(() => null))
      );
      setInviteEmails(['']);
      setInviteMessage('');
      setShowInviteModal(false);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send invites:', error);
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <Loader size="lg" />
      </div>
    );
  }

  const totalReferrals = stats?.successful_referrals || 0;
  const currentTier = AMBASSADOR_TIERS.find(t => totalReferrals >= t.min && totalReferrals <= t.max) || AMBASSADOR_TIERS[0];
  const nextTier = AMBASSADOR_TIERS[AMBASSADOR_TIERS.indexOf(currentTier) + 1];
  const tierProgress = nextTier ? ((totalReferrals - currentTier.min) / (nextTier.min - currentTier.min)) * 100 : 100;

  const nextMilestone = milestones?.next_milestone;
  const currentMilestoneRefs = milestones?.current_referrals || 0;
  const milestoneProgress = nextMilestone ? (currentMilestoneRefs / nextMilestone.referrals) * 100 : 100;

  const filteredReferrals = filterStatus === 'all' ? referrals : referrals.filter(r => r.status === filterStatus);

  const conversionRate = stats?.conversion_rate || 0;
  const conversionBarWidth = Math.min(conversionRate, 100);

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        {/* Header */}
        <ScrollReveal>
          <div className={cn(commonStyles.header, themeStyles.header)}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Referral Program</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Invite friends and earn rewards for every successful referral
              </p>
            </div>
            <div className={cn(commonStyles.headerActions)}>
              <Button variant="outline" onClick={() => setActiveTab('leaderboard')}>
                <TrendingUp size={16} /> Leaderboard
              </Button>
              <Button variant="primary" onClick={() => setShowInviteModal(true)}>
                <Mail size={16} /> Invite Friends
              </Button>
            </div>
          </div>
        </ScrollReveal>

        {/* Ambassador Tier Card */}
        <ScrollReveal delay={0.05}>
          <Card className={cn(commonStyles.tierCard, themeStyles.tierCard)}>
            <div className={cn(commonStyles.tierContent)}>
              <div className={cn(commonStyles.tierLeft)}>
                <div className={cn(commonStyles.tierIconWrap)} style={{ backgroundColor: currentTier.color + '20', color: currentTier.color }}>
                  <currentTier.icon size={28} />
                </div>
                <div className={cn(commonStyles.tierInfo)}>
                  <span className={cn(commonStyles.tierLabel, themeStyles.tierLabel)}>Ambassador Level</span>
                  <h3 className={cn(commonStyles.tierName, themeStyles.tierName)}>{currentTier.name}</h3>
                  <span className={cn(commonStyles.tierReward, themeStyles.tierReward)}>{currentTier.reward} per referral</span>
                </div>
              </div>
              {nextTier && (
                <div className={cn(commonStyles.tierRight)}>
                  <div className={cn(commonStyles.tierProgressInfo)}>
                    <span className={cn(commonStyles.tierProgressLabel, themeStyles.tierProgressLabel)}>
                      {nextTier.min - totalReferrals} more to {nextTier.name}
                    </span>
                    <span className={cn(commonStyles.tierProgressValue, themeStyles.tierProgressValue)}>
                      {totalReferrals}/{nextTier.min}
                    </span>
                  </div>
                  <div className={cn(commonStyles.tierProgressBar, themeStyles.tierProgressBar)}>
                    <div
                      className={cn(commonStyles.tierProgressFill, themeStyles.tierProgressFill)}
                      style={{ width: `${Math.min(tierProgress, 100)}%` }}
                    />
                  </div>
                  <div className={cn(commonStyles.tierPerks)}>
                    {nextTier.perks.map((perk, i) => (
                      <span key={i} className={cn(commonStyles.tierPerk, themeStyles.tierPerk)}>
                        <Zap size={12} /> {perk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </ScrollReveal>

        {/* Referral Code Card */}
        <ScrollReveal delay={0.1}>
          <Card className={cn(commonStyles.codeCard, themeStyles.codeCard)}>
            <div className={cn(commonStyles.codeContent, themeStyles.codeContent)}>
              <div className={cn(commonStyles.codeLeft, themeStyles.codeLeft)}>
                <h3>Your Referral Code</h3>
                <div className={cn(commonStyles.codeDisplay, themeStyles.codeDisplay)}>
                  <span className={cn(commonStyles.code, themeStyles.code)}>{code?.code || 'LOADING...'}</span>
                  <button
                    type="button"
                    onClick={() => code?.code && copyToClipboard(code.code, 'code')}
                    className={cn(commonStyles.copyBtn, themeStyles.copyBtn)}
                    aria-label="Copy referral code"
                  >
                    {copiedItem === 'code' ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
                  </button>
                </div>
                <p className={cn(commonStyles.codeHint, themeStyles.codeHint)}>
                  Share this code and earn {currentTier.reward} for each signup!
                </p>
              </div>
              <div className={cn(commonStyles.codeRight, themeStyles.codeRight)}>
                <div className={cn(commonStyles.codeUsage, themeStyles.codeUsage)}>
                  <span className={cn(commonStyles.usageNumber, themeStyles.usageNumber)}>{code?.uses_count || 0}</span>
                  <span className={cn(commonStyles.usageLabel, themeStyles.usageLabel)}>Total Uses</span>
                </div>
              </div>
            </div>
          </Card>
        </ScrollReveal>

        {/* Stats Cards */}
        <StaggerContainer className={cn(commonStyles.statsGrid, themeStyles.statsGrid)}>
          {[
            { icon: Users, value: stats?.total_referrals || 0, label: 'Total Referrals', color: '#4573df' },
            { icon: UserCheck, value: stats?.successful_referrals || 0, label: 'Successful', color: '#22c55e' },
            { icon: DollarSign, value: `$${stats?.total_earnings?.toFixed(2) || '0.00'}`, label: 'Total Earnings', color: '#f59e0b' },
            { icon: TrendingUp, value: `${conversionRate.toFixed(1)}%`, label: 'Conversion Rate', color: '#8b5cf6' },
          ].map((stat) => (
            <StaggerItem key={stat.label}>
              <Card className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statIconWrap, themeStyles.statIconWrap)} style={{ backgroundColor: stat.color + '15', color: stat.color }}>
                  <stat.icon size={20} />
                </div>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stat.value}</div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>{stat.label}</div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Conversion Funnel */}
        <ScrollReveal delay={0.15}>
          <Card className={cn(commonStyles.funnelCard, themeStyles.funnelCard)}>
            <h3 className={cn(commonStyles.funnelTitle, themeStyles.funnelTitle)}>Referral Funnel</h3>
            <div className={cn(commonStyles.funnelSteps)}>
              {[
                { label: 'Invites Sent', value: stats?.total_referrals || 0, width: 100 },
                { label: 'Signed Up', value: (stats?.successful_referrals || 0) + (stats?.pending_referrals || 0), width: stats?.total_referrals ? (((stats?.successful_referrals || 0) + (stats?.pending_referrals || 0)) / stats.total_referrals) * 100 : 0 },
                { label: 'Qualified', value: stats?.successful_referrals || 0, width: stats?.total_referrals ? ((stats?.successful_referrals || 0) / stats.total_referrals) * 100 : 0 },
              ].map((step, i) => (
                <div key={step.label} className={cn(commonStyles.funnelStep)}>
                  <div className={cn(commonStyles.funnelStepHeader)}>
                    <span className={cn(commonStyles.funnelStepLabel, themeStyles.funnelStepLabel)}>{step.label}</span>
                    <span className={cn(commonStyles.funnelStepValue, themeStyles.funnelStepValue)}>{step.value}</span>
                  </div>
                  <div className={cn(commonStyles.funnelBar, themeStyles.funnelBar)}>
                    <div
                      className={cn(commonStyles.funnelBarFill, themeStyles.funnelBarFill)}
                      style={{ width: `${Math.max(step.width, 3)}%`, opacity: 1 - i * 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </ScrollReveal>

        {/* Milestone Progress */}
        {nextMilestone && (
          <ScrollReveal delay={0.2}>
            <Card className={cn(commonStyles.milestoneCard, themeStyles.milestoneCard)}>
              <div className={cn(commonStyles.milestoneHeader, themeStyles.milestoneHeader)}>
                <h3><Target size={18} /> Next Milestone</h3>
                <Badge variant="warning">${nextMilestone.bonus} Bonus</Badge>
              </div>
              <div className={cn(commonStyles.milestoneProgress, themeStyles.milestoneProgress)}>
                <ProgressBar {...{value: milestoneProgress, max: 100, showLabel: false} as any} />
                <span>{currentMilestoneRefs} / {nextMilestone.referrals} referrals</span>
              </div>
              <div className={cn(commonStyles.milestonesList, themeStyles.milestonesList)}>
                {milestones?.milestones?.map((m: any) => (
                  <div
                    key={m.referrals}
                    className={cn(commonStyles.milestoneItem, themeStyles.milestoneItem, m.achieved && commonStyles.milestoneAchieved, m.achieved && themeStyles.milestoneAchieved)}
                  >
                    {m.achieved ? <CheckCircle size={14} /> : <Target size={14} />}
                    <span>{m.referrals} referrals</span>
                    <span>${m.bonus}</span>
                  </div>
                ))}
              </div>
            </Card>
          </ScrollReveal>
        )}

        {/* Share Links */}
        <ScrollReveal delay={0.3}>
          <Card className={cn(commonStyles.shareCard, themeStyles.shareCard)}>
            <h3 className={cn(commonStyles.shareTitle, themeStyles.shareTitle)}>
              <Share2 size={18} /> Share Your Link
            </h3>
            <div className={cn(commonStyles.shareLinkContainer, themeStyles.shareLinkContainer)}>
              <div className={cn(commonStyles.shareLinkInput, themeStyles.shareLinkInput)}>
                <Link size={16} />
                <input
                  type="text"
                  value={shareLinks?.direct_link || ''}
                  readOnly
                  aria-label="Referral link"
                  className={cn(commonStyles.shareInput, themeStyles.shareInput)}
                />
              </div>
              <button
                type="button"
                onClick={() => shareLinks?.direct_link && copyToClipboard(shareLinks.direct_link, 'link')}
                className={cn(commonStyles.copyLinkBtn, themeStyles.copyLinkBtn)}
              >
                {copiedItem === 'link' ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Link</>}
              </button>
            </div>
            <div className={cn(commonStyles.socialButtons, themeStyles.socialButtons)}>
              <a href={shareLinks?.twitter || '#'} target="_blank" rel="noopener noreferrer"
                 className={cn(commonStyles.socialBtn, themeStyles.socialBtn, themeStyles.twitter)}>
                𝕏 Twitter
              </a>
              <a href={shareLinks?.facebook || '#'} target="_blank" rel="noopener noreferrer"
                 className={cn(commonStyles.socialBtn, themeStyles.socialBtn, themeStyles.facebook)}>
                Facebook
              </a>
              <a href={shareLinks?.linkedin || '#'} target="_blank" rel="noopener noreferrer"
                 className={cn(commonStyles.socialBtn, themeStyles.socialBtn, themeStyles.linkedin)}>
                LinkedIn
              </a>
              <a href={shareLinks?.whatsapp || '#'} target="_blank" rel="noopener noreferrer"
                 className={cn(commonStyles.socialBtn, themeStyles.socialBtn, themeStyles.whatsapp)}>
                WhatsApp
              </a>
            </div>
          </Card>
        </ScrollReveal>

        {/* Custom Tab Navigation */}
        <ScrollReveal delay={0.35}>
          <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
            {TAB_ITEMS.map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(commonStyles.tab, themeStyles.tab, activeTab === tab.id && commonStyles.tabActive, activeTab === tab.id && themeStyles.tabActive)}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className={cn(commonStyles.tabContent, themeStyles.tabContent)}>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className={cn(commonStyles.howItWorks, themeStyles.howItWorks)}>
                <h3>How It Works</h3>
                <div className={cn(commonStyles.steps, themeStyles.steps)}>
                  {[
                    { num: 1, icon: Share2, title: 'Share Your Code', desc: 'Share your unique referral code or link with friends' },
                    { num: 2, icon: UserCheck, title: 'Friend Signs Up', desc: 'They create an account using your referral code' },
                    { num: 3, icon: CheckCircle, title: 'Complete First Project', desc: 'When they complete their first project, you both earn!' },
                    { num: 4, icon: Gift, title: 'Get Rewarded', desc: `Earn ${currentTier.reward} for each successful referral` },
                  ].map((step) => (
                    <div key={step.num} className={cn(commonStyles.step, themeStyles.step)}>
                      <div className={cn(commonStyles.stepNumber, themeStyles.stepNumber)}>{step.num}</div>
                      <step.icon size={24} className={cn(commonStyles.stepIcon, themeStyles.stepIcon)} />
                      <h4>{step.title}</h4>
                      <p>{step.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Ambassador Tiers Overview */}
                <div className={cn(commonStyles.tiersOverview, themeStyles.tiersOverview)}>
                  <h4>Ambassador Tiers</h4>
                  <div className={cn(commonStyles.tiersList)}>
                    {AMBASSADOR_TIERS.map((tier) => (
                      <div
                        key={tier.name}
                        className={cn(commonStyles.tierItem, themeStyles.tierItem, tier.name === currentTier.name && commonStyles.tierItemActive, tier.name === currentTier.name && themeStyles.tierItemActive)}
                      >
                        <tier.icon size={20} style={{ color: tier.color }} />
                        <span className={cn(commonStyles.tierItemName, themeStyles.tierItemName)}>{tier.name}</span>
                        <span className={cn(commonStyles.tierItemReward, themeStyles.tierItemReward)}>{tier.reward}</span>
                        <span className={cn(commonStyles.tierItemReq, themeStyles.tierItemReq)}>
                          {tier.max === Infinity ? `${tier.min}+` : `${tier.min}-${tier.max}`} referrals
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Referrals Tab */}
            {activeTab === 'referrals' && (
              <Card className={cn(commonStyles.referralsCard, themeStyles.referralsCard)}>
                <div className={cn(commonStyles.referralsHeader)}>
                  <h3>Your Referrals</h3>
                  <div className={cn(commonStyles.filterBtns)}>
                    {['all', 'pending', 'qualified', 'expired'].map((f) => (
                      <button
                        type="button"
                        key={f}
                        onClick={() => setFilterStatus(f)}
                        className={cn(commonStyles.filterBtn, themeStyles.filterBtn, filterStatus === f && commonStyles.filterBtnActive, filterStatus === f && themeStyles.filterBtnActive)}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {f === 'all' && ` (${referrals.length})`}
                      </button>
                    ))}
                  </div>
                </div>
                {filteredReferrals.length === 0 ? (
                  <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                    <Users size={48} />
                    <p>{filterStatus === 'all' ? 'No referrals yet. Start sharing your code!' : `No ${filterStatus} referrals.`}</p>
                    {filterStatus === 'all' && (
                      <Button variant="primary" size="sm" onClick={() => setShowInviteModal(true)}>
                        <Mail size={14} /> Invite Friends
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className={cn(commonStyles.referralsList, themeStyles.referralsList)}>
                    {filteredReferrals.map((ref) => (
                      <div key={ref.id} className={cn(commonStyles.referralItem, themeStyles.referralItem)}>
                        <div className={cn(commonStyles.referralAvatar, themeStyles.referralAvatar)}>
                          {ref.referred_email.charAt(0).toUpperCase()}
                        </div>
                        <div className={cn(commonStyles.referralInfo, themeStyles.referralInfo)}>
                          <span className={cn(commonStyles.referralEmail, themeStyles.referralEmail)}>{ref.referred_email}</span>
                          <span className={cn(commonStyles.referralDate, themeStyles.referralDate)}>
                            <Clock size={12} /> {new Date(ref.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={cn(commonStyles.referralStatus, themeStyles.referralStatus)}>
                          <Badge variant={(ref.status === 'qualified' ? 'success' : ref.status === 'pending' ? 'warning' : 'default') as any}>
                            {ref.status}
                          </Badge>
                          {ref.reward_paid && (
                            <span className={cn(commonStyles.rewardPaid, themeStyles.rewardPaid)}>
                              <DollarSign size={14} />+{ref.reward_amount}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Rewards Tab */}
            {activeTab === 'rewards' && (
              <div className={cn(commonStyles.rewardsTab)}>
                <Card className={cn(commonStyles.rewardsCard, themeStyles.rewardsCard)}>
                  <h3 className={cn(commonStyles.rewardsTitle, themeStyles.rewardsTitle)}>Earnings Overview</h3>
                  <div className={cn(commonStyles.rewardsSummary, themeStyles.rewardsSummary)}>
                    <div className={cn(commonStyles.rewardBox, themeStyles.rewardBox, commonStyles.rewardTotal)}>
                      <DollarSign size={20} />
                      <div>
                        <span>Total Earned</span>
                        <strong>${stats?.total_earnings?.toFixed(2) || '0.00'}</strong>
                      </div>
                    </div>
                    <div className={cn(commonStyles.rewardBox, themeStyles.rewardBox, commonStyles.rewardPendingBox)}>
                      <Clock size={20} />
                      <div>
                        <span>Pending</span>
                        <strong>${stats?.pending_earnings?.toFixed(2) || '0.00'}</strong>
                      </div>
                    </div>
                    <div className={cn(commonStyles.rewardBox, themeStyles.rewardBox, commonStyles.rewardAvailable)}>
                      <CheckCircle size={20} />
                      <div>
                        <span>Available</span>
                        <strong>${((stats?.total_earnings || 0) - (stats?.pending_earnings || 0)).toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                  <Button variant="primary" disabled={!stats?.pending_earnings} fullWidth>
                    <DollarSign size={16} /> Withdraw Rewards
                  </Button>
                </Card>

                {/* Reward History */}
                <Card className={cn(commonStyles.rewardHistory, themeStyles.rewardHistory)}>
                  <h3>Reward History</h3>
                  {referrals.filter(r => r.reward_paid).length === 0 ? (
                    <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                      <Gift size={48} />
                      <p>No rewards earned yet. Keep referring!</p>
                    </div>
                  ) : (
                    <div className={cn(commonStyles.rewardHistoryList)}>
                      {referrals.filter(r => r.reward_paid).map((ref) => (
                        <div key={ref.id} className={cn(commonStyles.rewardHistoryItem, themeStyles.rewardHistoryItem)}>
                          <div className={cn(commonStyles.rewardHistoryIcon, themeStyles.rewardHistoryIcon)}>
                            <CheckCircle size={16} />
                          </div>
                          <div className={cn(commonStyles.rewardHistoryInfo)}>
                            <span className={cn(commonStyles.rewardHistoryDesc, themeStyles.rewardHistoryDesc)}>
                              Referral reward for {ref.referred_email}
                            </span>
                            <span className={cn(commonStyles.rewardHistoryDate, themeStyles.rewardHistoryDate)}>
                              {new Date(ref.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <span className={cn(commonStyles.rewardHistoryAmount, themeStyles.rewardHistoryAmount)}>
                            +${ref.reward_amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <Card className={cn(commonStyles.leaderboardCard, themeStyles.leaderboardCard)}>
                <h3>Top Referrers This Month</h3>
                <div className={cn(commonStyles.leaderboardList)}>
                  {[
                    { rank: 1, name: 'You', refs: stats?.successful_referrals || 0, earned: stats?.total_earnings || 0, isYou: true },
                  ].map((entry) => (
                    <div key={entry.rank} className={cn(commonStyles.leaderboardEntry, themeStyles.leaderboardEntry, entry.isYou && commonStyles.leaderboardEntryCurrent, entry.isYou && themeStyles.leaderboardEntryCurrent)}>
                      <div className={cn(commonStyles.leaderboardRank, themeStyles.leaderboardRank)}>
                        {entry.rank <= 3 ? <Crown size={18} style={{ color: entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : '#cd7f32' }} /> : `#${entry.rank}`}
                      </div>
                      <div className={cn(commonStyles.leaderboardInfo)}>
                        <span className={cn(commonStyles.leaderboardName, themeStyles.leaderboardName)}>{entry.name}</span>
                        <span className={cn(commonStyles.leaderboardStats, themeStyles.leaderboardStats)}>{entry.refs} referrals · ${entry.earned.toFixed(2)} earned</span>
                      </div>
                      {entry.isYou && <Badge variant="primary">You</Badge>}
                    </div>
                  ))}
                  <div className={cn(commonStyles.leaderboardNote, themeStyles.leaderboardNote)}>
                    <AlertCircle size={14} />
                    <span>Full leaderboard updates weekly. Keep referring to climb the ranks!</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </ScrollReveal>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className={cn(commonStyles.modalOverlay)} onClick={() => setShowInviteModal(false)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={(e) => e.stopPropagation()}>
              <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
                <h3><Mail size={20} /> Invite Friends</h3>
                <button type="button" onClick={() => setShowInviteModal(false)} className={cn(commonStyles.modalClose, themeStyles.modalClose)} aria-label="Close modal">
                  <X size={20} />
                </button>
              </div>
              <div className={cn(commonStyles.modalBody)}>
                <div className={cn(commonStyles.formGroup)}>
                  <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>
                    Email Addresses ({inviteEmails.length}/5)
                  </label>
                  {inviteEmails.map((email, idx) => (
                    <div key={idx} className={cn(commonStyles.emailRow)}>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => updateEmail(idx, e.target.value)}
                        placeholder="friend@example.com"
                      />
                      {inviteEmails.length > 1 && (
                        <button type="button" onClick={() => removeEmailField(idx)} className={cn(commonStyles.removeEmailBtn, themeStyles.removeEmailBtn)} aria-label="Remove email">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  {inviteEmails.length < 5 && (
                    <button type="button" onClick={addEmailField} className={cn(commonStyles.addEmailBtn, themeStyles.addEmailBtn)}>
                      <Plus size={14} /> Add another email
                    </button>
                  )}
                </div>
                <div className={cn(commonStyles.formGroup)}>
                  <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>Personal Message (optional)</label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Hey! I've been using MegiLance and thought you'd love it..."
                    className={cn(commonStyles.messageTextarea, themeStyles.messageTextarea)}
                    rows={3}
                  />
                </div>
              </div>
              <div className={cn(commonStyles.modalFooter)}>
                <Button variant="ghost" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={sendInvites} isLoading={sending}>
                  <Send size={16} /> Send {inviteEmails.filter(e => e.trim()).length > 1 ? `${inviteEmails.filter(e => e.trim()).length} Invites` : 'Invite'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
