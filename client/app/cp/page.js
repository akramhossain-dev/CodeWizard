'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import StatsCard from '@/components/admin/StatsCard';
import DataTable from '@/components/admin/DataTable';
import { Plus, UserCog, BarChart2, TrendingUp, Activity, Clock } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardData, usersData] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getUsers({ limit: 5 }),
      ]);

      setStats(dashboardData.stats);
      setRecentUsers(usersData.users || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-400 text-lg font-medium">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const userColumns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] flex items-center justify-center text-white font-semibold text-sm">
            {row.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="font-medium">{row.name}</span>
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
      header: 'Username',
      accessor: 'username',
      render: (row) => (
        <span className="text-gray-300 font-mono text-sm">@{row.username}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'isVerified',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${row.isVerified ? 'bg-[#4CAF50]' : 'bg-[#FFC107]'} animate-pulse`}></div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              row.isVerified
                ? 'bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/20'
                : 'bg-[#FFC107]/10 text-[#FFC107] border border-[#FFC107]/20'
            }`}
          >
            {row.isVerified ? 'Verified' : 'Pending'}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Page Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E1E1E] via-[#252525] to-[#1E1E1E] border border-gray-800/50 p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#4CAF50]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1E88E5]/5 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          </div>
          <p className="text-gray-400 text-lg">Monitor your platform's performance and activity</p>
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid with Enhanced Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon="users"
          color="green"
        />
        <StatsCard
          title="Total Problems"
          value={stats?.totalProblems || 0}
          icon="problems"
          color="blue"
        />
        <StatsCard
          title="Total Employees"
          value={stats?.totalEmployees || 0}
          icon="employees"
          color="green"
        />
        <StatsCard
          title="Total Submissions"
          value={stats?.submissions?.total || 0}
          icon="submissions"
          color="amber"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users - Takes 2 columns */}
        <div className="lg:col-span-2 bg-[#1E1E1E] rounded-xl border border-gray-800/50 overflow-hidden backdrop-blur-sm">
          <div className="bg-gradient-to-r from-[#252525] to-[#1E1E1E] px-6 py-5 border-b border-gray-800/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Recent Users</h2>
                <p className="text-gray-400 text-sm">Latest registered members</p>
              </div>
              <div className="px-3 py-1 bg-[#4CAF50]/10 text-[#4CAF50] rounded-full text-sm font-semibold border border-[#4CAF50]/20">
                {recentUsers.length} New
              </div>
            </div>
          </div>
          <div className="p-6">
            <DataTable columns={userColumns} data={recentUsers} />
          </div>
        </div>

        {/* Quick Actions - Takes 1 column */}
        <div className="bg-[#1E1E1E] rounded-xl border border-gray-800/50 overflow-hidden backdrop-blur-sm">
          <div className="bg-gradient-to-r from-[#252525] to-[#1E1E1E] px-6 py-5 border-b border-gray-800/50">
            <h2 className="text-xl font-bold text-white mb-1">Quick Actions</h2>
            <p className="text-gray-400 text-sm">Common tasks</p>
          </div>
          <div className="p-6 space-y-3">
            <button className="group w-full text-left px-5 py-4 bg-gradient-to-br from-[#252525] to-[#1E1E1E] hover:from-[#4CAF50]/10 hover:to-[#2E7D32]/5 border border-gray-800 hover:border-[#4CAF50]/50 rounded-xl text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50]/0 via-[#4CAF50]/5 to-[#4CAF50]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="w-10 h-10 rounded-lg bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Plus className="w-5 h-5 text-[#4CAF50]" />
              </div>
              <div className="relative z-10">
                <div className="font-semibold">Create Problem</div>
                <div className="text-xs text-gray-500">Add new challenge</div>
              </div>
            </button>

            <button className="group w-full text-left px-5 py-4 bg-gradient-to-br from-[#252525] to-[#1E1E1E] hover:from-[#1E88E5]/10 hover:to-[#1565C0]/5 border border-gray-800 hover:border-[#1E88E5]/50 rounded-xl text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#1E88E5]/0 via-[#1E88E5]/5 to-[#1E88E5]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="w-10 h-10 rounded-lg bg-[#1E88E5]/10 border border-[#1E88E5]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <UserCog className="w-5 h-5 text-[#1E88E5]" />
              </div>
              <div className="relative z-10">
                <div className="font-semibold">Add Employee</div>
                <div className="text-xs text-gray-500">Manage team members</div>
              </div>
            </button>

            <button className="group w-full text-left px-5 py-4 bg-gradient-to-br from-[#252525] to-[#1E1E1E] hover:from-[#FFC107]/10 hover:to-[#FFA000]/5 border border-gray-800 hover:border-[#FFC107]/50 rounded-xl text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFC107]/0 via-[#FFC107]/5 to-[#FFC107]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="w-10 h-10 rounded-lg bg-[#FFC107]/10 border border-[#FFC107]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BarChart2 className="w-5 h-5 text-[#FFC107]" />
              </div>
              <div className="relative z-10">
                <div className="font-semibold">View Reports</div>
                <div className="text-xs text-gray-500">Analytics & insights</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="bg-gradient-to-br from-[#1E1E1E] via-[#252525] to-[#1E1E1E] rounded-xl border border-gray-800/50 overflow-hidden backdrop-blur-sm">
        <div className="bg-gradient-to-r from-[#252525] to-[#1E1E1E] px-6 py-5 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-[#4CAF50]" />
            <h2 className="text-xl font-bold text-white">Platform Activity</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-[#252525]/50 border border-gray-800/30">
              <div className="w-12 h-12 rounded-full bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-[#4CAF50]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats?.submissions?.total || 0}</div>
                <div className="text-sm text-gray-400">Total Submissions</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-[#252525]/50 border border-gray-800/30">
              <div className="w-12 h-12 rounded-full bg-[#1E88E5]/10 border border-[#1E88E5]/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#1E88E5]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats?.submissions?.accepted || 0}</div>
                <div className="text-sm text-gray-400">Accepted Submissions</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-[#252525]/50 border border-gray-800/30">
              <div className="w-12 h-12 rounded-full bg-[#FFC107]/10 border border-[#FFC107]/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#FFC107]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  Easy: {stats?.problemsByDifficulty?.easy || 0} | Medium: {stats?.problemsByDifficulty?.medium || 0} | Hard: {stats?.problemsByDifficulty?.hard || 0}
                </div>
                <div className="text-sm text-gray-400">Problems by Difficulty</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}