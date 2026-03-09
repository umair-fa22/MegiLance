// @AI-HINT: Enhanced freelancer skills management page with stats, search/filter, sort, and recommendations
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Modal from '@/app/components/Modal/Modal';
import Loading from '@/app/components/Loading/Loading';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { portalApi } from '@/lib/api';
import {
  Plus, Star, Trash2, CheckCircle, ThumbsUp, Search, X,
  ArrowUpDown, Zap, Award, BarChart3, TrendingUp, Sparkles,
} from 'lucide-react';
import commonStyles from './Skills.common.module.css';
import lightStyles from './Skills.light.module.css';
import darkStyles from './Skills.dark.module.css';

interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_experience: number;
  endorsements: number;
  verified: boolean;
}

type SortOption = 'name' | 'level' | 'endorsements' | 'experience';
type FilterLevel = '' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

const LEVEL_ORDER = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Learning the basics' },
  { value: 'intermediate', label: 'Intermediate', description: '1-3 years experience' },
  { value: 'advanced', label: 'Advanced', description: '3-5 years experience' },
  { value: 'expert', label: 'Expert', description: '5+ years experience' },
];

const POPULAR_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Next.js',
  'UI/UX Design', 'Figma', 'GraphQL', 'AWS', 'Docker', 'PostgreSQL',
  'Machine Learning', 'Data Analysis', 'Mobile Development', 'SEO',
];

const TRENDING_SKILLS = [
  { name: 'AI/ML Engineering', growth: '+45%', hot: true },
  { name: 'Rust', growth: '+32%', hot: true },
  { name: 'Next.js 16', growth: '+28%', hot: false },
  { name: 'LLM Fine-tuning', growth: '+52%', hot: true },
  { name: 'Kubernetes', growth: '+18%', hot: false },
  { name: 'Svelte', growth: '+22%', hot: false },
];

export default function SkillsPage() {
  const { resolvedTheme } = useTheme();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkill, setNewSkill] = useState<{ name: string; level: Skill['level']; years_experience: number }>({ name: '', level: 'intermediate', years_experience: 1 });
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('');

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { loadSkills(); }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      try {
        const response = await portalApi.freelancer.getSkills() as { data?: Skill[] };
        if (response.data && response.data.length > 0) { setSkills(response.data); return; }
      } catch { /* API not available */ }
      setSkills([]);
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally { setLoading(false); }
  };

  // Stats
  const stats = useMemo(() => {
    const totalEndorsements = skills.reduce((sum, s) => sum + s.endorsements, 0);
    const verified = skills.filter(s => s.verified).length;
    const expertCount = skills.filter(s => s.level === 'expert' || s.level === 'advanced').length;
    return { total: skills.length, totalEndorsements, verified, expertCount };
  }, [skills]);

  // Filtered & sorted
  const filteredSkills = useMemo(() => {
    let result = [...skills];
    if (filterLevel) result = result.filter(s => s.level === filterLevel);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case 'level': result.sort((a, b) => LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level]); break;
      case 'endorsements': result.sort((a, b) => b.endorsements - a.endorsements); break;
      case 'experience': result.sort((a, b) => b.years_experience - a.years_experience); break;
      default: result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [skills, filterLevel, searchQuery, sortBy]);

  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) return;
    setSaving(true);
    try {
      const skillData = { name: newSkill.name, level: newSkill.level, years_experience: newSkill.years_experience };
      let addedSkill: Skill;
      try {
        const response = await (portalApi.freelancer as any).addSkill(skillData) as { data?: Skill };
        addedSkill = response.data || { ...skillData, id: Date.now().toString(), endorsements: 0, verified: false };
      } catch {
        addedSkill = { ...skillData, id: Date.now().toString(), endorsements: 0, verified: false };
      }
      setSkills(prev => [...prev, addedSkill]);
      setNewSkill({ name: '', level: 'intermediate', years_experience: 1 });
      setShowAddModal(false);
      showToast('Skill added successfully!');
    } catch {
      showToast('Failed to add skill.', 'error');
    } finally { setSaving(false); }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try { await (portalApi.freelancer as any).removeSkill(skillId); } catch { /* local */ }
    setSkills(prev => prev.filter(s => s.id !== skillId));
    setDeleteTargetId(null);
    showToast('Skill removed.');
  };

  const handleAddTrending = (name: string) => {
    setNewSkill({ name, level: 'intermediate', years_experience: 1 });
    setShowAddModal(true);
  };

  const getLevelColor = (level: string) => level;

  if (!resolvedTheme) return null;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        {/* Header */}
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>
                <Award size={26} /> Skills & Expertise
              </h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Showcase your professional skills to attract clients
              </p>
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add Skill
            </Button>
          </div>
        </ScrollReveal>

        {/* Stats Row */}
        {skills.length > 0 && (
          <ScrollReveal delay={0.05}>
            <div className={commonStyles.statsRow}>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <BarChart3 size={18} className={commonStyles.statIconBlue} />
                <div>
                  <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.total}</div>
                  <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Skills</div>
                </div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <ThumbsUp size={18} className={commonStyles.statIconPurple} />
                <div>
                  <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.totalEndorsements}</div>
                  <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Endorsements</div>
                </div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <CheckCircle size={18} className={commonStyles.statIconGreen} />
                <div>
                  <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.verified}</div>
                  <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Verified</div>
                </div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <Star size={18} className={commonStyles.statIconOrange} />
                <div>
                  <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.expertCount}</div>
                  <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Expert Level</div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Toolbar */}
        {skills.length > 0 && (
          <ScrollReveal delay={0.1}>
            <div className={cn(commonStyles.toolbar, themeStyles.toolbar)}>
              <div className={cn(commonStyles.searchWrap, themeStyles.searchWrap)}>
                <Search size={16} className={commonStyles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={cn(commonStyles.searchInput, themeStyles.searchInput)}
                  aria-label="Search skills"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className={commonStyles.searchClear} aria-label="Clear">
                    <X size={14} />
                  </button>
                )}
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className={cn(commonStyles.sortSelect, themeStyles.sortSelect)}
                aria-label="Sort by"
              >
                <option value="name">Name</option>
                <option value="level">Level</option>
                <option value="endorsements">Endorsements</option>
                <option value="experience">Experience</option>
              </select>
              <select
                value={filterLevel}
                onChange={e => setFilterLevel(e.target.value as FilterLevel)}
                className={cn(commonStyles.sortSelect, themeStyles.sortSelect)}
                aria-label="Filter by level"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
              <span className={cn(commonStyles.resultCount, themeStyles.resultCount)}>
                {filteredSkills.length} skill{filteredSkills.length !== 1 ? 's' : ''}
              </span>
            </div>
          </ScrollReveal>
        )}

        {/* Skills Grid */}
        {loading ? <Loading /> : skills.length === 0 ? (
          <EmptyState
            icon={<Star size={48} />}
            title="No Skills Added"
            description="Add your professional skills to improve your profile visibility"
            action={<Button variant="primary" onClick={() => setShowAddModal(true)}>Add Your First Skill</Button>}
          />
        ) : filteredSkills.length === 0 ? (
          <div className={cn(commonStyles.emptyFiltered, themeStyles.emptyFiltered)}>
            <p>No skills match your filters.</p>
          </div>
        ) : (
          <StaggerContainer className={commonStyles.skillsGrid}>
            {filteredSkills.map(skill => (
              <StaggerItem key={skill.id}>
                <div className={cn(commonStyles.skillCard, themeStyles.skillCard)}>
                  <div className={commonStyles.skillHeader}>
                    <div className={commonStyles.skillInfo}>
                      <h3 className={cn(commonStyles.skillName, themeStyles.skillName)}>
                        {skill.name}
                        {skill.verified && <CheckCircle className={commonStyles.verifiedIcon} size={16} color="#4573df" />}
                      </h3>
                      <span className={cn(
                        commonStyles.skillLevel,
                        commonStyles[`level_${getLevelColor(skill.level)}`],
                        themeStyles[`level_${getLevelColor(skill.level)}`]
                      )}>
                        {skill.level}
                      </span>
                    </div>
                    <button
                      className={cn(commonStyles.removeBtn, themeStyles.removeBtn)}
                      onClick={() => setDeleteTargetId(skill.id)}
                      aria-label="Remove skill"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className={commonStyles.skillMeta}>
                    <span className={cn(commonStyles.experience, themeStyles.experience)}>
                      {skill.years_experience} year{skill.years_experience !== 1 ? 's' : ''} exp
                    </span>
                    <span className={cn(commonStyles.endorsements, themeStyles.endorsements)}>
                      <ThumbsUp size={14} /> {skill.endorsements}
                    </span>
                  </div>
                  <div className={commonStyles.progressBar}>
                    <div
                      className={cn(commonStyles.progressFill, themeStyles.progressFill)}
                      style={{
                        width: skill.level === 'beginner' ? '25%' :
                               skill.level === 'intermediate' ? '50%' :
                               skill.level === 'advanced' ? '75%' : '100%'
                      }}
                    />
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* Trending Skills Recommendations */}
        <ScrollReveal delay={0.2}>
          <div className={cn(commonStyles.trendingCard, themeStyles.trendingCard)}>
            <h2 className={cn(commonStyles.trendingTitle, themeStyles.trendingTitle)}>
              <Sparkles size={18} /> Trending Skills
            </h2>
            <p className={cn(commonStyles.trendingDesc, themeStyles.trendingDesc)}>
              Skills with growing demand on the platform
            </p>
            <div className={commonStyles.trendingGrid}>
              {TRENDING_SKILLS
                .filter(t => !skills.some(s => s.name.toLowerCase() === t.name.toLowerCase()))
                .map((t, i) => (
                <button
                  key={i}
                  className={cn(commonStyles.trendingItem, themeStyles.trendingItem)}
                  onClick={() => handleAddTrending(t.name)}
                  aria-label={`Add ${t.name}`}
                >
                  <span className={cn(commonStyles.trendingName, themeStyles.trendingName)}>
                    {t.hot && <Zap size={12} className={commonStyles.hotIcon} />}
                    {t.name}
                  </span>
                  <span className={cn(commonStyles.trendingGrowth, commonStyles.trendUp)}>{t.growth}</span>
                  <Plus size={14} className={commonStyles.trendingAdd} />
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Add Skill Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Skill">
          <div className={commonStyles.formGroup}>
            <label className={cn(commonStyles.label, themeStyles.label)}>Skill Name</label>
            <Input
              value={newSkill.name}
              onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., React, Python, UI Design"
            />
            <div className={commonStyles.suggestions}>
              {POPULAR_SKILLS.filter(s =>
                !skills.some(skill => skill.name.toLowerCase() === s.toLowerCase()) &&
                (newSkill.name === '' || s.toLowerCase().includes(newSkill.name.toLowerCase()))
              ).slice(0, 6).map(suggestion => (
                <button
                  key={suggestion}
                  className={cn(commonStyles.suggestionChip, themeStyles.suggestionChip)}
                  onClick={() => setNewSkill(prev => ({ ...prev, name: suggestion }))}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className={commonStyles.formGroup}>
            <label className={cn(commonStyles.label, themeStyles.label)}>Experience Level</label>
            <div className={commonStyles.levelOptions}>
              {SKILL_LEVELS.map(level => (
                <button
                  key={level.value}
                  className={cn(
                    commonStyles.levelOption,
                    themeStyles.levelOption,
                    newSkill.level === level.value && commonStyles.levelOptionActive,
                    newSkill.level === level.value && themeStyles.levelOptionActive
                  )}
                  onClick={() => setNewSkill(prev => ({ ...prev, level: level.value as Skill['level'] }))}
                >
                  <span className={commonStyles.levelLabel}>{level.label}</span>
                  <span className={cn(commonStyles.levelDesc, themeStyles.levelDesc)}>{level.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={commonStyles.formGroup}>
            <label className={cn(commonStyles.label, themeStyles.label)}>Years of Experience</label>
            <Input
              type="number"
              min={0}
              max={30}
              value={newSkill.years_experience}
              onChange={(e) => setNewSkill(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div className={commonStyles.modalActions}>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddSkill} isLoading={saving} disabled={!newSkill.name.trim()}>
              Add Skill
            </Button>
          </div>
        </Modal>

        {/* Delete Confirmation */}
        <Modal isOpen={!!deleteTargetId} onClose={() => setDeleteTargetId(null)} title="Remove Skill">
          <p className={cn(commonStyles.confirmText, themeStyles.confirmText)}>
            Are you sure you want to remove this skill from your profile?
          </p>
          <div className={commonStyles.modalActions}>
            <Button variant="ghost" onClick={() => setDeleteTargetId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteTargetId && handleRemoveSkill(deleteTargetId)}>Remove</Button>
          </div>
        </Modal>

        {/* Toast */}
        {toast && (
          <div className={cn(
            commonStyles.toast, themeStyles.toast,
            toast.type === 'error' && commonStyles.toastError,
            toast.type === 'error' && themeStyles.toastError
          )}>
            {toast.message}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
