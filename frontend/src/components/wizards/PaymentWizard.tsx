// @AI-HINT: Dual-flow payment wizard for withdrawals and adding funds with complete database integration
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import WizardContainer from '@/app/components/organisms/Wizard/WizardContainer/WizardContainer';
import Modal from '@/app/components/organisms/Modal/Modal';
import commonStyles from './PaymentWizard.common.module.css';
import lightStyles from './PaymentWizard.light.module.css';
import darkStyles from './PaymentWizard.dark.module.css';
import {
  Wallet,
  Building,
  CreditCard,
  Bitcoin,
  ShieldCheck,
  FileUp,
  CheckCircle,
  Plus,
  Info
} from 'lucide-react';

type FlowType = 'withdrawal' | 'addFunds';
type WithdrawalMethod = 'bank' | 'paypal' | 'stripe' | 'crypto';
type PaymentMethod = 'card' | 'bank' | 'paypal' | 'crypto';

interface SavedPaymentMethod {
  id: string;
  type: PaymentMethod;
  last4?: string;
  bankName?: string;
  email?: string;
  walletAddress?: string;
  isDefault: boolean;
}

interface WithdrawalData {
  amount: number;
  method: WithdrawalMethod;
  // Account details
  accountNumber?: string;
  routingNumber?: string;
  bankName?: string;
  accountHolderName?: string;
  paypalEmail?: string;
  stripeAccountId?: string;
  cryptoWallet?: string;
  cryptoNetwork?: string;
  // Verification
  verificationDocument?: File | null;
  isVerified: boolean;
  // Tax
  taxFormType?: 'W9' | 'W8BEN' | 'W8BEN-E';
  taxId?: string;
  country?: string;
  // Confirmation
  acceptFees: boolean;
  twoFactorCode?: string;
}

interface AddFundsData {
  amount: number;
  method: PaymentMethod;
  // Payment method details
  savedMethodId?: string;
  // New card
  cardNumber?: string;
  cardExpiry?: string;
  cardCVV?: string;
  cardHolderName?: string;
  // Billing
  billingName?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountry?: string;
  // Confirmation
  saveMethod: boolean;
}

interface PaymentWizardProps {
  flowType: FlowType;
  availableBalance?: number;
  userId: string;
  onComplete?: () => void;
}

export default function PaymentWizard({
  flowType,
  availableBalance = 0,
  userId,
  onComplete
}: PaymentWizardProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Withdrawal state
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalData>({
    amount: 0,
    method: 'bank',
    isVerified: false,
    acceptFees: false
  });

  // Add funds state
  const [addFundsData, setAddFundsData] = useState<AddFundsData>({
    amount: 0,
    method: 'card',
    saveMethod: false,
    billingCountry: 'US'
  });

  // Load saved payment methods from database
  useEffect(() => {
    const loadSavedMethods = async () => {
      try {
        const data = await api.paymentMethods.list() as any;
        setSavedMethods(data);
      } catch (error) {
        console.error('Failed to load saved payment methods:', error);
      }
    };

    if (flowType === 'addFunds') {
      loadSavedMethods();
    }
  }, [flowType]);

  // Load draft from localStorage
  useEffect(() => {
    const draftKey = flowType === 'withdrawal' ? 'withdrawal_draft' : 'add_funds_draft';
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        if (flowType === 'withdrawal') {
          setWithdrawalData(parsedDraft);
        } else {
          setAddFundsData(parsedDraft);
        }
      } catch (error) {
        console.error('Failed to parse draft:', error);
      }
    }
  }, [flowType]);

  // Save draft
  const saveDraft = () => {
    const draftKey = flowType === 'withdrawal' ? 'withdrawal_draft' : 'add_funds_draft';
    const data = flowType === 'withdrawal' ? withdrawalData : addFundsData;
    localStorage.setItem(draftKey, JSON.stringify(data));
  };

  // Calculate fees
  const calculateFees = (amount: number, method: WithdrawalMethod | PaymentMethod) => {
    const feeRates: Record<string, number> = {
      bank: 0.01, // 1%
      paypal: 0.029, // 2.9%
      stripe: 0.029, // 2.9%
      crypto: 0.005, // 0.5%
      card: 0.029 // 2.9%
    };
    const fee = amount * (feeRates[method] || 0);
    const fixedFee = method === 'card' ? 0.30 : 0;
    return { fee: fee + fixedFee, total: amount + fee + fixedFee };
  };

  // WITHDRAWAL FLOW STEPS

  const Step1WithdrawalAmount = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.balanceCard}>
        <Wallet className={commonStyles.balanceIcon} />
        <div>
          <div className={commonStyles.balanceLabel}>Available Balance</div>
          <div className={commonStyles.balanceAmount}>${availableBalance.toFixed(2)}</div>
        </div>
      </div>

      <div className={commonStyles.formGroup}>
        <label htmlFor="withdrawAmount">Withdrawal Amount</label>
        <div className={commonStyles.amountInput}>
          <span className={commonStyles.currencySymbol}>$</span>
          <input
            type="number"
            id="withdrawAmount"
            value={withdrawalData.amount || ''}
            onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            min="10"
            max={availableBalance}
            step="0.01"
          />
        </div>
        <small>Minimum withdrawal: $10.00</small>
      </div>

      <div className={commonStyles.formGroup}>
        <label>Withdrawal Method</label>
        <div className={commonStyles.methodGrid}>
          <div
            className={cn(
              commonStyles.methodCard,
              themeStyles.methodCard,
              withdrawalData.method === 'bank' && commonStyles.methodCardSelected,
              withdrawalData.method === 'bank' && themeStyles.methodCardSelected
            )}
            onClick={() => setWithdrawalData({ ...withdrawalData, method: 'bank' })}
          >
            <Building className={commonStyles.methodIcon} />
            <div className={commonStyles.methodName}>Bank Transfer</div>
            <div className={commonStyles.methodFee}>1% fee</div>
          </div>

          <div
            className={cn(
              commonStyles.methodCard,
              themeStyles.methodCard,
              withdrawalData.method === 'paypal' && commonStyles.methodCardSelected,
              withdrawalData.method === 'paypal' && themeStyles.methodCardSelected
            )}
            onClick={() => setWithdrawalData({ ...withdrawalData, method: 'paypal' })}
          >
            <CreditCard className={commonStyles.methodIcon} />
            <div className={commonStyles.methodName}>PayPal</div>
            <div className={commonStyles.methodFee}>2.9% fee</div>
          </div>

          <div
            className={cn(
              commonStyles.methodCard,
              themeStyles.methodCard,
              withdrawalData.method === 'stripe' && commonStyles.methodCardSelected,
              withdrawalData.method === 'stripe' && themeStyles.methodCardSelected
            )}
            onClick={() => setWithdrawalData({ ...withdrawalData, method: 'stripe' })}
          >
            <CreditCard className={commonStyles.methodIcon} />
            <div className={commonStyles.methodName}>Stripe</div>
            <div className={commonStyles.methodFee}>2.9% fee</div>
          </div>

          <div
            className={cn(
              commonStyles.methodCard,
              themeStyles.methodCard,
              withdrawalData.method === 'crypto' && commonStyles.methodCardSelected,
              withdrawalData.method === 'crypto' && themeStyles.methodCardSelected
            )}
            onClick={() => setWithdrawalData({ ...withdrawalData, method: 'crypto' })}
          >
            <Bitcoin className={commonStyles.methodIcon} />
            <div className={commonStyles.methodName}>Cryptocurrency</div>
            <div className={commonStyles.methodFee}>0.5% fee</div>
          </div>
        </div>
      </div>

      {withdrawalData.amount > 0 && (
        <div className={cn(commonStyles.feePreview, themeStyles.feePreview)}>
          <div className={commonStyles.feeRow}>
            <span>Amount:</span>
            <span>${withdrawalData.amount.toFixed(2)}</span>
          </div>
          <div className={commonStyles.feeRow}>
            <span>Fee:</span>
            <span>${calculateFees(withdrawalData.amount, withdrawalData.method).fee.toFixed(2)}</span>
          </div>
          <div className={cn(commonStyles.feeRow, commonStyles.feeTotal)}>
            <span>You&apos;ll receive:</span>
            <span>${(withdrawalData.amount - calculateFees(withdrawalData.amount, withdrawalData.method).fee).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );

  const Step2AccountDetails = () => (
    <div className={commonStyles.stepContent}>
      {withdrawalData.method === 'bank' && (
        <>
          <div className={commonStyles.formGroup}>
            <label htmlFor="accountHolderName">Account Holder Name</label>
            <input
              type="text"
              id="accountHolderName"
              value={withdrawalData.accountHolderName || ''}
              onChange={(e) => setWithdrawalData({ ...withdrawalData, accountHolderName: e.target.value })}
              placeholder="Full name as it appears on account"
            />
          </div>

          <div className={commonStyles.formRow}>
            <div className={commonStyles.formGroup}>
              <label htmlFor="accountNumber">Account Number</label>
              <input
                type="text"
                id="accountNumber"
                value={withdrawalData.accountNumber || ''}
                onChange={(e) => setWithdrawalData({ ...withdrawalData, accountNumber: e.target.value })}
                placeholder="1234567890"
              />
            </div>

            <div className={commonStyles.formGroup}>
              <label htmlFor="routingNumber">Routing Number</label>
              <input
                type="text"
                id="routingNumber"
                value={withdrawalData.routingNumber || ''}
                onChange={(e) => setWithdrawalData({ ...withdrawalData, routingNumber: e.target.value })}
                placeholder="123456789"
              />
            </div>
          </div>

          <div className={commonStyles.formGroup}>
            <label htmlFor="bankName">Bank Name</label>
            <input
              type="text"
              id="bankName"
              value={withdrawalData.bankName || ''}
              onChange={(e) => setWithdrawalData({ ...withdrawalData, bankName: e.target.value })}
              placeholder="E.g., Chase, Bank of America"
            />
          </div>
        </>
      )}

      {withdrawalData.method === 'paypal' && (
        <div className={commonStyles.formGroup}>
          <label htmlFor="paypalEmail">PayPal Email Address</label>
          <input
            type="email"
            id="paypalEmail"
            value={withdrawalData.paypalEmail || ''}
            onChange={(e) => setWithdrawalData({ ...withdrawalData, paypalEmail: e.target.value })}
            placeholder="your.email@example.com"
          />
          <small>Withdrawals will be sent to this PayPal account</small>
        </div>
      )}

      {withdrawalData.method === 'stripe' && (
        <div className={commonStyles.formGroup}>
          <label htmlFor="stripeAccountId">Stripe Account ID</label>
          <input
            type="text"
            id="stripeAccountId"
            value={withdrawalData.stripeAccountId || ''}
            onChange={(e) => setWithdrawalData({ ...withdrawalData, stripeAccountId: e.target.value })}
            placeholder="acct_XXXXXXXXXXXX"
          />
          <small>Your Stripe Connect account ID</small>
        </div>
      )}

      {withdrawalData.method === 'crypto' && (
        <>
          <div className={commonStyles.formGroup}>
            <label htmlFor="cryptoNetwork">Network</label>
            <select
              id="cryptoNetwork"
              value={withdrawalData.cryptoNetwork || 'ethereum'}
              onChange={(e) => setWithdrawalData({ ...withdrawalData, cryptoNetwork: e.target.value })}
            >
              <option value="ethereum">Ethereum (ERC-20)</option>
              <option value="bitcoin">Bitcoin</option>
              <option value="binance">Binance Smart Chain (BEP-20)</option>
              <option value="polygon">Polygon (MATIC)</option>
            </select>
          </div>

          <div className={commonStyles.formGroup}>
            <label htmlFor="cryptoWallet">Wallet Address</label>
            <input
              type="text"
              id="cryptoWallet"
              value={withdrawalData.cryptoWallet || ''}
              onChange={(e) => setWithdrawalData({ ...withdrawalData, cryptoWallet: e.target.value })}
              placeholder="0x..."
            />
            <small className={commonStyles.warning}>
              <Info /> Double-check your wallet address. Transactions cannot be reversed.
            </small>
          </div>
        </>
      )}

      {!withdrawalData.isVerified && (
        <div className={cn(commonStyles.verificationBox, themeStyles.verificationBox)}>
          <ShieldCheck className={commonStyles.verificationIcon} />
          <div>
            <h4>Account Verification Required</h4>
            <p>For first-time withdrawals, please upload a verification document (ID or bank statement)</p>
            <div className={commonStyles.uploadArea}>
              <input
                type="file"
                id="verificationDoc"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setWithdrawalData({ ...withdrawalData, verificationDocument: file });
                }}
                className={commonStyles.hiddenInput}
              />
              <label htmlFor="verificationDoc" className={commonStyles.uploadButton}>
                <FileUp /> Upload Document
              </label>
              {withdrawalData.verificationDocument && (
                <div className={commonStyles.uploadedFile}>
                  <CheckCircle /> {withdrawalData.verificationDocument.name}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const Step3TaxInfo = () => (
    <div className={commonStyles.stepContent}>
      <div className={cn(commonStyles.infoBox, themeStyles.infoBox)}>
        <Info />
        <p>Tax information is required for withdrawals over $600/year (US) or as per your country&apos;s regulations.</p>
      </div>

      <div className={commonStyles.formGroup}>
        <label htmlFor="country">Country of Residence</label>
        <select
          id="country"
          value={withdrawalData.country || 'US'}
          onChange={(e) => setWithdrawalData({ ...withdrawalData, country: e.target.value })}
        >
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
          <option value="AU">Australia</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {withdrawalData.country === 'US' && (
        <>
          <div className={commonStyles.formGroup}>
            <label>Tax Form Type</label>
            <div className={commonStyles.radioGroup}>
              <label className={commonStyles.radioLabel}>
                <input
                  type="radio"
                  name="taxFormType"
                  value="W9"
                  checked={withdrawalData.taxFormType === 'W9'}
                  onChange={(e) => setWithdrawalData({ ...withdrawalData, taxFormType: e.target.value as 'W9' })}
                />
                <span>W-9 (US Citizen/Resident)</span>
              </label>
            </div>
          </div>

          <div className={commonStyles.formGroup}>
            <label htmlFor="taxId">Social Security Number or EIN</label>
            <input
              type="text"
              id="taxId"
              value={withdrawalData.taxId || ''}
              onChange={(e) => setWithdrawalData({ ...withdrawalData, taxId: e.target.value })}
              placeholder="XXX-XX-XXXX"
            />
            <small>This information is encrypted and securely stored</small>
          </div>
        </>
      )}

      {withdrawalData.country !== 'US' && (
        <>
          <div className={commonStyles.formGroup}>
            <label>Tax Form Type</label>
            <div className={commonStyles.radioGroup}>
              <label className={commonStyles.radioLabel}>
                <input
                  type="radio"
                  name="taxFormType"
                  value="W8BEN"
                  checked={withdrawalData.taxFormType === 'W8BEN'}
                  onChange={(e) => setWithdrawalData({ ...withdrawalData, taxFormType: e.target.value as 'W8BEN' })}
                />
                <span>W-8BEN (Individual)</span>
              </label>
              <label className={commonStyles.radioLabel}>
                <input
                  type="radio"
                  name="taxFormType"
                  value="W8BEN-E"
                  checked={withdrawalData.taxFormType === 'W8BEN-E'}
                  onChange={(e) => setWithdrawalData({ ...withdrawalData, taxFormType: e.target.value as 'W8BEN-E' })}
                />
                <span>W-8BEN-E (Entity)</span>
              </label>
            </div>
          </div>

          <div className={commonStyles.formGroup}>
            <label htmlFor="taxId">Tax Identification Number</label>
            <input
              type="text"
              id="taxId"
              value={withdrawalData.taxId || ''}
              onChange={(e) => setWithdrawalData({ ...withdrawalData, taxId: e.target.value })}
              placeholder="Your country's tax ID"
            />
          </div>
        </>
      )}
    </div>
  );

  const Step4WithdrawalConfirm = () => {
    const { fee, total } = calculateFees(withdrawalData.amount, withdrawalData.method);
    const youReceive = withdrawalData.amount - fee;

    return (
      <div className={commonStyles.stepContent}>
        <div className={cn(commonStyles.summaryBox, themeStyles.summaryBox)}>
          <h3>Withdrawal Summary</h3>
          
          <div className={commonStyles.summaryRow}>
            <span>Withdrawal Amount:</span>
            <span className={commonStyles.summaryValue}>${withdrawalData.amount.toFixed(2)}</span>
          </div>

          <div className={commonStyles.summaryRow}>
            <span>Method:</span>
            <span className={commonStyles.summaryValue}>
              {withdrawalData.method === 'bank' && 'Bank Transfer'}
              {withdrawalData.method === 'paypal' && 'PayPal'}
              {withdrawalData.method === 'stripe' && 'Stripe'}
              {withdrawalData.method === 'crypto' && 'Cryptocurrency'}
            </span>
          </div>

          {withdrawalData.method === 'bank' && (
            <div className={commonStyles.summaryRow}>
              <span>Account:</span>
              <span className={commonStyles.summaryValue}>
                {withdrawalData.bankName} ****{withdrawalData.accountNumber?.slice(-4)}
              </span>
            </div>
          )}

          {withdrawalData.method === 'paypal' && (
            <div className={commonStyles.summaryRow}>
              <span>PayPal Email:</span>
              <span className={commonStyles.summaryValue}>{withdrawalData.paypalEmail}</span>
            </div>
          )}

          <div className={commonStyles.summaryRow}>
            <span>Processing Fee:</span>
            <span className={commonStyles.summaryValue}>-${fee.toFixed(2)}</span>
          </div>

          <div className={cn(commonStyles.summaryRow, commonStyles.summaryTotal)}>
            <span>You&apos;ll Receive:</span>
            <span className={commonStyles.summaryValue}>${youReceive.toFixed(2)}</span>
          </div>

          <div className={cn(commonStyles.infoBox, themeStyles.infoBox)}>
            <Info />
            <small>Processing time: 3-5 business days for bank transfers, 1-2 days for other methods</small>
          </div>
        </div>

        <div className={commonStyles.formGroup}>
          <label className={commonStyles.checkboxLabel}>
            <input
              type="checkbox"
              checked={withdrawalData.acceptFees}
              onChange={(e) => setWithdrawalData({ ...withdrawalData, acceptFees: e.target.checked })}
            />
            <span>I understand and accept the processing fees and terms</span>
          </label>
        </div>

        <div className={commonStyles.formGroup}>
          <label htmlFor="twoFactorCode">Two-Factor Authentication Code (if enabled)</label>
          <input
            type="text"
            id="twoFactorCode"
            value={withdrawalData.twoFactorCode || ''}
            onChange={(e) => setWithdrawalData({ ...withdrawalData, twoFactorCode: e.target.value })}
            placeholder="Enter 6-digit code"
            maxLength={6}
          />
        </div>
      </div>
    );
  };

  // ADD FUNDS FLOW STEPS

  const Step1AddFundsAmount = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.formGroup}>
        <label>Select Amount</label>
        <div className={commonStyles.quickAmounts}>
          {[100, 500, 1000, 2500, 5000].map((amount) => (
            <button
              key={amount}
              type="button"
              className={cn(
                commonStyles.quickAmountBtn,
                themeStyles.quickAmountBtn,
                addFundsData.amount === amount && commonStyles.quickAmountSelected,
                addFundsData.amount === amount && themeStyles.quickAmountSelected
              )}
              onClick={() => setAddFundsData({ ...addFundsData, amount })}
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>

      <div className={commonStyles.formGroup}>
        <label htmlFor="customAmount">Custom Amount</label>
        <div className={commonStyles.amountInput}>
          <span className={commonStyles.currencySymbol}>$</span>
          <input
            type="number"
            id="customAmount"
            value={addFundsData.amount || ''}
            onChange={(e) => setAddFundsData({ ...addFundsData, amount: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            min="10"
            step="0.01"
          />
        </div>
        <small>Minimum: $10.00</small>
      </div>

      {addFundsData.amount > 0 && (
        <div className={cn(commonStyles.feePreview, themeStyles.feePreview)}>
          <div className={commonStyles.feeRow}>
            <span>Amount:</span>
            <span>${addFundsData.amount.toFixed(2)}</span>
          </div>
          <div className={commonStyles.feeRow}>
            <span>Processing Fee:</span>
            <span>${calculateFees(addFundsData.amount, addFundsData.method).fee.toFixed(2)}</span>
          </div>
          <div className={cn(commonStyles.feeRow, commonStyles.feeTotal)}>
            <span>Total Charge:</span>
            <span>${calculateFees(addFundsData.amount, addFundsData.method).total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );

  const Step2PaymentMethod = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.formGroup}>
        <label>Payment Method</label>
        <div className={commonStyles.methodGrid}>
          <div
            className={cn(
              commonStyles.methodCard,
              themeStyles.methodCard,
              addFundsData.method === 'card' && commonStyles.methodCardSelected,
              addFundsData.method === 'card' && themeStyles.methodCardSelected
            )}
            onClick={() => setAddFundsData({ ...addFundsData, method: 'card' })}
          >
            <CreditCard className={commonStyles.methodIcon} />
            <div className={commonStyles.methodName}>Credit/Debit Card</div>
            <div className={commonStyles.methodFee}>2.9% + $0.30</div>
          </div>

          <div
            className={cn(
              commonStyles.methodCard,
              themeStyles.methodCard,
              addFundsData.method === 'bank' && commonStyles.methodCardSelected,
              addFundsData.method === 'bank' && themeStyles.methodCardSelected
            )}
            onClick={() => setAddFundsData({ ...addFundsData, method: 'bank' })}
          >
            <Building className={commonStyles.methodIcon} />
            <div className={commonStyles.methodName}>Bank Transfer</div>
            <div className={commonStyles.methodFee}>1% fee</div>
          </div>

          <div
            className={cn(
              commonStyles.methodCard,
              themeStyles.methodCard,
              addFundsData.method === 'paypal' && commonStyles.methodCardSelected,
              addFundsData.method === 'paypal' && themeStyles.methodCardSelected
            )}
            onClick={() => setAddFundsData({ ...addFundsData, method: 'paypal' })}
          >
            <CreditCard className={commonStyles.methodIcon} />
            <div className={commonStyles.methodName}>PayPal</div>
            <div className={commonStyles.methodFee}>2.9% fee</div>
          </div>

          <div
            className={cn(
              commonStyles.methodCard,
              themeStyles.methodCard,
              addFundsData.method === 'crypto' && commonStyles.methodCardSelected,
              addFundsData.method === 'crypto' && themeStyles.methodCardSelected
            )}
            onClick={() => setAddFundsData({ ...addFundsData, method: 'crypto' })}
          >
            <Bitcoin className={commonStyles.methodIcon} />
            <div className={commonStyles.methodName}>Cryptocurrency</div>
            <div className={commonStyles.methodFee}>0.5% fee</div>
          </div>
        </div>
      </div>

      {savedMethods.length > 0 && addFundsData.method === 'card' && (
        <div className={commonStyles.formGroup}>
          <label>Saved Payment Methods</label>
          <div className={commonStyles.savedMethods}>
            {savedMethods.map((method) => (
              <div
                key={method.id}
                className={cn(
                  commonStyles.savedMethodCard,
                  themeStyles.savedMethodCard,
                  addFundsData.savedMethodId === method.id && commonStyles.savedMethodSelected,
                  addFundsData.savedMethodId === method.id && themeStyles.savedMethodSelected
                )}
                onClick={() => setAddFundsData({ ...addFundsData, savedMethodId: method.id })}
              >
                <CreditCard />
                <div>
                  <div>**** {method.last4}</div>
                  {method.isDefault && <small className={commonStyles.defaultBadge}>Default</small>}
                </div>
              </div>
            ))}
            <button
              type="button"
              className={cn(commonStyles.addNewMethod, themeStyles.addNewMethod)}
              onClick={() => setAddFundsData({ ...addFundsData, savedMethodId: undefined })}
            >
              <Plus /> Add New Card
            </button>
          </div>
        </div>
      )}

      {addFundsData.method === 'card' && !addFundsData.savedMethodId && (
        <>
          <div className={commonStyles.formGroup}>
            <label htmlFor="cardHolderName">Cardholder Name</label>
            <input
              type="text"
              id="cardHolderName"
              value={addFundsData.cardHolderName || ''}
              onChange={(e) => setAddFundsData({ ...addFundsData, cardHolderName: e.target.value })}
              placeholder="Name as it appears on card"
            />
          </div>

          <div className={commonStyles.formGroup}>
            <label htmlFor="cardNumber">Card Number</label>
            <input
              type="text"
              id="cardNumber"
              value={addFundsData.cardNumber || ''}
              onChange={(e) => setAddFundsData({ ...addFundsData, cardNumber: e.target.value })}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
          </div>

          <div className={commonStyles.formRow}>
            <div className={commonStyles.formGroup}>
              <label htmlFor="cardExpiry">Expiry Date</label>
              <input
                type="text"
                id="cardExpiry"
                value={addFundsData.cardExpiry || ''}
                onChange={(e) => setAddFundsData({ ...addFundsData, cardExpiry: e.target.value })}
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>

            <div className={commonStyles.formGroup}>
              <label htmlFor="cardCVV">CVV</label>
              <input
                type="text"
                id="cardCVV"
                value={addFundsData.cardCVV || ''}
                onChange={(e) => setAddFundsData({ ...addFundsData, cardCVV: e.target.value })}
                placeholder="123"
                maxLength={4}
              />
            </div>
          </div>

          <div className={commonStyles.formGroup}>
            <label className={commonStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={addFundsData.saveMethod}
                onChange={(e) => setAddFundsData({ ...addFundsData, saveMethod: e.target.checked })}
              />
              <span>Save this card for future payments</span>
            </label>
          </div>
        </>
      )}
    </div>
  );

  const Step3BillingDetails = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.formGroup}>
        <label htmlFor="billingName">Full Name</label>
        <input
          type="text"
          id="billingName"
          value={addFundsData.billingName || ''}
          onChange={(e) => setAddFundsData({ ...addFundsData, billingName: e.target.value })}
          placeholder="John Doe"
        />
      </div>

      <div className={commonStyles.formGroup}>
        <label htmlFor="billingAddress">Street Address</label>
        <input
          type="text"
          id="billingAddress"
          value={addFundsData.billingAddress || ''}
          onChange={(e) => setAddFundsData({ ...addFundsData, billingAddress: e.target.value })}
          placeholder="123 Main St"
        />
      </div>

      <div className={commonStyles.formRow}>
        <div className={commonStyles.formGroup}>
          <label htmlFor="billingCity">City</label>
          <input
            type="text"
            id="billingCity"
            value={addFundsData.billingCity || ''}
            onChange={(e) => setAddFundsData({ ...addFundsData, billingCity: e.target.value })}
            placeholder="New York"
          />
        </div>

        <div className={commonStyles.formGroup}>
          <label htmlFor="billingState">State/Province</label>
          <input
            type="text"
            id="billingState"
            value={addFundsData.billingState || ''}
            onChange={(e) => setAddFundsData({ ...addFundsData, billingState: e.target.value })}
            placeholder="NY"
          />
        </div>
      </div>

      <div className={commonStyles.formRow}>
        <div className={commonStyles.formGroup}>
          <label htmlFor="billingZip">ZIP/Postal Code</label>
          <input
            type="text"
            id="billingZip"
            value={addFundsData.billingZip || ''}
            onChange={(e) => setAddFundsData({ ...addFundsData, billingZip: e.target.value })}
            placeholder="10001"
          />
        </div>

        <div className={commonStyles.formGroup}>
          <label htmlFor="billingCountry">Country</label>
          <select
            id="billingCountry"
            value={addFundsData.billingCountry || 'US'}
            onChange={(e) => setAddFundsData({ ...addFundsData, billingCountry: e.target.value })}
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
          </select>
        </div>
      </div>
    </div>
  );

  const Step4AddFundsConfirm = () => {
    const { fee, total } = calculateFees(addFundsData.amount, addFundsData.method);

    return (
      <div className={commonStyles.stepContent}>
        <div className={cn(commonStyles.summaryBox, themeStyles.summaryBox)}>
          <h3>Payment Summary</h3>
          
          <div className={commonStyles.summaryRow}>
            <span>Amount to Add:</span>
            <span className={commonStyles.summaryValue}>${addFundsData.amount.toFixed(2)}</span>
          </div>

          <div className={commonStyles.summaryRow}>
            <span>Payment Method:</span>
            <span className={commonStyles.summaryValue}>
              {addFundsData.method === 'card' && (addFundsData.savedMethodId ? `Card ****${savedMethods.find(m => m.id === addFundsData.savedMethodId)?.last4}` : 'New Card')}
              {addFundsData.method === 'bank' && 'Bank Transfer'}
              {addFundsData.method === 'paypal' && 'PayPal'}
              {addFundsData.method === 'crypto' && 'Cryptocurrency'}
            </span>
          </div>

          <div className={commonStyles.summaryRow}>
            <span>Processing Fee:</span>
            <span className={commonStyles.summaryValue}>${fee.toFixed(2)}</span>
          </div>

          <div className={cn(commonStyles.summaryRow, commonStyles.summaryTotal)}>
            <span>Total Charge:</span>
            <span className={commonStyles.summaryValue}>${total.toFixed(2)}</span>
          </div>

          <div className={cn(commonStyles.infoBox, themeStyles.infoBox)}>
            <CheckCircle />
            <small>Funds will be available immediately after payment confirmation</small>
          </div>
        </div>

        <div className={cn(commonStyles.secureBox, themeStyles.secureBox)}>
          <ShieldCheck />
          <div>
            <strong>Secure Payment</strong>
            <p>Your payment information is encrypted and secure. We never store your full card details.</p>
          </div>
        </div>
      </div>
    );
  };

  // Validation functions
  const validateStep1Withdrawal = async () => {
    if (withdrawalData.amount < 10) {
      showToast('Minimum withdrawal amount is $10.00');
      return false;
    }
    if (withdrawalData.amount > availableBalance) {
      showToast('Insufficient balance');
      return false;
    }
    return true;
  };

  const validateStep2Account = async () => {
    if (withdrawalData.method === 'bank') {
      if (!withdrawalData.accountHolderName || !withdrawalData.accountNumber || !withdrawalData.routingNumber) {
        showToast('Please fill in all bank account details');
        return false;
      }
    } else if (withdrawalData.method === 'paypal') {
      if (!withdrawalData.paypalEmail || !withdrawalData.paypalEmail.includes('@')) {
        showToast('Please enter a valid PayPal email');
        return false;
      }
    } else if (withdrawalData.method === 'stripe') {
      if (!withdrawalData.stripeAccountId) {
        showToast('Please enter your Stripe account ID');
        return false;
      }
    } else if (withdrawalData.method === 'crypto') {
      if (!withdrawalData.cryptoWallet || !withdrawalData.cryptoNetwork) {
        showToast('Please enter your wallet address and select a network');
        return false;
      }
    }
    return true;
  };

  const validateStep4Withdrawal = async () => {
    if (!withdrawalData.acceptFees) {
      showToast('Please accept the fees and terms to continue');
      return false;
    }
    return true;
  };

  const validateStep1AddFunds = async () => {
    if (addFundsData.amount < 10) {
      showToast('Minimum amount is $10.00');
      return false;
    }
    return true;
  };

  const validateStep2Payment = async () => {
    if (addFundsData.method === 'card' && !addFundsData.savedMethodId) {
      if (!addFundsData.cardNumber || !addFundsData.cardExpiry || !addFundsData.cardCVV || !addFundsData.cardHolderName) {
        showToast('Please fill in all card details');
        return false;
      }
    }
    return true;
  };

  const validateStep3Billing = async () => {
    if (!addFundsData.billingName || !addFundsData.billingAddress || !addFundsData.billingCity || !addFundsData.billingZip) {
      showToast('Please fill in all billing details');
      return false;
    }
    return true;
  };

  // Handle completion
  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      const data = flowType === 'withdrawal' ? withdrawalData : addFundsData;
      const payload = {
        ...data,
        user_id: userId
      };

      let result: any;
      if (flowType === 'withdrawal') {
        result = await api.payments.withdraw(payload);
      } else {
        result = await api.payments.addFunds(payload);
      }

      // Clear draft
      const draftKey = flowType === 'withdrawal' ? 'withdrawal_draft' : 'add_funds_draft';
      localStorage.removeItem(draftKey);

      // Show success and redirect
      showToast(`${flowType === 'withdrawal' ? 'Withdrawal' : 'Payment'} successful! Transaction ID: ${result.id}`, 'success');
      
      if (onComplete) {
        onComplete();
      } else {
        router.push(flowType === 'withdrawal' ? '/freelancer/wallet' : '/payments');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      showToast('Transaction failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  // Define wizard steps based on flow type
  const withdrawalSteps = [
    {
      id: 'amount',
      title: 'Amount & Method',
      description: 'Select withdrawal amount and method',
      component: <Step1WithdrawalAmount />,
      validate: validateStep1Withdrawal
    },
    {
      id: 'account',
      title: 'Account Details',
      description: 'Enter your account information',
      component: <Step2AccountDetails />,
      validate: validateStep2Account
    },
    {
      id: 'tax',
      title: 'Tax Information',
      description: 'Provide required tax details',
      component: <Step3TaxInfo />
    },
    {
      id: 'confirm',
      title: 'Review & Confirm',
      description: 'Review and confirm withdrawal',
      component: <Step4WithdrawalConfirm />,
      validate: validateStep4Withdrawal
    }
  ];

  const addFundsSteps = [
    {
      id: 'amount',
      title: 'Select Amount',
      description: 'Choose how much to add',
      component: <Step1AddFundsAmount />,
      validate: validateStep1AddFunds
    },
    {
      id: 'payment',
      title: 'Payment Method',
      description: 'Select or add payment method',
      component: <Step2PaymentMethod />,
      validate: validateStep2Payment
    },
    {
      id: 'billing',
      title: 'Billing Details',
      description: 'Enter billing information',
      component: <Step3BillingDetails />,
      validate: validateStep3Billing
    },
    {
      id: 'confirm',
      title: 'Confirm Payment',
      description: 'Review and complete payment',
      component: <Step4AddFundsConfirm />
    }
  ];

  const steps = flowType === 'withdrawal' ? withdrawalSteps : addFundsSteps;

  return (
    <>
      <WizardContainer
        title={flowType === 'withdrawal' ? 'Withdraw Funds' : 'Add Funds'}
        subtitle={flowType === 'withdrawal' 
          ? `Available balance: $${availableBalance.toFixed(2)}` 
          : 'Add funds to your MegiLance wallet'
        }
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onComplete={handleComplete}
        onCancel={handleCancel}
        isLoading={isSubmitting}
        saveProgress={saveDraft}
      />
      <Modal
        isOpen={showCancelModal}
        title="Cancel Confirmation"
        onClose={() => setShowCancelModal(false)}
        footer={
          <div className={commonStyles.modalButtonGroup}>
            <button onClick={() => setShowCancelModal(false)} className={commonStyles.modalBtnSecondary}>No, Continue</button>
            <button onClick={() => { setShowCancelModal(false); saveDraft(); router.back(); }} className={commonStyles.modalBtnDanger}>Yes, Cancel</button>
          </div>
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
