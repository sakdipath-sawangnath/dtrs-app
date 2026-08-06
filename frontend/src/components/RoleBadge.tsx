"use client";

import {
  hexToRgba,
  resolveRoleBadgePalette,
  type RoleBadgeStyleMap,
} from "@/lib/roleBadge";
import { useAppTheme } from "@/lib/useAppTheme";

type RoleBadgeProps = {
  roleCode: string;
  label?: string;
  styleMap?: RoleBadgeStyleMap | null;
  className?: string;
  title?: string;
};

export default function RoleBadge({
  roleCode,
  label,
  styleMap,
  className,
  title,
}: RoleBadgeProps) {
  const { isDark } = useAppTheme();
  const code = String(roleCode || "").trim().toUpperCase();
  const palette = resolveRoleBadgePalette(code, styleMap);
  const classes = [
    "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold border min-w-[88px]",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  // Light: ใช้สีหลัก (bgColor) เป็นตัวอักษร + พื้นโปร่งใสอ่อน — Dark: คงแพทเทิร์นเดิม (ข้อความอ่อนบนพื้นมืดโปร่ง)
  const style = isDark
    ? {
        color: palette.textColor,
        backgroundColor: hexToRgba(palette.bgColor, 0.34),
        borderColor: hexToRgba(palette.textColor, 0.36),
      }
    : {
        color: palette.bgColor,
        backgroundColor: hexToRgba(palette.bgColor, 0.12),
        borderColor: hexToRgba(palette.bgColor, 0.35),
      };

  return (
    <span className={classes} style={style} title={title}>
      {label || code || "UNKNOWN"}
    </span>
  );
}
