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
  /** ฟิลเตอร์เพิ่มเติม (select, date range ฯลฯ) แทรกระหว่าง search กับ right */
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
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 sm:gap-3 py-3 px-4 min-w-0 border-b border-[var(--glass-card-border)]",
        className,
      )}
    >
      {onSearchChange && (
        <div className="w-full md:w-1/2 md:min-w-[200px] md:max-w-md min-w-0">
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="form-input-glass h-10 w-full md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
            aria-label={searchPlaceholder}
          />
        </div>
      )}
      {children && (
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto md:min-w-0">
          {children}
        </div>
      )}
      <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto shrink-0">
        {onRefresh && (
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
        )}
        {rightActions}
      </div>
    </div>
  );
}
