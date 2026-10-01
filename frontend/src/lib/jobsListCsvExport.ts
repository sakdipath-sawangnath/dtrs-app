import { formatThaiDateTimeDisplay } from "@/lib/formatThaiDateTimeDisplay";
import {
  normalizeBrokenPart,
  normalizeFixEnvironment,
} from "@/lib/jobBreakdownCounts";
import { parseJobSerialRowsFromDb } from "@/lib/jobSerialRows";
import { stripReopenAuditFromFixNote } from "@/lib/stripReopenAuditFromFixNote";

/** ฟิลด์ที่ต้องมีสำหรับส่งออก CSV จาก JobsList */
export interface JobsListCsvJob {
  id: number;
  ticketNo?: string | null;
  requestTicketNo?: string | null;
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

function workDurationDays(job: {
  fixDate?: string | null;
  reportDate?: string | null;
  createdAt?: string | null;
}): string {
  if (!job.fixDate) return "";
  const end = new Date(job.fixDate).getTime();
  const start = new Date(job.reportDate || job.createdAt || "").getTime();
  if (Number.isNaN(end) || Number.isNaN(start)) return "";
  const days = Math.max(0, Math.round((end - start) / (24 * 60 * 60 * 1000)));
  return String(days);
}

/**
 * แปลง S/N จาก DB (plain หรือ JSON v1 หลายแถว) เป็นข้อความอ่านง่ายสำหรับ CSV
 * — ไม่ส่ง raw JSON เพราะ Excel มักทำให้ดูเหมือนเหลือแถวเดียว และ `v` คือเวอร์ชันไม่ใช่จำนวน
 */
export function formatSerialFieldsForCsv(
  oldSerialNumber: string | null | undefined,
  newSerialNumber: string | null | undefined,
): {
  deviceCount: string;
  serialOld: string;
  serialNew: string;
  serialDevices: string;
} {
  const rows = parseJobSerialRowsFromDb(oldSerialNumber, newSerialNumber).filter(
    (r) => r.deviceName.length > 0 || r.oldSerial.length > 0 || r.newSerial.length > 0,
  );
  if (rows.length === 0) {
    return {
      deviceCount: "0",
      serialOld: "",
      serialNew: "",
      serialDevices: "",
    };
  }

  const label = (r: (typeof rows)[number], i: number) =>
    r.deviceName || `อุปกรณ์${i + 1}`;

  const serialOld = rows
    .map((r, i) =>
      rows.length === 1 && !r.deviceName
        ? r.oldSerial
        : `${label(r, i)}: ${r.oldSerial || "-"}`,
    )
    .join(" | ");

  const serialNew = rows
    .map((r, i) =>
      rows.length === 1 && !r.deviceName
        ? r.newSerial
        : `${label(r, i)}: ${r.newSerial || "-"}`,
    )
    .join(" | ");

  const serialDevices = rows
    .map(
      (r, i) =>
        `${i + 1}) ${label(r, i)} | เดิม=${r.oldSerial || "-"} | ใหม่=${r.newSerial || "-"}`,
    )
    .join("\n");

  return {
    deviceCount: String(rows.length),
    serialOld,
    serialNew,
    serialDevices,
  };
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
    "เลขเอกสาร",
    "เลขรับแจ้ง",
    "กลุ่มสัญญา",
    "สถานะ",
    "วันที่แจ้ง_raw",
    "วันที่แจ้ง_แสดง_พศ",
    "วันที่สร้างในระบบ_raw",
    "วันที่สร้างในระบบ_แสดง_พศ",
    "วันที่ปิดงาน_raw",
    "วันที่ปิดงาน_แสดง_พศ",
    "ระยะเวลาจบงาน_วัน",
    "ผู้แจ้ง",
    "เบอร์โทร",
    "อีเมล",
    "จังหวัด",
    "อำเภอ",
    "สถานที่",
    "รายละเอียด",
    "ประเภทสถานที่",
    "ประเภทงาน_กลุ่ม",
    "ประเภทงาน_raw",
    "สาเหตุ",
    "วิธีแก้",
    "หมายเหตุการซ่อม",
    "จำนวนอุปกรณ์",
    "serial_เดิม",
    "serial_ใหม่",
    "รายการ_S/N",
    "id_ผู้รับผิดชอบ",
    "ผู้รับผิดชอบ",
  ];

  const lines: string[] = [headers.map(csvEscapeCell).join(",")];

  for (const j of jobs) {
    const contract =
      j.isOutOfContract === true ? "นอกสัญญา" : j.isOutOfContract === false ? "สัญญา" : "";
    const serial = formatSerialFieldsForCsv(j.oldSerialNumber, j.newSerialNumber);
    const row = [
      j.id,
      j.ticketNo ?? "",
      j.requestTicketNo ?? "",
      contract,
      STATUS_TH[j.status] ?? j.status,
      j.reportDate ?? "",
      formatThaiDateTimeDisplay(j.reportDate) ?? "",
      j.createdAt ?? "",
      formatThaiDateTimeDisplay(j.createdAt) ?? "",
      j.fixDate ?? "",
      formatThaiDateTimeDisplay(j.fixDate) ?? "",
      workDurationDays(j),
      j.reporterName ?? "",
      j.reporterPhone ?? "",
      j.reporterEmail ?? "",
      j.province ?? "",
      j.district ?? "",
      j.location ?? "",
      j.description ?? "",
      fixEnvDisplay(j.fixEnvironment),
      brokenPartDisplay(j.brokenPart),
      j.brokenPart ?? "",
      j.cause ?? "",
      j.fixMethod ?? "",
      stripReopenAuditFromFixNote(j.fixNote),
      serial.deviceCount,
      serial.serialOld,
      serial.serialNew,
      serial.serialDevices,
      j.assignedTo?.id ?? "",
      j.assignedTo?.name ?? "",
    ];
    lines.push(row.map(csvEscapeCell).join(","));
  }

  return lines.join("\r\n");
}

export { workDurationDays };

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
