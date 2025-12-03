import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  // Get all unlearned questions (score > 0) in FIFO order (oldest reviewed first)
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .gt('score', 0)
    .order('last_reviewed_at', { ascending: true, nullsFirst: true })
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!questions || questions.length === 0) {
    return NextResponse.json({ question: null });
  }

  return NextResponse.json({ question: questions[0] });
}
