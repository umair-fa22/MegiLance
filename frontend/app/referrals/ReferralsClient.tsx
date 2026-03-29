// @AI-HINT: Referrals Dashboard Client Component
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';
import Input from '@/app/components/atoms/Input/Input';
import commonStyles from './Referrals.common.module.css';
import lightStyles from './Referrals.light.module.css';
import darkStyles from './Referrals.dark.module.css';

interface ReferralStats {
  total_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  referral_link: string;
}

interface Referral {
  id: number;
  referred_email: string;
  status: string;
  reward_amount: number;
  created_at: string;
}

export function ReferralsClient() {
  const { resolvedTheme } = useTheme();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Fetch stats
      const statsRes = await fetch(`${baseUrl}/api/v1/referrals/stats`);
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // Fetch list
      const listRes = await fetch(`${baseUrl}/api/v1/referrals`);
      if (listRes.ok) {
        setReferrals(await listRes.json());
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch referral data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);
    setMessage(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${baseUrl}/api/v1/referrals/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Invitation sent successfully!' });
        setInviteEmail('');
        fetchData(); // Refresh list
      } else {
        setMessage({ type: 'error', text: data.detail || 'Failed to send invitation' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setInviting(false);
    }
  };

  const copyLink = () => {
    if (stats?.referral_link) {
      navigator.clipboard.writeText(stats.referral_link);
      setMessage({ type: 'success', text: 'Referral link copied to clipboard!' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return <div className={commonStyles.loading}>Loading...</div>;
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <h1 className={cn(commonStyles.title, themeStyles.title)}>Referral Program</h1>
      <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
        Invite friends and earn rewards when they join MegiLance.
      </p>

      {/* Stats Cards */}
      <div className={commonStyles.statsGrid}>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <span className={commonStyles.statLabel}>Total Referrals</span>
          <span className={commonStyles.statValue}>{stats?.total_referrals || 0}</span>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <span className={commonStyles.statLabel}>Total Earnings</span>
          <span className={commonStyles.statValue}>${stats?.total_earnings || 0}</span>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <span className={commonStyles.statLabel}>Pending</span>
          <span className={commonStyles.statValue}>${stats?.pending_earnings || 0}</span>
        </div>
      </div>

      {/* Invite Section */}
      <div className={cn(commonStyles.section, themeStyles.section)}>
        <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Invite Friends</h2>
        
        <div className={commonStyles.linkBox}>
          <span className={themeStyles.linkText}>{stats?.referral_link}</span>
          <Button variant="outline" size="sm" onClick={copyLink}>
            Copy Link
          </Button>
        </div>

        <div className={commonStyles.divider}>OR</div>

        <form onSubmit={handleInvite} className={commonStyles.inviteForm}>
          <Input
            label="Email Address"
            type="email"
            placeholder="friend@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <Button variant="primary" type="submit" isLoading={inviting}>
            Send Invitation
          </Button>
        </form>

        {message && (
          <div className={cn(commonStyles.message, message.type === 'success' ? commonStyles.success : commonStyles.error)}>
            {message.text}
          </div>
        )}
      </div>

      {/* Referrals List */}
      <div className={cn(commonStyles.section, themeStyles.section)}>
        <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Your Referrals</h2>
        {referrals.length === 0 ? (
          <p className={themeStyles.emptyText}>No referrals yet. Start inviting!</p>
        ) : (
          <div className={commonStyles.tableContainer}>
            <table className={cn(commonStyles.table, themeStyles.table)}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Reward</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref) => (
                  <tr key={ref.id}>
                    <td>{ref.referred_email}</td>
                    <td>
                      <span className={cn(commonStyles.statusBadge, commonStyles[ref.status])}>
                        {ref.status}
                      </span>
                    </td>
                    <td>{new Date(ref.created_at).toLocaleDateString()}</td>
                    <td>${ref.reward_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
