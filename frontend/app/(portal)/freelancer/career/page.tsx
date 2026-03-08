// @AI-HINT: Career development page - Skill growth, career paths, mentorship
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { careerApi } from '@/lib/api';
import Card from '@/app/components/Card/Card';
import Badge from '@/app/components/Badge/Badge';
import ProgressBar from '@/app/components/ProgressBar/ProgressBar';
import Button from '@/app/components/Button/Button';
import Loader from '@/app/components/Loader/Loader';
import Tabs from '@/app/components/Tabs/Tabs';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './Career.common.module.css';
import lightStyles from './Career.light.module.css';
import darkStyles from './Career.dark.module.css';

interface CareerPath {
  id: string;
  name: string;
  description: string;
  skills_required: { name: string; level: string }[];
  milestones: { name: string; duration: string }[];
  estimated_duration: string;
  salary_range: { min: number; max: number };
  job_outlook: string;
}

interface SkillProgress {
  skill_id: string;
  skill_name: string;
  current_level: string;
  target_level: string;
  progress_percentage: number;
  hours_invested: number;
  projects_completed: number;
  certifications: string[];
}

interface LearningGoal {
  id: string;
  title: string;
  target_skill: string;
  target_level: string;
  progress: number;
  status: string;
  deadline?: string;
}

interface Mentor {
  id: string;
  name: string;
  expertise: string[];
  experience_years: number;
  rating: number;
  mentees_count: number;
  availability: string;
  hourly_rate?: number;
}

export default function CareerPage() {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('progress');
  const [paths, setPaths] = useState<CareerPath[]>([]);
  const [progress, setProgress] = useState<SkillProgress[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [recommendations, setRecommendations] = useState<any>(null);

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  useEffect(() => {
    loadCareerData();
  }, []);

  const loadCareerData = async () => {
    try {
      setLoading(true);
      const [pathsData, progressData, goalsData, mentorsData, recsData] = await Promise.all([
        careerApi.getPaths(),
        careerApi.getMyProgress(),
        careerApi.getGoals(),
        careerApi.findMentors(),
        careerApi.getRecommendations(),
      ]);
      setPaths(pathsData as any);
      setProgress(progressData as any);
      setGoals(goalsData as any);
      setMentors(mentorsData as any);
      setRecommendations(recsData);
    } catch (error) {
      console.error('Failed to load career data:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <Loader size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'progress', label: 'My Progress' },
    { id: 'paths', label: 'Career Paths' },
    { id: 'goals', label: 'Learning Goals' },
    { id: 'mentors', label: 'Find Mentors' },
  ];

  const levelColors: Record<string, string> = {
    beginner: '#f59e0b',
    intermediate: '#3b82f6',
    advanced: '#22c55e',
    expert: '#a855f7',
  };

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={cn(commonStyles.header, themeStyles.header)}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Career Development</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Track your skills, explore career paths, and find mentors
              </p>
            </div>
            <Button variant="primary">+ Set New Goal</Button>
          </div>
        </ScrollReveal>

        {/* Quick Stats */}
        <StaggerContainer className={cn(commonStyles.statsRow, themeStyles.statsRow)} delay={0.1}>
          <StaggerItem>
            <Card className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={cn(commonStyles.statIcon)}>📈</span>
              <div className={cn(commonStyles.statInfo)}>
                <strong>{progress.length}</strong>
                <span>Skills Tracked</span>
              </div>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={cn(commonStyles.statIcon)}>🎯</span>
              <div className={cn(commonStyles.statInfo)}>
                <strong>{goals.filter(g => g.status === 'active').length}</strong>
                <span>Active Goals</span>
              </div>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={cn(commonStyles.statIcon)}>⏱️</span>
              <div className={cn(commonStyles.statInfo)}>
                <strong>{progress.reduce((sum, p) => sum + p.hours_invested, 0)}</strong>
                <span>Hours Invested</span>
              </div>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={cn(commonStyles.statIcon)}>🏆</span>
              <div className={cn(commonStyles.statInfo)}>
                <strong>{progress.reduce((sum, p) => sum + p.certifications.length, 0)}</strong>
                <span>Certifications</span>
              </div>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        <ScrollReveal delay={0.2}>
          <div className={cn(commonStyles.tabs, themeStyles.tabs || '')}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  commonStyles.tab,
                  themeStyles.tab,
                  activeTab === tab.id && commonStyles.tabActive,
                  activeTab === tab.id && themeStyles.tabActive
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        <div className={cn(commonStyles.tabContent, themeStyles.tabContent)}>
          {activeTab === 'progress' && (
            <div className={cn(commonStyles.progressSection, themeStyles.progressSection)}>
              {/* Skill Progress Cards */}
              <StaggerContainer className={cn(commonStyles.skillsGrid, themeStyles.skillsGrid)}>
                {progress.map((skill) => (
                  <StaggerItem key={skill.skill_id}>
                    <Card className={cn(commonStyles.skillCard, themeStyles.skillCard)}>
                      <div className={cn(commonStyles.skillHeader, themeStyles.skillHeader)}>
                        <h3>{skill.skill_name}</h3>
                        <Badge 
                          {...{variant: "default", style: { backgroundColor: levelColors[skill.current_level] }} as any}
                        >
                          {skill.current_level}
                        </Badge>
                      </div>
                      <div className={cn(commonStyles.skillProgress, themeStyles.skillProgress)}>
                        <div className={cn(commonStyles.progressLabel, themeStyles.progressLabel)}>
                          <span>Progress to {skill.target_level}</span>
                          <span>{skill.progress_percentage.toFixed(0)}%</span>
                        </div>
                        <ProgressBar value={skill.progress_percentage} max={100} showLabel={false} {...{} as any} />
                      </div>
                      <div className={cn(commonStyles.skillStats, themeStyles.skillStats)}>
                        <div>
                          <strong>{skill.hours_invested}</strong>
                          <span>hours</span>
                        </div>
                        <div>
                          <strong>{skill.projects_completed}</strong>
                          <span>projects</span>
                        </div>
                        <div>
                          <strong>{skill.certifications.length}</strong>
                          <span>certs</span>
                        </div>
                      </div>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {/* Recommendations */}
              {recommendations && (
                <ScrollReveal delay={0.3}>
                  <Card className={cn(commonStyles.recsCard, themeStyles.recsCard)}>
                    <h3>Recommended for You</h3>
                    <div className={cn(commonStyles.recsGrid, themeStyles.recsGrid)}>
                      <div className={cn(commonStyles.recSection, themeStyles.recSection)}>
                        <h4>🎯 Skills to Learn</h4>
                        {recommendations.recommended_skills?.map((skill: any) => (
                          <div key={skill.skill} className={cn(commonStyles.recItem, themeStyles.recItem)}>
                            <span>{skill.skill}</span>
                            <span className={cn(commonStyles.recReason, themeStyles.recReason)}>{skill.reason}</span>
                          </div>
                        ))}
                      </div>
                      <div className={cn(commonStyles.recSection, themeStyles.recSection)}>
                        <h4>📚 Courses</h4>
                        {recommendations.recommended_courses?.map((course: any) => (
                          <div key={course.title} className={cn(commonStyles.recItem, themeStyles.recItem)}>
                            <span>{course.title}</span>
                            <span className={cn(commonStyles.recProvider, themeStyles.recProvider)}>{course.provider}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </ScrollReveal>
              )}
            </div>
          )}

          {activeTab === 'paths' && (
            <StaggerContainer className={cn(commonStyles.pathsGrid, themeStyles.pathsGrid)}>
              {paths.map((path) => (
                <StaggerItem key={path.id}>
                  <Card className={cn(commonStyles.pathCard, themeStyles.pathCard)}>
                    <h3 className={cn(commonStyles.pathName, themeStyles.pathName)}>{path.name}</h3>
                    <p className={cn(commonStyles.pathDesc, themeStyles.pathDesc)}>{path.description}</p>
                    
                    <div className={cn(commonStyles.pathMeta, themeStyles.pathMeta)}>
                      <div className={cn(commonStyles.pathMetaItem, themeStyles.pathMetaItem)}>
                        <span>⏱️</span>
                        <span>{path.estimated_duration}</span>
                      </div>
                      <div className={cn(commonStyles.pathMetaItem, themeStyles.pathMetaItem)}>
                        <span>💰</span>
                        <span>${path.salary_range.min.toLocaleString()} - ${path.salary_range.max.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className={cn(commonStyles.pathOutlook, themeStyles.pathOutlook)}>
                      <Badge variant="success">{path.job_outlook}</Badge>
                    </div>

                    <div className={cn(commonStyles.pathSkills, themeStyles.pathSkills)}>
                      <h4>Required Skills</h4>
                      <div className={cn(commonStyles.skillTags, themeStyles.skillTags)}>
                        {path.skills_required.slice(0, 4).map((skill) => (
                          <span key={skill.name} className={cn(commonStyles.skillTag, themeStyles.skillTag)}>
                            {skill.name} ({skill.level})
                          </span>
                        ))}
                      </div>
                    </div>

                    <Button variant="outline" fullWidth>Explore Path →</Button>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {activeTab === 'goals' && (
            <div className={cn(commonStyles.goalsSection, themeStyles.goalsSection)}>
              {goals.length === 0 ? (
                <ScrollReveal>
                  <Card className={cn(commonStyles.emptyCard, themeStyles.emptyCard)}>
                    <span>🎯</span>
                    <h3>No learning goals yet</h3>
                    <p>Set goals to track your progress and stay motivated</p>
                    <Button variant="primary">Create First Goal</Button>
                  </Card>
                </ScrollReveal>
              ) : (
                <StaggerContainer className={cn(commonStyles.goalsList, themeStyles.goalsList)}>
                  {goals.map((goal) => (
                    <StaggerItem key={goal.id}>
                      <Card className={cn(commonStyles.goalCard, themeStyles.goalCard)}>
                        <div className={cn(commonStyles.goalHeader, themeStyles.goalHeader)}>
                          <h3>{goal.title}</h3>
                          <Badge variant={goal.status === 'active' ? 'success' : 'default' as any}>{goal.status}</Badge>
                        </div>
                        <div className={cn(commonStyles.goalMeta, themeStyles.goalMeta)}>
                          <span>Target: {goal.target_skill} ({goal.target_level})</span>
                          {goal.deadline && <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>}
                        </div>
                        <div className={cn(commonStyles.goalProgress, themeStyles.goalProgress)}>
                          <ProgressBar value={goal.progress} max={100} {...{} as any} />
                        </div>
                        <div className={cn(commonStyles.goalActions, themeStyles.goalActions)}>
                          <Button variant="ghost" size="sm">Update Progress</Button>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </div>
                      </Card>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </div>
          )}

          {activeTab === 'mentors' && (
            <div className={cn(commonStyles.mentorsSection, themeStyles.mentorsSection)}>
              <StaggerContainer className={cn(commonStyles.mentorsGrid, themeStyles.mentorsGrid)}>
                {mentors.map((mentor) => (
                  <StaggerItem key={mentor.id}>
                    <Card className={cn(commonStyles.mentorCard, themeStyles.mentorCard)}>
                      <div className={cn(commonStyles.mentorAvatar, themeStyles.mentorAvatar)}>
                        {mentor.name.charAt(0)}
                      </div>
                      <h3 className={cn(commonStyles.mentorName, themeStyles.mentorName)}>{mentor.name}</h3>
                      <div className={cn(commonStyles.mentorRating, themeStyles.mentorRating)}>
                        <span>⭐ {mentor.rating}</span>
                        <span>•</span>
                        <span>{mentor.mentees_count} mentees</span>
                      </div>
                      <div className={cn(commonStyles.mentorExpertise, themeStyles.mentorExpertise)}>
                        {mentor.expertise.map((exp) => (
                          <Badge key={exp} variant={"default" as any} size="sm">{exp}</Badge>
                        ))}
                      </div>
                      <div className={cn(commonStyles.mentorMeta, themeStyles.mentorMeta)}>
                        <span>{mentor.experience_years} years exp</span>
                        <span>Available: {mentor.availability}</span>
                      </div>
                      {mentor.hourly_rate && (
                        <div className={cn(commonStyles.mentorRate, themeStyles.mentorRate)}>
                          ${mentor.hourly_rate}/hr
                        </div>
                      )}
                      <Button variant="primary" fullWidth>Request Mentorship</Button>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
