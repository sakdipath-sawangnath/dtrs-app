"use client";

import React from "react";

export type DataTablePageSize = 15 | 30 | 45 | "all";

interface DataTablePaginationProps {
  page: number;
  totalPages: number;
  pageSize: DataTablePageSize;
  filteredCount: number;
  showExtraTotal?: boolean;
  extraTotalCount?: number;
  onPageChange: (page: number) => void;
}

export default function DataTablePagination({
  page,
  totalPages,
  pageSize,
  filteredCount,
  showExtraTotal,
  extraTotalCount,
  onPageChange,
}: DataTablePaginationProps) {
  const pageSizeNum = typeof pageSize === "number" ? pageSize : null;

  const isAll = pageSize === "all";
  const showNav = !isAll && totalPages > 1;

  const startIdx =
    pageSizeNum != null && filteredCount > 0 ? (page - 1) * pageSizeNum + 1 : 0;
  const endIdx =
    pageSizeNum != null && filteredCount > 0
      ? Math.min(page * pageSizeNum, filteredCount)
      : 0;

  const summary =
    isAll || pageSizeNum == null
      ? `แสดง ${filteredCount} รายการ`
      : filteredCount > 0
        ? `แสดง ${startIdx}-${endIdx} จาก ${filteredCount} รายการ`
        : `แสดง 0 รายการ`;

  const extra =
    showExtraTotal && typeof extraTotalCount === "number" && extraTotalCount > 0
      ? ` (จาก ${extraTotalCount} รายการ)`
      : "";

  return (
    <div
      className="px-4 py-2.5 text-xs border-t border-white/10 text-slate-400 flex flex-wrap justify-between items-center gap-2"
    >
      <span>
        {summary}
        {extra}
      </span>

      {showNav && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-slate-800/50 text-slate-300 hover:bg-slate-700/60 disabled:opacity-40 transition-colors"
          >
            ก่อนหน้า
          </button>
          <span className="text-sm text-slate-300">
            หน้า {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-slate-800/50 text-slate-300 hover:bg-slate-700/60 disabled:opacity-40 transition-colors"
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}
