import { pageMeta } from "@/app/layout";
import DashboardLayoutClient from "./DashboardLayoutClient";

export const metadata = pageMeta["/dashboard"];

export default function DashboardLayout({ children }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
