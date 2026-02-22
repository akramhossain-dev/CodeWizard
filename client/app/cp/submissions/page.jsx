'use client';

import { useEffect, useState } from 'react';
import { submissionsAPI } from '@/lib/api';
import StatsCard from '@/components/admin/StatsCard';
import SubmissionsTable from '@/components/admin/SubmissionsTable';
import { 
  FileCode, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react';

export default function SubmissionsPage() {
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchStats();
    fetchSubmissions(page);
  }, [page, filter]);

  const fetchStats = async () => {
    try {
      const data = await submissionsAPI.getAdminStats({});
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch submission stats:', error);
    }
  };

  const fetchSubmissions = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = { page: pageNum };
      if (filter !== 'all') {
        params.status = filter;
      }
      const data = await submissionsAPI.getAllAdmin(params);
      setSubmissions(data.submissions || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E1E1E] via-[#252525] to-[#1E1E1E] border border-gray-800/50 p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1E88E5]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#4CAF50]/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1E88E5] to-[#1565C0] flex items-center justify-center shadow-lg shadow-[#1E88E5]/20">
                <FileCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Submissions</h1>
                <p className="text-gray-400">Monitor all code submissions and results</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252525] rounded-lg border border-gray-800">
                <Activity className="w-4 h-4 text-[#1E88E5]" />
                <span className="text-gray-400">Total: <span className="text-white font-semibold">{stats?.total || 0}</span></span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252525] rounded-lg border border-gray-800">
                <CheckCircle className="w-4 h-4 text-[#4CAF50]" />
                <span className="text-gray-400">Accepted: <span className="text-[#4CAF50] font-semibold">{stats?.accepted || 0}</span></span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252525] rounded-lg border border-gray-800">
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="text-xs">
                    {stats?.total > 0 
                      ? `${Math.round((stats?.accepted / stats?.total) * 100)}%`
                      : '0%'}
                  </div>
                </div>
                <span className="text-gray-400">Success Rate</span>
              </div>
            </div>
          </div>
          
          <button className="px-6 py-3 bg-gradient-to-r from-[#1E88E5] to-[#1565C0] text-white rounded-xl hover:shadow-lg hover:shadow-[#1E88E5]/30 transition-all flex items-center gap-2 font-medium">
            <Download className="w-5 h-5" />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Submissions"
          value={stats?.total || 0}
          icon="submissions"
          color="blue"
        />
        <StatsCard
          title="Accepted"
          value={stats?.accepted || 0}
          icon="users"
          color="green"
        />
        <StatsCard
          title="Wrong Answer"
          value={stats?.wrongAnswer || 0}
          icon="problems"
          color="red"
        />
        <StatsCard
          title="Time Limit Exceeded"
          value={stats?.tle || 0}
          icon="submissions"
          color="amber"
        />
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-xl border border-gray-800/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Filter by Status</h3>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All Submissions', color: 'blue' },
            { key: 'accepted', label: 'Accepted', color: 'green' },
            { key: 'wrong_answer', label: 'Wrong Answer', color: 'red' },
            { key: 'tle', label: 'Time Limit', color: 'amber' },
            { key: 'runtime_error', label: 'Runtime Error', color: 'purple' },
          ].map((f) => {
            const colorMap = {
              blue: {
                active: 'bg-gradient-to-r from-[#1E88E5] to-[#1565C0] border-[#1E88E5] shadow-lg shadow-[#1E88E5]/20',
                inactive: 'bg-[#252525] text-gray-400 hover:text-white border-gray-800 hover:border-[#1E88E5]/50'
              },
              green: {
                active: 'bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] border-[#4CAF50] shadow-lg shadow-[#4CAF50]/20',
                inactive: 'bg-[#252525] text-gray-400 hover:text-white border-gray-800 hover:border-[#4CAF50]/50'
              },
              red: {
                active: 'bg-gradient-to-r from-red-500 to-red-700 border-red-500 shadow-lg shadow-red-500/20',
                inactive: 'bg-[#252525] text-gray-400 hover:text-white border-gray-800 hover:border-red-500/50'
              },
              amber: {
                active: 'bg-gradient-to-r from-[#FFC107] to-[#FFA000] border-[#FFC107] shadow-lg shadow-[#FFC107]/20',
                inactive: 'bg-[#252525] text-gray-400 hover:text-white border-gray-800 hover:border-[#FFC107]/50'
              },
              purple: {
                active: 'bg-gradient-to-r from-purple-500 to-purple-700 border-purple-500 shadow-lg shadow-purple-500/20',
                inactive: 'bg-[#252525] text-gray-400 hover:text-white border-gray-800 hover:border-purple-500/50'
              }
            };
            
            const colors = colorMap[f.color];
            
            return (
              <button
                key={f.key}
                onClick={() => {
                  setFilter(f.key);
                  setPage(1);
                }}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  filter === f.key ? `${colors.active} text-white` : colors.inactive
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-xl border border-gray-800/50 overflow-hidden">
        <div className="bg-gradient-to-r from-[#252525] to-[#1E1E1E] px-6 py-5 border-b border-gray-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">All Submissions</h2>
              <p className="text-gray-400 text-sm">
                Showing {submissions.length} submissions {filter !== 'all' && `(${filter.replace('_', ' ')})`}
              </p>
            </div>
            <div className="text-sm text-gray-400">
              Page {page} of {totalPages}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#1E88E5] border-t-transparent rounded-full animate-spin"></div>
              <div className="text-gray-400 text-lg font-medium">Loading submissions...</div>
            </div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="w-16 h-16 rounded-2xl bg-[#1E88E5]/10 border border-[#1E88E5]/20 flex items-center justify-center mb-4">
              <FileCode className="w-8 h-8 text-[#1E88E5]" />
            </div>
            <p className="text-lg font-semibold text-white mb-2">No submissions found</p>
            <p className="text-sm text-gray-400">
              {filter !== 'all' 
                ? `No submissions with status: ${filter.replace('_', ' ')}` 
                : 'No submissions have been made yet'}
            </p>
          </div>
        ) : (
          <div className="p-6">
            <SubmissionsTable submissions={submissions} />
          </div>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && !loading && (
          <div className="px-6 py-5 border-t border-gray-800/50">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border disabled:opacity-50 disabled:cursor-not-allowed bg-[#252525] text-gray-400 hover:text-white border-gray-800 hover:border-[#1E88E5]/50"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex gap-2">
                {getVisiblePages().map((pageNum, idx) => (
                  pageNum === '...' ? (
                    <span key={`dots-${idx}`} className="px-3 py-2 text-gray-500">
                      ...
                    </span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-lg font-semibold border transition-all ${
                        page === pageNum
                          ? 'bg-gradient-to-r from-[#1E88E5] to-[#1565C0] text-white border-[#1E88E5] shadow-lg shadow-[#1E88E5]/20'
                          : 'bg-[#252525] text-gray-400 border-gray-800 hover:text-white hover:border-[#1E88E5]/50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border disabled:opacity-50 disabled:cursor-not-allowed bg-[#252525] text-gray-400 hover:text-white border-gray-800 hover:border-[#1E88E5]/50"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}