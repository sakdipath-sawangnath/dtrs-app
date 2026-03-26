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
  blue: "border-blue-500/35 bg-blue-950/25 hover:border-blue-400/50",
  emerald: "border-emerald-500/35 bg-emerald-950/20 hover:border-emerald-400/45",
  amber: "border-amber-500/35 bg-amber-950/20 hover:border-amber-400/45",
  violet: "border-violet-500/35 bg-violet-950/25 hover:border-violet-400/45",
  slate: "border-white/10 bg-slate-900/50 hover:border-white/20",
  rose: "border-rose-500/35 bg-rose-950/20 hover:border-rose-400/45",
};

const toneActive: Record<DashboardStatTone, string> = {
  blue: "ring-2 ring-blue-500/50 border-blue-400/60 bg-blue-950/35",
  emerald: "ring-2 ring-emerald-500/45 border-emerald-400/55 bg-emerald-950/30",
  amber: "ring-2 ring-amber-500/45 border-amber-400/55 bg-amber-950/28",
  violet: "ring-2 ring-violet-500/45 border-violet-400/55 bg-violet-950/32",
  slate: "ring-2 ring-white/25 border-white/25 bg-slate-800/60",
  rose: "ring-2 ring-rose-500/45 border-rose-400/55 bg-rose-950/30",
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
 * การ์ดสรุปแบบ Dark Glass — คลิกได้ (filter / drill-down)
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
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 px-0.5">
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
                toneRing[tone],
                isActive ? toneActive[tone] : "",
              ].join(" ")}
              aria-pressed={isActive}
              aria-label={`${item.label}: ${item.value}${item.hint ? ` ${item.hint}` : ""}`}
            >
              <span className="flex items-center gap-2 text-xs font-medium text-slate-400 min-w-0">
                {Icon && <Icon size={14} className="shrink-0 opacity-80" aria-hidden />}
                <span className="truncate">{item.label}</span>
              </span>
              <span className="text-2xl font-bold tabular-nums text-white tracking-tight">
                {item.value.toLocaleString("th-TH")}
              </span>
              {item.hint && (
                <span className="text-[11px] text-slate-500 leading-tight line-clamp-2">{item.hint}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
