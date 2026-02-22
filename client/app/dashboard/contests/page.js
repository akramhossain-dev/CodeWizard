"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { dashboardContestsAPI } from "@/lib/api";
import {
  CalendarDays,
  Clock3,
  PlayCircle,
  Search,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

const STATUS_STYLE = {
  upcoming: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  running: "bg-green-500/10 text-green-500 border-green-500/20",
  past: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

function getStatusLabel(status) {
  if (status === "running") return "Running";
  if (status === "upcoming") return "Upcoming";
  return "Past";
}

export default function ContestsPage() {
  const router = useRouter();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contests, setContests] = useState([]);
  const [joiningId, setJoiningId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);

  const fetchContests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { limit: "100" };
      if (status !== "all") params.status = status;
      if (search.trim()) params.search = search.trim();

      const data = await dashboardContestsAPI.getAll(params);
      if (!data.success) {
        setContests([]);
        setError(data.message || "Failed to load contests");
        return;
      }
      setContests(data.contests || []);
    } catch {
      setContests([]);
      setError("Failed to load contests");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    if (!mounted) return;
    fetchContests();
  }, [mounted, fetchContests]);

  const stats = useMemo(() => {
    const base = { total: contests.length, running: 0, upcoming: 0, past: 0 };
    for (const c of contests) {
      if (c.status === "running") base.running += 1;
      else if (c.status === "upcoming") base.upcoming += 1;
      else base.past += 1;
    }
    return base;
  }, [contests]);

  const handleJoin = async (contestId) => {
    setJoiningId(contestId);
    try {
      const data = await dashboardContestsAPI.join(contestId);
      if (data.success) {
        setContests((prev) =>
          prev.map((item) =>
            item._id === contestId ? { ...item, joined: true } : item
          )
        );
      }
    } catch (err) {
      console.error("Join contest failed:", err);
    } finally {
      setJoiningId("");
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm p-4 sm:p-6 md:p-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
                  Contests
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Join coding contests and climb the leaderboard
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {[
                { label: "Total", value: stats.total, icon: Trophy, color: "text-blue-500" },
                { label: "Running", value: stats.running, icon: PlayCircle, color: "text-green-500" },
                { label: "Upcoming", value: stats.upcoming, icon: CalendarDays, color: "text-blue-500" },
                { label: "Past", value: stats.past, icon: Clock3, color: "text-gray-500" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] px-2 sm:px-3 py-2"
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${color}`} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">{label}</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-gray-900 dark:text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contests..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {["all", "running", "upcoming", "past"].map((item) => (
                <button
                  key={item}
                  onClick={() => setStatus(item)}
                  className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                    status === item
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-[#252525]"
                  }`}
                >
                  {item === "all" ? "All" : getStatusLabel(item)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center text-red-500 font-semibold">{error}</div>
        ) : contests.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">No contests found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Try changing filters or search keyword.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {contests.map((contest) => (
              <div
                key={contest._id}
                className="px-4 sm:px-5 md:px-6 py-4 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
              >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white truncate">
                        {contest.title}
                      </h3>
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          STATUS_STYLE[contest.status] || STATUS_STYLE.past
                        }`}
                      >
                        {getStatusLabel(contest.status)}
                      </span>
                      {contest.joined && (
                        <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border bg-green-500/10 text-green-500 border-green-500/20">
                          Joined
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {contest.description || "No description provided."}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <div className="inline-flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline">{new Date(contest.startTime).toLocaleString()}</span>
                        <span className="sm:hidden">{new Date(contest.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <Clock3 className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline">Ends {new Date(contest.endTime).toLocaleString()}</span>
                        <span className="sm:hidden">Ends {new Date(contest.endTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        {contest.problems?.length || 0} problems
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:items-stretch w-full sm:w-auto">
                    {!contest.joined && contest.status !== "past" && (
                      <button
                        onClick={() => handleJoin(contest._id)}
                        disabled={joiningId === contest._id}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60 text-center"
                      >
                        {joiningId === contest._id ? "Joining..." : "Join"}
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/dashboard/contests/${contest.slug}`)}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
