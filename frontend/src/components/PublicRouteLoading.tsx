"use client";

import { LoaderCircle } from "lucide-react";

type PublicRouteLoadingProps = {
  title?: string;
  description?: string;
};

export default function PublicRouteLoading({
  title = "กำลังโหลดหน้า...",
  description = "กำลังเตรียมข้อมูลและแสดงผล",
}: PublicRouteLoadingProps) {
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center bg-slate-950 px-4 py-10"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/50 px-8 py-8 text-center shadow-2xl backdrop-blur-md">
        <span className="inline-flex animate-spin text-blue-400" aria-hidden>
          <LoaderCircle className="size-10" strokeWidth={2} />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-slate-200">{title}</p>
          <p className="text-xs leading-relaxed text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );
}
