import { z } from 'zod';

/** ลบ zero-width / BOM ที่ทำให้ email() fail แม้มองเหมือนถูก */
function stripInvisible(s: string): string {
  return s.replace(/[\u200B-\u200D\uFEFF]/g, '');
}

/** รองรับ string | string[] จาก multipart; เอาค่าที่ไม่ว่างตัวสุดท้าย; ลบช่องว่างทั้งหมดในอีเมล (กันพิมพ์เว้น เช่น "a@ gmail.com") */
function normalizeOptionalEmail(val: unknown): string {
  const collapseSpaces = (s: string) => stripInvisible(s).replace(/\s+/g, '');
  if (val === undefined || val === null) return '';
  if (Array.isArray(val)) {
    const nonEmpty = val
      .map((v) => (v === undefined || v === null ? '' : collapseSpaces(String(v).trim())))
      .filter((s) => s.length > 0);
    return nonEmpty.length ? nonEmpty[nonEmpty.length - 1] : '';
  }
  return collapseSpaces(String(val).trim());
}

export const CreateJobSchema = z.object({
  province: z.string().trim().min(1, 'กรุณาระบุจังหวัด'),
  district: z.string().trim().min(1, 'กรุณาระบุอำเภอ'),
  location: z.string().trim().min(1, 'กรุณาระบุสถานที่'),
  description: z.string().trim().min(10, 'รายละเอียดต้องมีอย่างน้อย 10 ตัวอักษร'),
  title: z.string().trim().optional(),
  reporterName: z.string().trim().min(1, 'กรุณาระบุชื่อผู้แจ้ง'),
  reporterPhone: z.string().trim().regex(/^[0-9]{9,10}$/, 'เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก'),
  /**
   * multipart อาจส่ง '' / ไม่มีฟิลด์ / หรือซ้ำชื่อ → Multer ให้เป็น string[]
   * ห้ามใช้ String(array) ตรงๆ — เช่น ['', 'a@b.com'] กลายเป็น ',a@b.com' แล้ว email() fail
   */
  reporterEmail: z.preprocess(
    (val) => normalizeOptionalEmail(val),
    z.union([z.literal(''), z.string().email('รูปแบบอีเมลไม่ถูกต้อง')]),
  ),
  isOutOfContract: z.any().optional(),
});

export type CreateJobDto = z.infer<typeof CreateJobSchema>;

export const UpdateJobStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED'], {
    errorMap: () => ({ message: 'สถานะต้องเป็น PENDING, IN_PROGRESS หรือ RESOLVED' }),
  }),
});

export type UpdateJobStatusDto = z.infer<typeof UpdateJobStatusSchema>;

/** Reopen: งานเสร็จสิ้น → กำลังแก้ไข (เฉพาะผู้รับงาน) */
export const ReopenJobSchema = z.object({
  reason: z.string().trim().min(1, 'กรุณาระบุเหตุผลในการ Reopen'),
});

export type ReopenJobDto = z.infer<typeof ReopenJobSchema>;

export const UpdateFixInfoSchema = z.object({
  brokenPartType: z.string().optional(),
  cause: z.string().optional(),
  fixMethod: z.string().optional(),
  note: z.string().optional(),
  oldSerialNumber: z.string().optional(),
  newSerialNumber: z.string().optional(),
});

export type UpdateFixInfoDto = z.infer<typeof UpdateFixInfoSchema>;

export const UpdateOutOfContractSchema = z.object({
  isOutOfContract: z
    .union([z.boolean(), z.literal('true'), z.literal('false')])
    .transform((v) => v === true || v === 'true'),
});

export type UpdateOutOfContractDto = z.infer<typeof UpdateOutOfContractSchema>;

export const AssignStaffSchema = z.object({
  staffId: z.number().int().positive('รหัสเจ้าหน้าที่ต้องเป็นตัวเลขบวก'),
});

export type AssignStaffDto = z.infer<typeof AssignStaffSchema>;
