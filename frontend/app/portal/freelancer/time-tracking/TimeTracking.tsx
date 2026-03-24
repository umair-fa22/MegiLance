// @AI-HINT: Time Tracking page - Full-featured time entry management for freelancers
// Features: Start/stop timer, view history, approve entries, generate reports

'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { timeEntriesApi, contractsApi } from '@/lib/api';
import type { TimeEntry, TimeEntrySummary, Contract } from '@/types/api';
import { Play, Square, Clock, DollarSign, Calendar, Check, X } from 'lucide-react'
import Button from '@/app/components/Button/Button';
import Modal from '@/app/components/Modal/Modal';

import commonStyles from './TimeTracking.common.module.css';
import lightStyles from './TimeTracking.light.module.css';
import darkStyles from './TimeTracking.dark.module.css';

const TimeTracking: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<number | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [summary, setSummary] = useState<TimeEntrySummary | null>(null);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [description, setDescription] = useState('');
  const [billable, setBillable] = useState(true);
  const [hourlyRate, setHourlyRate] = useState<number>(50);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<number | null>(null);

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    if (selectedContract) {
      loadTimeEntries();
      loadSummary();
    }
  }, [selectedContract, page, statusFilter]);

  const loadContracts = async () => {
    try {
      const response = await contractsApi.list() as { contracts: Contract[] };
      setContracts(response.contracts || []);
      if (response.contracts?.length > 0) {
        setSelectedContract(response.contracts[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadTimeEntries = async () => {
    if (!selectedContract) return;
    
    setLoading(true);
    try {
      const response = await timeEntriesApi.list(selectedContract, page, 10) as { entries: TimeEntry[] };
      setTimeEntries(response.entries || []);
      
      // Check for active entry
      const active = response.entries?.find((e: TimeEntry) => !e.end_time);
      setActiveEntry(active || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!selectedContract) return;
    
    try {
      const data = await timeEntriesApi.getSummary(selectedContract) as TimeEntrySummary;
      setSummary(data);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load summary:', err);
      }
    }
  };

  const handleStart = async () => {
    if (!selectedContract) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const entry = await timeEntriesApi.start(
        selectedContract,
        description || 'Working on contract tasks',
        billable,
        billable ? hourlyRate : undefined
      ) as TimeEntry;
      setActiveEntry(entry);
      setDescription('');
      loadTimeEntries();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!activeEntry) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await timeEntriesApi.stop(activeEntry.id);
      setActiveEntry(null);
      loadTimeEntries();
      loadSummary();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (entryId: number) => {
    try {
      await timeEntriesApi.approve(entryId);
      loadTimeEntries();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReject = async (entryId: number) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    
    try {
      await timeEntriesApi.reject(entryId, reason);
      loadTimeEntries();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (entryId: number) => {
    try {
      await timeEntriesApi.delete(entryId);
      loadTimeEntries();
      loadSummary();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <h1 className={cn(commonStyles.title, themeStyles.title)}>
          Time Tracking
        </h1>
        <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
          Track your work hours and manage billable time
        </p>
      </div>

      {error && (
        <div className={cn(commonStyles.error, themeStyles.error)}>
          {error}
        </div>
      )}

      {/* Contract Selector */}
      <div className={cn(commonStyles.contractSelector, themeStyles.contractSelector)}>
        <label className={cn(commonStyles.label, themeStyles.label)}>
          Select Contract:
        </label>
        <select
          value={selectedContract || ''}
          onChange={(e) => setSelectedContract(Number(e.target.value))}
          className={cn(commonStyles.select, themeStyles.select)}
          aria-label="Select Contract"
        >
          <option value="">Choose a contract...</option>
          {contracts.map((contract) => (
            <option key={contract.id} value={contract.id}>
              Contract #{contract.id} - Project #{contract.project_id}
            </option>
          ))}
        </select>
      </div>

      {selectedContract && (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className={cn(commonStyles.summaryGrid, themeStyles.summaryGrid)}>
              <div className={cn(commonStyles.summaryCard, themeStyles.summaryCard)}>
                <Clock className={cn(commonStyles.summaryIcon, themeStyles.summaryIcon)} />
                <div className={cn(commonStyles.summaryContent, themeStyles.summaryContent)}>
                  <div className={cn(commonStyles.summaryLabel, themeStyles.summaryLabel)}>
                    Total Hours
                  </div>
                  <div className={cn(commonStyles.summaryValue, themeStyles.summaryValue)}>
                    {summary.total_hours.toFixed(2)}h
                  </div>
                </div>
              </div>

              <div className={cn(commonStyles.summaryCard, themeStyles.summaryCard)}>
                <DollarSign className={cn(commonStyles.summaryIcon, themeStyles.summaryIcon)} />
                <div className={cn(commonStyles.summaryContent, themeStyles.summaryContent)}>
                  <div className={cn(commonStyles.summaryLabel, themeStyles.summaryLabel)}>
                    Total Earned
                  </div>
                  <div className={cn(commonStyles.summaryValue, themeStyles.summaryValue)}>
                    {formatCurrency(summary.total_amount)}
                  </div>
                </div>
              </div>

              <div className={cn(commonStyles.summaryCard, themeStyles.summaryCard)}>
                <Calendar className={cn(commonStyles.summaryIcon, themeStyles.summaryIcon)} />
                <div className={cn(commonStyles.summaryContent, themeStyles.summaryContent)}>
                  <div className={cn(commonStyles.summaryLabel, themeStyles.summaryLabel)}>
                    Entries
                  </div>
                  <div className={cn(commonStyles.summaryValue, themeStyles.summaryValue)}>
                    {summary.entry_count}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timer Controls */}
          <div className={cn(commonStyles.timerSection, themeStyles.timerSection)}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
              {activeEntry ? 'Timer Running' : 'Start Timer'}
            </h2>

            {!activeEntry ? (
              <div className={cn(commonStyles.timerForm, themeStyles.timerForm)}>
                <input
                  type="text"
                  placeholder="What are you working on?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={cn(commonStyles.input, themeStyles.input)}
                />
                
                <div className={cn(commonStyles.timerOptions, themeStyles.timerOptions)}>
                  <label className={cn(commonStyles.checkbox, themeStyles.checkbox)}>
                    <input
                      type="checkbox"
                      checked={billable}
                      onChange={(e) => setBillable(e.target.checked)}
                    />
                    <span>Billable</span>
                  </label>

                  {billable && (
                    <input
                      type="number"
                      placeholder="Hourly rate"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className={cn(commonStyles.inputSmall, themeStyles.inputSmall)}
                      min="0"
                      step="0.01"
                    />
                  )}
                </div>

                <Button
                  variant="primary"
                  onClick={handleStart}
                  disabled={loading}
                >
                  <Play size={18} className="mr-2" />
                  Start Timer
                </Button>
              </div>
            ) : (
              <div className={cn(commonStyles.activeTimer, themeStyles.activeTimer)}>
                <div className={cn(commonStyles.timerInfo, themeStyles.timerInfo)}>
                  <p className={cn(commonStyles.timerDesc, themeStyles.timerDesc)}>
                    {activeEntry.description}
                  </p>
                  <p className={cn(commonStyles.timerTime, themeStyles.timerTime)}>
                    Started: {new Date(activeEntry.start_time).toLocaleTimeString()}
                  </p>
                </div>

                <Button
                  variant="danger"
                  onClick={handleStop}
                  disabled={loading}
                >
                  <Square size={18} className="mr-2" />
                  Stop Timer
                </Button>
              </div>
            )}
          </div>

          {/* Time Entries Table */}
          <div className={cn(commonStyles.entriesSection, themeStyles.entriesSection)}>
            <div className={cn(commonStyles.entriesHeader, themeStyles.entriesHeader)}>
              <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                Time Entries
              </h2>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={cn(commonStyles.filterSelect, themeStyles.filterSelect)}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {loading ? (
              <div className={cn(commonStyles.loading, themeStyles.loading)}>
                Loading entries...
              </div>
            ) : timeEntries.length === 0 ? (
              <div className={cn(commonStyles.empty, themeStyles.empty)}>
                No time entries yet. Start the timer to begin tracking!
              </div>
            ) : (
              <div className={cn(commonStyles.table, themeStyles.table)}>
                <table className={cn(commonStyles.tableElement, themeStyles.tableElement)}>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Start Time</th>
                      <th>Duration</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.description}</td>
                        <td>{new Date(entry.start_time).toLocaleString()}</td>
                        <td>{formatDuration(entry.duration_minutes)}</td>
                        <td>{formatCurrency(entry.amount)}</td>
                        <td>
                          <span className={cn(
                            commonStyles.badge,
                            themeStyles.badge,
                            commonStyles[`badge-${entry.status}`],
                            themeStyles[`badge-${entry.status}`]
                          )}>
                            {entry.status}
                          </span>
                        </td>
                        <td>
                          <div className={cn(commonStyles.actions, themeStyles.actions)}>
                            {entry.status === 'submitted' && (
                              <>
                                <button
                                  onClick={() => handleApprove(entry.id)}
                                  className={cn(commonStyles.iconBtn, themeStyles.iconBtn)}
                                  title="Approve"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => handleReject(entry.id)}
                                  className={cn(commonStyles.iconBtn, themeStyles.iconBtn)}
                                  title="Reject"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            )}
                            {entry.status === 'draft' && (
                              <button
                                onClick={() => { setDeleteEntryId(entry.id); setShowDeleteModal(true); }}
                                className={cn(commonStyles.iconBtn, themeStyles.iconBtn, commonStyles.deleteBtn)}
                                title="Delete"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteEntryId(null); }}
        title="Delete Time Entry"
        size="small"
      >
        <p>Are you sure you want to delete this time entry?</p>
        <div className={commonStyles.modalActions}>
          <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteEntryId(null); }}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (deleteEntryId !== null) handleDelete(deleteEntryId); setShowDeleteModal(false); setDeleteEntryId(null); }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default TimeTracking;
