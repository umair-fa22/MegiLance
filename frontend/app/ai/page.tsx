// @AI-HINT: AI Hub landing page showcasing all AI features available on MegiLance platform - Premium redesign
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  DollarSign, 
  Shield, 
  Search, 
  FileText, 
  Sparkles,
  ArrowRight,
  Bot,
  BarChart3,
  Users,
  Lock,
  Globe,
  Layers,
  TrendingUp,
  CheckCircle2,
  Brain
} from 'lucide-react';

const aiFeatures = [
  {
    title: 'AI Chatbot',
    description: 'Get instant answers to your questions about the platform, pricing, and finding freelancers. 24/7 intelligent support.',
    icon: MessageSquare,
    href: '/ai/chatbot',
    status: 'Live',
    color: 'blue',
    stats: '50K+ queries answered'
  },
  {
    title: 'Price Estimator',
    description: 'Get AI-powered price estimates for your projects based on market data, complexity, and historical patterns.',
    icon: DollarSign,
    href: '/ai/price-estimator',
    status: 'Live',
    color: 'green',
    stats: '95% accuracy rate'
  },
  {
    title: 'Fraud Detection',
    description: 'Multi-layer protection system that analyzes users, projects, and proposals for potential risks in real-time.',
    icon: Shield,
    href: '/ai/fraud-check',
    status: 'Live',
    color: 'red',
    stats: '99.9% threat detection'
  },
  {
    title: 'Smart Matching',
    description: 'Skill-based matching algorithm that connects you with the perfect freelancer or project using ML ranking.',
    icon: Search,
    href: '/explore',
    status: 'Live',
    color: 'purple',
    stats: '92% match accuracy'
  },
  {
    title: 'Proposal Generator',
    description: 'AI-powered proposal templates to help you create professional cover letters that win projects.',
    icon: FileText,
    href: '/portal/freelancer',
    status: 'Live',
    color: 'orange',
    stats: '3x higher win rate'
  },
  {
    title: 'Sentiment Analysis',
    description: 'Analyze reviews and feedback to understand client satisfaction and improve services.',
    icon: Sparkles,
    href: '/ai/chatbot',
    status: 'Beta',
    color: 'pink',
    stats: 'In Beta'
  },
  {
    title: 'Skill Analyzer',
    description: 'Assess your skills against 2025 market demand data, discover high-ROI skill gaps, and get a personalized growth roadmap.',
    icon: Brain,
    href: '/ai/skill-analyzer',
    status: 'Live',
    color: 'blue',
    stats: '80+ skills tracked'
  },
  {
    title: 'Rate Advisor',
    description: 'Get data-backed hourly rate recommendations with income projections and platform comparisons for your niche.',
    icon: TrendingUp,
    href: '/ai/rate-advisor',
    status: 'Live',
    color: 'green',
    stats: '70+ countries covered'
  },
  {
    title: 'Proposal Writer',
    description: 'Generate winning proposals with market-data pricing, skill matching, and a quality score to maximize your win rate.',
    icon: FileText,
    href: '/ai/proposal-writer',
    status: 'Live',
    color: 'orange',
    stats: 'AI-optimized copy'
  }
];

const capabilities = [
  { icon: Brain, label: 'Natural Language Processing', desc: 'Understand context and intent' },
  { icon: BarChart3, label: 'Predictive Analytics', desc: 'Forecast trends and outcomes' },
  { icon: Users, label: 'Behavioral Analysis', desc: 'Understand user patterns' },
  { icon: Lock, label: 'Security Intelligence', desc: 'Real-time threat detection' },
  { icon: Globe, label: 'Multi-language Support', desc: '50+ languages supported' },
  { icon: Layers, label: 'Deep Learning', desc: 'Advanced neural networks' },
];

const stats = [
  { value: '10M+', label: 'AI Predictions Made' },
  { value: '99.5%', label: 'Uptime Reliability' },
  { value: '< 100ms', label: 'Response Time' },
  { value: '50+', label: 'AI Models Deployed' },
];

const AIHubPage = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className={cn(
      'min-h-screen',
      isDark ? 'bg-[#0b0f19] text-white' : 'bg-gray-50 text-gray-900'
    )}>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={cn(
            'absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl',
            isDark ? 'bg-blue-600/10' : 'bg-blue-400/10'
          )} />
          <div className={cn(
            'absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl',
            isDark ? 'bg-purple-600/10' : 'bg-purple-400/10'
          )} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6',
              isDark ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/20' : 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-600'
            )}>
              <Bot className="w-4 h-4" />
              <span>Powered by Advanced Machine Learning</span>
              <Sparkles className="w-4 h-4" />
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              MegiLance{' '}
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                AI Hub
              </span>
            </h1>
            
            <p className={cn(
              'text-lg md:text-xl max-w-3xl mx-auto mb-10',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}>
              Experience the future of freelancing with our suite of AI-powered tools. 
              From intelligent matching to automated pricing, we leverage cutting-edge 
              machine learning to transform how you work.
            </p>

            {/* Stats Row */}
            <motion.div 
              className="flex flex-wrap justify-center gap-8 mb-12"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  className={cn(
                    'px-6 py-4 rounded-2xl',
                    isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm'
                  )}
                >
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className={cn(
                    'text-sm',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/ai/chatbot"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Try AI Chatbot</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/ai/price-estimator"
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all',
                  isDark 
                    ? 'bg-white/10 text-white hover:bg-white/15 border border-white/10' 
                    : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200 shadow-sm'
                )}
              >
                <DollarSign className="w-5 h-5" />
                <span>Estimate Price</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className={cn(
              'text-3xl md:text-4xl font-bold mb-4',
              isDark ? 'text-white' : 'text-gray-900'
            )}>
              AI-Powered Tools
            </h2>
            <p className={cn(
              'text-lg max-w-2xl mx-auto',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}>
              Explore our comprehensive suite of intelligent tools designed to enhance every aspect of your freelancing experience.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {aiFeatures.map((feature) => {
              const Icon = feature.icon;
              const colorClasses: Record<string, string> = {
                blue: isDark ? 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/20' : 'from-blue-50 to-blue-100 text-blue-600 border-blue-200',
                green: isDark ? 'from-green-500/20 to-green-600/10 text-green-400 border-green-500/20' : 'from-green-50 to-green-100 text-green-600 border-green-200',
                red: isDark ? 'from-red-500/20 to-red-600/10 text-red-400 border-red-500/20' : 'from-red-50 to-red-100 text-red-600 border-red-200',
                purple: isDark ? 'from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/20' : 'from-purple-50 to-purple-100 text-purple-600 border-purple-200',
                orange: isDark ? 'from-orange-500/20 to-orange-600/10 text-orange-400 border-orange-500/20' : 'from-orange-50 to-orange-100 text-orange-600 border-orange-200',
                pink: isDark ? 'from-pink-500/20 to-pink-600/10 text-pink-400 border-pink-500/20' : 'from-pink-50 to-pink-100 text-pink-600 border-pink-200',
              };
              
              return (
                <motion.div key={feature.title} variants={itemVariants}>
                  <Link
                    href={feature.href}
                    className={cn(
                      'group block p-6 rounded-2xl border transition-all duration-300 h-full',
                      isDark 
                        ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800/80' 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xl'
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn(
                        'p-3 rounded-xl bg-gradient-to-br border',
                        colorClasses[feature.color]
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={cn(
                        'px-3 py-1 rounded-full text-xs font-semibold',
                        feature.status === 'Live'
                          ? isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-600'
                          : isDark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                      )}>
                        {feature.status}
                      </span>
                    </div>
                    
                    <h3 className={cn(
                      'text-xl font-bold mb-2',
                      isDark ? 'text-white' : 'text-gray-900'
                    )}>
                      {feature.title}
                    </h3>
                    
                    <p className={cn(
                      'text-sm mb-4 min-h-[60px]',
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      {feature.description}
                    </p>

                    <div className={cn(
                      'flex items-center justify-between pt-4 border-t',
                      isDark ? 'border-gray-700' : 'border-gray-100'
                    )}>
                      <span className={cn(
                        'text-xs font-medium',
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      )}>
                        {feature.stats}
                      </span>
                      <div className={cn(
                        'flex items-center gap-1 text-sm font-medium transition-transform group-hover:translate-x-1',
                        isDark ? 'text-blue-400' : 'text-blue-600'
                      )}>
                        <span>Explore</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className={cn(
        'py-16',
        isDark ? 'bg-gray-900/50' : 'bg-white'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className={cn(
              'text-3xl md:text-4xl font-bold mb-4',
              isDark ? 'text-white' : 'text-gray-900'
            )}>
              AI Capabilities
            </h2>
            <p className={cn(
              'text-lg max-w-2xl mx-auto',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}>
              Our AI infrastructure is built on state-of-the-art technologies to deliver reliable, accurate, and fast results.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {capabilities.map((cap, index) => {
              const Icon = cap.icon;
              return (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  className={cn(
                    'p-4 rounded-xl text-center transition-all hover:-translate-y-1',
                    isDark 
                      ? 'bg-gray-800/50 border border-gray-700 hover:border-blue-500/30' 
                      : 'bg-gray-50 border border-gray-200 hover:border-blue-300 hover:shadow-lg'
                  )}
                >
                  <div className={cn(
                    'w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center',
                    isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-600'
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className={cn(
                    'font-semibold text-sm mb-1',
                    isDark ? 'text-white' : 'text-gray-900'
                  )}>
                    {cap.label}
                  </h3>
                  <p className={cn(
                    'text-xs',
                    isDark ? 'text-gray-500' : 'text-gray-500'
                  )}>
                    {cap.desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className={cn(
              'rounded-3xl p-8 md:p-12 text-center relative overflow-hidden',
              isDark 
                ? 'bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-pink-900/50 border border-gray-700' 
                : 'bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100'
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6',
                isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-600'
              )}>
                <TrendingUp className="w-4 h-4" />
                <span>Start Your AI Journey</span>
              </div>

              <h2 className={cn(
                'text-2xl md:text-4xl font-bold mb-4',
                isDark ? 'text-white' : 'text-gray-900'
              )}>
                Ready to Experience AI-Powered Freelancing?
              </h2>
              <p className={cn(
                'text-lg mb-8 max-w-2xl mx-auto',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                Join thousands of freelancers and clients who are already using our AI tools 
                to work smarter, faster, and achieve better results.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Get Started Free</span>
                </Link>
                <Link
                  href="/ai/chatbot"
                  className={cn(
                    'inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all',
                    isDark 
                      ? 'bg-white/10 text-white hover:bg-white/15 border border-white/10' 
                      : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
                  )}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Try AI Chatbot Now</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AIHubPage;
