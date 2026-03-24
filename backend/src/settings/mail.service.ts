import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export type EmailSmtpConfig = {
  smtpHost: string;
  smtpPort: string;
  username: string;
  password: string;
  secure: boolean;
  from: string;
  /** true = ตรวจใบรับรอง TLS (ค่าเริ่มต้น); false = ยอมรับ self-signed / Internal CA */
  tlsRejectUnauthorized?: boolean;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendTestMail(to: string, config: EmailSmtpConfig): Promise<void> {
    const port = Number.parseInt(config.smtpPort, 10);
    if (Number.isNaN(port) || port < 1 || port > 65535) {
      throw new BadRequestException('พอร์ต SMTP ไม่ถูกต้อง');
    }

    const secure = config.secure === true;
    const envTls = process.env.SMTP_TLS_REJECT_UNAUTHORIZED;
    const envAllowInsecure =
      envTls === 'false' || envTls === '0' || envTls === 'no';
    const rejectUnauthorized = envAllowInsecure
      ? false
      : config.tlsRejectUnauthorized !== false;

    const transporter = nodemailer.createTransport({
      host: config.smtpHost.trim(),
      port,
      secure,
      auth: {
        user: config.username.trim(),
        pass: config.password,
      },
      tls: {
        rejectUnauthorized,
      },
    });

    try {
      await transporter.sendMail({
        from: config.from.trim(),
        to: to.trim(),
        subject: 'ทดสอบการเชื่อมต่ออีเมล — ระบบแจ้งซ่อม CCTV',
        text: [
          'นี่คืออีเมลทดสอบจากระบบ',
          '',
          `เวลา: ${new Date().toISOString()}`,
        ].join('\n'),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`sendTestMail failed: ${msg}`);
      const certHint =
        /self-signed|certificate|UNABLE_TO_VERIFY|cert/i.test(msg) &&
        rejectUnauthorized
          ? ' ลองปิดตัวเลือก «ตรวจสอบใบรับรอง TLS» ในหน้าตั้งค่า หรือตั้ง SMTP_TLS_REJECT_UNAUTHORIZED=false ใน .env (SMTP ภายใน)'
          : '';
      throw new BadRequestException(
        `ส่งอีเมลทดสอบไม่สำเร็จ — ตรวจสอบ Host พอร์ต SSL และรหัสผ่าน (${msg})${certHint}`,
      );
    }
  }

  /** ส่งอีเมล HTML (แจ้งเตือนงาน) — ใช้ค่า SMTP เดียวกับทดสอบ */
  async sendHtmlMail(
    config: EmailSmtpConfig,
    options: {
      to: string[];
      cc?: string[];
      subject: string;
      html: string;
      text?: string;
    },
  ): Promise<void> {
    const to = options.to.map((e) => e.trim()).filter(Boolean);
    if (to.length === 0) {
      throw new BadRequestException('ไม่มีผู้รับอีเมล (To)');
    }

    const port = Number.parseInt(config.smtpPort, 10);
    if (Number.isNaN(port) || port < 1 || port > 65535) {
      throw new BadRequestException('พอร์ต SMTP ไม่ถูกต้อง');
    }

    const secure = config.secure === true;
    const envTls = process.env.SMTP_TLS_REJECT_UNAUTHORIZED;
    const envAllowInsecure =
      envTls === 'false' || envTls === '0' || envTls === 'no';
    const rejectUnauthorized = envAllowInsecure
      ? false
      : config.tlsRejectUnauthorized !== false;

    const transporter = nodemailer.createTransport({
      host: config.smtpHost.trim(),
      port,
      secure,
      auth: {
        user: config.username.trim(),
        pass: config.password,
      },
      tls: {
        rejectUnauthorized,
      },
    });

    const cc = (options.cc ?? [])
      .map((e) => e.trim())
      .filter(Boolean);

    try {
      await transporter.sendMail({
        from: config.from.trim(),
        to,
        cc: cc.length > 0 ? cc : undefined,
        subject: options.subject,
        html: options.html,
        text: options.text ?? options.subject,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`sendHtmlMail failed: ${msg}`);
      const certHint =
        /self-signed|certificate|UNABLE_TO_VERIFY|cert/i.test(msg) &&
        rejectUnauthorized
          ? ' ลองปิดตัวเลือก «ตรวจสอบใบรับรอง TLS» ในหน้าตั้งค่า'
          : '';
      throw new BadRequestException(
        `ส่งอีเมลไม่สำเร็จ (${msg})${certHint}`,
      );
    }
  }
}
