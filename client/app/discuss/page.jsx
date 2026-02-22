"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  AlertCircle,
  Clock3,
  Code2,
  Crown,
  Flame,
  MessageCircle,
  Radio,
  Trophy,
  Users,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const formatCompact = (value) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);

const formatTimeAgo = (dateValue) => {
  if (!dateValue) return "unknown";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "unknown";

  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const verdictClass = (verdict = "") => {
  if (verdict === "Accepted") return "text-emerald-600 dark:text-emerald-400";
  if (verdict.includes("Wrong")) return "text-rose-600 dark:text-rose-400";
  if (verdict.includes("Time")) return "text-amber-600 dark:text-amber-400";
  return "text-blue-600 dark:text-blue-400";
};

export default function DiscussPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOverview = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_URL}/api/public/discuss-overview`);
        const data = await res.json();

        if (!res.ok || !data?.success) {
          setError(data?.message || "Failed to load discuss data");
          setOverview(null);
          return;
        }

        setOverview(data.data || null);
      } catch {
        setError("Failed to load discuss data");
        setOverview(null);
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  const summary = overview?.summary || {
    totalProblems: 0,
    totalContests: 0,
    totalSubmissions: 0,
    activeUsers7d: 0,
  };

  const liveCards = [
    { label: "Problems", value: summary.totalProblems, icon: Code2, tone: "from-blue-600 to-cyan-500" },
    { label: "Contests", value: summary.totalContests, icon: Trophy, tone: "from-violet-600 to-fuchsia-500" },
    { label: "Submissions", value: summary.totalSubmissions, icon: MessageCircle, tone: "from-orange-600 to-amber-500" },
    { label: "Active Users (7d)", value: summary.activeUsers7d, icon: Users, tone: "from-emerald-600 to-lime-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <section className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 md:p-10 mb-7">
            <div className="absolute -top-20 -right-10 w-72 h-72 bg-cyan-400/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-20 -left-8 w-72 h-72 bg-violet-500/20 blur-3xl rounded-full" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-200 text-xs font-bold uppercase tracking-widest mb-4">
                <Radio className="w-3.5 h-3.5" />
                Live Community Stream
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
                Discuss Hub
              </h1>
              <p className="mt-3 text-slate-300 max-w-3xl">
                Real activity from CodeWizard: trending tags, current contests, latest submissions, and top contributors.
              </p>
            </div>
          </section>

          {loading && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-10 text-center text-slate-600 dark:text-slate-300">
              Loading discuss data...
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
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
                {liveCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.label}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4"
                    >
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.tone} flex items-center justify-center text-white mb-3`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-bold">{card.label}</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCompact(card.value)}</p>
                    </div>
                  );
                })}
              </section>

              <section className="grid lg:grid-cols-[1.25fr_0.9fr] gap-6">
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <h2 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        Trending Tags
                      </h2>
                    </div>
                    <div className="p-5 grid sm:grid-cols-2 gap-3">
                      {(overview?.trendingTags || []).map((tag) => (
                        <div key={tag.tag} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/50">
                          <p className="font-bold text-slate-900 dark:text-white">#{tag.tag}</p>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-slate-500 dark:text-slate-400">Problems</p>
                              <p className="font-bold">{tag.problemCount}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 dark:text-slate-400">Submits</p>
                              <p className="font-bold">{formatCompact(tag.totalSubmissions)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 dark:text-slate-400">AC%</p>
                              <p className="font-bold">{Number(tag.acceptanceRate || 0).toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(overview?.trendingTags || []).length === 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No tag data yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                      <h2 className="font-black text-xl text-slate-900 dark:text-white">Recent Submission Activity</h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(overview?.recentSubmissions || []).map((item) => (
                        <div key={item._id} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">{item.problem?.title || "Unknown Problem"}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <span className={verdictClass(item.verdict)}>{item.verdict}</span>
                                <span>{item.language}</span>
                                <span>{item.runtime || 0} ms</span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 className="w-3.5 h-3.5" />
                                  {formatTimeAgo(item.submittedAt)}
                                </span>
                              </div>
                            </div>
                            <Link
                              href={`/${item.user?.username || ""}`}
                              className="shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              @{item.user?.username || "unknown"}
                            </Link>
                          </div>
                        </div>
                      ))}
                      {(overview?.recentSubmissions || []).length === 0 && (
                        <div className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400">No submission activity found.</div>
                      )}
                    </div>
                  </div>
                </div>

                <aside className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                      <h2 className="font-black text-xl text-slate-900 dark:text-white">Current Contests</h2>
                    </div>
                    <div className="p-5 space-y-3">
                      {(overview?.activeContests || []).map((contest) => (
                        <div key={contest.slug} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/50">
                          <p className="font-semibold text-slate-900 dark:text-white leading-snug">{contest.title}</p>
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold ${
                                contest.status === "running"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              }`}
                            >
                              {contest.status}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">{contest.problemCount} problems</span>
                          </div>
                        </div>
                      ))}
                      {(overview?.activeContests || []).length === 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No active or upcoming contests.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                      <h2 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
                        <Crown className="w-5 h-5 text-amber-500" />
                        Top Contributors
                      </h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(overview?.topContributors || []).map((user, index) => (
                        <div key={user._id} className="px-5 py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {index + 1}. {user.name || user.username}
                            </p>
                            <Link href={`/${user.username}`} className="text-xs text-slate-500 dark:text-slate-400 hover:underline">
                              @{user.username}
                            </Link>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900 dark:text-white">{user.solved}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">solved</p>
                          </div>
                        </div>
                      ))}
                      {(overview?.topContributors || []).length === 0 && (
                        <div className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400">No contributor data available.</div>
                      )}
                    </div>
                  </div>
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
