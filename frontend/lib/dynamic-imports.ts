// @AI-HINT: Dynamic imports for heavy components using next/dynamic
// Vercel best practice: Lazy load large client components to reduce initial JS bundle
// https://nextjs.org/docs/app/guides/lazy-loading
import dynamic from 'next/dynamic';

/**
 * 3D Components - Heavy (Three.js: ~500KB)
 * Only load when actually needed on the page
 */
export const DynamicAnimatedOrb = dynamic(
  () => import('@/app/components/3D').then((mod) => mod.AnimatedOrb),
  { ssr: false }
);

export const DynamicParticlesSystem = dynamic(
  () => import('@/app/components/3D').then((mod) => mod.ParticlesSystem),
  { ssr: false }
);

export const DynamicFloatingCube = dynamic(
  () => import('@/app/components/3D').then((mod) => mod.FloatingCube),
  { ssr: false }
);

export const DynamicFloatingSphere = dynamic(
  () => import('@/app/components/3D').then((mod) => mod.FloatingSphere),
  { ssr: false }
);

/**
 * Chart Components - Heavy (Chart.js + Recharts: ~300KB)
 * Only load when dashboard/analytics views are active
 */
export const DynamicBarChart = dynamic(
  () => import('@/app/components/molecules/BarChart/BarChart'),
  { ssr: false }
);

export const DynamicPieChart = dynamic(
  () => import('@/app/components/molecules/PieChart/PieChart'),
  { ssr: false }
);

/**
 * Video Call Component - Heavy (WebRTC + peer: ~200KB)
 * Only load when entering a video call
 */
export const DynamicVideoCall = dynamic(
  () => import('@/app/components/molecules/VideoCall/VideoCall'),
  { ssr: false }
);

/**
 * Globe Component - Heavy (react-globe.gl + Three.js)
 * Only load on pages that show the globe
 */
export const DynamicGlobe = dynamic(
  () => import('react-globe.gl').then((mod) => mod.default),
  { ssr: false }
);

/**
 * QR Code Component - Medium (~50KB)
 */
export const DynamicQRCode = dynamic(
  () => import('qrcode.react').then((mod) => mod.QRCodeSVG),
  { ssr: false }
);

/**
 * Webcam Component - Medium (~40KB)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DynamicWebcam = dynamic<any>(
  () => import('react-webcam').then((mod) => mod.default),
  { ssr: false }
);
