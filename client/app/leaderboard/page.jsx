"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Trophy, TrendingUp, Users, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LeaderboardPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    const fetchTopSolvers = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/api/public/top-solvers?limit=20`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.message || "Failed to load leaderboard");
          setItems([]);
          return;
        }
        setItems(data.solvers || []);
      } catch {
        setError("Failed to load leaderboard");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopSolvers();
  }, [API_URL]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Trophy className="w-9 h-9 text-amber-500" />
            Leaderboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Top solvers based on the number of problems solved and their acceptance rate.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-[4rem_1.2fr_6rem_6rem_8rem_6rem] gap-4 px-5 py-3 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <span>Rank</span>
            <span>User</span>
            <span>Solved</span>
            <span>Try</span>
            <span>Accept</span>
            <span>Rating</span>
          </div>

          {loading && (
            <div className="px-5 py-16 text-center text-gray-500 dark:text-gray-400">Loading leaderboard...</div>
          )}

          {!loading && error && (
            <div className="px-5 py-16 text-center">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-500" />
              <p className="text-red-500 font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="px-5 py-16 text-center text-gray-500 dark:text-gray-400">No solvers found.</div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {items.map((item, idx) => (
                <div key={item._id || item.username || idx}>
                  <div className="md:hidden px-4 py-4 hover:bg-gray-50 dark:hover:bg-slate-900/70 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-black text-gray-900 dark:text-white">
                        {idx + 1 <= 3 ? ["🥇", "🥈", "🥉"][idx] : `#${idx + 1}`}
                      </span>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {item.rating || 0}
                      </span>
                    </div>

                    <Link href={`/${item.username}`} className="min-w-0 flex items-center gap-3 group">
                      {item.profilePicture ? (
                        <img
                          src={item.profilePicture}
                          alt={item.name || item.username}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700 group-hover:ring-2 group-hover:ring-blue-500 transition"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center group-hover:ring-2 group-hover:ring-blue-500 transition">
                          {(item.name?.charAt(0) || item.username?.charAt(0) || "U").toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate">{item.name || "Unknown"}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{item.username}</p>
                      </div>
                    </Link>

                    <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                      <div className="rounded-lg border border-gray-200 dark:border-slate-700 px-2 py-2 text-center">
                        <p className="text-gray-500 dark:text-gray-400">Solved</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{item.solved || 0}</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 dark:border-slate-700 px-2 py-2 text-center">
                        <p className="text-gray-500 dark:text-gray-400">Tried</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{item.attempted || 0}</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 dark:border-slate-700 px-2 py-2 text-center">
                        <p className="text-gray-500 dark:text-gray-400">Accept</p>
                        <p className="font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {Number(item.acceptanceRate || 0).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:grid grid-cols-[4rem_1.2fr_6rem_6rem_8rem_6rem] gap-4 px-5 py-4 items-center hover:bg-gray-50 dark:hover:bg-slate-900/70 transition-colors">
                    <div className="font-black text-gray-900 dark:text-white">
                      {idx + 1 <= 3 ? ["🥇", "🥈", "🥉"][idx] : `#${idx + 1}`}
                    </div>

                    <Link href={`/${item.username}`} className="min-w-0 flex items-center gap-2 group cursor-pointer">
                      {item.profilePicture ? (
                        <img
                          src={item.profilePicture}
                          alt={item.name || item.username}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-slate-700 group-hover:ring-2 group-hover:ring-blue-500 transition"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center group-hover:ring-2 group-hover:ring-blue-500 transition">
                          {(item.name?.charAt(0) || item.username?.charAt(0) || "U").toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate">{item.name || "Unknown"}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{item.username}</p>
                      </div>
                    </Link>

                    <span className="font-semibold text-gray-700 dark:text-gray-300">{item.solved || 0}</span>

                    <span className="font-semibold text-gray-700 dark:text-gray-300">{item.attempted || 0}</span>

                    <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {Number(item.acceptanceRate || 0).toFixed(2)}%
                    </span>

                    <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {item.rating || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
