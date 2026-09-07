"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type BreakdownFilterOption = {
  value: string;
  label: string;
  count: number;
  /** จุดสีสถานะ/ประเภท — ไม่ใส่สำหรับตัวเลือก «ทั้งหมด» */
  dotClassName?: string;
  /** tooltip / ชื่อเต็มเมื่อ label ย่อ */
  title?: string;
};

export type BreakdownFilterGroup = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: BreakdownFilterOption[];
};

/**
 * ตัวกรองแบบ chip/pill —
 * ใช้บน `/dashboard/all` และ `/dashboard/sites` (และหน้าที่ต้องการรูปแบบเดียวกัน)
 * กระชับกว่าการ์ดกริด, scroll แนวนอนบนมือถือ, wrap บน tablet/desktop
 */
export default function BreakdownFilterChips({
  groups,
  ariaLabel = "การกรองแบบชิป",
}: {
  groups: BreakdownFilterGroup[];
  ariaLabel?: string;
}) {
  return (
    <div
      className="flex w-full min-w-0 max-w-full flex-col gap-4 sm:gap-5"
      aria-label={ariaLabel}
    >
      {groups.map((group) => (
        <div key={group.id} className="flex min-w-0 max-w-full flex-col gap-2">
          <p className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-400">
            {group.label}
          </p>
          <div
            role="group"
            aria-label={group.label}
            className={cn(
              "flex max-w-full min-w-0 flex-nowrap gap-2.5 overflow-x-auto overscroll-x-contain",
              "scroll-smooth snap-x snap-mandatory",
              "md:flex-wrap md:overflow-x-visible md:snap-none",
              "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            )}
          >
            {group.options.map((opt) => {
              const active = group.value === opt.value;
              return (
                <button
                  key={opt.value || `${group.id}-ALL`}
                  type="button"
                  aria-pressed={active}
                  title={opt.title ?? opt.label}
                  onClick={() => group.onChange(opt.value)}
                  className={cn(
                    "inline-flex shrink-0 snap-start items-center gap-2 rounded-full border px-3.5",
                    "min-h-11 text-sm font-medium transition-all duration-200",
                    "cursor-pointer active:scale-95",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
                    active
                      ? "border-blue-600 bg-blue-600 text-white shadow-sm dark:border-blue-500 dark:bg-blue-600"
                      : cn(
                          "border-slate-200 bg-white text-slate-700",
                          "hover:border-blue-400/60 hover:bg-blue-50/60",
                          "dark:border-[var(--glass-card-border)] dark:bg-[var(--glass-input-bg)] dark:text-slate-200",
                          "dark:hover:border-blue-500/40 dark:hover:bg-[var(--glass-accent-soft)]",
                        ),
                  )}
                >
                  {opt.dotClassName && !active ? (
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full ring-1 ring-black/5 dark:ring-white/10",
                        opt.dotClassName,
                      )}
                      aria-hidden
                    />
                  ) : null}
                  <span className="whitespace-nowrap">{opt.label}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "min-w-5 justify-center rounded-full border-0 px-1.5 py-0 text-[11px] font-bold tabular-nums",
                      active
                        ? "bg-white/25 text-white"
                        : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
                    )}
                  >
                    {opt.count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
