// @AI-HINT: Gig detail page - shows gig info, packages, reviews, seller profile
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import {
  Star,
  Clock,
  RefreshCw,
  Check,
  X,
  Heart,
  Share2,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Award,
  ShoppingCart,
  AlertCircle,
  ArrowLeft,
  Zap,
  Package,
} from 'lucide-react';

import common from './GigDetail.common.module.css';
import light from './GigDetail.light.module.css';
import dark from './GigDetail.dark.module.css';

interface GigPackage {
  id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number | 'unlimited';
  features: { name: string; included: boolean }[];
}

interface GigReview {
  id: number;
  reviewerId: number;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface GigData {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  images: string[];
  seller: {
    id: number;
    username: string;
    avatarUrl?: string;
    title?: string;
    bio?: string;
    level?: 'new_seller' | 'bronze' | 'silver' | 'gold' | 'platinum';
    isProSeller?: boolean;
    avgRating: number;
    totalReviews: number;
    completedOrders: number;
    memberSince: string;
    responseTime: string;
  };
  category: string;
  subcategory?: string;
  tags: string[];
  packages: GigPackage[];
  avgRating: number;
  totalReviews: number;
  totalOrders: number;
  reviews: GigReview[];
  faqs: { question: string; answer: string }[];
}

const GigDetail: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [gig, setGig] = useState<GigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePackage, setActivePackage] = useState<string>('standard');
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [expandedFaqs, setExpandedFaqs] = useState<Set<number>>(new Set());
  const [showAllReviews, setShowAllReviews] = useState(false);

  if (!resolvedTheme) return null;

  const themed = resolvedTheme === 'dark' ? dark : light;

  // Fetch gig data
  useEffect(() => {
    const fetchGig = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/gigs/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setGig(transformApiData(data));
        } else if (response.status === 404) {
          setError('Gig not found');
        } else {
          // Use mock data for development
          setGig(getMockGig(slug));
        }
      } catch (err) {
        console.error('Failed to fetch gig:', err);
        setGig(getMockGig(slug));
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchGig();
    }
  }, [slug]);

  const toggleFaq = (index: number) => {
    setExpandedFaqs(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleOrder = () => {
    if (!gig) return;
    const pkg = gig.packages.find(p => p.id === activePackage);
    router.push(`/checkout/gig/${gig.id}?package=${activePackage}`);
  };

  const handleContact = () => {
    if (!gig) return;
    router.push(`/messages/new?to=${gig.seller.id}`);
  };

  const renderStars = (rating: number, size = 16) => (
    <div className={common.reviewsStars}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < Math.floor(rating) ? '#ffc107' : i < rating ? '#ffc107' : 'none'}
          color={i < rating ? '#ffc107' : '#94a3b8'}
        />
      ))}
    </div>
  );

  const currentPackage = gig?.packages.find(p => p.id === activePackage) || gig?.packages[0];

  if (isLoading) {
    return (
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <div className={common.loadingState}>
            <div className={cn(common.skeleton, common.skeletonLarge, themed.skeleton)} />
            <div className={cn(common.skeleton, common.skeletonMedium, themed.skeleton)} />
            <div className={cn(common.skeleton, common.skeletonSmall, themed.skeleton)} />
          </div>
        </div>
      </main>
    );
  }

  if (error || !gig) {
    return (
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <div className={common.errorState}>
            <AlertCircle className={common.errorIcon} />
            <h2 className={cn(common.errorTitle, themed.errorTitle)}>
              {error || 'Something went wrong'}
            </h2>
            <p className={cn(common.errorText, themed.errorText)}>
              We couldn&apos;t find the service you&apos;re looking for. It may have been removed or the link is incorrect.
            </p>
            <Link href="/gigs">
              <button className={cn(common.errorButton, themed.errorButton)}>
                <ArrowLeft size={18} />
                Browse all services
              </button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const displayedReviews = showAllReviews ? gig.reviews : gig.reviews.slice(0, 3);

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        {/* Breadcrumb */}
        <nav className={common.breadcrumb}>
          <Link href="/gigs" className={cn(common.breadcrumbLink, themed.breadcrumbLink)}>
            Services
          </Link>
          <ChevronRight size={14} className={cn(common.breadcrumbSeparator, themed.breadcrumbSeparator)} />
          <Link href={`/gigs?category=${gig.category}`} className={cn(common.breadcrumbLink, themed.breadcrumbLink)}>
            {gig.category}
          </Link>
          <ChevronRight size={14} className={cn(common.breadcrumbSeparator, themed.breadcrumbSeparator)} />
          <span className={cn(common.breadcrumbCurrent, themed.breadcrumbCurrent)}>{gig.title}</span>
        </nav>

        <div className={common.layout}>
          {/* Main Content */}
          <div className={common.mainContent}>
            {/* Gig Header */}
            <header className={common.gigHeader}>
              <h1 className={cn(common.gigTitle, themed.gigTitle)}>{gig.title}</h1>

              {/* Seller Info */}
              <div className={common.sellerInfo}>
                <div className={common.sellerAvatar}>
                  {gig.seller.avatarUrl ? (
                    <img src={gig.seller.avatarUrl} alt={gig.seller.username} />
                  ) : (
                    <div className={cn(common.sellerAvatarFallback, themed.sellerAvatarFallback)}>
                      {gig.seller.username[0]}
                    </div>
                  )}
                </div>
                <div className={common.sellerDetails}>
                  <div className={common.sellerRow}>
                    <span className={cn(common.sellerName, themed.sellerName)}>
                      {gig.seller.username}
                    </span>
                    {gig.seller.level && gig.seller.level !== 'new_seller' && (
                      <span className={cn(common.levelBadge, themed.levelBadge, themed[gig.seller.level])}>
                        <Award size={10} />
                        {gig.seller.level.replace('_', ' ')}
                      </span>
                    )}
                    {gig.seller.isProSeller && (
                      <span className={cn(common.proBadge, themed.proBadge)}>
                        <Zap size={10} />
                        PRO
                      </span>
                    )}
                  </div>
                  <div className={common.sellerStats}>
                    <div className={cn(common.rating, themed.rating)}>
                      <Star size={14} fill="#ffc107" color="#ffc107" />
                      <span className={common.ratingValue}>{gig.avgRating.toFixed(1)}</span>
                      <span className={cn(common.reviewCount, themed.reviewCount)}>
                        ({gig.totalReviews})
                      </span>
                    </div>
                    <span className={cn(common.ordersCount, themed.ordersCount)}>
                      {gig.totalOrders} orders in queue
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* Gallery */}
            <div className={cn(common.gallery, themed.gallery)}>
              <div className={common.mainImage}>
                <img
                  src={gig.images[activeImage] || gig.thumbnailUrl || '/images/placeholder-gig.jpg'}
                  alt={gig.title}
                />
              </div>
              {gig.images.length > 1 && (
                <div className={common.thumbnails}>
                  {gig.images.map((img, i) => (
                    <button
                      key={i}
                      className={cn(common.thumbnail, i === activeImage && 'active')}
                      onClick={() => setActiveImage(i)}
                    >
                      <img src={img} alt={`Preview ${i + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <section className={common.section}>
              <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>About This Gig</h2>
              <div className={cn(common.description, themed.description)}>{gig.description}</div>
              {gig.tags.length > 0 && (
                <div className={common.tags}>
                  {gig.tags.map(tag => (
                    <Link key={tag} href={`/gigs?q=${encodeURIComponent(tag)}`} className={cn(common.tag, themed.tag)}>
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* About Seller */}
            <section className={common.section}>
              <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>About The Seller</h2>
              <div className={cn(common.aboutSeller, themed.aboutSeller)}>
                <div className={common.aboutAvatar}>
                  {gig.seller.avatarUrl ? (
                    <img src={gig.seller.avatarUrl} alt={gig.seller.username} />
                  ) : (
                    <div className={cn(common.sellerAvatarFallback, themed.sellerAvatarFallback)}>
                      {gig.seller.username[0]}
                    </div>
                  )}
                </div>
                <div className={common.aboutContent}>
                  <div className={cn(common.aboutName, themed.aboutName)}>{gig.seller.username}</div>
                  {gig.seller.title && (
                    <div className={cn(common.aboutTitle, themed.aboutTitle)}>{gig.seller.title}</div>
                  )}
                  <div className={common.aboutStats}>
                    <div className={common.aboutStat}>
                      <div className={cn(common.aboutStatValue, themed.aboutStatValue)}>
                        {gig.seller.avgRating.toFixed(1)}
                      </div>
                      <div className={cn(common.aboutStatLabel, themed.aboutStatLabel)}>Rating</div>
                    </div>
                    <div className={common.aboutStat}>
                      <div className={cn(common.aboutStatValue, themed.aboutStatValue)}>
                        {gig.seller.completedOrders}
                      </div>
                      <div className={cn(common.aboutStatLabel, themed.aboutStatLabel)}>Orders</div>
                    </div>
                    <div className={common.aboutStat}>
                      <div className={cn(common.aboutStatValue, themed.aboutStatValue)}>
                        {gig.seller.responseTime}
                      </div>
                      <div className={cn(common.aboutStatLabel, themed.aboutStatLabel)}>Response</div>
                    </div>
                  </div>
                  {gig.seller.bio && (
                    <p className={cn(common.aboutBio, themed.aboutBio)}>{gig.seller.bio}</p>
                  )}
                  <button className={cn(common.contactButton, themed.contactButton)} onClick={handleContact}>
                    <MessageCircle size={16} />
                    Contact Me
                  </button>
                </div>
              </div>
            </section>

            {/* FAQs */}
            {gig.faqs.length > 0 && (
              <section className={common.section}>
                <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>FAQ</h2>
                <div className={common.faqList}>
                  {gig.faqs.map((faq, i) => (
                    <div key={i} className={cn(common.faqItem, themed.faqItem)}>
                      <button
                        className={cn(common.faqQuestion, themed.faqQuestion)}
                        onClick={() => toggleFaq(i)}
                      >
                        {faq.question}
                        {expandedFaqs.has(i) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      {expandedFaqs.has(i) && (
                        <div className={cn(common.faqAnswer, themed.faqAnswer)}>{faq.answer}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className={common.section}>
              <div className={common.reviewsHeader}>
                <div className={common.reviewsSummary}>
                  <span className={cn(common.reviewsRating, themed.reviewsRating)}>
                    {gig.avgRating.toFixed(1)}
                  </span>
                  {renderStars(gig.avgRating)}
                  <span className={cn(common.reviewsCount, themed.reviewsCount)}>
                    ({gig.totalReviews} reviews)
                  </span>
                </div>
              </div>
              <div className={common.reviewsList}>
                {displayedReviews.map(review => (
                  <div key={review.id} className={cn(common.reviewCard, themed.reviewCard)}>
                    <div className={common.reviewHeader}>
                      <div className={common.reviewerInfo}>
                        <div className={common.reviewerAvatar}>
                          {review.reviewerAvatar ? (
                            <img src={review.reviewerAvatar} alt={review.reviewerName} />
                          ) : (
                            <div className={cn(common.sellerAvatarFallback, themed.sellerAvatarFallback)}>
                              {review.reviewerName[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className={cn(common.reviewerName, themed.reviewerName)}>
                            {review.reviewerName}
                          </div>
                          <div className={cn(common.reviewDate, themed.reviewDate)}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className={common.reviewRating}>{renderStars(review.rating, 14)}</div>
                    </div>
                    <p className={cn(common.reviewText, themed.reviewText)}>{review.text}</p>
                  </div>
                ))}
              </div>
              {gig.reviews.length > 3 && (
                <button
                  className={cn(common.showMoreReviews, themed.showMoreReviews)}
                  onClick={() => setShowAllReviews(!showAllReviews)}
                >
                  {showAllReviews ? 'Show less' : `See all ${gig.reviews.length} reviews`}
                  {showAllReviews ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className={common.sidebar}>
            {/* Package Tabs */}
            <div className={common.packageTabs}>
              {gig.packages.map(pkg => (
                <button
                  key={pkg.id}
                  className={cn(common.packageTab, themed.packageTab, activePackage === pkg.id && 'active', activePackage === pkg.id && themed.packageTabActive)}
                  onClick={() => setActivePackage(pkg.id)}
                >
                  {pkg.name}
                </button>
              ))}
            </div>

            {/* Package Details */}
            {currentPackage && (
              <div className={cn(common.packageCard, themed.packageCard)}>
                <div className={common.packageContent}>
                  <div className={common.packageHeader}>
                    <span className={cn(common.packageName, themed.packageName)}>
                      {currentPackage.title}
                    </span>
                    <span className={cn(common.packagePrice, themed.packagePrice)}>
                      ${currentPackage.price}
                    </span>
                  </div>
                  <p className={cn(common.packageDescription, themed.packageDescription)}>
                    {currentPackage.description}
                  </p>
                  <div className={common.packageMeta}>
                    <div className={cn(common.packageMetaItem, themed.packageMetaItem)}>
                      <Clock size={16} />
                      {currentPackage.deliveryDays} day delivery
                    </div>
                    <div className={cn(common.packageMetaItem, themed.packageMetaItem)}>
                      <RefreshCw size={16} />
                      {currentPackage.revisions === 'unlimited'
                        ? 'Unlimited revisions'
                        : `${currentPackage.revisions} revisions`}
                    </div>
                  </div>
                  <div className={common.packageFeatures}>
                    {currentPackage.features.map((feature, i) => (
                      <div key={i} className={cn(common.packageFeature, themed.packageFeature)}>
                        <span
                          className={cn(
                            common.packageFeatureIcon,
                            themed.packageFeatureIcon,
                            feature.included ? themed.included : themed.excluded
                          )}
                        >
                          {feature.included ? <Check size={16} /> : <X size={16} />}
                        </span>
                        {feature.name}
                      </div>
                    ))}
                  </div>
                  <button className={cn(common.orderButton, themed.orderButton)} onClick={handleOrder}>
                    <ShoppingCart size={18} />
                    Continue (${currentPackage.price})
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className={common.quickActions}>
              <button
                className={cn(common.quickAction, themed.quickAction)}
                onClick={() => setIsFavorited(!isFavorited)}
              >
                <Heart size={18} fill={isFavorited ? '#e81123' : 'none'} color={isFavorited ? '#e81123' : 'currentColor'} />
                Save
              </button>
              <button className={cn(common.quickAction, themed.quickAction)}>
                <Share2 size={18} />
                Share
              </button>
            </div>

            <button className={cn(common.compareLink, themed.compareLink)}>
              <Package size={16} />
              Compare Packages
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
};

// Transform API response to component format
function transformApiData(data: any): GigData {
  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    description: data.description,
    thumbnailUrl: data.thumbnail_url,
    images: data.images || [data.thumbnail_url].filter(Boolean),
    seller: {
      id: data.seller_id,
      username: data.seller_username || 'Unknown',
      avatarUrl: data.seller_avatar,
      title: data.seller_title,
      bio: data.seller_bio,
      level: data.seller_level,
      isProSeller: data.is_pro_seller,
      avgRating: data.seller_avg_rating || 0,
      totalReviews: data.seller_total_reviews || 0,
      completedOrders: data.seller_completed_orders || 0,
      memberSince: data.seller_member_since || '',
      responseTime: data.seller_response_time || '1 hour',
    },
    category: data.category || 'General',
    subcategory: data.subcategory,
    tags: data.tags || [],
    packages: data.packages || getDefaultPackages(),
    avgRating: data.average_rating || 0,
    totalReviews: data.total_reviews || 0,
    totalOrders: data.total_orders || 0,
    reviews: data.reviews || [],
    faqs: data.faqs || [],
  };
}

function getDefaultPackages(): GigPackage[] {
  return [
    {
      id: 'basic',
      name: 'Basic',
      title: 'Basic Package',
      description: 'Essential features for smaller projects',
      price: 50,
      deliveryDays: 7,
      revisions: 2,
      features: [
        { name: 'Source file', included: true },
        { name: 'Commercial use', included: false },
        { name: 'Priority support', included: false },
      ],
    },
    {
      id: 'standard',
      name: 'Standard',
      title: 'Standard Package',
      description: 'Best value for most projects',
      price: 100,
      deliveryDays: 5,
      revisions: 5,
      features: [
        { name: 'Source file', included: true },
        { name: 'Commercial use', included: true },
        { name: 'Priority support', included: false },
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      title: 'Premium Package',
      description: 'Full service with all features',
      price: 200,
      deliveryDays: 3,
      revisions: 'unlimited',
      features: [
        { name: 'Source file', included: true },
        { name: 'Commercial use', included: true },
        { name: 'Priority support', included: true },
      ],
    },
  ];
}

// Mock data for development
function getMockGig(slug: string): GigData {
  return {
    id: 1,
    title: 'I will create a professional website using React and Next.js',
    slug: slug,
    description: `Looking for a modern, high-performance website? I'm here to help!

I specialize in building professional web applications using React and Next.js, the most popular frameworks for building fast, SEO-friendly websites.

What you'll get:
• Responsive design that works on all devices
• Fast loading times with optimized performance
• SEO-friendly structure
• Clean, maintainable code
• Modern UI/UX design

My expertise includes:
• Next.js 16 with App Router
• TypeScript for type-safe code
• Tailwind CSS for styling
• API integration
• Database setup (PostgreSQL, MongoDB)

I have 5+ years of experience building websites for startups, agencies, and enterprises. Let's discuss your project!`,
    thumbnailUrl: '/images/gigs/web-dev.jpg',
    images: [
      '/images/gigs/web-dev.jpg',
      '/images/gigs/web-dev-2.jpg',
      '/images/gigs/web-dev-3.jpg',
    ],
    seller: {
      id: 1,
      username: 'dev_expert',
      avatarUrl: undefined,
      title: 'Full Stack Developer',
      bio: 'Senior developer with 5+ years of experience in React, Next.js, and Node.js. I love building beautiful, performant web applications that solve real problems.',
      level: 'platinum',
      isProSeller: true,
      avgRating: 4.9,
      totalReviews: 234,
      completedOrders: 312,
      memberSince: '2021-03-15',
      responseTime: '1 hour',
    },
    category: 'Programming & Tech',
    subcategory: 'Web Development',
    tags: ['react', 'nextjs', 'web development', 'typescript', 'frontend'],
    packages: [
      {
        id: 'basic',
        name: 'Basic',
        title: 'Landing Page',
        description: 'Single responsive landing page with modern design',
        price: 150,
        deliveryDays: 5,
        revisions: 2,
        features: [
          { name: 'Responsive design', included: true },
          { name: 'Source code', included: true },
          { name: 'Content upload', included: false },
          { name: 'API integration', included: false },
          { name: '3 months support', included: false },
        ],
      },
      {
        id: 'standard',
        name: 'Standard',
        title: 'Multi-page Website',
        description: 'Up to 5 pages with CMS integration',
        price: 350,
        deliveryDays: 10,
        revisions: 5,
        features: [
          { name: 'Responsive design', included: true },
          { name: 'Source code', included: true },
          { name: 'Content upload', included: true },
          { name: 'API integration', included: true },
          { name: '3 months support', included: false },
        ],
      },
      {
        id: 'premium',
        name: 'Premium',
        title: 'Full Web Application',
        description: 'Complete web app with dashboard and admin panel',
        price: 750,
        deliveryDays: 21,
        revisions: 'unlimited',
        features: [
          { name: 'Responsive design', included: true },
          { name: 'Source code', included: true },
          { name: 'Content upload', included: true },
          { name: 'API integration', included: true },
          { name: '3 months support', included: true },
        ],
      },
    ],
    avgRating: 4.9,
    totalReviews: 234,
    totalOrders: 15,
    reviews: [
      {
        id: 1,
        reviewerId: 101,
        reviewerName: 'John D.',
        rating: 5,
        text: 'Excellent work! The website looks amazing and was delivered ahead of schedule. Communication was great throughout the project. Highly recommend!',
        createdAt: '2024-01-15T10:30:00Z',
      },
      {
        id: 2,
        reviewerId: 102,
        reviewerName: 'Sarah M.',
        rating: 5,
        text: 'Professional and skilled developer. Made exactly what I needed and even suggested improvements I hadn\'t thought of. Will definitely work with again.',
        createdAt: '2024-01-10T14:20:00Z',
      },
      {
        id: 3,
        reviewerId: 103,
        reviewerName: 'Mike T.',
        rating: 4,
        text: 'Great work overall. The website is fast and looks modern. Took a bit longer than expected but the quality was worth it.',
        createdAt: '2024-01-05T09:15:00Z',
      },
      {
        id: 4,
        reviewerId: 104,
        reviewerName: 'Emily R.',
        rating: 5,
        text: 'Outstanding experience! Very responsive and professional. The code quality is excellent and well-documented.',
        createdAt: '2023-12-28T16:45:00Z',
      },
    ],
    faqs: [
      {
        question: 'What information do you need to start?',
        answer: 'I\'ll need your design files (Figma/XD), content (text and images), and any specific requirements or references you have in mind.',
      },
      {
        question: 'Do you provide hosting?',
        answer: 'I can help you set up hosting on Vercel, Netlify, or AWS. The basic packages don\'t include hosting costs, but I can guide you through the process.',
      },
      {
        question: 'Can you make changes after delivery?',
        answer: 'Yes! Each package includes a set number of revisions. For changes after the project is complete, we can discuss a maintenance arrangement.',
      },
    ],
  };
}

export default GigDetail;
