import { z } from 'zod';

export const CreateSiteSchema = z.object({
  province: z.string().trim().min(1, 'กรุณาระบุจังหวัด'),
  district: z.string().trim().min(1, 'กรุณาระบุอำเภอ'),
  agency: z.string().trim().min(1, 'กรุณาระบุหน่วยงาน'),
});

export type CreateSiteDto = z.infer<typeof CreateSiteSchema>;

export const UpdateSiteSchema = z
  .object({
    province: z.string().trim().min(1, 'กรุณาระบุจังหวัด').optional(),
    district: z.string().trim().min(1, 'กรุณาระบุอำเภอ').optional(),
    agency: z.string().trim().min(1, 'กรุณาระบุหน่วยงาน').optional(),
  })
  .refine((v) => v.province != null || v.district != null || v.agency != null, {
    message: 'กรุณาระบุอย่างน้อย 1 ฟิลด์',
  });

export type UpdateSiteDto = z.infer<typeof UpdateSiteSchema>;

export const BulkDeleteSitesSchema = z.object({
  ids: z
    .array(z.number().int().positive())
    .min(1, 'กรุณาระบุอย่างน้อย 1 รายการ')
    .max(500, 'ลบได้ไม่เกิน 500 รายการต่อครั้ง'),
});

export type BulkDeleteSitesDto = z.infer<typeof BulkDeleteSitesSchema>;
