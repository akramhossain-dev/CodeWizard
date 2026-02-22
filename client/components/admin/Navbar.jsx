'use client';

import { useRouter } from 'next/navigation';
import { getAuthUser, clearAuth } from '@/lib/auth';
import { useEffect, useState, useRef } from 'react';
import { ChevronDown, LogOut, User } from 'lucide-react';
import Link from 'next/link';

export default function Navbar({ sidebarCollapsed }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setUser(getAuthUser());
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/cp/login');
  };

  // Only show avatar, no name/email/role
  const displayInitial = (user?.name?.[0] || user?.username?.[0] || user?.email?.[0] || 'A').toUpperCase();
  
  return (
    <nav
      className={`fixed top-0 right-0 h-16 bg-[#1E1E1E] border-b border-gray-800/50 backdrop-blur-sm flex items-center justify-between px-6 z-20 transition-all duration-300 shadow-lg ${
        sidebarCollapsed ? 'left-16' : 'left-64'
      }`}
    >
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Welcome back
          </h2>
          <p className="text-xs text-gray-500">Have a productive day!</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* User Avatar & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#252525] hover:bg-[#2a2a2a] border border-gray-800 transition-all group"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              {displayInitial}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-[#1E1E1E] border border-gray-800 rounded-xl shadow-2xl py-2 animate-in fade-in zoom-in duration-200">
              <div className="px-4 py-3 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {displayInitial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Control Panel</p>
                    <p className="text-xs text-gray-400">Dashboard</p>
                  </div>
                </div>
              </div>
              <div className="py-2">
                <Link
                  href="/cp/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-[#252525] transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <User className="w-4 h-4" />
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
