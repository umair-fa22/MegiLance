// @AI-HINT: Referral program page - Invite friends, earn rewards
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { referralApi as _referralApi } from '@/lib/api';
import Card from '@/app/components/Card/Card';
import Badge from '@/app/components/Badge/Badge';
import ProgressBar from '@/app/components/ProgressBar/ProgressBar';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Loader from '@/app/components/Loader/Loader';
import { Modal } from '@/app/components/Modal';
import Tabs from '@/app/components/Tabs/Tabs';
import { PageTransition, ScrollReveal, StaggerContainer, StaggerItem } from '@/app/components/Animations';
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

export default function ReferralPage() {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [milestones, setMilestones] = useState<any>(null);
  const [shareLinks, setShareLinks] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const [codeData, statsData, referralsData, milestonesData, shareLinksData] = await Promise.all([
        referralApi.getMyCode(),
        referralApi.getStats(),
        referralApi.getMyReferrals(),
        referralApi.getMilestones(),
        referralApi.getShareLinks(),
      ]);
      setCode(codeData);
      setStats(statsData);
      setReferrals(referralsData);
      setMilestones(milestonesData);
      setShareLinks(shareLinksData);
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (code?.code) {
      navigator.clipboard.writeText(code.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyLink = () => {
    if (shareLinks?.direct_link) {
      navigator.clipboard.writeText(shareLinks.direct_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail) return;
    try {
      setSending(true);
      await referralApi.sendInvite(inviteEmail, inviteMessage);
      setInviteEmail('');
      setInviteMessage('');
      setShowInviteModal(false);
    } catch (error) {
      console.error('Failed to send invite:', error);
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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'referrals', label: 'My Referrals' },
    { id: 'rewards', label: 'Rewards' },
  ];

  const nextMilestone = milestones?.next_milestone;
  const currentReferrals = milestones?.current_referrals || 0;
  const milestoneProgress = nextMilestone 
    ? (currentReferrals / nextMilestone.referrals) * 100 
    : 100;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={cn(commonStyles.header, themeStyles.header)}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Referral Program</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Invite friends and earn rewards for every successful referral
              </p>
            </div>
            <Button variant="primary" onClick={() => setShowInviteModal(true)}>
              📧 Invite Friends
            </Button>
          </div>
        </ScrollReveal>

        {/* Referral Code Card */}
        <ScrollReveal delay={0.1}>
          <Card className={cn(commonStyles.codeCard, themeStyles.codeCard)}>
            <div className={cn(commonStyles.codeContent, themeStyles.codeContent)}>
              <div className={cn(commonStyles.codeLeft, themeStyles.codeLeft)}>
                <h3>Your Referral Code</h3>
                <div className={cn(commonStyles.codeDisplay, themeStyles.codeDisplay)}>
                  <span className={cn(commonStyles.code, themeStyles.code)}>{code?.code}</span>
                  <button onClick={copyCode} className={cn(commonStyles.copyBtn, themeStyles.copyBtn)}>
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <p className={cn(commonStyles.codeHint, themeStyles.codeHint)}>
                  Share this code and earn ${code?.reward_per_referral || 25} for each signup!
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
          <StaggerItem>
            <Card className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>👥</div>
              <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats?.total_referrals || 0}</div>
              <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Referrals</div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>✅</div>
              <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats?.successful_referrals || 0}</div>
              <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Successful</div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>💰</div>
              <div className={cn(commonStyles.statValue, themeStyles.statValue)}>${stats?.total_earnings?.toFixed(2) || '0.00'}</div>
              <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Earnings</div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>📈</div>
              <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats?.conversion_rate?.toFixed(1) || 0}%</div>
              <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Conversion Rate</div>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Milestone Progress */}
        {nextMilestone && (
          <ScrollReveal delay={0.2}>
            <Card className={cn(commonStyles.milestoneCard, themeStyles.milestoneCard)}>
              <div className={cn(commonStyles.milestoneHeader, themeStyles.milestoneHeader)}>
                <h3>Next Milestone</h3>
                <Badge variant="warning">${nextMilestone.bonus} Bonus</Badge>
              </div>
              <div className={cn(commonStyles.milestoneProgress, themeStyles.milestoneProgress)}>
                <ProgressBar {...{value: milestoneProgress, max: 100, showLabel: false} as any} />
                <span>{currentReferrals} / {nextMilestone.referrals} referrals</span>
              </div>
              <div className={cn(commonStyles.milestonesList, themeStyles.milestonesList)}>
                {milestones?.milestones?.map((m: any) => (
                  <div 
                    key={m.referrals} 
                    className={cn(commonStyles.milestoneItem, themeStyles.milestoneItem, m.achieved && themeStyles.milestoneAchieved)}
                  >
                    <span>{m.achieved ? '✅' : '🎯'}</span>
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
            <h3 className={cn(commonStyles.shareTitle, themeStyles.shareTitle)}>Share Your Link</h3>
            <div className={cn(commonStyles.shareLinkContainer, themeStyles.shareLinkContainer)}>
              <input 
                type="text" 
                value={shareLinks?.direct_link || ''} 
                readOnly 
                aria-label="Referral link"
                className={cn(commonStyles.shareInput, themeStyles.shareInput)}
              />
              <button onClick={copyLink} className={cn(commonStyles.copyLinkBtn, themeStyles.copyLinkBtn)}>
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>
            <div className={cn(commonStyles.socialButtons, themeStyles.socialButtons)}>
              <a href={shareLinks?.twitter} target="_blank" rel="noopener noreferrer" 
                 className={cn(commonStyles.socialBtn, themeStyles.socialBtn, themeStyles.twitter)}>
                𝕏 Twitter
              </a>
              <a href={shareLinks?.facebook} target="_blank" rel="noopener noreferrer" 
                 className={cn(commonStyles.socialBtn, themeStyles.socialBtn, themeStyles.facebook)}>
                📘 Facebook
              </a>
              <a href={shareLinks?.linkedin} target="_blank" rel="noopener noreferrer" 
                 className={cn(commonStyles.socialBtn, themeStyles.socialBtn, themeStyles.linkedin)}>
                💼 LinkedIn
              </a>
              <a href={shareLinks?.whatsapp} target="_blank" rel="noopener noreferrer" 
                 className={cn(commonStyles.socialBtn, themeStyles.socialBtn, themeStyles.whatsapp)}>
                💬 WhatsApp
              </a>
            </div>
          </Card>
        </ScrollReveal>

        {/* Tabs */}
        <ScrollReveal delay={0.4}>
          <Tabs {...{tabs, activeTab, onChange: setActiveTab} as any} />

          {/* Tab Content */}
          <div className={cn(commonStyles.tabContent, themeStyles.tabContent)}>
            {activeTab === 'overview' && (
              <div className={cn(commonStyles.howItWorks, themeStyles.howItWorks)}>
                <h3>How It Works</h3>
                <div className={cn(commonStyles.steps, themeStyles.steps)}>
                  <div className={cn(commonStyles.step, themeStyles.step)}>
                    <div className={cn(commonStyles.stepNumber, themeStyles.stepNumber)}>1</div>
                    <h4>Share Your Code</h4>
                    <p>Share your unique referral code or link with friends</p>
                  </div>
                  <div className={cn(commonStyles.step, themeStyles.step)}>
                    <div className={cn(commonStyles.stepNumber, themeStyles.stepNumber)}>2</div>
                    <h4>Friend Signs Up</h4>
                    <p>They create an account using your referral code</p>
                  </div>
                  <div className={cn(commonStyles.step, themeStyles.step)}>
                    <div className={cn(commonStyles.stepNumber, themeStyles.stepNumber)}>3</div>
                    <h4>Complete First Project</h4>
                    <p>When they complete their first project, you both earn!</p>
                  </div>
                  <div className={cn(commonStyles.step, themeStyles.step)}>
                    <div className={cn(commonStyles.stepNumber, themeStyles.stepNumber)}>4</div>
                    <h4>Get Rewarded</h4>
                    <p>Earn ${code?.reward_per_referral || 25} for each successful referral</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'referrals' && (
              <Card className={cn(commonStyles.referralsCard, themeStyles.referralsCard)}>
                <h3>Your Referrals</h3>
                {referrals.length === 0 ? (
                  <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                    <span>👥</span>
                    <p>No referrals yet. Start sharing your code!</p>
                  </div>
                ) : (
                  <div className={cn(commonStyles.referralsList, themeStyles.referralsList)}>
                    {referrals.map((ref) => (
                      <div key={ref.id} className={cn(commonStyles.referralItem, themeStyles.referralItem)}>
                        <div className={cn(commonStyles.referralInfo, themeStyles.referralInfo)}>
                          <span className={cn(commonStyles.referralEmail, themeStyles.referralEmail)}>{ref.referred_email}</span>
                          <span className={cn(commonStyles.referralDate, themeStyles.referralDate)}>
                            {new Date(ref.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={cn(commonStyles.referralStatus, themeStyles.referralStatus)}>
                          <Badge variant={(ref.status === 'qualified' ? 'success' : ref.status === 'pending' ? 'warning' : 'default') as any}>
                            {ref.status}
                          </Badge>
                          {ref.reward_paid && <span className={cn(commonStyles.rewardPaid, themeStyles.rewardPaid)}>+${ref.reward_amount}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'rewards' && (
              <Card className={cn(commonStyles.rewardsCard, themeStyles.rewardsCard)}>
                <div className={cn(commonStyles.rewardsSummary, themeStyles.rewardsSummary)}>
                  <div className={cn(commonStyles.rewardTotal, themeStyles.rewardTotal)}>
                    <span>Total Earned</span>
                    <strong>${stats?.total_earnings?.toFixed(2) || '0.00'}</strong>
                  </div>
                  <div className={cn(commonStyles.rewardPending, themeStyles.rewardPending)}>
                    <span>Pending</span>
                    <strong>${stats?.pending_earnings?.toFixed(2) || '0.00'}</strong>
                  </div>
                </div>
                <Button variant="primary" disabled={!stats?.pending_earnings}>
                  Withdraw Rewards
                </Button>
              </Card>
            )}
          </div>
        </ScrollReveal>

        {/* Invite Modal */}
        {showInviteModal && (
          <Modal {...{isOpen: showInviteModal, title: "Invite a Friend", onClose: () => setShowInviteModal(false)} as any}>
            <div className={cn(commonStyles.inviteForm, themeStyles.inviteForm)}>
              <Input
                label="Friend's Email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="friend@example.com"
              />
              <Input
                label="Personal Message (optional)"
                type="text"
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Hey! Check out this platform..."
              />
              <div className={cn(commonStyles.inviteActions, themeStyles.inviteActions)}>
                <Button variant="ghost" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={sendInvite} isLoading={sending}>
                  Send Invite
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </PageTransition>
  );
}
