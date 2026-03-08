// @AI-HINT: Pakistan payment options component - USDC, JazzCash, EasyPaisa, Wise, Payoneer
// Stripe is NOT available in Pakistan, so we provide alternatives
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './PakistanPaymentOptions.common.module.css';
import lightStyles from './PakistanPaymentOptions.light.module.css';
import darkStyles from './PakistanPaymentOptions.dark.module.css';
import {
  Wallet,
  Building,
  Smartphone,
  ArrowLeftRight,
  CheckCircle,
  Copy,
  ExternalLink,
  Info,
  Star,
  Hexagon,
  Diamond,
} from 'lucide-react';

// Payment provider types
type PaymentProvider = 
  | 'usdc_polygon'
  | 'usdc_ethereum'
  | 'airtm'
  | 'jazzcash'
  | 'easypaisa'
  | 'wise'
  | 'payoneer'
  | 'bank_transfer';

interface PaymentProviderInfo {
  id: PaymentProvider;
  name: string;
  icon: React.ReactNode;
  feePercent: number;
  feeFixed: number;
  estimatedTime: string;
  recommended?: boolean;
  description: string;
}

interface PakistanPaymentOptionsProps {
  amount: number;
  onProviderSelect: (provider: PaymentProvider) => void;
  selectedProvider?: PaymentProvider;
  onPaymentInitiate?: (details: PaymentDetails) => void;
  isTestnet?: boolean; // Set to true for FREE testing!
}

interface PaymentDetails {
  provider: PaymentProvider;
  amount: number;
  fee: number;
  netAmount: number;
  instructions?: string;
  paymentAddress?: string;
  transactionId?: string;
  isTestnet?: boolean;
}

// Available providers for Pakistan
const PAYMENT_PROVIDERS: PaymentProviderInfo[] = [
  {
    id: 'usdc_polygon',
    name: 'USDC (Polygon)',
    icon: <Hexagon size={24} />,
    feePercent: 0.1,
    feeFixed: 0.01,
    estimatedTime: '2-5 minutes',
    recommended: true,
    description: 'Pay with USDC stablecoin on Polygon network. Ultra-low fees (~$0.01)!'
  },
  {
    id: 'usdc_ethereum',
    name: 'USDC (Ethereum)',
    icon: <Diamond size={24} />,
    feePercent: 0.1,
    feeFixed: 5.00,
    estimatedTime: '5-15 minutes',
    description: 'Pay with USDC on Ethereum mainnet. Higher fees but widely supported.'
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    icon: <Smartphone size={24} />,
    feePercent: 1.5,
    feeFixed: 0,
    estimatedTime: 'Instant',
    description: 'Pakistan\'s leading mobile wallet. Pay in PKR.'
  },
  {
    id: 'easypaisa',
    name: 'EasyPaisa',
    icon: <Smartphone size={24} />,
    feePercent: 1.5,
    feeFixed: 0,
    estimatedTime: 'Instant',
    description: 'Telenor\'s mobile payment solution. Pay in PKR.'
  },
  {
    id: 'airtm',
    name: 'AirTM',
    icon: <ArrowLeftRight size={24} />,
    feePercent: 2.0,
    feeFixed: 0,
    estimatedTime: '15-30 minutes',
    description: 'P2P exchange platform. Convert PKR to USD and pay.'
  },
  {
    id: 'wise',
    name: 'Wise',
    icon: <Building size={24} />,
    feePercent: 0.5,
    feeFixed: 1.00,
    estimatedTime: '1-2 business days',
    description: 'Best exchange rates for international transfers.'
  },
  {
    id: 'payoneer',
    name: 'Payoneer',
    icon: <Wallet size={24} />,
    feePercent: 2.0,
    feeFixed: 0,
    estimatedTime: 'Instant',
    description: 'Popular with Pakistani freelancers. Free transfers between users!'
  },
];

// PKR exchange rate (would fetch from API in production)
const USD_TO_PKR = 278.50;

export default function PakistanPaymentOptions({
  amount,
  onProviderSelect,
  selectedProvider,
  onPaymentInitiate,
  isTestnet = true // Default to testnet for FREE development!
}: PakistanPaymentOptionsProps) {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
  
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copied, setCopied] = useState(false);

  // Testnet chain ID for Polygon Amoy
  const TESTNET_CHAIN_ID = '0x13882'; // 80002 in hex
  const MAINNET_CHAIN_ID = '0x89';    // 137 in hex

  // Calculate fees for a provider
  const calculateFee = (provider: PaymentProviderInfo) => {
    const percentFee = amount * (provider.feePercent / 100);
    return percentFee + provider.feeFixed;
  };

  // Connect MetaMask wallet
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
        
        // Switch to appropriate Polygon network (testnet or mainnet)
        const targetChainId = isTestnet ? TESTNET_CHAIN_ID : MAINNET_CHAIN_ID;
        const networkConfig = isTestnet 
          ? {
              chainId: TESTNET_CHAIN_ID,
              chainName: 'Polygon Amoy Testnet',
              nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
              rpcUrls: ['https://rpc-amoy.polygon.technology/'],
              blockExplorerUrls: ['https://amoy.polygonscan.com/']
            }
          : {
              chainId: MAINNET_CHAIN_ID,
              chainName: 'Polygon Mainnet',
              nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
              rpcUrls: ['https://polygon-rpc.com/'],
              blockExplorerUrls: ['https://polygonscan.com/']
            };
        
        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          });
        } catch (switchError: any) {
          // If network not added, add it
          if (switchError.code === 4902) {
            await (window as any).ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [networkConfig]
            });
          }
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        // MetaMask failed silently or show notification
      }
    } else {
      window.open('https://metamask.io/download/', '_blank');
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle provider selection
  const handleProviderSelect = (providerId: PaymentProvider) => {
    onProviderSelect(providerId);
    if (providerId.startsWith('usdc_')) {
      setShowInstructions(true);
    }
  };

  // Initiate payment
  const initiatePayment = () => {
    if (!selectedProvider) return;
    
    const provider = PAYMENT_PROVIDERS.find(p => p.id === selectedProvider);
    if (!provider) return;
    
    const fee = calculateFee(provider);
    const netAmount = amount - fee;
    
    const details: PaymentDetails = {
      provider: selectedProvider,
      amount,
      fee,
      netAmount,
      paymentAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f1E123', // Demo
      transactionId: `pk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    onPaymentInitiate?.(details);
  };


  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      {/* Testnet Banner - FREE Testing Mode */}
      {isTestnet && (
        <div className={cn(commonStyles.testnetBanner, themeStyles.testnetBanner)}>
          <span>🧪 TESTNET MODE - FREE Testing!</span>
          <p>Get free test tokens from the <a href="https://faucet.polygon.technology/" target="_blank" rel="noopener noreferrer">Polygon Faucet</a></p>
        </div>
      )}
      
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <h3>🇵🇰 Pakistan Payment Options</h3>
        <p>Stripe is not available in Pakistan. Choose from these alternatives:</p>
      </div>

      {/* Provider Grid */}
      <div className={commonStyles.providerGrid}>
        {PAYMENT_PROVIDERS.map((provider) => {
          const fee = calculateFee(provider);
          const isSelected = selectedProvider === provider.id;
          
          return (
            <div
              key={provider.id}
              className={cn(
                commonStyles.providerCard,
                themeStyles.providerCard,
                isSelected && commonStyles.selected,
                isSelected && themeStyles.selected,
                provider.recommended && commonStyles.recommended
              )}
              onClick={() => handleProviderSelect(provider.id)}
            >
              {provider.recommended && (
                <div className={cn(commonStyles.recommendedBadge, themeStyles.recommendedBadge)}>
                  <Star size={14} fill="#eab308" /> Recommended
                </div>
              )}
              
              <div className={commonStyles.providerIcon}>
                {provider.icon}
              </div>
              
              <div className={commonStyles.providerName}>
                {provider.name}
              </div>
              
              <div className={commonStyles.providerFee}>
                {provider.feePercent}% + ${provider.feeFixed.toFixed(2)}
              </div>
              
              <div className={commonStyles.providerTime}>
                {provider.estimatedTime}
              </div>
              
              {isSelected && (
                <CheckCircle size={16} className={commonStyles.selectedIcon} />
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Provider Details */}
      {selectedProvider && (
        <div className={cn(commonStyles.detailsSection, themeStyles.detailsSection)}>
          {(() => {
            const provider = PAYMENT_PROVIDERS.find(p => p.id === selectedProvider);
            if (!provider) return null;
            
            const fee = calculateFee(provider);
            const netAmount = amount - fee;
            const pkrAmount = amount * USD_TO_PKR;
            
            return (
              <>
                <div className={commonStyles.feeBreakdown}>
                  <div className={commonStyles.feeRow}>
                    <span>Amount:</span>
                    <span>${amount.toFixed(2)}</span>
                  </div>
                  <div className={commonStyles.feeRow}>
                    <span>Fee ({provider.feePercent}% + ${provider.feeFixed.toFixed(2)}):</span>
                    <span>-${fee.toFixed(2)}</span>
                  </div>
                  <div className={cn(commonStyles.feeRow, commonStyles.total)}>
                    <span>Net Amount:</span>
                    <span>${netAmount.toFixed(2)}</span>
                  </div>
                  {(provider.id === 'jazzcash' || provider.id === 'easypaisa') && (
                    <div className={cn(commonStyles.feeRow, commonStyles.pkr)}>
                      <span>In PKR:</span>
                      <span>PKR {pkrAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className={cn(commonStyles.instructions, themeStyles.instructions)}>
                  <Info size={16} />
                  <p>{provider.description}</p>
                </div>

                {/* USDC Payment - Wallet Connection */}
                {provider.id.startsWith('usdc_') && (
                  <div className={commonStyles.walletSection}>
                    {!walletConnected ? (
                      <button
                        onClick={connectWallet}
                        className={cn(commonStyles.connectButton, themeStyles.connectButton)}
                      >
                        <Wallet size={16} /> Connect MetaMask
                      </button>
                    ) : (
                      <div className={cn(commonStyles.walletConnected, themeStyles.walletConnected)}>
                        <CheckCircle size={16} />
                        <span>Connected: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
                      </div>
                    )}
                    
                    <div className={commonStyles.paymentAddress}>
                      <label>Send USDC to:</label>
                      <div className={commonStyles.addressBox}>
                        <code>0x742d35Cc6634C0532925a3b844Bc9e7595f1E123</code>
                        <button 
                          onClick={() => copyToClipboard('0x742d35Cc6634C0532925a3b844Bc9e7595f1E123')}
                          className={commonStyles.copyButton}
                        >
                          {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className={cn(commonStyles.networkWarning, themeStyles.networkWarning)}>
                      <Info size={16} />
                      <span>
                        {provider.id === 'usdc_polygon' 
                          ? 'Make sure you\'re on Polygon network. Gas fees are ~$0.01!'
                          : 'Ethereum gas fees can be $5-20. Consider Polygon for lower fees.'
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* JazzCash / EasyPaisa Instructions */}
                {(provider.id === 'jazzcash' || provider.id === 'easypaisa') && (
                  <div className={commonStyles.mobilePayment}>
                    <h4>How to Pay:</h4>
                    <ol>
                      <li>Open your {provider.name} app</li>
                      <li>Select "Send Money" or "Pay Merchant"</li>
                      <li>Enter merchant code: <strong>MEGILANCE001</strong></li>
                      <li>Enter amount: <strong>PKR {pkrAmount.toFixed(2)}</strong></li>
                      <li>Confirm with your PIN</li>
                    </ol>
                    <p className={commonStyles.exchangeRate}>
                      Exchange Rate: 1 USD = PKR {USD_TO_PKR}
                    </p>
                  </div>
                )}

                {/* Wise/Payoneer/AirTM Redirect */}
                {['wise', 'payoneer', 'airtm'].includes(provider.id) && (
                  <div className={commonStyles.redirectPayment}>
                    <button
                      onClick={initiatePayment}
                      className={cn(commonStyles.payButton, themeStyles.payButton)}
                    >
                      Continue to {provider.name} <ExternalLink size={14} />
                    </button>
                    <p>You'll be redirected to complete payment on {provider.name}</p>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Continue Button */}
      {selectedProvider && (
        <button
          onClick={initiatePayment}
          className={cn(commonStyles.continueButton, themeStyles.continueButton)}
        >
          Continue with {PAYMENT_PROVIDERS.find(p => p.id === selectedProvider)?.name}
        </button>
      )}
    </div>
  );
}
