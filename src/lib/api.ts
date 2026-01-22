import { supabase } from '@/integrations/supabase/client';

// API base URL - defaults to Railway production URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://voice-capture-api-production.up.railway.app';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Get auth token from Supabase session
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Generic fetch with auth
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Request failed' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

// Batch Transcription API
export interface BatchSummary {
  requested: number;
  found: number;
  not_found: number;
  already_transcribed: number;
  to_transcribe: number;
}

export interface BatchPrepareResponse {
  success: boolean;
  batch_id: string;
  summary: BatchSummary;
  not_found_session_ids: string[];
  estimated_duration_minutes: number;
  estimated_cost_usd: number;
  status: string;
}

export interface BatchConfirmResponse {
  success: boolean;
  batch_id: string;
  status: string;
  recordings_queued: number;
  estimated_completion: string;
}

export interface BatchStatusResponse {
  batch_id: string;
  status: string;
  progress: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
  };
  failed_recordings?: {
    id: string;
    session_id: string;
    error: string;
  }[];
  started_at: string;
  estimated_completion?: string;
}

export const batchApi = {
  // Prepare batch transcription (analyze session IDs)
  async prepare(projectId: string, sessionIds: string[]): Promise<ApiResponse<BatchPrepareResponse>> {
    return fetchWithAuth(`/api/projects/${projectId}/transcribe-batch`, {
      method: 'POST',
      body: JSON.stringify({ session_ids: sessionIds }),
    });
  },

  // Confirm and start batch transcription
  async confirm(projectId: string, batchId: string): Promise<ApiResponse<BatchConfirmResponse>> {
    return fetchWithAuth(`/api/projects/${projectId}/transcribe-batch/${batchId}/confirm`, {
      method: 'POST',
    });
  },

  // Get batch status
  async getStatus(projectId: string, batchId: string): Promise<ApiResponse<BatchStatusResponse>> {
    return fetchWithAuth(`/api/projects/${projectId}/transcribe-batch/${batchId}`);
  },
};

// Export API
export interface ExportResponse {
  // The response is a file download, so we handle it differently
  blob: Blob;
  filename: string;
}

export const exportApi = {
  // Export recordings as CSV
  async exportCsv(projectId: string, status: 'completed' | 'all' = 'completed'): Promise<ApiResponse<ExportResponse>> {
    const token = await getAuthToken();

    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/export?format=csv&status=${status}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Export failed' };
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'export.csv'
        : 'export.csv';

      return { success: true, data: { blob, filename } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },
};

// Health check
export const healthApi = {
  async check(): Promise<ApiResponse<{ status: string; timestamp: string; version: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },
};
