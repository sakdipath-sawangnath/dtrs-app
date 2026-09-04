"use client";

import React from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

/** จำนวนคงที่ — ห้ามสลับตาม theme (กัน hydration mismatch) */
const PARTICLE_COUNT = 24;

const FloatingBubbles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {[...Array(PARTICLE_COUNT)].map((_, i) => {
      const size = 3 + (i * 11) % 6;
      const left = (i * 13) % 100;
      const delay = (i * 0.7) % 7;
      const duration = 12 + (i * 1.3) % 10;

      return (
        <div
          key={i}
          className="absolute rounded-full animate-float bg-[var(--glass-particle)] shadow-[0_0_8px_var(--glass-particle)] opacity-80 dark:opacity-100"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
          }}
        />
      );
    })}
  </div>
);

interface PublicLayoutShellProps {
  children: React.ReactNode;
  subtitle?: string;
}

export default function PublicLayoutShell({ children, subtitle }: PublicLayoutShellProps) {
  return (
    <div className="min-h-screen flex flex-col glass-page overflow-hidden">
      <SiteHeader subtitle={subtitle} />

      <main className="flex-1 px-4 py-6 sm:py-10 min-w-0 flex justify-center relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              background:
                "linear-gradient(to bottom, var(--glass-page-gradient-from), var(--glass-page-gradient-via), var(--glass-page-gradient-to))",
            }}
          >
            <div className="absolute top-[5%] -left-[10%] w-[50%] h-[80%] rounded-full blur-[100px] animate-[pulse_6s_ease-in-out_infinite] bg-blue-400/20 dark:bg-blue-500/15" />
            <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[60%] rounded-full blur-[100px] animate-[pulse_8s_ease-in-out_infinite] delay-500 bg-sky-300/25 dark:bg-sky-400/10" />

            <div
              className="absolute inset-0 bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,black_30%,transparent_100%)] opacity-80"
              style={{
                backgroundImage:
                  "linear-gradient(var(--glass-grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--glass-grid-color) 1px, transparent 1px)",
              }}
            />

            <FloatingBubbles />

            <div
              className="absolute left-0 right-0 h-[80px] bg-gradient-to-b from-transparent to-transparent blur-[2px] animate-scan opacity-40 dark:opacity-100"
              style={{
                animationDuration: "6s",
                backgroundImage:
                  "linear-gradient(to bottom, transparent, var(--glass-scan-line), transparent)",
              }}
            />
          </div>
        </div>

        <div className="relative z-10 w-full max-w-3xl animate-fade-in">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}
