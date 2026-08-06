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
      className="glass-page flex min-h-screen w-full items-center justify-center px-4 py-10"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="glass-card flex w-full max-w-sm flex-col items-center gap-4 px-8 py-8 text-center">
        <span className="inline-flex animate-spin text-blue-400" aria-hidden>
          <LoaderCircle className="size-10" strokeWidth={2} />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium glass-text">{title}</p>
          <p className="text-xs leading-relaxed glass-subtle-text">{description}</p>
        </div>
      </div>
    </div>
  );
}
