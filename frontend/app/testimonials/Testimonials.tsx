// @AI-HINT: Testimonials page fetching real reviews from API, with theme-aware styling, animated sections, and accessible structure.
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import common from './Testimonials.common.module.css';
import light from './Testimonials.light.module.css';
import dark from './Testimonials.dark.module.css';

const ALL = 'All';
const categories = [ALL, 'Clients', 'Freelancers', 'Enterprise'];

interface ReviewData {
  name: string;
  role: string;
  category: string;
  quote: string;
  avatar: string;
}

const Testimonials: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  const [selected, setSelected] = useState<string>(ALL);
  const [testimonials, setTestimonials] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/v1/reviews?limit=20');
        if (res.ok) {
          const data = await res.json();
          const reviews = (data.reviews || data || []);
          setTestimonials(reviews.map((r: any) => {
            const role = r.reviewer_role || r.reviewer?.title || 'MegiLance User';
            let category = 'Freelancers';
            if (r.reviewer_type === 'client' || role.toLowerCase().includes('founder') || role.toLowerCase().includes('ceo') || role.toLowerCase().includes('manager')) {
              category = 'Clients';
            }
            if (role.toLowerCase().includes('enterprise') || role.toLowerCase().includes('vp') || role.toLowerCase().includes('director')) {
              category = 'Enterprise';
            }
            return {
              name: r.reviewer_name || r.reviewer?.name || 'Verified User',
              role,
              category,
              quote: r.review_text || r.comment || r.text || '',
              avatar: r.reviewer_avatar || r.reviewer?.avatar_url || '',
            };
          }));
        }
      } catch {
        // No reviews available yet
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const filtered = useMemo(
    () => (selected === ALL ? testimonials : testimonials.filter((t) => t.category === selected)),
    [selected, testimonials]
  );

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
         <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
         <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
         <ParticlesSystem count={15} className="absolute inset-0" />
         <div className="absolute top-20 left-10 opacity-10 animate-float-slow">
           <FloatingCube size={40} />
         </div>
         <div className="absolute bottom-40 right-20 opacity-10 animate-float-medium">
           <FloatingSphere size={30} variant="gradient" />
         </div>
      </div>

      <main id="main-content" role="main" aria-labelledby="testimonials-title" className={cn(common.page, themed.page)}>
        <div className={common.container}>
          <ScrollReveal>
            <header className={cn(common.header, themed.header)}>
              <h1 id="testimonials-title" className={cn(common.title, themed.title)}>What Our Users Say</h1>
              <p className={cn(common.subtitle, themed.subtitle)}>Real stories from clients, freelancers, and enterprise partners.</p>
            </header>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div
              className={common.controls}
              role="toolbar"
              aria-label="Filter testimonials by category"
            >
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(common.chip, themed.chip, selected === c && common.active)}
                  aria-pressed={selected === c || undefined}
                  onClick={() => setSelected(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </ScrollReveal>

          <section aria-label="Testimonials">
            {loading ? (
              <div className={common.grid}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ height: 200, borderRadius: 12, opacity: 0.08, background: 'currentColor' }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', opacity: 0.6 }}>
                <p>No reviews yet{selected !== ALL ? ` in ${selected}` : ''}. Be the first to share your experience!</p>
              </div>
            ) : (
            <motion.div layout className={common.grid}>
              <AnimatePresence mode="popLayout">
                {filtered.map((t, idx) => (
                  <motion.figure
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    key={`${t.name}-${idx}`}
                    className={cn(common.card, themed.card)}
                  >
                    <div className={common.quoteWrapper}>
                      <Quote className={cn(common.quoteIcon, themed.quoteIcon)} aria-hidden="true" />
                      <blockquote className={cn(common.quote, themed.quote)}>“{t.quote}”</blockquote>
                    </div>
                    <figcaption className={cn(common.person, themed.person)}>
                      {t.avatar ? (
                        <Image
                          className={common.avatar}
                          src={t.avatar}
                          alt={`${t.name} avatar`}
                          width={48}
                          height={48}
                          loading="lazy"
                        />
                      ) : (
                        <span className={common.avatar} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: 'var(--color-primary, #4573df)', color: '#fff', fontWeight: 600, fontSize: 16 }}>
                          {t.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      )}
                      <div className={common.personDetails}>
                        <div className={cn(common.name, themed.name)}>{t.name}</div>
                        <div className={cn(common.role, themed.role)}>{t.role}</div>
                      </div>
                    </figcaption>
                  </motion.figure>
                ))}
              </AnimatePresence>
            </motion.div>
            )}
          </section>

          <ScrollReveal>
            <section className={cn(common.ctaSection, themed.ctaSection)} aria-label="Call to action">
              <div className={cn(common.cta, themed.cta)}>
                <h2 className={cn(common.ctaTitle, themed.ctaTitle)}>Ready to build your masterpiece?</h2>
                <div className={common.buttonGroup}>
                  <Link href="/signup/client">
                    <Button size="lg" variant="primary">Join as a Client</Button>
                  </Link>
                  <Link href="/signup/freelancer">
                    <Button size="lg" variant="secondary">Apply as Talent</Button>
                  </Link>
                </div>
              </div>
            </section>
          </ScrollReveal>
        </div>
      </main>
    </PageTransition>
  );
};

export default Testimonials;
