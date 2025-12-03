'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Question } from '@/lib/supabase';

export default function GameMode() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    correctAnswer: string;
  } | null>(null);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/game');
      const data = await res.json();
      setQuestions(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (isDontKnow = false) => {
    setSubmitting(true);
    const currentQuestion = questions[currentIndex];

    try {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          user_answer: isDontKnow ? '' : userAnswer,
        }),
      });

      const data = await res.json();
      setFeedback({
        correct: data.correct,
        correctAnswer: data.correct_answer,
      });

      if (data.correct) {
        setScore(score + 1);
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    setFeedback(null);
    setUserAnswer('');

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setGameFinished(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-xl">Loading questions...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="text-blue-600 hover:underline mb-6 block">
            ← Back to Home
          </Link>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-xl mb-4">No questions available for game mode.</p>
            <Link href="/add" className="text-blue-600 hover:underline">
              Add some questions first
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (gameFinished) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="text-blue-600 hover:underline mb-6 block">
            ← Back to Home
          </Link>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <h2 className="text-3xl font-bold mb-4">Game Finished!</h2>
            <p className="text-xl mb-4">
              Your Score: {score} / {questions.length}
            </p>
            <p className="text-lg mb-6">
              Accuracy: {Math.round((score / questions.length) * 100)}%
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
          <div className="text-sm text-gray-600">
            Question {currentIndex + 1} of {questions.length} | Score: {score}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">
            {currentQuestion.question_text}
          </h2>

          {currentQuestion.description && (
            <p className="text-gray-600 mb-4 text-sm">
              {currentQuestion.description}
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
                {currentIndex + 1 < questions.length ? 'Next Question' : 'Finish'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
