import { z } from 'zod';

export const JOB_SERIAL_ROWS_MAX = 4;

export function normalizeJobSerialToken(s: string): string {
  return s.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
}

const PackedRowSchema = z
  .object({
    n: z.string().max(200).optional().default(''),
    o: z.string().max(200).optional().default(''),
    x: z.string().max(200).optional().default(''),
  })
  .transform((r) => ({
    n: (r.n ?? '').trim().slice(0, 200),
    o: normalizeJobSerialToken(r.o ?? ''),
    x: normalizeJobSerialToken(r.x ?? ''),
  }));

export const JobSerialPackedSchema = z.object({
  v: z.literal(1),
  rows: z.array(PackedRowSchema).min(1).max(JOB_SERIAL_ROWS_MAX),
});
