import React from 'react';
import FreelancerLeaderboard from '@/app/components/organisms/Gamification/FreelancerLeaderboard';

export default function RankPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Global Rankings</h1>
      <p style={{ marginBottom: '2rem', opacity: 0.8 }}>Top freelancers computed from the matching engine telemetry.</p>
      <FreelancerLeaderboard timeframe="monthly" />
    </div>
  );
}
