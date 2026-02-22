'use client';

import { useState, useEffect } from 'react';
import { getAuthUser, isAdmin, isEmployee } from '@/lib/auth';
import { getAPI } from '@/lib/api';
import { User, Mail, Shield, Lock, KeyRound, Activity, Calendar, MapPin, AlertCircle, CheckCircle2, Eye, EyeOff, X } from 'lucide-react';

function ChangePasswordModal({ open, onClose, userType }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!open) {
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setError('');
      setSuccess('');
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const api = getAPI();
      await api.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      setSuccess('Password changed successfully');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

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
          <div className="w-12 h-12 rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-[#4CAF50]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Change Password</h2>
            <p className="text-sm text-gray-400">Update your account password</p>
          </div>
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
            <label className="block text-gray-400 text-sm font-medium mb-2">Current Password</label>
            <input
              type={showPasswords.current ? "text" : "password"}
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              required
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-[#4CAF50]/50 focus:ring-2 focus:ring-[#4CAF50]/20 transition-all outline-none pr-12"
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
              className="absolute top-9 right-4 text-gray-400 hover:text-[#4CAF50] focus:outline-none"
              tabIndex={-1}
            >
              {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <label className="block text-gray-400 text-sm font-medium mb-2">New Password</label>
            <input
              type={showPasswords.new ? "text" : "password"}
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-[#4CAF50]/50 focus:ring-2 focus:ring-[#4CAF50]/20 transition-all outline-none pr-12"
              placeholder="Enter new password (min 6 characters)"
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
              className="absolute top-9 right-4 text-gray-400 hover:text-[#4CAF50] focus:outline-none"
              tabIndex={-1}
            >
              {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <label className="block text-gray-400 text-sm font-medium mb-2">Confirm New Password</label>
            <input
              type={showPasswords.confirm ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-[#4CAF50]/50 focus:ring-2 focus:ring-[#4CAF50]/20 transition-all outline-none pr-12"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
              className="absolute top-9 right-4 text-gray-400 hover:text-[#4CAF50] focus:outline-none"
              tabIndex={-1}
            >
              {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#4CAF50]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const type = isAdmin() ? 'admin' : isEmployee() ? 'employee' : null;
        setUserType(type);

        if (!type) {
          setLoading(false);
          return;
        }

        const api = getAPI();
        
        // Fetch profile
        const profileData = await api.getProfile();
        
        // Extract the actual profile data from response
        if (type === 'admin') {
          setProfile(profileData.admin);
        } else {
          setProfile(profileData.employee);
        }

        // Fetch stats (employee has stats endpoint)
        if (type === 'employee') {
          try {
            const statsData = await api.getStats();
            setStats(statsData.stats);
          } catch (err) {
            console.log('No stats available');
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-400 text-lg font-medium">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E1E1E] via-[#252525] to-[#1E1E1E] border border-gray-800/50 p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#4CAF50]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1E88E5]/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-gray-400">Manage your account settings and preferences</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              userType === 'admin' 
                ? 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20' 
                : 'bg-[#1E88E5]/10 text-[#1E88E5] border-[#1E88E5]/20'
            }`}>
              <Shield className="w-3 h-3" />
              {userType === 'admin' ? 'Administrator' : 'Employee'}
            </span>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-2xl border border-gray-800/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#1E88E5]/10 border border-[#1E88E5]/20 flex items-center justify-center">
              <User className="w-5 h-5 text-[#1E88E5]" />
            </div>
            <h2 className="text-xl font-semibold text-white">Profile Information</h2>
          </div>
          <div className="space-y-4">
            {/* Admin: view only */}
            {userType === 'admin' && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">Name</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-white">{profile?.name}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">Email</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-white">{profile?.email}</span>
                  </div>
                </div>
                {profile?.username && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-medium">Username</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-white">@{profile.username}</span>
                    </div>
                  </div>
                )}
                {profile?.createdAt && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-medium">Member Since</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-white">
                        {new Date(profile.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
            {/* Employee: editable */}
            {userType === 'employee' && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">Name</label>
                  <input
                    type="text"
                    value={profile?.employeeName || ''}
                    readOnly={true}
                    className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">Email</label>
                  <input
                    type="email"
                    value={profile?.employeeEmail || ''}
                    readOnly={true}
                    className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white"
                  />
                </div>
                {profile?.role && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-medium">Role</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <span className="text-white capitalize">{profile.role.replace('_', ' ')}</span>
                    </div>
                  </div>
                )}
                {profile?.createdAt && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-medium">Member Since</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-white">
                        {new Date(profile.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-2xl border border-gray-800/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#4CAF50]" />
            </div>
            <h2 className="text-xl font-semibold text-white">Security</h2>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-[#252525] hover:bg-[#4CAF50]/10 hover:border-[#4CAF50]/50 border border-gray-800 rounded-xl text-gray-300 hover:text-white transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center group-hover:bg-[#4CAF50]/20">
                <KeyRound className="w-4 h-4 text-[#4CAF50]" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">Change Password</div>
                <div className="text-xs text-gray-500">Update your account password</div>
              </div>
            </button>

            <div className="flex items-center gap-3 px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-[#1E88E5]/10 border border-[#1E88E5]/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-[#1E88E5]" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-white">Account Status</div>
                <div className="text-xs text-gray-400 mt-1">
                  {profile?.isActive ? (
                    <span className="text-[#4CAF50]">● Active</span>
                  ) : (
                    <span className="text-gray-500">● Inactive</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Stats */}
        {userType === 'employee' && stats && (
          <div className="lg:col-span-2 bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-2xl border border-gray-800/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#FFC107]/10 border border-[#FFC107]/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#FFC107]" />
              </div>
              <h2 className="text-xl font-semibold text-white">Your Statistics</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#252525] border border-gray-800 rounded-xl">
                <div className="text-gray-400 text-sm mb-1">Problems Created</div>
                <div className="text-2xl font-bold text-white">{stats.problemsCreated || 0}</div>
              </div>
              
              <div className="p-4 bg-[#252525] border border-gray-800 rounded-xl">
                <div className="text-gray-400 text-sm mb-1">Published Problems</div>
                <div className="text-2xl font-bold text-[#4CAF50]">{stats.problemsPublished || 0}</div>
              </div>
              
              <div className="p-4 bg-[#252525] border border-gray-800 rounded-xl">
                <div className="text-gray-400 text-sm mb-1">Total Submissions</div>
                <div className="text-2xl font-bold text-[#1E88E5]">{stats.totalSubmissions || 0}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        userType={userType}
      />
    </div>
  );
}
