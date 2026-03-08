// @AI-HINT: Project details page with proposal submission
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import Button from '@/app/components/Button/Button';
import ProposalBuilder from '@/app/components/Proposal/ProposalBuilder/ProposalBuilder';
import { Clock, Banknote, Tag, User, CheckCircle } from 'lucide-react';
import SimilarJobs from '@/app/components/Matching/SimilarJobs/SimilarJobs';
import RecommendedFreelancers from '@/app/components/Matching/RecommendedFreelancers/RecommendedFreelancers';

import commonStyles from './ProjectDetails.common.module.css';
import lightStyles from './ProjectDetails.light.module.css';
import darkStyles from './ProjectDetails.dark.module.css';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProposalBuilder, setShowProposalBuilder] = useState(false);
  const [user, setUser] = useState<any>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [projectData, userData] = await Promise.all([
        api.projects.get(id as string),
        api.auth.me().catch(() => null)
      ]);
      setProject(projectData);
      setUser(userData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={commonStyles.loadingState}>Loading...</div>;
  }

  if (!project) {
    return <div className={cn(commonStyles.notFoundState, themeStyles.notFoundState)}>Project not found</div>;
  }

  const isFreelancer = user?.role === 'freelancer';

  if (showProposalBuilder) {
    return (
      <div className={commonStyles.proposalBuilderWrapper}>
        <Button 
          variant="ghost" 
          onClick={() => setShowProposalBuilder(false)}
          className={commonStyles.backButton}
        >
          ← Back to Project Details
        </Button>
        <ProposalBuilder
          projectId={parseInt(id as string)}
          projectTitle={project.title}
          projectDescription={project.description}
          projectBudget={{ 
            min: project.budget_min || 0, 
            max: project.budget_max || 0 
          }}
          onSubmit={() => {
            router.push('/dashboard/proposals');
          }}
        />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.pageContainer, themeStyles.pageContainer)}>
        <div className={commonStyles.innerContainer}>
          <div className={cn(commonStyles.card, themeStyles.card)}>
            <div className={commonStyles.cardHeader}>
              <div>
                <h1 className={commonStyles.title}>{project.title}</h1>
                <div className={commonStyles.metaRow}>
                  <span className={commonStyles.metaItem}>
                    <Clock size={14} /> Posted {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <span className={commonStyles.metaItem}>
                    <Tag size={14} /> {project.category}
                  </span>
                </div>
              </div>
              {isFreelancer && (
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => setShowProposalBuilder(true)}
                >
                  Submit Proposal
                </Button>
              )}
            </div>

            <div className={commonStyles.detailsGrid}>
              <div className={cn(commonStyles.detailBox, themeStyles.detailBox)}>
                <div className={commonStyles.detailLabel}>Budget</div>
                <div className={commonStyles.detailValue}>
                  <Banknote className={commonStyles.iconGreen} size={20} />
                  {project.budget_type === 'hourly' ? (
                    <span>${project.budget_min} - ${project.budget_max}/hr</span>
                  ) : (
                    <span>${project.budget_min} - ${project.budget_max}</span>
                  )}
                </div>
              </div>
              
              <div className={cn(commonStyles.detailBox, themeStyles.detailBox)}>
                <div className={commonStyles.detailLabel}>Experience Level</div>
                <div className={commonStyles.detailValue}>
                  <User className={commonStyles.iconBlue} size={20} />
                  {project.experience_level}
                </div>
              </div>

              <div className={cn(commonStyles.detailBox, themeStyles.detailBox)}>
                <div className={commonStyles.detailLabel}>Status</div>
                <div className={commonStyles.detailValue}>
                  <CheckCircle className={commonStyles.iconPurple} size={20} />
                  {project.status}
                </div>
              </div>
            </div>

            <div className={commonStyles.descriptionSection}>
              <h3 className={commonStyles.sectionTitle}>Description</h3>
              <div className={cn(commonStyles.descriptionText, themeStyles.descriptionText)}>{project.description}</div>
            </div>

            <div>
              <h3 className={commonStyles.sectionTitle}>Required Skills</h3>
              <div className={commonStyles.skillsContainer}>
                {project.skills?.map((skill: string) => (
                  <span 
                    key={skill}
                    className={cn(commonStyles.skillTag, themeStyles.skillTag)}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {user?.role === 'client' && (
             <RecommendedFreelancers projectId={id as string} />
          )}

          {user?.role === 'freelancer' && (
             <SimilarJobs projectId={id as string} />
          )}
        </div>
      </div>
    </PageTransition>
  );
}
