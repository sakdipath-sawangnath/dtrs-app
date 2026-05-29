import { z } from 'zod';
import {
  JobSerialPackedSchema,
  normalizeJobSerialToken,
} from '../job-serial-rows.schema';

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
    z.string().min(1, 'กรุณาระบุอีเมล').email('รูปแบบอีเมลไม่ถูกต้อง'),
  ),
  /** ตำแหน่งงาน — เก็บที่ User ตอนสร้าง/อัปเดตผู้แจ้งจากหน้า public/report */
  reporterPosition: z
    .preprocess((v) => (v === undefined || v === null ? '' : String(v).trim()), z.string().max(200, 'ตำแหน่งยาวเกินไป'))
    .optional(),
  isOutOfContract: z.any().optional(),
});

export type CreateJobDto = z.infer<typeof CreateJobSchema>;

export const UpdateJobStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED'], {
    errorMap: () => ({ message: 'สถานะต้องเป็น PENDING, IN_PROGRESS หรือ RESOLVED' }),
  }),
});

export const CancelJobSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export type UpdateJobStatusDto = z.infer<typeof UpdateJobStatusSchema>;

/** Reopen: งานเสร็จสิ้น → กำลังแก้ไข (เฉพาะผู้รับงาน) */
export const ReopenJobSchema = z.object({
  reason: z.string().trim().min(1, 'กรุณาระบุเหตุผลในการ Reopen'),
});

export type ReopenJobDto = z.infer<typeof ReopenJobSchema>;

/** multipart อาจส่ง string | string[] — เอาค่าที่ไม่ว่างตัวสุดท้าย */
function fixInfoMultipartString(val: unknown): string | undefined {
  if (val === undefined || val === null) return undefined;
  if (Array.isArray(val)) {
    const parts = val
      .map((v) => String(v).trim())
      .filter((s) => s.length > 0);
    return parts.length ? parts[parts.length - 1] : undefined;
  }
  const s = String(val).trim();
  return s.length ? s : undefined;
}

/** แถวเดียว: normalize ตัวอักษร; หลายแถว: คง JSON string ใน oldSerialNumber */
function preprocessFixSerialField(val: unknown): string | undefined {
  const s = fixInfoMultipartString(val);
  if (!s) return undefined;
  if (s.trimStart().startsWith('{')) return s;
  return normalizeJobSerialToken(s);
}

export const UpdateFixInfoSchema = z
  .object({
    brokenPartType: z.string().optional(),
    fixEnvironment: z.preprocess(
      (val) => {
        if (val === undefined || val === null) return undefined;
        const s = String(val).trim();
        if (s === '') return null;
        if (s === 'INDOOR' || s === 'OUTDOOR') return s;
        return undefined;
      },
      z.union([z.enum(['INDOOR', 'OUTDOOR']), z.null()]).optional(),
    ),
    cause: z
      .string()
      .trim()
      .min(1, 'กรุณาระบุสาเหตุ'),
    fixMethod: z
      .string()
      .trim()
      .min(1, 'กรุณาระบุวิธีแก้ไข'),
    note: z.string().optional(),
    oldSerialNumber: z.preprocess(preprocessFixSerialField, z.string().optional()),
    newSerialNumber: z.preprocess(preprocessFixSerialField, z.string().optional()),
  })
  .superRefine((data, ctx) => {
    const o = data.oldSerialNumber;
    const n = data.newSerialNumber;
    if (!o && !n) return;

    if (o && o.trimStart().startsWith('{')) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(o);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'รูปแบบข้อมูล Serial (JSON) ไม่ถูกต้อง',
          path: ['oldSerialNumber'],
        });
        return;
      }
      const res = JobSerialPackedSchema.safeParse(parsed);
      if (!res.success) {
        const msg =
          res.error.errors[0]?.message ?? 'ข้อมูล Serial หลายอุปกรณ์ไม่ถูกต้อง';
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: msg,
          path: ['oldSerialNumber'],
        });
        return;
      }
      if (n != null && n.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'เมื่อใช้ Serial หลายแถว ไม่ต้องส่ง newSerialNumber',
          path: ['newSerialNumber'],
        });
      }
      return;
    }

    const SERIAL_RE = /^[0-9A-Z-]*$/;
    if (o && !SERIAL_RE.test(o)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Serial Number อนุญาตเฉพาะ 0–9, A–Z และ '-' เท่านั้น",
        path: ['oldSerialNumber'],
      });
    }
    if (n && !SERIAL_RE.test(n)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Serial Number อนุญาตเฉพาะ 0–9, A–Z และ '-' เท่านั้น",
        path: ['newSerialNumber'],
      });
    }
  })
  .transform((data) => {
    const o = data.oldSerialNumber;
    const n = data.newSerialNumber;
    if (!o && !n) {
      return {
        ...data,
        oldSerialNumber: null as string | null,
        newSerialNumber: null as string | null,
      };
    }
    if (o && o.trimStart().startsWith('{')) {
      const packed = JobSerialPackedSchema.parse(JSON.parse(o));
      const cleaned = packed.rows.filter((r) => r.n || r.o || r.x);
      if (cleaned.length === 0) {
        return {
          ...data,
          oldSerialNumber: null as string | null,
          newSerialNumber: null as string | null,
        };
      }
      if (cleaned.length === 1 && !cleaned[0].n) {
        return {
          ...data,
          oldSerialNumber: cleaned[0].o || null,
          newSerialNumber: cleaned[0].x || null,
        };
      }
      return {
        ...data,
        oldSerialNumber: JSON.stringify({ v: 1 as const, rows: cleaned }),
        newSerialNumber: null as string | null,
      };
    }
    return {
      ...data,
      oldSerialNumber: o ? normalizeJobSerialToken(o) : null,
      newSerialNumber: n ? normalizeJobSerialToken(n) : null,
    };
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

export const BulkAssignStaffSchema = z.object({
  jobIds: z
    .array(z.number().int().positive())
    .min(1, 'ต้องระบุงานอย่างน้อย 1 รายการ')
    .max(50, 'มอบหมายพร้อมกันได้ไม่เกิน 50 รายการ'),
  staffId: z.number().int().positive('รหัสเจ้าหน้าที่ต้องเป็นตัวเลขบวก'),
});

export type BulkAssignStaffDto = z.infer<typeof BulkAssignStaffSchema>;

/**
 * Backfill วันที่ย้อนหลังของงาน
 * - รับเป็น string (ISO/parse ได้) แล้วแปลงใน service เพื่อควบคุม validation เพิ่มเติม
 * - ต้องส่งอย่างน้อย 1 ฟิลด์
 */
export const BackfillJobDatesSchema = z
  .object({
    reportDate: z.string().trim().optional(),
    fixDate: z.string().trim().optional(),
  })
  .refine(
    (v) =>
      (typeof v.reportDate === 'string' && v.reportDate.length > 0) ||
      (typeof v.fixDate === 'string' && v.fixDate.length > 0),
    { message: 'กรุณาระบุ reportDate หรือ fixDate อย่างน้อย 1 ค่า' },
  );

export type BackfillJobDatesDto = z.infer<typeof BackfillJobDatesSchema>;

export const DashboardSummaryPdfQuerySchema = z
  .object({
    periodType: z.enum(['month', 'year', 'range']),
    month: z.string().trim().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
    year: z
      .string()
      .trim()
      .regex(/^\d{4}$/)
      .optional(),
    start: z.string().trim().optional(),
    end: z.string().trim().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.periodType === 'month' && !v.month) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['month'],
        message: 'กรุณาระบุ month เมื่อ periodType=month',
      });
    }
    if (v.periodType === 'year' && !v.year) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['year'],
        message: 'กรุณาระบุ year เมื่อ periodType=year',
      });
    }
    if (v.periodType === 'range') {
      if (!v.start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['start'],
          message: 'กรุณาระบุ start เมื่อ periodType=range',
        });
      }
      if (!v.end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['end'],
          message: 'กรุณาระบุ end เมื่อ periodType=range',
        });
      }
    }
  });

export type DashboardSummaryPdfQueryDto = z.infer<
  typeof DashboardSummaryPdfQuerySchema
>;

export const MinioOrphansScanSchema = z.object({
  prefix: z.string().trim().max(200).optional(),
  continuationToken: z.string().trim().max(1024).optional(),
  olderThanDays: z.preprocess(
    (v) =>
      v === undefined || v === null || v === ""
        ? 7
        : typeof v === "number"
          ? v
          : Number.parseInt(String(v), 10),
    z.number().int().min(7).max(3650),
  ),
  limit: z.preprocess(
    (v) =>
      v === undefined || v === null || v === ""
        ? 200
        : typeof v === "number"
          ? v
          : Number.parseInt(String(v), 10),
    z.number().int().min(1).max(1000),
  ),
});

export type MinioOrphansScanDto = z.infer<typeof MinioOrphansScanSchema>;

export const MinioOrphansDeleteSchema = z.object({
  keys: z
    .array(z.string().trim().min(1).max(1024))
    .min(1, "กรุณาเลือกไฟล์อย่างน้อย 1 รายการ")
    .max(1000, "เลือกไฟล์มากเกินไป"),
  confirmText: z.string().trim().min(1, "กรุณายืนยันการลบ"),
});

export type MinioOrphansDeleteDto = z.infer<typeof MinioOrphansDeleteSchema>;
