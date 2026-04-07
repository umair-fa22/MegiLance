// @AI-HINT: Re-export centralized User types from the main types file
// This ensures consistency across the application

// Re-export the comprehensive User type from the central types file
export type { User } from '@/types/api';

// Simplified User type for navbar/header components
export interface UserBasic {
  name: string;
  email: string;
  avatar: string;
  notificationCount: number;
}

// User with role information for auth context
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  user_type: 'client' | 'freelancer' | 'admin';
  role: string;
  bio?: string;
  skills?: string;
  hourly_rate?: number;
  profile_image_url?: string;
  location?: string;
  title?: string;
  is_verified?: boolean;
  joined_at?: string;
}

// Profile completion tracking
export interface ProfileCompletion {
  overall: number;
  sections: {
    basicInfo: boolean;
    skills: boolean;
    portfolio: boolean;
    verification: boolean;
    payment: boolean;
  };
}

// User presence/online status
export interface UserPresence {
  userId: number;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: string;
}
