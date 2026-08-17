import { z } from 'zod';

const optionalSubdistrict = z.preprocess(
  (v) => {
    if (v === undefined || v === null) return '';
    return String(v).trim();
  },
  z.string().max(200, 'ชื่อตำบลยาวเกินไป'),
);

export const CreateSiteSchema = z.object({
  province: z.string().trim().min(1, 'กรุณาระบุจังหวัด'),
  district: z.string().trim().min(1, 'กรุณาระบุอำเภอ'),
  subdistrict: optionalSubdistrict.optional(),
  agency: z.string().trim().min(1, 'กรุณาระบุสถานที่/หน่วยงาน'),
  station: z.string().trim().min(1, 'กรุณาระบุชื่อสถานี'),
});

export type CreateSiteDto = z.infer<typeof CreateSiteSchema>;

export const UpdateSiteSchema = z
  .object({
    province: z.string().trim().min(1, 'กรุณาระบุจังหวัด').optional(),
    district: z.string().trim().min(1, 'กรุณาระบุอำเภอ').optional(),
    subdistrict: optionalSubdistrict.optional(),
    agency: z.string().trim().min(1, 'กรุณาระบุสถานที่/หน่วยงาน').optional(),
    station: z.string().trim().min(1, 'กรุณาระบุชื่อสถานี').optional(),
  })
  .refine(
    (v) =>
      v.province != null ||
      v.district != null ||
      v.subdistrict != null ||
      v.agency != null ||
      v.station != null,
    {
      message: 'กรุณาระบุอย่างน้อย 1 ฟิลด์',
    },
  );

export type UpdateSiteDto = z.infer<typeof UpdateSiteSchema>;

export const BulkDeleteSitesSchema = z.object({
  ids: z
    .array(z.number().int().positive())
    .min(1, 'กรุณาระบุอย่างน้อย 1 รายการ')
    .max(500, 'ลบได้ไม่เกิน 500 รายการต่อครั้ง'),
});

export type BulkDeleteSitesDto = z.infer<typeof BulkDeleteSitesSchema>;
