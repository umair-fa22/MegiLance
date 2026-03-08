// @AI-HINT: Admin Support page. Theme-aware, accessible, animated tickets list with filters and a details panel.
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import { useAdminData } from '@/hooks/useAdmin';
import Modal from '@/app/components/Modal/Modal';
import Button from '@/app/components/Button/Button';
import api from '@/lib/api';
import common from './AdminSupport.common.module.css';
import light from './AdminSupport.light.module.css';
import dark from './AdminSupport.dark.module.css';

interface Ticket {
  id: string;
  subject: string;
  requester: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved';
  created: string; // ISO
  assignee?: string;
  body: string;
}

const STATUSES = ['All', 'Open', 'In Progress', 'Resolved'] as const;
const PRIORITIES = ['All', 'Low', 'Medium', 'High'] as const;

const AdminSupport: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { tickets, loading, error } = useAdminData();

  const [localTickets, setLocalTickets] = useState<Ticket[]>([]);

  const rows: Ticket[] = useMemo(() => {
    const base: Ticket[] = Array.isArray(tickets)
      ? (tickets as any[]).map((t, idx) => ({
          id: String(t.id ?? idx),
          subject: t.subject ?? '—',
          requester: t.requester ?? '—',
          priority: (t.priority as Ticket['priority']) ?? 'Low',
          status: (t.status as Ticket['status']) ?? 'Open',
          created: t.createdAt ?? t.created ?? '',
          assignee: t.assignee ?? undefined,
          body: t.body ?? t.message ?? '',
        }))
      : [];
    return [...base, ...localTickets];
  }, [tickets, localTickets]);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('All');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('All');
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(t =>
      (status === 'All' || t.status === status) &&
      (priority === 'All' || t.priority === priority) &&
      (!q || t.subject.toLowerCase().includes(q) || t.requester.toLowerCase().includes(q) || (t.assignee?.toLowerCase().includes(q) ?? false))
    );
  }, [rows, query, status, priority]);

  // Sorting
  type SortKey = 'subject' | 'requester' | 'priority' | 'status' | 'created';
  const [sortKey, setSortKey] = useState<SortKey>('created');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let av: string = '';
      let bv: string = '';
      switch (sortKey) {
        case 'subject': av = a.subject; bv = b.subject; break;
        case 'requester': av = a.requester; bv = b.requester; break;
        case 'priority': av = a.priority; bv = b.priority; break;
        case 'status': av = a.status; bv = b.status; break;
        case 'created': av = a.created || ''; bv = b.created || ''; break;
      }
      // If created is ISO, string compare works for chronological order
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const paged = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageSafe, pageSize]);

  React.useEffect(() => { setPage(1); }, [sortKey, sortDir, query, status, priority, pageSize]);

  const selectedTicket = sorted.find(t => t.id === selectedId) || rows.find(t => t.id === selectedId) || null;

  // CSV export
  const exportCSV = () => {
    const header = ['ID','Subject','Requester','Priority','Status','Created','Assignee'];
    const data = sorted.map(t => [t.id, t.subject, t.requester, t.priority, t.status, t.created, t.assignee ?? '']);
    const csv = [header, ...data]
      .map(r => r.map(val => '"' + String(val).replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // New Ticket modal state
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newRequester, setNewRequester] = useState('');
  const [newPriority, setNewPriority] = useState<Ticket['priority']>('Low');
  const [newBody, setNewBody] = useState('');
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  };

  const resetNewForm = () => {
    setNewSubject('');
    setNewRequester('');
    setNewPriority('Low');
    setNewBody('');
  };

  const createTicket = () => {
    if (!newSubject.trim() || !newRequester.trim() || !newBody.trim()) return;
    const t: Ticket = {
      id: `local-${Date.now()}`,
      subject: newSubject.trim(),
      requester: newRequester.trim(),
      priority: newPriority,
      status: 'Open',
      created: new Date().toISOString(),
      body: newBody.trim(),
    };
    setLocalTickets(prev => [t, ...prev]);
    setSelectedId(t.id);
    setIsNewOpen(false);
    resetNewForm();
  };

  // Assign ticket via API or local state
  const assignSelected = async () => {
    if (!selectedTicket) return;
    const name = prompt('Assign to (user ID or name):', selectedTicket.assignee ?? '');
    if (name === null || !name.trim()) return;

    if (String(selectedTicket.id).startsWith('local-')) {
      setLocalTickets(prev => prev.map(t => (t.id === selectedTicket.id ? { ...t, assignee: name.trim() || undefined } : t)));
      showToast(`Ticket assigned to ${name.trim()}`);
    } else {
      try {
        await api.supportTickets.reply(selectedTicket.id, `Assigned to ${name.trim()}`);
        // Update local state to reflect assignment
        showToast(`Ticket assigned to ${name.trim()}`);
      } catch {
        showToast('Failed to assign ticket. Please try again.', 'error');
      }
    }
  };

  const resolveSelected = async () => {
    if (!selectedTicket) return;

    if (String(selectedTicket.id).startsWith('local-')) {
      setLocalTickets(prev => prev.map(t => (t.id === selectedTicket.id ? { ...t, status: 'Resolved' } : t)));
      showToast('Ticket resolved!');
    } else {
      try {
        await api.supportTickets.close(selectedTicket.id);
        showToast('Ticket resolved!');
      } catch {
        showToast('Failed to resolve ticket. Please try again.', 'error');
      }
    }
  };

  return (
    <PageTransition className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <ScrollReveal className={common.header}>
          <div>
            <h1 className={common.title}>Support</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Triage and resolve support tickets. Filter by status and priority; select a ticket to view details.</p>
          </div>
          <div className={common.controls} aria-label="Support filters">
            <label className={common.srOnly} htmlFor="q">Search</label>
            <input id="q" className={cn(common.input, themed.input)} type="search" placeholder="Search subject, requester, assignee…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <label className={common.srOnly} htmlFor="status">Status</label>
            <select id="status" className={cn(common.select, themed.select)} value={status} onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className={common.srOnly} htmlFor="priority">Priority</label>
            <select id="priority" className={cn(common.select, themed.select)} value={priority} onChange={(e) => setPriority(e.target.value as (typeof PRIORITIES)[number])}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button type="button" className={cn(common.button, themed.button)} onClick={() => setIsNewOpen(true)}>New Ticket</button>
          </div>
        </ScrollReveal>

        <section className={cn(common.layout)}>
          <ScrollReveal className={cn(common.listCard, themed.listCard)} aria-label="Tickets list" delay={0.1}>
            <div className={cn(common.cardTitle)}>Tickets</div>
            <div className={cn(common.toolbar)}>
              <div className={common.controls}>
                <label className={common.srOnly} htmlFor="sort-key">Sort by</label>
                <select id="sort-key" className={cn(common.select, themed.select)} value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
                  <option value="created">Created</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                  <option value="subject">Subject</option>
                  <option value="requester">Requester</option>
                </select>
                <label className={common.srOnly} htmlFor="sort-dir">Sort direction</label>
                <select id="sort-dir" className={cn(common.select, themed.select)} value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc'|'desc')}>
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
                <label className={common.srOnly} htmlFor="page-size">Rows per page</label>
                <select id="page-size" className={cn(common.select, themed.select)} value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div>
                <button type="button" className={cn(common.button, themed.button)} onClick={exportCSV}>Export CSV</button>
              </div>
            </div>
            {loading && <div className={common.skeletonRow} aria-busy={loading || undefined} />}
            {error && <div className={common.error}>Failed to load tickets.</div>}
            <div className={common.list} role="listbox" aria-label="Tickets">
              {paged.map(t => {
                const isSelected = selectedId === t.id;
                return (
                  <div
                    key={t.id}
                    role="option"
                    aria-selected={isSelected || undefined}
                    tabIndex={0}
                    className={cn(common.item)}
                    onClick={() => setSelectedId(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(t.id);
                      }
                    }}
                  >
                    <div className={common.itemHeader}>
                      <span>{t.subject}</span>
                      <span className={cn(common.badge, themed.badge)}>{t.priority}</span>
                    </div>
                    <div className={common.meta}>
                      <span>{t.requester}</span>
                      <span>•</span>
                      <span>{t.status}</span>
                      <span>•</span>
                      <span>{t.created}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {sorted.length === 0 && !loading && (
              <div role="status" aria-live="polite">No tickets match your filters.</div>
            )}
            {sorted.length > 0 && (
              <div className={common.paginationBar} role="navigation" aria-label="Pagination">
                <button
                  type="button"
                  className={cn(common.button, themed.button, 'secondary')}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={pageSafe === 1}
                  aria-label="Previous page"
                >Prev</button>
                <span className={common.paginationInfo} aria-live="polite">Page {pageSafe} of {totalPages} · {sorted.length} result(s)</span>
                <button
                  type="button"
                  className={cn(common.button, themed.button)}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={pageSafe === totalPages}
                  aria-label="Next page"
                >Next</button>
              </div>
            )}
          </ScrollReveal>

          <ScrollReveal className={cn(common.detailsCard, themed.detailsCard)} aria-label="Ticket details" delay={0.2}>
            <div className={cn(common.cardTitle)}>Details</div>
            {selectedTicket ? (
              <div className={common.detailsGrid}>
                <div className={common.kv}><div>Subject</div><div>{selectedTicket.subject}</div></div>
                <div className={common.kv}><div>Requester</div><div>{selectedTicket.requester}</div></div>
                <div className={common.kv}><div>Status</div><div>{selectedTicket.status}</div></div>
                <div className={common.kv}><div>Priority</div><div>{selectedTicket.priority}</div></div>
                <div className={common.kv}><div>Assignee</div><div>{selectedTicket.assignee ?? 'Unassigned'}</div></div>
                <div className={common.kv}><div>Created</div><div>{selectedTicket.created}</div></div>
                <div className={common.kv}><div>Message</div><div>{selectedTicket.body}</div></div>

                <div className={common.actions}>
                  <button type="button" className={cn(common.button, themed.button)} onClick={assignSelected}>Assign</button>
                  <button type="button" className={cn(common.button, themed.button, 'secondary')} onClick={resolveSelected}>Resolve</button>
                </div>
              </div>
            ) : (
              <div role="status" aria-live="polite">Select a ticket to view details.</div>
            )}
          </ScrollReveal>
        </section>
      </div>
      {isNewOpen && (
        <Modal isOpen={isNewOpen} onClose={() => { setIsNewOpen(false); }} title="New Support Ticket">
          <div className={common.field}>
            <label htmlFor="new-subject" className={common.label}>Subject</label>
            <input id="new-subject" className={cn(common.input, themed.input)} value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Brief issue summary" />
          </div>
          <div className={common.row}>
            <div className={common.field}>
              <label htmlFor="new-requester" className={common.label}>Requester</label>
              <input id="new-requester" className={cn(common.input, themed.input)} value={newRequester} onChange={(e) => setNewRequester(e.target.value)} placeholder="Requester name or email" />
            </div>
            <div className={common.field}>
              <label htmlFor="new-priority" className={common.label}>Priority</label>
              <select id="new-priority" className={cn(common.select, themed.select)} value={newPriority} onChange={(e) => setNewPriority(e.target.value as Ticket['priority'])}>
                {(['Low','Medium','High'] as const).map(p => (<option key={p} value={p}>{p}</option>))}
              </select>
            </div>
          </div>
          <div className={common.field}>
            <label htmlFor="new-body" className={common.label}>Message</label>
            <textarea id="new-body" className={cn(common.textarea, themed.textarea)} rows={5} value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Describe the issue in detail" />
          </div>
          <div className={common.modalActions}>
            <button type="button" className={cn(common.button, themed.button, 'secondary')} onClick={() => { setIsNewOpen(false); }}>Cancel</button>
            <button type="button" className={cn(common.button, themed.button)} onClick={createTicket} disabled={!newSubject.trim() || !newRequester.trim() || !newBody.trim()}>Create</button>
          </div>
        </Modal>
      )}

      {toast && (
        <div className={cn(common.toast, toast.type === 'error' && common.toastError, themed.toast, toast.type === 'error' && themed.toastError)}>
          {toast.message}
        </div>
      )}
    </PageTransition>
  );
};

export default AdminSupport;
