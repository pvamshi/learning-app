import { getDatabase, QuestionDocument, AttemptDocument } from './db';

// Pull all questions from server
export async function pullQuestionsFromServer(): Promise<QuestionDocument[]> {
  const res = await fetch('/api/sync/pull');
  if (!res.ok) throw new Error('Failed to pull questions');
  const data = await res.json();
  return data.questions.map((q: any) => ({
    ...q,
    is_dirty: false,
  }));
}

// Push dirty questions to server
export async function pushDirtyQuestions(): Promise<void> {
  const db = await getDatabase();
  const dirtyQuestions = await db.questions
    .find({
      selector: {
        is_dirty: true,
      },
    })
    .exec();

  if (dirtyQuestions.length === 0) return;

  const updates = dirtyQuestions.map((q) => ({
    id: q.id,
    score: q.score,
    last_reviewed_at: q.last_reviewed_at,
    tags: q.tags,
  }));

  await fetch('/api/sync/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  });

  // Mark as clean
  for (const q of dirtyQuestions) {
    await q.patch({ is_dirty: false });
  }
}

// Push unsynced attempts to server
export async function pushUnsyncedAttempts(): Promise<void> {
  const db = await getDatabase();
  const unsyncedAttempts = await db.attempts
    .find({
      selector: {
        is_synced: false,
      },
    })
    .exec();

  if (unsyncedAttempts.length === 0) return;

  const attempts = unsyncedAttempts.map((a) => ({
    question_id: a.question_id,
    correct: a.correct,
    answered_at: a.answered_at,
  }));

  await fetch('/api/sync/push-attempts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attempts }),
  });

  // Mark as synced
  for (const a of unsyncedAttempts) {
    await a.patch({ is_synced: true });
  }
}

// Initial sync - load all data from server
export async function initialSync(): Promise<void> {
  console.log('[sync] Starting initial sync...');
  const start = Date.now();

  const db = await getDatabase();

  // Pull questions from server
  const questions = await pullQuestionsFromServer();
  console.log(`[sync] Pulled ${questions.length} questions from server`);

  // Deduplicate by ID (keep last occurrence)
  const uniqueQuestions = Array.from(
    new Map(questions.map(q => [q.id, q])).values()
  );
  console.log(`[sync] Deduplicated to ${uniqueQuestions.length} unique questions`);

  // Upsert into local DB (insert new, update existing)
  const results = await db.questions.bulkUpsert(uniqueQuestions);

  console.log(`[sync] Initial sync complete in ${Date.now() - start}ms (${results.success.length} upserted)`);
}

// Background sync - push changes periodically
export async function backgroundSync(): Promise<void> {
  try {
    await pushDirtyQuestions();
    await pushUnsyncedAttempts();
    console.log('[sync] Background sync complete');
  } catch (err) {
    console.error('[sync] Background sync failed:', err);
  }
}

// Start periodic background sync
export function startBackgroundSync(intervalMs: number = 10000): () => void {
  const interval = setInterval(() => {
    backgroundSync();
  }, intervalMs);

  // Also sync on page visibility change
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      backgroundSync();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Return cleanup function
  return () => {
    clearInterval(interval);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
