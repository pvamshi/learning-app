import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { updates } = body as {
    updates: Array<{
      id: string;
      score: number;
      last_reviewed_at: string | null;
    }>;
  };

  if (!updates || updates.length === 0) {
    return NextResponse.json({ success: true });
  }

  // Update each question
  for (const update of updates) {
    await supabase
      .from('questions')
      .update({
        score: update.score,
        last_reviewed_at: update.last_reviewed_at,
      })
      .eq('id', update.id);
  }

  return NextResponse.json({ success: true });
}
