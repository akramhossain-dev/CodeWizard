// API client for backend communication
import { getAuthToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

const getUserToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const userApiClient = async (endpoint, options = {}) => {
  const token = getUserToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Admin API calls
export const adminAPI = {
    getProfile: () =>
      apiClient('/api/admin/profile'),

    changePassword: (data) =>
      apiClient('/api/admin/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  signin: (credentials) =>
    apiClient('/api/admin/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getDashboardStats: () =>
    apiClient('/api/admin/dashboard/stats'),

  getEmployees: (params) =>
    apiClient(`/api/admin/employees?${new URLSearchParams(params)}`),

  createEmployee: (data) =>
    apiClient('/api/admin/employees/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getUsers: (params) =>
    apiClient(`/api/admin/users?${new URLSearchParams(params)}`),

  banUser: (id, data) =>
    apiClient(`/api/admin/users/${id}/ban`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateEmployee: (id, data) =>
    apiClient(`/api/admin/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteEmployee: (id) =>
    apiClient(`/api/admin/employees/${id}`, {
      method: 'DELETE',
    }),

  resetEmployeePassword: (id, data) =>
    apiClient(`/api/admin/employees/${id}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Employee API calls
export const employeeAPI = {
    getProfile: () =>
      apiClient('/api/employee/profile'),

    changePassword: (data) =>
      apiClient('/api/employee/change-password', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getStats: () =>
      apiClient('/api/employee/stats'),
  signin: (credentials) =>
    apiClient('/api/employee/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
};

// Helper to get the correct API based on user type
import { getUserType } from './auth';

export const getAPI = () => {
  const userType = getUserType();
  if (userType === 'admin') return adminAPI;
  if (userType === 'employee') return employeeAPI;
  return adminAPI;
};

// Problems API
export const problemsAPI = {
  getAll: (params) =>
    apiClient(`/api/problems/all?${new URLSearchParams(params)}`),

  getAllAdmin: (params) =>
    apiClient(`/api/problems/admin/all?${new URLSearchParams(params)}`),

  getById: (slug) =>
    apiClient(`/api/problems/${slug}`),

  create: (data) =>
    apiClient('/api/problems/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    apiClient(`/api/problems/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateStatus: (id, data) =>
    apiClient(`/api/problems/status/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiClient(`/api/problems/delete/${id}`, {
      method: 'DELETE',
    }),

  getStats: () =>
    apiClient('/api/problems/stats'),
};

// Dashboard (user) Problems API
export const dashboardProblemsAPI = {
  getTags: () =>
    userApiClient('/api/problems/tags'),

  getAll: (params = {}) =>
    userApiClient(`/api/problems/all?${new URLSearchParams(params)}`),

  getByTag: (tag, params = {}) =>
    userApiClient(`/api/problems/tag/${encodeURIComponent(tag)}?${new URLSearchParams(params)}`),

  getRandom: (params = {}) =>
    userApiClient(`/api/problems/random?${new URLSearchParams(params)}`),

  getStats: () =>
    userApiClient('/api/problems/stats'),

  getMe: () =>
    userApiClient('/api/auth/me'),
};

// Contests API
export const contestsAPI = {
  getAll: (params = {}) =>
    apiClient(`/api/contests/all?${new URLSearchParams(params)}`),

  getBySlug: (slug) =>
    apiClient(`/api/contests/${slug}`),

  getLeaderboard: (slug, params = {}) =>
    apiClient(`/api/contests/${slug}/leaderboard?${new URLSearchParams(params)}`),

  join: (id) =>
    apiClient(`/api/contests/${id}/join`, { method: 'POST' }),

  getMyJoined: () =>
    apiClient('/api/contests/my/joined'),

  getAllAdmin: (params = {}) =>
    apiClient(`/api/contests/admin/all?${new URLSearchParams(params)}`),

  create: (data) =>
    apiClient('/api/contests/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    apiClient(`/api/contests/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateStatus: (id, data) =>
    apiClient(`/api/contests/status/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiClient(`/api/contests/delete/${id}`, {
      method: 'DELETE',
    }),
};

// Dashboard (user) Contests API
export const dashboardContestsAPI = {
  getAll: (params = {}) =>
    userApiClient(`/api/contests/all?${new URLSearchParams(params)}`),

  join: (id) =>
    userApiClient(`/api/contests/${id}/join`, {
      method: 'POST',
    }),
};

// Submissions API
export const submissionsAPI = {
  getStats: (params) =>
    apiClient(`/api/submissions/stats?${new URLSearchParams(params)}`),

  getByProblem: (problemId, params) =>
    apiClient(`/api/submissions/problem/${problemId}?${new URLSearchParams(params)}`),

  getAllAdmin: (params) =>
    apiClient(`/api/submissions/admin/all?${new URLSearchParams(params)}`),

  getAdminStats: (params) =>
    apiClient(`/api/submissions/admin/stats?${new URLSearchParams(params)}`),
};
