// @AI-HINT: Payout method setup wizard for configuring withdrawal methods with verification
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import WizardContainer from '@/app/components/organisms/Wizard/WizardContainer/WizardContainer';
import Modal from '@/app/components/organisms/Modal/Modal';
import commonStyles from './PayoutMethodWizard.common.module.css';
import lightStyles from './PayoutMethodWizard.light.module.css';
import darkStyles from './PayoutMethodWizard.dark.module.css';
import {
  Building,
  CreditCard,
  Bitcoin,
  Globe,
  ShieldCheck,
  FileUp,
  CheckCircle,
  Bell,
  Info
} from 'lucide-react';

type PayoutMethodType = 'bank' | 'paypal' | 'stripe' | 'wise' | 'crypto';

interface PayoutMethodData {
  // Step 1: Method type
  methodType: PayoutMethodType;

  // Step 2: Account details (method-specific)
  // Bank
  accountHolderName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  bankName?: string;
  bankAddress?: string;
  accountType?: 'checking' | 'savings';
  
  // PayPal
  paypalEmail?: string;
  
  // Stripe
  stripeAccountId?: string;
  
  // Wise
  wiseEmail?: string;
  
  // Crypto
  cryptoWallet?: string;
  cryptoNetwork?: string;
  
  // Common
  country?: string;
  currency?: string;

  // Step 3: Verification
  verificationDocument?: File | null;
  testTransactionAmount?: number;
  verificationCode?: string;
  isVerified: boolean;

  // Step 4: Settings
  isPrimary: boolean;
  autoWithdrawThreshold?: number;
  notifyOnPayout: boolean;
  notifyOnFailure: boolean;
}

interface PayoutMethodWizardProps {
  userId: string;
  onComplete?: (methodId: string) => void;
}

export default function PayoutMethodWizard({ userId, onComplete }: PayoutMethodWizardProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [methodData, setMethodData] = useState<PayoutMethodData>({
    methodType: 'bank',
    isVerified: false,
    isPrimary: false,
    notifyOnPayout: true,
    notifyOnFailure: true,
    country: 'US',
    currency: 'USD'
  });

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('payout_method_draft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setMethodData(parsedDraft);
      } catch (error) {
        console.error('Failed to parse draft:', error);
      }
    }
  }, []);

  // Save draft
  const saveDraft = () => {
    localStorage.setItem('payout_method_draft', JSON.stringify(methodData));
  };

  // Get method-specific fee information
  const getMethodInfo = (method: PayoutMethodType) => {
    const info = {
      bank: { fee: '1.0%', processingTime: '3-5 business days', minAmount: '$10' },
      paypal: { fee: '2.9%', processingTime: '1-2 business days', minAmount: '$5' },
      stripe: { fee: '2.9% + $0.30', processingTime: 'Instant', minAmount: '$1' },
      wise: { fee: '0.5-1.0%', processingTime: '1-3 business days', minAmount: '$10' },
      crypto: { fee: 'Network fee', processingTime: '15-60 minutes', minAmount: '$25' }
    };
    return info[method];
  };

  // STEP 1: Method Type Selection
  const Step1MethodType = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.methodGrid}>
        <div
          className={cn(
            commonStyles.methodCard,
            themeStyles.methodCard,
            methodData.methodType === 'bank' && commonStyles.methodCardSelected,
            methodData.methodType === 'bank' && themeStyles.methodCardSelected
          )}
          onClick={() => setMethodData({ ...methodData, methodType: 'bank' })}
        >
          <Building className={commonStyles.methodIcon} />
          <h3>Bank Transfer</h3>
          <p className={commonStyles.methodDescription}>Direct deposit to your bank account</p>
          <div className={commonStyles.methodDetails}>
            <div className={commonStyles.methodDetail}>
              <strong>Fee:</strong> {getMethodInfo('bank').fee}
            </div>
            <div className={commonStyles.methodDetail}>
              <strong>Processing:</strong> {getMethodInfo('bank').processingTime}
            </div>
            <div className={commonStyles.methodDetail}>
              <strong>Min Amount:</strong> {getMethodInfo('bank').minAmount}
            </div>
          </div>
        </div>

        <div
          className={cn(
            commonStyles.methodCard,
            themeStyles.methodCard,
            methodData.methodType === 'paypal' && commonStyles.methodCardSelected,
            methodData.methodType === 'paypal' && themeStyles.methodCardSelected
          )}
          onClick={() => setMethodData({ ...methodData, methodType: 'paypal' })}
        >
          <CreditCard className={commonStyles.methodIcon} />
          <h3>PayPal</h3>
          <p className={commonStyles.methodDescription}>Fast and convenient PayPal payments</p>
          <div className={commonStyles.methodDetails}>
            <div className={commonStyles.methodDetail}>
              <strong>Fee:</strong> {getMethodInfo('paypal').fee}
            </div>
            <div className={commonStyles.methodDetail}>
              <strong>Processing:</strong> {getMethodInfo('paypal').processingTime}
            </div>
            <div className={commonStyles.methodDetail}>
              <strong>Min Amount:</strong> {getMethodInfo('paypal').minAmount}
            </div>
          </div>
        </div>

        <div
          className={cn(
            commonStyles.methodCard,
            themeStyles.methodCard,
            methodData.methodType === 'stripe' && commonStyles.methodCardSelected,
            methodData.methodType === 'stripe' && themeStyles.methodCardSelected
          )}
          onClick={() => setMethodData({ ...methodData, methodType: 'stripe' })}
        >
          <CreditCard className={commonStyles.methodIcon} />
          <h3>Stripe</h3>
          <p className={commonStyles.methodDescription}>Instant payouts with Stripe Connect</p>
          <div className={commonStyles.methodDetails}>
            <div className={commonStyles.methodDetail}>
              <strong>Fee:</strong> {getMethodInfo('stripe').fee}
            </div>
            <div className={commonStyles.methodDetail}>
              <strong>Processing:</strong> {getMethodInfo('stripe').processingTime}
            </div>
            <div className={commonStyles.methodDetail}>
              <strong>Min Amount:</strong> {getMethodInfo('stripe').minAmount}
            </div>
          </div>
        </div>

        <div
          className={cn(
            commonStyles.methodCard,
            themeStyles.methodCard,
            methodData.methodType === 'wise' && commonStyles.methodCardSelected,
            methodData.methodType === 'wise' && themeStyles.methodCardSelected
          )}
          onClick={() => setMethodData({ ...methodData, methodType: 'wise' })}
        >
          <Globe className={commonStyles.methodIcon} />
          <h3>Wise (TransferWise)</h3>
          <p className={commonStyles.methodDescription}>Low-fee international transfers</p>
          <div className={commonStyles.methodDetails}>
            <div className={commonStyles.methodDetail}>
              <strong>Fee:</strong> {getMethodInfo('wise').fee}
            </div>
            <div className={commonStyles.methodDetail}>
              <strong>Processing:</strong> {getMethodInfo('wise').processingTime}
            </div>
            <div className={commonStyles.methodDetail}>
              <strong>Min Amount:</strong> {getMethodInfo('wise').minAmount}
            </div>
          </div>
        </div>

        <div
          className={cn(
            commonStyles.methodCard,
            themeStyles.methodCard,
            methodData.methodType === 'crypto' && commonStyles.methodCardSelected,
            methodData.methodType === 'crypto' && themeStyles.methodCardSelected
          )}
          onClick={() => setMethodData({ ...methodData, methodType: 'crypto' })}
        >
          <Bitcoin className={commonStyles.methodIcon} />
          <h3>Cryptocurrency</h3>
          <p className={commonStyles.methodDescription}>Receive payments in crypto</p>
          <div className={commonStyles.methodDetails}>
            <div className={commonStyles.methodDetail}>
              <strong>Fee:</strong> {getMethodInfo('crypto').fee}
            </div>
            <div className={commonStyles.methodDetail}>
              <strong>Processing:</strong> {getMethodInfo('crypto').processingTime}
            </div>
            <div className={commonStyles.methodDetail}>
              <strong>Min Amount:</strong> {getMethodInfo('crypto').minAmount}
            </div>
          </div>
        </div>
      </div>

      <div className={cn(commonStyles.infoBox, themeStyles.infoBox)}>
        <Info />
        <p>You can add multiple payout methods and switch between them anytime. One method can be set as your default.</p>
      </div>
    </div>
  );

  // STEP 2: Account Details
  const Step2AccountDetails = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.formGroup}>
        <label htmlFor="country">Country</label>
        <select
          id="country"
          value={methodData.country || 'US'}
          onChange={(e) => setMethodData({ ...methodData, country: e.target.value })}
        >
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
          <option value="AU">Australia</option>
          <option value="DE">Germany</option>
          <option value="FR">France</option>
          <option value="IN">India</option>
          <option value="BR">Brazil</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className={commonStyles.formGroup}>
        <label htmlFor="currency">Currency</label>
        <select
          id="currency"
          value={methodData.currency || 'USD'}
          onChange={(e) => setMethodData({ ...methodData, currency: e.target.value })}
        >
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
          <option value="CAD">CAD - Canadian Dollar</option>
          <option value="AUD">AUD - Australian Dollar</option>
          <option value="INR">INR - Indian Rupee</option>
        </select>
      </div>

      {methodData.methodType === 'bank' && (
        <>
          <div className={commonStyles.formGroup}>
            <label htmlFor="accountHolderName">Account Holder Name</label>
            <input
              type="text"
              id="accountHolderName"
              value={methodData.accountHolderName || ''}
              onChange={(e) => setMethodData({ ...methodData, accountHolderName: e.target.value })}
              placeholder="Full name as it appears on account"
            />
          </div>

          <div className={commonStyles.formGroup}>
            <label htmlFor="bankName">Bank Name</label>
            <input
              type="text"
              id="bankName"
              value={methodData.bankName || ''}
              onChange={(e) => setMethodData({ ...methodData, bankName: e.target.value })}
              placeholder="E.g., Chase, Bank of America"
            />
          </div>

          {methodData.country === 'US' && (
            <>
              <div className={commonStyles.formRow}>
                <div className={commonStyles.formGroup}>
                  <label htmlFor="accountNumber">Account Number</label>
                  <input
                    type="text"
                    id="accountNumber"
                    value={methodData.accountNumber || ''}
                    onChange={(e) => setMethodData({ ...methodData, accountNumber: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>

                <div className={commonStyles.formGroup}>
                  <label htmlFor="routingNumber">Routing Number</label>
                  <input
                    type="text"
                    id="routingNumber"
                    value={methodData.routingNumber || ''}
                    onChange={(e) => setMethodData({ ...methodData, routingNumber: e.target.value })}
                    placeholder="123456789"
                  />
                </div>
              </div>

              <div className={commonStyles.formGroup}>
                <label htmlFor="accountType">Account Type</label>
                <select
                  id="accountType"
                  value={methodData.accountType || 'checking'}
                  onChange={(e) => setMethodData({ ...methodData, accountType: e.target.value as 'checking' | 'savings' })}
                >
                  <option value="checking">Checking Account</option>
                  <option value="savings">Savings Account</option>
                </select>
              </div>
            </>
          )}

          {methodData.country !== 'US' && (
            <>
              <div className={commonStyles.formGroup}>
                <label htmlFor="iban">IBAN</label>
                <input
                  type="text"
                  id="iban"
                  value={methodData.iban || ''}
                  onChange={(e) => setMethodData({ ...methodData, iban: e.target.value })}
                  placeholder="DE89370400440532013000"
                />
              </div>

              <div className={commonStyles.formGroup}>
                <label htmlFor="swiftCode">SWIFT/BIC Code</label>
                <input
                  type="text"
                  id="swiftCode"
                  value={methodData.swiftCode || ''}
                  onChange={(e) => setMethodData({ ...methodData, swiftCode: e.target.value })}
                  placeholder="DEUTDEFF"
                />
              </div>
            </>
          )}

          <div className={commonStyles.formGroup}>
            <label htmlFor="bankAddress">Bank Address (Optional)</label>
            <input
              type="text"
              id="bankAddress"
              value={methodData.bankAddress || ''}
              onChange={(e) => setMethodData({ ...methodData, bankAddress: e.target.value })}
              placeholder="Bank's full address"
            />
          </div>
        </>
      )}

      {methodData.methodType === 'paypal' && (
        <div className={commonStyles.formGroup}>
          <label htmlFor="paypalEmail">PayPal Email Address</label>
          <input
            type="email"
            id="paypalEmail"
            value={methodData.paypalEmail || ''}
            onChange={(e) => setMethodData({ ...methodData, paypalEmail: e.target.value })}
            placeholder="your.email@example.com"
          />
          <small>Make sure this email is verified with PayPal</small>
        </div>
      )}

      {methodData.methodType === 'stripe' && (
        <>
          <div className={commonStyles.formGroup}>
            <label htmlFor="stripeAccountId">Stripe Connect Account ID</label>
            <input
              type="text"
              id="stripeAccountId"
              value={methodData.stripeAccountId || ''}
              onChange={(e) => setMethodData({ ...methodData, stripeAccountId: e.target.value })}
              placeholder="acct_XXXXXXXXXXXX"
            />
            <small>Don&apos;t have a Stripe account? <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" className={themeStyles.stripeLink}>Create one here</a></small>
          </div>
        </>
      )}

      {methodData.methodType === 'wise' && (
        <div className={commonStyles.formGroup}>
          <label htmlFor="wiseEmail">Wise Account Email</label>
          <input
            type="email"
            id="wiseEmail"
            value={methodData.wiseEmail || ''}
            onChange={(e) => setMethodData({ ...methodData, wiseEmail: e.target.value })}
            placeholder="your.email@example.com"
          />
          <small>Your Wise account email address</small>
        </div>
      )}

      {methodData.methodType === 'crypto' && (
        <>
          <div className={commonStyles.formGroup}>
            <label htmlFor="cryptoNetwork">Network</label>
            <select
              id="cryptoNetwork"
              value={methodData.cryptoNetwork || 'ethereum'}
              onChange={(e) => setMethodData({ ...methodData, cryptoNetwork: e.target.value })}
            >
              <option value="ethereum">Ethereum (ERC-20)</option>
              <option value="bitcoin">Bitcoin</option>
              <option value="binance">Binance Smart Chain (BEP-20)</option>
              <option value="polygon">Polygon (MATIC)</option>
              <option value="tron">Tron (TRC-20)</option>
            </select>
          </div>

          <div className={commonStyles.formGroup}>
            <label htmlFor="cryptoWallet">Wallet Address</label>
            <input
              type="text"
              id="cryptoWallet"
              value={methodData.cryptoWallet || ''}
              onChange={(e) => setMethodData({ ...methodData, cryptoWallet: e.target.value })}
              placeholder="0x..."
            />
            <small className={commonStyles.warning}>
              <Info /> Double-check your wallet address. Transactions cannot be reversed.
            </small>
          </div>
        </>
      )}
    </div>
  );

  // STEP 3: Verification
  const Step3Verification = () => (
    <div className={commonStyles.stepContent}>
      <div className={cn(commonStyles.verificationBox, themeStyles.verificationBox)}>
        <ShieldCheck className={commonStyles.verificationIcon} />
        <h3>Account Verification</h3>
        <p>To ensure security and comply with regulations, we need to verify your payout method.</p>
      </div>

      {methodData.methodType === 'bank' && (
        <>
          <div className={commonStyles.formGroup}>
            <label>Verification Document</label>
            <p className={commonStyles.helperText}>Upload a bank statement or voided check showing your account details</p>
            <div className={commonStyles.uploadArea}>
              <input
                type="file"
                id="verificationDoc"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setMethodData({ ...methodData, verificationDocument: file });
                }}
                className={commonStyles.hiddenInput}
              />
              <label htmlFor="verificationDoc" className={commonStyles.uploadButton}>
                <FileUp /> Upload Document
              </label>
              {methodData.verificationDocument && (
                <div className={commonStyles.uploadedFile}>
                  <CheckCircle /> {methodData.verificationDocument.name}
                </div>
              )}
            </div>
          </div>

          <div className={cn(commonStyles.infoBox, themeStyles.infoBox)}>
            <Info />
            <p><strong>Micro-deposit verification:</strong> We&apos;ll send two small deposits (less than $1 each) to your account within 1-3 business days. You&apos;ll need to verify these amounts to complete setup.</p>
          </div>
        </>
      )}

      {methodData.methodType === 'paypal' && (
        <div className={cn(commonStyles.infoBox, themeStyles.infoBox)}>
          <Info />
          <p>We&apos;ll send a test payment of $0.01 to {methodData.paypalEmail}. Please confirm receipt in your PayPal account.</p>
        </div>
      )}

      {methodData.methodType === 'stripe' && (
        <div className={cn(commonStyles.successBox, themeStyles.successBox)}>
          <CheckCircle />
          <p>Stripe accounts are verified automatically through their platform. No additional verification needed.</p>
        </div>
      )}

      {methodData.methodType === 'wise' && (
        <div className={cn(commonStyles.infoBox, themeStyles.infoBox)}>
          <Info />
          <p>We&apos;ll send a verification email to {methodData.wiseEmail}. Please confirm your email to complete verification.</p>
        </div>
      )}

      {methodData.methodType === 'crypto' && (
        <>
          <div className={commonStyles.formGroup}>
            <label htmlFor="testAmount">Test Transaction Amount</label>
            <p className={commonStyles.helperText}>We&apos;ll send a small test transaction to your wallet. Enter the exact amount you receive (in USD):</p>
            <div className={commonStyles.amountInput}>
              <span className={commonStyles.currencySymbol}>$</span>
              <input
                type="number"
                id="testAmount"
                value={methodData.testTransactionAmount || ''}
                onChange={(e) => setMethodData({ ...methodData, testTransactionAmount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          <div className={cn(commonStyles.warningBox, themeStyles.warningBox)}>
            <Info />
            <p><strong>Important:</strong> Test transactions may take 15-60 minutes depending on network congestion. You can complete this step later.</p>
          </div>
        </>
      )}

      {!methodData.isVerified && (
        <div className={commonStyles.formGroup}>
          <label className={commonStyles.checkboxLabel}>
            <input
              type="checkbox"
              checked={methodData.isVerified}
              onChange={(e) => setMethodData({ ...methodData, isVerified: e.target.checked })}
            />
            <span>I have completed the verification steps and confirmed my account details are correct</span>
          </label>
        </div>
      )}
    </div>
  );

  // STEP 4: Settings
  const Step4Settings = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.formGroup}>
        <label className={commonStyles.checkboxLabel}>
          <input
            type="checkbox"
            checked={methodData.isPrimary}
            onChange={(e) => setMethodData({ ...methodData, isPrimary: e.target.checked })}
          />
          <span><strong>Set as Primary Payout Method</strong></span>
        </label>
        <small>This will be your default method for all withdrawals</small>
      </div>

      <div className={commonStyles.formGroup}>
        <label htmlFor="autoWithdrawThreshold">Auto-Withdraw Threshold (Optional)</label>
        <div className={commonStyles.amountInput}>
          <span className={commonStyles.currencySymbol}>$</span>
          <input
            type="number"
            id="autoWithdrawThreshold"
            value={methodData.autoWithdrawThreshold || ''}
            onChange={(e) => setMethodData({ ...methodData, autoWithdrawThreshold: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            step="10"
            min="100"
          />
        </div>
        <small>Automatically withdraw funds when your balance reaches this amount (minimum $100)</small>
      </div>

      <div className={commonStyles.settingsSection}>
        <h3><Bell /> Notification Preferences</h3>
        
        <div className={commonStyles.formGroup}>
          <label className={commonStyles.checkboxLabel}>
            <input
              type="checkbox"
              checked={methodData.notifyOnPayout}
              onChange={(e) => setMethodData({ ...methodData, notifyOnPayout: e.target.checked })}
            />
            <span>Notify me when a payout is processed</span>
          </label>
        </div>

        <div className={commonStyles.formGroup}>
          <label className={commonStyles.checkboxLabel}>
            <input
              type="checkbox"
              checked={methodData.notifyOnFailure}
              onChange={(e) => setMethodData({ ...methodData, notifyOnFailure: e.target.checked })}
            />
            <span>Notify me if a payout fails</span>
          </label>
        </div>
      </div>

      <div className={cn(commonStyles.summaryBox, themeStyles.summaryBox)}>
        <h3>Payout Method Summary</h3>
        
        <div className={commonStyles.summaryRow}>
          <span>Method Type:</span>
          <span className={commonStyles.summaryValue}>
            {methodData.methodType === 'bank' && 'Bank Transfer'}
            {methodData.methodType === 'paypal' && 'PayPal'}
            {methodData.methodType === 'stripe' && 'Stripe'}
            {methodData.methodType === 'wise' && 'Wise'}
            {methodData.methodType === 'crypto' && 'Cryptocurrency'}
          </span>
        </div>

        {methodData.methodType === 'bank' && (
          <>
            <div className={commonStyles.summaryRow}>
              <span>Account Holder:</span>
              <span className={commonStyles.summaryValue}>{methodData.accountHolderName}</span>
            </div>
            <div className={commonStyles.summaryRow}>
              <span>Bank:</span>
              <span className={commonStyles.summaryValue}>{methodData.bankName}</span>
            </div>
            <div className={commonStyles.summaryRow}>
              <span>Account:</span>
              <span className={commonStyles.summaryValue}>****{methodData.accountNumber?.slice(-4)}</span>
            </div>
          </>
        )}

        {methodData.methodType === 'paypal' && (
          <div className={commonStyles.summaryRow}>
            <span>PayPal Email:</span>
            <span className={commonStyles.summaryValue}>{methodData.paypalEmail}</span>
          </div>
        )}

        <div className={commonStyles.summaryRow}>
          <span>Country:</span>
          <span className={commonStyles.summaryValue}>{methodData.country}</span>
        </div>

        <div className={commonStyles.summaryRow}>
          <span>Currency:</span>
          <span className={commonStyles.summaryValue}>{methodData.currency}</span>
        </div>

        <div className={commonStyles.summaryRow}>
          <span>Processing Fee:</span>
          <span className={commonStyles.summaryValue}>{getMethodInfo(methodData.methodType).fee}</span>
        </div>

        <div className={commonStyles.summaryRow}>
          <span>Processing Time:</span>
          <span className={commonStyles.summaryValue}>{getMethodInfo(methodData.methodType).processingTime}</span>
        </div>

        {methodData.isPrimary && (
          <div className={cn(commonStyles.primaryBadge, themeStyles.primaryBadge)}>
            <CheckCircle /> Primary Method
          </div>
        )}
      </div>
    </div>
  );

  // Validation functions
  const validateStep2 = async () => {
    if (methodData.methodType === 'bank') {
      if (!methodData.accountHolderName || !methodData.bankName) {
        showToast('Please fill in all required bank details');
        return false;
      }
      if (methodData.country === 'US' && (!methodData.accountNumber || !methodData.routingNumber)) {
        showToast('Please enter your account and routing numbers');
        return false;
      }
      if (methodData.country !== 'US' && (!methodData.iban || !methodData.swiftCode)) {
        showToast('Please enter your IBAN and SWIFT code');
        return false;
      }
    } else if (methodData.methodType === 'paypal') {
      if (!methodData.paypalEmail || !methodData.paypalEmail.includes('@')) {
        showToast('Please enter a valid PayPal email');
        return false;
      }
    } else if (methodData.methodType === 'stripe') {
      if (!methodData.stripeAccountId) {
        showToast('Please enter your Stripe account ID');
        return false;
      }
    } else if (methodData.methodType === 'wise') {
      if (!methodData.wiseEmail || !methodData.wiseEmail.includes('@')) {
        showToast('Please enter a valid Wise email');
        return false;
      }
    } else if (methodData.methodType === 'crypto') {
      if (!methodData.cryptoWallet || !methodData.cryptoNetwork) {
        showToast('Please enter your wallet address and select a network');
        return false;
      }
    }
    return true;
  };

  const validateStep3 = async () => {
    if (!methodData.isVerified && methodData.methodType !== 'stripe') {
      showToast('Please complete the verification process');
      return false;
    }
    return true;
  };

  // Handle completion
  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      const result = await api.payoutMethods.create({
        ...methodData,
        user_id: userId
      } as any);

      // Clear draft
      localStorage.removeItem('payout_method_draft');

      showToast('Payout method added successfully!', 'success');
      
      if (onComplete) {
        onComplete((result as any).id);
      } else {
        router.push('/settings/payout-methods');
      }
    } catch (error) {
      console.error('Error adding payout method:', error);
      showToast('Failed to add payout method. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const steps = [
    {
      id: 'method-type',
      title: 'Method Type',
      description: 'Select your preferred payout method',
      component: <Step1MethodType />
    },
    {
      id: 'account-details',
      title: 'Account Details',
      description: 'Enter your account information',
      component: <Step2AccountDetails />,
      validate: validateStep2
    },
    {
      id: 'verification',
      title: 'Verification',
      description: 'Verify your account',
      component: <Step3Verification />,
      validate: validateStep3
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure payout preferences',
      component: <Step4Settings />
    }
  ];

  return (
    <>
      <WizardContainer
        title="Add Payout Method"
        subtitle="Set up a secure way to receive your earnings"
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
