// @AI-HINT: Loading UI for auth routes (login, signup, etc.)
// Uses Next.js loading.js file convention for instant Suspense boundaries
import styles from './AuthShared.module.css';

export default function AuthLoading() {
  return (
    <div
      className={styles.centered}
      role="status"
      aria-label="Loading authentication page"
    >
      <p className={styles.loadingText}>Loading...</p>
    </div>
  );
}
