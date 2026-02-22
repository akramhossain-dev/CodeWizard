'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Zap, Users, Trophy, ArrowRight, CheckCircle, Flame, TrendingUp, Code2, BarChart, Text, Target, Share2, Sigma, Database, Sparkles } from 'lucide-react';
import Footer from '@/components/Footer';

export default function Home() {
  const router = useRouter();
  const [numberStats, setNumberStats] = useState({
    totalProblems: 0,
    totalSubmissions: 0,
    totalAccepted: 0,
    overallAcceptanceRate: 0,
  });
  const [featuredProblems, setFeaturedProblems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topSolvers, setTopSolvers] = useState([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [topSolversRes, topicsRes, featuredRes, byNumbersRes] = await Promise.all([
          fetch(`${API_URL}/api/public/top-solvers?limit=5`),
          fetch(`${API_URL}/api/public/explore-topics?limit=6`),
          fetch(`${API_URL}/api/public/featured-problems?limit=6`),
          fetch(`${API_URL}/api/public/by-the-numbers`),
        ]);

        const [topSolversData, topicsData, featuredData, byNumbersData] = await Promise.all([
          topSolversRes.json(),
          topicsRes.json(),
          featuredRes.json(),
          byNumbersRes.json(),
        ]);

        if (topSolversData.success) {
          setTopSolvers(topSolversData.solvers || []);
        }

        if (featuredData.success) {
          setFeaturedProblems(featuredData.featuredProblems || []);
        }

        if (byNumbersData.success) {
          setNumberStats(byNumbersData.data || {});
        }

        if (topicsData.success) {
          const topicList = (topicsData.topics || []).slice(0, 6);
          const iconPack = [BarChart, Text, Target, Share2, Sigma, Database];
          const colorPack = [
            'from-blue-500 to-blue-600',
            'from-purple-500 to-purple-600',
            'from-green-500 to-green-600',
            'from-pink-500 to-pink-600',
            'from-yellow-500 to-yellow-600',
            'from-cyan-500 to-cyan-600'
          ];

          const categoryData = topicList.map((topic, index) => ({
            name: topic.topic,
            count: topic.problemCount || 0,
            icon: iconPack[index % iconPack.length],
            color: colorPack[index % colorPack.length],
          }));
          setCategories(categoryData);
        }
      } catch (error) {
        console.error("Failed to fetch home data:", error);
      }
    };

    fetchHomeData();
  }, [API_URL]);

  const features = [
    { 
      icon: Code2, 
      title: 'Practice Problems', 
      description: '2500+ curated problems from Easy to Hard with detailed solutions and explanations.'
    },
    { 
      icon: TrendingUp, 
      title: 'Real-time Analytics', 
      description: 'Track your progress with detailed statistics, difficulty trends, and performance metrics.'
    },
    { 
      icon: Flame, 
      title: 'Compete & Learn', 
      description: 'Join weekly contests, compete with peers, and climb the global leaderboard.'
    }
  ];

  const stats = [
    { label: 'Problems', value: `${numberStats.totalProblems || 0}`, icon: CheckCircle, color: 'from-green-500 to-emerald-600' },
    { label: 'Submissions', value: `${numberStats.totalSubmissions || 0}`, icon: Code2, color: 'from-blue-500 to-cyan-600' },
    { label: 'Accepted', value: `${numberStats.totalAccepted || 0}`, icon: Trophy, color: 'from-purple-500 to-pink-600' },
    { label: 'Acceptance', value: `${Number(numberStats.overallAcceptanceRate || 0).toFixed(2)}%`, icon: TrendingUp, color: 'from-orange-500 to-red-600' }
  ];

  const getDifficultyColor = (difficulty) => {
    if (difficulty === 'Easy') return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700/50';
    if (difficulty === 'Medium') return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700/50';
    return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700/50';
  };

  return (
    <div>
      <style>{`
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-slide-in-down { animation: slideInDown 0.8s ease-out; }
        .animate-slide-in-up { animation: slideInUp 0.8s ease-out 0.2s both; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgb(156, 163, 175); border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: rgb(107, 114, 128); }
        html.dark ::-webkit-scrollbar-thumb { background: rgb(71, 85, 105); }
      `}</style>

      <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-white transition-colors duration-300">
        
        <Navbar />

        {/* HERO */}
        <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-1/3 w-80 h-80 bg-blue-400/40 dark:bg-blue-600/30 rounded-full blur-3xl animate-pulse-glow"></div>
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-400/40 dark:bg-purple-600/30 rounded-full blur-3xl animate-pulse-glow" style={{animationDelay: '1s'}}></div>
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-slide-in-down inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700/50 rounded-full">
              <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-300" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Welcome to CodeWizard</span>
            </div>

            <h1 className="animate-slide-in-down text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Master <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Coding</span>
            </h1>

            <p className="animate-slide-in-up text-base sm:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
              Practice with 2500+ problems, compete with millions, land your dream job.
            </p>

            <div className="animate-slide-in-up flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() =>
                  router.push(featuredProblems?.[0]?.slug ? `/dashboard/problems/${featuredProblems[0].slug}` : "/dashboard/problems")
                }
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-2xl hover:shadow-blue-500/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                Start Solving <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push("/dashboard/problems")}
                className="px-8 py-4 border-2 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-900 transition-all"
              >
                Browse
              </button>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto">
              {[
                { icon: Zap, label: 'Fast', value: '2.5K', color: 'from-blue-500 to-blue-600' },
                { icon: Target, label: 'Problems', value: 'All', color: 'from-purple-500 to-purple-600' },
                { icon: Trophy, label: 'Users', value: '500K', color: 'from-pink-500 to-pink-600' }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={i}
                    className="p-3 sm:p-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all animate-float"
                    style={{animationDelay: `${i * 0.2}s`}}
                  >
                    <div className={`inline-block p-2 sm:p-3 rounded-lg bg-gradient-to-br ${item.color} mb-2 sm:mb-3`}>
                      <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">{item.label}</p>
                    <p className="font-bold text-base sm:text-xl">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900/50 dark:to-slate-950 transition-colors duration-300">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Why Choose CodeWizard?</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Everything you need to master coding and ace your interviews</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index} 
                    className="group relative p-5 sm:p-8 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:shadow-2xl dark:hover:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-10"></div>
                    
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                      {feature.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform duration-300">
                      Learn More <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 transition-colors duration-300">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">By The Numbers</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Join millions of developers worldwide</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={index} 
                    className="group relative p-5 sm:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10"></div>

                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-2xl opacity-30">↗</span>
                    </div>
                    
                    <div className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PROBLEMS */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900/50 dark:to-slate-950 transition-colors duration-300">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Featured Problems</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Most asked problems from top companies</p>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-700 border-b border-gray-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-gray-900 dark:text-white">#</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900 dark:text-white">Title</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900 dark:text-white">Difficulty</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900 dark:text-white">Company</th>
                    <th className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">Acceptance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {featuredProblems.map((problem, idx) => (
                    <tr 
                      key={problem._id || problem.slug || idx}
                      className="hover:bg-blue-50 dark:hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer group"
                    >
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-semibold">{idx + 1}</td>
                      <td className="px-6 py-4 font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{problem.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">{problem.tags?.[0] || "General"}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">{Number(problem.acceptanceRate || 0).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden grid gap-4">
              {featuredProblems.map((problem, idx) => (
                <div 
                  key={problem._id || problem.slug || idx}
                  className="group p-5 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10"></div>

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{problem.title}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{problem.tags?.[0] || "General"}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2 ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Acceptance: {Number(problem.acceptanceRate || 0).toFixed(2)}%</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 transition-colors duration-300">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Explore Topics</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Find problems organized by category</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {categories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <div 
                    key={category.name} 
                    className="group relative p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10`}></div>
                    
                    <div className={`inline-block p-3 rounded-lg bg-gradient-to-br ${category.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {category.name}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400 font-bold mb-4">{category.count} Problems</p>
                    
                    <div className="w-full h-2.5 bg-gray-300 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${category.color} transition-all duration-500`}
                        style={{width: `${(category.count / 350) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* LEADERBOARD */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900/50 dark:to-slate-950 transition-colors duration-300">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 sm:mb-12">
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <Trophy className="w-7 h-7 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">Top Solvers</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">This month champions</p>
            </div>

            <div className="grid gap-4">
              {topSolvers.map((user, index) => (
                <div 
                  key={user._id || user.username || index} 
                  className="group relative p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${index === 0 ? 'from-yellow-500 to-yellow-600' : index === 1 ? 'from-gray-400 to-gray-500' : index === 2 ? 'from-orange-500 to-orange-600' : 'from-blue-500 to-blue-600'} opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10`}></div>
                  
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg sm:text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {index + 1 <= 3 ? ["🥇", "🥈", "🥉"][index] : `#${index + 1}`}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base sm:text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {user.name || user.username}
                      </h3>
                      <div className="flex items-center gap-1 sm:gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
                        <span className="font-semibold truncate">@{user.username}</span>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{user.solved || 0}</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">SOLVED</p>
                    </div>
                  </div>
                </div>
              ))}
              {topSolvers.length === 0 && (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">No top solvers available right now.</div>
              )}
            </div>
          </div>
        </section>


        {/* FOOTER */}
        <Footer />
      </div>
    </div>
  );
}
