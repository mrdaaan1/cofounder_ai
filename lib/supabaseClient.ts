import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Типы для БД
export type Project = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ArtifactDB = {
  id: string;
  project_id: string;
  artifact_type: string;
  content: string;
  is_completed: boolean;
  updated_at: string;
};

export type Message = {
  id: string;
  project_id: string;
  role: 'user' | 'model';
  text: string;
  created_at: string;
};
