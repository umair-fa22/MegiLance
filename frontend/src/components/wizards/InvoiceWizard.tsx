// @AI-HINT: Invoice creation wizard with line items, tax calculation, and PDF preview
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import WizardContainer from '@/app/components/organisms/Wizard/WizardContainer/WizardContainer';
import Modal from '@/app/components/organisms/Modal/Modal';
import commonStyles from './InvoiceWizard.common.module.css';
import lightStyles from './InvoiceWizard.light.module.css';
import darkStyles from './InvoiceWizard.dark.module.css';
import {
  User,
  Plus,
  Trash2,
  Receipt,
  Calendar,
  SendHorizontal,
  Info
} from 'lucide-react';
import api from '@/lib/api';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceData {
  // Step 1: Client Selection
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  
  // Step 2: Line Items
  lineItems: LineItem[];
  notes?: string;
  
  // Step 3: Payment Terms
  dueDate: string;
  paymentTerms: string; // 'immediate', 'net15', 'net30', 'net60', 'custom'
  customDays?: number;
  taxRate: number;
  discountType: 'none' | 'percentage' | 'fixed';
  discountValue: number;
  
  // Step 4: Branding
  logoUrl?: string;
  businessName?: string;
  businessAddress?: string;
  invoiceNumber?: string;
  
  // Calculated
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface InvoiceWizardProps {
  userId: string;
  preselectedClient?: Client;
  onComplete?: (invoiceId: string) => void;
}

export default function InvoiceWizard({
  userId,
  preselectedClient,
  onComplete
}: InvoiceWizardProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    clientId: preselectedClient?.id || '',
    clientName: preselectedClient?.name,
    clientEmail: preselectedClient?.email,
    lineItems: [
      { id: '1', description: '', quantity: 1, rate: 0, amount: 0 }
    ],
    dueDate: '',
    paymentTerms: 'net30',
    taxRate: 0,
    discountType: 'none',
    discountValue: 0,
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    total: 0,
    invoiceNumber: `INV-${Date.now()}`
  });

  useEffect(() => {
    const draft = localStorage.getItem('invoice_draft');
    if (draft && !preselectedClient) {
      try {
        const parsedDraft = JSON.parse(draft);
        setInvoiceData(parsedDraft);
      } catch (error) {
        console.error('Failed to parse draft:', error);
      }
    }
  }, [preselectedClient]);

  useEffect(() => {
    if (!preselectedClient) {
      loadClients();
    }
  }, [preselectedClient]);

  // Calculate totals
  useEffect(() => {
    const subtotal = invoiceData.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (invoiceData.taxRate / 100);
    
    let discountAmount = 0;
    if (invoiceData.discountType === 'percentage') {
      discountAmount = subtotal * (invoiceData.discountValue / 100);
    } else if (invoiceData.discountType === 'fixed') {
      discountAmount = invoiceData.discountValue;
    }
    
    const total = subtotal + taxAmount - discountAmount;
    
    setInvoiceData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      discountAmount,
      total
    }));
  }, [invoiceData.lineItems, invoiceData.taxRate, invoiceData.discountType, invoiceData.discountValue]);

  const saveDraft = () => {
    localStorage.setItem('invoice_draft', JSON.stringify(invoiceData));
  };

  const loadClients = async () => {
    try {
      const data = await api.users.getClients() as any;
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  // Line item operations
  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    };
    setInvoiceData({
      ...invoiceData,
      lineItems: [...invoiceData.lineItems, newItem]
    });
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setInvoiceData({
      ...invoiceData,
      lineItems: invoiceData.lineItems.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updated.amount = updated.quantity * updated.rate;
          }
          return updated;
        }
        return item;
      })
    });
  };

  const removeLineItem = (id: string) => {
    if (invoiceData.lineItems.length > 1) {
      setInvoiceData({
        ...invoiceData,
        lineItems: invoiceData.lineItems.filter(item => item.id !== id)
      });
    }
  };

  // STEP 1: Client Selection
  const Step1Client = () => {
    const filteredClients = clients.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className={commonStyles.stepContent}>
        {preselectedClient ? (
          <div className={cn(commonStyles.selectedClient, themeStyles.selectedClient)}>
            <User className={commonStyles.icon} />
            <div>
              <h3>{preselectedClient.name}</h3>
              <p>{preselectedClient.email}</p>
              {preselectedClient.company && <p>{preselectedClient.company}</p>}
            </div>
          </div>
        ) : (
          <>
            <div className={commonStyles.searchBox}>
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(commonStyles.searchInput, themeStyles.searchInput)}
                aria-label="Search clients"
              />
            </div>

            <div className={commonStyles.clientList}>
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className={cn(
                    commonStyles.clientCard,
                    themeStyles.clientCard,
                    invoiceData.clientId === client.id && commonStyles.clientCardSelected,
                    invoiceData.clientId === client.id && themeStyles.clientCardSelected
                  )}
                  onClick={() => setInvoiceData({
                    ...invoiceData,
                    clientId: client.id,
                    clientName: client.name,
                    clientEmail: client.email
                  })}
                >
                  <User />
                  <div>
                    <h4>{client.name}</h4>
                    <p>{client.email}</p>
                    {client.company && <small>{client.company}</small>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // STEP 2: Line Items
  const Step2LineItems = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.lineItemsHeader}>
        <h4>Invoice Items</h4>
        <button
          type="button"
          onClick={addLineItem}
          className={cn(commonStyles.addButton, themeStyles.addButton)}
        >
          <Plus /> Add Item
        </button>
      </div>

      <div className={commonStyles.lineItemsTable}>
        <div className={commonStyles.tableHeader}>
          <div>Description</div>
          <div>Qty</div>
          <div>Rate</div>
          <div>Amount</div>
          <div></div>
        </div>

        {invoiceData.lineItems.map((item) => (
          <div key={item.id} className={cn(commonStyles.lineItemRow, themeStyles.lineItemRow)}>
            <input
              type="text"
              value={item.description}
              onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
              placeholder="Item description"
              className={commonStyles.descInput}
              aria-label="Line item description"
            />
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
              className={commonStyles.qtyInput}
              aria-label="Item quantity"
            />
            <div className={commonStyles.rateInput}>
              <span>$</span>
              <input
                type="number"
                value={item.rate}
                onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                aria-label="Item rate"
              />
            </div>
            <div className={commonStyles.amountDisplay}>
              ${item.amount.toFixed(2)}
            </div>
            {invoiceData.lineItems.length > 1 && (
              <button
                type="button"
                onClick={() => removeLineItem(item.id)}
                className={commonStyles.removeButton}
                aria-label="Remove invoice line item"
              >
                <Trash2 />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className={commonStyles.formGroup}>
        <label htmlFor="notes">Additional Notes (Optional)</label>
        <textarea
          id="notes"
          value={invoiceData.notes || ''}
          onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
          placeholder="Add any additional notes or terms..."
          rows={4}
        />
      </div>

      <div className={cn(commonStyles.subtotalBox, themeStyles.subtotalBox)}>
        <div className={commonStyles.subtotalRow}>
          <span>Subtotal:</span>
          <strong>${invoiceData.subtotal.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );

  // STEP 3: Payment Terms
  const Step3Terms = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.formRow}>
        <div className={commonStyles.formGroup}>
          <label htmlFor="paymentTerms">Payment Terms</label>
          <select
            id="paymentTerms"
            value={invoiceData.paymentTerms}
            onChange={(e) => setInvoiceData({ ...invoiceData, paymentTerms: e.target.value })}
          >
            <option value="immediate">Due on Receipt</option>
            <option value="net15">Net 15 Days</option>
            <option value="net30">Net 30 Days</option>
            <option value="net60">Net 60 Days</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {invoiceData.paymentTerms === 'custom' && (
          <div className={commonStyles.formGroup}>
            <label htmlFor="customDays">Days</label>
            <input
              type="number"
              id="customDays"
              value={invoiceData.customDays || ''}
              onChange={(e) => setInvoiceData({ ...invoiceData, customDays: parseInt(e.target.value) || 0 })}
              min="1"
            />
          </div>
        )}

        <div className={commonStyles.formGroup}>
          <label htmlFor="dueDate">Due Date</label>
          <div className={commonStyles.dateInput}>
            <Calendar />
            <input
              type="date"
              id="dueDate"
              value={invoiceData.dueDate}
              onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </div>

      <div className={commonStyles.formRow}>
        <div className={commonStyles.formGroup}>
          <label htmlFor="taxRate">Tax Rate (%)</label>
          <input
            type="number"
            id="taxRate"
            value={invoiceData.taxRate}
            onChange={(e) => setInvoiceData({ ...invoiceData, taxRate: parseFloat(e.target.value) || 0 })}
            min="0"
            max="100"
            step="0.1"
          />
        </div>

        <div className={commonStyles.formGroup}>
          <label htmlFor="discountType">Discount</label>
          <select
            id="discountType"
            value={invoiceData.discountType}
            onChange={(e) => setInvoiceData({ ...invoiceData, discountType: e.target.value as any })}
          >
            <option value="none">No Discount</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>

        {invoiceData.discountType !== 'none' && (
          <div className={commonStyles.formGroup}>
            <label htmlFor="discountValue">
              {invoiceData.discountType === 'percentage' ? 'Discount %' : 'Discount $'}
            </label>
            <input
              type="number"
              id="discountValue"
              value={invoiceData.discountValue}
              onChange={(e) => setInvoiceData({ ...invoiceData, discountValue: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
            />
          </div>
        )}
      </div>

      <div className={cn(commonStyles.totalsBox, themeStyles.totalsBox)}>
        <h4>Invoice Total</h4>
        <div className={commonStyles.totalRow}>
          <span>Subtotal:</span>
          <span>${invoiceData.subtotal.toFixed(2)}</span>
        </div>
        {invoiceData.taxRate > 0 && (
          <div className={commonStyles.totalRow}>
            <span>Tax ({invoiceData.taxRate}%):</span>
            <span>${invoiceData.taxAmount.toFixed(2)}</span>
          </div>
        )}
        {invoiceData.discountAmount > 0 && (
          <div className={commonStyles.totalRow}>
            <span>Discount:</span>
            <span className={commonStyles.discount}>-${invoiceData.discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className={cn(commonStyles.totalRow, commonStyles.grandTotal)}>
          <strong>Total:</strong>
          <strong>${invoiceData.total.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );

  // STEP 4: Branding & Send
  const Step4Branding = () => (
    <div className={commonStyles.stepContent}>
      <div className={cn(commonStyles.infoBox, themeStyles.infoBox)}>
        <Info />
        <p>Customize your invoice with your business branding. This information will appear on the PDF invoice.</p>
      </div>

      <div className={commonStyles.formGroup}>
        <label htmlFor="businessName">Business Name</label>
        <input
          type="text"
          id="businessName"
          value={invoiceData.businessName || ''}
          onChange={(e) => setInvoiceData({ ...invoiceData, businessName: e.target.value })}
          placeholder="Your Business Name"
        />
      </div>

      <div className={commonStyles.formGroup}>
        <label htmlFor="businessAddress">Business Address</label>
        <textarea
          id="businessAddress"
          value={invoiceData.businessAddress || ''}
          onChange={(e) => setInvoiceData({ ...invoiceData, businessAddress: e.target.value })}
          placeholder="123 Main St&#10;City, State ZIP"
          rows={3}
        />
      </div>

      <div className={commonStyles.formGroup}>
        <label htmlFor="invoiceNumber">Invoice Number</label>
        <input
          type="text"
          id="invoiceNumber"
          value={invoiceData.invoiceNumber || ''}
          onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
          placeholder="INV-001"
        />
      </div>

      <div className={cn(commonStyles.previewBox, themeStyles.previewBox)}>
        <div className={commonStyles.previewHeader}>
          <Receipt className={commonStyles.previewIcon} />
          <h3>Invoice Preview</h3>
        </div>

        <div className={commonStyles.previewInvoice}>
          <div className={commonStyles.previewTop}>
            <div>
              <h4>{invoiceData.businessName || 'Your Business'}</h4>
              <p className={commonStyles.previewAddress}>
                {invoiceData.businessAddress || 'Business Address'}
              </p>
            </div>
            <div className={commonStyles.previewInvoiceNo}>
              <div>Invoice #</div>
              <div>{invoiceData.invoiceNumber}</div>
            </div>
          </div>

          <div className={commonStyles.previewBillTo}>
            <strong>Bill To:</strong>
            <div>{invoiceData.clientName}</div>
            <div>{invoiceData.clientEmail}</div>
          </div>

          <div className={commonStyles.previewItems}>
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
                {invoiceData.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.description || 'Item'}</td>
                    <td>{item.quantity}</td>
                    <td>${item.rate.toFixed(2)}</td>
                    <td>${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={commonStyles.previewTotals}>
            <div><span>Subtotal:</span><span>${invoiceData.subtotal.toFixed(2)}</span></div>
            {invoiceData.taxAmount > 0 && (
              <div><span>Tax:</span><span>${invoiceData.taxAmount.toFixed(2)}</span></div>
            )}
            {invoiceData.discountAmount > 0 && (
              <div><span>Discount:</span><span>-${invoiceData.discountAmount.toFixed(2)}</span></div>
            )}
            <div className={commonStyles.previewTotal}>
              <strong>Total:</strong><strong>${invoiceData.total.toFixed(2)}</strong>
            </div>
          </div>

          <div className={commonStyles.previewDue}>
            Due Date: {invoiceData.dueDate || 'Not set'}
          </div>
        </div>
      </div>
    </div>
  );

  // Validation
  const validateStep1 = async () => {
    if (!invoiceData.clientId) {
      showToast('Please select a client');
      return false;
    }
    return true;
  };

  const validateStep2 = async () => {
    const validItems = invoiceData.lineItems.filter(item => item.description && item.amount > 0);
    if (validItems.length === 0) {
      showToast('Please add at least one line item with description and amount');
      return false;
    }
    return true;
  };

  const validateStep3 = async () => {
    if (!invoiceData.dueDate) {
      showToast('Please select a due date');
      return false;
    }
    return true;
  };

  // Handle completion
  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      const payload = {
        user_id: userId,
        client_id: invoiceData.clientId,
        invoice_number: invoiceData.invoiceNumber,
        business_name: invoiceData.businessName,
        business_address: invoiceData.businessAddress,
        line_items: invoiceData.lineItems.filter(item => item.description),
        notes: invoiceData.notes,
        subtotal: invoiceData.subtotal,
        tax_rate: invoiceData.taxRate,
        tax_amount: invoiceData.taxAmount,
        discount_type: invoiceData.discountType,
        discount_value: invoiceData.discountValue,
        discount_amount: invoiceData.discountAmount,
        total: invoiceData.total,
        payment_terms: invoiceData.paymentTerms,
        due_date: invoiceData.dueDate
      };

      const result = await api.invoices.create(payload) as any;

      localStorage.removeItem('invoice_draft');
      
      if (onComplete) {
        onComplete(result.id);
      } else {
        router.push(`/invoices/${result.id}`);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      showToast('Failed to create invoice. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const steps = [
    {
      id: 'client',
      title: 'Select Client',
      description: 'Who to invoice',
      component: <Step1Client />,
      validate: validateStep1
    },
    {
      id: 'items',
      title: 'Line Items',
      description: 'Add invoice items',
      component: <Step2LineItems />,
      validate: validateStep2
    },
    {
      id: 'terms',
      title: 'Payment Terms',
      description: 'Set terms & calculate',
      component: <Step3Terms />,
      validate: validateStep3
    },
    {
      id: 'branding',
      title: 'Branding & Send',
      description: 'Customize & preview',
      component: <Step4Branding />
    }
  ];

  return (
    <>
      <WizardContainer
        title="Create Invoice"
        subtitle={invoiceData.clientName ? `For: ${invoiceData.clientName}` : 'New invoice'}
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onComplete={handleComplete}
        onCancel={handleCancel}
        isLoading={isSubmitting}
        saveProgress={saveDraft}
        completeBtnText="Create & Send Invoice"
        completeBtnIcon={<SendHorizontal />}
      />
      <Modal
        isOpen={showCancelModal}
        title="Cancel Invoice Creation"
        onClose={() => setShowCancelModal(false)}
        footer={
          <>
            <button onClick={() => setShowCancelModal(false)}>Continue Editing</button>
            <button onClick={() => { saveDraft(); setShowCancelModal(false); router.back(); }}>Yes, Cancel</button>
          </>
        }
      >
        <p>Are you sure you want to cancel? Your progress will be saved as a draft.</p>
      </Modal>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, padding: '12px 24px',
          borderRadius: 8, color: '#fff', zIndex: 9999, fontSize: 14,
          backgroundColor: toast.type === 'success' ? '#27AE60' : '#e81123',
        }}>
          {toast.message}
        </div>
      )}
    </>
  );
}
