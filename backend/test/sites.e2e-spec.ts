import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

interface SiteItem {
  province?: string;
  district?: string;
  agency?: string;
  station?: string;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
}

describe('Sites API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app.close();
  }, 30_000);

  it('GET /api/sites is public and returns agency + station fields', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/sites')
      .expect(200);

    const body = res.body as ApiResponse<SiteItem[]> | SiteItem[];
    const payload = Array.isArray(body) ? body : (body.data ?? []);
    expect(Array.isArray(payload)).toBe(true);

    if (payload.length === 0) {
      return;
    }

    const first = payload[0];
    expect(first).toHaveProperty('province');
    expect(first).toHaveProperty('district');
    expect(first).toHaveProperty('agency');
    expect(first).toHaveProperty('station');
    expect(typeof first.agency).toBe('string');
    expect(typeof first.station).toBe('string');
    expect(String(first.agency).length).toBeGreaterThan(0);
    expect(String(first.station).length).toBeGreaterThan(0);
  });

  it('GET /api/sites/options/provinces is public and returns string[]', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/sites/options/provinces')
      .expect(200);

    const body = res.body as ApiResponse<string[]> | string[];
    const payload = Array.isArray(body) ? body : (body.data ?? []);
    expect(Array.isArray(payload)).toBe(true);
    if (payload.length === 0) return;
    expect(typeof payload[0]).toBe('string');
  });

  it('GET /api/sites/options/districts requires province', async () => {
    await request(app.getHttpServer())
      .get('/api/sites/options/districts')
      .expect(400);
  });
});
