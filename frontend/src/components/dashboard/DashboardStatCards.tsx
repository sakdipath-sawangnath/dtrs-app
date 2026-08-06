"use client";

import type { LucideIcon } from "lucide-react";

export type DashboardStatTone = "blue" | "emerald" | "amber" | "violet" | "slate" | "rose";

export interface DashboardStatCardItem {
  id: string;
  label: string;
  value: number;
  /** คำอธิบายใต้ตัวเลข (เช่น หน่วย) */
  hint?: string;
  tone?: DashboardStatTone;
  icon?: LucideIcon;
}

const toneRing: Record<DashboardStatTone, string> = {
  blue: "border-blue-200 bg-blue-50 hover:border-blue-300 dark:border-blue-500/35 dark:bg-blue-950/25 dark:hover:border-blue-400/50",
  emerald:
    "border-emerald-200 bg-emerald-50 hover:border-emerald-300 dark:border-emerald-500/35 dark:bg-emerald-950/20 dark:hover:border-emerald-400/45",
  amber:
    "border-amber-200 bg-amber-50 hover:border-amber-300 dark:border-amber-500/35 dark:bg-amber-950/20 dark:hover:border-amber-400/45",
  violet:
    "border-violet-200 bg-violet-50 hover:border-violet-300 dark:border-violet-500/35 dark:bg-violet-950/25 dark:hover:border-violet-400/45",
  slate:
    "border-slate-200 bg-white hover:border-slate-300 dark:border-[var(--glass-card-border)] dark:bg-[var(--glass-card-bg)] dark:hover:border-[var(--glass-input-focus-border)]",
  rose: "border-rose-200 bg-rose-50 hover:border-rose-300 dark:border-rose-500/35 dark:bg-rose-950/20 dark:hover:border-rose-400/45",
};

const toneActive: Record<DashboardStatTone, string> = {
  blue: "ring-2 ring-blue-500/40 border-blue-400 bg-blue-100 dark:ring-blue-500/50 dark:border-blue-400/60 dark:bg-blue-950/35",
  emerald:
    "ring-2 ring-emerald-500/40 border-emerald-400 bg-emerald-100 dark:ring-emerald-500/45 dark:border-emerald-400/55 dark:bg-emerald-950/30",
  amber:
    "ring-2 ring-amber-500/40 border-amber-400 bg-amber-100 dark:ring-amber-500/45 dark:border-amber-400/55 dark:bg-amber-950/28",
  violet:
    "ring-2 ring-violet-500/40 border-violet-400 bg-violet-100 dark:ring-violet-500/45 dark:border-violet-400/55 dark:bg-violet-950/32",
  slate:
    "ring-2 ring-blue-500/40 border-blue-300 bg-slate-50 dark:ring-[var(--glass-input-focus-border)] dark:border-[var(--glass-input-focus-border)] dark:bg-[var(--glass-hover)]",
  rose: "ring-2 ring-rose-500/40 border-rose-400 bg-rose-100 dark:ring-rose-500/45 dark:border-rose-400/55 dark:bg-rose-950/30",
};

interface DashboardStatCardsProps {
  items: DashboardStatCardItem[];
  /** การ์ดที่เลือก (กรองข้อมูล) — null = ไม่เน้นโหมดการ์ด */
  activeId: string | null;
  /** คลิกการ์ด: ส่ง id ของการ์ด — ผู้ใช้จัดการ toggle / ล้างเอง */
  onCardClick: (id: string) => void;
  className?: string;
  /** หัวข้อส่วนการ์ด (optional) */
  sectionTitle?: string;
}

/**
 * การ์ดสรุป — คลิกได้ (filter / drill-down)
 */
export default function DashboardStatCards({
  items,
  activeId,
  onCardClick,
  className = "",
  sectionTitle = "สรุป · คลิกเพื่อกรอง",
}: DashboardStatCardsProps) {
  if (items.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400 px-0.5">
        {sectionTitle}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {items.map((item) => {
          const tone = item.tone ?? "slate";
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onCardClick(item.id)}
              className={[
                "text-left rounded-2xl border px-4 py-3 transition-all backdrop-blur-md shadow-lg",
                "min-h-[88px] flex flex-col justify-between gap-1 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
                "text-slate-900 dark:text-slate-100",
                toneRing[tone],
                isActive ? toneActive[tone] : "",
              ].join(" ")}
              aria-pressed={isActive}
              aria-label={`${item.label}: ${item.value}${item.hint ? ` ${item.hint}` : ""}`}
            >
              <span className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 min-w-0">
                {Icon && <Icon size={14} className="shrink-0 opacity-80" aria-hidden />}
                <span className="truncate">{item.label}</span>
              </span>
              <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100 tracking-tight">
                {item.value.toLocaleString("th-TH")}
              </span>
              {item.hint && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight line-clamp-2">
                  {item.hint}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
