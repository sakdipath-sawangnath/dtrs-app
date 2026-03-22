import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    // multipart/form-data บางกรณี Nest/Multer ส่ง @Body() เป็น array — รวม object ทุกตัวแทนการเอาแค่ตัวแรก
    let candidate: unknown = value;
    if (Array.isArray(value) && value.length > 0) {
      const objects = value.filter(
        (v): v is Record<string, unknown> =>
          v !== null && typeof v === 'object' && !Array.isArray(v),
      );
      if (objects.length > 1) {
        candidate = Object.assign({}, ...objects);
      } else if (objects.length === 1) {
        candidate = objects[0];
      } else {
        candidate = value;
      }
    }

    // กันกรณี client ส่ง body เป็น string (เช่น JSON.stringify) ทำให้ type ไม่ตรง schema
    if (typeof candidate === 'string') {
      try {
        const parsed = JSON.parse(candidate);
        candidate = parsed;
      } catch {
        // ถ้า parse ไม่สำเร็จให้ปล่อยให้ zod validate ต่อไปตามปกติ
      }
    }

    let result = this.schema.safeParse(candidate);

    // Fallback: ถ้า client ส่งมาเป็น primitive ("true"/"false") แทน object
    // บาง endpoint ในโปรเจกต์คาดว่าเป็น { isOutOfContract: boolean }
    if (!result.success) {
      const s = typeof candidate === "string" ? candidate.trim().toLowerCase() : "";
      if (s === "true" || s === "false") {
        const retry = this.schema.safeParse({ isOutOfContract: s === "true" });
        if (retry.success) return retry.data;
      }
      if (typeof candidate === "boolean") {
        const retry = this.schema.safeParse({ isOutOfContract: candidate });
        if (retry.success) return retry.data;
      }
    }

    if (!result.success) {
      const zodError = result.error as ZodError;
      const errors = zodError.errors.map((err: { path: (string | number)[]; message: string }) => ({
        field: err.path.join('.') || '(root)',
        message: err.message,
      }));
      // รูปแบบเดียวกับ class-validator — AllExceptionsFilter อ่าน message[] ได้
      throw new BadRequestException({
        message: errors.map((e) => `${e.field}: ${e.message}`),
      });
    }

    return result.data;
  }
}
