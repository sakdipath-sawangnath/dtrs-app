import { Test, TestingModule } from '@nestjs/testing';
import { AreasService } from './areas.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AreasService', () => {
  let service: AreasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreasService,
        {
          provide: PrismaService,
          useValue: {
            area: { findMany: jest.fn(), create: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<AreasService>(AreasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
