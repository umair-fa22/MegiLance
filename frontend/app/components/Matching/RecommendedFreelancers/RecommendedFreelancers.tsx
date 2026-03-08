// @AI-HINT: Premium AI-powered freelancer recommendations v2.0 — match quality labels, fit reasons, category matching visualization
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Sparkles, RefreshCw, DollarSign, Star, Clock, MessageSquare, Eye, CheckCircle, User, Award, Shield, Zap } from 'lucide-react';
import commonStyles from './RecommendedFreelancers.common.module.css';
import lightStyles from './RecommendedFreelancers.light.module.css';
import darkStyles from './RecommendedFreelancers.dark.module.css';

interface RecommendedFreelancersProps {
  projectId: string;
  limit?: number;
  projectSkills?: string[];
  onViewProfile?: (freelancerId: string) => void;
  onContact?: (freelancerId: string) => void;
}

interface FreelancerMatch {
  id: string;
  name: string;
  title: string;
  avatar_url?: string;
  hourly_rate: number;
  skills: string[];
  match_score: number;
  match_quality?: string;
  match_reasons: string[];
  why_good_fit?: string;
  rating?: number;
  completed_projects?: number;
  available?: boolean;
  response_rate?: number;
}

const QUALITY_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  excellent: { color: '#27AE60', icon: <Award size={12} />, label: 'Excellent Match' },
  strong: { color: '#4573df', icon: <Zap size={12} />, label: 'Strong Match' },
  good: { color: '#F2C94C', icon: <CheckCircle size={12} />, label: 'Good Match' },
  fair: { color: '#ff9800', icon: <Shield size={12} />, label: 'Fair Match' },
  weak: { color: '#94a3b8', icon: <User size={12} />, label: 'Potential Match' },
};

export default function RecommendedFreelancers({ 
  projectId, 
  limit = 3, 
  projectSkills = [],
  onViewProfile,
  onContact
}: RecommendedFreelancersProps) {
  const { resolvedTheme } = useTheme();
  const [freelancers, setFreelancers] = useState<FreelancerMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFreelancers = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const response: any = await (api.matching as any).findFreelancers?.({ 
        project_id: projectId, 
        limit 
      });
      
      if (response && response.matches && response.matches.length > 0) {
        setFreelancers(response.matches);
      } else {
        setFreelancers([]);
      }
    } catch (error) {
      console.error('Failed to fetch recommended freelancers:', error);
      setFreelancers([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [projectId, limit]);

  useEffect(() => {
    fetchFreelancers();
  }, [fetchFreelancers]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFreelancers();
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const isSkillMatched = (skill: string) => 
    projectSkills.some(ps => ps.toLowerCase() === skill.toLowerCase());

  const getQualityConfig = (quality?: string, score?: number) => {
    if (quality && QUALITY_CONFIG[quality]) return QUALITY_CONFIG[quality];
    const s = score || 0;
    if (s >= 0.85) return QUALITY_CONFIG.excellent;
    if (s >= 0.70) return QUALITY_CONFIG.strong;
    if (s >= 0.55) return QUALITY_CONFIG.good;
    if (s >= 0.40) return QUALITY_CONFIG.fair;
    return QUALITY_CONFIG.weak;
  };

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading && !isRefreshing) {
    return (
      <div className={cn(commonStyles.container, commonStyles.loadingContainer)}>
        <div className={cn(commonStyles.loadingSpinner, themeStyles.loadingSpinner)} />
        <span className={cn(commonStyles.loadingText, themeStyles.loadingText)}>
          Finding best matches...
        </span>
        <span className={cn(commonStyles.loadingSubtext, themeStyles.loadingSubtext)}>
          AI is analyzing skills, availability, and past performance
        </span>
      </div>
    );
  }

  if (freelancers.length === 0) {
    return (
      <div className={cn(commonStyles.container, commonStyles.emptyState)}>
        <div className={cn(commonStyles.emptyIcon, themeStyles.emptyIcon)}>
          <User size={28} />
        </div>
        <h4 className={cn(commonStyles.emptyTitle, themeStyles.emptyTitle)}>
          No matches found yet
        </h4>
        <p className={cn(commonStyles.emptyDescription, themeStyles.emptyDescription)}>
          We&apos;re still searching for the perfect freelancers for your project.
        </p>
      </div>
    );
  }

  const radius = 22;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={commonStyles.container}>
      <svg width="0" height="0" className={commonStyles.srOnly}>
        <defs>
          <linearGradient id="matchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4573df" />
            <stop offset="100%" stopColor="#9b59b6" />
          </linearGradient>
          <linearGradient id="matchGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b93e8" />
            <stop offset="100%" stopColor="#c9a0dc" />
          </linearGradient>
        </defs>
      </svg>

      {/* Header */}
      <div className={commonStyles.header}>
        <div className={commonStyles.titleSection}>
          <div className={cn(commonStyles.aiIcon, themeStyles.aiIcon)}>
            <Sparkles size={16} />
            <div className={cn(commonStyles.aiIconPulse, themeStyles.aiIconPulse)} />
          </div>
          <div>
            <h3 className={cn(commonStyles.title, themeStyles.title)}>
              AI-Recommended Freelancers
            </h3>
            <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
              Matched using skill synonyms, category analysis, and performance data
            </p>
          </div>
        </div>
        <button 
          className={cn(commonStyles.refreshButton, themeStyles.refreshButton)}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw 
            size={14} 
            className={commonStyles.refreshIcon}
            style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}
          />
          Refresh
        </button>
      </div>

      {/* Freelancer Cards */}
      <div className={commonStyles.grid}>
        {freelancers.map((freelancer) => {
          const scorePercent = Math.round(freelancer.match_score * 100);
          const strokeDashoffset = circumference - (freelancer.match_score * circumference);
          const quality = getQualityConfig(freelancer.match_quality, freelancer.match_score);
          
          return (
            <div key={freelancer.id} className={cn(commonStyles.card, themeStyles.card)}>
              {/* Quality Badge */}
              <div 
                className={cn(commonStyles.qualityBadge, themeStyles.qualityBadge)}
                style={{ borderColor: quality.color, color: quality.color }}
              >
                {quality.icon}
                <span>{quality.label}</span>
              </div>

              {/* Card Header */}
              <div className={commonStyles.cardHeader}>
                <div className={commonStyles.userInfo}>
                  <div className={commonStyles.avatarWrapper}>
                    <div className={cn(commonStyles.avatar, themeStyles.avatar)}>
                      {freelancer.avatar_url ? (
                        <img src={freelancer.avatar_url} alt={freelancer.name} />
                      ) : (
                        getInitials(freelancer.name)
                      )}
                    </div>
                    {freelancer.available && (
                      <div className={cn(commonStyles.onlineIndicator, themeStyles.onlineIndicator)} />
                    )}
                  </div>
                  <div className={commonStyles.userDetails}>
                    <h4 className={cn(commonStyles.name, themeStyles.name)}>{freelancer.name}</h4>
                    <p className={cn(commonStyles.titleRole, themeStyles.titleRole)}>{freelancer.title}</p>
                  </div>
                </div>
                
                {/* Match Score Circle */}
                <div className={commonStyles.matchScoreWrapper}>
                  <svg className={commonStyles.matchScoreCircle} width="56" height="56" viewBox="0 0 56 56">
                    <circle
                      className={cn(commonStyles.matchScoreBg, themeStyles.matchScoreBg)}
                      cx="28" cy="28" r={radius}
                    />
                    <circle
                      className={cn(commonStyles.matchScoreProgress, themeStyles.matchScoreProgress)}
                      cx="28" cy="28" r={radius}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      stroke={quality.color}
                    />
                  </svg>
                  <div className={commonStyles.matchScoreText}>
                    <span className={cn(commonStyles.matchPercent, themeStyles.matchPercent)}>
                      {scorePercent}%
                    </span>
                    <span className={cn(commonStyles.matchLabel, themeStyles.matchLabel)}>
                      match
                    </span>
                  </div>
                </div>
              </div>

              {/* Why Good Fit */}
              {freelancer.why_good_fit && (
                <div className={cn(commonStyles.fitReason, themeStyles.fitReason)}>
                  <Sparkles size={12} />
                  <span>{freelancer.why_good_fit}</span>
                </div>
              )}

              {/* Stats Row */}
              <div className={cn(commonStyles.statsRow, themeStyles.statsRow)}>
                <div className={cn(commonStyles.stat, themeStyles.stat)}>
                  <DollarSign size={14} className={commonStyles.statIcon} />
                  <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                    ${freelancer.hourly_rate}/hr
                  </span>
                </div>
                {freelancer.rating != null && (
                  <div className={cn(commonStyles.stat, themeStyles.stat)}>
                    <Star size={14} className={commonStyles.statIcon} />
                    <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                      {freelancer.rating.toFixed(1)}
                    </span>
                  </div>
                )}
                {freelancer.completed_projects != null && (
                  <div className={cn(commonStyles.stat, themeStyles.stat)}>
                    <Clock size={14} className={commonStyles.statIcon} />
                    <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                      {freelancer.completed_projects} jobs
                    </span>
                  </div>
                )}
                {freelancer.response_rate != null && (
                  <div className={cn(commonStyles.stat, themeStyles.stat)}>
                    <Zap size={14} className={commonStyles.statIcon} />
                    <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                      {freelancer.response_rate}% reply
                    </span>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className={commonStyles.skills}>
                {(freelancer.skills || []).slice(0, 5).map((skill) => (
                  <span 
                    key={skill} 
                    className={cn(
                      commonStyles.skill, 
                      themeStyles.skill,
                      isSkillMatched(skill) && cn(commonStyles.skillMatched, themeStyles.skillMatched)
                    )}
                  >
                    {isSkillMatched(skill) && <CheckCircle size={10} />}
                    {skill}
                  </span>
                ))}
                {(freelancer.skills || []).length > 5 && (
                  <span className={cn(commonStyles.skill, themeStyles.skill)}>
                    +{freelancer.skills.length - 5}
                  </span>
                )}
              </div>

              {/* AI Reasons */}
              {freelancer.match_reasons && freelancer.match_reasons.length > 0 && (
                <div className={commonStyles.aiReasons}>
                  <span className={cn(commonStyles.aiReasonsLabel, themeStyles.aiReasonsLabel)}>
                    <Sparkles size={12} /> AI Insights
                  </span>
                  <div className={commonStyles.reasonsList}>
                    {freelancer.match_reasons.slice(0, 3).map((reason, idx) => (
                      <span key={idx} className={cn(commonStyles.reason, themeStyles.reason)}>
                        <CheckCircle size={10} /> {reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className={commonStyles.cardActions}>
                <button 
                  className={cn(commonStyles.actionButton, commonStyles.secondaryAction, themeStyles.secondaryAction)}
                  onClick={() => onViewProfile?.(freelancer.id)}
                >
                  <Eye size={14} />
                  View Profile
                </button>
                <button 
                  className={cn(commonStyles.actionButton, commonStyles.primaryAction, themeStyles.primaryAction)}
                  onClick={() => onContact?.(freelancer.id)}
                >
                  <MessageSquare size={14} />
                  Contact
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}