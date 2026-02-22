"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Medal,
  PlayCircle,
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

export default function ContestDetailPage() {
  const router = useRouter();
  const { slug } = useParams();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contest, setContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => setMounted(true), []);

  const fetchContest = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [contestRes, boardRes] = await Promise.all([
        fetch(`${API_URL}/api/contests/${slug}`, { headers }),
        fetch(`${API_URL}/api/contests/${slug}/leaderboard`, { headers }),
      ]);
      const contestData = await contestRes.json();
      const boardData = await boardRes.json();

      if (!contestRes.ok || !contestData.success) {
        setError(contestData.message || "Contest not found");
        setContest(null);
        setLeaderboard([]);
        return;
      }

      setContest(contestData.contest || null);
      setLeaderboard(boardRes.ok && boardData.success ? boardData.leaderboard || [] : []);
    } catch {
      setError("Failed to load contest");
      setContest(null);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL, slug]);

  useEffect(() => {
    if (!mounted) return;
    fetchContest();
  }, [mounted, fetchContest]);

  const handleJoin = async () => {
    if (!contest?._id) return;
    setJoining(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/contests/${contest._id}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setContest((prev) => (prev ? { ...prev, joined: true } : prev));
      }
    } catch (err) {
      console.error("Join contest failed:", err);
    } finally {
      setJoining(false);
    }
  };

  const durationText = useMemo(() => {
    if (!contest?.startTime || !contest?.endTime) return "N/A";
    const ms = new Date(contest.endTime).getTime() - new Date(contest.startTime).getTime();
    const totalMinutes = Math.max(0, Math.round(ms / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  }, [contest]);

  const isContestEnded = useMemo(() => {
    if (!contest) return false;
    const status = String(contest.status || "").toLowerCase();
    if (status === "past" || status === "ended" || status === "completed") return true;
    if (!contest.endTime) return false;
    return new Date(contest.endTime).getTime() <= Date.now();
  }, [contest]);

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push("/dashboard/contests")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-8 text-center">
          <p className="text-red-500 font-semibold">{error || "Contest not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <button
        onClick={() => router.push("/dashboard/contests")}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 text-sm font-bold hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Contests
      </button>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
                {contest.title}
              </h1>
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {contest.description || "No description provided."}
            </p>
          </div>

          {!contest.joined && contest.status !== "past" && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="px-5 py-2.5 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
            >
              {joining ? "Joining..." : "Join Contest"}
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              icon: CalendarDays,
              label: "Start",
              value: new Date(contest.startTime).toLocaleString(),
            },
            {
              icon: Clock3,
              label: "End",
              value: new Date(contest.endTime).toLocaleString(),
            },
            {
              icon: Zap,
              label: "Duration",
              value: durationText,
            },
            {
              icon: Users,
              label: "Participants",
              value: String(contest.participants ?? leaderboard.length ?? 0),
            },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2"
            >
              <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-1 break-words">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-blue-500" />
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Problems</h2>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {contest.problems?.length || 0} total
            </span>
          </div>

          {contest.problems?.length ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {contest.problems
                .slice()
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((item, idx) => (
                  <div
                    key={`${item.problemId}-${idx}`}
                    className="px-5 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {idx + 1}. {item.title || "Unknown Problem"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.difficulty || "N/A"} • {item.points || 100} pts
                      </div>
                    </div>
                    {item.slug && !isContestEnded && (
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/problems/${item.slug}?contestId=${contest._id}`
                          )
                        }
                        className="shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Solve
                      </button>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No problems assigned.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="text-lg font-black text-gray-900 dark:text-white">Leaderboard</h2>
          </div>

          {leaderboard.length ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {leaderboard.map((row) => (
                <div
                  key={row.userId}
                  className="px-5 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white truncate">
                      <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 flex items-center justify-center text-xs">
                        {row.rank}
                      </span>
                      {row.name || row.username}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      @{row.username} • {row.solved} solved
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-amber-500">{row.score} pts</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {row.totalRuntime || 0} ms
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <Medal className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              No leaderboard data yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
