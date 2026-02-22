import { pageMeta } from "@/app/layout";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = pageMeta["/careers"];
import { Briefcase, MapPin, Clock3 } from "lucide-react";

export default function CareersPage() {
  const roles = [
    { title: "Frontend Engineer", location: "Remote", type: "Full-time" },
    { title: "Backend Engineer", location: "Remote", type: "Full-time" },
    { title: "Developer Relations", location: "Hybrid", type: "Full-time" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-1 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-3">Careers</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
              Join us to build the best coding practice experience for developers worldwide.
            </p>
          </div>

          <div className="space-y-4">
            {roles.map((role) => (
              <div
                key={role.title}
                className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{role.title}</h2>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" />{role.location}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock3 className="w-4 h-4" />{role.type}</span>
                  </div>
                </div>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors">
                  <Briefcase className="w-4 h-4" />
                  Apply
                </button>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            Don’t see your role? Email us at <a href="mailto:careers@codewizard.dev" className="text-blue-600 dark:text-blue-400 underline">careers@codewizard.dev</a>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
