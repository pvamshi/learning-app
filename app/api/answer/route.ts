import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateNewScore, isAnswerCorrect } from '@/lib/scoring';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { question_id, user_answer } = body;

  if (!question_id || user_answer === undefined) {
    return NextResponse.json(
      { error: 'question_id and user_answer are required' },
      { status: 400 }
    );
  }

  // Get the question
  const { data: question, error: fetchError } = await supabase
    .from('questions')
    .select('*')
    .eq('id', question_id)
    .single();

  if (fetchError || !question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  // Check if answer is correct
  const correct = isAnswerCorrect(user_answer, question.answer);

  // Calculate new score
  const newScore = calculateNewScore(question.score, correct);

  // Update question score and last_reviewed_at
  const { error: updateError } = await supabase
    .from('questions')
    .update({
      score: newScore,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('id', question_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Record attempt
  const { error: attemptError } = await supabase
    .from('attempts')
    .insert({
      question_id,
      correct,
    });

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 500 });
  }

  return NextResponse.json({
    correct,
    new_score: newScore,
    correct_answer: question.answer,
  });
}
