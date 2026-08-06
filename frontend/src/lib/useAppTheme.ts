"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Theme-aware helper that is hydration-safe.
 * Before mount (SSR + first client paint), always report `dark` to match
 * ThemeProvider `defaultTheme="dark"` — avoids mismatch when localStorage
 * has `light` and next-themes resolves it on the client during hydrate.
 */
export function useAppTheme() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = !mounted ? "dark" : (resolvedTheme ?? "dark");
  const isDark = theme !== "light";

  return {
    isDark,
    theme: isDark ? ("dark" as const) : ("light" as const),
    mounted,
  };
}
