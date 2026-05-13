"use client";

import type { CSSProperties, RefObject } from "react";
import { useRef } from "react";
import ManagedImage from "@/components/ManagedImage";
import { sarabun } from "@/lib/fonts";

/** ข้อมูลงานสำหรับเทมเพลต PDF (สอดคล้องกับ JobDetail หน้า dashboard) */
export type JobMaintenancePdfJob = {
  id: number;
  /** ใช้ตรวจบนหน้าพิมพ์ (เช่น ต้องเป็น RESOLVED) */
  status?: string;
  ticketNo?: string;
  reportDate?: string;
  createdAt: string;
  reporterName?: string;
  reporterPhone?: string;
  province?: string;
  district?: string;
  location?: string;
  description?: string;
  title?: string;
  images?: string[] | null;
  assignedTo?: { id: number; name: string } | null;
  fixDate?: string | null;
  /** หลังปิดงานมักเป็น Hardware | Software (ประเภทงาน) */
  brokenPart?: string | null;
  /** INDOOR | OUTDOOR — ประเภทสถานที่ตอนแก้ไข */
  fixEnvironment?: string | null;
  cause?: string | null;
  fixMethod?: string | null;
  fixImages?: string[] | null;
  fixNote?: string | null;
  oldSerialNumber?: string | null;
  newSerialNumber?: string | null;
  systemStatus?: string | null;
};

const PROJECT_SUBTITLE =
  "โครงการค่าปรับปรุงระบบเครือข่ายกล้องโทรทัศน์วงจรปิด (CCTV) 5 จังหวัดชายแดนภาคใต้";

/** โลโก้ใน `frontend/public/logo/dopa-logo.png` → ใช้ path สาธารณะของ Next.js */
export const REPORT_LOGO_SRC = "/logo/dopa-logo.png";

/** สไตล์พื้นฐาน — ใช้เฉพาะ hex/rgb (ห้ามพึ่ง Tailwind สี theme เพราะ v4 ใช้ oklch แล้ว html2canvas parse ไม่ได้) */

/** กระดาษ A4 + เว้นขอบ 15mm (1.5 cm) จากขอบกระดาษทุกด้าน — ตารางไม่เต็มแผ่น อยู่กึ่งกลางพื้นที่พิมพ์ */
const PAGE: CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  boxSizing: "border-box",
  backgroundColor: "#ffffff",
  color: "#000000",
  padding: "15mm",
  margin: 0,
};

/**
 * บล็อกเนื้อหาภายในขอบ — ความกว้างสูงสุด 15 cm (150mm) จัดกึ่งกลาง
 * (พื้นที่หลังเว้นขอบ 15mm แล้ว ≈ 180mm — ตารางแคบลงให้สมดุลตามตัวอย่าง)
 */
const CONTENT: CSSProperties = {
  width: "150mm",
  maxWidth: "100%",
  margin: "0 auto",
  boxSizing: "border-box",
};

/**
 * ขอบตาราง — collapse ให้เส้นร่วมกันเป็นสายเดียวระหว่างเซลล์
 * (หลาย <table> ต่อกัน = ขอบล่าง+บนซ้อนกัน ดูเป็นเส้นคู่ใน html2canvas)
 */
const BORDER: CSSProperties = {
  borderCollapse: "collapse" as const,
  borderSpacing: 0,
  width: "100%",
  tableLayout: "fixed" as const,
};

/** เส้นขอบตาราง — ใส่ที่ td เท่านั้น + collapse (สีดำตามตัวอย่างรายงาน) */
const cell: CSSProperties = {
  border: "1px solid #000000",
  padding: "10px 12px",
  color: "#000000",
  backgroundColor: "#ffffff",
  textAlign: "left" as const,
  boxSizing: "border-box" as const,
};

/** ป้ายกำกับฟิลด์ในตาราง PDF — ตัวหนาให้แยกจากค่าได้ชัด */
const pdfFieldLabel: CSSProperties = {
  fontWeight: 700,
  color: "#000000",
};

/** รองรับ legacy สองฟิลด์ + JSON หลายแถวใน oldSerialNumber */
function formatEquipmentSerialForPdf(
  oldSerialNumber: string | null | undefined,
  newSerialNumber: string | null | undefined,
): string {
  const o = (oldSerialNumber ?? "").trim();
  if (o.startsWith("{")) {
    try {
      const j = JSON.parse(o) as {
        v?: number;
        rows?: Array<{ n?: string; o?: string; x?: string }>;
      };
      if (j?.v === 1 && Array.isArray(j.rows) && j.rows.length > 0) {
        const lines = j.rows
          .map((r, i) => {
            const name = String(r.n ?? "").trim();
            const os = String(r.o ?? "").trim();
            const xs = String(r.x ?? "").trim();
            const bits: string[] = [];
            bits.push(name ? `${i + 1}. ${name}` : `${i + 1}.`);
            if (os) bits.push(`S/N เดิม: ${os}`);
            if (xs) bits.push(`S/N ใหม่: ${xs}`);
            return bits.join(" — ");
          })
          .filter((line) => line.length > 1);
        return lines.length ? lines.join("\n") : "–";
      }
    } catch {
      /* fallthrough */
    }
  }
  const legacy = [
    o && `Serial เดิม: ${o}`,
    (newSerialNumber ?? "").trim() && `Serial ใหม่: ${(newSerialNumber ?? "").trim()}`,
  ]
    .filter(Boolean)
    .join("\n");
  return legacy || "–";
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "–";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "–";
  return dt.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function fmtTime(d: string | null | undefined): string {
  if (!d) return "–";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "–";
  return dt.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatFixEnvironmentLabel(v: string | null | undefined): string {
  if (!v?.trim()) return "–";
  const u = v.trim().toUpperCase();
  if (u === "INDOOR") return "Indoor (ในอาคาร)";
  if (u === "OUTDOOR") return "Outdoor (นอกอาคาร)";
  return v.trim();
}

/** ค่าในฟิลด์ brokenPart หลังบันทึกการแก้ไข = ประเภทงาน */
function formatJobTypeLabel(v: string | null | undefined): string {
  if (!v?.trim()) return "–";
  const t = v.trim();
  const lower = t.toLowerCase();
  if (lower === "hardware") return "Hardware (ฮาร์ดแวร์)";
  if (lower === "software") return "Software (ซอฟต์แวร์)";
  return t;
}

/** ไม่ใช้ brokenPart เป็นข้อความข้อขัดข้องถ้าเป็นค่า Hardware/Software อย่างเดียว */
function isStoredJobTypeOnly(v: string | null | undefined): boolean {
  if (!v?.trim()) return false;
  const lower = v.trim().toLowerCase();
  return lower === "hardware" || lower === "software";
}

function padImages(urls: string[] | null | undefined, n: number): (string | null)[] {
  const a = [...(urls || [])].filter(Boolean).slice(0, n);
  const out: (string | null)[] = [];
  for (let i = 0; i < n; i++) out.push(a[i] ?? null);
  return out;
}

/** รูป issue/fix — `/job-images/...` บน PRD ไป Next โดยไม่ต้องแยก NPM ใต้ `/api` หรือ data URL จาก prefetch */
function JobProxiedImage({
  jobId,
  kind,
  index,
  alt,
  prefetchedSrc,
}: {
  jobId: number;
  kind: "issue" | "fix";
  index: number;
  alt: string;
  prefetchedSrc?: string | null;
}) {
  const src =
    prefetchedSrc && prefetchedSrc.length > 0
      ? prefetchedSrc
      : `/job-images/${jobId}/${kind}/${index}`;
  return (
    <ManagedImage
      forceRaw
      className="pdf-print-img"
      src={src}
      alt={alt}
      style={{
        display: "block",
        margin: "0 auto",
        maxWidth: "100%",
        objectFit: "contain",
      }}
    />
  );
}

export type PdfPrefetchedImages = {
  issue: (string | null)[];
  fix: (string | null)[];
};

type Props = {
  job: JobMaintenancePdfJob;
  /** ถ้าไม่ส่ง (เช่น หน้าพิมพ์) ใช้ ref ภายใน — ยังใช้กับ html2canvas บนหน้ารายละเอียดงานได้ */
  page1Ref?: RefObject<HTMLDivElement | null>;
  page2Ref?: RefObject<HTMLDivElement | null>;
  /** data URL จาก prefetch ฝั่งเซิร์ฟเวอร์ — ใช้เมื่อไม่มี cookie (เช่น Puppeteer) */
  prefetchedImages?: PdfPrefetchedImages;
  /** แสดงป้ายหมายเลขหน้าบนจอเท่านั้น (คลาส no-print) — ใช้หน้า /print/jobs */
  showScreenPageLabels?: boolean;
};

/**
 * เทมเพลตรายงาน 2 หน้า — html2canvas ไม่รองรับสีแบบ oklch() ของ Tailwind v4 จึงใช้ inline style (hex) เป็นหลัก
 */
export function JobMaintenancePdfTemplate({
  job,
  page1Ref: page1RefProp,
  page2Ref: page2RefProp,
  prefetchedImages,
  showScreenPageLabels = false,
}: Props) {
  const internalPage1Ref = useRef<HTMLDivElement | null>(null);
  const internalPage2Ref = useRef<HTMLDivElement | null>(null);
  const page1Ref = page1RefProp ?? internalPage1Ref;
  const page2Ref = page2RefProp ?? internalPage2Ref;

  const reportDt = job.reportDate ?? job.createdAt;
  const fixDt = job.fixDate;
  const issueLine =
    job.description?.trim() ||
    job.title?.trim() ||
    (isStoredJobTypeOnly(job.brokenPart) ? "" : job.brokenPart?.trim()) ||
    "–";
  const fixEnvironmentLine = formatFixEnvironmentLabel(job.fixEnvironment);
  const jobTypeLine = formatJobTypeLabel(job.brokenPart);
  const causeLine = job.cause?.trim() || "–";
  const fixParts =
    [job.fixMethod?.trim(), job.fixNote?.trim()].filter(Boolean).join("\n\n") || "–";
  const equipLines = formatEquipmentSerialForPdf(
    job.oldSerialNumber,
    job.newSerialNumber,
  );
  const statusLine = job.systemStatus?.trim() || "แล้วเสร็จ";

  const issueImgs = padImages(job.images as string[] | null, 3);
  const fixImgs = padImages(job.fixImages as string[] | null, 3);

  const pageFont = (size: number): CSSProperties => ({
    fontSize: size,
    lineHeight: 1.35,
    // next/font ให้ชื่อฟอนต์ที่โหลดแล้ว — ห้ามใส่ Tahoma ก่อน Sarabun จะไม่ถูกใช้
    fontFamily: sarabun.style.fontFamily,
  });

  return (
    <>
      {showScreenPageLabels && (
        <div className="no-print mx-auto w-full max-w-[210mm] px-2 sm:px-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500">
            หน้า 1 จาก 2 · เนื้อหารายงาน
          </p>
        </div>
      )}
      <div
        ref={page1Ref}
        className={`${sarabun.className} pdf-page-1`}
        style={{ ...PAGE, ...pageFont(11) }}
      >
        <div className="pdf-report-content" style={CONTENT}>
        <h1 style={{ textAlign: "center", fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "#000000" }}>
          รายงานการซ่อมบำรุงรักษาอุปกรณ์
        </h1>
        <p style={{ textAlign: "center", fontSize: 11, margin: "0 0 8px", color: "#000000", lineHeight: 1.35 }}>
          {PROJECT_SUBTITLE}
        </p>

        {/** ตารางหัว: คอลัมน์ซ้ายแคบ (โลโก้ rowspan 4) + 2 คอลัมน์ขวา 4 แถว — แยกจากตารางรายละเอียด */}
        <table style={{ ...BORDER, marginTop: 16, fontSize: 10 }}>
          <colgroup>
            <col style={{ width: "28mm" }} />
            <col />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <td
                rowSpan={4}
                style={{
                  ...cell,
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 88 }}>
                  <ManagedImage
                    forceRaw
                    src={REPORT_LOGO_SRC}
                    alt="ตราหน่วยงาน"
                    style={{ maxHeight: 68, maxWidth: 68, objectFit: "contain" }}
                  />
                </div>
              </td>
              <td style={{ ...cell, verticalAlign: "top" }}>
                <span style={pdfFieldLabel}>เลขที่ใบแจ้งซ่อม: </span>
                {job.ticketNo || "–"}
              </td>
              <td style={{ ...cell, verticalAlign: "top" }}>
                <span style={pdfFieldLabel}>อำเภอ: </span>
                {job.district || "–"}
              </td>
            </tr>
            <tr>
              <td style={{ ...cell, verticalAlign: "top" }}>
                <span style={pdfFieldLabel}>วันที่แจ้งซ่อม: </span>
                {fmtDate(reportDt)}
              </td>
              <td style={{ ...cell, verticalAlign: "top" }}>
                <span style={pdfFieldLabel}>จังหวัด: </span>
                {job.province || "–"}
              </td>
            </tr>
            <tr>
              <td style={{ ...cell, verticalAlign: "top" }}>
                <span style={pdfFieldLabel}>เวลาแจ้งซ่อม: </span>
                {fmtTime(reportDt)}
              </td>
              <td style={{ ...cell, verticalAlign: "top" }}>
                <span style={pdfFieldLabel}>ผู้แก้ไข: </span>
                {job.assignedTo?.name || "–"}
              </td>
            </tr>
            <tr>
              <td style={{ ...cell, verticalAlign: "top" }}>
                <span style={pdfFieldLabel}>วันที่แก้ไข: </span>
                {fmtDate(fixDt)}
              </td>
              <td style={{ ...cell, verticalAlign: "top" }}>
                <span style={pdfFieldLabel}>เวลาที่แก้ไข: </span>
                {fmtTime(fixDt)}
              </td>
            </tr>
          </tbody>
        </table>

        {/** ไม่อยู่ในตาราง — ไม่มีเส้นขอบ/พื้นหลัง (ตามตัวอย่างรูป) */}
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            fontWeight: 700,
            margin: "12px 0 8px",
            padding: 0,
            color: "#000000",
            border: "none",
            backgroundColor: "transparent",
          }}
        >
          รายละเอียดการซ่อมบำรุง
        </p>

        <table style={{ ...BORDER, marginTop: 0, fontSize: 10 }}>
          <colgroup>
            <col style={{ width: "48%" }} />
            <col style={{ width: "52%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td rowSpan={2} style={{ ...cell, verticalAlign: "top" }}>
                <span style={pdfFieldLabel}>สถานที่: </span>
                {job.location || "–"}
              </td>
              <td style={{ ...cell, verticalAlign: "top" }}>
                <span style={pdfFieldLabel}>ชื่อ-สกุล: </span>
                {job.reporterName || "–"}
              </td>
            </tr>
            <tr>
              <td style={{ ...cell, verticalAlign: "top" }}>
                <span style={pdfFieldLabel}>เบอร์โทร: </span>
                {job.reporterPhone || "–"}
              </td>
            </tr>
            <tr>
              <td style={{ ...cell, verticalAlign: "top" }}>
                <span style={pdfFieldLabel}>ประเภทสถานที่: </span>
                {fixEnvironmentLine}
              </td>
              <td style={{ ...cell, verticalAlign: "top" }}>
                <span style={pdfFieldLabel}>ประเภทงาน: </span>
                {jobTypeLine}
              </td>
            </tr>
            <FullRow label="ข้อขัดข้อง" body={issueLine} />
            <FullRow label="สาเหตุ" body={causeLine} />
            <FullRow label="วิธีแก้ไข" body={fixParts} tall />
            <FullRow label="รายการอุปกรณ์" body={equipLines} tall stackLabel />
            <FullRow label="สถานะระบบ" body={statusLine} />
          </tbody>
        </table>
        </div>
      </div>

      {showScreenPageLabels && (
        <div className="no-print mx-auto w-full max-w-[210mm] px-2 pt-6 sm:px-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500">
            หน้า 2 จาก 2 · รูปภาพประกอบ
          </p>
        </div>
      )}
      <div
        ref={page2Ref}
        className={`${sarabun.className} pdf-page-2`}
        style={{ ...PAGE, ...pageFont(10) }}
      >
        <div className="pdf-report-content" style={CONTENT}>
        <h2
          className="pdf-page-2-heading"
          style={{ textAlign: "center", fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: "#000000" }}
        >
          รูปภาพประกอบ
        </h2>
        <table className="pdf-images-table" style={{ ...BORDER, marginTop: 12 }}>
          <colgroup>
            <col style={{ width: "50%" }} />
            <col style={{ width: "50%" }} />
          </colgroup>
          <tbody>
            {[0, 1, 2].map((i) => (
              <tr key={i}>
                <td
                  style={{
                    ...cell,
                    width: "50%",
                    verticalAlign: "top",
                    paddingTop: i > 0 ? 12 : 10,
                  }}
                >
                  <div className="pdf-image-label" style={{ marginBottom: 6, fontWeight: 700, color: "#000000" }}>
                    {i + 1}.รูปภาพข้อขัดข้อง:
                  </div>
                  <div
                    className="pdf-image-slot"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    {issueImgs[i] ? (
                      <JobProxiedImage
                        jobId={job.id}
                        kind="issue"
                        index={i}
                        alt={`ข้อขัดข้อง ${i + 1}`}
                        prefetchedSrc={prefetchedImages?.issue?.[i]}
                      />
                    ) : (
                      <span style={{ fontSize: 9, color: "#64748b" }}>–</span>
                    )}
                  </div>
                </td>
                <td
                  style={{
                    ...cell,
                    width: "50%",
                    verticalAlign: "top",
                    paddingTop: i > 0 ? 12 : 10,
                  }}
                >
                  <div className="pdf-image-label" style={{ marginBottom: 6, fontWeight: 700, color: "#000000" }}>
                    {i + 1}.รูปภาพการแก้ไข:
                  </div>
                  <div
                    className="pdf-image-slot"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    {fixImgs[i] ? (
                      <JobProxiedImage
                        jobId={job.id}
                        kind="fix"
                        index={i}
                        alt={`การแก้ไข ${i + 1}`}
                        prefetchedSrc={prefetchedImages?.fix?.[i]}
                      />
                    ) : (
                      <span style={{ fontSize: 9, color: "#64748b" }}>–</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}

/** แถวรายละเอียดยาว — colSpan 2 ในตาราง 2 คอลัมน์ */
function FullRow({
  label,
  body,
  tall,
  stackLabel,
}: {
  label: string;
  body: string;
  tall?: boolean;
  /** true = หัวข้อบรรทัดแรก เนื้อหาเริ่มบรรทัดถัดไป (กันรายการหลายบรรทัดชนกับหัวข้อ) */
  stackLabel?: boolean;
}) {
  if (stackLabel) {
    return (
      <tr>
        <td colSpan={2} style={{ ...cell, verticalAlign: "top" }}>
          <div style={{ color: "#000000" }}>
            <div style={{ marginBottom: 6 }}>
              <span style={pdfFieldLabel}>{label}:</span>
            </div>
            <div
              style={{
                whiteSpace: "pre-wrap",
                minHeight: tall ? 72 : 28,
              }}
            >
              {body}
            </div>
          </div>
        </td>
      </tr>
    );
  }
  return (
    <tr>
      <td colSpan={2} style={{ ...cell, verticalAlign: "top" }}>
        <div
          style={{
            color: "#000000",
            whiteSpace: "pre-wrap",
            minHeight: tall ? 80 : 36,
          }}
        >
          <span style={pdfFieldLabel}>{label}: </span>
          <span>{body}</span>
        </div>
      </td>
    </tr>
  );
}

/** alias ตามชื่อที่อ้างอิงใน requirement */
export const PdfTemplate = JobMaintenancePdfTemplate;
