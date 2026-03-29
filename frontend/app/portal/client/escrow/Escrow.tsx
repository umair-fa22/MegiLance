// @AI-HINT: Escrow Management component for clients - fund, release, and manage escrow for contracts
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { escrowApi, contractsApi } from '@/lib/api';
import type { Escrow, EscrowBalance, Contract, EscrowFundData } from '@/types/api';
import { Shield, Clock, CheckCircle, XCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import Modal from '@/app/components/organisms/Modal/Modal';
import Button from '@/app/components/atoms/Button/Button';
import commonStyles from './Escrow.common.module.css';
import lightStyles from './Escrow.light.module.css';
import darkStyles from './Escrow.dark.module.css';

const EscrowManagement: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  // State
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [balance, setBalance] = useState<EscrowBalance | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFundForm, setShowFundForm] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<Escrow | null>(null);

  // Form state
  const [contractId, setContractId] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [releaseAmount, setReleaseAmount] = useState<number>(0);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundEscrowId, setRefundEscrowId] = useState<number | null>(null);

  useEffect(() => {
    loadEscrows();
    loadBalance();
    loadContracts();
  }, []);

  const loadEscrows = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await escrowApi.list() as { escrows: Escrow[] };
      setEscrows(response.escrows);
    } catch (err: any) {
      setError(err.message || 'Failed to load escrow transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const response = await escrowApi.getBalance() as EscrowBalance;
      setBalance(response);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load balance:', err);
      }
    }
  };

  const loadContracts = async () => {
    try {
      const response = await contractsApi.list({ status: 'active' }) as { contracts: Contract[] };
      setContracts(response.contracts);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load contracts:', err);
      }
    }
  };

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractId || amount <= 0) {
      setError('Please select a contract and enter a valid amount');
      return;
    }

    try {
      setError(null);
      const fundData: EscrowFundData = {
        contract_id: contractId,
        amount,
        description: description || undefined
      };
      await escrowApi.fund(fundData);
      setShowFundForm(false);
      resetFundForm();
      loadEscrows();
      loadBalance();
    } catch (err: any) {
      setError(err.message || 'Failed to fund escrow');
    }
  };

  const handleRelease = async (escrowId: number) => {
    if (releaseAmount <= 0) {
      setError('Please enter a valid release amount');
      return;
    }

    try {
      setError(null);
      await escrowApi.release(escrowId, {
        amount: releaseAmount,
        notes: releaseNotes || undefined
      });
      setSelectedEscrow(null);
      setReleaseAmount(0);
      setReleaseNotes('');
      loadEscrows();
      loadBalance();
    } catch (err: any) {
      setError(err.message || 'Failed to release funds');
    }
  };

  const handleRefund = async (escrowId: number) => {
    try {
      setError(null);
      await escrowApi.refund(escrowId, {
        reason: 'Client requested refund'
      });
      loadEscrows();
      loadBalance();
    } catch (err: any) {
      setError(err.message || 'Failed to request refund');
    }
  };

  const resetFundForm = () => {
    setContractId(null);
    setAmount(0);
    setDescription('');
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'held':
        return <Clock size={20} />;
      case 'released':
        return <CheckCircle size={20} />;
      case 'refunded':
        return <XCircle size={20} />;
      default:
        return <Shield size={20} />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    return `${commonStyles.badge} ${themeStyles.badge}`;
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Escrow Management</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Secure payment protection for your contracts
          </p>
        </div>
        {!showFundForm && (
          <button
            onClick={() => setShowFundForm(true)}
            className={cn(commonStyles.fundBtn, themeStyles.fundBtn)}
          >
            <ArrowUpCircle size={20} />
            Fund Escrow
          </button>
        )}
      </div>

      {error && (
        <div className={cn(commonStyles.error, themeStyles.error)}>
          {error}
        </div>
      )}

      {/* Balance Summary */}
      {balance && (
        <div className={commonStyles.balanceCard}>
          <div className={cn(commonStyles.balanceHeader, themeStyles.balanceHeader)}>
            <Shield size={32} className={cn(commonStyles.balanceIcon, themeStyles.balanceIcon)} />
            <div>
              <div className={cn(commonStyles.balanceLabel, themeStyles.balanceLabel)}>
                Total Escrow Balance
              </div>
              <div className={cn(commonStyles.balanceAmount, themeStyles.balanceAmount)}>
                {formatCurrency(balance.total_balance)}
              </div>
            </div>
          </div>
          <div className={commonStyles.balanceDetails}>
            <div className={cn(commonStyles.balanceItem, themeStyles.balanceItem)}>
              <span className={cn(commonStyles.balanceItemLabel, themeStyles.balanceItemLabel)}>
                Held
              </span>
              <span className={cn(commonStyles.balanceItemValue, themeStyles.balanceItemValue)}>
                {formatCurrency(balance.held_amount)}
              </span>
            </div>
            <div className={cn(commonStyles.balanceItem, themeStyles.balanceItem)}>
              <span className={cn(commonStyles.balanceItemLabel, themeStyles.balanceItemLabel)}>
                Released
              </span>
              <span className={cn(commonStyles.balanceItemValue, themeStyles.balanceItemValue)}>
                {formatCurrency(balance.released_amount)}
              </span>
            </div>
            <div className={cn(commonStyles.balanceItem, themeStyles.balanceItem)}>
              <span className={cn(commonStyles.balanceItemLabel, themeStyles.balanceItemLabel)}>
                Refunded
              </span>
              <span className={cn(commonStyles.balanceItemValue, themeStyles.balanceItemValue)}>
                {formatCurrency(balance.refunded_amount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Fund Form */}
      {showFundForm && (
        <div className={cn(commonStyles.formCard, themeStyles.formCard)}>
          <h2 className={cn(commonStyles.formTitle, themeStyles.formTitle)}>
            Fund Escrow Account
          </h2>
          <form onSubmit={handleFund}>
            <div className={commonStyles.formGroup}>
              <label className={cn(commonStyles.label, themeStyles.label)}>
                Contract *
              </label>
              <select
                value={contractId || ''}
                onChange={(e) => setContractId(Number(e.target.value))}
                className={cn(commonStyles.select, themeStyles.select)}
                required
                aria-label="Select Contract for funding"
              >
                <option value="">Select a contract</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.title} - {contract.freelancer?.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className={commonStyles.formGroup}>
              <label className={cn(commonStyles.label, themeStyles.label)}>
                Amount *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={cn(commonStyles.input, themeStyles.input)}
                step="0.01"
                min="0"
                required
                placeholder="0.00"
              />
            </div>

            <div className={commonStyles.formGroup}>
              <label className={cn(commonStyles.label, themeStyles.label)}>
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={cn(commonStyles.textarea, themeStyles.textarea)}
                rows={3}
                placeholder="Add notes about this escrow payment..."
              />
            </div>

            <div className={commonStyles.formActions}>
              <button
                type="button"
                onClick={() => {
                  setShowFundForm(false);
                  resetFundForm();
                }}
                className={cn(commonStyles.cancelBtn, themeStyles.cancelBtn)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={cn(commonStyles.submitBtn, themeStyles.submitBtn)}
              >
                Fund Escrow
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Escrow Transactions */}
      <div className={commonStyles.transactionsSection}>
        <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
          Escrow Transactions
        </h2>

        {loading ? (
          <div className={cn(commonStyles.loading, themeStyles.loading)}>
            Loading transactions...
          </div>
        ) : escrows.length === 0 ? (
          <div className={cn(commonStyles.empty, themeStyles.empty)}>
            <Shield size={48} />
            <p>No escrow transactions yet</p>
            {!showFundForm && (
              <button
                onClick={() => setShowFundForm(true)}
                className={cn(commonStyles.emptyBtn, themeStyles.emptyBtn)}
              >
                Fund Your First Escrow
              </button>
            )}
          </div>
        ) : (
          <div className={commonStyles.transactionsList}>
            {escrows.map((escrow) => (
              <div
                key={escrow.id}
                className={cn(commonStyles.transactionCard, themeStyles.transactionCard)}
              >
                <div className={commonStyles.transactionHeader}>
                  <div className={commonStyles.transactionInfo}>
                    {getStatusIcon(escrow.status)}
                    <div>
                      <div className={cn(commonStyles.transactionTitle, themeStyles.transactionTitle)}>
                        {escrow.contract?.title}
                      </div>
                      <div className={cn(commonStyles.transactionMeta, themeStyles.transactionMeta)}>
                        {escrow.contract?.freelancer?.full_name} • {formatDate(escrow.created_at)}
                      </div>
                    </div>
                  </div>
                  <span
                    className={getStatusBadgeClass(escrow.status)}
                    data-status={escrow.status}
                  >
                    {escrow.status}
                  </span>
                </div>

                <div className={commonStyles.transactionBody}>
                  <div className={commonStyles.amountRow}>
                    <span className={cn(commonStyles.amountLabel, themeStyles.amountLabel)}>
                      Amount:
                    </span>
                    <span className={cn(commonStyles.amountValue, themeStyles.amountValue)}>
                      {formatCurrency(escrow.amount)}
                    </span>
                  </div>

                  {escrow.description && (
                    <div className={cn(commonStyles.description, themeStyles.description)}>
                      {escrow.description}
                    </div>
                  )}
                </div>

                {escrow.status === 'held' && (
                  <div className={commonStyles.transactionActions}>
                    <button
                      onClick={() => setSelectedEscrow(escrow)}
                      className={cn(commonStyles.releaseBtn, themeStyles.releaseBtn)}
                    >
                      <ArrowDownCircle size={18} />
                      Release Funds
                    </button>
                    <button
                      onClick={() => { setRefundEscrowId(escrow.id); setShowRefundModal(true); }}
                      className={cn(commonStyles.refundBtn, themeStyles.refundBtn)}
                    >
                      Request Refund
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Release Modal */}
      {selectedEscrow && (
        <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={() => setSelectedEscrow(null)}>
          <div className={cn(commonStyles.modalContent, themeStyles.modalContent)} onClick={(e) => e.stopPropagation()}>
            <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
              Release Escrow Funds
            </h2>
            <p className={cn(commonStyles.modalSubtitle, themeStyles.modalSubtitle)}>
              Release funds to {selectedEscrow.contract?.freelancer?.full_name}
            </p>

            <div className={commonStyles.modalBody}>
              <div className={cn(commonStyles.availableAmount, themeStyles.availableAmount)}>
                <span>Available Amount:</span>
                <span className={cn(commonStyles.amountValue, themeStyles.amountValue)}>
                  {formatCurrency(selectedEscrow.amount)}
                </span>
              </div>

              <div className={commonStyles.formGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>
                  Release Amount *
                </label>
                <input
                  type="number"
                  value={releaseAmount}
                  onChange={(e) => setReleaseAmount(Number(e.target.value))}
                  className={cn(commonStyles.input, themeStyles.input)}
                  step="0.01"
                  min="0"
                  max={selectedEscrow.amount}
                  placeholder="0.00"
                />
              </div>

              <div className={commonStyles.formGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>
                  Release Notes (Optional)
                </label>
                <textarea
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  className={cn(commonStyles.textarea, themeStyles.textarea)}
                  rows={3}
                  placeholder="Add notes about this release..."
                />
              </div>

              <div className={commonStyles.formActions}>
                <button
                  onClick={() => {
                    setSelectedEscrow(null);
                    setReleaseAmount(0);
                    setReleaseNotes('');
                  }}
                  className={cn(commonStyles.cancelBtn, themeStyles.cancelBtn)}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRelease(selectedEscrow.id)}
                  className={cn(commonStyles.submitBtn, themeStyles.submitBtn)}
                >
                  Release Funds
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showRefundModal}
        onClose={() => { setShowRefundModal(false); setRefundEscrowId(null); }}
        title="Request Refund"
        size="small"
      >
        <p>Are you sure you want to request a refund?</p>
        <div className={commonStyles.modalActions}>
          <Button variant="ghost" onClick={() => { setShowRefundModal(false); setRefundEscrowId(null); }}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (refundEscrowId !== null) handleRefund(refundEscrowId); setShowRefundModal(false); setRefundEscrowId(null); }}>Request Refund</Button>
        </div>
      </Modal>
    </div>
  );
};

export default EscrowManagement;
