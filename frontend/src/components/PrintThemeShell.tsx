"use client";

/**
 * Print routes always render light chrome without nested ThemeProvider
 * (avoids mutating documentElement / fighting root next-themes).
 * `.light` in globals.css re-scopes --glass-* for this subtree.
 */
export default function PrintThemeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="light min-h-screen bg-white text-slate-900" style={{ colorScheme: "light" }}>
      {children}
    </div>
  );
}
