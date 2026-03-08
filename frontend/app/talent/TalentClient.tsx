// @AI-HINT: Public talent directory page - fetches real freelancer data from API.
// Production-ready: No mock data, connects to /api/freelancers
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/app/components/Animations';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';

import { getAuthToken } from '@/lib/api';
import commonStyles from './TalentDirectory.common.module.css';
import lightStyles from './TalentDirectory.light.module.css';
import darkStyles from './TalentDirectory.dark.module.css';

interface TalentProfile { 
  id: string; 
  name: string; 
  role: string; 
  rank: number; 
  skills: string[]; 
  avatar: string; 
}

// API helper
async function fetchFreelancers(): Promise<TalentProfile[]> {
  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  try {
    const res = await fetch('/api/freelancers?limit=20', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    const data = await res.json();
    // Map API response to TalentProfile format
    return (data.freelancers || data || []).map((f: any, idx: number) => ({
      id: String(f.id || idx),
      name: f.full_name || f.name || `Freelancer ${idx + 1}`,
      role: f.title || f.headline || 'Freelancer',
      rank: f.ai_score || Math.floor(f.rating * 20) || 0,
      skills: f.skills || [],
      avatar: f.profile_image_url || f.avatar_url || `https://i.pravatar.cc/120?img=${idx + 10}`,
    }));
  } catch (err) {
    console.error('[TalentClient] Failed to fetch freelancers:', err);
    return [];
  }
}

const TalentDirectoryPage = () => {
  const { resolvedTheme } = useTheme();
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<TalentProfile[]>([]);
  
  const loadProfiles = useCallback(async () => {
    setLoading(true);
    const data = await fetchFreelancers();
    setProfiles(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);
  
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    main: cn(commonStyles.main, themeStyles.main),
    header: commonStyles.header,
    title: cn(commonStyles.title, themeStyles.title),
    subtitle: cn(commonStyles.subtitle, themeStyles.subtitle),
    searchWrapper: commonStyles.searchWrapper,
    searchInput: cn(commonStyles.searchInput, themeStyles.searchInput),
    grid: commonStyles.grid,
    card: cn(commonStyles.card, themeStyles.card),
    cardHeader: commonStyles.cardHeader,
    avatar: commonStyles.avatar,
    profileInfo: commonStyles.profileInfo,
    name: cn(commonStyles.name, themeStyles.name),
    role: cn(commonStyles.role, themeStyles.role),
    rankBadge: cn(commonStyles.rankBadge, themeStyles.rankBadge),
    skillsWrapper: commonStyles.skillsWrapper,
    skillTag: cn(commonStyles.skillTag, themeStyles.skillTag),
    viewProfileBtn: cn(commonStyles.viewProfileBtn, themeStyles.viewProfileBtn),
    emptyState: cn(commonStyles.emptyState, themeStyles.emptyState),
  };
  
  const filtered = profiles.filter(m => 
    !q || 
    m.name.toLowerCase().includes(q.toLowerCase()) || 
    m.skills.some(s => s.toLowerCase().includes(q.toLowerCase()))
  );


  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="blue" size={450} blur={90} opacity={0.1} className="absolute top-[-10%] left-[-10%]" />
        <AnimatedOrb variant="purple" size={380} blur={70} opacity={0.08} className="absolute bottom-[-10%] right-[-10%]" />
        <ParticlesSystem count={12} className="absolute inset-0" />
        <div className="absolute top-24 right-16 opacity-10">
          <FloatingCube size={55} />
        </div>
        <div className="absolute bottom-40 left-12 opacity-10">
          <FloatingSphere size={45} />
        </div>
      </div>
    <main className={styles.main}>
      <ScrollReveal>
      <header className={styles.header}>
        <h1 className={styles.title}>Explore Top Talent</h1>
        <p className={styles.subtitle}>Discover AI-ranked freelancers for your projects.</p>
        <div className={styles.searchWrapper}>
          <input
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="Search by name or skill..."
            className={styles.searchInput}
            aria-label="Search talent"
          />
        </div>
      </header>
      </ScrollReveal>
      {loading ? (
        <div className={commonStyles.loadingCenter}>
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <ul className={styles.grid} role="list">
          {filtered.map(p => (
            <li key={p.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <Image src={p.avatar} alt={p.name} className={styles.avatar} width={56} height={56} />
                <div className={styles.profileInfo}>
                  <h3 className={styles.name}>{p.name}</h3>
                  <p className={styles.role}>{p.role}</p>
                </div>
                {p.rank > 0 && <span className={styles.rankBadge}>Score {p.rank}</span>}
              </div>
              <div className={styles.skillsWrapper}>
                {p.skills.slice(0, 5).map(s => <span key={s} className={styles.skillTag}>{s}</span>)}
              </div>
              <Link href={`/freelancers/${p.id}`} className={styles.viewProfileBtn}>
                View Profile
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className={styles.emptyState}>
              {profiles.length === 0 ? 'No freelancers available yet.' : 'No matches for your search.'}
            </li>
          )}
        </ul>
      )}
    </main>
    </PageTransition>
  );
};

// Wrap the component to prevent SSR issues
const WrappedTalentDirectoryPage = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <TalentDirectoryPage />;
};

export default WrappedTalentDirectoryPage;