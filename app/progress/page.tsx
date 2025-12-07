'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDatabase, QuestionDocument } from '@/lib/db';

type ProgressData = {
  total: number;
  learned: number;
  progress: number;
  learned_words: QuestionDocument[];
};

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>('all');

  useEffect(() => {
    // Load selected tag from localStorage
    const saved = localStorage.getItem('selectedTag');
    if (saved) setSelectedTag(saved);
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [selectedTag]);

  const fetchProgress = async () => {
    try {
      const db = await getDatabase();

      // Filter by selected tag
      const tagFilter = selectedTag && selectedTag !== 'all'
        ? { tags: { $in: [selectedTag] } }
        : {};

      const allQuestions = await db.questions.find({
        selector: tagFilter,
      }).exec();
      const total = allQuestions.length;

      // Weighted progress calculation
      const INITIAL_SCORE = 4.0;
      let totalContribution = 0;
      let learned = 0;
      const learned_words: QuestionDocument[] = [];

      for (const q of allQuestions) {
        const doc = q.toJSON() as QuestionDocument;
        const contribution = Math.max(0, (INITIAL_SCORE - doc.score) / INITIAL_SCORE);
        totalContribution += contribution;
        if (doc.score <= 0) {
          learned++;
          learned_words.push(doc);
        }
      }

      const progress = total > 0 ? Math.round((totalContribution / total) * 100) : 0;

      setData({
        total,
        learned,
        progress,
        learned_words,
      });
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch progress:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-xl">Loading progress...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-blue-600 hover:underline mb-6 block">
            ← Back to Home
          </Link>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-xl">Failed to load progress data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6">Your Progress</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">Total Questions</div>
            <div className="text-3xl font-bold">{data.total}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">Questions Learned</div>
            <div className="text-3xl font-bold text-green-600">{data.learned}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">Progress</div>
            <div className="text-3xl font-bold text-blue-600">{data.progress}%</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-semibold mb-4">Progress Bar</h2>
          <div className="w-full bg-gray-200 rounded-full h-6">
            <div
              className="bg-blue-600 h-6 rounded-full transition-all duration-500 flex items-center justify-center text-white text-sm font-medium"
              style={{ width: data.progress + '%' }}
            >
              {data.progress > 10 && data.progress + '%'}
            </div>
          </div>
        </div>

        {data.learned_words.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">
              Learned Words ({data.learned_words.length})
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {data.learned_words.map((word) => (
                <div
                  key={word.id}
                  className="p-4 border border-gray-200 rounded-md"
                >
                  <div className="font-medium">{word.question_text}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Answer: {word.answer}
                  </div>
                  {word.description && (
                    <div className="text-sm text-gray-500 mt-1">
                      {word.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
