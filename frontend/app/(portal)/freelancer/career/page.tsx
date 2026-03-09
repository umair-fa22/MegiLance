// @AI-HINT: Career development page - Skill growth, career paths, mentorship, goal creation, progress tracking
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { careerApi } from '@/lib/api';
import Card from '@/app/components/Card/Card';
import Badge from '@/app/components/Badge/Badge';
import ProgressBar from '@/app/components/ProgressBar/ProgressBar';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Loading from '@/app/components/Loading/Loading';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { TrendingUp, Target, BookOpen, Users, Award, ChevronRight, Plus, X, Calendar, Clock, Star, Briefcase, GraduationCap, CheckCircle } from 'lucide-react';
import commonStyles from './Career.common.module.css';
import lightStyles from './Career.light.module.css';
import darkStyles from './Career.dark.module.css';

const _careerApi: any = careerApi;

interface CareerPath {
  id: string;
  name: string;
  description: string;
  skills_required: { name: string; level: string }[];
  milestones: { name: string; duration: string; completed?: boolean }[];
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
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const [goalForm, setGoalForm] = useState({ title: '', target_skill: '', target_level: 'intermediate', deadline: '' });
  const [savingGoal, setSavingGoal] = useState(false);

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  useEffect(() => {
    loadCareerData();
  }, []);

  const loadCareerData = async () => {
    try {
      setLoading(true);
      const [pathsData, progressData, goalsData, mentorsData, recsData] = await Promise.all([
        _careerApi.getPaths().catch(() => []),
        _careerApi.getMyProgress().catch(() => []),
        _careerApi.getGoals().catch(() => []),
        _careerApi.findMentors().catch(() => []),
        _careerApi.getRecommendations().catch(() => null),
      ]);
      setPaths(Array.isArray(pathsData) ? pathsData : []);
      setProgress(Array.isArray(progressData) ? progressData : []);
      setGoals(Array.isArray(goalsData) ? goalsData : []);
      setMentors(Array.isArray(mentorsData) ? mentorsData : []);
      setRecommendations(recsData);
    } catch (error) {
      console.error('Failed to load career data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = useCallback(async () => {
    if (!goalForm.title || !goalForm.target_skill) return;
    try {
      setSavingGoal(true);
      await _careerApi.createGoal?.(goalForm);
      setShowGoalModal(false);
      setGoalForm({ title: '', target_skill: '', target_level: 'intermediate', deadline: '' });
      await loadCareerData();
    } catch {
      // Goal API may not exist yet - add locally for demo
      setGoals(prev => [...prev, {
        id: `goal-${Date.now()}`,
        title: goalForm.title,
        target_skill: goalForm.target_skill,
        target_level: goalForm.target_level,
        progress: 0,
        status: 'active',
        deadline: goalForm.deadline || undefined,
      }]);
      setShowGoalModal(false);
      setGoalForm({ title: '', target_skill: '', target_level: 'intermediate', deadline: '' });
    } finally {
      setSavingGoal(false);
    }
  }, [goalForm]);

  if (loading) return <Loading />;

  const tabs = [
    { id: 'progress', label: 'My Progress', icon: <TrendingUp size={16} /> },
    { id: 'paths', label: 'Career Paths', icon: <Briefcase size={16} /> },
    { id: 'goals', label: 'Learning Goals', icon: <Target size={16} /> },
    { id: 'mentors', label: 'Find Mentors', icon: <Users size={16} /> },
  ];

  const levelColors: Record<string, string> = {
    beginner: '#f59e0b',
    intermediate: '#3b82f6',
    advanced: '#22c55e',
    expert: '#a855f7',
  };

  const totalHours = progress.reduce((sum, p) => sum + p.hours_invested, 0);
  const totalCerts = progress.reduce((sum, p) => sum + p.certifications.length, 0);
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;

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
            <Button variant="primary" onClick={() => { setActiveTab('goals'); setShowGoalModal(true); }}>
              <Plus size={16} /> Set New Goal
            </Button>
          </div>
        </ScrollReveal>

        {/* Quick Stats */}
        <StaggerContainer className={cn(commonStyles.statsRow, themeStyles.statsRow)} delay={0.1}>
          {[
            { icon: <TrendingUp size={22} />, value: progress.length, label: 'Skills Tracked', color: '#4573df' },
            { icon: <Target size={22} />, value: activeGoals, label: 'Active Goals', color: '#f59e0b' },
            { icon: <Clock size={22} />, value: totalHours, label: 'Hours Invested', color: '#10b981' },
            { icon: <Award size={22} />, value: totalCerts, label: 'Certifications', color: '#8b5cf6' },
          ].map((stat, i) => (
            <StaggerItem key={i}>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statIconWrapper, themeStyles.statIconWrapper)} style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <div className={commonStyles.statInfo}>
                  <strong className={cn(themeStyles.statValue)}>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Tabs */}
        <ScrollReveal delay={0.2}>
          <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
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
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </ScrollReveal>

        <div className={commonStyles.tabContent}>
          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <div>
              {progress.length === 0 ? (
                <ScrollReveal>
                  <div className={cn(commonStyles.emptyCard, themeStyles.emptyCard)}>
                    <TrendingUp size={48} />
                    <h3>No Skills Tracked Yet</h3>
                    <p>Complete projects and set learning goals to start tracking your skill growth</p>
                    <Button variant="primary" onClick={() => setActiveTab('goals')}>Set a Learning Goal</Button>
                  </div>
                </ScrollReveal>
              ) : (
                <>
                  <StaggerContainer className={commonStyles.skillsGrid}>
                    {progress.map((skill) => (
                      <StaggerItem key={skill.skill_id}>
                        <div className={cn(commonStyles.skillCard, themeStyles.skillCard)}>
                          <div className={commonStyles.skillHeader}>
                            <h3 className={cn(themeStyles.skillName)}>{skill.skill_name}</h3>
                            <span
                              className={commonStyles.levelBadge}
                              style={{ background: `${levelColors[skill.current_level] || '#6b7280'}20`, color: levelColors[skill.current_level] || '#6b7280' }}
                            >
                              {skill.current_level}
                            </span>
                          </div>
                          <div className={commonStyles.skillProgress}>
                            <div className={cn(commonStyles.progressLabel, themeStyles.progressLabel)}>
                              <span>Progress to {skill.target_level}</span>
                              <span className={commonStyles.progressValue}>{skill.progress_percentage.toFixed(0)}%</span>
                            </div>
                            <div className={cn(commonStyles.progressBarTrack, themeStyles.progressBarTrack)}>
                              <div
                                className={commonStyles.progressBarFill}
                                style={{
                                  width: `${skill.progress_percentage}%`,
                                  background: levelColors[skill.current_level] || '#4573df'
                                }}
                              />
                            </div>
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
                          {skill.certifications.length > 0 && (
                            <div className={cn(commonStyles.certsList, themeStyles.certsList)}>
                              {skill.certifications.map((cert, i) => (
                                <span key={i} className={cn(commonStyles.certBadge, themeStyles.certBadge)}>
                                  <CheckCircle size={12} /> {cert}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>

                  {/* Recommendations */}
                  {recommendations && (
                    <ScrollReveal delay={0.3}>
                      <div className={cn(commonStyles.recsCard, themeStyles.recsCard)}>
                        <h3><GraduationCap size={20} /> Recommended for You</h3>
                        <div className={commonStyles.recsGrid}>
                          {recommendations.recommended_skills?.length > 0 && (
                            <div className={commonStyles.recSection}>
                              <h4>🎯 Skills to Learn</h4>
                              {recommendations.recommended_skills.map((skill: any) => (
                                <div key={skill.skill} className={cn(commonStyles.recItem, themeStyles.recItem)}>
                                  <span className={cn(themeStyles.recItemTitle)}>{skill.skill}</span>
                                  <span className={cn(commonStyles.recReason, themeStyles.recReason)}>{skill.reason}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {recommendations.recommended_courses?.length > 0 && (
                            <div className={commonStyles.recSection}>
                              <h4>📚 Courses</h4>
                              {recommendations.recommended_courses.map((course: any) => (
                                <div key={course.title} className={cn(commonStyles.recItem, themeStyles.recItem)}>
                                  <span className={cn(themeStyles.recItemTitle)}>{course.title}</span>
                                  <span className={cn(commonStyles.recProvider, themeStyles.recProvider)}>{course.provider}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </ScrollReveal>
                  )}
                </>
              )}
            </div>
          )}

          {/* Paths Tab */}
          {activeTab === 'paths' && (
            <div>
              {paths.length === 0 ? (
                <ScrollReveal>
                  <div className={cn(commonStyles.emptyCard, themeStyles.emptyCard)}>
                    <Briefcase size={48} />
                    <h3>No Career Paths Available</h3>
                    <p>Career path recommendations will appear as you build your profile</p>
                  </div>
                </ScrollReveal>
              ) : (
                <StaggerContainer className={commonStyles.pathsGrid}>
                  {paths.map((path) => (
                    <StaggerItem key={path.id}>
                      <div className={cn(commonStyles.pathCard, themeStyles.pathCard)}>
                        <h3 className={cn(commonStyles.pathName, themeStyles.pathName)}>{path.name}</h3>
                        <p className={cn(commonStyles.pathDesc, themeStyles.pathDesc)}>{path.description}</p>

                        <div className={commonStyles.pathMeta}>
                          <div className={cn(commonStyles.pathMetaItem, themeStyles.pathMetaItem)}>
                            <Clock size={14} />
                            <span>{path.estimated_duration}</span>
                          </div>
                          <div className={cn(commonStyles.pathMetaItem, themeStyles.pathMetaItem)}>
                            <span>💰</span>
                            <span>${path.salary_range.min.toLocaleString()} - ${path.salary_range.max.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className={commonStyles.pathOutlook}>
                          <Badge variant="success">{path.job_outlook}</Badge>
                        </div>

                        <div className={commonStyles.pathSkills}>
                          <h4>Required Skills</h4>
                          <div className={commonStyles.skillTags}>
                            {path.skills_required.slice(0, 5).map((skill) => (
                              <span key={skill.name} className={cn(commonStyles.skillTag, themeStyles.skillTag)}>
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Milestones - expandable */}
                        {path.milestones?.length > 0 && (
                          <div className={commonStyles.milestonesSection}>
                            <button
                              className={cn(commonStyles.milestonesToggle, themeStyles.milestonesToggle)}
                              onClick={() => setExpandedPath(expandedPath === path.id ? null : path.id)}
                            >
                              <span>Milestones ({path.milestones.length})</span>
                              <ChevronRight
                                size={16}
                                className={cn(commonStyles.toggleIcon, expandedPath === path.id && commonStyles.toggleIconOpen)}
                              />
                            </button>
                            {expandedPath === path.id && (
                              <div className={cn(commonStyles.milestonesList, themeStyles.milestonesList)}>
                                {path.milestones.map((ms, i) => (
                                  <div key={i} className={cn(commonStyles.milestoneItem, themeStyles.milestoneItem)}>
                                    <div className={cn(
                                      commonStyles.milestoneDot,
                                      ms.completed && commonStyles.milestoneDotDone
                                    )} />
                                    <div className={commonStyles.milestoneInfo}>
                                      <span className={cn(commonStyles.milestoneName, themeStyles.milestoneName)}>{ms.name}</span>
                                      <span className={cn(commonStyles.milestoneDuration, themeStyles.milestoneDuration)}>{ms.duration}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <Button variant="outline" fullWidth onClick={() => setExpandedPath(expandedPath === path.id ? null : path.id)}>
                          Explore Path →
                        </Button>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <div>
              <div className={commonStyles.goalsHeader}>
                <div className={cn(commonStyles.goalsStats, themeStyles.goalsStats)}>
                  <span>{activeGoals} active</span>
                  <span>•</span>
                  <span>{completedGoals} completed</span>
                </div>
                <Button variant="primary" size="sm" onClick={() => setShowGoalModal(true)}>
                  <Plus size={14} /> New Goal
                </Button>
              </div>

              {goals.length === 0 ? (
                <ScrollReveal>
                  <div className={cn(commonStyles.emptyCard, themeStyles.emptyCard)}>
                    <Target size={48} />
                    <h3>No Learning Goals Yet</h3>
                    <p>Set goals to track your progress and stay motivated</p>
                    <Button variant="primary" onClick={() => setShowGoalModal(true)}>Create First Goal</Button>
                  </div>
                </ScrollReveal>
              ) : (
                <StaggerContainer className={commonStyles.goalsList}>
                  {goals.map((goal) => (
                    <StaggerItem key={goal.id}>
                      <div className={cn(commonStyles.goalCard, themeStyles.goalCard)}>
                        <div className={commonStyles.goalHeader}>
                          <h3>{goal.title}</h3>
                          <Badge variant={goal.status === 'active' ? 'success' : goal.status === 'completed' ? 'default' : 'warning' as any}>
                            {goal.status}
                          </Badge>
                        </div>
                        <div className={cn(commonStyles.goalMeta, themeStyles.goalMeta)}>
                          <span><BookOpen size={14} /> {goal.target_skill} → {goal.target_level}</span>
                          {goal.deadline && (
                            <span>
                              <Calendar size={14} />{' '}
                              {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <div className={commonStyles.goalProgress}>
                          <div className={cn(commonStyles.progressLabel, themeStyles.progressLabel)}>
                            <span>Progress</span>
                            <span>{goal.progress}%</span>
                          </div>
                          <div className={cn(commonStyles.progressBarTrack, themeStyles.progressBarTrack)}>
                            <div
                              className={commonStyles.progressBarFill}
                              style={{ width: `${goal.progress}%`, background: goal.progress >= 100 ? '#22c55e' : '#4573df' }}
                            />
                          </div>
                        </div>
                        {goal.deadline && (
                          <div className={cn(commonStyles.deadlineWarning, themeStyles.deadlineWarning)}>
                            {(() => {
                              const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000);
                              if (daysLeft < 0) return <span className={commonStyles.overdue}>Overdue by {Math.abs(daysLeft)} days</span>;
                              if (daysLeft <= 7) return <span className={commonStyles.urgent}>{daysLeft} days remaining</span>;
                              return <span>{daysLeft} days remaining</span>;
                            })()}
                          </div>
                        )}
                        <div className={commonStyles.goalActions}>
                          <Button variant="ghost" size="sm">Update Progress</Button>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </div>
          )}

          {/* Mentors Tab */}
          {activeTab === 'mentors' && (
            <div>
              {mentors.length === 0 ? (
                <ScrollReveal>
                  <div className={cn(commonStyles.emptyCard, themeStyles.emptyCard)}>
                    <Users size={48} />
                    <h3>No Mentors Available</h3>
                    <p>Mentors in your skill areas will appear here soon</p>
                  </div>
                </ScrollReveal>
              ) : (
                <StaggerContainer className={commonStyles.mentorsGrid}>
                  {mentors.map((mentor) => (
                    <StaggerItem key={mentor.id}>
                      <div className={cn(commonStyles.mentorCard, themeStyles.mentorCard)}>
                        <div className={cn(commonStyles.mentorAvatar, themeStyles.mentorAvatar)}>
                          {mentor.name.charAt(0)}
                        </div>
                        <h3 className={cn(commonStyles.mentorName, themeStyles.mentorName)}>{mentor.name}</h3>
                        <div className={cn(commonStyles.mentorRating, themeStyles.mentorRating)}>
                          <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                          <span>{mentor.rating}</span>
                          <span className={cn(commonStyles.mentorDot)}>•</span>
                          <span>{mentor.mentees_count} mentees</span>
                        </div>
                        <div className={commonStyles.mentorExpertise}>
                          {mentor.expertise.slice(0, 4).map((exp) => (
                            <span key={exp} className={cn(commonStyles.expertiseTag, themeStyles.expertiseTag)}>{exp}</span>
                          ))}
                        </div>
                        <div className={cn(commonStyles.mentorMeta, themeStyles.mentorMeta)}>
                          <span><Briefcase size={12} /> {mentor.experience_years} yrs exp</span>
                          <span><Clock size={12} /> {mentor.availability}</span>
                        </div>
                        {mentor.hourly_rate && (
                          <div className={cn(commonStyles.mentorRate, themeStyles.mentorRate)}>
                            ${mentor.hourly_rate}/hr
                          </div>
                        )}
                        <Button variant="primary" fullWidth>Request Mentorship</Button>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </div>
          )}
        </div>

        {/* Goal Creation Modal */}
        {showGoalModal && (
          <div className={commonStyles.modalOverlay} onClick={() => setShowGoalModal(false)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
              <div className={commonStyles.modalHeader}>
                <h3 className={cn(themeStyles.modalTitle)}>Create Learning Goal</h3>
                <button className={cn(commonStyles.modalClose, themeStyles.modalClose)} onClick={() => setShowGoalModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className={commonStyles.modalBody}>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>Goal Title</label>
                  <Input
                    placeholder="e.g., Master React Server Components"
                    value={goalForm.title}
                    onChange={(e: any) => setGoalForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>Target Skill</label>
                  <Input
                    placeholder="e.g., React, TypeScript, Python"
                    value={goalForm.target_skill}
                    onChange={(e: any) => setGoalForm(prev => ({ ...prev, target_skill: e.target.value }))}
                  />
                </div>
                <div className={commonStyles.formRow}>
                  <div className={commonStyles.formGroup}>
                    <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>Target Level</label>
                    <select
                      className={cn(commonStyles.formSelect, themeStyles.formSelect)}
                      value={goalForm.target_level}
                      onChange={e => setGoalForm(prev => ({ ...prev, target_level: e.target.value }))}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  <div className={commonStyles.formGroup}>
                    <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>Deadline (optional)</label>
                    <Input
                      type="date"
                      value={goalForm.deadline}
                      onChange={(e: any) => setGoalForm(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className={commonStyles.modalFooter}>
                <Button variant="ghost" onClick={() => setShowGoalModal(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  onClick={handleCreateGoal}
                  isLoading={savingGoal}
                  {...{ disabled: !goalForm.title || !goalForm.target_skill } as any}
                >
                  Create Goal
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
