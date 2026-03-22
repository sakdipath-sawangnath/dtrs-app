"use client";

import { LoaderCircle } from "lucide-react";

type Variant = "page" | "overlay";

/**
 * สถานะโหลดระหว่างสลับหน้าในแดชบอร์ด — Dark Glassmorphism (AGENTS.md)
 */
export default function DashboardRouteLoading({ variant = "page" }: { variant?: Variant }) {
  const isOverlay = variant === "overlay";

  return (
    <div
      className={
        isOverlay
          ? "flex flex-col items-center justify-center gap-4 py-6 px-4"
          : "animate-fade-in w-full min-h-[50vh] flex flex-col items-center justify-center gap-6 py-16 px-4"
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={
          isOverlay
            ? "rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-2xl px-8 py-7 flex flex-col items-center gap-3 max-w-xs w-full"
            : "rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl px-10 py-10 flex flex-col items-center gap-4 max-w-md w-full"
        }
      >
        <span className="inline-flex animate-spin text-blue-400" aria-hidden>
          <LoaderCircle className={isOverlay ? "h-9 w-9" : "h-10 w-10"} strokeWidth={2} />
        </span>
        <p className="text-sm font-medium text-slate-300 text-center">กำลังโหลดหน้า…</p>
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          ดึงข้อมูลและเตรียมแสดงผล
        </p>
        {!isOverlay && (
          <div className="w-full space-y-2.5 pt-1">
            <div className="h-2 rounded-lg bg-slate-700/60 animate-pulse" />
            <div className="h-2 rounded-lg bg-slate-700/45 animate-pulse w-[88%] mx-auto" />
            <div className="h-2 rounded-lg bg-slate-700/35 animate-pulse w-[72%] mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
}
