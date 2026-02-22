'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI, employeeAPI } from '@/lib/api';
import { setAuthToken, setAuthUser } from '@/lib/auth';
import { Lock, Mail, Shield, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loginType, setLoginType] = useState('admin'); // 'admin' or 'employee'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      
      if (loginType === 'admin') {
        response = await adminAPI.signin(formData);
        if (response.success) {
          setAuthToken(response.token);
          setAuthUser(response.admin);
          router.push('/cp');
        }
      } else {
        // Employee login - map email to employeeEmail
        const empLoginData = { 
          email: formData.email,
          employeeEmail: formData.email,
          password: formData.password 
        };
        response = await employeeAPI.signin(empLoginData);
        if (response.success) {
          setAuthToken(response.token);
          setAuthUser(response.employee);
          router.push('/cp');
        }
      }
      
      if (!response.success) {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4CAF50]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#1E88E5]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FFC107]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] mb-6 shadow-lg shadow-[#4CAF50]/20">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-gray-400 text-lg">Sign in to access your dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-2xl border border-gray-800/50 p-8 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom duration-500">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm animate-in fade-in slide-in-from-top duration-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Type Toggle */}
            <div className="flex justify-center">
              <div className="inline-flex rounded-xl bg-[#252525] border border-gray-800 p-1">
                <button
                  type="button"
                  onClick={() => setLoginType('admin')}
                  className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
                    loginType === 'admin'
                      ? 'bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] text-white shadow-lg shadow-[#4CAF50]/20'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('employee')}
                  className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
                    loginType === 'employee'
                      ? 'bg-gradient-to-r from-[#1E88E5] to-[#1565C0] text-white shadow-lg shadow-[#1E88E5]/20'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Employee
                </button>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-300">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-[#4CAF50] transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#4CAF50]/50 focus:ring-2 focus:ring-[#4CAF50]/20 transition-all"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-300">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-[#4CAF50] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-12 py-3.5 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#4CAF50]/50 focus:ring-2 focus:ring-[#4CAF50]/20 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[#4CAF50] rounded cursor-pointer"
                />
                <span className="text-gray-400 group-hover:text-gray-300 transition-colors">
                  Remember me
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#4CAF50]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-br from-[#1E1E1E] to-[#252525] text-gray-500">
                Secure Access
              </span>
            </div>
          </div>

          {/* Security Features */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#252525]/50 border border-gray-800/50">
              <div className="w-8 h-8 rounded-lg bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#4CAF50]" />
              </div>
              <span className="text-xs text-gray-400 text-center">Encrypted</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#252525]/50 border border-gray-800/50">
              <div className="w-8 h-8 rounded-lg bg-[#1E88E5]/10 border border-[#1E88E5]/20 flex items-center justify-center">
                <Lock className="w-4 h-4 text-[#1E88E5]" />
              </div>
              <span className="text-xs text-gray-400 text-center">Protected</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#252525]/50 border border-gray-800/50">
              <div className="w-8 h-8 rounded-lg bg-[#FFC107]/10 border border-[#FFC107]/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#FFC107] animate-pulse"></div>
              </div>
              <span className="text-xs text-gray-400 text-center">24/7 Active</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            © 2024 Admin Panel. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}