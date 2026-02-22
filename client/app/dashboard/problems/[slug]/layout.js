const SITE_NAME = "CodeWizard";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || "";
  const title = slug
    ? `${decodeURIComponent(slug).replace(/-/g, " ")} – CodeWizard`
    : `Problem – ${SITE_NAME}`;

  return {
    title,
    description: `Solve this problem on CodeWizard and track your submission history.`,
    robots: { index: false, follow: false },
  };
}

export default function DashboardProblemSlugLayout({ children }) {
  return children;
}
