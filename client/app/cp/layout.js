import { pageMeta } from "@/app/layout";
import CpLayoutClient from "./CpLayoutClient";

export const metadata = pageMeta["/cp"];

export default function CpLayout({ children }) {
  return <CpLayoutClient>{children}</CpLayoutClient>;
}
