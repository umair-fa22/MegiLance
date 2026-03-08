// @AI-HINT: Admin fraud alerts dashboard with signal breakdown, risk gauges, and user management
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, ShieldAlert, ShieldCheck, ShieldX, Shield,
  Activity, Clock, Eye, Ban, CheckCircle, XCircle, Search,
  User, Zap, CreditCard, FileText, UserCheck, Loader2,
  ChevronDown, ChevronUp, Lightbulb, Flag, Sparkles
} from 'lucide-react';
import Button from '@/app/components/Button/Button';
import Modal from '@/app/components/Modal/Modal';
import commonStyles from './FraudAlerts.common.module.css';
import lightStyles from './FraudAlerts.light.module.css';
import darkStyles from './FraudAlerts.dark.module.css';

interface SignalBreakdown {
  score: number;
  flags: string[];
  age_days?: number;
  missing_fields?: string[];
  proposals_1h?: number;
  proposals_24h?: number;
  disputed?: number;
  failed?: number;
  completion_rate?: number | null;
  total_contracts?: number;
  risk_level?: string;
}

interface FraudAlert {
  id: string;
  user_id: number;
  user_email: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  risk_level?: string;
  evidence: string;
  status: 'pending' | 'investigating' | 'resolved' | 'false_positive';
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
  signals?: Record<string, SignalBreakdown>;
  recommendations?: string[];
  flags?: string[];
}

interface FraudAlertsProps {
  className?: string;
}

const SEVERITY_CONFIG: Record<string, { icon: typeof AlertTriangle; label: string; colorVar: string }> = {
  critical: { icon: ShieldX, label: 'Critical', colorVar: '--color-critical' },
  high:     { icon: ShieldAlert, label: 'High', colorVar: '--color-high' },
  medium:   { icon: Shield, label: 'Medium', colorVar: '--color-medium' },
  low:      { icon: ShieldCheck, label: 'Low', colorVar: '--color-low' },
};

const SIGNAL_ICONS: Record<string, typeof Activity> = {
  account_age: Clock,
  verification: UserCheck,
  profile: User,
  velocity: Zap,
  payment: CreditCard,
  completion: CheckCircle,
  content: FileText,
  budget: CreditCard,
  client: User,
  freelancer: User,
  bid: Activity,
  cover_letter: FileText,
};

const SIGNAL_LABELS: Record<string, string> = {
  account_age: 'Account Age',
  verification: 'Verification',
  profile: 'Profile Completeness',
  velocity: 'Activity Velocity',
  payment: 'Payment History',
  completion: 'Completion Rate',
  content: 'Content Analysis',
  budget: 'Budget Analysis',
  client: 'Client Risk',
  freelancer: 'Freelancer Risk',
  bid: 'Bid Analysis',
  cover_letter: 'Cover Letter',
};

function RiskGauge({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = Math.PI * radius;
  const filled = (score / 100) * circumference;
  const color = score >= 75 ? '#e81123' : score >= 50 ? '#f2a93e' : score >= 25 ? '#ffb900' : '#27ae60';

  return (
    <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`} className={commonStyles.riskGauge}>
      <path
        d={`M 5 ${size / 2 + 5} A ${radius} ${radius} 0 0 1 ${size - 5} ${size / 2 + 5}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        opacity="0.15"
      />
      <path
        d={`M 5 ${size / 2 + 5} A ${radius} ${radius} 0 0 1 ${size - 5} ${size / 2 + 5}`}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fontFamily="JetBrains Mono, monospace"
        fill={color}
      >
        {score}
      </text>
    </svg>
  );
}

export default function FraudAlerts({ className = '' }: FraudAlertsProps) {
  const { resolvedTheme } = useTheme();
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<FraudAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSignals, setExpandedSignals] = useState<Set<string>>(new Set());
  const [analyzingUser, setAnalyzingUser] = useState<number | null>(null);

  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockUserId, setBlockUserId] = useState<number | null>(null);

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const toggleSignals = (alertId: string) => {
    setExpandedSignals((prev) => {
      const next = new Set(prev);
      if (next.has(alertId)) next.delete(alertId);
      else next.add(alertId);
      return next;
    });
  };

  const handleAnalyzeUser = async (userId: number, alertId: string) => {
    setAnalyzingUser(userId);
    try {
      const response = await fetch(`/backend/api/fraud-detection/analyze/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        const analysis = data.analysis;
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alertId
              ? {
                  ...a,
                  risk_score: analysis.risk_score,
                  risk_level: analysis.risk_level,
                  signals: analysis.signals,
                  recommendations: analysis.recommendations,
                  flags: analysis.flags,
                  severity: analysis.risk_level as FraudAlert['severity'],
                }
              : a
          )
        );
        showToast('Analysis refreshed', 'success');
      }
    } catch {
      showToast('Analysis failed', 'error');
    } finally {
      setAnalyzingUser(null);
    }
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/fraud-alerts');
        if (response.ok) {
          const data = await response.json();
          setAlerts(data.alerts || []);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load alerts');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let filtered = [...alerts];
    if (statusFilter !== 'all') filtered = filtered.filter((a) => a.status === statusFilter);
    if (severityFilter !== 'all') filtered = filtered.filter((a) => a.severity === severityFilter);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.user_email.toLowerCase().includes(query) ||
          a.alert_type.toLowerCase().includes(query) ||
          a.id.includes(query)
      );
    }
    setFilteredAlerts(filtered);
  }, [alerts, statusFilter, severityFilter, searchQuery]);

  const handleResolveAlert = async (alertId: string, resolution: 'resolved' | 'false_positive') => {
    try {
      const response = await fetch(`/api/admin/fraud-alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: resolution, resolution_notes: resolutionNotes }),
      });
      if (response.ok) {
        setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, status: resolution } : a)));
        setSelectedAlert(null);
        setResolutionNotes('');
        showToast(`Alert ${resolution === 'resolved' ? 'resolved' : 'marked as false positive'}`, 'success');
      }
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  const handleBlockUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Fraud detected' }),
      });
      if (response.ok) {
        showToast('User blocked successfully', 'success');
        setSelectedAlert(null);
      }
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return commonStyles.severityCritical;
      case 'high':     return commonStyles.severityHigh;
      case 'medium':   return commonStyles.severityMedium;
      case 'low':      return commonStyles.severityLow;
      default:         return '';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':       return { icon: AlertTriangle, label: 'Pending', cls: commonStyles.statusPending };
      case 'investigating': return { icon: Eye, label: 'Investigating', cls: commonStyles.statusInvestigating };
      case 'resolved':      return { icon: CheckCircle, label: 'Resolved', cls: commonStyles.statusResolved };
      case 'false_positive':return { icon: XCircle, label: 'False Positive', cls: commonStyles.statusFalsePositive };
      default:              return { icon: Activity, label: status, cls: '' };
    }
  };

  const stats = {
    total: alerts.length,
    pending: alerts.filter((a) => a.status === 'pending').length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    resolved: alerts.filter((a) => a.status === 'resolved').length,
  };

  const getMaxSignalScore = (key: string): number => {
    const maxScores: Record<string, number> = {
      account_age: 15, verification: 20, profile: 15, velocity: 25,
      payment: 20, completion: 15, content: 20, budget: 15,
      client: 25, freelancer: 25, bid: 15, cover_letter: 15,
    };
    return maxScores[key] || 20;
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container, className)}>
      {/* Header */}
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <div>
          <h1 className={commonStyles.title}>
            <ShieldAlert size={28} />
            Fraud Alert Dashboard
          </h1>
          <p className={commonStyles.subtitle}>Monitor and manage suspicious activities across the platform</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={commonStyles.statsGrid}>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <div className={commonStyles.statHeader}>
            <Activity size={18} className={commonStyles.statIconTotal} />
            <div className={commonStyles.statLabel}>Total Alerts</div>
          </div>
          <div className={cn(commonStyles.statValue, commonStyles.statTotal)}>{stats.total}</div>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <div className={commonStyles.statHeader}>
            <AlertTriangle size={18} className={commonStyles.statIconPending} />
            <div className={commonStyles.statLabel}>Pending</div>
          </div>
          <div className={cn(commonStyles.statValue, commonStyles.statPending)}>{stats.pending}</div>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <div className={commonStyles.statHeader}>
            <ShieldX size={18} className={commonStyles.statIconCritical} />
            <div className={commonStyles.statLabel}>Critical</div>
          </div>
          <div className={cn(commonStyles.statValue, commonStyles.statCritical)}>{stats.critical}</div>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <div className={commonStyles.statHeader}>
            <ShieldCheck size={18} className={commonStyles.statIconResolved} />
            <div className={commonStyles.statLabel}>Resolved</div>
          </div>
          <div className={cn(commonStyles.statValue, commonStyles.statResolved)}>{stats.resolved}</div>
        </div>
      </div>

      {/* Filters */}
      <div className={cn(commonStyles.filters, themeStyles.filters)}>
        <div className={cn(commonStyles.searchBox, themeStyles.searchBox)}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by email, type, or alert ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(commonStyles.searchInput, themeStyles.searchInput)}
          />
        </div>
        <div className={commonStyles.filterRow}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(commonStyles.select, themeStyles.select)}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className={cn(commonStyles.select, themeStyles.select)}
            aria-label="Filter by severity"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={cn(commonStyles.loading, themeStyles.loading)}>
          <Loader2 size={40} className={commonStyles.spinner} />
          <p>Loading fraud alerts...</p>
        </div>
      ) : error ? (
        <div className={cn(commonStyles.error, themeStyles.error)}>
          <AlertTriangle size={20} /> {error}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className={cn(commonStyles.empty, themeStyles.empty)}>
          <ShieldCheck size={48} className={commonStyles.emptyIcon} />
          <h3>No alerts found</h3>
          <p>All systems clear or no matching results</p>
        </div>
      ) : (
        <div className={commonStyles.alertsList}>
          {filteredAlerts.map((alert) => {
            const sevConfig = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
            const SevIcon = sevConfig.icon;
            const statusConf = getStatusConfig(alert.status);
            const StatusIcon = statusConf.icon;
            const isExpanded = expandedSignals.has(alert.id);
            const hasSignals = alert.signals && Object.keys(alert.signals).length > 0;

            return (
              <div
                key={alert.id}
                className={cn(commonStyles.alertCard, themeStyles.alertCard, getSeverityColor(alert.severity))}
              >
                <div className={commonStyles.alertHeader}>
                  <div className={commonStyles.alertMeta}>
                    <div className={cn(commonStyles.severityBadge, commonStyles[`sev${alert.severity}`])}>
                      <SevIcon size={14} />
                      {sevConfig.label}
                    </div>
                    <div className={commonStyles.alertType}>{alert.alert_type}</div>
                    <div className={cn(commonStyles.statusBadge, statusConf.cls)}>
                      <StatusIcon size={12} />
                      {statusConf.label}
                    </div>
                    <div className={commonStyles.alertTime}>
                      <Clock size={12} />
                      {new Date(alert.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={commonStyles.alertScore}>
                    <RiskGauge score={alert.risk_score} size={72} />
                  </div>
                </div>

                <div className={commonStyles.alertBody}>
                  <div className={commonStyles.alertUser}>
                    <User size={14} />
                    <span className={commonStyles.value}>{alert.user_email}</span>
                  </div>
                  <div className={commonStyles.alertEvidence}>
                    <span className={commonStyles.label}>Evidence:</span>
                    <p className={cn(commonStyles.evidenceText, themeStyles.evidenceText)}>{alert.evidence}</p>
                  </div>

                  {/* Flags pills */}
                  {alert.flags && alert.flags.length > 0 && (
                    <div className={commonStyles.flagsList}>
                      {alert.flags.slice(0, 5).map((flag, i) => (
                        <span key={i} className={cn(commonStyles.flagItem, themeStyles.flagItem)}>
                          <Flag size={10} /> {flag}
                        </span>
                      ))}
                      {alert.flags.length > 5 && (
                        <span className={cn(commonStyles.flagItem, themeStyles.flagItem)}>
                          +{alert.flags.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Signal Breakdown Toggle */}
                  {hasSignals && (
                    <button
                      className={cn(commonStyles.signalToggle, themeStyles.signalToggle)}
                      onClick={() => toggleSignals(alert.id)}
                      aria-expanded={isExpanded}
                    >
                      <Activity size={14} />
                      Signal Breakdown ({Object.keys(alert.signals!).length} signals)
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}

                  {/* Signal Breakdown Content */}
                  {hasSignals && isExpanded && (
                    <div className={cn(commonStyles.signalBreakdown, themeStyles.signalBreakdown)}>
                      {Object.entries(alert.signals!).map(([key, signal]) => {
                        const SignalIcon = SIGNAL_ICONS[key] || Activity;
                        const maxScore = getMaxSignalScore(key);
                        const pct = Math.min(100, (signal.score / maxScore) * 100);
                        const barColor = pct >= 75 ? '#e81123' : pct >= 50 ? '#f2a93e' : pct >= 25 ? '#ffb900' : '#27ae60';

                        return (
                          <div key={key} className={commonStyles.signalRow}>
                            <div className={commonStyles.signalInfo}>
                              <SignalIcon size={14} className={commonStyles.signalIcon} />
                              <span className={commonStyles.signalLabel}>{SIGNAL_LABELS[key] || key}</span>
                              <span className={commonStyles.signalScore}>{signal.score}/{maxScore}</span>
                            </div>
                            <div className={cn(commonStyles.signalProgress, themeStyles.signalProgress)}>
                              <div
                                className={commonStyles.signalFill}
                                style={{ width: `${pct}%`, backgroundColor: barColor }}
                              />
                            </div>
                            {signal.flags.length > 0 && (
                              <div className={commonStyles.signalFlags}>
                                {signal.flags.map((f, i) => (
                                  <span key={i} className={cn(commonStyles.signalFlag, themeStyles.signalFlag)}>{f}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className={commonStyles.alertActions}>
                  <Button variant="outline" size="sm" onClick={() => setSelectedAlert(alert)}>
                    <Eye size={14} /> Review
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAnalyzeUser(alert.user_id, alert.id)}
                    isLoading={analyzingUser === alert.user_id}
                  >
                    <Sparkles size={14} /> Re-Analyze
                  </Button>
                  {alert.status === 'pending' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResolveAlert(alert.id, 'false_positive')}
                      >
                        <XCircle size={14} /> False Positive
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => { setBlockUserId(alert.user_id); setShowBlockModal(true); }}
                      >
                        <Ban size={14} /> Block User
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Block User Modal */}
      <Modal
        isOpen={showBlockModal}
        onClose={() => { setShowBlockModal(false); setBlockUserId(null); }}
        title="Block User"
        size="small"
      >
        <p>Are you sure you want to block this user? This action will prevent them from accessing the platform.</p>
        <div className={commonStyles.modalActions}>
          <Button variant="ghost" onClick={() => { setShowBlockModal(false); setBlockUserId(null); }}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (blockUserId !== null) handleBlockUser(blockUserId); setShowBlockModal(false); setBlockUserId(null); }}>
            <Ban size={14} /> Block User
          </Button>
        </div>
      </Modal>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className={cn(commonStyles.modal, themeStyles.modal)}>
          <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
            <div className={commonStyles.modalHeader}>
              <h2><ShieldAlert size={20} /> Alert Details</h2>
              <button onClick={() => setSelectedAlert(null)} className={commonStyles.closeButton} aria-label="Close">
                <XCircle size={20} />
              </button>
            </div>

            <div className={commonStyles.modalBody}>
              {/* Risk Gauge */}
              <div className={commonStyles.modalGauge}>
                <RiskGauge score={selectedAlert.risk_score} size={120} />
                <div className={cn(commonStyles.severityBadge, commonStyles[`sev${selectedAlert.severity}`])}>
                  {(SEVERITY_CONFIG[selectedAlert.severity]?.icon &&
                    (() => { const I = SEVERITY_CONFIG[selectedAlert.severity].icon; return <I size={14} />; })()
                  )}
                  {SEVERITY_CONFIG[selectedAlert.severity]?.label || selectedAlert.severity}
                </div>
              </div>

              <div className={commonStyles.detailGrid}>
                <div className={commonStyles.detailRow}>
                  <span className={commonStyles.detailLabel}>Alert ID</span>
                  <span className={commonStyles.detailValue}>{selectedAlert.id}</span>
                </div>
                <div className={commonStyles.detailRow}>
                  <span className={commonStyles.detailLabel}>User</span>
                  <span className={commonStyles.detailValue}>{selectedAlert.user_email}</span>
                </div>
                <div className={commonStyles.detailRow}>
                  <span className={commonStyles.detailLabel}>Type</span>
                  <span className={commonStyles.detailValue}>{selectedAlert.alert_type}</span>
                </div>
                <div className={commonStyles.detailRow}>
                  <span className={commonStyles.detailLabel}>Status</span>
                  <span className={commonStyles.detailValue}>
                    {(() => { const S = getStatusConfig(selectedAlert.status); return <><S.icon size={14} /> {S.label}</>; })()}
                  </span>
                </div>
              </div>

              <div className={commonStyles.detailFull}>
                <span className={commonStyles.detailLabel}>Evidence</span>
                <p className={cn(commonStyles.detailText, themeStyles.detailText)}>{selectedAlert.evidence}</p>
              </div>

              {/* Signal Breakdown in Modal */}
              {selectedAlert.signals && Object.keys(selectedAlert.signals).length > 0 && (
                <div className={commonStyles.detailFull}>
                  <span className={commonStyles.detailLabel}>
                    <Activity size={14} /> Signal Breakdown
                  </span>
                  <div className={cn(commonStyles.signalBreakdown, themeStyles.signalBreakdown)}>
                    {Object.entries(selectedAlert.signals).map(([key, signal]) => {
                      const SignalIcon = SIGNAL_ICONS[key] || Activity;
                      const maxScore = getMaxSignalScore(key);
                      const pct = Math.min(100, (signal.score / maxScore) * 100);
                      const barColor = pct >= 75 ? '#e81123' : pct >= 50 ? '#f2a93e' : pct >= 25 ? '#ffb900' : '#27ae60';
                      return (
                        <div key={key} className={commonStyles.signalRow}>
                          <div className={commonStyles.signalInfo}>
                            <SignalIcon size={14} className={commonStyles.signalIcon} />
                            <span className={commonStyles.signalLabel}>{SIGNAL_LABELS[key] || key}</span>
                            <span className={commonStyles.signalScore}>{signal.score}/{maxScore}</span>
                          </div>
                          <div className={cn(commonStyles.signalProgress, themeStyles.signalProgress)}>
                            <div className={commonStyles.signalFill} style={{ width: `${pct}%`, backgroundColor: barColor }} />
                          </div>
                          {signal.flags.length > 0 && (
                            <div className={commonStyles.signalFlags}>
                              {signal.flags.map((f, i) => (
                                <span key={i} className={cn(commonStyles.signalFlag, themeStyles.signalFlag)}>{f}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedAlert.recommendations && selectedAlert.recommendations.length > 0 && (
                <div className={commonStyles.detailFull}>
                  <span className={commonStyles.detailLabel}>
                    <Lightbulb size={14} /> Recommendations
                  </span>
                  <ul className={cn(commonStyles.recommendationsList, themeStyles.recommendationsList)}>
                    {selectedAlert.recommendations.map((rec, i) => (
                      <li key={i} className={commonStyles.recommendationItem}>
                        <CheckCircle size={14} className={commonStyles.recIcon} />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAlert.status === 'pending' && (
                <div className={commonStyles.detailFull}>
                  <label className={commonStyles.detailLabel}>Resolution Notes</label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className={cn(commonStyles.textarea, themeStyles.textarea)}
                    placeholder="Add notes about this alert..."
                    rows={4}
                  />
                </div>
              )}
            </div>

            <div className={commonStyles.modalFooter}>
              <Button variant="ghost" onClick={() => setSelectedAlert(null)}>Close</Button>
              {selectedAlert.status === 'pending' && (
                <>
                  <Button variant="secondary" onClick={() => handleResolveAlert(selectedAlert.id, 'false_positive')}>
                    <XCircle size={14} /> False Positive
                  </Button>
                  <Button variant="success" onClick={() => handleResolveAlert(selectedAlert.id, 'resolved')}>
                    <CheckCircle size={14} /> Resolve
                  </Button>
                  <Button variant="danger" onClick={() => { setBlockUserId(selectedAlert.user_id); setShowBlockModal(true); }}>
                    <Ban size={14} /> Block User
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={cn(commonStyles.toast, toast.type === 'success' ? commonStyles.toastSuccess : commonStyles.toastError)}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
