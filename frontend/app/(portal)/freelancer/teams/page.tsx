// @AI-HINT: Teams/Collaboration page - Manage team members, invites, role permissions, and team activity
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { teamsApi as _teamsApi } from '@/lib/api';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './Teams.common.module.css';
import lightStyles from './Teams.light.module.css';
import darkStyles from './Teams.dark.module.css';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Badge from '@/app/components/Badge/Badge';
import {
  Users, UserPlus, Mail, Shield, Eye, Trash2, RotateCw, X,
  Search, Crown, Settings, Clock, CheckCircle, AlertCircle,
  UserCheck, UserX, Copy, Plus, ChevronDown, ChevronUp,
  Lock, Unlock, FileText, MessageSquare, FolderOpen, CreditCard,
  Activity, MoreVertical
} from 'lucide-react';

const teamsApi: any = _teamsApi;

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
  last_active?: string;
  status: 'active' | 'pending' | 'inactive';
}

interface Invite {
  id: string;
  email: string;
  role: string;
  sent_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired';
}

const ROLE_CONFIG = {
  owner: {
    icon: Crown,
    label: 'Owner',
    color: 'warning' as const,
    description: 'Full access to everything including billing and team management',
    permissions: ['Manage billing', 'Delete team', 'Manage members', 'Manage projects', 'View analytics', 'Access all files'],
  },
  admin: {
    icon: Shield,
    label: 'Admin',
    color: 'primary' as const,
    description: 'Can manage team members, projects, and settings',
    permissions: ['Manage members', 'Manage projects', 'View analytics', 'Access all files', 'Invite members'],
  },
  member: {
    icon: Users,
    label: 'Member',
    color: 'default' as const,
    description: 'Can work on assigned projects and proposals',
    permissions: ['Work on projects', 'Submit proposals', 'View team files', 'Comment on tasks'],
  },
  viewer: {
    icon: Eye,
    label: 'Viewer',
    color: 'default' as const,
    description: 'Read-only access to projects and team activity',
    permissions: ['View projects', 'View team files', 'View activity log'],
  },
};

const PERMISSION_MATRIX = [
  { name: 'Manage billing', icon: CreditCard, owner: true, admin: false, member: false, viewer: false },
  { name: 'Delete team', icon: Trash2, owner: true, admin: false, member: false, viewer: false },
  { name: 'Manage members', icon: Users, owner: true, admin: true, member: false, viewer: false },
  { name: 'Invite members', icon: UserPlus, owner: true, admin: true, member: false, viewer: false },
  { name: 'Manage projects', icon: FolderOpen, owner: true, admin: true, member: false, viewer: false },
  { name: 'View analytics', icon: Activity, owner: true, admin: true, member: false, viewer: false },
  { name: 'Work on projects', icon: FileText, owner: true, admin: true, member: true, viewer: false },
  { name: 'Submit proposals', icon: MessageSquare, owner: true, admin: true, member: true, viewer: false },
  { name: 'View team files', icon: FolderOpen, owner: true, admin: true, member: true, viewer: true },
  { name: 'View projects', icon: Eye, owner: true, admin: true, member: true, viewer: true },
];

export default function TeamsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'invites' | 'roles'>('members');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  // Multi-invite form
  const [inviteEmails, setInviteEmails] = useState<string[]>(['']);
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteSending, setInviteSending] = useState(false);

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string; label: string } | null>(null);
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setMounted(true);
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const [membersRes, invitesRes] = await Promise.all([
        teamsApi.getMembers().catch(() => null),
        teamsApi.getInvites().catch(() => null),
      ]);

      let membersData: TeamMember[] = [];
      let invitesData: Invite[] = [];

      if (membersRes && (membersRes.members?.length > 0 || (Array.isArray(membersRes) && membersRes.length > 0))) {
        membersData = membersRes.members || membersRes;
      }

      if (invitesRes && (invitesRes.invites?.length > 0 || (Array.isArray(invitesRes) && invitesRes.length > 0))) {
        invitesData = invitesRes.invites || invitesRes;
      }

      setMembers(membersData);
      setInvites(invitesData);
    } catch (error) {
      console.error('Failed to load team data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    let result = members;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'all') {
      result = result.filter(m => m.role === roleFilter);
    }
    return result;
  }, [members, searchQuery, roleFilter]);

  const filteredInvites = useMemo(() => {
    if (!searchQuery.trim()) return invites;
    const q = searchQuery.toLowerCase();
    return invites.filter(i => i.email.toLowerCase().includes(q));
  }, [invites, searchQuery]);

  const handleInvite = async () => {
    const validEmails = inviteEmails.filter(e => e.trim() && e.includes('@'));
    if (validEmails.length === 0) return;

    setInviteSending(true);
    try {
      const results = await Promise.allSettled(
        validEmails.map(email =>
          teamsApi.inviteMember({ email: email.trim(), role: inviteRole })
        )
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      setShowInviteModal(false);
      setInviteEmails(['']);
      setInviteRole('member');
      loadTeamData();

      if (failed === 0) {
        showToast(`${succeeded} invite${succeeded > 1 ? 's' : ''} sent successfully!`, 'success');
      } else {
        showToast(`${succeeded} sent, ${failed} failed`, failed > succeeded ? 'error' : 'success');
      }
    } catch (error) {
      console.error('Failed to send invites:', error);
      showToast('Failed to send invites', 'error');
    } finally {
      setInviteSending(false);
    }
  };

  const addEmailField = () => {
    if (inviteEmails.length < 10) {
      setInviteEmails([...inviteEmails, '']);
    }
  };

  const removeEmailField = (index: number) => {
    if (inviteEmails.length > 1) {
      setInviteEmails(inviteEmails.filter((_, i) => i !== index));
    }
  };

  const updateEmail = (index: number, value: string) => {
    const updated = [...inviteEmails];
    updated[index] = value;
    setInviteEmails(updated);
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await teamsApi.updateRole(memberId, newRole);
      setShowRoleModal(false);
      setSelectedMember(null);
      loadTeamData();
      showToast('Role updated successfully!', 'success');
    } catch (error) {
      console.error('Failed to update role:', error);
      showToast('Failed to update role', 'error');
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setConfirmAction({ type: 'remove-member', id: memberId, label: 'remove this team member' });
  };

  const handleResendInvite = async (inviteId: string) => {
    try {
      await teamsApi.resendInvite(inviteId);
      showToast('Invite resent successfully!', 'success');
    } catch (error) {
      console.error('Failed to resend invite:', error);
      showToast('Failed to resend invite', 'error');
    }
  };

  const handleCancelInvite = (inviteId: string) => {
    setConfirmAction({ type: 'cancel-invite', id: inviteId, label: 'cancel this invite' });
  };

  const handleCopyInviteLink = (invite: Invite) => {
    const link = `${window.location.origin}/invite/${invite.id}`;
    navigator.clipboard.writeText(link).then(() => {
      showToast('Invite link copied!', 'success');
    }).catch(() => {
      showToast('Failed to copy link', 'error');
    });
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'remove-member') {
        await teamsApi.removeMember(confirmAction.id);
        showToast('Team member removed', 'success');
      } else if (confirmAction.type === 'cancel-invite') {
        await teamsApi.cancelInvite(confirmAction.id);
        showToast('Invite cancelled', 'success');
      }
      loadTeamData();
    } catch (error) {
      console.error('Action failed:', error);
      showToast('Action failed. Please try again.', 'error');
    } finally {
      setConfirmAction(null);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 5) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const pendingInvites = invites.filter(i => i.status === 'pending');
  const activeMembers = members.filter(m => m.status === 'active');
  const roleCounts = members.reduce((acc, m) => {
    acc[m.role] = (acc[m.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tabs = [
    { id: 'members' as const, label: 'Members', icon: Users, count: members.length },
    { id: 'invites' as const, label: 'Invites', icon: Mail, count: pendingInvites.length },
    { id: 'roles' as const, label: 'Roles & Permissions', icon: Shield, count: undefined },
  ];

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.loadingState, themeStyles.loadingState)}>
          <Users size={32} className={commonStyles.loadingIcon} />
          <p>Loading team data...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        {/* Header */}
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div className={commonStyles.headerText}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>
                <Users size={28} className={commonStyles.titleIcon} />
                Team Management
              </h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage your team members, invitations, and role permissions
              </p>
            </div>
            <Button variant="primary" onClick={() => setShowInviteModal(true)}>
              <UserPlus size={16} /> Invite Member
            </Button>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <StaggerContainer delay={0.1} className={commonStyles.stats}>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIconBlue)}>
                <Users size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{members.length}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Members</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIconGreen)}>
                <UserCheck size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{activeMembers.length}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Active Now</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIconOrange)}>
                <Mail size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{pendingInvites.length}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Pending Invites</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIconPurple)}>
                <Shield size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{Object.keys(roleCounts).length}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Active Roles</span>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Search & Filter Bar */}
        <ScrollReveal delay={0.15}>
          <div className={cn(commonStyles.toolbar, themeStyles.toolbar)}>
            <div className={commonStyles.searchWrapper}>
              <Search size={16} className={cn(commonStyles.searchIcon, themeStyles.searchIcon)} />
              <input
                type="text"
                placeholder={activeTab === 'invites' ? 'Search invites by email...' : 'Search members by name, email, or role...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={cn(commonStyles.searchInput, themeStyles.searchInput)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className={cn(commonStyles.clearSearch, themeStyles.clearSearch)}>
                  <X size={14} />
                </button>
              )}
            </div>
            {activeTab === 'members' && (
              <div className={commonStyles.filterGroup}>
                {['all', 'owner', 'admin', 'member', 'viewer'].map(role => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={cn(
                      commonStyles.filterChip,
                      themeStyles.filterChip,
                      roleFilter === role && commonStyles.filterChipActive,
                      roleFilter === role && themeStyles.filterChipActive
                    )}
                  >
                    {role === 'all' ? 'All' : ROLE_CONFIG[role as keyof typeof ROLE_CONFIG]?.label}
                    {role !== 'all' && roleCounts[role] !== undefined && (
                      <span className={commonStyles.filterCount}>{roleCounts[role]}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Tabs */}
        <ScrollReveal delay={0.2}>
          <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={cn(
                    commonStyles.tab,
                    themeStyles.tab,
                    activeTab === tab.id && commonStyles.activeTab,
                    activeTab === tab.id && themeStyles.activeTab
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={cn(commonStyles.tabBadge, themeStyles.tabBadge)}>{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Content */}
        <div className={commonStyles.content}>
          {/* Members Tab */}
          {activeTab === 'members' && (
            <>
              {filteredMembers.length > 0 && (
                <div className={cn(commonStyles.resultCount, themeStyles.resultCount)}>
                  Showing {filteredMembers.length} of {members.length} member{members.length !== 1 ? 's' : ''}
                </div>
              )}
              <StaggerContainer delay={0.3} className={commonStyles.membersList}>
                {filteredMembers.length === 0 ? (
                  <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                    <UserX size={40} className={commonStyles.emptyIcon} />
                    <h3 className={commonStyles.emptyTitle}>
                      {searchQuery || roleFilter !== 'all' ? 'No members match your filters' : 'No team members yet'}
                    </h3>
                    <p className={commonStyles.emptyText}>
                      {searchQuery || roleFilter !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Invite team members to start collaborating'}
                    </p>
                    {!searchQuery && roleFilter === 'all' && (
                      <Button variant="primary" onClick={() => setShowInviteModal(true)}>
                        <UserPlus size={16} /> Invite First Member
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredMembers.map(member => {
                    const roleConfig = ROLE_CONFIG[member.role];
                    const RoleIcon = roleConfig.icon;
                    const isExpanded = expandedMember === member.id;

                    return (
                      <StaggerItem key={member.id}>
                        <div className={cn(commonStyles.memberCard, themeStyles.memberCard, isExpanded && commonStyles.memberCardExpanded)}>
                          <div className={commonStyles.memberMain}>
                            <div className={commonStyles.memberInfo}>
                              <div className={cn(commonStyles.avatar, themeStyles.avatar)}>
                                {member.avatar_url ? (
                                  <img src={member.avatar_url} alt={member.name} />
                                ) : (
                                  <span>{getInitials(member.name)}</span>
                                )}
                                <span className={cn(
                                  commonStyles.onlineIndicator,
                                  member.status === 'active' ? commonStyles.online : commonStyles.offline
                                )} />
                              </div>
                              <div className={commonStyles.memberDetails}>
                                <div className={commonStyles.memberNameRow}>
                                  <h3 className={cn(commonStyles.memberName, themeStyles.memberName)}>{member.name}</h3>
                                  <Badge variant={roleConfig.color}>
                                    <RoleIcon size={12} /> {roleConfig.label}
                                  </Badge>
                                </div>
                                <p className={cn(commonStyles.memberEmail, themeStyles.memberEmail)}>{member.email}</p>
                                <div className={cn(commonStyles.memberMetaRow, themeStyles.memberMetaRow)}>
                                  <span><Clock size={12} /> Joined {formatDate(member.joined_at)}</span>
                                  {member.last_active && (
                                    <span><Activity size={12} /> Active {formatTimeAgo(member.last_active)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className={commonStyles.memberActions}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                                aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedMember(member); setShowRoleModal(true); }}
                                aria-label="Edit role"
                              >
                                <Shield size={14} /> Edit Role
                              </Button>
                              {member.role !== 'owner' && (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleRemoveMember(member.id)}
                                  aria-label="Remove member"
                                >
                                  <Trash2 size={14} /> Remove
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className={cn(commonStyles.expandedDetails, themeStyles.expandedDetails)}>
                              <div className={commonStyles.detailSection}>
                                <h4 className={cn(commonStyles.detailTitle, themeStyles.detailTitle)}>
                                  <Shield size={14} /> Role Permissions
                                </h4>
                                <div className={commonStyles.permissionTags}>
                                  {roleConfig.permissions.map(perm => (
                                    <span key={perm} className={cn(commonStyles.permTag, themeStyles.permTag)}>
                                      <CheckCircle size={12} /> {perm}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className={commonStyles.detailGrid}>
                                <div className={cn(commonStyles.detailItem, themeStyles.detailItem)}>
                                  <span className={commonStyles.detailLabel}>Status</span>
                                  <span className={cn(
                                    commonStyles.statusBadge,
                                    member.status === 'active' ? commonStyles.statusActive : commonStyles.statusInactive
                                  )}>
                                    {member.status === 'active' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                    {member.status}
                                  </span>
                                </div>
                                <div className={cn(commonStyles.detailItem, themeStyles.detailItem)}>
                                  <span className={commonStyles.detailLabel}>Member Since</span>
                                  <span>{formatDate(member.joined_at)}</span>
                                </div>
                                {member.last_active && (
                                  <div className={cn(commonStyles.detailItem, themeStyles.detailItem)}>
                                    <span className={commonStyles.detailLabel}>Last Active</span>
                                    <span>{formatTimeAgo(member.last_active)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </StaggerItem>
                    );
                  })
                )}
              </StaggerContainer>
            </>
          )}

          {/* Invites Tab */}
          {activeTab === 'invites' && (
            <StaggerContainer delay={0.3} className={commonStyles.invitesList}>
              {filteredInvites.length === 0 ? (
                <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                  <Mail size={40} className={commonStyles.emptyIcon} />
                  <h3 className={commonStyles.emptyTitle}>
                    {searchQuery ? 'No invites match your search' : 'No pending invitations'}
                  </h3>
                  <p className={commonStyles.emptyText}>
                    {searchQuery ? 'Try a different search term' : 'Send invitations to grow your team'}
                  </p>
                  {!searchQuery && (
                    <Button variant="primary" onClick={() => setShowInviteModal(true)}>
                      <UserPlus size={16} /> Send Invite
                    </Button>
                  )}
                </div>
              ) : (
                filteredInvites.map(invite => {
                  const isExpired = invite.status === 'expired' || new Date(invite.expires_at) < new Date();
                  return (
                    <StaggerItem key={invite.id}>
                      <div className={cn(
                        commonStyles.inviteCard,
                        themeStyles.inviteCard,
                        isExpired && commonStyles.inviteExpired
                      )}>
                        <div className={commonStyles.inviteInfo}>
                          <div className={cn(commonStyles.inviteIconWrap, themeStyles.inviteIconWrap)}>
                            <Mail size={20} />
                          </div>
                          <div className={commonStyles.inviteDetails}>
                            <h3 className={cn(commonStyles.inviteEmail, themeStyles.inviteEmail)}>{invite.email}</h3>
                            <div className={cn(commonStyles.inviteMeta, themeStyles.inviteMeta)}>
                              <span className={commonStyles.inviteMetaItem}>
                                <Shield size={12} /> {invite.role}
                              </span>
                              <span className={commonStyles.inviteMetaItem}>
                                <Clock size={12} /> Sent {formatTimeAgo(invite.sent_at)}
                              </span>
                              <span className={commonStyles.inviteMetaItem}>
                                {isExpired ? (
                                  <><AlertCircle size={12} /> Expired</>
                                ) : (
                                  <><Clock size={12} /> Expires {formatDate(invite.expires_at)}</>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={commonStyles.inviteStatus}>
                          <Badge variant={isExpired ? 'danger' : invite.status === 'accepted' ? 'success' : 'warning'}>
                            {isExpired ? 'Expired' : invite.status === 'accepted' ? 'Accepted' : 'Pending'}
                          </Badge>
                        </div>
                        <div className={commonStyles.inviteActions}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyInviteLink(invite)}
                            aria-label="Copy invite link"
                          >
                            <Copy size={14} /> Copy Link
                          </Button>
                          {invite.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResendInvite(invite.id)}
                              >
                                <RotateCw size={14} /> Resend
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleCancelInvite(invite.id)}
                              >
                                <X size={14} /> Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </StaggerItem>
                  );
                })
              )}
            </StaggerContainer>
          )}

          {/* Roles & Permissions Tab */}
          {activeTab === 'roles' && (
            <ScrollReveal delay={0.3}>
              <div className={commonStyles.rolesContent}>
                {/* Role Cards */}
                <div className={commonStyles.rolesGrid}>
                  {Object.entries(ROLE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <div key={key} className={cn(commonStyles.roleCard, themeStyles.roleCard)}>
                        <div className={commonStyles.roleCardHeader}>
                          <div className={cn(commonStyles.roleIconWrap, themeStyles[`roleIcon_${key}`])}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <h3 className={cn(commonStyles.roleCardName, themeStyles.roleCardName)}>{config.label}</h3>
                            <span className={cn(commonStyles.roleCardCount, themeStyles.roleCardCount)}>
                              {roleCounts[key] || 0} member{(roleCounts[key] || 0) !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <p className={cn(commonStyles.roleCardDesc, themeStyles.roleCardDesc)}>{config.description}</p>
                        <div className={commonStyles.rolePermList}>
                          {config.permissions.map(perm => (
                            <span key={perm} className={cn(commonStyles.rolePermItem, themeStyles.rolePermItem)}>
                              <CheckCircle size={12} /> {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Permissions Matrix */}
                <div className={cn(commonStyles.matrixSection, themeStyles.matrixSection)}>
                  <h3 className={cn(commonStyles.matrixTitle, themeStyles.matrixTitle)}>
                    <Lock size={18} /> Permissions Matrix
                  </h3>
                  <div className={commonStyles.matrixWrapper}>
                    <table className={cn(commonStyles.matrixTable, themeStyles.matrixTable)}>
                      <thead>
                        <tr>
                          <th className={cn(commonStyles.matrixHeaderCell, themeStyles.matrixHeaderCell)}>Permission</th>
                          <th className={cn(commonStyles.matrixHeaderCell, themeStyles.matrixHeaderCell)}>
                            <Crown size={14} /> Owner
                          </th>
                          <th className={cn(commonStyles.matrixHeaderCell, themeStyles.matrixHeaderCell)}>
                            <Shield size={14} /> Admin
                          </th>
                          <th className={cn(commonStyles.matrixHeaderCell, themeStyles.matrixHeaderCell)}>
                            <Users size={14} /> Member
                          </th>
                          <th className={cn(commonStyles.matrixHeaderCell, themeStyles.matrixHeaderCell)}>
                            <Eye size={14} /> Viewer
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {PERMISSION_MATRIX.map(perm => {
                          const PermIcon = perm.icon;
                          return (
                            <tr key={perm.name} className={cn(commonStyles.matrixRow, themeStyles.matrixRow)}>
                              <td className={cn(commonStyles.matrixCell, themeStyles.matrixCell)}>
                                <PermIcon size={14} /> {perm.name}
                              </td>
                              {(['owner', 'admin', 'member', 'viewer'] as const).map(role => (
                                <td key={role} className={cn(commonStyles.matrixCell, themeStyles.matrixCell, commonStyles.matrixCellCenter)}>
                                  {perm[role] ? (
                                    <CheckCircle size={16} className={commonStyles.permGranted} />
                                  ) : (
                                    <X size={16} className={commonStyles.permDenied} />
                                  )}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className={commonStyles.modalOverlay} onClick={() => setShowInviteModal(false)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
              <div className={commonStyles.modalHeader}>
                <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                  <UserPlus size={20} /> Invite Team Members
                </h2>
                <button
                  className={cn(commonStyles.modalClose, themeStyles.modalClose)}
                  onClick={() => setShowInviteModal(false)}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className={commonStyles.modalBody}>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>
                    <Mail size={14} /> Email Address{inviteEmails.length > 1 ? 'es' : ''}
                  </label>
                  {inviteEmails.map((email, idx) => (
                    <div key={idx} className={commonStyles.emailRow}>
                      <Input
                        type="email"
                        value={email}
                        onChange={e => updateEmail(idx, e.target.value)}
                        placeholder="colleague@example.com"
                      />
                      {inviteEmails.length > 1 && (
                        <button
                          className={cn(commonStyles.removeEmailBtn, themeStyles.removeEmailBtn)}
                          onClick={() => removeEmailField(idx)}
                          aria-label="Remove email"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  {inviteEmails.length < 10 && (
                    <button className={cn(commonStyles.addEmailBtn, themeStyles.addEmailBtn)} onClick={addEmailField}>
                      <Plus size={14} /> Add another email
                    </button>
                  )}
                </div>

                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>
                    <Shield size={14} /> Role
                  </label>
                  <div className={commonStyles.roleOptions}>
                    {Object.entries(ROLE_CONFIG).filter(([key]) => key !== 'owner').map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <label
                          key={key}
                          className={cn(
                            commonStyles.roleOption,
                            themeStyles.roleOption,
                            inviteRole === key && commonStyles.selectedRole,
                            inviteRole === key && themeStyles.selectedRole
                          )}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={key}
                            checked={inviteRole === key}
                            onChange={e => setInviteRole(e.target.value)}
                            className={commonStyles.radioHidden}
                          />
                          <div className={commonStyles.roleOptionContent}>
                            <div className={commonStyles.roleOptionHeader}>
                              <Icon size={16} />
                              <span className={cn(commonStyles.roleName, themeStyles.roleName)}>{config.label}</span>
                            </div>
                            <span className={cn(commonStyles.roleDesc, themeStyles.roleDesc)}>{config.description}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className={commonStyles.modalFooter}>
                <Button variant="ghost" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleInvite}
                  isLoading={inviteSending}
                >
                  <Mail size={16} /> Send {inviteEmails.filter(e => e.trim()).length > 1 ? `${inviteEmails.filter(e => e.trim()).length} Invites` : 'Invite'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Role Edit Modal */}
        {showRoleModal && selectedMember && (
          <div className={commonStyles.modalOverlay} onClick={() => setShowRoleModal(false)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
              <div className={commonStyles.modalHeader}>
                <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                  <Shield size={20} /> Edit Role
                </h2>
                <button
                  className={cn(commonStyles.modalClose, themeStyles.modalClose)}
                  onClick={() => setShowRoleModal(false)}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className={commonStyles.modalBody}>
                <p className={cn(commonStyles.roleEditInfo, themeStyles.roleEditInfo)}>
                  Changing role for <strong>{selectedMember.name}</strong> ({selectedMember.email})
                </p>
                <div className={commonStyles.roleOptions}>
                  {Object.entries(ROLE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <label
                        key={key}
                        className={cn(
                          commonStyles.roleOption,
                          themeStyles.roleOption,
                          selectedMember.role === key && commonStyles.selectedRole,
                          selectedMember.role === key && themeStyles.selectedRole
                        )}
                      >
                        <input
                          type="radio"
                          name="editRole"
                          value={key}
                          checked={selectedMember.role === key}
                          onChange={() => handleUpdateRole(selectedMember.id, key)}
                          className={commonStyles.radioHidden}
                        />
                        <div className={commonStyles.roleOptionContent}>
                          <div className={commonStyles.roleOptionHeader}>
                            <Icon size={16} />
                            <span className={cn(commonStyles.roleName, themeStyles.roleName)}>{config.label}</span>
                            {selectedMember.role === key && (
                              <Badge variant="primary" size="sm">Current</Badge>
                            )}
                          </div>
                          <span className={cn(commonStyles.roleDesc, themeStyles.roleDesc)}>{config.description}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className={commonStyles.modalFooter}>
                <Button variant="ghost" onClick={() => setShowRoleModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmAction && (
          <div className={commonStyles.modalOverlay} onClick={() => setConfirmAction(null)}>
            <div className={cn(commonStyles.modal, commonStyles.modalSmall, themeStyles.modal)} onClick={e => e.stopPropagation()}>
              <div className={commonStyles.modalHeader}>
                <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                  <AlertCircle size={20} /> Confirm Action
                </h2>
                <button
                  className={cn(commonStyles.modalClose, themeStyles.modalClose)}
                  onClick={() => setConfirmAction(null)}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
              <div className={commonStyles.modalBody}>
                <p className={cn(commonStyles.confirmText, themeStyles.confirmText)}>
                  Are you sure you want to {confirmAction.label}? This action cannot be undone.
                </p>
              </div>
              <div className={commonStyles.modalFooter}>
                <Button variant="ghost" onClick={() => setConfirmAction(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={executeConfirmAction}>
                  <Trash2 size={14} /> Confirm
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Toast notification */}
        {toast && (
          <div className={cn(
            commonStyles.toast,
            themeStyles.toast,
            toast.type === 'error' && commonStyles.toastError,
            toast.type === 'error' && themeStyles.toastError
          )}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
