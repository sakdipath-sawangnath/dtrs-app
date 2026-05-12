/**
 * แสดงวันเวลาแบบ d/m/Y + เวลา (ปี 4 หลัก พ.ศ. กับ locale th-TH)
 * ไม่ใช้ dateStyle: "short" เพราะจะได้ปี 2 หลัก เช่น 69
 */
export function formatThaiDateTimeDisplay(
  iso: string | undefined | null,
): string | null {
  if (iso == null || String(iso).trim() === "") return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("th-TH", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * แยกค่า `YYYY-MM-DDTHH:mm` (local) สำหรับคู่ input[type=date] + input[type=time]
 * — หลีกเลี่ยง datetime-local ที่บางเบราว์เซอร์แสดงเป็น MM/DD/YYYY
 */
export function splitLocalDateTime(localDatetime: string): {
  date: string;
  time: string;
} {
  const raw = String(localDatetime ?? "").trim();
  if (!raw) return { date: "", time: "" };
  const [d, rest] = raw.split("T");
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return { date: "", time: "" };
  const timePart =
    rest && /^\d{2}:\d{2}/.test(rest) ? rest.slice(0, 5) : "";
  return { date: d, time: timePart };
}

/** รวมจาก date (yyyy-mm-dd) + time (HH:mm) เป็นรูปแบบเดียวกับ datetime-local */
export function joinLocalDateTime(date: string, time: string): string {
  const d = String(date ?? "").trim();
  if (!d) return "";
  const t = String(time ?? "").trim();
  const tm = /^\d{2}:\d{2}$/.test(t) ? t : "00:00";
  return `${d}T${tm}`;
}
