// @AI-HINT: Public "Post a Project" landing page — the #1 client acquisition funnel.
// SEO-optimized for "post a project", "hire freelancer", "outsource project" keywords.
// Drives clients to sign up and post their first project.
import type { Metadata } from 'next';
import PostProjectClient from './PostProjectClient';
import {
  buildMeta,
  buildBreadcrumbJsonLd,
  buildFAQJsonLd,
  buildHowToJsonLd,
  jsonLdScriptProps,
} from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Post a Project - Hire Top Freelancers in 24 Hours | Free to Post',
    description:
      'Post your project for free and get matched with top freelancers in minutes. AI-powered matching, secure escrow payments, and milestone tracking. Hire web developers, designers, writers & more. No upfront costs.',
    path: '/post-project',
    keywords: [
      'post a project', 'hire freelancer', 'outsource project',
      'post freelance job', 'hire web developer', 'hire graphic designer',
      'free to post project', 'freelance project marketplace',
      'hire developers online', 'outsource web development',
      'find freelancers for project', 'post job for freelancers',
      'AI freelancer matching', 'hire freelancers fast',
      'upwork alternative', 'fiverr alternative', 'freelance marketplace',
    ],
  });
}

const postProjectFaqs = [
  {
    question: 'Is it free to post a project on MegiLance?',
    answer: 'Yes, posting a project on MegiLance is 100% free. You only pay when you hire a freelancer and approve their work. No hidden fees, no subscription required.',
  },
  {
    question: 'How quickly will I get proposals from freelancers?',
    answer: 'Most projects receive their first proposals within 1-2 hours. Our AI matching system instantly notifies qualified freelancers who match your requirements, so you can start reviewing candidates immediately.',
  },
  {
    question: 'How does payment protection work?',
    answer: 'All payments on MegiLance are secured through our escrow system. Your money is held safely until you approve the completed work. You can set milestones for larger projects and release payments as each milestone is completed.',
  },
  {
    question: 'Can I hire freelancers for both short and long-term projects?',
    answer: 'Absolutely. MegiLance supports one-time tasks, fixed-price projects, hourly engagements, and long-term contracts. You can hire freelancers for a few hours or for ongoing monthly work.',
  },
  {
    question: 'What types of freelancers can I hire?',
    answer: 'MegiLance has freelancers across 50+ categories including web development, mobile app development, UI/UX design, graphic design, content writing, SEO, data science, AI/ML, blockchain, video editing, and much more.',
  },
  {
    question: 'How does AI matching work?',
    answer: 'Our AI analyzes your project requirements, budget, timeline, and preferred skills, then matches you with the most qualified freelancers from our network. It considers past performance, ratings, skill relevance, and availability to find the best matches.',
  },
];

const howToSteps = [
  {
    name: 'Describe Your Project',
    text: 'Tell us what you need. Add a title, description, required skills, budget range, and deadline. The more detail you provide, the better matches you will get.',
    url: '/post-project',
  },
  {
    name: 'Get AI-Matched Proposals',
    text: 'Our AI instantly matches your project with the most qualified freelancers. You will receive proposals within hours, not days.',
    url: '/post-project',
  },
  {
    name: 'Review & Hire',
    text: 'Compare proposals, review portfolios and ratings, chat with candidates, and hire your perfect freelancer. All within the platform.',
    url: '/post-project',
  },
  {
    name: 'Pay Securely on Completion',
    text: 'Funds are held in escrow until you approve the work. Set milestones for large projects. Release payment when you are satisfied.',
    url: '/post-project',
  },
];

export default function PostProjectPage() {
  return (
    <>
      <script {...jsonLdScriptProps(buildFAQJsonLd(postProjectFaqs))} />
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'Post a Project', path: '/post-project' }])
      )} />
      <script {...jsonLdScriptProps(
        buildHowToJsonLd(
          'How to Post a Project & Hire Freelancers on MegiLance',
          'Step-by-step guide to posting your first project and hiring top freelancers on MegiLance.',
          howToSteps,
        )
      )} />
      <PostProjectClient faqs={postProjectFaqs} />
    </>
  );
}
