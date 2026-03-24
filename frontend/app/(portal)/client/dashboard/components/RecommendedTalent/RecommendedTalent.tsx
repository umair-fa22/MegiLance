// @AI-HINT: Widget displaying AI-recommended freelancers based on client's project history.
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Card from '@/app/components/Card/Card';
import { Sparkles } from 'lucide-react';
import Button from '@/app/components/Button/Button';
import { matchingApi as _matchingApi } from '@/lib/api';
const matchingApi: any = _matchingApi;
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';
import AIMatchCard, { FreelancerMatchData } from '@/app/components/AI/AIMatchCard/AIMatchCard';

import common from './RecommendedTalent.common.module.css';
import light from './RecommendedTalent.light.module.css';
import dark from './RecommendedTalent.dark.module.css';

const RecommendedTalent: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const [talents, setTalents] = useState<FreelancerMatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<string>('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await matchingApi.getRecommendations();
        if (response && response.recommendations) {
          const mappedTalents: FreelancerMatchData[] = response.recommendations.map((rec: any) => {
            const factors = rec.match_factors || {};
            const reasons: string[] = [];
            if (factors.skill_match > 0.5) reasons.push('Skills align with project');
            if (factors.avg_rating > 0.7) reasons.push('Highly rated by clients');
            if (factors.success_rate > 0.7) reasons.push('High project success rate');
            if (factors.availability > 0.5) reasons.push('Available now');
            if (factors.budget_match > 0.5) reasons.push('Budget compatible');
            if (reasons.length === 0) reasons.push('Strong overall match');

            return {
              id: String(rec.freelancer_id),
              name: rec.freelancer_name,
              title: rec.freelancer_bio ? rec.freelancer_bio.substring(0, 30) + '...' : 'Freelancer',
              avatarUrl: rec.profile_image_url || '',
              matchScore: Math.round((rec.match_score || 0) * 100),
              skills: rec.match_factors?.skill_match ? ['High Skill Match'] : ['Top Rated'],
              hourlyRate: rec.hourly_rate || 0,
              rating: factors.avg_rating ? factors.avg_rating * 5 : undefined,
              confidenceLevel: rec.match_score ? Math.round(rec.match_score * 100) : undefined,
              matchReasons: reasons,
            };
          });
          setTalents(mappedTalents);
          setContext(response.context || '');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch recommendations:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <Card 
      title="AI Recommended Talent" 
      icon={Sparkles}
      className={common.widget}
    >
      {context && (
        <div className="mb-3 text-xs text-gray-500 dark:text-gray-400 italic">
          {context}
        </div>
      )}
      
      <div className={common.list}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn(common.card, themed.card)}>
              <Skeleton width={48} height={48} className="rounded-full" />
              <div className="flex-1 ml-3">
                <Skeleton width="60%" height={16} className="mb-2" />
                <Skeleton width="40%" height={12} />
              </div>
            </div>
          ))
        ) : talents.length > 0 ? (
          talents.map((talent) => (
            <div key={talent.id} className="mb-4 last:mb-0">
              <AIMatchCard 
                freelancer={talent} 
                compact={true}
                showActions={true}
                onViewProfile={(id) => router.push(`/freelancers/${id}`)}
              />
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            No recommendations available yet.
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <Link href="/freelancers">
          <Button variant="ghost" size="sm">View All</Button>
        </Link>
      </div>
    </Card>
  );
};

export default RecommendedTalent;
