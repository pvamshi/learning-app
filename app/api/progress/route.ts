import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  // Get total count
  const { count: totalCount, error: totalError } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    return NextResponse.json({ error: totalError.message }, { status: 500 });
  }

  // Get learned count (score <= 0)
  const { count: learnedCount, error: learnedError } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .lte('score', 0);

  if (learnedError) {
    return NextResponse.json({ error: learnedError.message }, { status: 500 });
  }

  // Get learned questions grouped by difficulty (original difficulty)
  const { data: learnedByDifficulty, error: diffError } = await supabase
    .from('questions')
    .select('*')
    .lte('score', 0);

  if (diffError) {
    return NextResponse.json({ error: diffError.message }, { status: 500 });
  }

  const progress = totalCount ? (learnedCount! / totalCount) * 100 : 0;

  return NextResponse.json({
    total: totalCount || 0,
    learned: learnedCount || 0,
    progress: Math.round(progress * 10) / 10,
    learned_words: learnedByDifficulty || [],
  });
}
