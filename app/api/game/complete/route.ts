import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type GameResult = {
  question_id: string;
  correct: boolean;
  new_score: number;
};

export async function POST(request: NextRequest) {
  const start = Date.now();
  console.log('[game/complete] Request started');

  const body = await request.json();
  const { results } = body as { results: GameResult[] };

  if (!results || !Array.isArray(results) || results.length === 0) {
    return NextResponse.json(
      { error: 'results array is required' },
      { status: 400 }
    );
  }

  try {
    // Batch update questions
    const updateStart = Date.now();
    for (const result of results) {
      await supabase
        .from('questions')
        .update({
          score: result.new_score,
          last_reviewed_at: new Date().toISOString(),
        })
        .eq('id', result.question_id);
    }
    console.log(`[game/complete] Updated ${results.length} questions: ${Date.now() - updateStart}ms`);

    // Batch insert attempts
    const insertStart = Date.now();
    const attempts = results.map(r => ({
      question_id: r.question_id,
      correct: r.correct,
    }));

    await supabase
      .from('attempts')
      .insert(attempts);
    console.log(`[game/complete] Inserted ${attempts.length} attempts: ${Date.now() - insertStart}ms`);

    console.log(`[game/complete] Total time: ${Date.now() - start}ms`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[game/complete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save game results' },
      { status: 500 }
    );
  }
}
