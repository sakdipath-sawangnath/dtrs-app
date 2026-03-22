"use client";

import React from "react";

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
      className={
        "flex flex-nowrap items-stretch gap-1.5 sm:gap-2 shrink-0 p-1.5 sm:p-2 " +
        "rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl " +
        "w-full min-w-0 max-w-full overflow-x-auto " +
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      }
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
            className={`relative flex min-h-[44px] flex-1 min-w-0 sm:flex-none items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:pl-3.5 sm:pr-7 text-sm font-medium transition-all rounded-xl active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
              active
                ? "border border-blue-500/35 bg-blue-500/15 text-blue-200 shadow-inner backdrop-blur-sm ring-1 ring-blue-400/20"
                : "border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-100 hover:backdrop-blur-sm"
            }`}
          >
            {t.icon ? <t.icon size={16} className="shrink-0" aria-hidden /> : null}
            <span className="whitespace-nowrap">{t.label}</span>
            {badge > 0 ? (
              <span
                className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shadow"
                aria-label={`มีแจ้งเตือน ${badge} รายการ`}
              >
                {badge > 99 ? "99+" : badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
