import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { INITIAL_SCORE } from '@/lib/scoring';

export async function GET() {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { question_text, answer, description, tags } = body;

  if (!question_text || !answer) {
    return NextResponse.json(
      { error: 'question_text and answer are required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('questions')
    .insert({
      question_text,
      answer,
      description: description || null,
      score: INITIAL_SCORE,
      tags: tags || [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
