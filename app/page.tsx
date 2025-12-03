import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Learning App</h1>

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
