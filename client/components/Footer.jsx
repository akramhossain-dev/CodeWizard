import Link from "next/link";
import { Code2, Github, Twitter, Linkedin, ExternalLink, Heart, Zap } from "lucide-react";

const LINKS = {
  product: [
    { label: "Problems",    href: "/problems" },
    { label: "Contests",    href: "/contests" },
    { label: "Discuss",     href: "/discuss" },
    { label: "Leaderboard", href: "/leaderboard" },
  ],
  company: [
    { label: "About",    href: "/about" },
    { label: "Careers",  href: "/careers" },
    { label: "Contact",  href: "/contact" },
    { label: "Privacy",  href: "/privacy" },
    { label: "Terms",    href: "/terms" },
  ],
  account: [
    { label: "Sign In",       href: "/login" },
    { label: "Register",      href: "/register" },
    { label: "Dashboard",     href: "/dashboard" },
    { label: "Forgot Password", href: "/forgot-password" },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-gray-50 dark:bg-[#0a0a0f] text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-transparent overflow-hidden transition-colors duration-300">
      {/* Top gradient border (dark only) */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent dark:block hidden" />

      {/* Background glow blobs (dark only) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none hidden dark:block" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl pointer-events-none hidden dark:block" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">

        {/* ── Main grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">

          {/* Brand col */}
          <div className="col-span-2">
            <Link href="/" className="group inline-flex items-center gap-2.5 mb-5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 flex items-center justify-center shadow-lg">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="font-black text-xl bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
                CodeWizard
              </span>
            </Link>

            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-6 max-w-xs">
              Master algorithms, compete in contests, and level up your coding skills — one problem at a time.
            </p>

            {/* Social links */}
            <div className="flex gap-2">
              {[
                { href: "#", icon: Github,   label: "GitHub" },
                { href: "#",icon: Twitter,  label: "Twitter" },
                { href: "#",icon: Linkedin, label: "LinkedIn" },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group w-9 h-9 flex items-center justify-center rounded-xl
                    bg-white border border-gray-200 text-gray-400
                    hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600
                    dark:bg-white/5 dark:border-white/10 dark:text-gray-500
                    dark:hover:bg-blue-500/15 dark:hover:border-blue-500/40 dark:hover:text-blue-400
                    transition-all duration-200 shadow-sm dark:shadow-none"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 dark:text-gray-200 mb-4">Product</h3>
            <ul className="space-y-2.5">
              {LINKS.product.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-white transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 dark:text-gray-200 mb-4">Company</h3>
            <ul className="space-y-2.5">
              {LINKS.company.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-white transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 dark:text-gray-200 mb-4">Account</h3>
            <ul className="space-y-2.5">
              {LINKS.account.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-white transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-gray-200 dark:bg-gradient-to-r dark:from-transparent dark:via-white/10 dark:to-transparent mb-8" />

        {/* ── Bottom bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-700 dark:text-gray-300">

          <p>
            &copy; <time dateTime={String(year)}>{year}</time> CodeWizard. All rights reserved.
          </p>

          {/* Developer credit */}
          <a
            href="https://mdakramhossain.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
              bg-white border border-gray-200 shadow-sm
              hover:bg-blue-50 hover:border-blue-300
              dark:bg-white/5 dark:border-white/10 dark:shadow-none
              dark:hover:bg-blue-500/10 dark:hover:border-blue-500/30
              transition-all duration-200"
          >
            <Zap className="w-3 h-3 text-blue-500 dark:text-blue-400" />
            <span className="text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              Developed by{" "}
              <span className="font-semibold bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
                Akram Hossain
              </span>
            </span>
            <ExternalLink className="w-3 h-3 text-gray-400 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
          </a>

          <p className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for coders
          </p>
        </div>
      </div>
    </footer>
  );
}
