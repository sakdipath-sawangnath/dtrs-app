"use client";

import { useMemo } from "react";
import Select, {
  type GroupBase,
  type Props as ReactSelectProps,
  type StylesConfig,
} from "react-select";
import { getReactSelectGlassStyles } from "@/lib/reactSelectGlassStyles";
import { useAppTheme } from "@/lib/useAppTheme";

export type GlassSelectOption = { value: string; label: string };

export const GLASS_SELECT_MENU_PORTAL =
  typeof document !== "undefined" ? document.body : null;

/** ค่า filter แบบ optional (ว่าง = null → placeholder) */
export function glassSelectValue(
  value: string,
  options: GlassSelectOption[],
): GlassSelectOption | null {
  if (!value) return null;
  return options.find((o) => o.value === value) ?? { value, label: value };
}

/** ค่า required — fallback เมื่อ options ยังโหลดไม่ครบ */
export function glassSelectRequiredValue(
  value: string,
  options: GlassSelectOption[],
  fallback: GlassSelectOption,
): GlassSelectOption {
  return options.find((o) => o.value === value) ?? fallback;
}

type GlassReactSelectProps = Omit<
  ReactSelectProps<GlassSelectOption, false, GroupBase<GlassSelectOption>>,
  "styles" | "menuPortalTarget" | "menuPosition" | "noOptionsMessage"
> & {
  className?: string;
};

/**
 * react-select แบบ glass — pattern มาตรฐานทั้งแดชบอร์ด/public
 * (theme จาก useAppTheme, portal ใน modal/filter bar)
 */
export default function GlassReactSelect({
  className = "w-full min-w-0",
  isSearchable = true,
  isClearable = true,
  ...props
}: GlassReactSelectProps) {
  const { theme } = useAppTheme();
  const selectStyles = useMemo(
    () =>
      getReactSelectGlassStyles(theme) as StylesConfig<
        GlassSelectOption,
        false,
        GroupBase<GlassSelectOption>
      >,
    [theme],
  );

  return (
    <div className={className}>
      <Select<GlassSelectOption, false>
        styles={selectStyles}
        menuPosition="fixed"
        menuPortalTarget={GLASS_SELECT_MENU_PORTAL}
        isSearchable={isSearchable}
        isClearable={isClearable}
        noOptionsMessage={() => "ไม่พบข้อมูล"}
        {...props}
      />
    </div>
  );
}
