"use client";

import { useEffect, useMemo, useState } from "react";
import type { DataTablePageSize } from "@/components/DataTablePagination";

/**
 * Client-side slice + หน้า — ใช้ร่วมกับ DataTablePagination / DataTablePageSizeSelect
 * @param filterVersion เปลี่ยนเมื่อตัวกรองเปลี่ยน (เช่น `${query}|${province}|${district}`) เพื่อรีเซ็ตหน้าเป็น 1
 */
export function useDashboardTablePaging<T>(
  filteredItems: T[],
  filterVersion: string,
  initialPageSize: DataTablePageSize = 15,
) {
  const [pageSize, setPageSize] = useState<DataTablePageSize>(initialPageSize);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filterVersion, pageSize]);

  const totalPages = useMemo(() => {
    if (pageSize === "all") return 1;
    return Math.ceil(filteredItems.length / pageSize) || 1;
  }, [filteredItems.length, pageSize]);

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(1, totalPages)));
  }, [totalPages]);

  const paginatedItems = useMemo(() => {
    if (pageSize === "all") return filteredItems;
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, pageSize, page]);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalPages,
    filteredCount: filteredItems.length,
  };
}
