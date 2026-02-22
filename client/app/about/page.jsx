import { pageMeta } from "@/app/layout";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = pageMeta["/about"];
import { Code2, Target, Users, Trophy, Sparkles } from "lucide-react";

export default function AboutPage() {
  const values = [
    {
      title: "Learn by Solving",
      desc: "We focus on practical problem solving that builds real interview and engineering skills.",
      icon: <Code2 className="w-5 h-5" />,
    },
    {
      title: "Measure Progress",
      desc: "Track solved, attempted, acceptance rate, and rating so growth is visible and actionable.",
      icon: <Target className="w-5 h-5" />,
    },
    {
      title: "Community First",
      desc: "CodeWizard is built for learners, mentors, and teams growing together.",
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-1 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-5">
              <Sparkles className="w-4 h-4" />
              About CodeWizard
            </div>
            <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-4">Build Better Problem Solvers</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              CodeWizard helps developers practice coding problems, improve consistency, and prepare for real technical interviews.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-4">
                  {v.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{v.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-gradient-to-r from-blue-600 to-violet-600 text-white p-8">
            <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Our Mission
            </h2>
            <p className="text-blue-100 leading-relaxed">
              Make high-quality coding practice accessible, structured, and motivating for every developer.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
