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
export interface OrgMember {
  id: string;
  email: string;
  role: 'owner' | 'member';
  joined_at: string;
  responses_this_month: number;
}

export interface OrgData {
  success: boolean;
  org: {
    id: string;
    name: string;
    plan: string;
    plan_name: string;
    max_seats: number;
    max_responses: number;
    created_at: string;
  };
  usage: {
    responses_this_month: number;
    month: string;
  };
  members: OrgMember[];
}

export interface AddMemberResult {
  success: boolean;
  member?: { id: string; email: string; role: string };
  error?: string;
}

// API
export const orgApi = {
  getOrg: () => fetchWithAuth<OrgData>('/api/org'),

  addMember: (email: string) =>
    fetchWithAuth<AddMemberResult>('/api/org/members', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  removeMember: (userId: string) =>
    fetchWithAuth<{ success: boolean }>(`/api/org/members/${userId}`, {
      method: 'DELETE',
    }),
};
