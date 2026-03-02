// @AI-HINT: 3D Earth globe decoration for the PublicFooter using react-globe.gl
'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';

import darkStyles from './FooterGlobe.dark.module.css';
import lightStyles from './FooterGlobe.light.module.css';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

const GLOBE_SIZE = 550;

const arcsData = [
  { startLat: 40.7128, startLng: -74.006, endLat: 51.5074, endLng: -0.1278 },
  { startLat: 51.5074, startLng: -0.1278, endLat: 28.6139, endLng: 77.209 },
  { startLat: 28.6139, startLng: 77.209, endLat: 35.6762, endLng: 139.6503 },
  { startLat: 35.6762, startLng: 139.6503, endLat: -33.8688, endLng: 151.2093 },
  { startLat: -33.8688, startLng: 151.2093, endLat: 37.7749, endLng: -122.4194 },
  { startLat: 37.7749, startLng: -122.4194, endLat: 40.7128, endLng: -74.006 },
];

const wrapperStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  pointerEvents: 'none',
  zIndex: 0,
};

const FooterGlobe: React.FC = () => {
  const globeEl = useRef<any>(null);
  const { resolvedTheme } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 1024) return;

    const id =
      'requestIdleCallback' in window
        ? (window as any).requestIdleCallback(() => setReady(true), { timeout: 3000 })
        : setTimeout(() => setReady(true), 1500);
    return () => {
      if ('cancelIdleCallback' in window) (window as any).cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      const ctrl = globeEl.current.controls();
      ctrl.autoRotate = true;
      ctrl.autoRotateSpeed = 0.5;
      ctrl.enableZoom = false;
      ctrl.enablePan = false;
      ctrl.enableRotate = false;
    }
  }, [ready]);

  if (!ready) return null;

  const isDark = resolvedTheme === 'dark';
  if (!isDark) return null; // Globe only works on dark backgrounds

  const themeStyles = darkStyles;
  const atmosphereColor = '#4573df';
  const arcColor: [string, string] = ['#ff9800', '#e81123'];

  return (
    <div className={themeStyles.globeWrapper} style={{ ...wrapperStyle, opacity: 0.7 }} aria-hidden="true" data-globe="v4">
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        width={GLOBE_SIZE}
        height={GLOBE_SIZE}
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
  );
};

export default FooterGlobe;
