import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hggwsdqjkwydiubhvrvq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZ3dzZHFqa3d5ZGl1Ymh2cnZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzU1NDQsImV4cCI6MjA4NDY1MTU0NH0.Ia_TL5i1MnoI7LPYGqO9cLFCLNJgs-ibZ7ldYKoRl68";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Type definitions for database tables
export interface Project {
  id: string;
  user_id: string;
  name: string;
  public_key: string;
  language: string;
  transcription_mode: string;
  created_at: string;
  updated_at: string;
}

export interface Recording {
  id: string;
  project_id: string;
  session_id: string;
  audio_path: string;
  duration_seconds: number;
  transcription: string | null;
  status: string;
  created_at: string;
  transcribed_at: string | null;
}

export interface TranscriptionBatch {
  id: string;
  project_id: string;
  user_id: string;
  status: string;
  total_recordings: number;
  completed_count: number;
  failed_count: number;
  estimated_cost_usd: number;
  session_ids_requested: string[];
  session_ids_not_found: string[];
  created_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
}
