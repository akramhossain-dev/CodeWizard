'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import DataTable from '@/components/admin/DataTable';
import { Plus, X, Pencil, Trash2, KeyRound, Users, Shield, Activity, AlertCircle, CheckCircle2, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

function ResetPasswordModal({ open, onClose, employee, onReset }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setPassword('');
    setError('');
    setSuccess('');
  }, [open, employee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await adminAPI.resetEmployeePassword(employee._id, { newPassword: password });
      setSuccess('Password reset successfully');
      onReset && onReset();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('password')) {
        setError(err.message);
      } else if (password.length < 6) {
        setError('Password must be at least 6 characters.');
      } else {
        setError('Failed to reset password. Please try a different password.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open || !employee) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-2xl shadow-2xl border border-gray-800/50 w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg p-1 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#FFC107]/10 border border-[#FFC107]/20 flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-[#FFC107]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Reset Password</h2>
            <p className="text-sm text-gray-400">Update employee credentials</p>
          </div>
        </div>

        <div className="mb-4 p-3 rounded-lg bg-[#252525] border border-gray-800">
          <p className="text-gray-400 text-sm">
            Resetting password for:{' '}
            <span className="text-white font-semibold">{employee.employeeName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}
          
          <div className="relative">
            <label className="block text-gray-400 text-sm font-medium mb-2">New Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-[#FFC107]/50 focus:ring-2 focus:ring-[#FFC107]/20 transition-all outline-none pr-12"
              placeholder="Enter new password (min 6 characters)"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-9 right-4 text-gray-400 hover:text-[#FFC107] focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#FFC107] to-[#FFA000] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#FFC107]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditEmployeeModal({ open, onClose, employee, onUpdated }) {
  const [form, setForm] = useState(employee || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(employee || {});
    setError('');
  }, [employee]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('permissions.')) {
      const permKey = name.split('.')[1];
      setForm((prev) => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permKey]: checked,
        },
      }));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminAPI.updateEmployee(form._id, form);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  if (!open || !employee) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-2xl shadow-2xl border border-gray-800/50 w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg p-1 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#1E88E5]/10 border border-[#1E88E5]/20 flex items-center justify-center">
            <Pencil className="w-6 h-6 text-[#1E88E5]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Edit Employee</h2>
            <p className="text-sm text-gray-400">Update employee information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              name="employeeName"
              value={form.employeeName || ''}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-[#1E88E5]/50 focus:ring-2 focus:ring-[#1E88E5]/20 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="employeeEmail"
              value={form.employeeEmail || ''}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-[#1E88E5]/50 focus:ring-2 focus:ring-[#1E88E5]/20 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Role</label>
            <select
              name="role"
              value={form.role || 'support'}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white focus:border-[#1E88E5]/50 focus:ring-2 focus:ring-[#1E88E5]/20 transition-all outline-none"
            >
              <option value="problem_manager">Problem Manager</option>
              <option value="moderator">Moderator</option>
              <option value="support">Support</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-3">
              <Shield className="w-4 h-4 inline mr-1" />
              Permissions
            </label>
            <div className="grid grid-cols-1 gap-3 p-4 bg-[#252525]/50 rounded-xl border border-gray-800">
              {[
                { key: 'manageProblems', label: 'Manage Problems' },
                { key: 'manageTestcases', label: 'Manage Testcases' },
                { key: 'manageUsers', label: 'Manage Users' },
                { key: 'manageDiscussions', label: 'Manage Discussions' },
                { key: 'viewSubmissions', label: 'View Submissions' },
                { key: 'deleteSubmissions', label: 'Delete Submissions' },
              ].map((perm) => (
                <label key={perm.key} className="flex items-center gap-3 text-gray-300 text-sm cursor-pointer group">
                  <input
                    type="checkbox"
                    name={`permissions.${perm.key}`}
                    checked={form.permissions?.[perm.key] || false}
                    onChange={handleChange}
                    className="w-5 h-5 accent-[#4CAF50] rounded cursor-pointer"
                  />
                  <span className="group-hover:text-white transition-colors">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1E88E5] to-[#1565C0] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#1E88E5]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteEmployeeModal({ open, onClose, employee, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    setError('');
  }, [open]);
  
  if (!open || !employee) return null;
  
  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await adminAPI.deleteEmployee(employee._id);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete employee');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-2xl shadow-2xl border border-red-900/30 w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg p-1 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Delete Employee</h2>
            <p className="text-sm text-gray-400">This action cannot be undone</p>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <p className="text-gray-300 text-sm">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-white">{employee.employeeName}</span>?
            All associated data will be permanently removed.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Deleting...' : 'Delete Employee'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateEmployeeModal({ open, onClose, onCreated }) {
  const initialForm = {
    employeeName: '',
    employeeEmail: '',
    password: '',
    role: 'support',
    permissions: {
      manageProblems: false,
      manageTestcases: false,
      manageUsers: false,
      manageDiscussions: false,
      viewSubmissions: false,
      deleteSubmissions: false,
    },
  };
  
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('permissions.')) {
      const permKey = name.split('.')[1];
      setForm((prev) => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permKey]: checked,
        },
      }));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminAPI.createEmployee(form);
      setForm(initialForm);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setError('');
    }
    // eslint-disable-next-line
  }, [open]);
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-2xl shadow-2xl border border-gray-800/50 w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg p-1 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center">
            <Plus className="w-6 h-6 text-[#4CAF50]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Add Employee</h2>
            <p className="text-sm text-gray-400">Create a new team member</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              name="employeeName"
              value={form.employeeName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-[#4CAF50]/50 focus:ring-2 focus:ring-[#4CAF50]/20 transition-all outline-none"
              placeholder="Enter employee name"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="employeeEmail"
              value={form.employeeEmail}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-[#4CAF50]/50 focus:ring-2 focus:ring-[#4CAF50]/20 transition-all outline-none"
              placeholder="employee@example.com"
            />
          </div>

          <div className="relative">
            <label className="block text-gray-400 text-sm font-medium mb-2">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-[#4CAF50]/50 focus:ring-2 focus:ring-[#4CAF50]/20 transition-all outline-none pr-12"
              placeholder="Enter password (min 6 characters)"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-9 right-4 text-gray-400 hover:text-[#4CAF50] focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white focus:border-[#4CAF50]/50 focus:ring-2 focus:ring-[#4CAF50]/20 transition-all outline-none"
            >
              <option value="problem_manager">Problem Manager</option>
              <option value="moderator">Moderator</option>
              <option value="support">Support</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-3">
              <Shield className="w-4 h-4 inline mr-1" />
              Permissions
            </label>
            <div className="grid grid-cols-1 gap-3 p-4 bg-[#252525]/50 rounded-xl border border-gray-800">
              {[
                { key: 'manageProblems', label: 'Manage Problems' },
                { key: 'manageTestcases', label: 'Manage Testcases' },
                { key: 'manageUsers', label: 'Manage Users' },
                { key: 'manageDiscussions', label: 'Manage Discussions' },
                { key: 'viewSubmissions', label: 'View Submissions' },
                { key: 'deleteSubmissions', label: 'Delete Submissions' },
              ].map((perm) => (
                <label key={perm.key} className="flex items-center gap-3 text-gray-300 text-sm cursor-pointer group">
                  <input
                    type="checkbox"
                    name={`permissions.${perm.key}`}
                    checked={form.permissions[perm.key]}
                    onChange={handleChange}
                    className="w-5 h-5 accent-[#4CAF50] rounded cursor-pointer"
                  />
                  <span className="group-hover:text-white transition-colors">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#4CAF50]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, employee: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, employee: null });
  const [resetModal, setResetModal] = useState({ open: false, employee: null });
  const [accessDenied, setAccessDenied] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!isAdmin()) {
      setAccessDenied(true);
      setLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getEmployees({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
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
      setEmployees(data.employees || []);
      setPagination(nextPagination);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setEmployees([]);
      setPagination({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (isAdmin()) {
      fetchEmployees();
    }
  }, [fetchEmployees]);

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
      header: 'Employee',
      accessor: 'employeeName',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] flex items-center justify-center text-white font-semibold">
            {row.employeeName?.charAt(0).toUpperCase() || 'E'}
          </div>
          <div>
            <div className="font-medium text-white">{row.employeeName}</div>
            <div className="text-sm text-gray-400">{row.employeeEmail}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1E88E5]/10 text-[#1E88E5] text-xs rounded-full font-semibold border border-[#1E88E5]/20 capitalize">
          <Shield className="w-3 h-3" />
          {row.role?.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Problems',
      accessor: 'problemsCreated',
      render: (row) => (
        <div className="text-center">
          <div className="text-lg font-bold text-white">{row.problemsCreated || 0}</div>
          <div className="text-xs text-gray-500">Created</div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${row.isActive ? 'bg-[#4CAF50]' : 'bg-gray-500'} animate-pulse`}></div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              row.isActive
                ? 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20'
                : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
            }`}
          >
            {row.isActive ? <Activity className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {row.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => setEditModal({ open: true, employee: row })}
            className="p-2 rounded-lg hover:bg-[#1E88E5]/10 text-[#1E88E5] hover:text-white border border-transparent hover:border-[#1E88E5]/20 transition-all"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setResetModal({ open: true, employee: row })}
            className="p-2 rounded-lg hover:bg-[#FFC107]/10 text-[#FFC107] hover:text-white border border-transparent hover:border-[#FFC107]/20 transition-all"
            title="Reset Password"
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteModal({ open: true, employee: row })}
            className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 hover:text-white border border-transparent hover:border-red-500/20 transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Show access denied for employees
  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-2xl shadow-2xl border border-red-900/30 w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">
            You do not have permission to access this page. Only administrators can manage employees.
          </p>
          <button
            onClick={() => router.push('/cp')}
            className="px-6 py-3 bg-gradient-to-r from-[#1E88E5] to-[#1565C0] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#1E88E5]/20 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E1E1E] via-[#252525] to-[#1E1E1E] border border-gray-800/50 p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#4CAF50]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1E88E5]/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Employees</h1>
                <p className="text-gray-400">Manage platform employees and permissions</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252525] rounded-lg border border-gray-800">
                <Users className="w-4 h-4 text-[#4CAF50]" />
                <span className="text-gray-400">Total: <span className="text-white font-semibold">{pagination.total || employees.length}</span></span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252525] rounded-lg border border-gray-800">
                <Activity className="w-4 h-4 text-[#4CAF50]" />
                <span className="text-gray-400">Active: <span className="text-white font-semibold">{employees.filter(e => e.isActive).length}</span></span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="group px-6 py-3 bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] text-white rounded-xl hover:shadow-lg hover:shadow-[#4CAF50]/20 transition-all flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Modals */}
      <CreateEmployeeModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          if (page !== 1) setPage(1);
          else fetchEmployees();
        }}
      />
      <EditEmployeeModal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, employee: null })}
        employee={editModal.employee}
        onUpdated={fetchEmployees}
      />
      <ResetPasswordModal
        open={resetModal.open}
        onClose={() => setResetModal({ open: false, employee: null })}
        employee={resetModal.employee}
        onReset={fetchEmployees}
      />
      <DeleteEmployeeModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, employee: null })}
        employee={deleteModal.employee}
        onDeleted={fetchEmployees}
      />

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-400 text-lg font-medium">Loading employees...</div>
          </div>
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-2xl border border-gray-800/50">
          <div className="w-16 h-16 rounded-2xl bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-[#4CAF50]" />
          </div>
          <p className="text-lg font-semibold text-white mb-2">No employees found</p>
          <p className="text-sm text-gray-400 mb-6">Get started by adding your first team member</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] text-white rounded-xl hover:shadow-lg hover:shadow-[#4CAF50]/20 transition-all flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add First Employee
          </button>
        </div>
      ) : (
        <DataTable columns={columns} data={employees} />
      )}

      {!loading && pagination.total > 0 && (
        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-xl border border-gray-800/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-400">
            Showing{' '}
            <span className="text-white font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span>{' '}
            to{' '}
            <span className="text-white font-semibold">{Math.min(pagination.total, pagination.page * pagination.limit)}</span>{' '}
            of <span className="text-white font-semibold">{pagination.total}</span> employees
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
