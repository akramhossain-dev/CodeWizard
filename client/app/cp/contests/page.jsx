'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { contestsAPI, problemsAPI } from '@/lib/api';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';

const PAGE_SIZE = 20;
const PROBLEM_PAGE_SIZE = 25;

export default function ContestsAdminPage() {
  const [contests, setContests] = useState([]);
  const [problems, setProblems] = useState([]);
  const [problemCatalog, setProblemCatalog] = useState({});
  const [problemSearchInput, setProblemSearchInput] = useState('');
  const [problemSearch, setProblemSearch] = useState('');
  const [problemPage, setProblemPage] = useState(1);
  const [problemLoading, setProblemLoading] = useState(false);
  const [problemPagination, setProblemPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: PROBLEM_PAGE_SIZE,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    isPublished: false,
    selectedProblems: [],
  });

  const fetchProblemLibrary = useCallback(async () => {
    setProblemLoading(true);
    try {
      const problemRes = await problemsAPI.getAllAdmin({
        page: String(problemPage),
        limit: String(PROBLEM_PAGE_SIZE),
        search: problemSearch,
        sortBy: 'problemNumber',
        order: 'asc',
      });
      const fetchedProblems = problemRes.problems || [];
      setProblems(fetchedProblems);
      setProblemPagination({
        page: Number(problemRes.pagination?.page) || problemPage,
        pages: Math.max(Number(problemRes.pagination?.pages) || 1, 1),
        total: Number(problemRes.pagination?.total) || 0,
        limit: Number(problemRes.pagination?.limit) || PROBLEM_PAGE_SIZE,
      });
      setProblemCatalog((prev) => {
        const next = { ...prev };
        for (const item of fetchedProblems) {
          next[item._id] = item;
        }
        return next;
      });
    } catch (err) {
      setError(err.message || 'Failed to load contest data');
    } finally {
      setProblemLoading(false);
    }
  }, [problemPage, problemSearch]);

  const fetchContests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const contestRes = await contestsAPI.getAllAdmin({
        page: String(page),
        limit: String(PAGE_SIZE),
        status: statusFilter,
      });

      const nextPagination = {
        page: Number(contestRes.pagination?.page) || page,
        pages: Math.max(Number(contestRes.pagination?.pages) || 1, 1),
        total: Number(contestRes.pagination?.total) || 0,
        limit: Number(contestRes.pagination?.limit) || PAGE_SIZE,
      };
      if (nextPagination.pages > 0 && page > nextPagination.pages) {
        setPage(nextPagination.pages);
        return;
      }

      setContests(contestRes.contests || []);
      setPagination(nextPagination);
    } catch (err) {
      setError(err.message || 'Failed to load contest data');
      setContests([]);
      setPagination({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProblemSearch(problemSearchInput.trim());
      setProblemPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [problemSearchInput]);

  useEffect(() => {
    if (creating) {
      fetchProblemLibrary();
    }
  }, [fetchProblemLibrary, creating]);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  const stats = useMemo(() => {
    const out = { total: contests.length, running: 0, upcoming: 0, past: 0 };
    for (const item of contests) {
      if (item.status === 'running') out.running += 1;
      else if (item.status === 'upcoming') out.upcoming += 1;
      else out.past += 1;
    }
    return out;
  }, [contests]);

  const resetForm = () =>
    setForm({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      isPublished: false,
      selectedProblems: [],
    });

  const handleAddProblem = (problemRef) => {
    const problemId = typeof problemRef === 'string' ? problemRef : problemRef?._id;
    if (!problemId) return;
    if (problemRef && typeof problemRef === 'object') {
      setProblemCatalog((prev) => ({ ...prev, [problemId]: problemRef }));
    }
    setForm((prev) => {
      if (prev.selectedProblems.some((p) => p.problemId === problemId)) return prev;
      return {
        ...prev,
        selectedProblems: [
          ...prev.selectedProblems,
          { problemId, points: 100, order: prev.selectedProblems.length },
        ],
      };
    });
  };

  const handleUpdateProblemMeta = (problemId, field, value) => {
    setForm((prev) => ({
      ...prev,
      selectedProblems: prev.selectedProblems.map((item) =>
        item.problemId === problemId
          ? { ...item, [field]: field === 'points' || field === 'order' ? Number(value) : value }
          : item
      ),
    }));
  };

  const handleRemoveProblem = (problemId) => {
    setForm((prev) => ({
      ...prev,
      selectedProblems: prev.selectedProblems.filter((item) => item.problemId !== problemId),
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (!form.title || !form.startTime || !form.endTime) {
        throw new Error('Title, start time and end time are required');
      }
      if (form.selectedProblems.length === 0) {
        throw new Error('Select at least one problem');
      }
      await contestsAPI.create({
        title: form.title,
        description: form.description,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        isPublished: form.isPublished,
        problems: form.selectedProblems.map((item, index) => ({
          problemId: item.problemId,
          points: Number(item.points) || 100,
          order: Number(item.order) || index,
        })),
      });
      resetForm();
      setCreating(false);
      if (page !== 1) setPage(1);
      else fetchContests();
    } catch (err) {
      setError(err.message || 'Failed to create contest');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (contest, field) => {
    try {
      await contestsAPI.updateStatus(contest._id, { [field]: !contest[field] });
      fetchContests();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (contestId) => {
    const ok = window.confirm('Delete this contest?');
    if (!ok) return;
    try {
      await contestsAPI.delete(contestId);
      fetchContests();
    } catch (err) {
      setError(err.message || 'Failed to delete contest');
    }
  };

  const handlePageChange = (nextPage) => {
    if (nextPage >= 1 && nextPage <= Math.max(pagination.pages, 1) && nextPage !== page) {
      setPage(nextPage);
    }
  };

  const handleProblemPageChange = (nextPage) => {
    if (
      nextPage >= 1 &&
      nextPage <= Math.max(problemPagination.pages, 1) &&
      nextPage !== problemPage
    ) {
      setProblemPage(nextPage);
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
      if (previous && pageNum - previous > 1) withEllipsis.push('...');
      withEllipsis.push(pageNum);
      previous = pageNum;
    }
    return withEllipsis;
  };

  const selectedProblemIds = new Set(form.selectedProblems.map((p) => p.problemId));
  const availableProblems = problems.filter((problem) => !selectedProblemIds.has(problem._id));
  const problemRangeStart = problemPagination.total === 0
    ? 0
    : (problemPagination.page - 1) * problemPagination.limit + 1;
  const problemRangeEnd = Math.min(
    problemPagination.total,
    problemPagination.page * problemPagination.limit
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-[#1E1E1E] via-[#252525] to-[#1E1E1E] border border-gray-800/50 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFC107] to-[#FF9800] flex items-center justify-center shadow-lg shadow-[#FFC107]/20">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Contests</h1>
                <p className="text-gray-400">Create and manage coding contests</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="px-3 py-1.5 bg-[#252525] border border-gray-800 rounded-lg text-gray-400">
                Total: <span className="text-white font-semibold">{pagination.total || stats.total}</span>
              </span>
              <span className="px-3 py-1.5 bg-[#252525] border border-gray-800 rounded-lg text-gray-400">
                Running: <span className="text-green-400 font-semibold">{stats.running}</span>
              </span>
              <span className="px-3 py-1.5 bg-[#252525] border border-gray-800 rounded-lg text-gray-400">
                Upcoming: <span className="text-blue-400 font-semibold">{stats.upcoming}</span>
              </span>
              <span className="px-3 py-1.5 bg-[#252525] border border-gray-800 rounded-lg text-gray-400">
                Past: <span className="text-gray-300 font-semibold">{stats.past}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchContests}
              className="px-4 py-2 rounded-lg bg-[#252525] border border-gray-800 text-gray-300 hover:bg-[#2d2d2d] inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setCreating((v) => !v)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] text-white inline-flex items-center gap-2"
            >
              {creating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {creating ? 'Close' : 'Create Contest'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'running', 'upcoming', 'past'].map((item) => (
          <button
            key={item}
            onClick={() => {
              setStatusFilter(item);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
              statusFilter === item
                ? 'bg-[#4CAF50]/15 text-[#4CAF50] border-[#4CAF50]/30'
                : 'bg-[#1E1E1E] text-gray-400 border-gray-800 hover:bg-[#252525]'
            }`}
          >
            {item === 'all' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-gray-800 bg-[#1E1E1E] p-5 space-y-4"
        >
          <h2 className="text-xl font-bold text-white">Create Contest</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Contest title"
              className="px-3 py-2.5 rounded-lg bg-[#252525] border border-gray-800 text-white"
              required
            />
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#252525] border border-gray-800 text-gray-300">
              <input
                id="isPublished"
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
              />
              <label htmlFor="isPublished">Publish immediately</label>
            </div>
          </div>

          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Contest description"
            className="w-full px-3 py-2.5 rounded-lg bg-[#252525] border border-gray-800 text-white min-h-[90px]"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Start Time</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg bg-[#252525] border border-gray-800 text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">End Time</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg bg-[#252525] border border-gray-800 text-white"
                required
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-[#171717] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Select Problems</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={problemSearchInput}
                  onChange={(e) => setProblemSearchInput(e.target.value)}
                  placeholder="Search problems by title or description..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#252525] border border-gray-800 text-white"
                />
              </div>
              <button
                type="button"
                onClick={fetchProblemLibrary}
                className="px-3 py-2 rounded-lg bg-[#252525] border border-gray-800 text-gray-300 hover:bg-[#2d2d2d] inline-flex items-center justify-center"
                title="Refresh problems"
              >
                <RefreshCw className={`w-4 h-4 ${problemLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="rounded-lg border border-gray-800 bg-[#1E1E1E] max-h-56 overflow-y-auto divide-y divide-gray-800">
              {problemLoading ? (
                <div className="px-3 py-4 text-sm text-gray-400">Loading problems...</div>
              ) : availableProblems.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-400">
                  {problemPagination.total === 0 ? 'No problems found.' : 'All visible problems are already selected.'}
                </div>
              ) : (
                availableProblems.map((problem) => (
                  <div key={problem._id} className="px-3 py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm text-white truncate">{problem.title}</div>
                      <div className="text-xs text-gray-400">
                        #{problem.problemNumber || 'N/A'} • {problem.difficulty || 'Unknown'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddProblem(problem)}
                      className="px-3 py-1.5 rounded-lg bg-green-500/15 text-green-300 border border-green-500/30 text-xs font-medium hover:bg-green-500/25 shrink-0"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>

            {problemPagination.total > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-400">
                <span>
                  Showing {problemRangeStart}-{problemRangeEnd} of {problemPagination.total} problems
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleProblemPageChange(problemPage - 1)}
                    disabled={problemPage <= 1 || problemLoading}
                    className="px-2.5 py-1.5 rounded border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#252525]"
                  >
                    Prev
                  </button>
                  <span>
                    {problemPagination.page}/{Math.max(problemPagination.pages, 1)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleProblemPageChange(problemPage + 1)}
                    disabled={problemPage >= problemPagination.pages || problemLoading}
                    className="px-2.5 py-1.5 rounded border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#252525]"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {form.selectedProblems.length === 0 ? (
              <p className="text-sm text-gray-400">No problems selected yet.</p>
            ) : (
              <div className="space-y-2">
                {form.selectedProblems.map((item, index) => {
                  const linked = problemCatalog[item.problemId] || problems.find((p) => p._id === item.problemId);
                  return (
                    <div
                      key={item.problemId}
                      className="grid grid-cols-1 md:grid-cols-[1fr_100px_100px_40px] gap-2 items-center rounded-lg bg-[#252525] border border-gray-800 px-3 py-2"
                    >
                      <div className="text-sm text-white truncate">
                        {index + 1}. {linked?.title || item.problemId}
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={item.points}
                        onChange={(e) =>
                          handleUpdateProblemMeta(item.problemId, 'points', e.target.value)
                        }
                        className="px-2 py-1.5 rounded bg-[#1E1E1E] border border-gray-700 text-white text-sm"
                      />
                      <input
                        type="number"
                        min="0"
                        value={item.order}
                        onChange={(e) =>
                          handleUpdateProblemMeta(item.problemId, 'order', e.target.value)
                        }
                        className="px-2 py-1.5 rounded bg-[#1E1E1E] border border-gray-700 text-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveProblem(item.problemId)}
                        className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] text-white font-medium disabled:opacity-60"
          >
            {submitting ? 'Creating...' : 'Create Contest'}
          </button>
        </form>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-800 bg-[#1E1E1E] overflow-hidden">
        {loading ? (
          <div className="py-14 text-center text-gray-400">Loading contests...</div>
        ) : contests.length === 0 ? (
          <div className="py-14 text-center text-gray-400">No contests found.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {contests.map((contest) => (
              <div key={contest._id} className="px-5 py-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-white">{contest.title}</h3>
                      <span className="text-xs px-2 py-1 rounded bg-[#252525] border border-gray-700 text-gray-300">
                        {contest.status}
                      </span>
                      {!contest.isPublished && (
                        <span className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {new Date(contest.startTime).toLocaleString()}
                      </span>
                      <span>→</span>
                      <span>{new Date(contest.endTime).toLocaleString()}</span>
                      <span>{contest.problems?.length || 0} problems</span>
                      <span>{contest.participants || 0} participants</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(contest, 'isPublished')}
                      className={`px-3 py-2 rounded-lg text-sm inline-flex items-center gap-1.5 ${
                        contest.isPublished
                          ? 'bg-green-500/10 text-green-300 border border-green-500/30'
                          : 'bg-gray-700/50 text-gray-300 border border-gray-600'
                      }`}
                    >
                      {contest.isPublished ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : (
                        <ShieldX className="w-4 h-4" />
                      )}
                      {contest.isPublished ? 'Published' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleToggleStatus(contest, 'isActive')}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        contest.isActive
                          ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                          : 'bg-gray-700/50 text-gray-300 border border-gray-600'
                      }`}
                    >
                      {contest.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleDelete(contest._id)}
                      className="px-3 py-2 rounded-lg text-sm bg-red-500/10 text-red-300 border border-red-500/30 inline-flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && pagination.total > 0 && (
        <div className="bg-[#1E1E1E] rounded-xl border border-gray-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-400">
            Showing{' '}
            <span className="text-white font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span>{' '}
            to{' '}
            <span className="text-white font-semibold">{Math.min(pagination.total, pagination.page * pagination.limit)}</span>{' '}
            of <span className="text-white font-semibold">{pagination.total}</span> contests
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || loading}
                className="px-3 py-2 rounded-lg border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#252525] transition-all inline-flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              {getVisiblePages().map((pageNum, idx) =>
                pageNum === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-10 h-10 rounded-lg border text-sm font-semibold transition-all ${
                      page === pageNum
                        ? 'bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] border-[#4CAF50] text-white'
                        : 'border-gray-700 text-gray-300 hover:bg-[#252525]'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              )}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.pages || loading}
                className="px-3 py-2 rounded-lg border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#252525] transition-all inline-flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
