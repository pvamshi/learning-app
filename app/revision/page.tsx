'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDatabase, QuestionDocument, generateId } from '@/lib/db';
import { calculateNewScore, isAnswerCorrect } from '@/lib/scoring';
import { initialSync, startBackgroundSync } from '@/lib/sync';

export default function RevisionMode() {
  const [question, setQuestion] = useState<QuestionDocument | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    correctAnswer: string;
  } | null>(null);

  useEffect(() => {
    fetchNextQuestion();
    const cleanup = startBackgroundSync(10000);
    return cleanup;
  }, []);

  const fetchNextQuestion = async () => {
    setLoading(true);
    try {
      await initialSync();
      const db = await getDatabase();

      // Get selected tag from localStorage
      const selectedTag = localStorage.getItem('selectedTag');
      const tagFilter = selectedTag && selectedTag !== 'all'
        ? { tags: { $in: [selectedTag] } }
        : {};

      // Get unlearned questions (score > 0) in FIFO order
      const questions = await db.questions
        .find({
          selector: {
            score: { $gt: 0 },
            ...tagFilter,
          },
          sort: [{ last_reviewed_at: 'asc' }],
          limit: 1,
        })
        .exec();

      if (questions.length > 0) {
        setQuestion(questions[0].toJSON());
      } else {
        setQuestion(null);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch question:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (isDontKnow = false) => {
    if (!question) return;

    const answer = isDontKnow ? '' : userAnswer;

    // Check answer client-side
    const correct = isAnswerCorrect(answer, question.answer);

    // Calculate new score
    const newScore = calculateNewScore(question.score, correct);

    // Update in RxDB (instant)
    try {
      const db = await getDatabase();
      const doc = await db.questions.findOne(question.id).exec();
      if (doc) {
        await doc.patch({
          score: newScore,
          last_reviewed_at: new Date().toISOString(),
          is_dirty: true,
        });
      }

      // Record attempt
      await db.attempts.insert({
        id: generateId(),
        question_id: question.id,
        correct,
        answered_at: new Date().toISOString(),
        is_synced: false,
      });
    } catch (err) {
      console.error('Failed to update question:', err);
    }

    // Show feedback
    setFeedback({
      correct,
      correctAnswer: question.answer,
    });
  };

  const handleNext = () => {
    setFeedback(null);
    setUserAnswer('');
    fetchNextQuestion();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-xl">Loading question...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="text-blue-600 hover:underline mb-6 block">
            ← Back to Home
          </Link>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <h2 className="text-2xl font-bold mb-4">All Done!</h2>
            <p className="text-lg mb-4">
              You've learned all your questions!
            </p>
            <Link
              href="/progress"
              className="text-blue-600 hover:underline"
            >
              View your progress
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4 text-sm text-gray-600">
            Difficulty Score: {question.score.toFixed(1)}
          </div>

          <h2 className="text-2xl font-semibold mb-4">
            {question.question_text}
          </h2>

          {question.description && (
            <p className="text-gray-600 mb-4 text-sm">
              {question.description}
            </p>
          )}

          {!feedback ? (
            <>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && userAnswer.trim()) {
                    handleSubmit();
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your answer..."
                autoFocus
              />

              <div className="flex gap-3">
                <button
                  onClick={() => handleSubmit()}
                  disabled={!userAnswer.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                  Don't Know
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                className={
                  'p-4 rounded-md mb-4 ' +
                  (feedback.correct
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800')
                }
              >
                <p className="font-semibold">
                  {feedback.correct ? 'Correct!' : 'Incorrect'}
                </p>
                {!feedback.correct && (
                  <p className="mt-2">
                    Correct answer: <strong>{feedback.correctAnswer}</strong>
                  </p>
                )}
              </div>

              <button
                onClick={handleNext}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Next Question
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
