import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TestEmailSmtpDto, UpdateEmailSmtpDto } from './dto/email-smtp.dto';
import { EmailSmtpConfig, MailService } from './mail.service';

export const EMAIL_SMTP_SETTING_KEY = 'email_smtp';

export type EmailSmtpPublic = {
  smtpHost: string;
  smtpPort: string;
  username: string;
  secure: boolean;
  from: string;
  passwordSet: boolean;
  tlsRejectUnauthorized: boolean;
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
    return {
      smtpHost: String(o.smtpHost ?? ''),
      smtpPort: String(o.smtpPort ?? '587'),
      username: String(o.username ?? ''),
      password: String(o.password ?? ''),
      secure: o.secure === true || o.secure === 'true',
      from: String(o.from ?? ''),
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
}
