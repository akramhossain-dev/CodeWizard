const SITE_NAME = "CodeWizard";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || "";
  const title = slug
    ? `${decodeURIComponent(slug).replace(/-/g, " ")} – CodeWizard`
    : `Contest – ${SITE_NAME}`;

  return {
    title,
    description: `View contest details, standings, and your performance on CodeWizard.`,
    robots: { index: false, follow: false },
  };
}

export default function DashboardContestSlugLayout({ children }) {
  return children;
}
