"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  AlertCircle,
  CalendarClock,
  Clock3,
  PlayCircle,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const formatCompact = (value) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

const getStatusClass = (status) => {
  if (status === "running") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (status === "upcoming") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
};

function ContestCard({ contest }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{contest.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
            {contest.description || "No description provided."}
          </p>
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusClass(contest.status)}`}>
          {contest.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3">
          <p className="text-slate-500 dark:text-slate-400">Starts</p>
          <p className="font-semibold text-slate-900 dark:text-white mt-1">{formatDateTime(contest.startTime)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3">
          <p className="text-slate-500 dark:text-slate-400">Ends</p>
          <p className="font-semibold text-slate-900 dark:text-white mt-1">{formatDateTime(contest.endTime)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <span>{contest.problemCount} problems</span>
        <span>{contest.participants} participants</span>
      </div>
    </div>
  );
}

export default function PublicContestsPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_URL}/api/public/contests-overview`);
        const data = await res.json();

        if (!res.ok || !data?.success) {
          setError(data?.message || "Failed to load contests");
          setOverview(null);
          return;
        }

        setOverview(data.data || null);
      } catch {
        setError("Failed to load contests");
        setOverview(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const summary = overview?.summary || {
    totalContests: 0,
    runningContests: 0,
    upcomingContests: 0,
    pastContests: 0,
    totalParticipants: 0,
  };

  const metrics = [
    { label: "Total", value: summary.totalContests, icon: Trophy, tone: "from-blue-600 to-cyan-500" },
    { label: "Running", value: summary.runningContests, icon: PlayCircle, tone: "from-emerald-600 to-lime-500" },
    { label: "Upcoming", value: summary.upcomingContests, icon: CalendarClock, tone: "from-violet-600 to-fuchsia-500" },
    { label: "Past", value: summary.pastContests, icon: Clock3, tone: "from-slate-600 to-slate-500" },
    { label: "Participants", value: summary.totalParticipants, icon: Users, tone: "from-orange-600 to-amber-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <section className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-10 mb-7">
            <div className="absolute -top-20 -right-10 w-72 h-72 bg-fuchsia-500/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-20 -left-8 w-72 h-72 bg-blue-500/20 blur-3xl rounded-full" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-100 text-xs font-bold uppercase tracking-widest mb-4">
                <Zap className="w-3.5 h-3.5" />
                Competitive Arena
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">Contests</h1>
              <p className="mt-3 text-slate-300 max-w-3xl">
                Track running battles, plan for upcoming rounds, and review recent contests from real platform data.
              </p>
            </div>
          </section>

          {loading && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-10 text-center text-slate-600 dark:text-slate-300">
              Loading contests...
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
              <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-7">
                {metrics.map((metric) => {
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
                  <h2 className="font-black text-2xl text-slate-900 dark:text-white">Running</h2>
                  {(overview?.running || []).map((contest) => (
                    <ContestCard key={contest._id} contest={contest} />
                  ))}
                  {(overview?.running || []).length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No running contests right now.</p>
                  )}
                </div>

                <div className="space-y-4">
                  <h2 className="font-black text-2xl text-slate-900 dark:text-white">Upcoming</h2>
                  {(overview?.upcoming || []).map((contest) => (
                    <ContestCard key={contest._id} contest={contest} />
                  ))}
                  {(overview?.upcoming || []).length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming contests scheduled yet.</p>
                  )}
                </div>

                <aside className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                      <h2 className="font-black text-xl text-slate-900 dark:text-white">Top Performers</h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(overview?.topPerformers || []).map((item, idx) => (
                        <div key={`${item.user?._id}-${item.contest?._id}-${idx}`} className="px-5 py-3">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {idx + 1}. {item.user?.name || item.user?.username || "Unknown"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            @{item.user?.username} • {item.contest?.title}
                          </p>
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">{item.solved || 0} solved</p>
                        </div>
                      ))}
                      {(overview?.topPerformers || []).length === 0 && (
                        <div className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400">No performer data yet.</div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                      <h2 className="font-black text-xl text-slate-900 dark:text-white">Recently Finished</h2>
                    </div>
                    <div className="p-5 space-y-3">
                      {(overview?.recentPast || []).slice(0, 6).map((contest) => (
                        <div key={contest._id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950/60">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">{contest.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Ended: {formatDateTime(contest.endTime)}
                          </p>
                        </div>
                      ))}
                      {(overview?.recentPast || []).length === 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No completed contests yet.</p>
                      )}
                    </div>
                  </div>

                  <Link
                    href="/dashboard/contests"
                    className="block w-full text-center px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold hover:shadow-lg transition-all"
                  >
                    Join from Dashboard
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
