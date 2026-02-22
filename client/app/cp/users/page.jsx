'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import DataTable from '@/components/admin/DataTable';
import { Users, Search, UserCheck, UserX, Shield, ShieldAlert, Activity, CheckCircle2, AlertCircle, Ban, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
  const [searching, setSearching] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    banned: 0,
    active: 0,
  });

  useEffect(() => {
    // Calculate stats whenever users change
    setStats({
      total: pagination.total || users.length,
      verified: users.filter(u => u.isVerified).length,
      banned: users.filter(u => u.isBanned).length,
      active: users.filter(u => !u.isBanned).length,
    });
  }, [users, pagination.total]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setSearching(true);
    try {
      const params = {};
      if (appliedSearch) params.search = appliedSearch;
      if (quickFilter === 'verified') params.isVerified = 'true';
      if (quickFilter === 'banned') params.isBanned = 'true';
      params.page = String(page);
      params.limit = String(PAGE_SIZE);

      const data = await adminAPI.getUsers(params);
      const nextPagination = {
        page: Number(data.pagination?.page) || page,
        pages: Math.max(Number(data.pagination?.pages) || 1, 1),
        total: Number(data.pagination?.total) || 0,
        limit: Number(data.pagination?.limit) || PAGE_SIZE,
      };
      if (nextPagination.pages > 0 && page > nextPagination.pages) {
        setPage(nextPagination.pages);
        return;
      }
      setUsers(data.users || []);
      setPagination(nextPagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
      setPagination({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [appliedSearch, quickFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBanUser = async (userId, isBanned) => {
    try {
      await adminAPI.banUser(userId, { isBanned });
      fetchUsers();
    } catch (error) {
      console.error('Failed to ban/unban user:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      setAppliedSearch(searchTerm.trim());
      setPage(1);
    }
  };

  const handleQuickFilter = (nextFilter) => {
    setQuickFilter(nextFilter);
    setPage(1);
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
      if (previous && pageNum - previous > 1) withEllipsis.push('...');
      withEllipsis.push(pageNum);
      previous = pageNum;
    }
    return withEllipsis;
  };

  const columns = [
    {
      header: 'User',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E88E5] to-[#1565C0] flex items-center justify-center text-white font-semibold shadow-lg">
            {row.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="font-medium text-white flex items-center gap-2">
              {row.name}
              {row.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-[#4CAF50]" title="Verified" />
              )}
            </div>
            <div className="text-sm text-gray-400">@{row.username}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (row) => (
        <span className="text-gray-400">{row.email}</span>
      ),
    },
    {
      header: 'Verification',
      accessor: 'isVerified',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.isVerified ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/20">
                <Shield className="w-3 h-3" />
                Verified
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FFC107]"></div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FFC107]/10 text-[#FFC107] border border-[#FFC107]/20">
                <AlertCircle className="w-3 h-3" />
                Pending
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'isBanned',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.isBanned ? (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                <Ban className="w-3 h-3" />
                Banned
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/20">
                <Activity className="w-3 h-3" />
                Active
              </span>
            </>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleBanUser(row._id, !row.isBanned);
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
            row.isBanned
              ? 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20 hover:bg-[#4CAF50]/20 hover:shadow-lg hover:shadow-[#4CAF50]/10'
              : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 hover:shadow-lg hover:shadow-red-500/10'
          }`}
        >
          {row.isBanned ? (
            <>
              <UserCheck className="w-4 h-4" />
              Unban User
            </>
          ) : (
            <>
              <UserX className="w-4 h-4" />
              Ban User
            </>
          )}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E1E1E] via-[#252525] to-[#1E1E1E] border border-gray-800/50 p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1E88E5]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#4CAF50]/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1E88E5] to-[#1565C0] flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Users Management</h1>
              <p className="text-gray-400">Monitor and manage platform users</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-3 px-4 py-3 bg-[#252525] rounded-xl border border-gray-800">
              <div className="w-10 h-10 rounded-lg bg-[#1E88E5]/10 border border-[#1E88E5]/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#1E88E5]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-gray-400">Total Users</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 bg-[#252525] rounded-xl border border-gray-800">
              <div className="w-10 h-10 rounded-lg bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#4CAF50]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.verified}</div>
                <div className="text-xs text-gray-400">Verified</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 bg-[#252525] rounded-xl border border-gray-800">
              <div className="w-10 h-10 rounded-lg bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#4CAF50]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.active}</div>
                <div className="text-xs text-gray-400">Active</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 bg-[#252525] rounded-xl border border-gray-800">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.banned}</div>
                <div className="text-xs text-gray-400">Banned</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-xl border border-gray-800/50 p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative group">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-[#1E88E5] transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-12 pr-4 py-3.5 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#1E88E5]/50 focus:ring-2 focus:ring-[#1E88E5]/20 transition-all"
            />
          </div>
          <button
            onClick={() => {
              setAppliedSearch(searchTerm.trim());
              setPage(1);
            }}
            disabled={searching}
            className="px-8 py-3.5 bg-gradient-to-r from-[#1E88E5] to-[#1565C0] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#1E88E5]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {searching ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search
              </>
            )}
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => {
              handleQuickFilter('all');
            }}
            className={`px-4 py-2 border rounded-lg text-sm transition-all ${
              quickFilter === 'all'
                ? 'bg-[#1E88E5]/15 border-[#1E88E5]/40 text-[#1E88E5] font-semibold'
                : 'bg-[#252525] border-gray-800 text-gray-400 hover:bg-[#1E88E5]/10 hover:border-[#1E88E5]/30 hover:text-white'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => handleQuickFilter('verified')}
            className={`px-4 py-2 border rounded-lg text-sm transition-all ${
              quickFilter === 'verified'
                ? 'bg-[#4CAF50]/15 border-[#4CAF50]/40 text-[#4CAF50] font-semibold'
                : 'bg-[#252525] border-gray-800 text-gray-400 hover:bg-[#4CAF50]/10 hover:border-[#4CAF50]/30 hover:text-white'
            }`}
          >
            Verified Only
          </button>
          <button
            onClick={() => handleQuickFilter('banned')}
            className={`px-4 py-2 border rounded-lg text-sm transition-all ${
              quickFilter === 'banned'
                ? 'bg-red-500/15 border-red-500/40 text-red-400 font-semibold'
                : 'bg-[#252525] border-gray-800 text-gray-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-white'
            }`}
          >
            Banned Users
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-96 bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-2xl border border-gray-800/50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#1E88E5] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-400 text-lg font-medium">Loading users...</div>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-2xl border border-gray-800/50">
          <div className="w-16 h-16 rounded-2xl bg-[#1E88E5]/10 border border-[#1E88E5]/20 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-[#1E88E5]" />
          </div>
          <p className="text-lg font-semibold text-white mb-2">No users found</p>
          <p className="text-sm text-gray-400 mb-6">
            {appliedSearch || quickFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No users registered yet'}
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-xl border border-gray-800/50 overflow-hidden">
          <DataTable columns={columns} data={users} />
        </div>
      )}

      {!loading && pagination.total > 0 && (
        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-xl border border-gray-800/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-400">
            Showing{' '}
            <span className="text-white font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span>{' '}
            to{' '}
            <span className="text-white font-semibold">{Math.min(pagination.total, pagination.page * pagination.limit)}</span>{' '}
            of <span className="text-white font-semibold">{pagination.total}</span> users
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
                        ? 'bg-gradient-to-r from-[#1E88E5] to-[#1565C0] border-[#1E88E5] text-white'
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
