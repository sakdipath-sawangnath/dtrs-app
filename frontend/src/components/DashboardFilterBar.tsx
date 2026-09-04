"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DashboardFilterBarProps {
  /** ป้ายค้นหา (placeholder) */
  searchPlaceholder?: string;
  /** ค่าค้นหา (controlled) */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** ปุ่มเพิ่ม / ปุ่มหลัก ด้านขวา */
  rightActions?: React.ReactNode;
  /** ปุ่มรีเฟรช */
  onRefresh?: () => void;
  /** ฟิลเตอร์เพิ่มเติม (select, date range ฯลฯ) */
  children?: React.ReactNode;
  /** รวม class เพิ่ม (เช่น ลบ border ล่างเมื่ออยู่ใน Glass แยก — No-Card) */
  className?: string;
}

export default function DashboardFilterBar({
  searchPlaceholder = "ค้นหา...",
  searchValue = "",
  onSearchChange,
  rightActions,
  onRefresh,
  children,
  className,
}: DashboardFilterBarProps) {
  const hasActions = Boolean(onRefresh || rightActions);

  return (
    <div
      className={cn(
        "flex w-full min-w-0 max-w-full flex-col gap-3 border-b border-[var(--glass-card-border)] px-4 py-4 sm:gap-3.5 sm:px-5",
        className,
      )}
    >
      {(onSearchChange || hasActions) && (
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          {onSearchChange ? (
            <div className="min-w-0 w-full flex-1 sm:min-w-0 lg:max-w-xl">
              <Input
                type="search"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="form-input-glass h-11 w-full max-w-full text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 md:text-sm"
                aria-label={searchPlaceholder}
              />
            </div>
          ) : null}
          {hasActions ? (
            <div className="flex shrink-0 items-center gap-2.5 sm:ml-auto">
              {onRefresh ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  onClick={onRefresh}
                  aria-label="รีเฟรชรายการ"
                  title="รีเฟรชรายการ"
                  className="size-11 shrink-0 cursor-pointer rounded-xl border-[var(--glass-input-border)] bg-[var(--glass-input-bg)] glass-nav-item hover:bg-[var(--glass-hover)] hover:text-[var(--glass-text)] focus-visible:ring-blue-500/50 active:scale-95"
                >
                  <RefreshCw size={18} className="shrink-0" aria-hidden />
                </Button>
              ) : null}
              {rightActions}
            </div>
          ) : null}
        </div>
      )}
      {/* ห้ามห่อด้วย flex-row — จะดัน min-content ของ <select> ให้ล้นกรอบ */}
      {children ? <div className="w-full min-w-0 max-w-full">{children}</div> : null}
    </div>
  );
}
