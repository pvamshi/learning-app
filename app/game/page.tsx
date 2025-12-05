'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDatabase, QuestionDocument, generateId } from '@/lib/db';
import { calculateNewScore, isAnswerCorrect } from '@/lib/scoring';
import { initialSync, startBackgroundSync } from '@/lib/sync';
import { DIFFICULT_THRESHOLD } from '@/lib/scoring';

export default function GameMode() {
  const [questions, setQuestions] = useState<QuestionDocument[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    correctAnswer: string;
  } | null>(null);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    loadGame();

    // Start background sync
    const cleanup = startBackgroundSync(10000);
    return cleanup;
  }, []);

  const loadGame = async () => {
    try {
      // Ensure initial sync
      await initialSync();

      const db = await getDatabase();

      // Get selected tag from localStorage
      const selectedTag = localStorage.getItem('selectedTag');
      const tagFilter = selectedTag && selectedTag !== 'all'
        ? { tags: { $in: [selectedTag] } }
        : {};

      // Get difficult words (score >= 5)
      const difficultWords = await db.questions
        .find({
          selector: {
            score: { $gte: DIFFICULT_THRESHOLD, $gt: 0 },
            ...tagFilter,
          },
          sort: [{ last_reviewed_at: 'asc' }],
          limit: 10,
        })
        .exec();

      // Get new/unlearned words (score > 0 and < 5)
      const newWords = await db.questions
        .find({
          selector: {
            score: { $gt: 0, $lt: DIFFICULT_THRESHOLD },
            ...tagFilter,
          },
          sort: [{ last_reviewed_at: 'asc' }],
          limit: 10,
        })
        .exec();

      const difficult: QuestionDocument[] = difficultWords.map((d) => d.toJSON() as QuestionDocument);
      const newW: QuestionDocument[] = newWords.map((n) => n.toJSON() as QuestionDocument);

      // Mix: 20% difficult, 80% new
      const targetDifficult = Math.min(2, difficult.length);
      const targetNew = Math.min(8, newW.length);

      let selectedQuestions = [
        ...difficult.slice(0, targetDifficult),
        ...newW.slice(0, targetNew),
      ];

      // Fill remaining
      const remaining = 10 - selectedQuestions.length;
      if (remaining > 0) {
        const remainingDifficult = difficult.slice(targetDifficult);
        const remainingNew = newW.slice(targetNew);
        const additional = [...remainingDifficult, ...remainingNew].slice(
          0,
          remaining
        );
        selectedQuestions = [...selectedQuestions, ...additional];
      }

      // Shuffle
      const shuffled = selectedQuestions.sort(() => Math.random() - 0.5);

      setQuestions(shuffled);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load game:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (isDontKnow = false) => {
    const currentQuestion = questions[currentIndex];
    const answer = isDontKnow ? '' : userAnswer;

    // Check answer client-side
    const correct = isAnswerCorrect(answer, currentQuestion.answer);

    // Calculate new score client-side
    const newScore = calculateNewScore(currentQuestion.score, correct);

    // Update in RxDB (instant)
    try {
      const db = await getDatabase();
      const doc = await db.questions.findOne(currentQuestion.id).exec();
      if (doc) {
        await doc.patch({
          score: newScore,
          last_reviewed_at: new Date().toISOString(),
          is_dirty: true, // Mark for sync
        });
      }

      // Record attempt
      await db.attempts.insert({
        id: generateId(),
        question_id: currentQuestion.id,
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
      correctAnswer: currentQuestion.answer,
    });

    if (correct) {
      setScore(score + 1);
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
                {currentIndex + 1 < questions.length ? 'Next Question' : 'Finish'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
