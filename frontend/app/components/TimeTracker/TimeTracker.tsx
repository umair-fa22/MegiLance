// @AI-HINT: Time Tracker Component - Real-time time tracking for hourly contracts
'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Select from '@/app/components/Select/Select';
import { Play, Square } from 'lucide-react';
import api from '@/lib/api';

import commonStyles from './TimeTracker.common.module.css';
import lightStyles from './TimeTracker.light.module.css';
import darkStyles from './TimeTracker.dark.module.css';

interface Contract {
  id: string;
  title: string;
  clientName?: string;
}

interface TimeEntry {
  id: number;
  contract_id: number;
  description: string;
  start_time: string;
  end_time?: string;
}

export default function TimeTracker() {
  const { resolvedTheme } = useTheme();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  };

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    fetchContracts();
    checkActiveTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeEntry) {
      const startTime = new Date(activeEntry.start_time).getTime();
      
      // Update immediately
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));

      // Start interval
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedTime(0);
    }
  }, [activeEntry]);

  const fetchContracts = async () => {
    try {
      // Fetch active hourly contracts
      // Assuming api.contracts.list supports filtering by type and status
      // If not, we might need to filter client-side or add backend support
      const response: any = await api.contracts.list({ status: 'active' });
      if (response && response.contracts) {
        // Filter for hourly contracts
        const hourly = response.contracts.filter((c: any) => c.contract_type === 'hourly');
        setContracts(hourly.map((c: any) => ({
          id: c.id.toString(),
          title: c.job_title || `Contract #${c.id}`,
          clientName: c.client_name
        })));
        
        if (hourly.length > 0 && !selectedContractId) {
          setSelectedContractId(hourly[0].id.toString());
        }
      }
    } catch {
      // Failed to fetch contracts
    }
  };

  const checkActiveTimer = async () => {
    try {
      // We need an endpoint to get the currently running time entry
      // Or list entries with end_time=null
      // Assuming list returns running entries first or we filter
      const response: any = await api.timeEntries.list(undefined, 1, 10);
      if (response && Array.isArray(response)) {
        const running = response.find((e: any) => !e.end_time);
        if (running) {
          setActiveEntry(running);
          setSelectedContractId(running.contract_id.toString());
          setDescription(running.description || '');
        }
      }
    } catch {
      // Failed to check active timer
    }
  };

  const handleStart = async () => {
    if (!selectedContractId) {
      showToast('Please select a contract', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const entry: any = await api.timeEntries.start(
        parseInt(selectedContractId),
        description
      );
      setActiveEntry(entry);
    } catch {
      showToast('Failed to start timer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!activeEntry) return;
    
    setLoading(true);
    try {
      await api.timeEntries.stop(activeEntry.id);
      setActiveEntry(null);
      setDescription('');
      // Optionally refresh list or show summary
    } catch {
      showToast('Failed to stop timer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.activeIndicator} style={{ opacity: activeEntry ? 1 : 0 }} />
      
      <div className={cn(commonStyles.timerDisplay, themeStyles.timerDisplay)}>
        {formatTime(elapsedTime)}
      </div>

      <div className={commonStyles.selectContainer}>
        <Select
          value={selectedContractId}
          onChange={(e) => setSelectedContractId(e.target.value)}
          options={contracts.map(c => ({
            value: c.id,
            label: c.title
          }))}
          disabled={!!activeEntry}
          placeholder="Select Contract"
        />
      </div>

      <input
        type="text"
        className={cn(commonStyles.descriptionInput, themeStyles.descriptionInput)}
        placeholder="What are you working on?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={!!activeEntry}
      />

      <div className={commonStyles.controls}>
        {!activeEntry ? (
          <Button
            variant="success"
            size="md"
            onClick={handleStart}
            isLoading={loading}
            disabled={!selectedContractId}
          >
            <Play size={16} className={commonStyles.mr2} /> Start
          </Button>
        ) : (
          <Button
            variant="danger"
            size="md"
            onClick={handleStop}
            isLoading={loading}
          >
            <Square size={16} className={commonStyles.mr2} /> Stop
          </Button>
        )}
      </div>

      {toast && (
        <div className={cn(commonStyles.toast, themeStyles.toast, toast.type === 'error' && commonStyles.toastError, toast.type === 'error' && themeStyles.toastError)}>
          {toast.message}
        </div>
      )}
    </div>
  );
};
