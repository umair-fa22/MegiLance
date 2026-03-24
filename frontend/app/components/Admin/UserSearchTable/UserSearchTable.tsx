// @AI-HINT: This component provides a premium user management interface. It features a card-based layout, advanced filtering and sorting, and theme-aware styling using per-component CSS modules.
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import Badge from '@/app/components/Badge/Badge';
import Button from '@/app/components/Button/Button';
import Card from '@/app/components/Card/Card';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import ActionMenu, { ActionMenuItem } from '@/app/components/ActionMenu/ActionMenu';
import { MoreHorizontal, Users, Briefcase, Calendar, Search, User, Mail, Phone, Edit, Eye, UserX, Shield, UserCog, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

import commonStyles from './UserSearchTable.common.module.css';
import lightStyles from './UserSearchTable.light.module.css';
import darkStyles from './UserSearchTable.dark.module.css';

interface UserData {
  id: string | number;
  name: string;
  email: string;
  avatar_url?: string;
  avatarUrl?: string;
  user_type?: string;
  role?: 'Admin' | 'Client' | 'Freelancer';
  is_active?: boolean;
  status?: 'Active' | 'Inactive' | 'Suspended';
  joined_at?: string;
  joinDate?: string;
}

interface DisplayUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'Admin' | 'Client' | 'Freelancer';
  status: 'Active' | 'Inactive' | 'Suspended';
  joinDate: string;
}

const roleIcons = {
  Admin: <Shield size={14} />,
  Client: <Briefcase size={14} />,
  Freelancer: <UserCog size={14} />,
};

const statusVariantMap: { [key in DisplayUser['status']]: 'success' | 'secondary' | 'danger' } = {
  Active: 'success',
  Inactive: 'secondary',
  Suspended: 'danger',
};

// Transform API user to display format
function transformUser(apiUser: UserData): DisplayUser {
  const role = apiUser.role || (apiUser.user_type as DisplayUser['role']) || 'Client';
  const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  
  let status: DisplayUser['status'] = 'Inactive';
  if (apiUser.status) {
    status = apiUser.status;
  } else if (apiUser.is_active === true) {
    status = 'Active';
  } else if (apiUser.is_active === false) {
    status = 'Inactive';
  }
  
  return {
    id: String(apiUser.id),
    name: apiUser.name || 'Unknown',
    email: apiUser.email || '',
    avatarUrl: apiUser.avatarUrl || apiUser.avatar_url || '',
    role: normalizedRole as DisplayUser['role'],
    status,
    joinDate: apiUser.joinDate || apiUser.joined_at || new Date().toISOString().split('T')[0],
  };
}

const UserCard: React.FC<{ user: DisplayUser; themeStyles: typeof lightStyles; onToggleStatus: (id: string) => void }> = ({ user, themeStyles, onToggleStatus }) => {
  const userActions: ActionMenuItem[] = [
    { label: 'View Profile', icon: Eye, onClick: () => window.location.href = `/admin/users/${user.id}` },
    { label: 'Edit User', icon: Edit, onClick: () => window.location.href = `/admin/users/${user.id}/edit` },
    { isSeparator: true },
    { 
      label: user.status === 'Suspended' ? 'Activate User' : 'Suspend User', 
      icon: UserX, 
      onClick: () => onToggleStatus(user.id) 
    },
  ];

  return (
    <Card className={cn(commonStyles.userCard, themeStyles.userCard)}>
      <div className={commonStyles.cardHeader}>
        <UserAvatar src={user.avatarUrl} name={user.name} size={48} />
        <div className={commonStyles.userInfo}>
          <h3 className={cn(commonStyles.userName, themeStyles.userName)}>{user.name}</h3>
          <p className={cn(commonStyles.userEmail, themeStyles.userEmail)}>{user.email}</p>
        </div>
        <ActionMenu items={userActions} />
      </div>
      <div className={commonStyles.cardBody}>
        <div className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
          {roleIcons[user.role]}
          <span>{user.role}</span>
        </div>
        <div className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
          <Calendar size={14} />
          <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
        </div>
      </div>
      <div className={commonStyles.cardFooter}>
        <Badge variant={statusVariantMap[user.status]}>{user.status}</Badge>
      </div>
    </Card>
  );
};

export default function UserSearchTable() {
  const { resolvedTheme } = useTheme();
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('date-desc');

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.getUsers() as any;
      const userList = data.users ?? data ?? [];
      const transformed = userList.map(transformUser);
      setUsers(transformed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Toggle user status (suspend/activate)
  const handleToggleStatus = useCallback(async (userId: string) => {
    try {
      await api.admin.toggleUserStatus(Number(userId));
      
      // Refresh user list
      fetchUsers();
    } catch {
      // Toggle status failed, silently fail and let user retry
    }
  }, [fetchUsers]);

  const filteredAndSortedUsers = users
    .filter(user => {
      const term = searchTerm.toLowerCase();
      return user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
    })
    .filter(user => roleFilter === 'All' || user.role === roleFilter)
    .filter(user => statusFilter === 'All' || user.status === statusFilter)
    .sort((a, b) => {
      switch (sortOrder) {
        case 'date-asc': return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
        case 'date-desc': return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        default: return 0;
      }
    });


  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <header className={commonStyles.header}>
        <div className={commonStyles.headerContent}>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>User Management</h2>
          <p className={cn(commonStyles.description, themeStyles.description)}>
            Search, filter, and manage all users in the system.
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchUsers}
          iconBefore={<RefreshCw size={16} />}
          aria-label="Refresh users"
        >
          Refresh
        </Button>
      </header>

      <div className={cn(commonStyles.toolbar, themeStyles.toolbar)}>
        <Input
          id="search-users"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          iconBefore={<Search size={16} />}
          className={commonStyles.searchInput}
        />
        <div className={commonStyles.filters}>
          <Select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: 'All', label: 'All Roles' },
              { value: 'Admin', label: 'Admin' },
              { value: 'Client', label: 'Client' },
              { value: 'Freelancer', label: 'Freelancer' },
            ]}
          />
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
              { value: 'Suspended', label: 'Suspended' },
            ]}
          />
          <Select
            id="sort-order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            options={[
              { value: 'date-desc', label: 'Newest First' },
              { value: 'date-asc', label: 'Oldest First' },
              { value: 'name-asc', label: 'Name (A-Z)' },
              { value: 'name-desc', label: 'Name (Z-A)' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div className={cn(commonStyles.loadingState, themeStyles.loadingState)}>
          <Loader2 className={commonStyles.spinner} size={32} />
          <p>Loading users...</p>
        </div>
      ) : error ? (
        <div className={cn(commonStyles.errorState, themeStyles.errorState)}>
          <AlertTriangle size={32} />
          <h3>Failed to load users</h3>
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchUsers}>
            Try Again
          </Button>
        </div>
      ) : (
        <div className={commonStyles.userGrid}>
          {filteredAndSortedUsers.length > 0 ? (
            filteredAndSortedUsers.map(user => (
              <UserCard 
                key={user.id} 
                user={user} 
                themeStyles={themeStyles}
                onToggleStatus={handleToggleStatus}
              />
            ))
          ) : (
            <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
              <Users size={48} />
              <h3>No Users Found</h3>
              <p>Adjust your search or filter criteria to find users.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
