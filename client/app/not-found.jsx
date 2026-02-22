import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-2xl dark:shadow-slate-900/50 rounded-2xl px-6 sm:px-8 py-12 border border-gray-200 dark:border-slate-700 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">404 - Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Sorry, the page you are looking for does not exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow transition-all duration-300"
          >
            Go Home
          </Link>
          <Link
            href="/problems"
            className="px-6 py-3 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300"
          >
            Browse Problems
          </Link>
        </div>
      </div>
    </main>
  );
}
