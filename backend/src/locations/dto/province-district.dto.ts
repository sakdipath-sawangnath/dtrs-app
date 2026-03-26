import { z } from 'zod';

export const CreateProvinceSchema = z.object({
  name: z.string().trim().min(1, 'กรุณาระบุชื่อจังหวัด'),
});

export type CreateProvinceDto = z.infer<typeof CreateProvinceSchema>;

export const CreateDistrictSchema = z.object({
  name: z.string().trim().min(1, 'กรุณาระบุชื่ออำเภอ'),
});

export type CreateDistrictDto = z.infer<typeof CreateDistrictSchema>;
