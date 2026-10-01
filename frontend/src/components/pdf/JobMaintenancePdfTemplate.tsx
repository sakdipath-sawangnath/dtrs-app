"use client";

import type { CSSProperties, RefObject } from "react";
import { Fragment, useRef } from "react";
import ManagedImage from "@/components/ManagedImage";
import { PdfReportHeader } from "@/components/pdf/PdfReportHeader";
import { sarabun } from "@/lib/fonts";
import { REPORT_PDF_HEADER } from "@/lib/reportPdfConstants";
import { stripReopenAuditFromFixNote } from "@/lib/stripReopenAuditFromFixNote";

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
  subdistrict?: string;
  agency?: string;
  location?: string;
  description?: string;
  title?: string;
  images?: string[] | null;
  assignedTo?: { id: number; name: string } | null;
  fixDate?: string | null;
  brokenPart?: string | null;
  fixEnvironment?: string | null;
  cause?: string | null;
  fixMethod?: string | null;
  fixImages?: string[] | null;
  fixNote?: string | null;
  oldSerialNumber?: string | null;
  newSerialNumber?: string | null;
  systemStatus?: string | null;
  reporterSignature?: string | null;
  reporterSignedAt?: string | null;
};

/** โลโก้ NBTC — re-export สำหรับ backward compat */
export { REPORT_LOGO_SRC } from "@/lib/reportPdfConstants";

/** กระดาษ A4 */
const PAGE: CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  boxSizing: "border-box",
  backgroundColor: "#ffffff",
  color: "#000000",
  padding: "15mm",
  margin: 0,
};

/** ความกว้างเนื้อหา — ให้ print.css กำหนด max-width 182mm */
const CONTENT: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  margin: "0 auto",
  boxSizing: "border-box",
  border: "1px solid #000000",
};

const BORDER: CSSProperties = {
  borderCollapse: "collapse" as const,
  borderSpacing: 0,
  width: "100%",
  tableLayout: "fixed" as const,
};

const cell: CSSProperties = {
  border: "1px solid #000000",
  padding: "4px 6px",
  color: "#000000",
  backgroundColor: "#ffffff",
  textAlign: "left" as const,
  boxSizing: "border-box" as const,
  verticalAlign: "top" as const,
};

const pdfFieldLabel: CSSProperties = {
  fontWeight: 700,
  color: "#000000",
};

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

function FieldCell({ label, value }: { label: string; value: string }) {
  return (
    <td style={cell}>
      <span style={pdfFieldLabel}>{label}: </span>
      {value}
    </td>
  );
}

function SignatureBlock({
  signatureSrc,
  printedName,
  caption,
}: {
  signatureSrc?: string | null;
  printedName?: string | null;
  caption: string;
}) {
  const name = printedName?.trim() || "";
  return (
    <td
      style={{
        border: "none",
        textAlign: "center",
        verticalAlign: "bottom",
        padding: "12px 16px 8px",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 6,
          margin: "0 8px 4px",
          minHeight: 56,
        }}
      >
        <span style={{ fontSize: 9, flexShrink: 0, paddingBottom: 2 }}>ลงชื่อ</span>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            borderBottom: "1px dotted #000000",
            minHeight: 56,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: 2,
          }}
        >
          {signatureSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signatureSrc}
              alt={caption}
              style={{ maxHeight: 52, maxWidth: "100%", objectFit: "contain" }}
            />
          ) : null}
        </div>
      </div>
      <div
        style={{
          fontSize: 9,
          textAlign: "center",
          margin: "0 8px 6px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <span style={{ flexShrink: 0 }}>   (</span>
        <span
          style={{
            flex: 1,
            minWidth: 48,
            borderBottom: name ? "none" : "1px dotted #000000",
            textAlign: "center",
            paddingBottom: 1,
          }}
        >
          {name || "\u00a0"}
        </span>
        <span style={{ flexShrink: 0 }}>)</span>
      </div>
      <div style={{ fontSize: 9, textAlign: "center" }}>({caption})</div>
    </td>
  );
}

export type PdfPrefetchedImages = {
  issue: (string | null)[];
  fix: (string | null)[];
  reporterSignature?: string | null;
  staffSignature?: string | null;
};

type Props = {
  job: JobMaintenancePdfJob;
  page1Ref?: RefObject<HTMLDivElement | null>;
  page2Ref?: RefObject<HTMLDivElement | null>;
  prefetchedImages?: PdfPrefetchedImages;
  showScreenPageLabels?: boolean;
};

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
  const causeLine = job.cause?.trim() || "–";
  const fixNoteForPdf = stripReopenAuditFromFixNote(job.fixNote);
  const fixParts =
    [job.fixMethod?.trim(), fixNoteForPdf || undefined]
      .filter(Boolean)
      .join("\n\n") || "–";
  const equipLines = formatEquipmentSerialForPdf(
    job.oldSerialNumber,
    job.newSerialNumber,
  );
  const statusLine = job.systemStatus?.trim() || "ใช้งานได้ปกติ";

  const issueImgs = padImages(job.images as string[] | null, 3);
  const fixImgs = padImages(job.fixImages as string[] | null, 3);

  const fontFamily = sarabun.style.fontFamily;
  const pageFont = (size: number): CSSProperties => ({
    fontSize: size,
    lineHeight: 1.35,
    fontFamily,
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
        style={{ ...PAGE, ...pageFont(10) }}
      >
        <PdfReportHeader fontFamily={fontFamily} />
        <div className="pdf-report-content" style={CONTENT}>
          <table style={{ ...BORDER, fontSize: 10 }}>
            <tbody>
              <tr>
                <td
                  style={{
                    ...cell,
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: 12,
                    padding: "8px",
                  }}
                >
                  {REPORT_PDF_HEADER.title}
                </td>
              </tr>
            </tbody>
          </table>

          <table style={{ ...BORDER, fontSize: 9 }}>
            <colgroup>
              <col style={{ width: "50%" }} />
              <col style={{ width: "50%" }} />
            </colgroup>
            <tbody>
              <tr>
                <FieldCell label="เลขที่ใบแจ้งซ่อม" value={job.ticketNo || "–"} />
                <FieldCell
                  label="วันที่ได้รับแจ้งซ่อม"
                  value={fmtDate(reportDt)}
                />
              </tr>
              <tr>
                <FieldCell label="ชื่อสถานี" value={job.location || "–"} />
                <FieldCell
                  label="วันที่ดำเนินการแล้วเสร็จ"
                  value={fmtDate(fixDt)}
                />
              </tr>
              <tr>
                <FieldCell label="ตำบล" value={job.subdistrict || "–"} />
                <td style={cell}>&nbsp;</td>
              </tr>
              <tr>
                <FieldCell label="อำเภอ" value={job.district || "–"} />
                <td style={cell}>&nbsp;</td>
              </tr>
              <tr>
                <FieldCell label="จังหวัด" value={job.province || "–"} />
                <FieldCell
                  label="ผู้เข้าดำเนินการ"
                  value={job.assignedTo?.name || "–"}
                />
              </tr>
            </tbody>
          </table>

          <table style={{ ...BORDER, fontSize: 9 }}>
            <colgroup>
              <col style={{ width: "48%" }} />
              <col style={{ width: "52%" }} />
            </colgroup>
            <tbody>
              <tr>
                <td
                  colSpan={2}
                  style={{
                    ...cell,
                    textAlign: "center",
                    fontWeight: 700,
                    padding: "6px 8px",
                  }}
                >
                  {REPORT_PDF_HEADER.detailsHeading}
                </td>
              </tr>
              <tr>
                <td rowSpan={2} style={cell}>
                  <span style={pdfFieldLabel}>สถานที่: </span>
                  {job.agency || "–"}
                </td>
                <td style={cell}>
                  <span style={pdfFieldLabel}>ชื่อผู้แจ้งเหตุขัดข้อง: </span>
                  {job.reporterName || "–"}
                </td>
              </tr>
              <tr>
                <td style={cell}>
                  <span style={pdfFieldLabel}>เบอร์โทร: </span>
                  {job.reporterPhone || "–"}
                </td>
              </tr>
              <FullRow label="เหตุขัดข้อง" body={issueLine} />
              <FullRow label="สาเหตุ" body={causeLine} />
              <FullRow
                label="วิธีการแก้ไขและผลทดสอบ"
                body={fixParts}
                tall
                stackLabel
              />
              <FullRow label="รายการอุปกรณ์" body={equipLines} tall stackLabel />
              <FullRow label="สถานะการแก้ไข" body={statusLine} />
            </tbody>
          </table>

          <table
            className="pdf-signature-block"
            style={{ ...BORDER, fontSize: 9, marginTop: 0, border: "none" }}
          >
            <colgroup>
              <col style={{ width: "50%" }} />
              <col style={{ width: "50%" }} />
            </colgroup>
            <tbody>
              <tr>
                <SignatureBlock
                  signatureSrc={prefetchedImages?.staffSignature}
                  printedName={job.assignedTo?.name}
                  caption="ผู้เข้าดำเนินการ"
                />
                <SignatureBlock
                  signatureSrc={prefetchedImages?.reporterSignature}
                  printedName={job.reporterName}
                  caption="ผู้แจ้งเหตุขัดข้อง / ผู้ใช้งาน"
                />
              </tr>
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
        style={{ ...PAGE, ...pageFont(9) }}
      >
        <PdfReportHeader fontFamily={fontFamily} />
        <div className="pdf-report-content" style={CONTENT}>
          <table className="pdf-images-table" style={{ ...BORDER }}>
            <colgroup>
              <col style={{ width: "50%" }} />
              <col style={{ width: "50%" }} />
            </colgroup>
            <tbody>
              <tr>
                <td
                  colSpan={2}
                  className="pdf-page-2-heading"
                  style={{
                    ...cell,
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "8px",
                  }}
                >
                  {REPORT_PDF_HEADER.imagesHeading}
                </td>
              </tr>
              {[0, 1, 2].map((i) => (
                <Fragment key={i}>
                  <tr>
                    <td style={{ ...cell, padding: "6px 8px 2px", borderBottom: "none" }}>
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
                    <td style={{ ...cell, padding: "6px 8px 2px", borderBottom: "none" }}>
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
                  <tr>
                    <td
                      className="pdf-image-caption"
                      style={{
                        ...cell,
                        padding: "2px 8px 8px",
                        fontWeight: 700,
                        fontSize: 9,
                        borderTop: "none",
                      }}
                    >
                      {REPORT_PDF_HEADER.imageCaptionIssue}
                    </td>
                    <td
                      className="pdf-image-caption"
                      style={{
                        ...cell,
                        padding: "2px 8px 8px",
                        fontWeight: 700,
                        fontSize: 9,
                        borderTop: "none",
                      }}
                    >
                      {REPORT_PDF_HEADER.imageCaptionFix}
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function FullRow({
  label,
  body,
  tall,
  stackLabel,
}: {
  label: string;
  body: string;
  tall?: boolean;
  stackLabel?: boolean;
}) {
  if (stackLabel) {
    return (
      <tr>
        <td colSpan={2} style={cell}>
          <div style={{ color: "#000000" }}>
            <div style={{ marginBottom: 4 }}>
              <span style={pdfFieldLabel}>{label}:</span>
            </div>
            <div
              style={{
                whiteSpace: "pre-wrap",
                minHeight: tall ? 32 : 18,
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
      <td colSpan={2} style={cell}>
        <div
          style={{
            color: "#000000",
            whiteSpace: "pre-wrap",
            minHeight: tall ? 40 : 20,
          }}
        >
          <span style={pdfFieldLabel}>{label}: </span>
          <span>{body}</span>
        </div>
      </td>
    </tr>
  );
}

export const PdfTemplate = JobMaintenancePdfTemplate;
