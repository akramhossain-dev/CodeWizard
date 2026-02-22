import { pageMeta } from "@/app/layout";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = pageMeta["/contact"];
import { Mail, MessageSquare, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-1 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-3">Contact</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Need help, have feedback, or want to partner with us? Reach out.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Send a Message</h2>
              <form className="space-y-3">
                <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white" placeholder="Your Name" />
                <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white" placeholder="Your Email" type="email" />
                <textarea className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white" rows={5} placeholder="Message" />
                <button type="button" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors">
                  Send Message
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Contact Info</h3>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-500" />support@codewizard.dev</p>
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-blue-500" />+1 (555) 987-1200</p>
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" />Remote-first team</p>
                  <p className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-500" />Replies within 24 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
