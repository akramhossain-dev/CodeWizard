"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { dashboardProblemsAPI } from "@/lib/api";
import {
  Search, Filter, CheckCircle, Circle, ChevronRight, ChevronLeft,
  Code, Tag, TrendingUp, Zap, Target, BarChart2,
  X, SlidersHorizontal, BookOpen, Lock, Shuffle
} from "lucide-react";

// ── Difficulty config ────────────────────────────────────────────────────────
const DIFF = {
  easy:   { label: "Easy",   text: "text-green-500",  bg: "bg-green-500/10",  border: "border-green-500/20",  active: "bg-green-500 text-white border-green-500" },
  medium: { label: "Medium", text: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", active: "bg-orange-500 text-white border-orange-500" },
  hard:   { label: "Hard",   text: "text-red-500",    bg: "bg-red-500/10",    border: "border-red-500/20",    active: "bg-red-500 text-white border-red-500" },
};
const PAGE_SIZE = 20;

function DiffBadge({ difficulty }) {
  const d = DIFF[difficulty?.toLowerCase()] || {
    label: difficulty, text: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${d.bg} ${d.text} ${d.border}`}>
      {d.label}
    </span>
  );
}

export default function ProblemsPage() {
  const router = useRouter();
  const [problems,  setProblems]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [mounted,   setMounted]   = useState(false);
  const [search,    setSearch]    = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
  const [overview, setOverview] = useState({ solved: 0, easy: 0, medium: 0, hard: 0 });
  const [randomLoading, setRandomLoading] = useState(false);
  const [inputVal,  setInputVal]  = useState("");
  const debounceRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  const fetchTags = useCallback(async () => {
    try {
      const data = await dashboardProblemsAPI.getTags();
      if (data.success) setTags(data.tags ?? []);
      else setTags([]);
    } catch (err) {
      console.error("Failed to fetch tags:", err);
      setTags([]);
    }
  }, []);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (difficulty && difficulty !== "all") {
        params.set("difficulty", DIFF[difficulty].label);
      }
      if (search) {
        params.set("search", search);
      }

      const data =
        selectedTag !== "all"
          ? await dashboardProblemsAPI.getByTag(selectedTag, Object.fromEntries(params.entries()))
          : await dashboardProblemsAPI.getAll(Object.fromEntries(params.entries()));
      if (!data.success) {
        setProblems([]);
        setPagination({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
        return;
      }

      const nextProblems = (data.problems ?? []).map((problem) => ({
        ...problem,
        acceptanceRate: Number((problem.acceptanceRate ?? 0).toFixed(2)),
        solved: Boolean(problem.solved),
      }));

      const nextPagination = {
        page: Number(data.pagination?.page) || page,
        pages: Math.max(Number(data.pagination?.pages) || 1, 1),
        total: Number(data.pagination?.total) || nextProblems.length,
        limit: Number(data.pagination?.limit) || PAGE_SIZE,
      };

      if (nextPagination.pages > 0 && page > nextPagination.pages) {
        setPage(nextPagination.pages);
        return;
      }

      setProblems(nextProblems);
      setPagination(nextPagination);
    } catch (err) {
      console.error("Failed to fetch problems:", err);
      setProblems([]);
      setPagination({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
    } finally {
      setLoading(false);
    }
  }, [difficulty, search, selectedTag, page]);

  const fetchOverviewStats = useCallback(async () => {
    try {
      const [statsData, meData] = await Promise.all([
        dashboardProblemsAPI.getStats(),
        dashboardProblemsAPI.getMe(),
      ]);

      let easy = 0;
      let medium = 0;
      let hard = 0;
      let solved = 0;

      if (statsData?.success && statsData?.stats) {
        easy = Number(statsData.stats.easy || 0);
        medium = Number(statsData.stats.medium || 0);
        hard = Number(statsData.stats.hard || 0);
      }

      if (meData?.success && meData?.user?.stats) {
        solved = Number(meData.user.stats.solved || 0);
      }

      setOverview({ solved, easy, medium, hard });
    } catch (err) {
      console.error("Failed to fetch overview stats:", err);
      setOverview({ solved: 0, easy: 0, medium: 0, hard: 0 });
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchTags();
  }, [mounted, fetchTags]);

  useEffect(() => {
    if (!mounted) return;
    fetchProblems();
  }, [mounted, fetchProblems]);

  useEffect(() => {
    if (!mounted) return;
    fetchOverviewStats();
  }, [mounted, fetchOverviewStats]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // Debounce search input
  const handleSearch = (val) => {
    setInputVal(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 350);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage >= 1 && nextPage <= Math.max(pagination.pages, 1) && nextPage !== page) {
      setPage(nextPage);
    }
  };

  const getVisiblePages = () => {
    const totalPages = Math.max(pagination.pages, 1);
    const delta = 1;
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        pages.push(i);
      }
    }
    const withEllipsis = [];
    let previous = 0;
    for (const pageNum of pages) {
      if (previous && pageNum - previous > 1) withEllipsis.push("...");
      withEllipsis.push(pageNum);
      previous = pageNum;
    }
    return withEllipsis;
  };

  const handleRandomProblem = async () => {
    setRandomLoading(true);
    try {
      const params = {};
      if (difficulty && difficulty !== "all") params.difficulty = DIFF[difficulty].label;
      const data = await dashboardProblemsAPI.getRandom(params);
      if (data.success && data.problem) {
        router.push(`/dashboard/problems/${data.problem.slug || data.problem._id}`);
      }
    } catch (err) {
      console.error("Failed to fetch random problem:", err);
    } finally {
      setRandomLoading(false);
    }
  };

  if (!mounted) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 pb-8">

      {/* ── HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm">
        {/* bg glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            {/* Title */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white">Problems</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {loading ? "Loading…" : `${pagination.total} problems available`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={handleRandomProblem}
                disabled={randomLoading}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all disabled:opacity-60"
              >
                <Shuffle className={`w-4 h-4 ${randomLoading ? "animate-spin" : ""}`} />
                {randomLoading ? "Picking..." : "Random"}
              </button>

              {/* Mini stats */}
              {[
                { icon: CheckCircle, label: "Solved",  value: overview.solved ?? 0, color: "text-green-500",  bg: "bg-green-500/10"  },
                { icon: Zap,         label: "Easy",    value: overview.easy ?? 0,   color: "text-green-500",  bg: "bg-green-500/10"  },
                { icon: Target,      label: "Medium",  value: overview.medium ?? 0, color: "text-orange-500", bg: "bg-orange-500/10" },
                { icon: BarChart2,   label: "Hard",    value: overview.hard ?? 0,   color: "text-red-500",    bg: "bg-red-500/10"    },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800">
                  <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-900 dark:text-white leading-none">{value}</div>
                    <div className="text-xs text-gray-400 leading-none mt-0.5">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Search + Filters ── */}
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search problems by title or tag…"
                value={inputVal}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              {inputVal && (
                <button
                  onClick={() => {
                    clearTimeout(debounceRef.current);
                    setInputVal("");
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Difficulty filter pills */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 rounded-xl px-2 py-1.5 overflow-x-auto scrollbar-none">
              <SlidersHorizontal className="w-4 h-4 text-gray-400 ml-1 shrink-0" />
              {["all", "easy", "medium", "hard"].map((d) => {
                const active = difficulty === d;
                const cfg = DIFF[d];
                return (
                  <button
                    key={d}
                    onClick={() => { setDifficulty(d); setPage(1); }}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      active
                        ? d === "all"
                          ? "bg-blue-600 text-white border-blue-600 shadow"
                          : `${cfg.active} shadow`
                        : `text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-200 dark:hover:bg-[#252525]`
                    }`}
                  >
                    {d === "all" ? "All" : cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tag filter pills */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => { setSelectedTag("all"); setPage(1); }}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                selectedTag === "all"
                  ? "bg-blue-600 text-white border-blue-600 shadow"
                  : "bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-[#252525]"
              }`}
            >
              All Tags
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => { setSelectedTag(tag); setPage(1); }}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  selectedTag === tag
                    ? "bg-blue-600 text-white border-blue-600 shadow"
                    : "bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-[#252525]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROBLEMS TABLE ── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm overflow-hidden">

        {/* Table header */}
        <div className="hidden md:grid grid-cols-[2.5rem_2rem_1fr_7rem_5.5rem_5rem_2rem] gap-4 px-6 py-3 bg-gray-50 dark:bg-[#0d0d0d] border-b border-gray-200 dark:border-gray-800">
          {["#", "", "Title / Tags", "Difficulty", "Acceptance", "Solved", ""].map((h, i) => (
            <div key={i} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400 font-medium">Loading problems…</span>
          </div>

        ) : problems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">No problems found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Try a different search term or remove the difficulty filter.
            </p>
            <button
              onClick={() => {
                clearTimeout(debounceRef.current);
                setSearch("");
                setInputVal("");
                setDifficulty("all");
                setSelectedTag("all");
                setPage(1);
              }}
              className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all"
            >
              Clear Filters
            </button>
          </div>

        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {(() => {
              const startIndex = (pagination.page - 1) * pagination.limit;
              return problems.map((problem, idx) => (
                <ProblemRow
                  key={problem._id}
                  problem={problem}
                  idx={startIndex + idx}
                  onClick={() => router.push(`/dashboard/problems/${problem.slug || problem._id}`)}
                />
              ));
            })()}
          </div>
        )}
      </div>

      {/* Footer count */}
      {!loading && pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-400">
            Showing{" "}
            <span className="font-bold text-gray-600 dark:text-gray-300">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold text-gray-600 dark:text-gray-300">
              {Math.min(pagination.total, pagination.page * pagination.limit)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-gray-600 dark:text-gray-300">{pagination.total}</span> problems
            {difficulty !== "all" && <> for <span className="font-bold">{difficulty}</span></>}
            {selectedTag !== "all" && <> in <span className="font-bold">{selectedTag}</span></>}
            {search && <> matching &quot;<span className="font-bold">{search}</span>&quot;</>}
          </p>

          {pagination.pages > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || loading}
                className="shrink-0 px-2 sm:px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all inline-flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {getVisiblePages().map((pageNum, idx) =>
                pageNum === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-10 h-10 rounded-lg border text-sm font-bold transition-all ${
                      page === pageNum
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              )}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.pages || loading}
                className="shrink-0 px-2 sm:px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all inline-flex items-center gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Problem row ──────────────────────────────────────────────────────────────
function ProblemRow({ problem, idx, onClick }) {
  const solved = problem.solved;

  return (
    <div
      onClick={onClick}
      className="group grid grid-cols-[2rem_1.5rem_1fr] md:grid-cols-[2.5rem_2rem_1fr_7rem_5.5rem_5rem_2rem] gap-3 md:gap-4 items-center px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer"
    >
      {/* Index */}
      <div className="text-xs sm:text-sm font-bold text-gray-400 dark:text-gray-600">{idx + 1}</div>

      {/* Solved status */}
      <div className="flex items-center justify-center">
        {solved ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300 dark:text-gray-700 group-hover:text-gray-400 transition-colors" />
        )}
      </div>

      {/* Title + Tags */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
            {problem.title}
          </span>
          {problem.isPremium && (
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-lg border border-amber-500/20">
              <Lock className="w-2.5 h-2.5" /> PRO
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* Difficulty shown on mobile, hidden on md+ (shown in its own column) */}
          <span className="md:hidden">
            <DiffBadge difficulty={problem.difficulty} />
          </span>
          {problem.tags?.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {problem.tags.slice(0, 3).map((tag) => (
                <span key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-800">
                  <Tag className="w-2.5 h-2.5" />{tag}
                </span>
              ))}
              {problem.tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-gray-400 bg-gray-100 dark:bg-[#252525] rounded-lg border border-gray-200 dark:border-gray-800">
                  +{problem.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Difficulty — hidden on mobile */}
      <div className="hidden md:block">
        <DiffBadge difficulty={problem.difficulty} />
      </div>

      {/* Acceptance — hidden on mobile */}
      <div className="hidden md:flex items-center gap-1.5">
        <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
          {problem.acceptanceRate != null ? `${problem.acceptanceRate}%` : "—"}
        </span>
      </div>

      {/* Solved count — hidden on mobile */}
      <div className="hidden md:flex items-center gap-1.5">
        <BookOpen className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
          {problem.totalSubmissions != null ? problem.totalSubmissions.toLocaleString() : "—"}
        </span>
      </div>

      {/* Arrow */}
      <div className="hidden md:flex justify-end">
        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-700 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}
