import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://voiceapi.survey-genius.ai';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = await getAuthToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    const data = await response.json();
    if (!response.ok) return { success: false, error: data.error || 'Request failed' };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

// Types
export interface AdminStats {
  success: boolean;
  total_users: number;
  total_projects: number;
  total_recordings: number;
  recordings_this_month: number;
  users_by_plan: Record<string, number>;
  month: string;
}

export interface AdminUser {
  id: string;
  email: string;
  plan: string;
  plan_name: string;
  plan_started_at: string | null;
  is_admin: boolean;
  created_at: string;
  projects_count: number;
  responses_this_month: number;
}

export interface AdminUserDetail {
  success: boolean;
  user: {
    id: string;
    email: string;
    plan: string;
    plan_name: string;
    plan_started_at: string | null;
    is_admin: boolean;
    created_at: string;
  };
  projects: Array<{ id: string; name: string; language: string; transcription_mode: string; created_at: string }>;
  usage_history: Array<{ month: string; responses_count: number }>;
}

export interface PaginatedUsers {
  success: boolean;
  users: AdminUser[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

export interface PlanChangeResult {
  success: boolean;
  user: { id: string; plan: string; plan_name: string; plan_started_at: string };
  previous_plan: string;
}

export interface AdminOrg {
  id: string;
  name: string;
  plan: string;
  plan_name: string;
  max_seats: number;
  max_responses: number;
  owner_id: string;
  owner_email: string;
  member_count: number;
  responses_this_month: number;
  created_at: string;
}

export interface CreateOrgResult {
  success: boolean;
  org: {
    id: string;
    name: string;
    plan: string;
    plan_name: string;
    max_seats: number;
    owner_id: string;
    owner_email: string;
  };
}

export interface AdminOrgDetail {
  success: boolean;
  org: AdminOrg & { created_at: string };
  members: Array<{
    id: string;
    email: string;
    role: string;
    joined_at: string;
    responses_this_month: number;
  }>;
  usage: { responses_this_month: number; max_responses: number };
}

// API
export const adminApi = {
  getStats: () => fetchWithAuth<AdminStats>('/api/admin/stats'),

  getUsers: (page = 1, search = '') => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    return fetchWithAuth<PaginatedUsers>(`/api/admin/users?${params}`);
  },

  getUser: (userId: string) => fetchWithAuth<AdminUserDetail>(`/api/admin/users/${userId}`),

  updateUserPlan: (userId: string, plan: string) =>
    fetchWithAuth<PlanChangeResult>(
      `/api/admin/users/${userId}/plan`,
      { method: 'PUT', body: JSON.stringify({ plan }) }
    ),

  getOrgs: () => fetchWithAuth<{ success: boolean; orgs: AdminOrg[] }>('/api/admin/orgs'),

  createOrg: (data: { name: string; ownerEmail: string; plan: string; maxSeats: number }) =>
    fetchWithAuth<CreateOrgResult>('/api/admin/orgs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteUser: (userId: string) =>
    fetchWithAuth(`/api/admin/users/${userId}`, { method: 'DELETE' }),

  toggleAdmin: (userId: string, isAdmin: boolean) =>
    fetchWithAuth<{ success: boolean; is_admin: boolean }>(
      `/api/admin/users/${userId}/admin`,
      { method: 'PUT', body: JSON.stringify({ is_admin: isAdmin }) }
    ),

  resetPassword: (userId: string) =>
    fetchWithAuth<{ success: boolean; email: string }>(
      `/api/admin/users/${userId}/reset-password`,
      { method: 'POST' }
    ),

  getOrgDetail: (orgId: string) =>
    fetchWithAuth<AdminOrgDetail>(`/api/admin/orgs/${orgId}`),

  updateOrg: (orgId: string, data: { name?: string; plan?: string; maxSeats?: number }) =>
    fetchWithAuth(`/api/admin/orgs/${orgId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteOrg: (orgId: string) =>
    fetchWithAuth(`/api/admin/orgs/${orgId}`, { method: 'DELETE' }),
};
