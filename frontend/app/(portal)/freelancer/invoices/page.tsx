// @AI-HINT: Invoice management page - Create, view, track invoices with payment status
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { invoicesApi } from '@/lib/api';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './Invoices.common.module.css';
import lightStyles from './Invoices.light.module.css';
import darkStyles from './Invoices.dark.module.css';
import Button from '@/app/components/atoms/Button/Button';
import Input from '@/app/components/atoms/Input/Input';
import Textarea from '@/app/components/atoms/Textarea/Textarea';
import {
  FileText, DollarSign, CheckCircle, Clock, AlertTriangle,
  Plus, Send, Edit2, Download, Trash2, X, Search,
  RotateCw, Eye, Receipt, Calendar, User, Mail,
  Briefcase, Hash, AlertCircle, ChevronDown, MoreVertical
} from 'lucide-react';

interface Invoice {
  id: number;
  invoice_number: string;
  client_name: string;
  client_email: string;
  project_title: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  created_at: string;
  items: InvoiceItem[];
  notes?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

const STATUS_CONFIG = {
  all: { label: 'All', icon: FileText },
  draft: { label: 'Draft', icon: Edit2 },
  sent: { label: 'Sent', icon: Send },
  paid: { label: 'Paid', icon: CheckCircle },
  overdue: { label: 'Overdue', icon: AlertTriangle },
} as const;

export default function InvoicesPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, overdue: 0 });

  const [newInvoice, setNewInvoice] = useState({
    client_name: '',
    client_email: '',
    project_title: '',
    due_date: '',
    notes: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }] as InvoiceItem[],
  });

  useEffect(() => {
    setMounted(true);
    loadInvoices();
  }, [filter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoicesApi.list({
        status: filter !== 'all' ? filter : undefined
      }) as any;

      let invoiceData: Invoice[] = [];
      if (response && (response.invoices?.length > 0 || (Array.isArray(response) && response.length > 0))) {
        invoiceData = response.invoices || response;
      }

      setInvoices(invoiceData);

      const total = invoiceData.reduce((sum, inv) => sum + inv.amount, 0);
      const paid = invoiceData.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
      const pending = invoiceData.filter(inv => ['sent', 'draft'].includes(inv.status)).reduce((sum, inv) => sum + inv.amount, 0);
      const overdue = invoiceData.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);
      setStats({ total, paid, pending, overdue });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load invoices:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.client_name || !newInvoice.client_email || !newInvoice.due_date) return;
    try {
      const invoiceData = {
        ...newInvoice,
        amount: newInvoice.items.reduce((sum, item) => sum + item.amount, 0),
      };
      await invoicesApi.create(invoiceData);
      setShowCreateModal(false);
      setNewInvoice({
        client_name: '', client_email: '', project_title: '',
        due_date: '', notes: '',
        items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      });
      showToast('Invoice created successfully!', 'success');
      loadInvoices();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to create invoice:', error);
      }
      showToast('Failed to create invoice', 'error');
    }
  };

  const handleSendInvoice = async (invoiceId: number) => {
    try {
      await invoicesApi.send(invoiceId);
      showToast('Invoice sent successfully!', 'success');
      loadInvoices();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send invoice:', error);
      }
      showToast('Failed to send invoice', 'error');
    }
  };

  const confirmDeleteInvoice = async () => {
    if (!deleteTargetId) return;
    try {
      await invoicesApi.delete(deleteTargetId);
      showToast('Invoice deleted', 'success');
      loadInvoices();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete invoice:', error);
      }
      showToast('Failed to delete invoice', 'error');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const items = [...newInvoice.items];
    items[index] = { ...items[index], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      items[index].amount = Math.round(Number(items[index].quantity) * Number(items[index].rate) * 100) / 100;
    }
    setNewInvoice({ ...newInvoice, items });
  };

  const addItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: '', quantity: 1, rate: 0, amount: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (newInvoice.items.length === 1) return;
    setNewInvoice({ ...newInvoice, items: newInvoice.items.filter((_, i) => i !== index) });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return 'statusPaid';
      case 'sent': return 'statusSent';
      case 'overdue': return 'statusOverdue';
      case 'draft': return 'statusDraft';
      case 'cancelled': return 'statusCancelled';
      default: return 'statusDraft';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle size={14} />;
      case 'sent': return <Send size={14} />;
      case 'overdue': return <AlertTriangle size={14} />;
      case 'draft': return <Edit2 size={14} />;
      case 'cancelled': return <X size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const q = searchQuery.toLowerCase();
    return invoices.filter(inv =>
      inv.client_name.toLowerCase().includes(q) ||
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.project_title.toLowerCase().includes(q)
    );
  }, [invoices, searchQuery]);

  if (!mounted) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        {/* Header */}
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div className={commonStyles.headerText}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>
                <Receipt size={28} className={commonStyles.titleIcon} />
                Invoices
              </h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Create and manage invoices for your projects
              </p>
            </div>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Create Invoice
            </Button>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <StaggerContainer delay={0.1} className={commonStyles.statsGrid}>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIconBlue)}>
                <DollarSign size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Invoiced</span>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{formatCurrency(stats.total)}</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIconGreen)}>
                <CheckCircle size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Paid</span>
                <span className={cn(commonStyles.statValue, themeStyles.statValuePaid)}>{formatCurrency(stats.paid)}</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIconOrange)}>
                <Clock size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Pending</span>
                <span className={cn(commonStyles.statValue, themeStyles.statValuePending)}>{formatCurrency(stats.pending)}</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIconRed)}>
                <AlertTriangle size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Overdue</span>
                <span className={cn(commonStyles.statValue, themeStyles.statValueOverdue)}>{formatCurrency(stats.overdue)}</span>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Search + Filters */}
        <ScrollReveal delay={0.15}>
          <div className={cn(commonStyles.searchBar, themeStyles.searchBar)}>
            <Search size={16} className={cn(commonStyles.searchIcon, themeStyles.searchIcon)} />
            <input
              type="text"
              placeholder="Search invoices by client, number, or project..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(commonStyles.searchInput, themeStyles.searchInput)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className={cn(commonStyles.clearSearch, themeStyles.clearSearch)}>
                <X size={14} />
              </button>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className={cn(commonStyles.filters, themeStyles.filters)}>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  className={cn(
                    commonStyles.filterButton,
                    themeStyles.filterButton,
                    filter === key && commonStyles.filterActive,
                    filter === key && themeStyles.filterActive
                  )}
                  onClick={() => setFilter(key)}
                >
                  <Icon size={14} />
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Invoice List */}
        <div className={commonStyles.invoicesList}>
          {loading ? (
            <div className={cn(commonStyles.loadingState, themeStyles.loadingState)}>
              <Receipt size={32} className={commonStyles.loadingIcon} />
              <p>Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <ScrollReveal delay={0.3}>
              <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                <FileText size={40} className={commonStyles.emptyIcon} />
                <h3 className={commonStyles.emptyTitle}>
                  {searchQuery ? 'No invoices match your search' : 'No invoices found'}
                </h3>
                <p className={commonStyles.emptyText}>
                  {searchQuery ? 'Try a different search term' : 'Create your first invoice to get started'}
                </p>
                {!searchQuery && (
                  <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    <Plus size={14} /> Create Invoice
                  </Button>
                )}
              </div>
            </ScrollReveal>
          ) : (
            <StaggerContainer delay={0.3}>
              {filteredInvoices.map(invoice => (
                <StaggerItem key={invoice.id}>
                  <div
                    className={cn(commonStyles.invoiceCard, themeStyles.invoiceCard)}
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <div className={commonStyles.invoiceHeader}>
                      <div className={commonStyles.invoiceInfo}>
                        <span className={cn(commonStyles.invoiceNumber, themeStyles.invoiceNumber)}>
                          <Hash size={14} /> {invoice.invoice_number}
                        </span>
                        <span className={cn(
                          commonStyles.status,
                          commonStyles[getStatusStyle(invoice.status)],
                          themeStyles[getStatusStyle(invoice.status)]
                        )}>
                          {getStatusIcon(invoice.status)} {invoice.status}
                        </span>
                      </div>
                      <span className={cn(commonStyles.invoiceAmount, themeStyles.invoiceAmount)}>
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </span>
                    </div>
                    <div className={commonStyles.invoiceBody}>
                      <div className={commonStyles.clientInfo}>
                        <span className={cn(commonStyles.clientName, themeStyles.clientName)}>
                          <User size={14} /> {invoice.client_name}
                        </span>
                        <span className={cn(commonStyles.projectTitle, themeStyles.projectTitle)}>
                          <Briefcase size={14} /> {invoice.project_title}
                        </span>
                      </div>
                      <div className={cn(commonStyles.invoiceDates, themeStyles.invoiceDates)}>
                        <span><Calendar size={12} /> Created: {new Date(invoice.created_at).toLocaleDateString()}</span>
                        <span><Clock size={12} /> Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className={commonStyles.invoiceActions}>
                      {invoice.status === 'draft' && (
                        <>
                          <button
                            className={cn(commonStyles.actionButton, themeStyles.actionButtonPrimary)}
                            onClick={e => { e.stopPropagation(); handleSendInvoice(invoice.id); }}
                          >
                            <Send size={14} /> Send
                          </button>
                          <button
                            className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                            onClick={e => { e.stopPropagation(); }}
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                        </>
                      )}
                      {invoice.status === 'sent' && (
                        <button
                          className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                          onClick={e => { e.stopPropagation(); handleSendInvoice(invoice.id); }}
                        >
                          <RotateCw size={14} /> Resend
                        </button>
                      )}
                      <button
                        className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                        onClick={e => { e.stopPropagation(); }}
                      >
                        <Download size={14} /> Download
                      </button>
                      {invoice.status === 'draft' && (
                        <button
                          className={cn(commonStyles.actionButton, themeStyles.actionButtonDanger)}
                          onClick={e => { e.stopPropagation(); setDeleteTargetId(invoice.id); }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>

        {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className={commonStyles.modalOverlay} onClick={() => setShowCreateModal(false)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
              <div className={commonStyles.modalHeader}>
                <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                  <Plus size={20} /> Create Invoice
                </h2>
                <button
                  className={cn(commonStyles.modalClose, themeStyles.modalClose)}
                  onClick={() => setShowCreateModal(false)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className={commonStyles.modalBody}>
                <div className={commonStyles.formGrid}>
                  <div className={commonStyles.formGroup}>
                    <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>
                      <User size={14} /> Client Name *
                    </label>
                    <Input
                      value={newInvoice.client_name}
                      onChange={e => setNewInvoice({ ...newInvoice, client_name: e.target.value })}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div className={commonStyles.formGroup}>
                    <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>
                      <Mail size={14} /> Client Email *
                    </label>
                    <Input
                      type="email"
                      value={newInvoice.client_email}
                      onChange={e => setNewInvoice({ ...newInvoice, client_email: e.target.value })}
                      placeholder="client@email.com"
                    />
                  </div>
                  <div className={commonStyles.formGroup}>
                    <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>
                      <Briefcase size={14} /> Project Title
                    </label>
                    <Input
                      value={newInvoice.project_title}
                      onChange={e => setNewInvoice({ ...newInvoice, project_title: e.target.value })}
                      placeholder="Project name"
                    />
                  </div>
                  <div className={commonStyles.formGroup}>
                    <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>
                      <Calendar size={14} /> Due Date *
                    </label>
                    <Input
                      type="date"
                      value={newInvoice.due_date}
                      onChange={e => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className={commonStyles.itemsSection}>
                  <h3 className={cn(commonStyles.itemsTitle, themeStyles.itemsTitle)}>
                    <FileText size={16} /> Line Items
                  </h3>
                  <div className={cn(commonStyles.itemsHeader, themeStyles.itemsHeader)}>
                    <span>Description</span>
                    <span>Qty</span>
                    <span>Rate</span>
                    <span>Amount</span>
                    <span></span>
                  </div>
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className={commonStyles.itemRow}>
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => updateItem(index, 'description', e.target.value)}
                        className={cn(commonStyles.input, themeStyles.input)}
                        placeholder="Service description"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className={cn(commonStyles.input, themeStyles.input, commonStyles.inputSmall)}
                        min="1"
                      />
                      <input
                        type="number"
                        value={item.rate}
                        onChange={e => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        className={cn(commonStyles.input, themeStyles.input, commonStyles.inputSmall)}
                        min="0"
                        step="0.01"
                      />
                      <span className={cn(commonStyles.itemAmount, themeStyles.itemAmount)}>
                        {formatCurrency(item.amount)}
                      </span>
                      <button
                        className={cn(commonStyles.removeButton, themeStyles.removeButton)}
                        onClick={() => removeItem(index)}
                        disabled={newInvoice.items.length === 1}
                        aria-label="Remove item"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button className={cn(commonStyles.addItemButton, themeStyles.addItemButton)} onClick={addItem}>
                    <Plus size={14} /> Add Line Item
                  </button>
                </div>

                <div className={cn(commonStyles.totalSection, themeStyles.totalSection)}>
                  <span>Total:</span>
                  <span className={commonStyles.totalAmount}>
                    {formatCurrency(newInvoice.items.reduce((sum, item) => sum + item.amount, 0))}
                  </span>
                </div>

                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>Notes</label>
                  <Textarea
                    value={newInvoice.notes || ''}
                    onChange={e => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                    placeholder="Additional notes or payment terms..."
                    rows={3}
                  />
                </div>
              </div>

              <div className={commonStyles.modalFooter}>
                <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  onClick={handleCreateInvoice}
                  disabled={!newInvoice.client_name || !newInvoice.client_email || !newInvoice.due_date}
                >
                  <Receipt size={14} /> Create Invoice
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Detail Modal */}
        {selectedInvoice && (
          <div className={commonStyles.modalOverlay} onClick={() => setSelectedInvoice(null)}>
            <div className={cn(commonStyles.modal, themeStyles.modal, commonStyles.detailModal)} onClick={e => e.stopPropagation()}>
              <div className={commonStyles.modalHeader}>
                <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                  <FileText size={20} /> {selectedInvoice.invoice_number}
                </h2>
                <button
                  className={cn(commonStyles.modalClose, themeStyles.modalClose)}
                  onClick={() => setSelectedInvoice(null)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className={commonStyles.invoiceDetail}>
                <div className={commonStyles.detailHeader}>
                  <div>
                    <h3 className={cn(commonStyles.detailClientName, themeStyles.detailClientName)}>
                      <User size={16} /> {selectedInvoice.client_name}
                    </h3>
                    <p className={cn(commonStyles.detailClientEmail, themeStyles.detailClientEmail)}>
                      <Mail size={14} /> {selectedInvoice.client_email}
                    </p>
                  </div>
                  <span className={cn(
                    commonStyles.status,
                    commonStyles[getStatusStyle(selectedInvoice.status)],
                    themeStyles[getStatusStyle(selectedInvoice.status)]
                  )}>
                    {getStatusIcon(selectedInvoice.status)} {selectedInvoice.status}
                  </span>
                </div>

                <div className={cn(commonStyles.detailMeta, themeStyles.detailMeta)}>
                  <div className={commonStyles.metaItem}>
                    <span className={cn(commonStyles.metaLabel, themeStyles.metaLabel)}>
                      <Briefcase size={12} /> Project
                    </span>
                    <span>{selectedInvoice.project_title}</span>
                  </div>
                  <div className={commonStyles.metaItem}>
                    <span className={cn(commonStyles.metaLabel, themeStyles.metaLabel)}>
                      <Calendar size={12} /> Created
                    </span>
                    <span>{new Date(selectedInvoice.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className={commonStyles.metaItem}>
                    <span className={cn(commonStyles.metaLabel, themeStyles.metaLabel)}>
                      <Clock size={12} /> Due Date
                    </span>
                    <span>{new Date(selectedInvoice.due_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className={cn(commonStyles.detailItems, themeStyles.detailItems)}>
                  <h4><FileText size={14} /> Items</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Rate</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.description}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.rate)}</td>
                          <td>{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3}><strong>Total</strong></td>
                        <td><strong>{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {selectedInvoice.notes && (
                  <div className={cn(commonStyles.detailNotes, themeStyles.detailNotes)}>
                    <h4>Notes</h4>
                    <p>{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>

              <div className={commonStyles.modalFooter}>
                <Button variant="ghost" size="sm">
                  <Download size={14} /> Download PDF
                </Button>
                {selectedInvoice.status === 'draft' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => { handleSendInvoice(selectedInvoice.id); setSelectedInvoice(null); }}
                  >
                    <Send size={14} /> Send Invoice
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteTargetId && (
          <div className={commonStyles.modalOverlay} onClick={() => setDeleteTargetId(null)}>
            <div className={cn(commonStyles.modal, themeStyles.modal, commonStyles.confirmModal)} onClick={e => e.stopPropagation()}>
              <div className={commonStyles.modalHeader}>
                <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                  <AlertCircle size={20} /> Confirm Delete
                </h2>
              </div>
              <div className={commonStyles.modalBody}>
                <p className={cn(commonStyles.confirmText, themeStyles.confirmText)}>
                  Are you sure you want to delete this invoice? This action cannot be undone.
                </p>
              </div>
              <div className={commonStyles.modalFooter}>
                <Button variant="ghost" onClick={() => setDeleteTargetId(null)}>Cancel</Button>
                <Button variant="danger" onClick={confirmDeleteInvoice}>
                  <Trash2 size={14} /> Delete Invoice
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={cn(
            commonStyles.toast,
            themeStyles.toast,
            toast.type === 'error' && commonStyles.toastError,
            toast.type === 'error' && themeStyles.toastError
          )}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
