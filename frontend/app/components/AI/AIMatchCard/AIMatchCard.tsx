// @AI-HINT: AI Match Card v2.0 — uses backend match_quality labels, why_good_fit, category-level matching, animated score rings
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  Sparkles, 
  Star, 
  DollarSign, 
  CheckCircle, 
  MessageSquare, 
  UserPlus,
  Zap,
  TrendingUp,
  Award,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import commonStyles from './AIMatchCard.common.module.css';
import lightStyles from './AIMatchCard.light.module.css';
import darkStyles from './AIMatchCard.dark.module.css';

export interface FreelancerMatchData {
  id: string;
  name: string;
  title: string;
  avatarUrl?: string;
  hourlyRate: number;
  rating?: number;
  reviewCount?: number;
  skills: string[];
  matchedSkills?: string[];
  matchScore: number; // 0-100
  matchQuality?: string; // excellent | strong | good | fair | weak (from backend)
  confidenceLevel?: number; // 0-100
  matchReasons?: string[];
  whyGoodFit?: string; // from backend matching engine
  availability?: 'available' | 'busy' | 'away';
  completedProjects?: number;
  responseRate?: number;
}

interface AIMatchCardProps {
  freelancer: FreelancerMatchData;
  requiredSkills?: string[];
  onViewProfile?: (id: string) => void;
  onInvite?: (id: string) => void;
  onMessage?: (id: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

const QUALITY_MAP: Record<string, { label: string; icon: React.ReactNode; colorVar: string }> = {
  excellent: { label: 'Excellent Match', icon: <Award size={14} />, colorVar: '#27AE60' },
  strong:    { label: 'Strong Match',    icon: <Zap size={14} />,   colorVar: '#4573df' },
  good:      { label: 'Good Match',      icon: <CheckCircle size={14} />, colorVar: '#F2C94C' },
  fair:      { label: 'Fair Match',      icon: <Shield size={14} />, colorVar: '#ff9800' },
  weak:      { label: 'Potential Match',  icon: <Sparkles size={14} />, colorVar: '#94a3b8' },
};

const AIMatchCard: React.FC<AIMatchCardProps> = ({
  freelancer,
  requiredSkills = [],
  onViewProfile,
  onInvite,
  onMessage,
  showActions = true,
  compact = false
}) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => setAnimatedScore(freelancer.matchScore), 100);
      return () => clearTimeout(timer);
    }
  }, [mounted, freelancer.matchScore]);

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const matchedSkills = freelancer.matchedSkills || 
    freelancer.skills.filter(skill => 
      requiredSkills.some(req => req.toLowerCase() === skill.toLowerCase())
    );

  const circumference = 2 * Math.PI * 30;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Resolve quality from backend label or fallback to score-based
  const resolveQuality = () => {
    if (freelancer.matchQuality && QUALITY_MAP[freelancer.matchQuality]) {
      return QUALITY_MAP[freelancer.matchQuality];
    }
    const s = freelancer.matchScore;
    if (s >= 85) return QUALITY_MAP.excellent;
    if (s >= 70) return QUALITY_MAP.strong;
    if (s >= 55) return QUALITY_MAP.good;
    if (s >= 40) return QUALITY_MAP.fair;
    return QUALITY_MAP.weak;
  };

  const quality = resolveQuality();

  const getScoreColorClass = () => {
    if (animatedScore >= 85) return themeStyles.scoreCircleProgressExcellent;
    if (animatedScore >= 65) return themeStyles.scoreCircleProgressGood;
    return themeStyles.scoreCircleProgressFair;
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={cn(commonStyles.container)}>
      <div className={cn(commonStyles.card, themeStyles.card)}>
        {/* AI Badge */}
        <div className={cn(commonStyles.aiBadge, themeStyles.aiBadge)}>
          <Sparkles />
          <span>AI Matched</span>
        </div>

        {/* Header */}
        <div className={commonStyles.header}>
          <div className={cn(commonStyles.avatar, themeStyles.avatar)}>
            {freelancer.avatarUrl ? (
              <img src={freelancer.avatarUrl} alt={freelancer.name} />
            ) : (
              getInitials(freelancer.name)
            )}
          </div>
          <div className={commonStyles.userInfo}>
            <div className={cn(commonStyles.name, themeStyles.name)}>
              {freelancer.name}
            </div>
            <div className={cn(commonStyles.title, themeStyles.title)}>
              {freelancer.title}
            </div>
            <div className={cn(commonStyles.meta, themeStyles.meta)}>
              <span className={commonStyles.metaItem}>
                <DollarSign />
                ${freelancer.hourlyRate}/hr
              </span>
              {freelancer.rating != null && (
                <span className={commonStyles.metaItem}>
                  <Star />
                  {freelancer.rating.toFixed(1)} ({freelancer.reviewCount || 0})
                </span>
              )}
              {freelancer.completedProjects != null && (
                <span className={commonStyles.metaItem}>
                  <Award />
                  {freelancer.completedProjects} projects
                </span>
              )}
              {freelancer.responseRate != null && (
                <span className={commonStyles.metaItem}>
                  <Zap />
                  {freelancer.responseRate}% reply
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Match Score Section */}
        <div className={cn(commonStyles.scoreSection, themeStyles.scoreSection)}>
          <div className={commonStyles.scoreCircle}>
            <svg className={commonStyles.scoreCircleSvg} viewBox="0 0 72 72">
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4573df" />
                  <stop offset="100%" stopColor="#9b59b6" />
                </linearGradient>
                <linearGradient id="scoreGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6b93f5" />
                  <stop offset="100%" stopColor="#bb6bd9" />
                </linearGradient>
              </defs>
              <circle
                className={cn(commonStyles.scoreCircleTrack, themeStyles.scoreCircleTrack)}
                cx="36" cy="36" r="30"
              />
              <circle
                className={cn(commonStyles.scoreCircleProgress, getScoreColorClass())}
                cx="36" cy="36" r="30"
                style={{ strokeDasharray: circumference, strokeDashoffset }}
              />
            </svg>
            <span className={cn(commonStyles.scoreValue, themeStyles.scoreValue)}>
              {Math.round(animatedScore)}%
            </span>
          </div>
          <div className={commonStyles.scoreDetails}>
            {/* Quality badge from backend */}
            <div
              className={cn(commonStyles.qualityBadge, themeStyles.qualityBadge)}
              style={{ borderColor: quality.colorVar, color: quality.colorVar }}
            >
              {quality.icon}
              <span>{quality.label}</span>
            </div>
            {freelancer.confidenceLevel !== undefined && (
              <div className={cn(commonStyles.scoreConfidence, themeStyles.scoreConfidence)}>
                <Zap size={14} />
                <span>AI Confidence</span>
                <div className={cn(commonStyles.confidenceBar, themeStyles.confidenceBar)}>
                  <div 
                    className={cn(commonStyles.confidenceFill, themeStyles.confidenceFill)}
                    style={{ width: `${freelancer.confidenceLevel}%` }}
                  />
                </div>
                <span>{freelancer.confidenceLevel}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Why Good Fit (from backend matching engine) */}
        {freelancer.whyGoodFit && !compact && (
          <div className={cn(commonStyles.fitReason, themeStyles.fitReason)}>
            <Sparkles size={14} className={commonStyles.fitReasonIcon} />
            <span>{freelancer.whyGoodFit}</span>
          </div>
        )}

        {/* Skills */}
        {!compact && (
          <div className={commonStyles.skillsSection}>
            <div className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
              <CheckCircle size={14} />
              Skills ({matchedSkills.length}/{requiredSkills.length || freelancer.skills.length} matched)
            </div>
            <div className={commonStyles.skillsList}>
              {(freelancer.skills || []).slice(0, 6).map((skill) => {
                const isMatched = matchedSkills.some(
                  ms => ms.toLowerCase() === skill.toLowerCase()
                );
                return (
                  <span
                    key={skill}
                    className={cn(
                      commonStyles.skill, themeStyles.skill,
                      isMatched && cn(commonStyles.skillMatched, themeStyles.skillMatched)
                    )}
                  >
                    {isMatched && <CheckCircle size={12} />}
                    {skill}
                  </span>
                );
              })}
              {freelancer.skills.length > 6 && (
                <span className={cn(commonStyles.skill, themeStyles.skill)}>
                  +{freelancer.skills.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* AI Insights */}
        {freelancer.matchReasons && freelancer.matchReasons.length > 0 && !compact && (
          <div className={cn(commonStyles.insightsSection, themeStyles.insightsSection)}>
            <div className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
              <TrendingUp size={14} />
              Why This Match
            </div>
            <div className={commonStyles.insightsList}>
              {freelancer.matchReasons.slice(0, 3).map((reason, index) => (
                <div key={index} className={cn(commonStyles.insightItem, themeStyles.insightItem)}>
                  <CheckCircle className={cn(commonStyles.insightIcon, themeStyles.insightIcon)} />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className={cn(commonStyles.actions, themeStyles.actions)}>
            <button
              className={cn(commonStyles.actionBtn, commonStyles.primaryBtn, themeStyles.primaryBtn)}
              onClick={() => onInvite?.(freelancer.id)}
            >
              <UserPlus />
              Invite
            </button>
            <button
              className={cn(commonStyles.actionBtn, commonStyles.secondaryBtn, themeStyles.secondaryBtn)}
              onClick={() => onViewProfile?.(freelancer.id)}
            >
              View Profile
            </button>
            <button
              className={cn(commonStyles.actionBtn, commonStyles.secondaryBtn, themeStyles.secondaryBtn)}
              onClick={() => onMessage?.(freelancer.id)}
            >
              <MessageSquare />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMatchCard;
