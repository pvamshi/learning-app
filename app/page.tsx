'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDatabase } from "@/lib/db";
import { initialSync } from "@/lib/sync";

export default function Home() {
  const [progress, setProgress] = useState<{
    total: number;
    learned: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      await initialSync();
      const db = await getDatabase();

      const total = await db.questions.count().exec();
      const learned = await db.questions
        .find({
          selector: {
            score: { $lte: 0 },
          },
        })
        .exec();

      const percentage = total > 0 ? Math.round((learned.length / total) * 100) : 0;

      setProgress({
        total,
        learned: learned.length,
        percentage,
      });
    } catch (err) {
      console.error('Failed to load progress:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {progress && progress.total > 0 && (
          <div className="mb-8 flex items-center gap-3">
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
            <h2 className="text-2xl font-semibold mb-2">Revision Mode</h2>
            <p className="text-gray-600">Review questions systematically</p>
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
