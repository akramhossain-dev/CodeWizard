'use client';

import { useCallback, useEffect, useState } from 'react';
import { problemsAPI } from '@/lib/api';
import DataTable from '@/components/admin/DataTable';
import CreateProblemModal from '@/components/admin/CreateProblemModal';
import EditProblemModal from '@/components/admin/EditProblemModal';
import DeleteProblemModal from '@/components/admin/DeleteProblemModal';
import { 
  Plus, 
  Code, 
  FileText, 
  TrendingUp, 
  Pencil, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const PAGE_SIZE = 20;

export default function ProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [stats, setStats] = useState({ total: 0, easy: 0, medium: 0, hard: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, problem: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, problem: null });

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      let params = {
        page,
        limit: PAGE_SIZE,
        sortBy: 'problemNumber',
        order: 'asc'
      };
      if (filter !== 'all') {
        // Capitalize first letter for backend
        params.difficulty = filter.charAt(0).toUpperCase() + filter.slice(1);
      }
      const data = await problemsAPI.getAllAdmin(params);
      const nextPagination = {
        page: Number(data.pagination?.page) || page,
        pages: Number(data.pagination?.pages) || 1,
        total: Number(data.pagination?.total) || 0,
        limit: Number(data.pagination?.limit) || PAGE_SIZE
      };

      if (nextPagination.pages > 0 && page > nextPagination.pages) {
        setPage(nextPagination.pages);
        return;
      }

      setProblems(data.problems || []);
      setPagination(nextPagination);
    } catch (error) {
      console.error('Failed to fetch problems:', error);
      setProblems([]);
      setPagination({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await problemsAPI.getStats();
      setStats(data.stats || { total: 0, easy: 0, medium: 0, hard: 0 });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleCreateProblem = async (formData) => {
    await problemsAPI.create(formData);
    if (page !== 1) {
      setPage(1);
    } else {
      fetchProblems();
    }
    fetchStats();
  };

  const handleUpdateProblem = async (formData) => {
    await problemsAPI.update(formData._id, formData);
    fetchProblems();
  };

  const handleDeleteProblem = async () => {
    await problemsAPI.delete(deleteModal.problem._id);
    fetchProblems();
    fetchStats();
  };

  const handleToggleStatus = async (problem, field) => {
    try {
      await problemsAPI.updateStatus(problem._id, {
        [field]: !problem[field]
      });
      fetchProblems();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= Math.max(pagination.pages, 1) && newPage !== page) {
      setPage(newPage);
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
      if (previous && pageNum - previous > 1) {
        withEllipsis.push('...');
      }
      withEllipsis.push(pageNum);
      previous = pageNum;
    }

    return withEllipsis;
  };

  const columns = [
    {
      header: 'Problem',
      accessor: 'title',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] flex items-center justify-center text-white font-semibold shadow-lg">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium text-white">{row.title}</div>
            <div className="text-sm text-gray-400 font-mono">{row.slug}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Difficulty',
      accessor: 'difficulty',
      render: (row) => {
        const colors = {
          easy: { bg: 'bg-[#4CAF50]/10', text: 'text-[#4CAF50]', border: 'border-[#4CAF50]/20' },
          medium: { bg: 'bg-[#FFC107]/10', text: 'text-[#FFC107]', border: 'border-[#FFC107]/20' },
          hard: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' },
        };
        const style = colors[row.difficulty] || colors.easy;
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border} capitalize`}>
            <div className="w-2 h-2 rounded-full bg-current"></div>
            {row.difficulty}
          </span>
        );
      },
    },
    {
      header: 'Tags',
      accessor: 'tags',
      render: (row) => (
        <div className="flex gap-1 flex-wrap max-w-xs">
          {row.tags?.slice(0, 2).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-[#1E88E5]/10 text-[#1E88E5] text-xs rounded-lg border border-[#1E88E5]/20 font-medium"
            >
              {tag}
            </span>
          ))}
          {row.tags?.length > 2 && (
            <span className="px-2 py-1 bg-[#252525] text-gray-400 text-xs rounded-lg border border-gray-800 font-medium">
              +{row.tags.length - 2} more
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Submissions',
      accessor: 'submissionCount',
      render: (row) => (
        <div className="text-center">
          <div className="text-xl font-bold text-white">{row.submissionCount || 0}</div>
          <div className="text-xs text-gray-500">Attempts</div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'isPublished',
      render: (row) => (
        <div className="flex flex-col gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(row, 'isPublished');
            }}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              row.isPublished
                ? 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20 hover:bg-[#4CAF50]/20 hover:shadow-md hover:shadow-[#4CAF50]/10'
                : 'bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20'
            }`}
            title={row.isPublished ? 'Published - Click to unpublish' : 'Draft - Click to publish'}
          >
            {row.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {row.isPublished ? 'Published' : 'Draft'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(row, 'isPremium');
            }}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              row.isPremium
                ? 'bg-[#FFC107]/10 text-[#FFC107] border-[#FFC107]/20 hover:bg-[#FFC107]/20 hover:shadow-md hover:shadow-[#FFC107]/10'
                : 'bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20'
            }`}
            title={row.isPremium ? 'Premium - Click to make free' : 'Free - Click to make premium'}
          >
            {row.isPremium ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            {row.isPremium ? 'Premium' : 'Free'}
          </button>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditModal({ open: true, problem: row });
            }}
            className="p-2 rounded-lg hover:bg-[#1E88E5]/10 text-[#1E88E5] hover:text-white border border-transparent hover:border-[#1E88E5]/20 transition-all"
            title="Edit Problem"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({ open: true, problem: row });
            }}
            className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 hover:text-white border border-transparent hover:border-red-500/20 transition-all"
            title="Delete Problem"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E1E1E] via-[#252525] to-[#1E1E1E] border border-gray-800/50 p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#4CAF50]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1E88E5]/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] flex items-center justify-center shadow-lg shadow-[#4CAF50]/20">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Problems</h1>
                <p className="text-gray-400">Manage coding problems and challenges</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252525] rounded-lg border border-gray-800">
                <FileText className="w-4 h-4 text-[#4CAF50]" />
                <span className="text-gray-400">Total: <span className="text-white font-semibold">{stats.total || 0}</span></span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252525] rounded-lg border border-gray-800">
                <div className="w-2 h-2 rounded-full bg-[#4CAF50]"></div>
                <span className="text-gray-400">Easy: <span className="text-[#4CAF50] font-semibold">{stats.easy || 0}</span></span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252525] rounded-lg border border-gray-800">
                <div className="w-2 h-2 rounded-full bg-[#FFC107]"></div>
                <span className="text-gray-400">Medium: <span className="text-[#FFC107] font-semibold">{stats.medium || 0}</span></span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252525] rounded-lg border border-gray-800">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-gray-400">Hard: <span className="text-red-500 font-semibold">{stats.hard || 0}</span></span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="group px-6 py-3 bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] text-white rounded-xl hover:shadow-lg hover:shadow-[#4CAF50]/30 transition-all flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Create Problem
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'easy', 'medium', 'hard'].map((f) => {
          const colors = {
            all: 'hover:border-[#4CAF50]/50',
            easy: 'hover:border-[#4CAF50]/50',
            medium: 'hover:border-[#FFC107]/50',
            hard: 'hover:border-red-500/50',
          };
          const activeColors = {
            all: 'bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] border-[#4CAF50] shadow-lg shadow-[#4CAF50]/20',
            easy: 'bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] border-[#4CAF50] shadow-lg shadow-[#4CAF50]/20',
            medium: 'bg-gradient-to-r from-[#FFC107] to-[#FFA000] border-[#FFC107] shadow-lg shadow-[#FFC107]/20',
            hard: 'bg-gradient-to-r from-red-500 to-red-700 border-red-500 shadow-lg shadow-red-500/20',
          };
          return (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                filter === f
                  ? `${activeColors[f]} text-white`
                  : `bg-[#252525] text-gray-400 hover:text-white border-gray-800 ${colors[f]}`
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Modals */}
      <CreateProblemModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProblem}
      />
      <EditProblemModal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, problem: null })}
        problem={editModal.problem}
        onUpdated={handleUpdateProblem}
      />
      <DeleteProblemModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, problem: null })}
        problem={deleteModal.problem}
        onDeleted={handleDeleteProblem}
      />

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-96 bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-2xl border border-gray-800/50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-400 text-lg font-medium">Loading problems...</div>
          </div>
        </div>
      ) : problems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-2xl border border-gray-800/50">
          <div className="w-16 h-16 rounded-2xl bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-[#4CAF50]" />
          </div>
          <p className="text-lg font-semibold text-white mb-2">No problems found</p>
          <p className="text-sm text-gray-400 mb-6">
            {filter !== 'all' 
              ? `No ${filter} difficulty problems available` 
              : 'Get started by creating your first problem'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] text-white rounded-xl hover:shadow-lg hover:shadow-[#4CAF50]/20 transition-all flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Create First Problem
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-xl border border-gray-800/50 overflow-hidden">
          <DataTable columns={columns} data={problems} />
        </div>
      )}

      {!loading && pagination.total > 0 && (
        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-xl border border-gray-800/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-400">
            Showing{' '}
            <span className="text-white font-semibold">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>{' '}
            to{' '}
            <span className="text-white font-semibold">
              {Math.min(pagination.total, pagination.page * pagination.limit)}
            </span>{' '}
            of{' '}
            <span className="text-white font-semibold">{pagination.total}</span> problems
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || loading}
                className="px-3 py-2 rounded-lg border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#252525] transition-all flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              {getVisiblePages().map((pageNum, idx) =>
                pageNum === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">
                    ...
                  </span>
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
                className="px-3 py-2 rounded-lg border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#252525] transition-all flex items-center gap-1"
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
