import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

const SITE_NAME = "CodeWizard";
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://codewizard.dev";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const TWITTER_HANDLE = "@codewizard_dev";

export const pageMeta = {
  "/": {
    title: "CodeWizard – Practice Coding & Master Algorithms",
    description:
      "Sharpen your coding skills with CodeWizard. Solve algorithmic challenges, track your progress, and climb the leaderboard. Start your journey today.",
    canonical: SITE_URL,
  },
  "/problems": {
    title: "Coding Problems – CodeWizard",
    description:
      "Browse hundreds of coding problems by difficulty and topic. Practice consistently and level up your technical interview skills.",
    canonical: `${SITE_URL}/problems`,
  },
  "/contests": {
    title: "Coding Contests – CodeWizard",
    description:
      "Join live coding contests, track your ranking, and compete with developers worldwide in timed challenge rounds.",
    canonical: `${SITE_URL}/contests`,
  },
  "/discuss": {
    title: "Discuss – CodeWizard",
    description:
      "Participate in coding discussions, share your approaches, and learn from community problem-solving insights.",
    canonical: `${SITE_URL}/discuss`,
  },
  "/leaderboard": {
    title: "Leaderboard – CodeWizard",
    description:
      "See the top problem solvers, compare your progress, and follow ranking trends across the CodeWizard platform.",
    canonical: `${SITE_URL}/leaderboard`,
  },
  "/about": {
    title: "About CodeWizard",
    description:
      "Learn about CodeWizard's mission to make coding practice structured, accessible, and effective for every developer.",
    canonical: `${SITE_URL}/about`,
  },
  "/contact": {
    title: "Contact – CodeWizard",
    description:
      "Get in touch with the CodeWizard team for support, feedback, bug reports, and partnership opportunities.",
    canonical: `${SITE_URL}/contact`,
  },
  "/careers": {
    title: "Careers – CodeWizard",
    description:
      "Explore open roles and join the team building the next generation of coding education experiences.",
    canonical: `${SITE_URL}/careers`,
  },
  "/privacy": {
    title: "Privacy Policy – CodeWizard",
    description:
      "Read how CodeWizard collects, uses, stores, and protects your personal data across the platform.",
    canonical: `${SITE_URL}/privacy`,
  },
  "/terms": {
    title: "Terms of Service – CodeWizard",
    description:
      "Review the terms and conditions governing your use of CodeWizard's services and platform features.",
    canonical: `${SITE_URL}/terms`,
  },
  "/login": {
    title: "Sign In – CodeWizard",
    description:
      "Sign in to CodeWizard to continue solving problems, joining contests, and tracking your growth.",
    canonical: `${SITE_URL}/login`,
  },
  "/register": {
    title: "Create Account – CodeWizard",
    description:
      "Create your free CodeWizard account and start solving coding problems and competing in contests today.",
    canonical: `${SITE_URL}/register`,
  },
  "/forgot-password": {
    title: "Forgot Password – CodeWizard",
    description: "Securely reset your CodeWizard account password in a few easy steps.",
    canonical: `${SITE_URL}/forgot-password`,
  },
  "/reset-password": {
    title: "Reset Password – CodeWizard",
    description: "Set a new password and regain access to your CodeWizard account.",
    canonical: `${SITE_URL}/reset-password`,
  },
  "/dashboard": {
    title: "Dashboard – CodeWizard",
    description:
      "View your submission history, rating trajectory, and coding progress with personalised performance analytics.",
    canonical: `${SITE_URL}/dashboard`,
  },
  "/cp": {
    title: "Control Panel – CodeWizard",
    description:
      "Manage platform operations including problems, contests, users, and submissions from the CodeWizard control panel.",
    canonical: `${SITE_URL}/cp`,
  },
  "/cp/problems": {
    title: "Manage Problems – CodeWizard CP",
    description:
      "Create, edit, and delete coding problems from the CodeWizard control panel.",
    canonical: `${SITE_URL}/cp/problems`,
  },
  "/cp/contests": {
    title: "Manage Contests – CodeWizard CP",
    description:
      "Create and manage coding contests, set schedules, and configure contest problems.",
    canonical: `${SITE_URL}/cp/contests`,
  },
  "/cp/submissions": {
    title: "All Submissions – CodeWizard CP",
    description:
      "Review and manage all user submissions across problems and contests.",
    canonical: `${SITE_URL}/cp/submissions`,
  },
  "/cp/users": {
    title: "Manage Users – CodeWizard CP",
    description:
      "View, search, and manage all registered users on the CodeWizard platform.",
    canonical: `${SITE_URL}/cp/users`,
  },
  "/cp/employees": {
    title: "Manage Employees – CodeWizard CP",
    description:
      "Add and manage CodeWizard staff and employee accounts with role-based access.",
    canonical: `${SITE_URL}/cp/employees`,
  },
  "/cp/settings": {
    title: "Settings – CodeWizard CP",
    description:
      "Configure platform-wide settings and preferences from the CodeWizard control panel.",
    canonical: `${SITE_URL}/cp/settings`,
  },
  "/cp/login": {
    title: "Admin Login – CodeWizard CP",
    description: "Sign in to the CodeWizard control panel with your admin credentials.",
    canonical: `${SITE_URL}/cp/login`,
  },
  "/dashboard/problems": {
    title: "My Problems – CodeWizard",
    description:
      "Browse and track the coding problems you have attempted or solved on CodeWizard.",
    canonical: `${SITE_URL}/dashboard/problems`,
  },
  "/dashboard/contests": {
    title: "My Contests – CodeWizard",
    description:
      "View all the contests you have participated in and review your performance history.",
    canonical: `${SITE_URL}/dashboard/contests`,
  },
  "/dashboard/submissions": {
    title: "My Submissions – CodeWizard",
    description:
      "Review your complete submission history, verdicts, and code across all problems.",
    canonical: `${SITE_URL}/dashboard/submissions`,
  },
  "/dashboard/profile": {
    title: "My Profile – CodeWizard",
    description:
      "View and update your CodeWizard profile, avatar, bio, and account settings.",
    canonical: `${SITE_URL}/dashboard/profile`,
  },
};

const rootMeta = pageMeta["/"];

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  description: rootMeta.description,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/problems?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: rootMeta.title,
    template: `%s – ${SITE_NAME}`,
  },
  description: rootMeta.description,

  keywords: [
    "CodeWizard",
    "coding problems",
    "competitive programming",
    "coding contests",
    "algorithm practice",
    "data structures",
    "technical interview prep",
    "online judge",
    "leetcode alternative",
    "coding practice",
  ],

  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  alternates: {
    canonical: SITE_URL,
  },

  openGraph: {
    title: rootMeta.title,
    description: rootMeta.description,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} – Practice Coding & Master Algorithms`,
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    title: rootMeta.title,
    description: rootMeta.description,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        alt: `${SITE_NAME} – Practice Coding & Master Algorithms`,
      },
    ],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  category: "technology",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}