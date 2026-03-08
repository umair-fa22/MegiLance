// @AI-HINT: SellerStats dashboard component - displays seller level, JSS score, stats, and progress to next level
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  Award,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Star,
  Clock,
  CheckCircle,
  Users,
  Repeat,
  Percent,
  HeadphonesIcon,
  Zap,
  Shield,
  BadgeCheck,
  Trophy,
} from 'lucide-react';
import common from './SellerStats.common.module.css';
import light from './SellerStats.light.module.css';
import dark from './SellerStats.dark.module.css';

export interface SellerLevel {
  level: 'new_seller' | 'bronze' | 'silver' | 'gold' | 'platinum';
  jssScore: number;
  levelProgress?: {
    nextLevel: string;
    requirements: {
      [key: string]: {
        current: number;
        required: number;
        percent: number;
      };
    };
  };
  benefits: {
    commissionRate: number;
    featuredGigs: number;
    prioritySupport: boolean;
    badges: string[];
    description: string;
  };
}

export interface SellerStatsData {
  userId: number;
  level: SellerLevel;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageRating: number;
  totalReviews: number;
  completionRate: number;
  onTimeDeliveryRate: number;
  responseRate: number;
  avgResponseTimeHours: number;
  totalEarnings: number;
  uniqueClients: number;
  repeatClients: number;
  repeatClientRate: number;
  // Changes (for trend indicators)
  ordersChange?: number;
  earningsChange?: number;
  ratingChange?: number;
}

export interface SellerStatsProps {
  stats: SellerStatsData;
  className?: string;
}

const levelDisplayNames: Record<string, string> = {
  new_seller: 'New Seller',
  bronze: 'Bronze Seller',
  silver: 'Silver Seller',
  gold: 'Gold Seller',
  platinum: 'Platinum Seller',
};

const levelCssClasses: Record<string, string> = {
  new_seller: 'newSeller',
  bronze: 'bronze',
  silver: 'silver',
  gold: 'gold',
  platinum: 'platinum',
};

const requirementLabels: Record<string, string> = {
  orders: 'Completed Orders',
  earnings: 'Total Earnings',
  rating: 'Average Rating',
  completion_rate: 'Completion Rate',
  on_time_rate: 'On-Time Delivery',
};

const SellerStats: React.FC<SellerStatsProps> = ({ stats, className }) => {
  const { resolvedTheme } = useTheme();


  const themed = resolvedTheme === 'dark' ? dark : light;

  // Defensive: ensure level is always a full SellerLevel object
  const rawLevel = stats.level;
  const defaultBenefits = {
    commissionRate: 20,
    featuredGigs: 0,
    prioritySupport: false,
    badges: [] as string[],
    description: 'Welcome! Complete orders to level up.',
  };
  const level: SellerLevel =
    typeof rawLevel === 'object' && rawLevel !== null
      ? {
          level: rawLevel.level ?? 'new_seller',
          jssScore: rawLevel.jssScore ?? 0,
          benefits: { ...defaultBenefits, ...rawLevel.benefits },
          levelProgress: rawLevel.levelProgress,
        }
      : {
          level: (typeof rawLevel === 'string' ? rawLevel : 'new_seller') as SellerLevel['level'],
          jssScore: 0,
          benefits: defaultBenefits,
        };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const renderTrend = (change?: number) => {
    if (change === undefined || change === 0) return null;
    const isPositive = change > 0;
    return (
      <span
        className={cn(
          common.statChange,
          isPositive ? common.positive : common.negative
        )}
      >
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {isPositive ? '+' : ''}
        {change}%
      </span>
    );
  };

  return (
    <div className={cn(common.container, themed.theme, className)}>
      {/* Level Section */}
      <div className={cn(common.levelSection, themed.levelSection)}>
        <div
          className={cn(
            common.levelBadge,
            themed.levelBadge,
            themed[levelCssClasses[level.level]]
          )}
        >
          <Award size={48} color="#fff" />
        </div>
        <div className={common.levelInfo}>
          <h2 className={cn(common.levelTitle, themed.levelTitle)}>
            {levelDisplayNames[level.level]}
          </h2>
          <p className={cn(common.levelDescription, themed.levelDescription)}>
            {level.benefits?.description ?? 'Complete orders to level up.'}
          </p>
          <div className={cn(common.jssScore, themed.jssScore)}>
            <span>Job Success Score:</span>
            <span className={cn(common.jssValue, themed.jssValue)}>
              {level.jssScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={common.statsGrid}>
        <div className={cn(common.statCard, themed.statCard)}>
          <div className={cn(common.statIcon, themed.statIcon)}>
            <Package size={20} />
          </div>
          <span className={cn(common.statLabel, themed.statLabel)}>
            Completed Orders
          </span>
          <span className={cn(common.statValue, themed.statValue)}>
            {stats.completedOrders}
          </span>
          {renderTrend(stats.ordersChange)}
        </div>

        <div className={cn(common.statCard, themed.statCard)}>
          <div className={cn(common.statIcon, themed.statIcon)}>
            <DollarSign size={20} />
          </div>
          <span className={cn(common.statLabel, themed.statLabel)}>
            Total Earnings
          </span>
          <span className={cn(common.statValue, themed.statValue)}>
            {formatCurrency(stats.totalEarnings)}
          </span>
          {renderTrend(stats.earningsChange)}
        </div>

        <div className={cn(common.statCard, themed.statCard)}>
          <div className={cn(common.statIcon, themed.statIcon)}>
            <Star size={20} />
          </div>
          <span className={cn(common.statLabel, themed.statLabel)}>
            Average Rating
          </span>
          <span className={cn(common.statValue, themed.statValue)}>
            {stats.averageRating.toFixed(1)}
          </span>
          <span className={cn(common.statLabel, themed.statLabel)}>
            ({stats.totalReviews} reviews)
          </span>
        </div>

        <div className={cn(common.statCard, themed.statCard)}>
          <div className={cn(common.statIcon, themed.statIcon)}>
            <Clock size={20} />
          </div>
          <span className={cn(common.statLabel, themed.statLabel)}>
            On-Time Delivery
          </span>
          <span className={cn(common.statValue, themed.statValue)}>
            {formatPercent(stats.onTimeDeliveryRate)}
          </span>
        </div>

        <div className={cn(common.statCard, themed.statCard)}>
          <div className={cn(common.statIcon, themed.statIcon)}>
            <CheckCircle size={20} />
          </div>
          <span className={cn(common.statLabel, themed.statLabel)}>
            Completion Rate
          </span>
          <span className={cn(common.statValue, themed.statValue)}>
            {formatPercent(stats.completionRate)}
          </span>
        </div>

        <div className={cn(common.statCard, themed.statCard)}>
          <div className={cn(common.statIcon, themed.statIcon)}>
            <Repeat size={20} />
          </div>
          <span className={cn(common.statLabel, themed.statLabel)}>
            Repeat Clients
          </span>
          <span className={cn(common.statValue, themed.statValue)}>
            {formatPercent(stats.repeatClientRate)}
          </span>
          <span className={cn(common.statLabel, themed.statLabel)}>
            ({stats.repeatClients} of {stats.uniqueClients})
          </span>
        </div>
      </div>

      {/* Level Progress Section */}
      {level.levelProgress && (
        <div className={cn(common.progressSection, themed.progressSection)}>
          <div className={common.progressHeader}>
            <h3 className={cn(common.progressTitle, themed.progressTitle)}>
              Progress to Next Level
            </h3>
            <span className={cn(common.progressNextLevel, themed.progressNextLevel)}>
              <Zap size={16} />
              Next: {levelDisplayNames[level.levelProgress.nextLevel]}
            </span>
          </div>

          <div className={common.progressGrid}>
            {Object.entries(level.levelProgress.requirements).map(
              ([key, value]) => (
                <div key={key} className={common.progressItem}>
                  <div className={common.progressItemHeader}>
                    <span
                      className={cn(
                        common.progressItemLabel,
                        themed.progressItemLabel
                      )}
                    >
                      {requirementLabels[key] || key}
                    </span>
                    <span
                      className={cn(
                        common.progressItemValue,
                        themed.progressItemValue
                      )}
                    >
                      {value.current} / {value.required}
                    </span>
                  </div>
                  <div className={cn(common.progressBar, themed.progressBar)}>
                    <div
                      className={cn(
                        common.progressBarFill,
                        themed.progressBarFill,
                        value.percent >= 100 && themed.complete
                      )}
                      style={{ width: `${Math.min(100, value.percent)}%` }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Benefits Section */}
      <div className={cn(common.benefitsSection, themed.benefitsSection)}>
        <h3 className={cn(common.benefitsTitle, themed.benefitsTitle)}>
          Your Level Benefits
        </h3>
        <div className={common.benefitsList}>
          <div className={cn(common.benefitItem, themed.benefitItem)}>
            <div className={cn(common.benefitIcon, themed.benefitIcon)}>
              <Percent size={18} />
            </div>
            <div className={common.benefitInfo}>
              <span className={cn(common.benefitName, themed.benefitName)}>
                Commission Rate
              </span>
              <span className={cn(common.benefitValue, themed.benefitValue)}>
                {level.benefits?.commissionRate ?? 20}% platform fee
              </span>
            </div>
          </div>

          <div className={cn(common.benefitItem, themed.benefitItem)}>
            <div className={cn(common.benefitIcon, themed.benefitIcon)}>
              <Trophy size={18} />
            </div>
            <div className={common.benefitInfo}>
              <span className={cn(common.benefitName, themed.benefitName)}>
                Featured Gigs
              </span>
              <span className={cn(common.benefitValue, themed.benefitValue)}>
                Up to {level.benefits?.featuredGigs ?? 0} featured placements
              </span>
            </div>
          </div>

          <div className={cn(common.benefitItem, themed.benefitItem)}>
            <div className={cn(common.benefitIcon, themed.benefitIcon)}>
              <HeadphonesIcon size={18} />
            </div>
            <div className={common.benefitInfo}>
              <span className={cn(common.benefitName, themed.benefitName)}>
                Priority Support
              </span>
              <span className={cn(common.benefitValue, themed.benefitValue)}>
                {level.benefits?.prioritySupport
                  ? 'Enabled - 24/7 dedicated support'
                  : 'Not available at this level'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      {(level.benefits?.badges?.length ?? 0) > 0 && (
        <div className={cn(common.badgesSection, themed.badgesSection)}>
          <h3 className={cn(common.badgesTitle, themed.badgesTitle)}>
            Your Badges
          </h3>
          <div className={common.badgesGrid}>
            {(level.benefits?.badges ?? []).map((badge) => (
              <div
                key={badge}
                className={cn(
                  common.badge,
                  themed.badge,
                  badge === 'verified' && themed.verified,
                  badge === 'top_rated' && themed.topRated,
                  badge === 'trusted' && themed.trusted
                )}
              >
                {badge === 'verified' && <BadgeCheck size={14} />}
                {badge === 'top_rated' && <Star size={14} />}
                {badge === 'trusted' && <Shield size={14} />}
                {badge !== 'verified' &&
                  badge !== 'top_rated' &&
                  badge !== 'trusted' && <Award size={14} />}
                {badge.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerStats;
