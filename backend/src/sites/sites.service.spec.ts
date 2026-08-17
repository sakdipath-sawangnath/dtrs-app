import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SitesService } from './sites.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SitesService', () => {
  let service: SitesService;
  let findFirst: jest.Mock;
  let create: jest.Mock;
  let findMany: jest.Mock;

  beforeEach(async () => {
    findFirst = jest.fn();
    create = jest.fn();
    findMany = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SitesService,
        {
          provide: PrismaService,
          useValue: {
            site: {
              findMany,
              create,
              findFirst,
              update: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SitesService>(SitesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('existsByLocation / findByLocation', () => {
    it('returns false when province/district/agency/station missing', async () => {
      expect(await service.existsByLocation('', 'อ', 'a', 's')).toBe(false);
      expect(findFirst).not.toHaveBeenCalled();
    });

    it('filters by subdistrict when provided', async () => {
      findFirst.mockResolvedValue({ id: 1 });
      const ok = await service.existsByLocation(
        'กาญจนบุรี',
        'เลาขวัญ',
        'ที่ทำการบ้านผู้ใหญ่บ้าน',
        'หมู่ 13 หนองจิกน้ำดำ',
        'ทุ่งกระบ่ำ',
      );
      expect(ok).toBe(true);
      expect(findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            province: 'กาญจนบุรี',
            district: 'เลาขวัญ',
            agency: 'ที่ทำการบ้านผู้ใหญ่บ้าน',
            station: 'หมู่ 13 หนองจิกน้ำดำ',
            subdistrict: 'ทุ่งกระบ่ำ',
          }),
        }),
      );
    });

    it('when subdistrict empty + null-or-blank: only match blank subdistrict rows', async () => {
      findFirst.mockResolvedValue(null);
      await service.existsByLocation('จ', 'อ', 'หน่วยงาน', 'สถานี', '');
      expect(findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ subdistrict: null }, { subdistrict: '' }],
          }),
        }),
      );
    });

    it('when subdistrict empty + any: does not filter subdistrict (job/public)', async () => {
      findFirst.mockResolvedValue({
        id: 1,
        province: 'จ',
        district: 'อ',
        subdistrict: 'ทุ่งกระบ่ำ',
        agency: 'หน่วยงาน',
        station: 'สถานี',
      });
      const ok = await service.existsByLocation(
        'จ',
        'อ',
        'หน่วยงาน',
        'สถานี',
        '',
        {
          whenSubdistrictEmpty: 'any',
        },
      );
      expect(ok).toBe(true);
      const where = findFirst.mock.calls[0][0].where;
      expect(where.OR).toBeUndefined();
      expect(where.subdistrict).toBeUndefined();
    });

    it('returns false when no site matches', async () => {
      findFirst.mockResolvedValue(null);
      const ok = await service.existsByLocation(
        'กาญจนบุรี',
        'เลาขวัญ',
        'ที่ทำการบ้านผู้ใหญ่บ้าน',
        'ไม่มีสถานีนี้',
      );
      expect(ok).toBe(false);
    });
  });

  describe('create', () => {
    it('throws ConflictException when site key already exists', async () => {
      findFirst.mockResolvedValue({ id: 99 });
      await expect(
        service.create({
          province: 'กาญจนบุรี',
          district: 'เลาขวัญ',
          agency: 'ที่ทำการบ้านผู้ใหญ่บ้าน',
          station: 'หมู่ 13 หนองจิกน้ำดำ',
          subdistrict: 'ทุ่งกระบ่ำ',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(create).not.toHaveBeenCalled();
    });

    it('creates site with agency and station', async () => {
      findFirst.mockResolvedValue(null);
      create.mockResolvedValue({
        id: 1,
        province: 'กาญจนบุรี',
        district: 'เลาขวัญ',
        subdistrict: 'ทุ่งกระบ่ำ',
        agency: 'ที่ทำการบ้านผู้ใหญ่บ้าน',
        station: 'หมู่ 13 หนองจิกน้ำดำ',
      });
      const row = await service.create({
        province: 'กาญจนบุรี',
        district: 'เลาขวัญ',
        agency: 'ที่ทำการบ้านผู้ใหญ่บ้าน',
        station: 'หมู่ 13 หนองจิกน้ำดำ',
        subdistrict: 'ทุ่งกระบ่ำ',
      });
      expect(row.station).toBe('หมู่ 13 หนองจิกน้ำดำ');
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agency: 'ที่ทำการบ้านผู้ใหญ่บ้าน',
            station: 'หมู่ 13 หนองจิกน้ำดำ',
          }),
        }),
      );
    });
  });

  describe('listOption*', () => {
    it('listOptionProvinces returns distinct sorted names', async () => {
      findMany.mockResolvedValue([
        { province: 'สงขลา' },
        { province: 'กาญจนบุรี' },
      ]);
      const list = await service.listOptionProvinces();
      expect(list).toEqual(['กาญจนบุรี', 'สงขลา']);
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ distinct: ['province'] }),
      );
    });

    it('listOptionDistricts filters by province', async () => {
      findMany.mockResolvedValue([{ district: 'เลาขวัญ' }]);
      await service.listOptionDistricts('กาญจนบุรี');
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { province: 'กาญจนบุรี' },
          distinct: ['district'],
        }),
      );
    });
  });
});
