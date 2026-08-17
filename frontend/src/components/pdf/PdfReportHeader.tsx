"use client";

import type { CSSProperties } from "react";
import ManagedImage from "@/components/ManagedImage";
import {
  REPORT_LOGO_FORTH,
  REPORT_LOGO_NBTC,
  REPORT_PDF_HEADER,
} from "@/lib/reportPdfConstants";

const BORDER: CSSProperties = {
  borderCollapse: "collapse",
  borderSpacing: 0,
  width: "100%",
  tableLayout: "fixed",
};

const headerCell: CSSProperties = {
  border: "none",
  padding: "4px 8px",
  color: "#000000",
  backgroundColor: "#ffffff",
  boxSizing: "border-box",
  verticalAlign: "middle",
};

type Props = {
  fontFamily: string;
};

/** หัวรายงาน CM — โลโก้ซ้าย/ขวา ไม่มีกรอบเซลล์ เส้นคั่นใต้หัวตาม CM.pdf */
export function PdfReportHeader({ fontFamily }: Props) {
  const contractLine = `สัญญาเลขที่ ${REPORT_PDF_HEADER.contractNo} ลงวันที่ ${REPORT_PDF_HEADER.contractDate}`;

  return (
    <div className="pdf-report-header-wrap">
      <table
        className="pdf-report-header"
        style={{ ...BORDER, fontSize: 10, fontFamily }}
      >
        <colgroup>
          <col style={{ width: "20%" }} />
          <col style={{ width: "60%" }} />
          <col style={{ width: "20%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={{ ...headerCell, textAlign: "center" }}>
              <ManagedImage
                forceRaw
                src={REPORT_LOGO_NBTC}
                alt="กสทช."
                className="pdf-logo-nbtc"
                style={{ maxHeight: 88, maxWidth: 80, objectFit: "contain" }}
              />
            </td>
            <td
              style={{
                ...headerCell,
                textAlign: "center",
                lineHeight: 1.45,
                padding: "6px 8px",
                fontSize: 10,
              }}
            >
              <div>{REPORT_PDF_HEADER.line1}</div>
              <div>{REPORT_PDF_HEADER.line2}</div>
              <div>{REPORT_PDF_HEADER.line3}</div>
              <div style={{ marginTop: 4 }}>{contractLine}</div>
            </td>
            <td style={{ ...headerCell, textAlign: "center" }}>
              <ManagedImage
                forceRaw
                src={REPORT_LOGO_FORTH}
                alt="FORTH"
                className="pdf-logo-forth"
                style={{ maxHeight: 52, maxWidth: 180, objectFit: "contain" }}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
