"use client";

import { RefreshCw } from "lucide-react";

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
      className={[
        "flex flex-wrap items-center gap-2 sm:gap-3 py-3 px-4 min-w-0 border-b border-white/10",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ช่องค้นหา: มือถือเต็มความกว้าง (col-12), PC ประมาณครึ่ง (col-md-6) */}
      {onSearchChange && (
        <div className="w-full md:w-1/2 md:min-w-[200px] md:max-w-md min-w-0">
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full py-2 px-3 text-sm rounded-xl border border-white/10 bg-slate-800/50 text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      )}
      {/* กลุ่ม select / ฟิลเตอร์: มือถือเต็มความกว้าง, PC ขนาดพอดี */}
      {children && (
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto md:min-w-0">
          {children}
        </div>
      )}
      {/* ปุ่มรีเฟรช/ปุ่มขวา: มือถือเต็มความกว้าง, PC ชิดขวา */}
      <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto shrink-0">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-white/10 bg-slate-800/50 text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors shrink-0"
          >
            <RefreshCw size={14} /> รีเฟรช
          </button>
        )}
        {rightActions}
      </div>
    </div>
  );
}
