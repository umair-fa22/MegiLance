// @AI-HINT: "AI-Powered Features" section showing MegiLance's actual deployed AI capabilities with honest status indicators.

'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  BrainCircuit,
  TrendingUp,
  ShieldCheck,
  MessageCircle,
  Zap,
  Sparkles,
  ArrowRight,
  FileText,
  Search,
  CheckCircle2,
} from 'lucide-react';

import commonStyles from './PoweredByAI.common.module.css';
import lightStyles from './PoweredByAI.light.module.css';
import darkStyles from './PoweredByAI.dark.module.css';
import SectionGlobe from '@/app/components/Animations/SectionGlobe/SectionGlobe';

// --- SVG Logo Components for Tech Stack (Actual technologies used) ---
const HuggingFaceIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 1.5a8.5 8.5 0 110 17 8.5 8.5 0 010-17zm-3.5 6a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zm7 0a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zM12 13c-2.5 0-4 1.5-4 3h8c0-1.5-1.5-3-4-3z" fill="currentColor"/>
  </svg>
);

const FastAPIIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.375 0 0 5.375 0 12c0 6.627 5.375 12 12 12 6.626 0 12-5.373 12-12 0-6.625-5.373-12-12-12zm-.624 21.62v-7.528H7.19L13.203 2.38v7.528h4.029L11.376 21.62z" fill="currentColor"/>
  </svg>
);

const PythonIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05z" fill="currentColor"/>
  </svg>
);

const TursoIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

const NextJSIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727z" fill="currentColor"/>
  </svg>
);

const SentenceTransformersIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
  </svg>
);

interface AIFeature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  metric: string;
  metricValue: string;
  variant: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal' | 'pink';
  status: 'live' | 'beta' | 'smart';
  endpoint: string;
}

const aiFeatures: AIFeature[] = [
  {
    id: 'matching',
    icon: <BrainCircuit />,
    title: 'Smart Job Matching',
    description:
      'Skill-based matching algorithm analyzes your expertise and compares it with project requirements for accurate job recommendations.',
    metric: 'Algorithm',
    metricValue: 'Skill Overlap',
    variant: 'blue',
    status: 'live',
    endpoint: '/api/ai/match-freelancers/{project_id}'
  },
  {
    id: 'pricing',
    icon: <TrendingUp />,
    title: 'Price Estimation',
    description:
      'Data-driven pricing based on category averages, complexity multipliers, and market rates from completed projects in our database.',
    metric: 'Data Source',
    metricValue: 'Market Rates',
    variant: 'green',
    status: 'live',
    endpoint: '/api/ai/estimate-price'
  },
  {
    id: 'fraud',
    icon: <ShieldCheck />,
    title: 'Fraud Detection',
    description:
      'Multi-layer protection with keyword analysis, pattern detection, and risk scoring for users, projects, and proposals.',
    metric: 'Coverage',
    metricValue: 'Full Stack',
    variant: 'red',
    status: 'live',
    endpoint: '/api/ai/fraud-check'
  },
  {
    id: 'chatbot',
    icon: <MessageCircle />,
    title: 'AI Chatbot',
    description:
      'Intelligent assistant that helps with platform navigation, pricing queries, freelancer recommendations, and general support.',
    metric: 'Response',
    metricValue: 'Instant',
    variant: 'purple',
    status: 'live',
    endpoint: '/api/ai/chat'
  },
  {
    id: 'embeddings',
    icon: <Search />,
    title: 'Semantic Search',
    description:
      'Vector embeddings for semantic similarity matching, powered by sentence-transformers (all-MiniLM-L6-v2) with 384 dimensions.',
    metric: 'Dimensions',
    metricValue: '384',
    variant: 'teal',
    status: 'beta',
    endpoint: '/ai/embeddings'
  },
  {
    id: 'proposals',
    icon: <FileText />,
    title: 'Proposal Generator',
    description:
      'Professional proposal templates generated based on project context, using intelligent templating for high-quality cover letters.',
    metric: 'Quality',
    metricValue: 'Professional',
    variant: 'orange',
    status: 'live',
    endpoint: '/ai/generate'
  },
  {
    id: 'sentiment',
    icon: <Sparkles />,
    title: 'Sentiment Analysis',
    description:
      'Analyze text sentiment for reviews and feedback using keyword-based classification with positive/negative/neutral labels.',
    metric: 'Classification',
    metricValue: '3 Classes',
    variant: 'pink',
    status: 'live',
    endpoint: '/ai/sentiment'
  },
];

const techStackData = [
  { name: 'Hugging Face', type: 'AI Hosting', Icon: HuggingFaceIcon },
  { name: 'FastAPI', type: 'AI Backend', Icon: FastAPIIcon },
  { name: 'Python', type: 'ML Engine', Icon: PythonIcon },
  { name: 'Sentence Transformers', type: 'Embeddings', Icon: SentenceTransformersIcon },
  { name: 'Turso', type: 'Edge Database', Icon: TursoIcon },
  { name: 'Next.js', type: 'Frontend', Icon: NextJSIcon },
];

interface FeatureCardProps {
  feature: AIFeature;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  themeStyles: any;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  feature,
  isHovered,
  onHover,
  themeStyles,
}) => {
  const variantClass = `variant${feature.variant.charAt(0).toUpperCase() + feature.variant.slice(1)}`;

  const statusConfig = {
    live: { label: 'Live', className: commonStyles.statusLive },
    beta: { label: 'Beta', className: commonStyles.statusBeta },
    smart: { label: 'Smart Rules', className: commonStyles.statusSmart },
  };

  const currentStatus = statusConfig[feature.status];

  return (
    <div
      className={commonStyles.featureCardWrapper}
      onMouseEnter={() => onHover(feature.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        className={cn(
          commonStyles.featureCard,
          commonStyles[variantClass as keyof typeof commonStyles],
          themeStyles.featureCard,
          isHovered && commonStyles.featureCardHovered
        )}
      >
        {/* Gradient Accent Line */}
        <div className={commonStyles.accentLine} />

        {/* Status Badge */}
        <div className={cn(commonStyles.statusBadge, currentStatus.className)}>
          <CheckCircle2 size={12} />
          <span>{currentStatus.label}</span>
        </div>

        {/* Icon */}
        <div className={cn(commonStyles.iconWrapper, commonStyles[variantClass as keyof typeof commonStyles])}>
          {feature.icon}
        </div>

        {/* Metric Badge */}
        <div className={commonStyles.metricBadge}>
          <span className={commonStyles.metricValue}>{feature.metricValue}</span>
          <span className={commonStyles.metricLabel}>{feature.metric}</span>
        </div>

        {/* Content */}
        <div className={commonStyles.cardContent}>
          <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>
            {feature.title}
          </h3>
          <p className={cn(commonStyles.cardDescription, themeStyles.cardDescription)}>
            {feature.description}
          </p>
          {/* API Endpoint hint */}
          <code className={commonStyles.endpointHint}>{feature.endpoint}</code>
        </div>

        {/* CTA Arrow (Visible on Hover) */}
        <div className={cn(commonStyles.ctaArrow, isHovered && commonStyles.ctaArrowVisible)}>
          <ArrowRight size={20} />
        </div>
      </div>
    </div>
  );
};

const PoweredByAI: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <section className={cn(commonStyles.section, themeStyles.section)}>
      {/* Background Animation */}
      <div className={commonStyles.backgroundElements}>
        <div className={commonStyles.gradientOrb1} />
        <div className={commonStyles.gradientOrb2} />
        <div className={commonStyles.gradientOrb3} />
      </div>
      <SectionGlobe variant="purple" size="md" position="right" />

      <div className={commonStyles.container}>
        {/* Section Header */}
        <div className={cn(commonStyles.header, themeStyles.header)}>
          <div className={cn(commonStyles.badge, themeStyles.badge)}>
            <Sparkles size={16} />
            <span>AI-Powered Platform</span>
          </div>

          <h2 className={cn(commonStyles.heading, themeStyles.heading)}>
            Smart Features
            <br />
            <span className={commonStyles.highlightText}>Research Implementation</span>
          </h2>

          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Our FYP implementation leverages state-of-the-art AI models for intelligent job matching, 
            fraud detection, and automated pricing estimation. These features demonstrate the practical application 
            of machine learning in modern marketplace platforms.
          </p>
        </div>

        {/* Features Grid */}
        <div className={commonStyles.featuresGrid}>
          {aiFeatures.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              isHovered={hoveredCard === feature.id}
              onHover={setHoveredCard}
              themeStyles={themeStyles}
            />
          ))}
        </div>

        {/* Capabilities Summary */}
        <div className={cn(commonStyles.capabilitiesSection, themeStyles.capabilitiesSection)}>
          <h3 className={cn(commonStyles.capabilitiesTitle, themeStyles.capabilitiesTitle)}>
            What&apos;s Working Now
          </h3>
          <div className={commonStyles.capabilitiesGrid}>
            {[
              { icon: '✓', text: 'Skill-based job matching' },
              { icon: '✓', text: 'Market-rate price estimation' },
              { icon: '✓', text: 'Multi-layer fraud detection' },
              { icon: '✓', text: 'Intelligent chatbot support' },
              { icon: '✓', text: 'Professional proposal templates' },
              { icon: 'β', text: 'Semantic vector embeddings' },
            ].map((item, idx) => (
              <div key={idx} className={commonStyles.capabilityItem}>
                <span className={commonStyles.capabilityIcon}>{item.icon}</span>
                <span className={cn(commonStyles.capabilityText, themeStyles.capabilityText)}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PoweredByAI;
