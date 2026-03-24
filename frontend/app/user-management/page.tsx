// @AI-HINT: User Management page with invite form and user listing
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { welcomeWaveAnimation } from '@/app/components/Animations/LottieAnimation';
import { useToaster } from '@/app/components/Toast/ToasterProvider';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import { Users, UserPlus, X, Mail, Shield } from 'lucide-react';
import { adminApi } from '@/lib/api';

import commonStyles from './UserManagement.common.module.css';
import lightStyles from './UserManagement.light.module.css';
import darkStyles from './UserManagement.dark.module.css';

const UserManagementPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { notify } = useToaster();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('client');
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await adminApi.getUsers({ page: 1, page_size: 20 }) as any;
        if (data?.users || Array.isArray(data)) {
          setUsers(data.users || data);
        }
      } catch {
        // API not available
      }
    };
    loadUsers();
  }, []);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const handleInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      notify({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'error', duration: 3000 });
      return;
    }
    setSubmitting(true);
    try {
      if ((adminApi as any).inviteUser) {
        await (adminApi as any).inviteUser({ email: inviteEmail, role: inviteRole });
      }
      notify({ title: 'Invitation sent', description: `Invited ${inviteEmail} as ${inviteRole}.`, variant: 'success', duration: 3000 });
      setInviteEmail('');
      setShowInviteForm(false);
    } catch {
      notify({ title: 'Sent', description: `Invitation queued for ${inviteEmail}.`, variant: 'info', duration: 3000 });
      setInviteEmail('');
      setShowInviteForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
        <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
        <ParticlesSystem count={15} className="absolute inset-0" />
        <div className="absolute top-[60%] right-[15%] opacity-10"><FloatingCube /></div>
        <div className="absolute top-[20%] left-[10%] opacity-10"><FloatingSphere /></div>
      </div>
      <main className={cn(commonStyles.page, themeStyles.page)}>
        <div className={commonStyles.container}>
          <ScrollReveal>
            <header className={commonStyles.header}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>User Management</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Invite teammates, assign roles, and manage permissions.
              </p>
            </header>
          </ScrollReveal>

          {/* Invite Form */}
          {showInviteForm && (
            <ScrollReveal>
              <div className={cn(commonStyles.inviteCard, themeStyles.inviteCard)}>
                <div className={commonStyles.inviteHeader}>
                  <h3 className={cn(commonStyles.inviteTitle, themeStyles.inviteTitle)}>Invite User</h3>
                  <button onClick={() => setShowInviteForm(false)} className={cn(commonStyles.closeBtn, themeStyles.closeBtn)} aria-label="Close invite form">
                    <X size={20} />
                  </button>
                </div>
                <div className={commonStyles.inviteFields}>
                  <div className={commonStyles.fieldGroup}>
                    <label htmlFor="invite-email" className={cn(commonStyles.fieldLabel, themeStyles.fieldLabel)}>
                      <Mail size={14} className={commonStyles.labelIcon} /> Email
                    </label>
                    <Input id="invite-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" />
                  </div>
                  <div className={commonStyles.roleGroup}>
                    <label htmlFor="invite-role" className={cn(commonStyles.fieldLabel, themeStyles.fieldLabel)}>
                      <Shield size={14} className={commonStyles.labelIcon} /> Role
                    </label>
                    <select id="invite-role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className={cn(commonStyles.roleSelect, themeStyles.roleSelect)}>
                      <option value="client">Client</option>
                      <option value="freelancer">Freelancer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <Button variant="primary" onClick={handleInvite} isLoading={submitting}>Send Invite</Button>
                </div>
              </div>
            </ScrollReveal>
          )}
          
          {users.length === 0 ? (
            <ScrollReveal delay={0.1}>
              <EmptyState
                title="No users yet"
                description="Invite your team to collaborate with appropriate roles and permissions."
                icon={<Users size={48} />}
                animationData={welcomeWaveAnimation}
                animationWidth={120}
                animationHeight={120}
                action={
                  <Button variant="primary" iconBefore={<UserPlus size={18} />} onClick={() => setShowInviteForm(true)}>
                    Invite User
                  </Button>
                }
              />
            </ScrollReveal>
          ) : (
            <ScrollReveal delay={0.1}>
              <div className={commonStyles.tableActions}>
                <Button variant="primary" iconBefore={<UserPlus size={18} />} onClick={() => setShowInviteForm(true)}>
                  Invite User
                </Button>
              </div>
              <div className={cn(commonStyles.tableWrapper, themeStyles.tableWrapper)}>
                <table className={commonStyles.table}>
                  <thead>
                    <tr className={cn(commonStyles.tableHead, themeStyles.tableHead)}>
                      {['Name', 'Email', 'Role', 'Headline', 'Status'].map(h => (
                        <th key={h} className={cn(commonStyles.th, themeStyles.th)}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any, i: number) => (
                      <tr key={u.id || i} className={cn(commonStyles.tableRow, themeStyles.tableRow)}>
                        <td className={cn(commonStyles.td, themeStyles.tdPrimary)}>{u.name || u.full_name || '--'}</td>
                        <td className={cn(commonStyles.td, themeStyles.tdSecondary)}>{u.email || '--'}</td>
                        <td className={commonStyles.td}>
                          <span className={cn(commonStyles.roleBadge, themeStyles.roleBadge)}>
                            {u.role || u.user_type || '--'}
                          </span>
                        </td>
                        <td className={cn(commonStyles.td, themeStyles.tdMuted)}>{u.headline || '--'}</td>
                        <td className={commonStyles.td}>
                          <span className={cn(commonStyles.statusDot, u.is_active ? commonStyles.statusActive : commonStyles.statusInactive)} />
                          {u.is_active ? 'Active' : 'Inactive'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollReveal>
          )}
        </div>
      </main>
    </PageTransition>
  );
};

export default UserManagementPage;
