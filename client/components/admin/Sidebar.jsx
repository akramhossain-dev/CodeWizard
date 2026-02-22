'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  CheckCircle2,
  Users2,
  UserCog,
  Settings2,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Code2
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/cp',
  },
  {
    title: 'Problems',
    icon: FileText,
    href: '/cp/problems',
  },
  {
    title: 'Submissions',
    icon: CheckCircle2,
    href: '/cp/submissions',
  },
  {
    title: 'Contests',
    icon: Trophy,
    href: '/cp/contests',
  },
  {
    title: 'Users',
    icon: Users2,
    href: '/cp/users',
  },
  {
    title: 'Employees',
    icon: UserCog,
    href: '/cp/employees',
  },
  {
    title: 'Settings',
    icon: Settings2,
    href: '/cp/settings',
  },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-[#1E1E1E] to-[#1a1a1a] border-r border-gray-800/50 transition-all duration-300 z-30 shadow-2xl ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800/50 bg-gradient-to-r from-[#252525] to-[#1E1E1E]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] rounded-lg flex items-center justify-center shadow-lg">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">CodeWizard</h1>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-[#252525] hover:bg-[#2a2a2a] border border-gray-800 text-gray-400 hover:text-white transition-all hover:scale-110"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="mt-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] text-white shadow-lg shadow-[#4CAF50]/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#252525]'
              }`}
              title={collapsed ? item.title : ''}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></div>
              )}
              <item.icon className={`w-5 h-5 transition-transform ${
                isActive ? 'scale-110' : 'group-hover:scale-110'
              }`} />
              {!collapsed && (
                <span className="text-sm font-medium">{item.title}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800/50 bg-gradient-to-t from-[#1a1a1a] to-transparent">
          <div className="text-center text-xs text-gray-500">
            <p>© 2026 CodeWizard</p>
            <p className="text-[10px] mt-1">v1.0.0</p>
          </div>
        </div>
      )}
    </aside>
  );
}
