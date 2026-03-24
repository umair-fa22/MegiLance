// @AI-HINT: Invoice Management component for freelancers - create, send, and track invoices with line items
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { invoicesApi } from '@/lib/api';
import type { Invoice, InvoiceFormData, InvoiceItem, Contract } from '@/types/api';
import { FileText, Plus, Send, Download, X, Check, Eye } from 'lucide-react'
import Modal from '@/app/components/Modal/Modal';
import Button from '@/app/components/Button/Button';
import commonStyles from './Invoices.common.module.css';
import lightStyles from './Invoices.light.module.css';
import darkStyles from './Invoices.dark.module.css';
import { contractsApi } from '@/lib/api';

const Invoices: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  // State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<number | null>(null);

  // Form state
  const [contractId, setContractId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 }
  ]);

  useEffect(() => {
    loadInvoices();
    loadContracts();
  }, [statusFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: { status?: string } = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      const response = await invoicesApi.list(filters) as { invoices: Invoice[] };
      setInvoices(response.invoices);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async () => {
    try {
      const response = await contractsApi.list({ status: 'active' }) as { contracts: Contract[] };
      setContracts(response.contracts);
    } catch (err: any) {
      console.error('Failed to load contracts:', err);
    }
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleLineItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Calculate amount
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].amount = updated[index].quantity * updated[index].unit_price;
    }
    
    setLineItems(updated);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractId) {
      setError('Please select a contract');
      return;
    }

    // Find the selected contract to get the client ID
    const selectedContract = contracts.find(c => c.id === contractId);
    if (!selectedContract) {
      setError('Invalid contract selected');
      return;
    }

    try {
      setError(null);
      const formData: InvoiceFormData = {
        contract_id: contractId,
        to_user_id: selectedContract.client_id,
        due_date: dueDate,
        items: lineItems,
        line_items: lineItems,
        notes: notes || undefined,
      };
      await invoicesApi.create(formData as unknown as Record<string, unknown>);
      setShowCreateForm(false);
      resetForm();
      loadInvoices();
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice');
    }
  };

  const handleSend = async (invoiceId: number) => {
    try {
      setError(null);
            await invoicesApi.update(invoiceId, { status: 'sent' });
      loadInvoices();
    } catch (err: any) {
      setError(err.message || 'Failed to send invoice');
    }
  };

  const handleMarkAsPaid = async (invoiceId: number) => {
    try {
      setError(null);
      await invoicesApi.markAsPaid(invoiceId);
      loadInvoices();
    } catch (err: any) {
      setError(err.message || 'Failed to mark invoice as paid');
    }
  };

  const handleDelete = async (invoiceId: number) => {
    try {
      setError(null);
      await invoicesApi.delete(invoiceId);
      loadInvoices();
    } catch (err: any) {
      setError(err.message || 'Failed to delete invoice');
    }
  };

  const resetForm = () => {
    setContractId(null);
    setDueDate('');
    setNotes('');
    setLineItems([{ description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    return `${commonStyles.badge} ${themeStyles.badge}`;
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Invoices</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Create and manage your invoices
          </p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className={cn(commonStyles.createBtn, themeStyles.createBtn)}
          >
            <Plus size={20} />
            Create Invoice
          </button>
        )}
      </div>

      {error && (
        <div className={cn(commonStyles.error, themeStyles.error)}>
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className={cn(commonStyles.formCard, themeStyles.formCard)}>
          <div className={commonStyles.formHeader}>
            <h2 className={cn(commonStyles.formTitle, themeStyles.formTitle)}>
              Create New Invoice
            </h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
              className={cn(commonStyles.closeBtn, themeStyles.closeBtn)}
              aria-label="Close create invoice form"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCreate}>
            <div className={commonStyles.formGroup}>
              <label className={cn(commonStyles.label, themeStyles.label)}>
                Contract *
              </label>
              <select
                value={contractId || ''}
                onChange={(e) => setContractId(Number(e.target.value))}
                className={cn(commonStyles.select, themeStyles.select)}
                required
                aria-label="Select Contract"
              >
                <option value="">Select a contract</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.title} - {contract.client?.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className={commonStyles.formGroup}>
              <label className={cn(commonStyles.label, themeStyles.label)}>
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={cn(commonStyles.input, themeStyles.input)}
                required
                aria-label="Invoice due date"
              />
            </div>

            <div className={commonStyles.formGroup}>
              <div className={commonStyles.lineItemsHeader}>
                <label className={cn(commonStyles.label, themeStyles.label)}>
                  Line Items
                </label>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className={cn(commonStyles.addItemBtn, themeStyles.addItemBtn)}
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              {lineItems.map((item, index) => (
                <div key={index} className={commonStyles.lineItem}>
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                    className={cn(commonStyles.lineItemDesc, themeStyles.input)}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleLineItemChange(index, 'quantity', Number(e.target.value))}
                    className={cn(commonStyles.lineItemQty, themeStyles.input)}
                    min="1"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.unit_price}
                    onChange={(e) => handleLineItemChange(index, 'unit_price', Number(e.target.value))}
                    className={cn(commonStyles.lineItemPrice, themeStyles.input)}
                    step="0.01"
                    min="0"
                    required
                  />
                  <div className={cn(commonStyles.lineItemAmount, themeStyles.lineItemAmount)}>
                    {formatCurrency(item.amount)}
                  </div>
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(index)}
                      className={cn(commonStyles.removeItemBtn, themeStyles.removeItemBtn)}
                      aria-label="Remove line item"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}

              <div className={commonStyles.totalRow}>
                <span className={cn(commonStyles.totalLabel, themeStyles.totalLabel)}>
                  Total Amount:
                </span>
                <span className={cn(commonStyles.totalAmount, themeStyles.totalAmount)}>
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>

            <div className={commonStyles.formGroup}>
              <label className={cn(commonStyles.label, themeStyles.label)}>
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={cn(commonStyles.textarea, themeStyles.textarea)}
                rows={3}
                placeholder="Add any additional notes..."
              />
            </div>

            <div className={commonStyles.formActions}>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                className={cn(commonStyles.cancelBtn, themeStyles.cancelBtn)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={cn(commonStyles.submitBtn, themeStyles.submitBtn)}
              >
                Create Invoice
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={commonStyles.filtersSection}>
        <label className={cn(commonStyles.filterLabel, themeStyles.label)}>
          Filter by Status:
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={cn(commonStyles.filterSelect, themeStyles.filterSelect)}
        >
          <option value="all">All Invoices</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {loading ? (
        <div className={cn(commonStyles.loading, themeStyles.loading)}>
          Loading invoices...
        </div>
      ) : invoices.length === 0 ? (
        <div className={cn(commonStyles.empty, themeStyles.empty)}>
          <FileText size={48} />
          <p>No invoices found</p>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className={cn(commonStyles.emptyBtn, themeStyles.emptyBtn)}
            >
              Create Your First Invoice
            </button>
          )}
        </div>
      ) : (
        <div className={cn(commonStyles.table, themeStyles.table)}>
          <table className={commonStyles.tableElement}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Contract</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <span className={cn(commonStyles.invoiceNumber, themeStyles.invoiceNumber)}>
                      #{invoice.invoice_number}
                    </span>
                  </td>
                  <td>{invoice.contract?.title || 'N/A'}</td>
                  <td>{invoice.contract?.client?.full_name || 'N/A'}</td>
                  <td className={cn(commonStyles.amount, themeStyles.amount)}>
                    {formatCurrency(invoice.total_amount)}
                  </td>
                  <td>{formatDate(invoice.due_date)}</td>
                  <td>
                    <span
                      className={getStatusBadgeClass(invoice.status)}
                      data-status={invoice.status}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    <div className={commonStyles.actions}>
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => handleSend(invoice.id)}
                          className={cn(commonStyles.iconBtn, themeStyles.iconBtn)}
                          data-action="send"
                          title="Send Invoice"
                        >
                          <Send size={18} />
                        </button>
                      )}
                      {(invoice.status === 'sent' || invoice.status === 'pending') && (
                        <button
                          onClick={() => handleMarkAsPaid(invoice.id)}
                          className={cn(commonStyles.iconBtn, themeStyles.iconBtn)}
                          data-action="paid"
                          title="Mark as Paid"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className={cn(commonStyles.iconBtn, themeStyles.iconBtn)}
                        data-action="view"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className={cn(commonStyles.iconBtn, themeStyles.iconBtn)}
                        data-action="download"
                        title="Download PDF"
                      >
                        <Download size={18} />
                      </button>
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => { setDeleteInvoiceId(invoice.id); setShowDeleteModal(true); }}
                          className={cn(commonStyles.iconBtn, commonStyles.deleteBtn, themeStyles.iconBtn)}
                          data-action="delete"
                          title="Delete"
                        >
                          <X size={18} />
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

      {selectedInvoice && (
        <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={() => setSelectedInvoice(null)}>
          <div className={cn(commonStyles.modalContent, themeStyles.modalContent)} onClick={(e) => e.stopPropagation()}>
            <div className={commonStyles.modalHeader}>
              <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                Invoice #{selectedInvoice.invoice_number}
              </h2>
              <button
                onClick={() => setSelectedInvoice(null)}
                className={cn(commonStyles.closeBtn, themeStyles.closeBtn)}
              >
                <X size={24} />
              </button>
            </div>
            <div className={commonStyles.modalBody}>
              <div className={commonStyles.detailRow}>
                <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Contract:</span>
                <span>{selectedInvoice.contract?.title}</span>
              </div>
              <div className={commonStyles.detailRow}>
                <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Client:</span>
                <span>{selectedInvoice.contract?.client?.full_name}</span>
              </div>
              <div className={commonStyles.detailRow}>
                <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Due Date:</span>
                <span>{formatDate(selectedInvoice.due_date)}</span>
              </div>
              <div className={commonStyles.detailRow}>
                <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Status:</span>
                <span
                  className={getStatusBadgeClass(selectedInvoice.status)}
                  data-status={selectedInvoice.status}
                >
                  {selectedInvoice.status}
                </span>
              </div>

              <div className={commonStyles.lineItemsSection}>
                <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Line Items</h3>
                {(selectedInvoice.line_items || []).map((item, index) => (
                  <div key={index} className={cn(commonStyles.detailLineItem, themeStyles.detailLineItem)}>
                    <div className={commonStyles.lineItemInfo}>
                      <div className={commonStyles.lineItemDescription}>{item.description}</div>
                      <div className={cn(commonStyles.lineItemMeta, themeStyles.lineItemMeta)}>
                        {item.quantity} × {formatCurrency(item.unit_price)}
                      </div>
                    </div>
                    <div className={cn(commonStyles.lineItemTotal, themeStyles.lineItemTotal)}>
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                ))}
              </div>

              <div className={cn(commonStyles.invoiceTotal, themeStyles.invoiceTotal)}>
                <span>Total Amount:</span>
                <span className={cn(commonStyles.totalAmount, themeStyles.totalAmount)}>
                  {formatCurrency(selectedInvoice.total_amount)}
                </span>
              </div>

              {selectedInvoice.notes && (
                <div className={commonStyles.notesSection}>
                  <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Notes</h3>
                  <p className={cn(commonStyles.notes, themeStyles.notes)}>{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteInvoiceId(null); }}
        title="Delete Invoice"
        size="small"
      >
        <p>Are you sure you want to delete this invoice?</p>
        <div className={commonStyles.modalActions}>
          <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteInvoiceId(null); }}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (deleteInvoiceId !== null) handleDelete(deleteInvoiceId); setShowDeleteModal(false); setDeleteInvoiceId(null); }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Invoices;
