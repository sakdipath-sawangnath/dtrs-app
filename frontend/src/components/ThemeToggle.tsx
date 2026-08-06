"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="size-11 shrink-0 rounded-xl border border-transparent"
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme !== "light";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-11 min-h-11 min-w-11 shrink-0 cursor-pointer rounded-xl text-glass-text hover:bg-glass-hover"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="สลับโหมดสี"
    >
      {isDark ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
    </Button>
  );
}
