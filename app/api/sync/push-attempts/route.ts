import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { attempts } = body as {
    attempts: Array<{
      question_id: string;
      correct: boolean;
      answered_at: string;
    }>;
  };

  if (!attempts || attempts.length === 0) {
    return NextResponse.json({ success: true });
  }

  // Insert attempts
  const { error } = await supabase.from('attempts').insert(attempts);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
