"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type SegmentedTabDef<T extends string> = {
  id: T;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  /** จำนวนงานค้าง/ยังไม่เสร็จ — แสดง badge เมื่อ > 0 */
  badgeCount?: number;
};

export default function SegmentedTabs<T extends string>({
  tabs,
  activeId,
  onChange,
  ariaLabel = "Tab menu",
}: {
  tabs: Array<SegmentedTabDef<T>>;
  activeId: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      className={cn(
        "glass-card flex flex-nowrap items-stretch gap-1.5 sm:gap-2 shrink-0 p-1.5 sm:p-2",
        "w-full min-w-0 max-w-full overflow-x-auto",
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
      )}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((t) => {
        const active = t.id === activeId;
        const badge =
          typeof t.badgeCount === "number" && t.badgeCount > 0 ? t.badgeCount : 0;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              "relative flex min-h-[44px] flex-1 min-w-0 sm:flex-none items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:pl-3.5 sm:pr-7 text-sm font-medium transition-all rounded-xl active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
              active
                ? "glass-nav-active border border-[var(--glass-input-focus-border)] shadow-inner backdrop-blur-sm ring-1 ring-[var(--glass-input-focus-border)]"
                : "glass-nav-item border border-transparent hover:border-[var(--glass-card-border)] hover:bg-[var(--glass-hover)] hover:backdrop-blur-sm",
            )}
          >
            {t.icon ? <t.icon size={16} className="shrink-0" aria-hidden /> : null}
            <span className="whitespace-nowrap">{t.label}</span>
            {badge > 0 ? (
              <Badge
                variant="default"
                className="absolute -top-1 -right-1 min-h-5 min-w-5 justify-center rounded-full border-0 bg-blue-600 px-1.5 py-0 text-[11px] font-bold text-white shadow"
                aria-label={`มีแจ้งเตือน ${badge} รายการ`}
              >
                {badge > 99 ? "99+" : badge}
              </Badge>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
