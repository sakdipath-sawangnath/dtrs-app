"use client";

import type { DataTablePageSize } from "@/components/DataTablePagination";

const OPTIONS: { value: DataTablePageSize; label: string }[] = [
  { value: 15, label: "15" },
  { value: 30, label: "30" },
  { value: 45, label: "45" },
  { value: "all", label: "ทั้งหมด" },
];

interface DataTablePageSizeSelectProps {
  value: DataTablePageSize;
  onChange: (v: DataTablePageSize) => void;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

/**
 * เลือกจำนวนแถวต่อหน้า — สไตล์เดียวกับหน้า users / รายการ dashboard
 */
export default function DataTablePageSizeSelect({
  value,
  onChange,
  className = "select-native-glass w-full sm:w-32 md:min-w-[112px]",
  id,
  "aria-label": ariaLabel = "จำนวนแถวต่อหน้า",
}: DataTablePageSizeSelectProps) {
  return (
    <select
      id={id}
      className={className}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "all" ? "all" : (Number(v) as 15 | 30 | 45));
      }}
    >
      {OPTIONS.map((o) => (
        <option key={String(o.value)} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export { OPTIONS as DATA_TABLE_PAGE_SIZE_OPTIONS };
