"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  AlertCircle,
  BadgeCheck,
  BarChart3,
  Flame,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const formatCompact = (value) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);

const difficultyClass = (difficulty) => {
  if (difficulty === "Easy") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (difficulty === "Medium") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
};

function ProblemCard({ problem }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
          {problem.title}
        </h3>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${difficultyClass(problem.difficulty)}`}>
          {problem.difficulty}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(problem.tags || []).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
          <p className="text-slate-500 dark:text-slate-400">Submissions</p>
          <p className="font-bold text-slate-900 dark:text-white">{formatCompact(problem.totalSubmissions || 0)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
          <p className="text-slate-500 dark:text-slate-400">Acceptance</p>
          <p className="font-bold text-slate-900 dark:text-white">{Number(problem.acceptanceRate || 0).toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}

export default function ProblemsPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOverview = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/api/public/problems-overview`);
        const data = await res.json();

        if (!res.ok || !data?.success) {
          setError(data?.message || "Failed to load problems data");
          setOverview(null);
          return;
        }

        setOverview(data.data || null);
      } catch {
        setError("Failed to load problems data");
        setOverview(null);
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  const summary = overview?.summary || {
    totalProblems: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    premium: 0,
    totalSubmissions: 0,
    totalAccepted: 0,
    overallAcceptanceRate: 0,
  };

  const metricCards = [
    { label: "Total", value: summary.totalProblems, icon: Layers3, tone: "from-blue-600 to-cyan-500" },
    { label: "Easy", value: summary.easy, icon: ShieldCheck, tone: "from-emerald-600 to-lime-500" },
    { label: "Medium", value: summary.medium, icon: Target, tone: "from-amber-600 to-orange-500" },
    { label: "Hard", value: summary.hard, icon: Flame, tone: "from-rose-600 to-pink-500" },
    { label: "Premium", value: summary.premium, icon: Sparkles, tone: "from-violet-600 to-fuchsia-500" },
    { label: "Submissions", value: summary.totalSubmissions, icon: BarChart3, tone: "from-slate-600 to-slate-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <section className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 p-8 md:p-10 mb-7">
            <div className="absolute -top-20 -right-10 w-72 h-72 bg-cyan-400/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-20 -left-8 w-72 h-72 bg-blue-500/20 blur-3xl rounded-full" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-100 text-xs font-bold uppercase tracking-widest mb-4">
                <Zap className="w-3.5 h-3.5" />
                Problem Space
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">Problems</h1>
              <p className="mt-3 text-slate-300 max-w-3xl">
                Explore real platform data: difficulty split, hot tags, most attempted problems, and top solvers.
              </p>
            </div>
          </section>

          {loading && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-10 text-center text-slate-600 dark:text-slate-300">
              Loading problems...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 p-8 text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-rose-600 dark:text-rose-400 mb-3" />
              <p className="text-rose-700 dark:text-rose-300 font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-7">
                {metricCards.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div key={metric.label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${metric.tone} flex items-center justify-center text-white mb-3`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-bold">{metric.label}</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCompact(metric.value)}</p>
                    </div>
                  );
                })}
              </section>

              <section className="grid lg:grid-cols-[1.1fr_1.1fr_0.9fr] gap-6">
                <div className="space-y-4">
                  <h2 className="font-black text-2xl text-slate-900 dark:text-white">Most Attempted</h2>
                  {(overview?.popularProblems || []).slice(0, 8).map((problem) => (
                    <ProblemCard key={problem._id} problem={problem} />
                  ))}
                  {(overview?.popularProblems || []).length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No popular problem data yet.</p>
                  )}
                </div>

                <div className="space-y-4">
                  <h2 className="font-black text-2xl text-slate-900 dark:text-white">Newly Added</h2>
                  {(overview?.newestProblems || []).slice(0, 8).map((problem) => (
                    <ProblemCard key={problem._id} problem={problem} />
                  ))}
                  {(overview?.newestProblems || []).length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No new problem data yet.</p>
                  )}
                </div>

                <aside className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                      <h2 className="font-black text-xl text-slate-900 dark:text-white">Trending Tags</h2>
                    </div>
                    <div className="p-5 space-y-3">
                      {(overview?.trendingTags || []).map((tag) => (
                        <div key={tag.tag} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950/60">
                          <p className="font-semibold text-slate-900 dark:text-white">#{tag.tag}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {tag.problemCount} problems • {formatCompact(tag.totalSubmissions)} submits • {Number(tag.acceptanceRate || 0).toFixed(1)}% AC
                          </p>
                        </div>
                      ))}
                      {(overview?.trendingTags || []).length === 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No tag data available.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                      <h2 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Top Solvers
                      </h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(overview?.topSolvers || []).map((user, idx) => (
                        <div key={user._id} className="px-5 py-3">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {idx + 1}. {user.name || user.username}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">@{user.username}</p>
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            <BadgeCheck className="inline w-3.5 h-3.5 mr-1" />
                            {user.solved} solved
                          </p>
                        </div>
                      ))}
                      {(overview?.topSolvers || []).length === 0 && (
                        <div className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400">No solver data available.</div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Overall Acceptance</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      {Number(summary.overallAcceptanceRate || 0).toFixed(2)}%
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatCompact(summary.totalAccepted)} accepted out of {formatCompact(summary.totalSubmissions)} submissions.
                    </p>
                  </div>

                  <Link
                    href="/dashboard/problems"
                    className="block w-full text-center px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg transition-all"
                  >
                    Start Solving
                  </Link>
                </aside>
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
