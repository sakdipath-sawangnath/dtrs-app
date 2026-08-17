import { ClassifyDocSchema, CreateJobSchema } from './create-job.dto';

describe('CreateJobSchema email optional (Meeting Phase A)', () => {
  const base = {
    province: 'สงขลา',
    district: 'หาดใหญ่',
    agency: 'ที่ทำการบ้านผู้ใหญ่บ้าน',
    location: 'หมู่ 1 สถานีทดสอบ',
    description: 'รายละเอียดปัญหาอย่างน้อยสิบตัวอักษร',
    reporterName: 'ผู้แจ้ง',
    reporterPhone: '0812345678',
  };

  it('allows empty reporterEmail', () => {
    const parsed = CreateJobSchema.parse({ ...base, reporterEmail: '' });
    expect(parsed.reporterEmail).toBe('');
  });

  it('allows omitted reporterEmail via empty preprocess', () => {
    const parsed = CreateJobSchema.parse({ ...base, reporterEmail: undefined });
    expect(parsed.reporterEmail).toBe('');
  });

  it('accepts valid email', () => {
    const parsed = CreateJobSchema.parse({
      ...base,
      reporterEmail: 'a@example.com',
    });
    expect(parsed.reporterEmail).toBe('a@example.com');
  });

  it('rejects invalid email when provided', () => {
    expect(() =>
      CreateJobSchema.parse({ ...base, reporterEmail: 'not-an-email' }),
    ).toThrow();
  });

  it('accepts optional subdistrict', () => {
    const parsed = CreateJobSchema.parse({
      ...base,
      reporterEmail: '',
      subdistrict: 'คอหงส์',
    });
    expect(parsed.subdistrict).toBe('คอหงส์');
  });

  it('requires agency (สถานที่/หน่วยงาน)', () => {
    const { agency: _a, ...withoutAgency } = base;
    expect(() =>
      CreateJobSchema.parse({ ...withoutAgency, reporterEmail: '' }),
    ).toThrow(/agency|สถานที่/);
  });

  it('keeps location as station name', () => {
    const parsed = CreateJobSchema.parse({ ...base, reporterEmail: '' });
    expect(parsed.agency).toBe('ที่ทำการบ้านผู้ใหญ่บ้าน');
    expect(parsed.location).toBe('หมู่ 1 สถานีทดสอบ');
  });
});

describe('ClassifyDocSchema', () => {
  it('accepts boolean and string flags', () => {
    expect(
      ClassifyDocSchema.parse({ isOutOfContract: true }).isOutOfContract,
    ).toBe(true);
    expect(
      ClassifyDocSchema.parse({ isOutOfContract: 'false' }).isOutOfContract,
    ).toBe(false);
  });
});
