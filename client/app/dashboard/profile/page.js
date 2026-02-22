"use client";
import { useState, useEffect } from "react";
import { getRatingDisplay, getRatingTier } from "@/lib/rating";
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Edit3,
  CheckCircle,
  Code,
  TrendingUp,
  Trophy,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Briefcase,
  GraduationCap,
  Star,
  Target,
  Shield,
  Clock,
  ChevronRight,
  Activity,
  BarChart2,
  AlertCircle,
  Lock,
  Camera,
  Zap,
} from "lucide-react";
import EditProfileModal from "@/components/dashboard/EditProfileModal";
import ProfileImageUpload from "@/components/dashboard/ProfileImageUpload";
import ChangePasswordModal from "@/components/dashboard/ChangePasswordModal";


export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [imgModalOpen, setImgModalOpen] = useState(false);
  const [passModalOpen, setPassModalOpen] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    setMounted(true);
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem("token");
      const userRes = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      if (userData.success) {
        setUser(userData.user);
        setStats({
          solvedProblems: userData.user.stats?.solved ?? 0,
          attempted: userData.user.stats?.attempted ?? 0,
          easySolved: userData.user.stats?.easySolved ?? 0,
          mediumSolved: userData.user.stats?.mediumSolved ?? 0,
          hardSolved: userData.user.stats?.hardSolved ?? 0,
          acceptanceRate:
            userData.user.stats && userData.user.stats.attempted > 0
              ? Math.round((userData.user.stats.solved / userData.user.stats.attempted) * 100)
              : 0,
          rank: userData.user.rank ?? 0,
          rating: userData.user.rating ?? 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse shadow-2xl shadow-blue-500/30">
            <Code className="w-7 h-7 text-white" />
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayInitial = (user?.name?.charAt(0) || "U").toUpperCase();
  const profileImg = user?.profileImage || user?.profilePicture;
  const rating = stats?.rating ?? 0;
  const ratingDisplay = getRatingDisplay(rating);
  const tier = getRatingTier(rating);

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently";
  const lastLoginDate = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "N/A";
  const dob = user?.dateOfBirth
    ? new Date(user.dateOfBirth).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const totalProblems = (stats?.easySolved ?? 0) + (stats?.mediumSolved ?? 0) + (stats?.hardSolved ?? 0);
  const easyPct = totalProblems > 0 ? Math.round((stats.easySolved / totalProblems) * 100) : 0;
  const medPct = totalProblems > 0 ? Math.round((stats.mediumSolved / totalProblems) * 100) : 0;
  const hardPct = totalProblems > 0 ? Math.round((stats.hardSolved / totalProblems) * 100) : 0;

  const handleSaveProfile = async (form) => {
    const payload = {
      name: form.name,
      location: form.location,
      bio: form.bio,
      socialLinks: { website: form.website, github: form.github, linkedin: form.linkedin, twitter: form.twitter },
      work: { company: form.company, position: form.position, startDate: form.workStartDate || undefined, endDate: form.workPresent ? undefined : form.workEndDate || undefined, present: !!form.workPresent },
      education: { institution: form.institution, degree: form.degree, fieldOfStudy: form.fieldOfStudy, startDate: form.eduStartDate || undefined, endDate: form.eduPresent ? undefined : form.eduEndDate || undefined, present: !!form.eduPresent },
      skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
      interests: form.interests ? form.interests.split(",").map((s) => s.trim()).filter(Boolean) : [],
    };
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setStats({ solvedProblems: data.user.stats?.solved ?? 0, attempted: data.user.stats?.attempted ?? 0, easySolved: data.user.stats?.easySolved ?? 0, mediumSolved: data.user.stats?.mediumSolved ?? 0, hardSolved: data.user.stats?.hardSolved ?? 0, acceptanceRate: data.user.stats && data.user.stats.attempted > 0 ? Math.round((data.user.stats.solved / data.user.stats.attempted) * 100) : 0, rank: data.user.rank ?? 0, rating: data.user.rating ?? 0 });
      }
    } catch (err) { console.error("Update failed:", err); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">

        {/* ── HERO CARD ── */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-xl">
          {/* Banner */}
          <div className="relative h-28 sm:h-40 bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700 overflow-hidden">
            <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full" />
            <div className="absolute -bottom-12 -right-12 w-72 h-72 bg-purple-400/20 rounded-full" />
            <div className="absolute bottom-0 right-0 flex items-end gap-1 p-4 opacity-30">
              {[16, 24, 32, 20, 28, 36, 22].map((h, i) => (
                <div key={i} className="w-1.5 bg-white rounded-t-full" style={{ height: h }} />
              ))}
            </div>
          </div>

          <div className="px-4 sm:px-6 md:px-10 pb-5 sm:pb-8">
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6 -mt-14 sm:-mt-[4.5rem]">
              {/* Avatar */}
              <div className="shrink-0 relative group">
                {profileImg ? (
                  <img src={profileImg} alt="Profile"
                    className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl object-cover border-4 border-white dark:border-[#111] shadow-2xl" />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-black shadow-2xl border-4 border-white dark:border-[#111]">
                    {displayInitial}
                  </div>
                )}
                <button
                  onClick={() => setImgModalOpen(true)}
                  className="absolute inset-0 rounded-2xl bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-white text-xs font-bold">Change</span>
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 pt-1 md:pt-[4.5rem]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
                        {user?.name || "User"}
                      </h1>
                      {user?.isVerified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold rounded-full border border-green-500/20">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      )}
                      {user?.isBanned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded-full border border-red-500/20">
                          <AlertCircle className="w-3 h-3" /> Banned
                        </span>
                      )}
                    </div>

                    <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm mt-0.5">
                      @{user?.username || "username"}
                    </p>

                    <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm leading-relaxed max-w-xl">
                      {user?.bio || (
                        <span className="italic text-gray-400 dark:text-gray-600">
                          No bio yet — click Edit Profile to add one.
                        </span>
                      )}
                    </p>

                    <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-500" />{user?.email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-400" />{user?.location || "Not set"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />Joined {joinedDate}
                      </span>
                      <span className="flex items-center gap-1.5 capitalize">
                        <User className="w-3.5 h-3.5 text-orange-400" />{user?.gender || "Not set"}
                      </span>
                    </div>

                    {/* Social icons */}
                    <div className="flex gap-2 mt-3">
                      {[
                        { key: "github", icon: Github, href: user?.socialLinks?.github, hoverBg: "hover:bg-gray-900 hover:text-white" },
                        { key: "linkedin", icon: Linkedin, href: user?.socialLinks?.linkedin, hoverBg: "hover:bg-blue-600 hover:text-white" },
                        { key: "twitter", icon: Twitter, href: user?.socialLinks?.twitter, hoverBg: "hover:bg-sky-500 hover:text-white" },
                        { key: "website", icon: Globe, href: user?.socialLinks?.website, hoverBg: "hover:bg-purple-600 hover:text-white" },
                      ].filter(s => s.href).map((s) => (
                        <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer"
                          className={`p-2.5 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800 transition-all hover:scale-110 ${s.hoverBg}`}>
                          <s.icon className="w-4 h-4" />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button onClick={() => setEditOpen(true)}
                      className="group flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-105">
                      <Edit3 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      Edit Profile
                    </button>
                    <button onClick={() => setPassModalOpen(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#252525] rounded-xl border border-gray-200 dark:border-gray-800 transition-all">
                      <Lock className="w-4 h-4" />
                      Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

            {/* ── RATING CARD ── */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm overflow-hidden">
              <div className={`relative bg-gradient-to-br ${tier.color} p-6 text-white overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-white/80" />
                    <span className="text-sm font-semibold text-white/80">Current Rating</span>
                  </div>
                  <div className={`text-4xl sm:text-6xl font-black tracking-tight ${ratingDisplay.color}`}>
                    {ratingDisplay.label}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full">
                    <span className="text-base">{tier.badge}</span>
                    <span className="text-sm font-bold">{tier.name}</span>
                  </div>
                </div>
              </div>

              {/* Acceptance only — no rank */}
              <div className="p-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Acceptance Rate
                  </div>
                  <span className="text-lg font-black text-gray-900 dark:text-white">
                    {stats?.acceptanceRate ?? 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* ── ACCOUNT DETAILS ── */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-blue-500" />Account Details
              </h3>
              <div className="space-y-0 text-sm divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  {
                    label: "Status",
                    value: user?.isVerified
                      ? <span className="flex items-center gap-1 text-green-500 font-bold"><CheckCircle className="w-3.5 h-3.5" />Verified</span>
                      : <span className="text-orange-500 font-bold">Unverified</span>
                  },
                  {
                    label: "Account",
                    value: user?.isBanned
                      ? <span className="text-red-500 font-bold">Banned</span>
                      : <span className="text-emerald-500 font-bold">Active</span>
                  },
                  { label: "Joined", value: joinedDate },
                  { label: "Last Login", value: lastLoginDate },
                  { label: "Birthday", value: dob || "Not set" },
                  { label: "Gender", value: <span className="capitalize">{user?.gender || "Not set"}</span> },
                  { label: "Rank", value: stats?.rank || 0 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── WORK ── */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-purple-500" />Work Experience
              </h3>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">{user?.work?.position || "Not set"}</div>
                  <div className="text-blue-600 dark:text-blue-400 font-semibold text-xs">{user?.work?.company || "Not set"}</div>
                  {(user?.work?.startDate || user?.work?.present || user?.work?.endDate) ? (
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {user.work.startDate ? new Date(user.work.startDate).getFullYear() : "?"} —{" "}
                      {user.work.present ? <span className="text-green-500 font-semibold">Present</span>
                        : user.work.endDate ? new Date(user.work.endDate).getFullYear() : "?"}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 mt-1">Not set</div>
                  )}
                </div>
              </div>
            </div>

            {/* ── EDUCATION ── */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <GraduationCap className="w-4 h-4 text-green-500" />Education
              </h3>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">{user?.education?.degree || "Not set"}</div>
                  <div className="text-blue-600 dark:text-blue-400 font-semibold text-xs">{user?.education?.institution || "Not set"}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{user?.education?.fieldOfStudy || "Not set"}</div>
                  {(user?.education?.startDate || user?.education?.present || user?.education?.endDate) ? (
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {user.education.startDate ? new Date(user.education.startDate).getFullYear() : "?"} —{" "}
                      {user.education.present ? <span className="text-green-500 font-semibold">Present</span>
                        : user.education.endDate ? new Date(user.education.endDate).getFullYear() : "?"}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 mt-1">Not set</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* ── STAT TILES ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[
                { icon: Code, label: "Solved", value: stats?.solvedProblems ?? 0, iconBg: "bg-blue-500/10", iconColor: "text-blue-500", border: "hover:border-blue-400" },
                { icon: Target, label: "Attempted", value: stats?.attempted ?? 0, iconBg: "bg-violet-500/10", iconColor: "text-violet-500", border: "hover:border-violet-400" },
                { icon: TrendingUp, label: "Acceptance", value: `${stats?.acceptanceRate ?? 0}%`, iconBg: "bg-green-500/10", iconColor: "text-green-500", border: "hover:border-green-400" },
                { icon: Zap, label: "Rating", value: ratingDisplay.label, iconBg: "bg-orange-500/10", iconColor: "text-orange-500", border: "hover:border-orange-400" },
              ].map((card, i) => (
                <div key={i}
                  className={`group relative rounded-2xl border border-gray-200 dark:border-gray-800 ${card.border} bg-white dark:bg-[#111] shadow-sm p-3 sm:p-5 transition-all hover:scale-105 hover:shadow-lg cursor-default`}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${card.iconBg} flex items-center justify-center mb-2 sm:mb-3`}>
                    <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.iconColor}`} />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{card.value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-semibold">{card.label}</div>
                </div>
              ))}
            </div>

            {/* ── PROBLEM BREAKDOWN ── */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm p-4 sm:p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 sm:mb-5 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-500" />Problem Breakdown
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
                {[
                  { label: "Easy", value: stats?.easySolved ?? 0, color: "text-green-500", bg: "bg-green-500/8", border: "border-green-500/20", bar: "bg-green-500", pct: easyPct },
                  { label: "Medium", value: stats?.mediumSolved ?? 0, color: "text-orange-500", bg: "bg-orange-500/8", border: "border-orange-500/20", bar: "bg-orange-500", pct: medPct },
                  { label: "Hard", value: stats?.hardSolved ?? 0, color: "text-red-500", bg: "bg-red-500/8", border: "border-red-500/20", bar: "bg-red-500", pct: hardPct },
                ].map((d) => (
                  <div key={d.label} className={`rounded-xl p-2.5 sm:p-4 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 text-center`}>
                    <div className={`text-2xl sm:text-3xl font-black ${d.color}`}>{d.value}</div>
                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">{d.label}</div>
                    <div className="mt-3 w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${d.bar} rounded-full transition-all duration-700`} style={{ width: `${d.pct}%` }} />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{d.pct}%</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  <span>Total Progress</span>
                  <span>{totalProblems} solved</span>
                </div>
                <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 gap-0.5">
                  {easyPct > 0 && <div className="bg-green-500" style={{ width: `${easyPct}%` }} />}
                  {medPct > 0 && <div className="bg-orange-500" style={{ width: `${medPct}%` }} />}
                  {hardPct > 0 && <div className="bg-red-500" style={{ width: `${hardPct}%` }} />}
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  {[["bg-green-500", "Easy"], ["bg-orange-500", "Medium"], ["bg-red-500", "Hard"]].map(([cls, lbl]) => (
                    <span key={lbl} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full inline-block ${cls}`} />{lbl}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── SKILLS & INTERESTS ── */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm p-4 sm:p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />Skills & Interests
              </h3>
              <div className="mb-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Skills</div>
                {user?.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((s, i) => (
                      <span key={i} className="px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold rounded-xl border border-blue-500/20">{s}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Not set</p>
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Interests</div>
                {user?.interests?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((s, i) => (
                      <span key={i} className="px-3 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-semibold rounded-xl border border-purple-500/20">{s}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Not set</p>
                )}
              </div>
            </div>

            {/* ── SOCIAL LINKS ── */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm p-4 sm:p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />Social Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: "GitHub", icon: Github, value: user?.socialLinks?.github, color: "text-gray-700 dark:text-gray-200", bg: "bg-gray-50 dark:bg-[#1a1a1a]", border: "border-gray-200 dark:border-gray-800", hover: "hover:bg-gray-900 dark:hover:bg-gray-100 hover:border-gray-900 hover:text-white dark:hover:text-gray-900" },
                  { label: "LinkedIn", icon: Linkedin, value: user?.socialLinks?.linkedin, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-100 dark:border-blue-500/20", hover: "hover:bg-blue-600 hover:text-white hover:border-blue-600" },
                  { label: "Twitter / X", icon: Twitter, value: user?.socialLinks?.twitter, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-500/10", border: "border-sky-100 dark:border-sky-500/20", hover: "hover:bg-sky-500 hover:text-white hover:border-sky-500" },
                  { label: "Website", icon: Globe, value: user?.socialLinks?.website, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-100 dark:border-purple-500/20", hover: "hover:bg-purple-600 hover:text-white hover:border-purple-600" },
                ].map((s, i) => (
                  s.value ? (
                    <a key={i} href={s.value} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${s.bg} ${s.border} ${s.hover} transition-all group`}>
                      <s.icon className={`w-5 h-5 ${s.color} group-hover:text-current transition-colors shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-400 group-hover:text-inherit">{s.label}</div>
                        <div className={`text-sm font-semibold truncate ${s.color}`}>
                          {s.value.replace(/https?:\/\/(www\.)?/, "")}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-current shrink-0" />
                    </a>
                  ) : (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 opacity-40 select-none">
                      <s.icon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-400">No {s.label} linked</span>
                    </div>
                  )
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      <EditProfileModal
        key={`${user?._id || "user"}-${editOpen ? "open" : "closed"}`}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        onSave={handleSaveProfile}
      />

      <ProfileImageUpload
        open={imgModalOpen}
        onClose={() => setImgModalOpen(false)}
        currentImage={profileImg}
        onUpload={async (file) => {
          const formData = new FormData();
          formData.append("profilePicture", file);
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/auth/profile-picture`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            });
            const data = await res.json();
            if (data.success) {
              setUser((u) => ({ ...u, profileImage: data.profileImage }));
              return { success: true };
            }
            return { success: false, message: data.message };
          } catch {
            return { success: false, message: "Upload failed." };
          }
        }}
      />

      <ChangePasswordModal
        open={passModalOpen}
        onClose={() => setPassModalOpen(false)}
        onSave={async ({ currentPassword, newPassword }) => {
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/auth/change-password`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            return data.success ? { success: true } : { success: false, message: data.message };
          } catch {
            return { success: false, message: "Password change failed." };
          }
        }}
      />
    </div>
  );
}
