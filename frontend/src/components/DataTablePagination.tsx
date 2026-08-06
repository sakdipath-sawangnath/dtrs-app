"use client";

import React from "react";
import { Button } from "@/components/ui/button";

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

  const navBtnClass =
    "min-h-9 rounded-lg border-[var(--glass-input-border)] bg-[var(--glass-input-bg)] px-3 text-xs font-medium glass-muted-text hover:bg-[var(--glass-hover)] hover:text-[var(--glass-text)] cursor-pointer disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="px-4 py-2.5 text-xs border-t border-[var(--glass-card-border)] glass-muted-text flex flex-wrap justify-between items-center gap-2">
      <span>
        {summary}
        {extra}
      </span>

      {showNav && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className={navBtnClass}
          >
            ก่อนหน้า
          </Button>
          <span className="text-sm glass-text">
            หน้า {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className={navBtnClass}
          >
            ถัดไป
          </Button>
        </div>
      )}
    </div>
  );
}
