import { formatThaiDateTimeDisplay } from "@/lib/formatThaiDateTimeDisplay";
import {
  normalizeBrokenPart,
  normalizeFixEnvironment,
} from "@/lib/jobBreakdownCounts";

/** ฟิลด์ที่ต้องมีสำหรับส่งออก CSV จาก JobsList */
export interface JobsListCsvJob {
  id: number;
  ticketNo?: string;
  title?: string;
  description?: string;
  location?: string;
  province?: string;
  district?: string;
  status: string;
  reportDate?: string;
  createdAt: string;
  assignedTo?: { id: number; name: string } | null;
  reporterName?: string;
  reporterPhone?: string;
  reporterEmail?: string;
  brokenPart?: string | null;
  cause?: string | null;
  fixMethod?: string | null;
  oldSerialNumber?: string | null;
  newSerialNumber?: string | null;
  fixDate?: string | null;
  fixNote?: string | null;
  fixEnvironment?: string | null;
  isOutOfContract?: boolean;
}

const STATUS_TH: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  IN_PROGRESS: "กำลังแก้ไข",
  RESOLVED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

function fixEnvDisplay(v: string | null | undefined): string {
  const b = normalizeFixEnvironment(v);
  if (b === "INDOOR") return "Indoor (ในอาคาร)";
  if (b === "OUTDOOR") return "Outdoor (นอกอาคาร)";
  return "ไม่ระบุ";
}

function brokenPartDisplay(v: string | null | undefined): string {
  const b = normalizeBrokenPart(v);
  if (b === "Hardware") return "Hardware (ฮาร์ดแวร์)";
  if (b === "Software") return "Software (ซอฟต์แวร์)";
  return "ไม่ระบุ";
}

/** RFC 4180 style: double quotes, escape internal quotes */
export function csvEscapeCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** สร้างเนื้อหา CSV (บรรทัดคั่นด้วย CRLF) — ไม่มี BOM; ใส่ BOM ตอน download */
export function buildJobsListAuditCsv(jobs: readonly JobsListCsvJob[]): string {
  const headers = [
    "id",
    "เลขที่",
    "กลุ่มสัญญา",
    "สถานะ",
    "วันที่แจ้ง_raw",
    "วันที่แจ้ง_แสดง_พศ",
    "วันที่สร้างในระบบ_raw",
    "วันที่สร้างในระบบ_แสดง_พศ",
    "วันที่ปิดงาน_raw",
    "วันที่ปิดงาน_แสดง_พศ",
    "ผู้แจ้ง",
    "เบอร์โทร",
    "อีเมล",
    "จังหวัด",
    "อำเภอ",
    "สถานที่",
    "หัวข้อ",
    "รายละเอียด",
    "ประเภทสถานที่",
    "ประเภทงาน_กลุ่ม",
    "ประเภทงาน_raw",
    "สาเหตุ",
    "วิธีแก้",
    "หมายเหตุการซ่อม",
    "serial_เดิม",
    "serial_ใหม่",
    "id_ผู้รับผิดชอบ",
    "ผู้รับผิดชอบ",
  ];

  const lines: string[] = [headers.map(csvEscapeCell).join(",")];

  for (const j of jobs) {
    const contract =
      j.isOutOfContract === true ? "นอกสัญญา" : j.isOutOfContract === false ? "สัญญา" : "";
    const row = [
      j.id,
      j.ticketNo ?? "",
      contract,
      STATUS_TH[j.status] ?? j.status,
      j.reportDate ?? "",
      formatThaiDateTimeDisplay(j.reportDate) ?? "",
      j.createdAt ?? "",
      formatThaiDateTimeDisplay(j.createdAt) ?? "",
      j.fixDate ?? "",
      formatThaiDateTimeDisplay(j.fixDate) ?? "",
      j.reporterName ?? "",
      j.reporterPhone ?? "",
      j.reporterEmail ?? "",
      j.province ?? "",
      j.district ?? "",
      j.location ?? "",
      j.title ?? "",
      j.description ?? "",
      fixEnvDisplay(j.fixEnvironment),
      brokenPartDisplay(j.brokenPart),
      j.brokenPart ?? "",
      j.cause ?? "",
      j.fixMethod ?? "",
      j.fixNote ?? "",
      j.oldSerialNumber ?? "",
      j.newSerialNumber ?? "",
      j.assignedTo?.id ?? "",
      j.assignedTo?.name ?? "",
    ];
    lines.push(row.map(csvEscapeCell).join(","));
  }

  return lines.join("\r\n");
}

/** UTF-8 + BOM สำหรับเปิดใน Excel ภาษาไทย */
export function downloadUtf8Csv(filename: string, csvBody: string): void {
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvBody], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
