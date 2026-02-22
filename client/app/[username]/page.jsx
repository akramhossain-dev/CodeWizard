import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getRatingDisplay, getRatingTier } from "@/lib/rating";
import { notFound } from "next/navigation";
import {
    MapPin, Calendar, User, CheckCircle, AlertCircle, Github, Linkedin, Twitter, Globe, Trophy, TrendingUp, Star, Target, Zap, BarChart2, Briefcase, GraduationCap, Shield, Clock, ChevronRight, Code
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

export default async function UserProfilePage({ params }) {
  const { username } = await params;

  if (!username) {
    notFound();
  }

  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL or API_URL");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/auth/user/${encodeURIComponent(username)}`,
    { cache: "no-store" }
  );

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error(`Failed to load profile (${response.status})`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Invalid profile response");
  }

  const user = payload?.user;
  if (!user) {
    notFound();
  }

  const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Recently";
  const lastLoginDate = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";
  const profileImg = user.profileImage || user.profilePicture;
  const stats = user.stats || {};
  const rating = user.rating ?? 0;
  const ratingDisplay = getRatingDisplay(rating);
  const tier = getRatingTier(rating);
  const totalProblems = (stats.easySolved ?? 0) + (stats.mediumSolved ?? 0) + (stats.hardSolved ?? 0);
  const easyPct = totalProblems > 0 ? Math.round((stats.easySolved / totalProblems) * 100) : 0;
  const medPct = totalProblems > 0 ? Math.round((stats.mediumSolved / totalProblems) * 100) : 0;
  const hardPct = totalProblems > 0 ? Math.round((stats.hardSolved / totalProblems) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950">
      <Navbar />
      
      <main className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full">
        {/* HERO CARD */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800/50 shadow-xl mb-8">
          <div className="relative h-40 bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700 overflow-hidden">
            <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full" />
            <div className="absolute -bottom-12 -right-12 w-72 h-72 bg-purple-400/20 rounded-full" />
            <div className="absolute bottom-0 right-0 flex items-end gap-1 p-4 opacity-30">
              {[16, 24, 32, 20, 28, 36, 22].map((h, i) => (
                <div key={i} className="w-1.5 bg-white rounded-t-full" style={{ height: h }} />
              ))}
            </div>
          </div>

          <div className="px-6 md:px-10 pb-8">
            <div className="flex flex-col md:flex-row gap-6 -mt-[4.5rem] items-start md:items-center">
              {/* Avatar */}
              <div className="shrink-0 relative">
                {profileImg ? (
                  <img src={profileImg} alt="Profile" className="w-32 h-32 md:w-36 md:h-36 rounded-2xl object-cover border-4 border-white dark:border-slate-800 shadow-2xl" />
                ) : (
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl border-4 border-white dark:border-slate-800">
                    {(user.name?.charAt(0) || user.username?.charAt(0) || "U").toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 pt-0 md:pt-[4.5rem]">
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
                        {user.name || user.username}
                      </h1>
                      {user.isVerified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold rounded-full border border-green-500/20">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      )}
                      {user.isBanned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded-full border border-red-500/20">
                          <AlertCircle className="w-3 h-3" /> Banned
                        </span>
                      )}
                    </div>
                    <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm">@{user.username}</p>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-xl">
                    {user.bio || <span className="italic text-gray-400 dark:text-gray-600">No bio yet.</span>}
                  </p>

                  <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                    {user.location && (
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-400" />{user.location}</span>
                    )}
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-purple-400" />Joined {joinedDate}</span>
                    {user.gender && (
                      <span className="flex items-center gap-1.5 capitalize"><User className="w-3.5 h-3.5 text-orange-400" />{user.gender}</span>
                    )}
                  </div>

                  {/* Social icons */}
                  <div className="flex gap-2">
                    {[
                      { key: "github", icon: Github, href: user?.socialLinks?.github },
                      { key: "linkedin", icon: Linkedin, href: user?.socialLinks?.linkedin },
                      { key: "twitter", icon: Twitter, href: user?.socialLinks?.twitter },
                      { key: "website", icon: Globe, href: user?.socialLinks?.website },
                    ].filter(s => s.href).map((s) => {
                      const Icon = s.icon;
                      return (
                        <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-600 transition-all hover:scale-110 hover:bg-gray-200 dark:hover:bg-slate-600">
                          <Icon className="w-4 h-4" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-5">
            {/* RATING CARD */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800/50 shadow-sm overflow-hidden">
              <div className={`relative bg-gradient-to-br ${tier.color} p-6 text-white overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-white/80" />
                    <span className="text-sm font-semibold text-white/80">Current Rating</span>
                  </div>
                  <div className={`text-6xl font-black tracking-tight ${ratingDisplay.color}`}>{ratingDisplay.label}</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full">
                    <span className="text-base">{tier.badge}</span>
                    <span className="text-sm font-bold">{tier.name}</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <TrendingUp className="w-4 h-4 text-green-500" />Acceptance Rate
                  </div>
                  <span className="text-lg font-black text-gray-900 dark:text-white">{stats.acceptanceRate ?? 0}%</span>
                </div>
              </div>
            </div>

            {/* ACCOUNT DETAILS */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800/50 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-blue-500" />Account Details
              </h3>
              <div className="space-y-0 text-sm divide-y divide-gray-100 dark:divide-gray-700">
                {[
                  { label: "Status", value: user.isVerified ? <span className="flex items-center gap-1 text-green-500 font-bold"><CheckCircle className="w-3.5 h-3.5" />Verified</span> : <span className="text-orange-500 font-bold">Unverified</span> },
                  { label: "Account", value: user.isBanned ? <span className="text-red-500 font-bold">Banned</span> : <span className="text-emerald-500 font-bold">Active</span> },
                  { label: "Joined", value: joinedDate },
                  { label: "Last Login", value: lastLoginDate },
                  ...(user.gender ? [{ label: "Gender", value: <span className="capitalize">{user.gender}</span> }] : []),
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* WORK */}
            {(user.work?.company || user.work?.position) && (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800/50 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-purple-500" />Work Experience
                </h3>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm">{user.work.position || "Employee"}</div>
                    <div className="text-blue-600 dark:text-blue-400 font-semibold text-xs">{user.work.company}</div>
                    {(user.work.startDate || user.work.present) && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {user.work.startDate ? new Date(user.work.startDate).getFullYear() : "?"} — {user.work.present ? <span className="text-green-500 font-semibold">Present</span> : user.work.endDate ? new Date(user.work.endDate).getFullYear() : "?"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* EDUCATION */}
            {(user.education?.institution || user.education?.degree) && (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800/50 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                  <GraduationCap className="w-4 h-4 text-green-500" />Education
                </h3>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm">{user.education.degree || "Student"}</div>
                    <div className="text-blue-600 dark:text-blue-400 font-semibold text-xs">{user.education.institution}</div>
                    {user.education.fieldOfStudy && (
                      <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{user.education.fieldOfStudy}</div>
                    )}
                    {(user.education.startDate || user.education.present) && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {user.education.startDate ? new Date(user.education.startDate).getFullYear() : "?"} — {user.education.present ? <span className="text-green-500 font-semibold">Present</span> : user.education.endDate ? new Date(user.education.endDate).getFullYear() : "?"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-5">
            {/* STAT TILES */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Code, label: "Solved", value: stats.solved ?? stats.solvedProblems ?? 0, iconBg: "bg-blue-500/10", iconColor: "text-blue-500" },
                { icon: Target, label: "Attempted", value: stats.attempted ?? 0, iconBg: "bg-violet-500/10", iconColor: "text-violet-500" },
                { icon: TrendingUp, label: "Acceptance", value: `${stats.acceptanceRate ?? 0}%`, iconBg: "bg-green-500/10", iconColor: "text-green-500" },
                { icon: Zap, label: "Rating", value: ratingDisplay.label, iconBg: "bg-orange-500/10", iconColor: "text-orange-500" },
              ].map((card, i) => {
                const CardIcon = card.icon;
                return (
                  <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800/50 shadow-sm p-5 hover:shadow-lg hover:scale-105 transition-all">
                    <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center mb-3`}>
                      <CardIcon className={`w-5 h-5 ${card.iconColor}`} />
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{card.value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-semibold">{card.label}</div>
                  </div>
                );
              })}
            </div>

            {/* PROBLEM BREAKDOWN */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800/50 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-500" />Problem Breakdown
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Easy", value: stats.easySolved ?? 0, color: "text-green-500", bar: "bg-green-500", pct: easyPct },
                  { label: "Medium", value: stats.mediumSolved ?? 0, color: "text-orange-500", bar: "bg-orange-500", pct: medPct },
                  { label: "Hard", value: stats.hardSolved ?? 0, color: "text-red-500", bar: "bg-red-500", pct: hardPct },
                ].map((d) => (
                  <div key={d.label} className="rounded-xl p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-center">
                    <div className={`text-3xl font-black ${d.color}`}>{d.value}</div>
                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">{d.label}</div>
                    <div className="mt-3 w-full h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
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
                <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-800 gap-0.5">
                  {easyPct > 0 && <div className="bg-green-500" style={{ width: `${easyPct}%` }} />}
                  {medPct > 0 && <div className="bg-orange-500" style={{ width: `${medPct}%` }} />}
                  {hardPct > 0 && <div className="bg-red-500" style={{ width: `${hardPct}%` }} />}
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  {[['bg-green-500', 'Easy'], ['bg-orange-500', 'Medium'], ['bg-red-500', 'Hard']].map(([cls, lbl]) => (
                    <span key={lbl} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full inline-block ${cls}`} />{lbl}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* SKILLS & INTERESTS */}
            {(user.skills?.length > 0 || user.interests?.length > 0) && (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800/50 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />Skills & Interests
                </h3>
                {user.skills?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Skills</div>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((s, i) => (
                        <span key={i} className="px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold rounded-xl border border-blue-500/20">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {user.interests?.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Interests</div>
                    <div className="flex flex-wrap gap-2">
                      {user.interests.map((s, i) => (
                        <span key={i} className="px-3 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-semibold rounded-xl border border-purple-500/20">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SOCIAL LINKS */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800/50 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />Social Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: "GitHub", icon: Github, value: user?.socialLinks?.github, color: "text-gray-700 dark:text-gray-200" },
                  { label: "LinkedIn", icon: Linkedin, value: user?.socialLinks?.linkedin, color: "text-blue-600 dark:text-blue-400" },
                  { label: "Twitter / X", icon: Twitter, value: user?.socialLinks?.twitter, color: "text-sky-500" },
                  { label: "Website", icon: Globe, value: user?.socialLinks?.website, color: "text-purple-600 dark:text-purple-400" },
                ].map((s, i) => {
                  const SocialIcon = s.icon;
                  return s.value ? (
                    <a key={i} href={s.value} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 hover:shadow-lg hover:scale-105 transition-all group">
                      <SocialIcon className={`w-5 h-5 ${s.color} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">{s.label}</div>
                        <div className={`text-sm font-semibold truncate ${s.color}`}>{s.value.replace(/https?:\/\/(www\.)?/, "")}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                    </a>
                  ) : (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 opacity-40 select-none">
                      <SocialIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-400">No {s.label} linked</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
