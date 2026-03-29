// @AI-HINT: Offline fallback page for PWA
'use client';

import React from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 text-center">
      <div className="bg-card w-full max-w-md p-8 rounded-xl shadow-lg border border-border flex flex-col items-center gap-6">
        <div className="bg-muted p-4 rounded-full">
          <WifiOff size={48} className="text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">You're Offline</h1>
          <p className="text-muted-foreground">
            It looks like you've lost your internet connection. Some features of MegiLance may be unavailable until you reconnect.
          </p>
        </div>
        
        <div className="pt-4 border-t border-border w-full flex justify-center">
          <button 
            type="button"
            onClick={() => typeof window !== 'undefined' && window.location.reload()}
            className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
