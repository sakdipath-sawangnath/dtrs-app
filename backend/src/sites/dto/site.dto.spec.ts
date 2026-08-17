import { CreateSiteSchema, UpdateSiteSchema } from './site.dto';

describe('CreateSiteSchema (agency + station)', () => {
  const valid = {
    province: 'กาญจนบุรี',
    district: 'เลาขวัญ',
    subdistrict: 'ทุ่งกระบ่ำ',
    agency: 'ที่ทำการบ้านผู้ใหญ่บ้าน',
    station: 'หมู่ 13 หนองจิกน้ำดำ',
  };

  it('accepts full site row', () => {
    expect(CreateSiteSchema.parse(valid)).toEqual(valid);
  });

  it('requires station', () => {
    const { station: _s, ...rest } = valid;
    expect(() => CreateSiteSchema.parse(rest)).toThrow();
  });

  it('requires agency', () => {
    const { agency: _a, ...rest } = valid;
    expect(() => CreateSiteSchema.parse(rest)).toThrow();
  });

  it('allows empty subdistrict', () => {
    const parsed = CreateSiteSchema.parse({ ...valid, subdistrict: '' });
    expect(parsed.subdistrict).toBe('');
  });
});

describe('UpdateSiteSchema', () => {
  it('requires at least one field', () => {
    expect(() => UpdateSiteSchema.parse({})).toThrow();
  });

  it('allows partial station update', () => {
    expect(UpdateSiteSchema.parse({ station: 'หมู่ 6 สี่กั๊ก' }).station).toBe(
      'หมู่ 6 สี่กั๊ก',
    );
  });
});
