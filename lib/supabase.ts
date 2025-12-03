import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Question = {
  id: string;
  question_text: string;
  answer: string;
  description: string | null;
  score: number;
  created_at: string;
  last_reviewed_at: string | null;
};

export type Attempt = {
  id: string;
  question_id: string;
  correct: boolean;
  answered_at: string;
};

export type GameSession = {
  id: string;
  started_at: string;
  completed_at: string | null;
};
