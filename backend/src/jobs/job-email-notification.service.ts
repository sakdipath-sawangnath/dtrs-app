import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../settings/mail.service';
import { SettingsService } from '../settings/settings.service';
import { JobsPdfService } from './jobs-pdf.service';
import {
  buildAssignedEmailHtml,
  buildClosedEmailHtml,
  buildReportedEmailHtml,
  type JobEmailPayload,
} from './job-email-html';

const STATUS_TH: Record<string, string> = {
  PENDING: 'รอดำเนินการ',
  IN_PROGRESS: 'กำลังแก้ไข',
  RESOLVED: 'แล้วเสร็จ',
};

@Injectable()
export class JobEmailNotificationService {
  private readonly logger = new Logger(JobEmailNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly mailService: MailService,
    private readonly jobsPdfService: JobsPdfService,
  ) {}

  /**
   * ลิงก์ในอีเมล: ใช้ publicBaseUrl จากการตั้งค่า (DB) ก่อน — กัน dev backend ส่ง localhost
   * ถ้าไม่ตั้ง → ใช้ FRONTEND_BASE_URL ของ process
   */
  private async resolveEmailLinkBase(): Promise<string> {
    const templates = await this.settingsService.getEmailTemplates();
    const fromSettings = templates.publicBaseUrl?.trim();
    if (fromSettings && /^https?:\/\//i.test(fromSettings)) {
      return fromSettings.replace(/\/+$/, '');
    }
    return (process.env.FRONTEND_BASE_URL || 'http://localhost:3000').replace(
      /\/+$/,
      '',
    );
  }

  private isLikelyEmail(s: string | null | undefined): boolean {
    if (!s || typeof s !== 'string') return false;
    const t = s.trim();
    return t.length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
  }

  /** ไม่ส่งซ้ำ (case-insensitive) */
  private uniqueEmails(
    primary: (string | null | undefined)[],
    extra: string[],
  ): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const e of [...primary, ...extra]) {
      if (!this.isLikelyEmail(e)) continue;
      const raw = String(e).trim();
      const key = raw.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(raw);
    }
    return out;
  }

  private filterCc(cc: string[], toList: string[]): string[] {
    const toSet = new Set(toList.map((e) => e.toLowerCase()));
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of cc) {
      if (!this.isLikelyEmail(c)) continue;
      const raw = c.trim();
      const key = raw.toLowerCase();
      if (toSet.has(key) || seen.has(key)) continue;
      seen.add(key);
      out.push(raw);
    }
    return out;
  }

  private formatDate(d: Date | null | undefined): string {
    if (!d) return '—';
    try {
      return d.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    } catch {
      return String(d);
    }
  }

  private async buildPayload(jobId: number): Promise<JobEmailPayload | null> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        ticketNo: true,
        title: true,
        status: true,
        province: true,
        district: true,
        location: true,
        reporterName: true,
        reporterEmail: true,
        reportDate: true,
        fixDate: true,
        reporter: { select: { email: true } },
        assignedTo: { select: { email: true, name: true } },
      },
    });
    if (!job) return null;

    const base = await this.resolveEmailLinkBase();
    const ticket = job.ticketNo ?? String(job.id);
    const publicStatusUrl = `${base}/public/status?ticketNo=${encodeURIComponent(ticket)}`;
    const dashboardUrl = `${base}/dashboard/jobs/${job.id}`;

    const st = String(job.status ?? '');
    const statusLabel = STATUS_TH[st] ?? st;

    return {
      ticketNo: job.ticketNo,
      title: job.title,
      province: job.province,
      district: job.district,
      location: job.location,
      statusCode: st || 'PENDING',
      statusLabel,
      reporterName: job.reporterName,
      assigneeName: job.assignedTo?.name ?? null,
      reportDateLabel: this.formatDate(job.reportDate),
      fixDateLabel: job.fixDate ? this.formatDate(job.fixDate) : null,
      dashboardUrl,
      publicStatusUrl,
    };
  }

  /** อีเมลผู้ใช้ที่ผูก roleId ตามที่เลือกในการตั้งค่า (ส่งเป็น CC) */
  private async getEmailsForUserRoles(roleIds: number[]): Promise<string[]> {
    const ids = [...new Set(roleIds)].filter((n) => Number.isInteger(n) && n > 0);
    if (!ids.length) return [];
    const users = await this.prisma.user.findMany({
      where: { roleId: { in: ids } },
      select: { email: true },
    });
    const seen = new Set<string>();
    const out: string[] = [];
    for (const u of users) {
      const e = u.email?.trim();
      if (!e || !this.isLikelyEmail(e)) continue;
      const k = e.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(e);
    }
    return out;
  }

  private reporterPrimaryEmail(job: {
    reporterEmail: string | null;
    reporter: { email: string | null } | null;
  }): string | null {
    if (this.isLikelyEmail(job.reporterEmail)) return job.reporterEmail!.trim();
    if (this.isLikelyEmail(job.reporter?.email ?? null))
      return job.reporter!.email!.trim();
    return null;
  }

  async notifyReported(jobId: number): Promise<void> {
    try {
      const [templates, smtp] = await Promise.all([
        this.settingsService.getEmailTemplates(),
        this.settingsService.getEmailSmtpConfigForSending(),
      ]);
      const block = templates.onReported;
      if (!block.enabled) return;
      if (!smtp) {
        this.logger.warn(
          `notifyReported(${jobId}): ข้าม — ยังไม่ตั้งค่า SMTP หรือไม่มีรหัสผ่าน`,
        );
        return;
      }

      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
        select: {
          reporterEmail: true,
          reporter: { select: { email: true } },
        },
      });
      if (!job) return;

      const primary = this.reporterPrimaryEmail(job);
      const to = this.uniqueEmails([primary], block.toExtra);
      if (to.length === 0) {
        this.logger.warn(
          `notifyReported(${jobId}): ข้าม — ไม่มีอีเมลผู้แจ้งและ To เพิ่มเติม`,
        );
        return;
      }
      const roleEmails = await this.getEmailsForUserRoles(
        block.notifyRoleIds ?? [],
      );
      const cc = this.filterCc([...block.cc, ...roleEmails], to);

      const payload = await this.buildPayload(jobId);
      if (!payload) return;

      const { subject, html, text } = buildReportedEmailHtml(
        payload,
        templates.brandingLogoUrl,
      );
      await this.mailService.sendHtmlMail(smtp, { to, cc, subject, html, text });
    } catch (e) {
      this.logger.warn(
        `notifyReported(${jobId}): ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  async notifyAssigned(jobId: number): Promise<void> {
    try {
      const [templates, smtp] = await Promise.all([
        this.settingsService.getEmailTemplates(),
        this.settingsService.getEmailSmtpConfigForSending(),
      ]);
      const block = templates.onAssigned;
      if (!block.enabled) return;
      if (!smtp) {
        this.logger.warn(
          `notifyAssigned(${jobId}): ข้าม — ยังไม่ตั้งค่า SMTP หรือไม่มีรหัสผ่าน`,
        );
        return;
      }

      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
        select: {
          assignedTo: { select: { email: true } },
          fixerEmail: true,
        },
      });
      if (!job) return;

      const primary =
        this.isLikelyEmail(job.assignedTo?.email) && job.assignedTo
          ? job.assignedTo.email!.trim()
          : this.isLikelyEmail(job.fixerEmail)
            ? job.fixerEmail!.trim()
            : null;

      const to = this.uniqueEmails([primary], block.toExtra);
      if (to.length === 0) {
        this.logger.warn(
          `notifyAssigned(${jobId}): ข้าม — ไม่มีอีเมลผู้รับงานและ To เพิ่มเติม`,
        );
        return;
      }
      const roleEmails = await this.getEmailsForUserRoles(
        block.notifyRoleIds ?? [],
      );
      const cc = this.filterCc([...block.cc, ...roleEmails], to);

      const payload = await this.buildPayload(jobId);
      if (!payload) return;

      const { subject, html, text } = buildAssignedEmailHtml(
        payload,
        templates.brandingLogoUrl,
      );
      await this.mailService.sendHtmlMail(smtp, { to, cc, subject, html, text });
    } catch (e) {
      this.logger.warn(
        `notifyAssigned(${jobId}): ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  async notifyClosed(jobId: number, jwtForPdf?: string): Promise<void> {
    try {
      const [templates, smtp] = await Promise.all([
        this.settingsService.getEmailTemplates(),
        this.settingsService.getEmailSmtpConfigForSending(),
      ]);
      const block = templates.onClosed;
      if (!block.enabled) return;
      if (!smtp) {
        this.logger.warn(
          `notifyClosed(${jobId}): ข้าม — ยังไม่ตั้งค่า SMTP หรือไม่มีรหัสผ่าน`,
        );
        return;
      }

      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
        select: {
          reporterEmail: true,
          reporter: { select: { email: true } },
          ticketNo: true,
        },
      });
      if (!job) return;

      const primary = this.reporterPrimaryEmail(job);
      const toReporter = this.uniqueEmails([primary], block.toExtra);
      if (toReporter.length === 0) {
        this.logger.warn(
          `notifyClosed(${jobId}): ข้าม — ไม่มีอีเมลผู้แจ้งและ To เพิ่มเติม`,
        );
        return;
      }
      const roleEmails = await this.getEmailsForUserRoles(
        block.notifyRoleIds ?? [],
      );
      // ผู้รับ CC ตามตั้งค่า + บทบาท (ต้องแนบ PDF ตาม requirement) — ต้องแยกส่งคนละฉบับ
      const ccRecipients = this.filterCc([...block.cc, ...roleEmails], toReporter);

      const payload = await this.buildPayload(jobId);
      if (!payload) return;

      const { subject, html, text } = buildClosedEmailHtml(
        payload,
        templates.brandingLogoUrl,
      );

      // 1) ผู้รับหลัก: อีเมลผู้แจ้ง (ไม่แนบ PDF)
      await this.mailService.sendHtmlMail(smtp, {
        to: toReporter,
        subject,
        html,
        text,
      });

      // 2) แจ้งเตือนผู้ใช้ในบทบาท/CC: แนบ PDF (รูปแบบเดียวกับเอกสาร /print/jobs/:id)
      if (ccRecipients.length > 0) {
        let pdf: Buffer | null = null;
        try {
          const jwt = (jwtForPdf ?? '').trim();
          if (jwt) {
            pdf = await this.jobsPdfService.generateReportPdf(jobId, jwt);
          } else {
            this.logger.warn(
              `notifyClosed(${jobId}): ไม่สามารถแนบ PDF — ไม่มี JWT สำหรับสร้างเอกสาร`,
            );
          }
        } catch (e) {
          this.logger.warn(
            `notifyClosed(${jobId}): สร้าง PDF ไม่สำเร็จ — ${e instanceof Error ? e.message : String(e)}`,
          );
          pdf = null;
        }

        await this.mailService.sendHtmlMail(smtp, {
          to: ccRecipients,
          subject,
          html,
          text,
          attachments: pdf
            ? [
                {
                  filename: `CCTV-Job-${job.ticketNo ?? jobId}.pdf`,
                  content: pdf,
                  contentType: 'application/pdf',
                },
              ]
            : undefined,
        });
      }
    } catch (e) {
      this.logger.warn(
        `notifyClosed(${jobId}): ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
