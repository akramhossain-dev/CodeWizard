'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import Sidebar from '@/components/admin/Sidebar';
import Navbar from '@/components/admin/Navbar';

export default function CpLayoutClient({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    if (pathname !== '/cp/login' && !isAuthenticated()) {
      router.push('/cp/login');
    } else if (pathname === '/cp/login' && isAuthenticated()) {
      router.push('/cp');
    } else {
      setLoading(false);
    }
  }, [pathname, router]);

  // Don't show layout on login page
  if (pathname === '/cp/login') {
    return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Navbar sidebarCollapsed={collapsed} />
      
      <main
        className={`pt-16 transition-all duration-300 ${
          collapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
