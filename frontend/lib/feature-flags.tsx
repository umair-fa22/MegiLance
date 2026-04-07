// @AI-HINT: Feature flags system for A/B testing and gradual feature rollouts
'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';

// ============================================================================
// Feature Flag Types
// ============================================================================

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  variant?: string;
  payload?: Record<string, unknown>;
  rolloutPercentage?: number;
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  userId?: string;
  environment: 'development' | 'staging' | 'production';
}

// ============================================================================
// Feature Flag Provider Interface (supports multiple backends)
// ============================================================================

interface FeatureFlagProvider {
  initialize(config: { apiKey?: string; userId?: string }): Promise<void>;
  getFlag(key: string): FeatureFlag | undefined;
  getAllFlags(): Record<string, FeatureFlag>;
  identify(userId: string, attributes?: Record<string, unknown>): void;
}

// ============================================================================
// Local Feature Flags (Built-in provider)
// ============================================================================

class LocalFeatureFlagProvider implements FeatureFlagProvider {
  private flags: Record<string, FeatureFlag> = {};
  private userId: string = '';

  async initialize(config: { apiKey?: string; userId?: string }): Promise<void> {
    this.userId = config.userId || '';
    
    // Default feature flags for MegiLance
    this.flags = {
      // UI/UX Features
      'new-dashboard': {
        key: 'new-dashboard',
        enabled: true,
        variant: 'v2',
        rolloutPercentage: 100,
      },
      'dark-mode-auto': {
        key: 'dark-mode-auto',
        enabled: true,
        rolloutPercentage: 100,
      },
      'advanced-search': {
        key: 'advanced-search',
        enabled: true,
        variant: 'ai-powered',
        rolloutPercentage: 50,
      },
      
      // Payment Features
      'instant-payments': {
        key: 'instant-payments',
        enabled: true,
        rolloutPercentage: 25,
      },
      'crypto-payments': {
        key: 'crypto-payments',
        enabled: false,
        rolloutPercentage: 0,
      },
      'escrow-v2': {
        key: 'escrow-v2',
        enabled: true,
        rolloutPercentage: 75,
      },
      
      // Communication Features
      'video-calls': {
        key: 'video-calls',
        enabled: true,
        rolloutPercentage: 100,
      },
      'real-time-notifications': {
        key: 'real-time-notifications',
        enabled: true,
        rolloutPercentage: 100,
      },
      'ai-chat-assist': {
        key: 'ai-chat-assist',
        enabled: true,
        variant: 'gpt-4',
        rolloutPercentage: 30,
      },
      
      // Matching Features
      'ai-matching': {
        key: 'ai-matching',
        enabled: true,
        variant: 'ml-v2',
        rolloutPercentage: 50,
      },
      'skill-verification': {
        key: 'skill-verification',
        enabled: true,
        rolloutPercentage: 100,
      },
      
      // Beta Features
      'beta-analytics': {
        key: 'beta-analytics',
        enabled: false,
        rolloutPercentage: 10,
      },
      'beta-time-tracking': {
        key: 'beta-time-tracking',
        enabled: false,
        rolloutPercentage: 5,
      },
    };
    
    // Try to load from API or localStorage
    try {
      const cached = localStorage.getItem('megilance_feature_flags');
      if (cached) {
        const parsed = JSON.parse(cached);
        this.flags = { ...this.flags, ...parsed };
      }
    } catch {
      // Use defaults
    }
  }

  getFlag(key: string): FeatureFlag | undefined {
    const flag = this.flags[key];
    if (!flag) return undefined;
    
    // Check rollout percentage based on user hash
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const hash = this.hashUserId(this.userId + key);
      const bucket = hash % 100;
      return {
        ...flag,
        enabled: bucket < flag.rolloutPercentage,
      };
    }
    
    return flag;
  }

  getAllFlags(): Record<string, FeatureFlag> {
    const result: Record<string, FeatureFlag> = {};
    for (const key of Object.keys(this.flags)) {
      const flag = this.getFlag(key);
      if (flag) result[key] = flag;
    }
    return result;
  }

  identify(userId: string, attributes?: Record<string, unknown>): void {
    this.userId = userId;
    if (process.env.NODE_ENV === 'development') {
      console.log('[FeatureFlags] Identified user:', userId, attributes);
    }
  }

  private hashUserId(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// ============================================================================
// LaunchDarkly Provider (Enterprise option)
// ============================================================================

class LaunchDarklyProvider implements FeatureFlagProvider {
  private client: unknown = null;
  private flags: Record<string, FeatureFlag> = {};
  private userId: string = '';

  async initialize(config: { apiKey?: string; userId?: string }): Promise<void> {
    if (!config.apiKey) {
      console.warn('[FeatureFlags] LaunchDarkly API key not provided');
      return;
    }

    // Dynamic import for LaunchDarkly
    try {
      const ld = await import('launchdarkly-js-client-sdk');
      this.client = ld.initialize(config.apiKey, {
        key: config.userId || 'anonymous',
        anonymous: !config.userId,
      });
      
      await (this.client as { waitForInitialization: () => Promise<void> }).waitForInitialization();
      if (process.env.NODE_ENV === 'development') {
        console.log('[FeatureFlags] LaunchDarkly initialized');
      }
    } catch (error) {
      console.warn('[FeatureFlags] LaunchDarkly not available, using local flags');
    }
  }

  getFlag(key: string): FeatureFlag | undefined {
    if (!this.client) return undefined;
    
    try {
      type LDClient = { variation: (key: string, defaultValue: boolean) => boolean };
      const value = (this.client as LDClient).variation(key, false);
      return {
        key,
        enabled: value,
      };
    } catch {
      return undefined;
    }
  }

  getAllFlags(): Record<string, FeatureFlag> {
    return this.flags;
  }

  identify(userId: string, attributes?: Record<string, unknown>): void {
    this.userId = userId;
    if (this.client) {
      type LDClient = { identify: (user: { key: string; custom?: Record<string, unknown> }) => void };
      (this.client as LDClient).identify({
        key: userId,
        custom: attributes,
      });
    }
  }
}

// ============================================================================
// Feature Flag Manager
// ============================================================================

class FeatureFlagManager {
  private provider: FeatureFlagProvider;
  private initialized = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Default to local provider
    this.provider = new LocalFeatureFlagProvider();
  }

  async initialize(config: {
    provider?: 'local' | 'launchdarkly';
    apiKey?: string;
    userId?: string;
  } = {}): Promise<void> {
    if (this.initialized) return;

    if (config.provider === 'launchdarkly') {
      this.provider = new LaunchDarklyProvider();
    } else {
      this.provider = new LocalFeatureFlagProvider();
    }

    await this.provider.initialize({
      apiKey: config.apiKey,
      userId: config.userId,
    });

    this.initialized = true;
    this.notifyListeners();
  }

  isEnabled(key: string): boolean {
    const flag = this.provider.getFlag(key);
    return flag?.enabled ?? false;
  }

  getVariant(key: string): string | undefined {
    const flag = this.provider.getFlag(key);
    return flag?.variant;
  }

  getPayload<T = Record<string, unknown>>(key: string): T | undefined {
    const flag = this.provider.getFlag(key);
    return flag?.payload as T | undefined;
  }

  getFlag(key: string): FeatureFlag | undefined {
    return this.provider.getFlag(key);
  }

  getAllFlags(): Record<string, FeatureFlag> {
    return this.provider.getAllFlags();
  }

  identify(userId: string, attributes?: Record<string, unknown>): void {
    this.provider.identify(userId, attributes);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const featureFlags = new FeatureFlagManager();

// ============================================================================
// React Context & Hooks
// ============================================================================

interface FeatureFlagContextValue {
  isEnabled: (key: string) => boolean;
  getVariant: (key: string) => string | undefined;
  getFlag: (key: string) => FeatureFlag | undefined;
  getAllFlags: () => Record<string, FeatureFlag>;
  identify: (userId: string, attributes?: Record<string, unknown>) => void;
  ready: boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

interface FeatureFlagProviderComponentProps {
  children: ReactNode;
  config?: {
    provider?: 'local' | 'launchdarkly';
    apiKey?: string;
    userId?: string;
  };
}

export function FeatureFlagProviderComponent({
  children,
  config,
}: FeatureFlagProviderComponentProps) {
  const [ready, setReady] = useState(false);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    featureFlags.initialize(config).then(() => {
      setReady(true);
    });

    const unsubscribe = featureFlags.subscribe(() => {
      forceUpdate({});
    });

    return unsubscribe;
  }, [config]);

  const value: FeatureFlagContextValue = {
    isEnabled: (key) => featureFlags.isEnabled(key),
    getVariant: (key) => featureFlags.getVariant(key),
    getFlag: (key) => featureFlags.getFlag(key),
    getAllFlags: () => featureFlags.getAllFlags(),
    identify: (userId, attributes) => featureFlags.identify(userId, attributes),
    ready,
  };

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to access feature flags
 */
export function useFeatureFlags(): FeatureFlagContextValue {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    // Return a default implementation for outside provider
    return {
      isEnabled: (key) => featureFlags.isEnabled(key),
      getVariant: (key) => featureFlags.getVariant(key),
      getFlag: (key) => featureFlags.getFlag(key),
      getAllFlags: () => featureFlags.getAllFlags(),
      identify: (userId, attributes) => featureFlags.identify(userId, attributes),
      ready: false,
    };
  }
  return context;
}

/**
 * Hook to check if a specific feature is enabled
 */
export function useFeature(key: string): boolean {
  const { isEnabled, ready } = useFeatureFlags();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (ready) {
      setEnabled(isEnabled(key));
    }
  }, [key, ready, isEnabled]);

  return enabled;
}

/**
 * Hook to get feature variant for A/B testing
 */
export function useFeatureVariant(key: string): { enabled: boolean; variant?: string } {
  const { isEnabled, getVariant, ready } = useFeatureFlags();
  const [state, setState] = useState<{ enabled: boolean; variant?: string }>({
    enabled: false,
    variant: undefined,
  });

  useEffect(() => {
    if (ready) {
      setState({
        enabled: isEnabled(key),
        variant: getVariant(key),
      });
    }
  }, [key, ready, isEnabled, getVariant]);

  return state;
}

// ============================================================================
// Feature Gate Component
// ============================================================================

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  variant?: string;
}

export function FeatureGate({
  feature,
  children,
  fallback = null,
  variant,
}: FeatureGateProps) {
  const { enabled, variant: currentVariant } = useFeatureVariant(feature);

  if (!enabled) {
    return <>{fallback}</>;
  }

  if (variant && currentVariant !== variant) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================================================
// A/B Test Component
// ============================================================================

interface ABTestProps {
  feature: string;
  variants: Record<string, ReactNode>;
  defaultVariant?: ReactNode;
}

export function ABTest({ feature, variants, defaultVariant = null }: ABTestProps) {
  const { enabled, variant } = useFeatureVariant(feature);

  if (!enabled || !variant) {
    return <>{defaultVariant}</>;
  }

  return <>{variants[variant] || defaultVariant}</>;
}

export default featureFlags;
