"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Code2, Home, List, Trophy, User, LogOut,
  ChevronDown, Bell, Settings, ExternalLink,
  Flame, Menu, X, Activity
} from "lucide-react";

const navLinks = [
  { href: "/dashboard",          label: "Home",     icon: Home },
  { href: "/dashboard/problems", label: "Problems", icon: List },
  { href: "/dashboard/submissions", label: "Submissions", icon: Activity },
  { href: "/dashboard/contests", label: "Contests", icon: Trophy },
  { href: "/dashboard/profile",  label: "Profile",  icon: User },
];

export default function DashboardLayoutClient({ children }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [user,        setUser]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [mounted,     setMounted]     = useState(false);
  const [dropOpen,    setDropOpen]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [scrolled,    setScrolled]    = useState(false);

  const dropRef = useRef(null);

  // ── Auth & user fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    (async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
        const res  = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setUser(data.user);
        else { localStorage.removeItem("token"); router.push("/login"); }
      } catch {
        localStorage.removeItem("token"); router.push("/login");
      } finally { setLoading(false); }
    })();
  }, [router]);

  // ── Scroll shadow ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Click-outside dropdown ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Close mobile menu on route change ─────────────────────────────────────
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const initial    = (user?.name?.charAt(0) || "U").toUpperCase();
  const profileImg = user?.profileImage || user?.profilePicture;

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center animate-pulse shadow-2xl shadow-blue-500/30">
            <Code2 className="w-7 h-7 text-white" />
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">

      {/* ═══════════════════════════════════ NAVBAR ═══════════════════════════ */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-[#111]/80 backdrop-blur-2xl shadow-lg shadow-black/5 dark:shadow-black/40 border-b border-gray-200/60 dark:border-gray-800/60"
          : "bg-white dark:bg-[#111] border-b border-gray-200 dark:border-gray-800/80"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <Link href="/dashboard" className="group flex items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="font-black text-xl bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
                CodeWizard
              </span>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden md:flex items-center gap-1 bg-gray-100/80 dark:bg-[#1a1a1a] rounded-2xl px-2 py-1.5">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? "bg-white dark:bg-[#252525] text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#252525]/60"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-blue-600 dark:text-blue-400" : ""}`} />
                    {label}
                    {/* Active dot */}
                    {active && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* ── Right Section ── */}
            <div className="flex items-center gap-2">

              {/* User dropdown */}
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropOpen((v) => !v)}
                  className={`flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-2xl border-2 transition-all ${
                    dropOpen
                      ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10"
                      : "border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-[#1a1a1a]"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    {profileImg ? (
                      <img src={profileImg} alt={user.name}
                        className="w-8 h-8 rounded-xl object-cover border-2 border-white dark:border-[#111]" />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-black border-2 border-white dark:border-[#111]">
                        {initial}
                      </div>
                    )}
                    {/* Online dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-[#111]" />
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                      {user.name?.split(" ")[0]}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      @{user.username}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropOpen ? "rotate-180" : ""}`} />
                </button>

                {/* ── Dropdown ── */}
                {dropOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl shadow-black/10 dark:shadow-black/60 overflow-hidden z-50">

                    {/* Profile header */}
                    <div className="px-4 py-4 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-500/10 dark:to-violet-500/10 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        {profileImg ? (
                          <img src={profileImg} alt={user.name}
                            className="w-12 h-12 rounded-2xl object-cover shadow-lg" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                            {initial}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-gray-900 dark:text-white truncate">{user.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username}</div>
                          {user.isVerified && (
                            <div className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold rounded-md border border-green-500/20">
                              ✓ Verified
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Rating pill */}
                      <div className="mt-3 flex items-center justify-between px-3 py-2 bg-white/70 dark:bg-[#252525]/70 rounded-xl border border-white dark:border-gray-700">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Rating</span>
                        <span className="text-sm font-black text-amber-500">
                          {user.rating ?? 0}
                        </span>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-2">
                      <Link href="/dashboard/profile"
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                          <User className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">Profile</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">View & edit profile</div>
                        </div>
                      </Link>

                      <div className="my-1.5 border-t border-gray-100 dark:border-gray-800" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                          <LogOut className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-semibold text-red-500">Logout</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Sign out of account</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* ── Mobile Menu ── */}
          {mobileOpen && (
            <div className="md:hidden py-3 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col gap-1">
                {navLinks.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        active
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        active ? "bg-blue-500/10 border border-blue-500/20" : "bg-gray-100 dark:bg-[#1a1a1a]"
                      }`}>
                        <Icon className={`w-4 h-4 ${active ? "text-blue-500" : "text-gray-500"}`} />
                      </div>
                      {label}
                      {active && <span className="ml-auto w-2 h-2 rounded-full bg-blue-500" />}
                    </Link>
                  );
                })}

                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <LogOut className="w-4 h-4 text-red-500" />
                    </div>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ═══════════════════════════════ MAIN CONTENT ═════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
