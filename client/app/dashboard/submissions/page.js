"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  RefreshCw,
  Search,
} from "lucide-react";

const VERDICT_STYLES = {
  Accepted: "bg-green-500/10 text-green-500 border-green-500/20",
  "Wrong Answer": "bg-red-500/10 text-red-500 border-red-500/20",
  "Time Limit Exceeded": "bg-orange-500/10 text-orange-500 border-orange-500/20",
  "Memory Limit Exceeded": "bg-orange-500/10 text-orange-500 border-orange-500/20",
  "Runtime Error": "bg-red-500/10 text-red-500 border-red-500/20",
  "Compilation Error": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  Pending: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Running: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  "Internal Error": "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const LIMIT = 20;

export default function MySubmissionsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [page, setPage] = useState(1);
  const [verdict, setVerdict] = useState("");
  const [language, setLanguage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [error, setError] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (verdict) params.set("verdict", verdict);
      if (language) params.set("language", language);

      const res = await fetch(`${API_URL}/api/submissions/my-submissions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmissions([]);
        setError(data.message || "Failed to load submissions.");
        return;
      }

      setSubmissions(data.submissions || []);
      setPagination({
        page: data.pagination?.page || page,
        pages: data.pagination?.pages || 1,
        total: data.pagination?.total || 0,
        limit: data.pagination?.limit || LIMIT,
      });
    } catch {
      setSubmissions([]);
      setError("Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  }, [API_URL, language, page, verdict]);

  useEffect(() => {
    if (!mounted) return;
    fetchSubmissions();
  }, [mounted, fetchSubmissions]);

  const filteredSubmissions = submissions.filter((sub) => {
    if (!searchInput.trim()) return true;
    return (sub.problemId?.title || "").toLowerCase().includes(searchInput.trim().toLowerCase());
  });

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">My Submissions</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{pagination.total} total submissions</p>
            </div>
          </div>

          <button
            onClick={fetchSubmissions}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#252525] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="mt-4 sm:mt-5 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by problem title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={verdict}
              onChange={(e) => {
                setPage(1);
                setVerdict(e.target.value);
              }}
              className="px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Verdicts</option>
              <option value="Accepted">Accepted</option>
              <option value="Wrong Answer">Wrong Answer</option>
              <option value="Time Limit Exceeded">Time Limit Exceeded</option>
              <option value="Runtime Error">Runtime Error</option>
              <option value="Compilation Error">Compilation Error</option>
              <option value="Pending">Pending</option>
              <option value="Running">Running</option>
            </select>

            <select
              value={language}
              onChange={(e) => {
                setPage(1);
                setLanguage(e.target.value);
              }}
              className="px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Languages</option>
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="c">C</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 bg-gray-50 dark:bg-[#0d0d0d] border-b border-gray-200 dark:border-gray-800">
          {["Problem", "Verdict", "Language", "Runtime", "Passed", "Submitted"].map((h) => (
            <div key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {h}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="px-6 py-14 text-center">
            <p className="text-red-500 font-semibold">{error}</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Filter className="w-7 h-7 text-blue-500" />
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">No submissions found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Try changing filters or submit a solution.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {filteredSubmissions.map((sub) => {
              const verdictClass = VERDICT_STYLES[sub.verdict] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
              const problemLink = sub.problemId?.slug ? `/dashboard/problems/${sub.problemId.slug}` : "/dashboard/problems";
              return (
                <div
                  key={sub._id}
                  onClick={() => router.push(problemLink)}
                  className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                >
                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white truncate">{sub.problemId?.title || "Unknown Problem"}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub.problemId?.difficulty || "N/A"}</p>
                    </div>
                    <div>
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${verdictClass}`}>
                        {sub.verdict}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 capitalize">{sub.language}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {sub.runtime ?? 0}ms
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {sub.passedTestCases ?? 0}/{sub.totalTestCases ?? 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(sub.submittedAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {/* Mobile card */}
                  <div className="md:hidden flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-gray-900 dark:text-white truncate">{sub.problemId?.title || "Unknown Problem"}</p>
                        <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-lg text-xs font-bold border ${verdictClass}`}>
                          {sub.verdict === "Accepted" ? "AC"
                            : sub.verdict === "Wrong Answer" ? "WA"
                            : sub.verdict === "Time Limit Exceeded" ? "TLE"
                            : sub.verdict === "Memory Limit Exceeded" ? "MLE"
                            : sub.verdict === "Runtime Error" ? "RE"
                            : sub.verdict === "Compilation Error" ? "CE"
                            : sub.verdict}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                        <span className="capitalize">{sub.language}</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />{sub.runtime ?? 0}ms
                        </span>
                        <span>{sub.passedTestCases ?? 0}/{sub.totalTestCases ?? 0} tests</span>
                        <span>
                          {new Date(sub.submittedAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] px-4 py-3">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Page {pagination.page} of {Math.max(pagination.pages, 1)}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pagination.page <= 1 || loading}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>
          <button
            onClick={() => setPage((p) => Math.min(Math.max(pagination.pages, 1), p + 1))}
            disabled={pagination.page >= pagination.pages || loading}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
