'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getDatabase, QuestionDocument } from '@/lib/db';
import { initialSync } from '@/lib/sync';

type SortField = 'question_text' | 'answer' | 'score' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function QuestionsPage() {
  const [allQuestions, setAllQuestions] = useState<QuestionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [tags, setTags] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  useEffect(() => {
    const saved = localStorage.getItem('selectedTag');
    if (saved) setSelectedTag(saved);
    loadAllQuestions();
  }, []);

  const loadAllQuestions = async () => {
    setLoading(true);
    try {
      await initialSync();
      const db = await getDatabase();
      const questions = await db.questions.find().exec();
      const questionsList = questions.map((q) => q.toJSON() as QuestionDocument);

      setAllQuestions(questionsList);

      // Extract unique tags
      const tagSet = new Set<string>();
      questionsList.forEach((q) => {
        q.tags.forEach((tag) => tagSet.add(tag));
      });
      setTags(Array.from(tagSet).sort());

      setLoading(false);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setLoading(false);
    }
  };

  // Filter and sort in memory (fast)
  const filteredAndSorted = useMemo(() => {
    // Filter by tag
    let filtered = allQuestions;
    if (selectedTag && selectedTag !== 'all') {
      filtered = allQuestions.filter((q) => q.tags.includes(selectedTag));
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [allQuestions, selectedTag, sortField, sortDirection]);

  // Paginate
  const totalPages = Math.ceil(filteredAndSorted.length / pageSize);
  const displayedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSorted.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSorted, currentPage, pageSize]);

  // Reset to page 1 when filter/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTag, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question?')) return;

    try {
      // Delete from local DB
      const db = await getDatabase();
      const doc = await db.questions.findOne(id).exec();
      if (doc) {
        await doc.remove();
      }

      // Delete from Supabase
      await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
      });

      setAllQuestions(allQuestions.filter((q) => q.id !== id));
    } catch (err) {
      console.error('Failed to delete question:', err);
      alert('Failed to delete question');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-xl">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
          <Link
            href="/add"
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Add Question
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6">
          Questions ({filteredAndSorted.length})
        </h1>

        {tags.length > 0 && (
          <div className="mb-6 flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedTag('all')}
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
                onClick={() => setSelectedTag(tag)}
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

        {filteredAndSorted.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-xl mb-4">No questions found.</p>
            <Link href="/add" className="text-blue-600 hover:underline">
              Add your first question
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSort('question_text')}
                  >
                    Question {sortField === 'question_text' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSort('answer')}
                  >
                    Answer {sortField === 'answer' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSort('score')}
                  >
                    Score {sortField === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Tags</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedQuestions.map((q) => (
                  <tr key={q.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{q.question_text}</td>
                    <td className="px-4 py-3 text-sm">{q.answer}</td>
                    <td className="px-4 py-3 text-sm">{q.score.toFixed(1)}</td>
                    <td className="px-4 py-3 text-sm">
                      {q.tags.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {q.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} • Showing {displayedQuestions.length} of {filteredAndSorted.length}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
        )}
      </div>
    </div>
  );
}
