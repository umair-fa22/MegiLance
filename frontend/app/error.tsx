// @AI-HINT: Global error boundary page for Next.js App Router — catches runtime errors
'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        gap: '1rem',
      }}
    >
      <h1 style={{ fontSize: '3rem', fontWeight: 700 }}>500</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 500 }}>Something went wrong</h2>
      <p style={{ maxWidth: '28rem', opacity: 0.7 }}>
        An unexpected error occurred. Please try again or return to the homepage.
      </p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button
          onClick={reset}
          style={{
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            background: '#4573df',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Try Again
        </button>
        <Link
          href="/"
          style={{
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            border: '1px solid #ccc',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
