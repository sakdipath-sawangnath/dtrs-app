import { Test, TestingModule } from '@nestjs/testing';
import { MinioService } from './minio.service';

describe('MinioService', () => {
    const prevBucket = process.env.MINIO_BUCKET_NAME;
    const prevStartup = process.env.MINIO_STARTUP_CHECK;

    beforeEach(() => {
        process.env.MINIO_STARTUP_CHECK = 'false';
        process.env.MINIO_BUCKET_NAME = 'cctv-app';
        process.env.MINIO_ACCESS_KEY = 'test';
        process.env.MINIO_SECRET_KEY = 'test';
    });

    afterEach(() => {
        process.env.MINIO_BUCKET_NAME = prevBucket;
        process.env.MINIO_STARTUP_CHECK = prevStartup;
    });

    it('should be defined', async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [MinioService],
        }).compile();
        const service = module.get(MinioService);
        expect(service).toBeDefined();
    });

    describe('tryParseBucketObjectKeyFromUrl', () => {
        it('returns object key for public-style URL', async () => {
            const module: TestingModule = await Test.createTestingModule({
                providers: [MinioService],
            }).compile();
            const service = module.get(MinioService);
            expect(
                service.tryParseBucketObjectKeyFromUrl(
                    'https://minio-it.forth.co.th/cctv-app/jobs/289/fix/1.jpg',
                ),
            ).toBe('jobs/289/fix/1.jpg');
        });

        it('returns null when bucket in path does not match', async () => {
            const module: TestingModule = await Test.createTestingModule({
                providers: [MinioService],
            }).compile();
            const service = module.get(MinioService);
            expect(
                service.tryParseBucketObjectKeyFromUrl(
                    'https://x.example.com/other-bucket/jobs/1/issue/0.jpg',
                ),
            ).toBeNull();
        });

        it('returns null for non-URL strings', async () => {
            const module: TestingModule = await Test.createTestingModule({
                providers: [MinioService],
            }).compile();
            const service = module.get(MinioService);
            expect(service.tryParseBucketObjectKeyFromUrl('not-a-url')).toBeNull();
        });

        it('returns null when decoded key contains path segments . or ..', async () => {
            const module: TestingModule = await Test.createTestingModule({
                providers: [MinioService],
            }).compile();
            const service = module.get(MinioService);
            expect(
                service.tryParseBucketObjectKeyFromUrl(
                    'https://x.example.com/cctv-app/jobs%2f%2e%2e%2fetc%2fpasswd',
                ),
            ).toBeNull();
        });

        it('decodes percent-encoded key segments', async () => {
            const module: TestingModule = await Test.createTestingModule({
                providers: [MinioService],
            }).compile();
            const service = module.get(MinioService);
            expect(
                service.tryParseBucketObjectKeyFromUrl(
                    'http://localhost:9000/cctv-app/jobs/1/issue/0%2etest.jpg',
                ),
            ).toBe('jobs/1/issue/0.test.jpg');
        });
    });
});
