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

async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
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
export interface ChatConversation {
  id: string;
  title: string | null;
  updated_at: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  image_url?: string | null;
  created_at?: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
  remaining_today: number;
  daily_limit: number;
}

export interface ConversationMessagesResponse {
  messages: ChatMessage[];
  remaining_today: number;
  daily_limit: number;
}

// API
export const chatApi = {
  async getConversations(): Promise<ApiResponse<{ conversations: ChatConversation[] }>> {
    return fetchWithAuth('/api/chat/conversations');
  },

  async createConversation(): Promise<ApiResponse<{ id: string }>> {
    return fetchWithAuth('/api/chat/conversations', { method: 'POST' });
  },

  async getMessages(conversationId: string): Promise<ApiResponse<ConversationMessagesResponse>> {
    return fetchWithAuth(`/api/chat/conversations/${conversationId}`);
  },

  async sendMessage(params: {
    conversationId: string;
    content: string;
    imageUrl?: string;
    context?: { current_page?: string; language?: string };
  }): Promise<ApiResponse<SendMessageResponse>> {
    return fetchWithAuth('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: params.conversationId,
        content: params.content,
        image_url: params.imageUrl,
        context: params.context,
      }),
    });
  },

  async uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
    const token = await getAuthToken();
    if (!token) return { success: false, error: 'Not authenticated' };

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/upload-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error || 'Upload failed' };
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },
};
