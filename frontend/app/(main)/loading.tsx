// @AI-HINT: Loading UI for public marketing routes
// Uses Next.js loading.js convention for instant Suspense boundaries
import MegaLoader from '../components/Loading/MegaLoader';

export default function MainLoading() {
  return <MegaLoader message="Loading" subMessage="Just a moment..." />;
}
