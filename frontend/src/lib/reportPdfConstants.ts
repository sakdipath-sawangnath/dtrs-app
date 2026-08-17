/** ข้อความหัวรายงาน CM (SHF) — hardcode ตามเทมเพลต CM.pdf */
export const REPORT_PDF_HEADER = {
  line1: "การจัดซื้ออุปกรณ์พร้อมดำเนินการติดตั้ง",
  line2:
    "โครงการเพิ่มประสิทธิภาพโครงข่ายสื่อสารด้วยอุปกรณ์ทวนสัญญาณผ่านคลื่นความถี่สูง (SHF)",
  line3:
    "เพื่อสนับสนุนการปฏิบัติราชการและแก้ไขปัญหาให้กับประชาชนพื้นที่ห่างไกล",
  contractNo: "8680228",
  contractDate: "23 กรกฎาคม 2568",
  title: "รายงานการซ่อมแซมแก้ไขข้อขัดข้อง",
  detailsHeading: "รายละเอียดการซ่อมแซม",
  imagesHeading: "รูปภาพประกอบ",
  imageCaptionIssue: "1. รูปภาพข้อขัดข้อง",
  imageCaptionFix: "2. รูปภาพการแก้ไข",
} as const;

export const REPORT_LOGO_NBTC = "/logo/NBTC.png";
export const REPORT_LOGO_FORTH = "/logo/logo-FORTH.png";

/** @deprecated ใช้ REPORT_LOGO_NBTC */
export const REPORT_LOGO_SRC = REPORT_LOGO_NBTC;
