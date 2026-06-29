import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-center py-12 px-6">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Voting Portal 2026 Elections</h1>
          <p className="text-xl text-gray-700 max-w-2xl">
            Every vote you cast helps shape the future of our school community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link 
              href="/auth" 
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
            >
              Login to Vote
            </Link>
            <Link 
              href="/admin" 
              className="px-8 py-4 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
