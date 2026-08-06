"use client";

import React from "react";
import { Cctv, Radio, ShieldCheck } from "lucide-react";
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

const TechCctvWatermark = () => (
  <div className="relative flex items-center justify-center text-[var(--glass-text)]">
    <div className="absolute rounded-full border-[1.5px] border-dashed h-[280px] w-[280px] animate-[spin_12s_linear_infinite] border-[var(--glass-text)]/40 dark:border-white/60" />
    <div className="absolute rounded-full border-[2px] border-t-transparent border-b-transparent h-[210px] w-[210px] animate-[spin_8s_linear_infinite_reverse] border-[var(--glass-text)]/30 dark:border-white/40" />
    <Cctv size={110} strokeWidth={1.5} className="relative z-10" />
    <Radio
      size={48}
      strokeWidth={1.5}
      className="absolute -top-10 -right-6 animate-[pulse_2s_ease-in-out_infinite]"
    />
    <ShieldCheck size={42} strokeWidth={1.5} className="absolute -bottom-6 -left-4" />
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

            <div className="absolute -right-8 md:right-[5%] top-[10%] z-0 transform -rotate-12 opacity-[0.04] dark:opacity-[0.05]">
              <TechCctvWatermark />
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-3xl animate-fade-in">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}
