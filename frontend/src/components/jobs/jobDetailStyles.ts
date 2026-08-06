/** Glass tokens — สลับตาม `.dark` บน html (globals.css) */
export const GLASS_LABEL = "glass-label";
export const GLASS_FIELD = "form-input-glass w-full text-xs sm:text-sm shadow-inner transition-all disabled:cursor-not-allowed disabled:opacity-80";
export const GLASS_SECTION = "glass-card p-4 sm:p-5";

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  IN_PROGRESS: "กำลังแก้ไข",
  RESOLVED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

export const STATUS_BADGE_CLASS: Record<string, string> = {
  PENDING: "badge badge-pending",
  IN_PROGRESS: "badge badge-progress",
  RESOLVED: "badge badge-resolved",
  CANCELLED:
    "badge border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-500/40 dark:bg-slate-700/40 dark:text-slate-200",
};
