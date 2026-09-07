"use client";

import type { DataTablePageSize } from "@/components/DataTablePagination";
import GlassReactSelect, {
  glassSelectRequiredValue,
  type GlassSelectOption,
} from "@/components/dashboard/GlassReactSelect";

const OPTIONS: { value: DataTablePageSize; label: string }[] = [
  { value: 15, label: "15" },
  { value: 30, label: "30" },
  { value: 45, label: "45" },
  { value: "all", label: "ทั้งหมด" },
];

const SELECT_OPTIONS: GlassSelectOption[] = OPTIONS.map((o) => ({
  value: String(o.value),
  label: o.label,
}));

interface DataTablePageSizeSelectProps {
  value: DataTablePageSize;
  onChange: (v: DataTablePageSize) => void;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

/**
 * เลือกจำนวนแถวต่อหน้า — react-select glass (pattern เดียวกับ dropdown อื่นในแดชบอร์ด/public)
 */
export default function DataTablePageSizeSelect({
  value,
  onChange,
  className = "w-full sm:w-32 md:min-w-[112px]",
  id,
  "aria-label": ariaLabel = "จำนวนแถวต่อหน้า",
}: DataTablePageSizeSelectProps) {
  const selected = glassSelectRequiredValue(String(value), SELECT_OPTIONS, SELECT_OPTIONS[0]);

  return (
    <GlassReactSelect
      className={className}
      inputId={id}
      options={SELECT_OPTIONS}
      value={selected}
      onChange={(opt) => {
        if (!opt) return;
        onChange(
          opt.value === "all" ? "all" : (Number(opt.value) as 15 | 30 | 45),
        );
      }}
      isSearchable={false}
      isClearable={false}
      aria-label={ariaLabel}
    />
  );
}

export { OPTIONS as DATA_TABLE_PAGE_SIZE_OPTIONS };
