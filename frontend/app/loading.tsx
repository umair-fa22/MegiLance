/* AI-HINT: Global loading UI for Next.js App Router. Pure-frontend, brand-aligned. */
import MegaLoader from './components/Loading/MegaLoader';

export default function Loading() {
  // AI-HINT: Keep default (auto) theme; supply explicit theme if needed.
  return <MegaLoader message="Loading MegiLance" subMessage="Bringing everything to you in a flash" />;
}
