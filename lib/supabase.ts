import { createClient } from '@supabase/supabase-js';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get: (target, prop) => {
    return getSupabase()[prop as keyof ReturnType<typeof createClient>];
  },
});

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
