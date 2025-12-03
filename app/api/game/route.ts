import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DIFFICULT_THRESHOLD } from '@/lib/scoring';

export async function GET() {
  // Get difficult words (score >= 5)
  const { data: difficultWords } = await supabase
    .from('questions')
    .select('*')
    .gte('score', DIFFICULT_THRESHOLD)
    .gt('score', 0)
    .order('last_reviewed_at', { ascending: true, nullsFirst: true })
    .limit(10);

  // Get new/unlearned words (score > 0 and < 5)
  const { data: newWords } = await supabase
    .from('questions')
    .select('*')
    .gt('score', 0)
    .lt('score', DIFFICULT_THRESHOLD)
    .order('last_reviewed_at', { ascending: true, nullsFirst: true })
    .limit(10);

  const difficult = difficultWords || [];
  const newW = newWords || [];

  // Mix: 20% difficult, 80% new (2 difficult, 8 new for 10 total)
  const targetDifficult = Math.min(2, difficult.length);
  const targetNew = Math.min(8, newW.length);

  let selectedQuestions = [
    ...difficult.slice(0, targetDifficult),
    ...newW.slice(0, targetNew),
  ];

  // If we don't have 10, fill from whichever has more
  const remaining = 10 - selectedQuestions.length;
  if (remaining > 0) {
    const remainingDifficult = difficult.slice(targetDifficult);
    const remainingNew = newW.slice(targetNew);
    const additional = [...remainingDifficult, ...remainingNew].slice(0, remaining);
    selectedQuestions = [...selectedQuestions, ...additional];
  }

  // Shuffle the questions
  const shuffled = selectedQuestions.sort(() => Math.random() - 0.5);

  return NextResponse.json(shuffled);
}
