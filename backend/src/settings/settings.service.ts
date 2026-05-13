import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { UpdateAppMetaDto } from './dto/app-meta.dto';
import { TestEmailSmtpDto, UpdateEmailSmtpDto } from './dto/email-smtp.dto';
import { UpdateEmailTemplatesDto } from './dto/email-templates.dto';
import {
  EMAIL_TEMPLATES_SETTING_KEY,
  defaultEmailTemplatesSettings,
  type EmailTemplateBlock,
  type EmailTemplatesSettings,
} from './email-templates.types';
import { EmailSmtpConfig, MailService } from './mail.service';

export const EMAIL_SMTP_SETTING_KEY = 'email_smtp';
export const DEFAULT_PASS_SETTING_KEY = 'default_pass';
export const APP_META_SETTING_KEY = 'app_meta';

export type AppMetaPublic = {
  appName: string;
  companyName: string;
  version: string;
};

export type EmailSmtpPublic = {
  smtpHost: string;
  smtpPort: string;
  username: string;
  secure: boolean;
  from: string;
  passwordSet: boolean;
  tlsRejectUnauthorized: boolean;
};

export type DefaultPassPublic = {
  passwordSet: boolean;
  password: string;
};

@Injectable()
export class SettingsService {
  private static readonly orphanRetentionDays = 7;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly minioService: MinioService,
  ) {}

  private parseStored(raw: Prisma.JsonValue | null): EmailSmtpConfig | null {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      return null;
    }
    const o = raw as Record<string, unknown>;
    const tlsRaw = o.tlsRejectUnauthorized;
    const tlsRejectUnauthorized =
      tlsRaw === false || tlsRaw === 'false' ? false : true;

    return {
      smtpHost: String(o.smtpHost ?? ''),
      smtpPort: String(o.smtpPort ?? '587'),
      username: String(o.username ?? ''),
      password: String(o.password ?? ''),
      secure: o.secure === true || o.secure === 'true',
      from: String(o.from ?? ''),
      tlsRejectUnauthorized,
    };
  }

  private parseAppMetaStored(raw: Prisma.JsonValue | null): AppMetaPublic {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      return {
        appName: '',
        companyName: '',
        version: '',
      };
    }
    const o = raw as Record<string, unknown>;
    return {
      appName:
        typeof o.appName === 'string' ? o.appName.trim().slice(0, 120) : '',
      companyName:
        typeof o.companyName === 'string'
          ? o.companyName.trim().slice(0, 120)
          : '',
      version:
        typeof o.version === 'string' ? o.version.trim().slice(0, 40) : '',
    };
  }

  async getAppMeta(): Promise<AppMetaPublic> {
    const row = await this.prisma.setting.findUnique({
      where: { key: APP_META_SETTING_KEY },
    });
    return this.parseAppMetaStored(row?.value ?? null);
  }

  async updateAppMeta(dto: UpdateAppMetaDto): Promise<AppMetaPublic> {
    const next: AppMetaPublic = {
      appName: dto.appName.trim().slice(0, 120),
      companyName: dto.companyName.trim().slice(0, 120),
      version: dto.version.trim().slice(0, 40),
    };

    await this.prisma.setting.upsert({
      where: { key: APP_META_SETTING_KEY },
      create: {
        key: APP_META_SETTING_KEY,
        value: next as unknown as Prisma.InputJsonValue,
      },
      update: {
        value: next as unknown as Prisma.InputJsonValue,
      },
    });

    return next;
  }

  private toPublic(cfg: EmailSmtpConfig | null): EmailSmtpPublic | null {
    if (!cfg) return null;
    const pwd = cfg.password.trim();
    return {
      smtpHost: cfg.smtpHost,
      smtpPort: cfg.smtpPort,
      username: cfg.username,
      secure: cfg.secure,
      from: cfg.from,
      passwordSet: pwd.length > 0,
      tlsRejectUnauthorized: cfg.tlsRejectUnauthorized !== false,
    };
  }

  async getEmailSmtp(): Promise<EmailSmtpPublic | null> {
    const row = await this.prisma.setting.findUnique({
      where: { key: EMAIL_SMTP_SETTING_KEY },
    });
    return this.toPublic(this.parseStored(row?.value ?? null));
  }

  private parseDefaultPassStored(raw: Prisma.JsonValue | null): { password: string } | null {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const o = raw as Record<string, unknown>;
    const password = typeof o.password === 'string' ? o.password.trim() : '';
    if (!password) return null;
    return { password };
  }

  async getDefaultPass(): Promise<DefaultPassPublic> {
    const row = await this.prisma.setting.findUnique({
      where: { key: DEFAULT_PASS_SETTING_KEY },
    });
    const parsed = this.parseDefaultPassStored(row?.value ?? null);
    const fallbackPassword = 'F0rth2026@';
    return {
      passwordSet: !!parsed?.password,
      password: parsed?.password || fallbackPassword,
    };
  }

  async updateDefaultPass(dto: { password: string }): Promise<DefaultPassPublic> {
    const pwd = dto.password?.trim();
    if (!pwd) {
      return { passwordSet: false, password: 'F0rth2026@' };
    }

    await this.prisma.setting.upsert({
      where: { key: DEFAULT_PASS_SETTING_KEY },
      create: {
        key: DEFAULT_PASS_SETTING_KEY,
        value: { password: pwd } as unknown as Prisma.InputJsonValue,
      },
      update: {
        value: { password: pwd } as unknown as Prisma.InputJsonValue,
      },
    });

    return { passwordSet: true, password: pwd };
  }

  private async getStoredInternal(): Promise<EmailSmtpConfig | null> {
    const row = await this.prisma.setting.findUnique({
      where: { key: EMAIL_SMTP_SETTING_KEY },
    });
    return this.parseStored(row?.value ?? null);
  }

  async updateEmailSmtp(dto: UpdateEmailSmtpDto): Promise<EmailSmtpPublic> {
    const existing = await this.getStoredInternal();
    const pwdIn = dto.password?.trim() ?? '';

    if (!existing && !pwdIn) {
      throw new BadRequestException(
        'กรุณาระบุรหัสผ่าน SMTP สำหรับการบันทึกครั้งแรก',
      );
    }

    const next: EmailSmtpConfig = {
      smtpHost: dto.smtpHost.trim(),
      smtpPort: dto.smtpPort.trim(),
      username: dto.username.trim(),
      password: pwdIn || (existing?.password ?? ''),
      secure: dto.secure,
      from: dto.from.trim(),
      tlsRejectUnauthorized: dto.tlsRejectUnauthorized,
    };

    if (!next.password) {
      throw new BadRequestException(
        'ยังไม่มีรหัสผ่าน SMTP — กรุณากรอกรหัสผ่านหรือบันทึกที่ถูกต้องก่อน',
      );
    }

    await this.prisma.setting.upsert({
      where: { key: EMAIL_SMTP_SETTING_KEY },
      create: {
        key: EMAIL_SMTP_SETTING_KEY,
        value: next as unknown as Prisma.InputJsonValue,
      },
      update: {
        value: next as unknown as Prisma.InputJsonValue,
      },
    });

    const pub = this.toPublic(next);
    if (!pub) {
      throw new BadRequestException('บันทึกการตั้งค่าไม่สำเร็จ');
    }
    return pub;
  }

  async mergeForTest(dto: TestEmailSmtpDto): Promise<EmailSmtpConfig> {
    const saved = await this.getStoredInternal();
    const merged: EmailSmtpConfig = {
      smtpHost: (dto.smtpHost?.trim() || saved?.smtpHost || '').trim(),
      smtpPort: (dto.smtpPort?.trim() || saved?.smtpPort || '587').trim(),
      username: (dto.username?.trim() || saved?.username || '').trim(),
      password: (dto.password?.trim() || saved?.password || '').trim(),
      secure:
        dto.secure !== undefined ? dto.secure : (saved?.secure ?? false),
      from: (dto.from?.trim() || saved?.from || '').trim(),
      tlsRejectUnauthorized:
        dto.tlsRejectUnauthorized !== undefined
          ? dto.tlsRejectUnauthorized
          : saved?.tlsRejectUnauthorized !== false,
    };

    if (!merged.smtpHost || !merged.username || !merged.from) {
      throw new BadRequestException(
        'กรุณากรอกข้อมูล SMTP ให้ครบ หรือบันทึกการตั้งค่าก่อนทดสอบ',
      );
    }
    if (!merged.password) {
      throw new BadRequestException(
        'ไม่พบรหัสผ่าน SMTP — กรุณากรอกรหัสผ่านในฟอร์มหรือบันทึกการตั้งค่าที่มีรหัสผ่านแล้ว',
      );
    }
    return merged;
  }

  async testEmailSmtp(dto: TestEmailSmtpDto): Promise<{ ok: true }> {
    const cfg = await this.mergeForTest(dto);
    await this.mailService.sendTestMail(dto.to, cfg);
    return { ok: true };
  }

  /** ใช้ส่งอีเมลแจ้งเตือนงาน — คืน null ถ้ายังไม่ได้ตั้งรหัส SMTP */
  async getEmailSmtpConfigForSending(): Promise<EmailSmtpConfig | null> {
    const cfg = await this.getStoredInternal();
    if (!cfg?.password?.trim()) return null;
    return cfg;
  }

  private mergeEmailTemplates(raw: Prisma.JsonValue | null): EmailTemplatesSettings {
    const base = defaultEmailTemplatesSettings();
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      return base;
    }
    const o = raw as Record<string, unknown>;
    const mergeBlock = (
      key: 'onReported' | 'onAssigned' | 'onClosed',
      def: EmailTemplateBlock,
    ): EmailTemplateBlock => {
      const b = o[key];
      if (b === null || typeof b !== 'object' || Array.isArray(b)) return def;
      const bb = b as Record<string, unknown>;
      const toExtra = Array.isArray(bb.toExtra)
        ? bb.toExtra
            .filter((x): x is string => typeof x === 'string')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const cc = Array.isArray(bb.cc)
        ? bb.cc
            .filter((x): x is string => typeof x === 'string')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const rawRoleIds = Array.isArray(bb.notifyRoleIds) ? bb.notifyRoleIds : [];
      const notifyRoleIds = rawRoleIds
        .map((x) =>
          typeof x === 'number' && Number.isInteger(x)
            ? x
            : typeof x === 'string'
              ? Number.parseInt(x, 10)
              : NaN,
        )
        .filter((n) => Number.isInteger(n) && n > 0);
      return {
        enabled: bb.enabled === false ? false : true,
        toExtra,
        cc,
        notifyRoleIds,
      };
    };
    const logo =
      typeof o.brandingLogoUrl === 'string'
        ? o.brandingLogoUrl.trim().slice(0, 2000)
        : '';
    const pub =
      typeof o.publicBaseUrl === 'string'
        ? o.publicBaseUrl.trim().slice(0, 500)
        : '';
    return {
      brandingLogoUrl: logo,
      publicBaseUrl: pub,
      onReported: mergeBlock('onReported', base.onReported),
      onAssigned: mergeBlock('onAssigned', base.onAssigned),
      onClosed: mergeBlock('onClosed', base.onClosed),
    };
  }

  async getEmailTemplates(): Promise<EmailTemplatesSettings> {
    const row = await this.prisma.setting.findUnique({
      where: { key: EMAIL_TEMPLATES_SETTING_KEY },
    });
    return this.mergeEmailTemplates(row?.value ?? null);
  }

  async updateEmailTemplates(
    dto: UpdateEmailTemplatesDto,
  ): Promise<EmailTemplatesSettings> {
    const prev = await this.getEmailTemplates();
    const next: EmailTemplatesSettings = {
      brandingLogoUrl: (dto.brandingLogoUrl ?? '').trim().slice(0, 2000),
      publicBaseUrl:
        dto.publicBaseUrl !== undefined
          ? (dto.publicBaseUrl ?? '').trim().slice(0, 500)
          : prev.publicBaseUrl,
      onReported: {
        enabled: dto.onReported.enabled,
        toExtra: [...dto.onReported.toExtra],
        cc: [...dto.onReported.cc],
        notifyRoleIds: [
          ...(dto.onReported.notifyRoleIds ?? prev.onReported.notifyRoleIds),
        ],
      },
      onAssigned: {
        enabled: dto.onAssigned.enabled,
        toExtra: [...dto.onAssigned.toExtra],
        cc: [...dto.onAssigned.cc],
        notifyRoleIds: [
          ...(dto.onAssigned.notifyRoleIds ?? prev.onAssigned.notifyRoleIds),
        ],
      },
      onClosed: {
        enabled: dto.onClosed.enabled,
        toExtra: [...dto.onClosed.toExtra],
        cc: [...dto.onClosed.cc],
        notifyRoleIds: [
          ...(dto.onClosed.notifyRoleIds ?? prev.onClosed.notifyRoleIds),
        ],
      },
    };

    await this.prisma.setting.upsert({
      where: { key: EMAIL_TEMPLATES_SETTING_KEY },
      create: {
        key: EMAIL_TEMPLATES_SETTING_KEY,
        value: next as unknown as Prisma.InputJsonValue,
      },
      update: {
        value: next as unknown as Prisma.InputJsonValue,
      },
    });
    return next;
  }

  private normalizeObjectKeyInput(raw: string): string | null {
    const trimmed = String(raw || '').trim().replace(/^\/+/, '');
    if (!trimmed) return null;
    if (trimmed.includes('\\') || trimmed.includes('..')) return null;
    const segments = trimmed.split('/');
    if (segments.some((s) => !s || s === '.' || s === '..')) return null;
    return trimmed;
  }

  private addReferenceFromString(value: string, output: Set<string>) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const parsed = this.minioService.tryParseBucketObjectKeyFromUrl(trimmed);
    if (parsed) {
      output.add(parsed);
      return;
    }
    const fromRaw = this.normalizeObjectKeyInput(trimmed);
    if (fromRaw) output.add(fromRaw);
  }

  private addReferenceFromUnknown(value: unknown, output: Set<string>) {
    if (typeof value === 'string') {
      this.addReferenceFromString(value, output);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((v) => this.addReferenceFromUnknown(v, output));
    }
  }

  private async buildReferencedObjectKeySet(): Promise<Set<string>> {
    const refs = new Set<string>();
    const [jobs, users] = await Promise.all([
      this.prisma.job.findMany({
        select: {
          images: true,
          fixImages: true,
        },
      }),
      this.prisma.user.findMany({
        select: {
          image: true,
        },
      }),
    ]);

    jobs.forEach((j) => {
      this.addReferenceFromUnknown(j.images, refs);
      this.addReferenceFromUnknown(j.fixImages, refs);
    });
    users.forEach((u) => this.addReferenceFromUnknown(u.image, refs));
    return refs;
  }

  private isOlderThanRetention(lastModified: string | null): boolean {
    if (!lastModified) return false;
    const t = Date.parse(lastModified);
    if (!Number.isFinite(t)) return false;
    const cutoff =
      Date.now() - SettingsService.orphanRetentionDays * 24 * 60 * 60 * 1000;
    return t <= cutoff;
  }

  private isOlderThanDays(lastModified: string | null, days: number): boolean {
    if (!lastModified) return false;
    const t = Date.parse(lastModified);
    if (!Number.isFinite(t)) return false;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return t <= cutoff;
  }

  async scanMinioOrphans(dto: {
    prefix?: string;
    limit?: number;
    continuationToken?: string;
    olderThanDays?: number;
  }) {
    const prefix = this.normalizeObjectKeyInput(dto.prefix ?? '') ?? '';
    const limit = Number.isFinite(dto.limit) ? Number(dto.limit) : 200;
    const cappedLimit = Math.max(1, Math.min(1000, limit));
    const olderThanDays = Math.max(
      SettingsService.orphanRetentionDays,
      Number.isFinite(dto.olderThanDays) ? Number(dto.olderThanDays) : SettingsService.orphanRetentionDays,
    );
    const continuationToken = dto.continuationToken
      ? this.normalizeObjectKeyInput(dto.continuationToken)
      : null;

    const [objects, references] = await Promise.all([
      this.minioService.listObjectsRecursive(prefix),
      this.buildReferencedObjectKeySet(),
    ]);

    const eligible: Array<{
      key: string;
      size: number;
      lastModified: string | null;
      ageDays: number | null;
    }> = [];
    let referencedCount = 0;
    let skippedByRetention = 0;

    for (const obj of objects) {
      if (references.has(obj.key)) {
        referencedCount++;
        continue;
      }
      const older = this.isOlderThanDays(obj.lastModified, olderThanDays);
      if (!older) {
        skippedByRetention++;
        continue;
      }
      const ageDays = obj.lastModified
        ? Math.floor((Date.now() - Date.parse(obj.lastModified)) / 86_400_000)
        : null;
      eligible.push({
        key: obj.key,
        size: obj.size,
        lastModified: obj.lastModified,
        ageDays: Number.isFinite(ageDays as number) ? ageDays : null,
      });
    }

    eligible.sort((a, b) => {
      const ta = a.lastModified ? Date.parse(a.lastModified) : 0;
      const tb = b.lastModified ? Date.parse(b.lastModified) : 0;
      return ta - tb;
    });

    let startIndex = 0;
    if (continuationToken) {
      const tokenIndex = eligible.findIndex((x) => x.key === continuationToken);
      if (tokenIndex < 0) {
        throw new BadRequestException('continuationToken ไม่ถูกต้องหรือหมดอายุ');
      }
      startIndex = tokenIndex + 1;
    }
    const pageItems = eligible.slice(startIndex, startIndex + cappedLimit);
    const nextContinuationToken =
      startIndex + cappedLimit < eligible.length && pageItems.length > 0
        ? pageItems[pageItems.length - 1].key
        : null;

    return {
      retentionDays: SettingsService.orphanRetentionDays,
      stats: {
        totalObjects: objects.length,
        referencedObjects: referencedCount,
        orphanCandidates: eligible.length,
        skippedByRetention,
      },
      items: pageItems,
      meta: {
        prefix,
        olderThanDays,
        limit: cappedLimit,
        continuationToken,
        nextContinuationToken,
        hasMore: nextContinuationToken != null,
      },
    };
  }

  async deleteSelectedOrphans(dto: { keys: string[]; confirmText: string }) {
    if (dto.confirmText.trim().toUpperCase() !== 'DELETE') {
      throw new BadRequestException('กรุณาพิมพ์ DELETE เพื่อยืนยันการลบ');
    }

    const selectedKeys = Array.from(
      new Set(
        dto.keys
          .map((k) => this.normalizeObjectKeyInput(k))
          .filter((k): k is string => k != null),
      ),
    );
    if (selectedKeys.length === 0) {
      throw new BadRequestException('ไม่พบรายการไฟล์ที่พร้อมลบ');
    }

    const [references, objects] = await Promise.all([
      this.buildReferencedObjectKeySet(),
      this.minioService.listObjectsRecursive(''),
    ]);
    const objectMap = new Map(objects.map((o) => [o.key, o]));

    let deleted = 0;
    let skippedMissing = 0;
    let skippedStillReferenced = 0;
    let skippedByRetention = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const key of selectedKeys) {
      const obj = objectMap.get(key);
      if (!obj) {
        skippedMissing++;
        continue;
      }
      if (references.has(key)) {
        skippedStillReferenced++;
        continue;
      }
      if (!this.isOlderThanRetention(obj.lastModified)) {
        skippedByRetention++;
        continue;
      }
      try {
        await this.minioService.removeObjectByKey(key);
        deleted++;
      } catch (err: unknown) {
        failed++;
        const msg =
          (err as { message?: string })?.message || 'unknown remove error';
        errors.push(`${key}: ${msg}`);
      }
    }

    return {
      retentionDays: SettingsService.orphanRetentionDays,
      summary: {
        requested: selectedKeys.length,
        deleted,
        skippedMissing,
        skippedStillReferenced,
        skippedByRetention,
        failed,
      },
      errors: errors.slice(0, 20),
    };
  }
}
