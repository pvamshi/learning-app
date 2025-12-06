'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDatabase } from "@/lib/db";
import { initialSync } from "@/lib/sync";

export default function Home() {
  const [progress, setProgress] = useState<{
    total: number;
    learned: number;
    inProgress: number;
    percentage: number;
  } | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('all');

  useEffect(() => {
    loadTags();
    // Load selected tag from localStorage
    const saved = localStorage.getItem('selectedTag');
    if (saved) setSelectedTag(saved);
  }, []);

  useEffect(() => {
    loadProgress();
  }, [selectedTag]);

  const loadProgress = async () => {
    try {
      await initialSync();
      const db = await getDatabase();

      // Filter by selected tag
      const tagFilter = selectedTag && selectedTag !== 'all'
        ? { tags: { $in: [selectedTag] } }
        : {};

      const allQuestions = await db.questions.find({
        selector: tagFilter,
      }).exec();
      const total = allQuestions.length;

      if (total === 0) {
        setProgress(null);
        return;
      }

      // Weighted progress calculation
      const INITIAL_SCORE = 4.0;
      let totalContribution = 0;
      let learned = 0;
      let inProgress = 0;

      for (const q of allQuestions) {
        const doc = q.toJSON();
        const contribution = Math.max(0, (INITIAL_SCORE - doc.score) / INITIAL_SCORE);
        totalContribution += contribution;
        if (doc.score <= 0) learned++;
        if (doc.score !== 0 && doc.score !== 4 && doc.score !== 8) inProgress++;
      }

      const percentage = Math.round((totalContribution / total) * 100);

      setProgress({
        total,
        learned,
        inProgress,
        percentage,
      });
    } catch (err) {
      console.error('Failed to load progress:', err);
    }
  };

  const loadTags = async () => {
    try {
      const db = await getDatabase();
      const allQuestions = await db.questions.find().exec();

      const tagSet = new Set<string>();
      for (const q of allQuestions) {
        const doc = q.toJSON();
        doc.tags?.forEach(tag => tagSet.add(tag));
      }

      setTags(Array.from(tagSet).sort());
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
    localStorage.setItem('selectedTag', tag);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => handleTagSelect('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTag === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagSelect(tag)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {progress && progress.total > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span className="text-sm font-bold text-blue-600 min-w-[3rem] text-right">
                {progress.percentage}%
              </span>
            </div>
            <div className="text-sm text-gray-600 text-right">
              <span className="font-bold text-green-600">{progress.learned}</span>/{progress.total} learned • <span className="font-bold text-blue-600">{progress.inProgress}</span> in progress
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/add"
            className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">Add Question</h2>
            <p className="text-gray-600">Add new questions to your learning queue</p>
          </Link>

          <Link
            href="/game"
            className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">Play Game</h2>
            <p className="text-gray-600">Practice with 10 random questions</p>
          </Link>

          <Link
            href="/revision"
            className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">Questions</h2>
            <p className="text-gray-600">View, manage, and delete questions</p>
          </Link>

          <Link
            href="/progress"
            className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">Progress</h2>
            <p className="text-gray-600">View your learning progress and stats</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
