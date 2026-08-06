import "./print.css";
import PrintThemeShell from "@/components/PrintThemeShell";

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <PrintThemeShell>{children}</PrintThemeShell>;
}
