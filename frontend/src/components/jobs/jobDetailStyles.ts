/** Dark Glassmorphism — ฟิลด์ฟอร์ม (AGENTS.md: inputs) */
export const GLASS_LABEL =
  "block text-xs font-semibold mb-1 text-slate-200";
export const GLASS_FIELD =
  "w-full text-xs sm:text-sm rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 shadow-inner focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all disabled:cursor-not-allowed disabled:bg-slate-900/25 disabled:text-slate-500 disabled:opacity-80 [color-scheme:dark]";
/** No-Card: แยกเป็น Glass ย่อยหลายก้อน (AGENTS.md) */
export const GLASS_SECTION =
  "rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl p-4 sm:p-5";

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
  CANCELLED: "badge border border-slate-500/40 bg-slate-700/40 text-slate-200",
};
