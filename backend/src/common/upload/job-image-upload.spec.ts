import { BadRequestException } from '@nestjs/common';
import convert from 'heic-convert';
import { HEIC_MARKER } from '../../../test/mocks/file-type';
import {
  assertAndNormalizeJobImage,
  assertReporterSignatureFile,
  JOB_IMAGE_SIZE_ERROR,
  JOB_IMAGE_TYPE_ERROR,
  MAX_JOB_IMAGE_BYTES,
  normalizeJobImageFiles,
} from './job-image-upload';

jest.mock('heic-convert', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const convertMock = convert as jest.MockedFunction<typeof convert>;

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = Buffer.from('RIFF....WEBP', 'ascii');
const GIF = Buffer.from('GIF89a', 'ascii');
const HEIC = Buffer.concat([
  Buffer.from('xxxx'),
  HEIC_MARKER,
  Buffer.from('yyyy'),
]);

function multerFile(
  partial: Partial<Express.Multer.File> & { buffer: Buffer },
): Express.Multer.File {
  return {
    fieldname: 'images',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'application/octet-stream',
    size: partial.buffer.length,
    destination: '',
    filename: '',
    path: '',
    stream: undefined as unknown as Express.Multer.File['stream'],
    ...partial,
  };
}

describe('job-image-upload', () => {
  beforeEach(() => {
    convertMock.mockReset();
  });

  it('accepts JPEG and sets detected mime', async () => {
    const out = await assertAndNormalizeJobImage(
      multerFile({ buffer: JPEG, originalname: 'a.jpg' }),
    );
    expect(out.mimetype).toBe('image/jpeg');
    expect(out.buffer.equals(JPEG)).toBe(true);
  });

  it('accepts PNG and WebP', async () => {
    const png = await assertAndNormalizeJobImage(
      multerFile({ buffer: PNG, originalname: 'a.png' }),
    );
    const webp = await assertAndNormalizeJobImage(
      multerFile({ buffer: WEBP, originalname: 'a.webp' }),
    );
    expect(png.mimetype).toBe('image/png');
    expect(webp.mimetype).toBe('image/webp');
  });

  it('rejects GIF and unknown buffers', async () => {
    await expect(
      assertAndNormalizeJobImage(
        multerFile({ buffer: GIF, originalname: 'a.gif' }),
      ),
    ).rejects.toThrow(JOB_IMAGE_TYPE_ERROR);
    await expect(
      assertAndNormalizeJobImage(
        multerFile({
          buffer: Buffer.from('not-an-image'),
          originalname: 'a.bin',
        }),
      ),
    ).rejects.toThrow(JOB_IMAGE_TYPE_ERROR);
  });

  it('rejects empty file and oversize by declared size', async () => {
    await expect(
      assertAndNormalizeJobImage(multerFile({ buffer: Buffer.alloc(0) })),
    ).rejects.toThrow('ไม่พบไฟล์รูป');
    await expect(
      assertAndNormalizeJobImage(
        multerFile({
          buffer: JPEG,
          size: MAX_JOB_IMAGE_BYTES + 1,
        }),
      ),
    ).rejects.toThrow(JOB_IMAGE_SIZE_ERROR);
  });

  it('converts HEIC to JPEG via heic-convert', async () => {
    convertMock.mockResolvedValue(JPEG);
    const out = await assertAndNormalizeJobImage(
      multerFile({ buffer: HEIC, originalname: 'phone.heic' }),
    );
    expect(convertMock).toHaveBeenCalled();
    expect(out.mimetype).toBe('image/jpeg');
    expect(out.originalname).toBe('phone.jpg');
    expect(out.buffer.equals(JPEG)).toBe(true);
  });

  it('returns 400 Thai message when HEIC convert fails', async () => {
    convertMock.mockRejectedValue(new Error('corrupt heic'));
    await expect(
      assertAndNormalizeJobImage(
        multerFile({ buffer: HEIC, originalname: 'bad.heic' }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      assertAndNormalizeJobImage(
        multerFile({ buffer: HEIC, originalname: 'bad.heic' }),
      ),
    ).rejects.toThrow(JOB_IMAGE_TYPE_ERROR);
  });

  it('normalizeJobImageFiles maps each file', async () => {
    const files = await normalizeJobImageFiles([
      multerFile({ buffer: JPEG, originalname: '1.jpg' }),
      multerFile({ buffer: PNG, originalname: '2.png' }),
    ]);
    expect(files).toHaveLength(2);
    expect(files[0].mimetype).toBe('image/jpeg');
    expect(files[1].mimetype).toBe('image/png');
  });

  it('assertReporterSignatureFile accepts PNG only', async () => {
    const ok = await assertReporterSignatureFile(
      multerFile({
        fieldname: 'reporterSignature',
        buffer: PNG,
        originalname: 'sig.png',
      }),
    );
    expect(ok.mimetype).toBe('image/png');
    await expect(
      assertReporterSignatureFile(
        multerFile({ buffer: JPEG, originalname: 'sig.jpg' }),
      ),
    ).rejects.toThrow('ลายเซ็นต้องเป็นไฟล์ PNG ขนาดไม่เกิน 5MB');
  });
});
