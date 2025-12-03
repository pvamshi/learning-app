'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Question } from '@/lib/supabase';

export default function RevisionMode() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    correctAnswer: string;
  } | null>(null);

  useEffect(() => {
    fetchNextQuestion();
  }, []);

  const fetchNextQuestion = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/revision');
      const data = await res.json();
      setQuestion(data.question);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch question:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (isDontKnow = false) => {
    if (!question) return;

    setSubmitting(true);

    try {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: question.id,
          user_answer: isDontKnow ? '' : userAnswer,
        }),
      });

      const data = await res.json();
      setFeedback({
        correct: data.correct,
        correctAnswer: data.correct_answer,
      });
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setSubmitting(false);
    }
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
                disabled={submitting}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => handleSubmit()}
                  disabled={!userAnswer.trim() || submitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={submitting}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Don't Know
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                className={'p-4 rounded-md mb-4 ' + (feedback.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}
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
