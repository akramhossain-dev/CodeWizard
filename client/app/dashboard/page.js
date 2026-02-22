"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, CheckCircle, Trophy, Activity, Code, Target, Zap,
  Calendar, Flame, Award, ChevronRight, Clock, BookOpen, Star,
  BarChart2, FileCode, Users, ArrowRight, Eye
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchDashboardData();
  }, [mounted]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // User data
      const userRes = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      if (userData.success) setUser(userData.user);

      // Recent submissions
      const subsRes = await fetch(`${API_URL}/api/submissions/my-submissions?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subsData = await subsRes.json();
      if (subsData.success) setSubmissions(subsData.submissions ?? []);

      // Build stats from user data
      if (userData.success) {
        const u = userData.user;
        setStats({
          solved: u.stats?.solved ?? 0,
          attempted: u.stats?.attempted ?? 0,
          easySolved: u.stats?.easySolved ?? 0,
          mediumSolved: u.stats?.mediumSolved ?? 0,
          hardSolved: u.stats?.hardSolved ?? 0,
          acceptanceRate: u.stats && u.stats.attempted > 0
            ? Math.round((u.stats.solved / u.stats.attempted) * 100)
            : 0,
          rating: u.rating ?? 0,
          rank: u.rank ?? 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center animate-pulse shadow-2xl shadow-blue-500/30">
            <Code className="w-7 h-7 text-white" />
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const initial = (user?.name?.charAt(0) || "U").toUpperCase();
  const totalSolved = (stats?.easySolved ?? 0) + (stats?.mediumSolved ?? 0) + (stats?.hardSolved ?? 0);

  return (
    <div className="space-y-6 pb-8">

      {/* ══════════════════════════════ HERO BANNER ══════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700 shadow-2xl">
        {/* Animated blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 p-5 sm:p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              {user?.profileImage || user?.profilePicture ? (
                <img src={user.profileImage || user.profilePicture} alt={user.name}
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-white/30 shadow-2xl" />
              ) : (
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-2xl">
                  {initial}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-lg border-4 border-blue-600 shadow-lg" />
            </div>

            {/* Welcome text */}
            <div>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white mb-1 flex items-center gap-2">
                Welcome back, {user?.name?.split(" ")[0] || "User"}! 👋
              </h1>
              <p className="text-blue-100 text-sm md:text-base font-medium">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <div className="flex items-center flex-wrap gap-2 mt-2">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                  <Flame className="w-3.5 h-3.5 text-orange-300" />
                  <span className="text-white text-xs font-bold">0 day streak</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                  <Trophy className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-white text-xs font-bold">Rating: {stats?.rating ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA button */}
          <button
            onClick={() => router.push("/dashboard/problems")}
            className="group w-full md:w-auto px-6 py-3 bg-white text-violet-600 rounded-2xl font-bold shadow-2xl hover:shadow-white/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            Start Solving
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════ STATS GRID ══════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {[
          {
            icon: CheckCircle, label: "Problems Solved", value: totalSolved,
            color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20",
            gradient: "from-green-500 to-emerald-600"
          },
          {
            icon: Target, label: "Attempted", value: stats?.attempted ?? 0,
            color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20",
            gradient: "from-blue-500 to-cyan-600"
          },
          {
            icon: TrendingUp, label: "Acceptance Rate", value: `${stats?.acceptanceRate ?? 0}%`,
            color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20",
            gradient: "from-violet-500 to-purple-600"
          },
          {
            icon: Zap, label: "Current Rating", value: stats?.rating ?? 0,
            color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20",
            gradient: "from-orange-500 to-red-600"
          },
        ].map((card, i) => (
          <div key={i}
            className="group relative bg-white dark:bg-[#111] rounded-2xl p-4 sm:p-6 border-2 border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:scale-105 hover:shadow-xl cursor-pointer overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <div className="relative z-10">
              <div className={`inline-flex w-9 h-9 sm:w-12 sm:h-12 rounded-xl ${card.bg} border ${card.border} items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                <card.icon className={`w-4 h-4 sm:w-6 sm:h-6 ${card.color}`} />
              </div>
              <div className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white mb-1">{card.value}</div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════ MAIN CONTENT GRID ══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* ── LEFT COLUMN (2/3 width) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── PROGRESS BREAKDOWN ── */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Progress Breakdown</h2>
              </div>
              <button
                onClick={() => router.push("/dashboard/problems")}
                className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
              {[
                { label: "Easy", value: stats?.easySolved ?? 0, color: "text-green-500", bg: "bg-green-500/10", bar: "bg-green-500" },
                { label: "Medium", value: stats?.mediumSolved ?? 0, color: "text-orange-500", bg: "bg-orange-500/10", bar: "bg-orange-500" },
                { label: "Hard", value: stats?.hardSolved ?? 0, color: "text-red-500", bg: "bg-red-500/10", bar: "bg-red-500" },
              ].map((d) => (
                <div key={d.label} className={`rounded-xl p-3 sm:p-4 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 text-center`}>
                  <div className={`text-2xl sm:text-3xl font-black ${d.color}`}>{d.value}</div>
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">{d.label}</div>
                </div>
              ))}
            </div>

            {/* Overall progress bar */}
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                <span>Overall Progress</span>
                <span>{totalSolved} solved</span>
              </div>
              <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex">
                {(stats?.easySolved ?? 0) > 0 && (
                  <div className="bg-green-500 h-full" style={{ width: `${totalSolved > 0 ? (stats.easySolved / totalSolved) * 100 : 0}%` }} />
                )}
                {(stats?.mediumSolved ?? 0) > 0 && (
                  <div className="bg-orange-500 h-full" style={{ width: `${totalSolved > 0 ? (stats.mediumSolved / totalSolved) * 100 : 0}%` }} />
                )}
                {(stats?.hardSolved ?? 0) > 0 && (
                  <div className="bg-red-500 h-full" style={{ width: `${totalSolved > 0 ? (stats.hardSolved / totalSolved) * 100 : 0}%` }} />
                )}
              </div>
            </div>
          </div>

          {/* ── RECENT SUBMISSIONS ── */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 dark:bg-[#0d0d0d] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-500" />
                <h2 className="text-lg font-black text-gray-900 dark:text-white">Recent Submissions</h2>
              </div>
              <button
                onClick={() => router.push("/dashboard/submissions")}
                className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
                View All
              </button>
            </div>

            <div className="p-6">
              {submissions.length > 0 ? (
                <div className="space-y-3">
                  {submissions.map((sub) => {
                    const isAccepted = sub.verdict === "Accepted";
                    return (
                      <div key={sub._id}
                        className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isAccepted ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"
                        }`}>
                          {isAccepted ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <FileCode className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {sub.problemId?.title || "Unknown Problem"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                            <span className="capitalize">{sub.language}</span>
                            <span>•</span>
                            <span>{new Date(sub.submittedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </div>
                        <div className={`shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold border ${
                          isAccepted
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}>
                          {isAccepted ? "AC" : sub.verdict.split(" ")[0]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                    <Activity className="w-8 h-8 text-violet-500" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">No submissions yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Start solving problems to see your activity here</p>
                  <button
                    onClick={() => router.push("/dashboard/problems")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">
                    Browse Problems
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (1/3 width) ── */}
        <div className="space-y-6">

          {/* ── QUICK ACTIONS ── */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm p-5">
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                { label: "Browse Problems", href: "/dashboard/problems", icon: BookOpen, color: "blue" },
                { label: "Join Contest", href: "/dashboard/contests", icon: Trophy, color: "purple" },
                { label: "View Profile", href: "/dashboard/profile", icon: Users, color: "green" },
              ].map(({ label, href, icon: Icon, color }) => {
                const colors = {
                  blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-500", hover: "hover:bg-blue-500/20" },
                  purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-500", hover: "hover:bg-purple-500/20" },
                  green: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-500", hover: "hover:bg-green-500/20" },
                };
                const c = colors[color];
                return (
                  <button
                    key={label}
                    onClick={() => router.push(href)}
                    className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl ${c.bg} border ${c.border} ${c.hover} transition-all`}>
                    <div className={`w-9 h-9 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${c.text}`} />
                    </div>
                    <span className={`flex-1 text-left font-bold ${c.text}`}>{label}</span>
                    <ChevronRight className={`w-4 h-4 ${c.text} group-hover:translate-x-1 transition-transform`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── ACHIEVEMENT BADGES ── */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm p-5">
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Achievements
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Trophy, label: "First Solve", unlocked: totalSolved > 0, color: "text-amber-500" },
                { icon: Flame, label: "7-Day Streak", unlocked: false, color: "text-orange-500" },
                { icon: Star, label: "50 Solved", unlocked: totalSolved >= 50, color: "text-yellow-500" },
                { icon: Target, label: "100% Acceptance", unlocked: (stats?.acceptanceRate ?? 0) === 100, color: "text-blue-500" },
                { icon: Zap, label: "Hard Problem", unlocked: (stats?.hardSolved ?? 0) > 0, color: "text-purple-500" },
                { icon: Award, label: "Contest Winner", unlocked: false, color: "text-pink-500" },
              ].map((badge, i) => {
                const Icon = badge.icon;
                return (
                  <div key={i}
                    className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                      badge.unlocked
                        ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border-amber-500/30 shadow-lg"
                        : "bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-800 opacity-40"
                    }`}>
                    <Icon className={`w-6 h-6 mb-1 ${badge.unlocked ? badge.color : "text-gray-400"}`} />
                    <div className={`text-[10px] font-bold text-center px-1 leading-tight ${
                      badge.unlocked ? "text-gray-700 dark:text-gray-300" : "text-gray-400"
                    }`}>
                      {badge.label}
                    </div>
                    {badge.unlocked && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-[#111] flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── TODAY'S CHALLENGE (Placeholder) ── */}
          <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-500/5 dark:to-violet-500/5 p-6 text-center">
            <Star className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Daily Challenge</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Complete today's challenge to earn bonus points!
            </p>
            <button
              onClick={() => router.push("/dashboard/problems")}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
              View Challenge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
