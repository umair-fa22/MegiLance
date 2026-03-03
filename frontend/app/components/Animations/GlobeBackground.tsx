// @AI-HINT: Animated 3D globe background component for hero sections using dynamic import
'use client';

import React, { Component, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import commonStyles from './GlobeBackground.common.module.css';

// Dynamically import Globe to avoid SSR issues with Three.js
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

// Error boundary to prevent Three.js crashes from breaking the page
class GlobeSafeBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? null : this.props.children; }
}

/** Returns true when the globe should NOT render (reduced-motion or low-end device). */
function shouldSkipGlobe(): boolean {
  if (typeof window === 'undefined') return false;
  // Respect prefers-reduced-motion
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true;
  // Skip on low-end devices (≤2 logical cores or ≤4 GB RAM)
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return true;
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) return true;
  return false;
}

const GlobeBackground = () => {
  const globeEl = useRef<any>(null);
  const { resolvedTheme } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (shouldSkipGlobe()) return;
    // Defer globe initialization until the main thread is idle to avoid hurting LCP
    const id = 'requestIdleCallback' in window
      ? (window as any).requestIdleCallback(() => setReady(true), { timeout: 3000 })
      : setTimeout(() => setReady(true), 1500);
    return () => {
      if ('cancelIdleCallback' in window) (window as any).cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.controls().enableZoom = false;
    }
  }, [ready]);

  if (!ready) return null;

  // Theme-based colors
  const isDark = resolvedTheme === 'dark';
  const globeColor = isDark ? '#1a202c' : '#f7fafc';
  const atmosphereColor = isDark ? '#4573df' : '#3182ce';
  const arcColor = isDark ? ['#ff9800', '#e81123'] : ['#4573df', '#27AE60'];

  // Sample data for arcs (connecting hubs)
  const arcsData = [
    { startLat: 40.7128, startLng: -74.0060, endLat: 51.5074, endLng: -0.1278 }, // NY to London
    { startLat: 51.5074, startLng: -0.1278, endLat: 28.6139, endLng: 77.2090 }, // London to Delhi
    { startLat: 28.6139, startLng: 77.2090, endLat: 35.6762, endLng: 139.6503 }, // Delhi to Tokyo
    { startLat: 35.6762, startLng: 139.6503, endLat: -33.8688, endLng: 151.2093 }, // Tokyo to Sydney
    { startLat: -33.8688, startLng: 151.2093, endLat: 37.7749, endLng: -122.4194 }, // Sydney to SF
    { startLat: 37.7749, startLng: -122.4194, endLat: 40.7128, endLng: -74.0060 }, // SF to NY
  ];

  return (
    <GlobeSafeBoundary>
    <div className={commonStyles.canvasWrapper}>
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        width={window.innerWidth}
        height={window.innerHeight}
        arcsData={arcsData}
        arcColor={() => arcColor}
        arcDashLength={0.4}
        arcDashGap={4}
        arcDashInitialGap={() => Math.random() * 5}
        arcDashAnimateTime={1000}
        atmosphereColor={atmosphereColor}
        atmosphereAltitude={0.15}
      />
    </div>
    </GlobeSafeBoundary>
  );
};

export default GlobeBackground;
