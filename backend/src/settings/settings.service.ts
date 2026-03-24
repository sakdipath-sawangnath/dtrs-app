import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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
};

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
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
    return { passwordSet: !!parsed?.password };
  }

  async updateDefaultPass(dto: { password: string }): Promise<DefaultPassPublic> {
    const pwd = dto.password?.trim();
    if (!pwd) return { passwordSet: false };

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

    return { passwordSet: true };
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
}
