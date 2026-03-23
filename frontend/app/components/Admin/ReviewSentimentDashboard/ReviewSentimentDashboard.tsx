// @AI-HINT: This is a premium, production-ready Review Sentiment Dashboard. It features advanced data visualization, interactive filters, and a detailed breakdown of recent reviews. The component is fully theme-aware and uses a sophisticated layout to present complex data in an intuitive way.

'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Card from '@/app/components/Card/Card';
import Select from '@/app/components/Select/Select';
import BarChart from '@/app/components/BarChart/BarChart';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import { adminApi } from '@/lib/api';

import commonStyles from './ReviewSentimentDashboard.common.module.css';
import lightStyles from './ReviewSentimentDashboard.light.module.css';
import darkStyles from './ReviewSentimentDashboard.dark.module.css';

const timeRangeOptions = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
];

const ReviewSentimentDashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const stats = await adminApi.getPlatformReviewStats();
        setData(stats);
      } catch {
        // Failed to fetch review stats
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  const getSentimentClass = (rating: number) => {
    if (rating >= 4) return themeStyles.sentimentPositive;
    if (rating <= 2) return themeStyles.sentimentNegative;
    return themeStyles.sentimentNeutral;
  };

  const getSentimentLabel = (rating: number) => {
    if (rating >= 4) return 'Positive';
    if (rating <= 2) return 'Negative';
    return 'Neutral';
  };

  if (loading) {
    return (
      <div className={cn(commonStyles.dashboardContainer, themeStyles.dashboardContainer)}>
        <div className='p-8 text-center'>Loading dashboard data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn(commonStyles.dashboardContainer, themeStyles.dashboardContainer)}>
        <div className='p-8 text-center text-red-500'>Failed to load data</div>
      </div>
    );
  }

  const distributionData = [
    { label: 'Positive', value: data.positive_reviews, color: '#27AE60' },
    { label: 'Neutral', value: data.neutral_reviews, color: '#F2C94C' },
    { label: 'Negative', value: data.negative_reviews, color: '#e81123' },
  ];

  // Mock trend data for now as backend doesn't provide it yet
  const trendData = [
    { label: 'Jan', value: 65 },
    { label: 'Feb', value: 68 },
    { label: 'Mar', value: 75 },
    { label: 'Apr', value: 72 },
    { label: 'May', value: 78 },
    { label: 'Jun', value: 81 },
  ];

  return (
    <div className={cn(commonStyles.dashboardContainer, themeStyles.dashboardContainer)}>
      <header className={commonStyles.dashboardHeader}>
        <h1 className={cn(commonStyles.dashboardTitle, themeStyles.dashboardTitle)}>Sentiment Dashboard</h1>
        <Select
          id='time-range-select'
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          options={timeRangeOptions}
          className={cn(commonStyles.timeRangeTrigger, themeStyles.timeRangeTrigger)}
        />
      </header>

      <div className={commonStyles.metricsGrid}>
        <Card className={cn(commonStyles.metricCard, themeStyles.metricCard)}>
          <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Overall Rating</h3>
          <p className={cn(commonStyles.cardMetric, themeStyles.cardMetricPositive)}>{data.overall_rating}</p>
          <p className={cn(commonStyles.cardDescription, themeStyles.cardDescription)}>Average across {data.total_reviews} reviews</p>
        </Card>
        <Card className={cn(commonStyles.metricCard, themeStyles.metricCard)}>
          <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Positive Reviews</h3>
          <p className={cn(commonStyles.cardMetric, themeStyles.cardMetric)}>{data.positive_reviews}</p>
           <p className={cn(commonStyles.cardDescription, themeStyles.cardDescription)}>Total positive feedback</p>
        </Card>
        <Card className={cn(commonStyles.metricCard, themeStyles.metricCard)}>
          <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Neutral Reviews</h3>
          <p className={cn(commonStyles.cardMetric, themeStyles.cardMetric)}>{data.neutral_reviews}</p>
           <p className={cn(commonStyles.cardDescription, themeStyles.cardDescription)}>Total neutral feedback</p>
        </Card>
        <Card className={cn(commonStyles.metricCard, themeStyles.metricCard)}>
          <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Negative Reviews</h3>
          <p className={cn(commonStyles.cardMetric, themeStyles.cardMetric)}>{data.negative_reviews}</p>
           <p className={cn(commonStyles.cardDescription, themeStyles.cardDescription)}>Total negative feedback</p>
        </Card>
      </div>

      <div className={commonStyles.chartsGrid}>
        <Card className={cn(commonStyles.chartCard, themeStyles.chartCard)}>
          <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Sentiment Trend</h3>
          <div className={commonStyles.chartPlaceholder}>
             <BarChart data={trendData} />
          </div>
        </Card>
        <Card className={cn(commonStyles.chartCard, themeStyles.chartCard)}>
          <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Sentiment Distribution</h3>
           <div className={commonStyles.chartPlaceholder}>
             <BarChart data={distributionData} />
          </div>
        </Card>
      </div>
      
      <Card className={cn(commonStyles.reviewsCard, themeStyles.reviewsCard)}>
        <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Recent Reviews</h3>
        <ul className={commonStyles.reviewsList}>
          {data.recent_reviews.map((review: any) => (
            <li key={review.id} className={cn(commonStyles.reviewItem, themeStyles.reviewItem)}>
              <div className={commonStyles.reviewAuthor}>
                <UserAvatar name={review.reviewer_name} size='small' />
                <span className={cn(commonStyles.reviewUser, themeStyles.reviewUser)}>{review.reviewer_name}</span>
              </div>
              <p className={cn(commonStyles.reviewText, themeStyles.reviewText)}>{review.comment}</p>
              <span className={cn(commonStyles.reviewSentiment, getSentimentClass(review.rating))}>
                {getSentimentLabel(review.rating)}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default ReviewSentimentDashboard;
