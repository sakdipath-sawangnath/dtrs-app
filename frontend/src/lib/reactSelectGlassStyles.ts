/* eslint-disable @typescript-eslint/no-explicit-any -- react-select StylesConfig ต้องใช้ generic หลวมเพื่อให้ onChange ของแต่ละหน้าเข้ากันได้ */
import type { GroupBase, StylesConfig } from "react-select";

/**
 * react-select — Dark / Light Glass (สอดคล้อง AGENTS.md: inputs + โหมดมืดของแดชบอร์ด)
 * ใช้ร่วมกัน: JobsList (มอบหมายงาน), หน้าแจ้งปัญหา, รายละเอียดงาน
 *
 * หมายเหตุ: ใช้ `StylesConfig` แบบหลวม เพื่อไม่ให้ `onChange` ของ `Select` ถูกบังคับเป็น `unknown`
 */
export function getReactSelectGlassStyles(
  theme: "dark" | "light" = "dark",
): StylesConfig<any, false, GroupBase<any>> {
  const isDark = theme === "dark";

  return {
    control: (base, state) => ({
      ...base,
      borderRadius: "0.75rem",
      borderColor: state.isFocused
        ? "rgba(59, 130, 246, 0.5)"
        : isDark
          ? "rgba(255, 255, 255, 0.1)"
          : "#cbd5e1",
      boxShadow: state.isFocused
        ? "0 0 0 2px rgba(59, 130, 246, 0.25)"
        : "none",
      padding: "0.125rem",
      fontSize: "0.875rem",
      backgroundColor: state.isDisabled
        ? isDark
          ? "rgba(15, 23, 42, 0.35)"
          : "#f8fafc"
        : isDark
          ? "rgba(15, 23, 42, 0.4)"
          : "#ffffff",
      minHeight: "42px",
      cursor: state.isDisabled ? "not-allowed" : "pointer",
      "&:hover": {
        borderColor: state.isFocused
          ? "rgba(59, 130, 246, 0.5)"
          : isDark
            ? "rgba(255, 255, 255, 0.15)"
            : "#cbd5e1",
      },
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: "0.875rem",
      color: state.isSelected
        ? "#ffffff"
        : isDark
          ? "#e2e8f0"
          : "#1e293b",
      backgroundColor: state.isSelected
        ? "#2563eb"
        : state.isFocused
          ? isDark
            ? "rgba(51, 65, 85, 0.95)"
            : "#eff6ff"
          : isDark
            ? "rgba(30, 41, 59, 0.96)"
            : "#ffffff",
      cursor: state.isDisabled ? "not-allowed" : "pointer",
      "&:active": { backgroundColor: "#2563eb" },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: isDark ? "#f1f5f9" : "#0f172a",
    }),
    input: (provided) => ({
      ...provided,
      color: isDark ? "#f1f5f9" : "#0f172a",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: isDark ? "#64748b" : "#94a3b8",
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "0.75rem",
      overflow: "hidden",
      zIndex: 9999,
      backgroundColor: isDark ? "rgba(15, 23, 42, 0.94)" : "#ffffff",
      backdropFilter: isDark ? "blur(12px)" : undefined,
      WebkitBackdropFilter: isDark ? "blur(12px)" : undefined,
      border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #e2e8f0",
      boxShadow: isDark
        ? "0 25px 50px -12px rgba(0, 0, 0, 0.55)"
        : "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
    }),
    menuList: (provided) => ({
      ...provided,
      padding: "0.25rem",
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    valueContainer: (provided) => ({
      ...provided,
      paddingLeft: "0.5rem",
    }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (provided, state) => ({
      ...provided,
      color: state.isFocused
        ? isDark
          ? "#94a3b8"
          : "#64748b"
        : isDark
          ? "#64748b"
          : "#94a3b8",
      "&:hover": { color: isDark ? "#cbd5e1" : "#475569" },
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: isDark ? "#64748b" : "#94a3b8",
      "&:hover": { color: isDark ? "#e2e8f0" : "#334155" },
    }),
  };
}

/** โหมดมืด (แดชบอร์ด / แจ้งปัญหาแบบ glass) — shorthand */
export const reactSelectGlassStyles: StylesConfig<any, false, GroupBase<any>> =
  getReactSelectGlassStyles("dark");
