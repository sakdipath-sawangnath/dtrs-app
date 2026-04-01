"use client";

import {
  hexToRgba,
  resolveRoleBadgePalette,
  type RoleBadgeStyleMap,
} from "@/lib/roleBadge";

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
  const code = String(roleCode || "").trim().toUpperCase();
  const palette = resolveRoleBadgePalette(code, styleMap);
  const classes = [
    "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold border min-w-[88px]",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      style={{
        color: palette.textColor,
        backgroundColor: hexToRgba(palette.bgColor, 0.34),
        borderColor: hexToRgba(palette.textColor, 0.36),
      }}
      title={title}
    >
      {label || code || "UNKNOWN"}
    </span>
  );
}
