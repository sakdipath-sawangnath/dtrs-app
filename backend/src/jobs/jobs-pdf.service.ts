import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import puppeteer from 'puppeteer-core';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from '../roles/roles.service';
import type { DashboardSummaryPdfQueryDto } from './dto/create-job.dto';

/**
 * ค้นหา Chrome / Edge ที่ติดตั้งในเครื่อง — แก้กรณี Puppeteer ยังไม่ได้รัน
 * `npx @puppeteer/browsers install chrome` (cache ว่าง — local dev)
 *
 * ตั้งค่าได้: PUPPETEER_EXECUTABLE_PATH หรือ CHROME_BIN
 */
function findChromeExecutable(): string | undefined {
  const fromEnv = (
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_BIN ||
    process.env.GOOGLE_CHROME_BIN ||
    ''
  ).trim();
  if (fromEnv) {
    const resolved = path.resolve(fromEnv);
    if (fs.existsSync(resolved)) return resolved;
  }
  if (process.platform === 'linux') {
    for (const p of [
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
    ]) {
      if (fs.existsSync(p)) return p;
    }
  }
  if (process.platform === 'win32') {
    const candidates = [
      process.env.LOCALAPPDATA &&
        path.join(
          process.env.LOCALAPPDATA,
          'Google',
          'Chrome',
          'Application',
          'chrome.exe',
        ),
      process.env.PROGRAMFILES &&
        path.join(
          process.env.PROGRAMFILES,
          'Google',
          'Chrome',
          'Application',
          'chrome.exe',
        ),
      process.env['PROGRAMFILES(X86)'] &&
        path.join(
          process.env['PROGRAMFILES(X86)'],
          'Google',
          'Chrome',
          'Application',
          'chrome.exe',
        ),
    ].filter((x): x is string => !!x);
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  }
  if (process.platform === 'darwin') {
    const p = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

/** Edge บน Windows — มักมีอยู่แล้วแม้ไม่มี Chrome */
function findEdgeExecutable(): string | undefined {
  if (process.platform !== 'win32') return undefined;
  const candidates = [
    process.env.LOCALAPPDATA &&
      path.join(
        process.env.LOCALAPPDATA,
        'Microsoft',
        'Edge',
        'Application',
        'msedge.exe',
      ),
    process.env.PROGRAMFILES &&
      path.join(
        process.env.PROGRAMFILES,
        'Microsoft',
        'Edge',
        'Application',
        'msedge.exe',
      ),
    process.env['PROGRAMFILES(X86)'] &&
      path.join(
        process.env['PROGRAMFILES(X86)'],
        'Microsoft',
        'Edge',
        'Application',
        'msedge.exe',
      ),
  ].filter((x): x is string => !!x);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

/**
 * สร้าง PDF จากหน้า Next `/print/jobs/:id` ด้วย Chromium (ไม่ผ่าน html2canvas)
 * ต้องตั้ง FRONTEND_BASE_URL ให้ชี้ frontend ที่รันได้ (เช่น http://localhost:3000)
 */
@Injectable()
export class JobsPdfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rolesService: RolesService,
  ) {}

  private readonly launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
  ] as const;

  private async launchBrowser() {
    const chromePath = findChromeExecutable();
    const edgePath = findEdgeExecutable();
    try {
      if (chromePath) {
        return await puppeteer.launch({
          headless: true,
          executablePath: chromePath,
          args: [...this.launchArgs],
        });
      }
      if (edgePath) {
        return await puppeteer.launch({
          headless: true,
          executablePath: edgePath,
          args: [...this.launchArgs],
        });
      }
      return await puppeteer.launch({
        headless: true,
        channel: 'chrome',
        args: [...this.launchArgs],
      });
    } catch (firstErr: unknown) {
      const msg =
        firstErr instanceof Error ? firstErr.message : String(firstErr);
      throw new InternalServerErrorException(
        `ไม่สามารถสร้าง PDF ได้: ${msg} — ติดตั้ง Google Chrome หรือ Microsoft Edge หรือตั้ง PUPPETEER_EXECUTABLE_PATH ชี้ไปที่ chrome.exe / msedge.exe หรือรันในโฟลเดอร์ backend: npx puppeteer browsers install chrome`,
      );
    }
  }

  async generateReportPdf(jobId: number, jwt: string): Promise<Buffer> {
    if (!jwt?.trim()) {
      throw new BadRequestException('ต้องมี Authorization Bearer');
    }

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, status: true },
    });
    if (!job) {
      throw new NotFoundException(`ไม่พบงาน ${jobId}`);
    }
    if (job.status !== 'RESOLVED') {
      throw new BadRequestException(
        'ดาวน์โหลด PDF ได้เฉพาะงานที่มีสถานะเสร็จสิ้น',
      );
    }

    const base = (
      process.env.FRONTEND_BASE_URL || 'http://localhost:3000'
    ).replace(/\/$/, '');

    const browser = await this.launchBrowser();

    try {
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${jwt}`,
      });

      await page.goto(`${base}/print/jobs/${jobId}`, {
        waitUntil: 'networkidle0',
        timeout: 120_000,
      });

      /** บังคับใช้สื่อพิมพ์ให้ตรงกับ @media print ใน print.css (ช่องรูปหน้า 2, @page margin ฯลฯ) */
      await page.emulateMediaType('print');

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private parseSummaryRange(query: DashboardSummaryPdfQueryDto): {
    start: Date;
    end: Date;
    labelTh: string;
  } {
    if (query.periodType === 'month') {
      const [yearText, monthText] = String(query.month).split('-');
      const year = Number(yearText);
      const month = Number(monthText);
      if (!year || !month || month < 1 || month > 12) {
        throw new BadRequestException('month ไม่ถูกต้อง');
      }
      const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      return {
        start,
        end,
        labelTh: `รายเดือน (${query.month})`,
      };
    }
    if (query.periodType === 'year') {
      const year = Number(query.year);
      if (!year || year < 1990 || year > 2100) {
        throw new BadRequestException('year ไม่ถูกต้อง');
      }
      return {
        start: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
        end: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
        labelTh: `รายปี (${year})`,
      };
    }

    const start = new Date(String(query.start || ''));
    const end = new Date(String(query.end || ''));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('start/end ไม่ถูกต้อง');
    }
    if (start > end) {
      throw new BadRequestException('start ต้องไม่มากกว่า end');
    }
    return {
      start,
      end,
      labelTh: `กำหนดช่วง (${this.formatDateTimeTh(start)} - ${this.formatDateTimeTh(end)})`,
    };
  }

  private formatDateTimeTh(date: Date): string {
    return new Intl.DateTimeFormat('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Bangkok',
    }).format(date);
  }

  /** นับงานในช่วงตามฟิลด์บันทึกการแก้ไข — งานที่ยังไม่มีข้อมูลจะเป็น UNKNOWN */
  private normalizeFixEnvironment(
    v: string | null | undefined,
  ): 'INDOOR' | 'OUTDOOR' | 'UNKNOWN' {
    const u = (v ?? '').trim().toUpperCase();
    if (u === 'INDOOR') return 'INDOOR';
    if (u === 'OUTDOOR') return 'OUTDOOR';
    return 'UNKNOWN';
  }

  private normalizeBrokenPart(
    v: string | null | undefined,
  ): 'Hardware' | 'Software' | 'UNKNOWN' {
    const lower = (v ?? '').trim().toLowerCase();
    if (lower === 'hardware') return 'Hardware';
    if (lower === 'software') return 'Software';
    return 'UNKNOWN';
  }

  private htmlEscape(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async generateDashboardSummaryPdf(
    query: DashboardSummaryPdfQueryDto,
    actorUserId: number,
  ): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
    const { start, end, labelTh } = this.parseSummaryRange(query);
    const permissions =
      await this.rolesService.getPermissionsForUser(actorUserId);
    const includeOutOfContract = permissions.includes('job.viewContractTabs');

    const rows = await this.prisma.job.findMany({
      where: {
        ...(includeOutOfContract
          ? {}
          : { NOT: { isOutOfContract: true } }),
        OR: [
          { reportDate: { gte: start, lte: end } },
          {
            AND: [
              { reportDate: null },
              { createdAt: { gte: start, lte: end } },
            ],
          },
        ],
      },
      select: {
        status: true,
        isOutOfContract: true,
        reportDate: true,
        createdAt: true,
        fixDate: true,
        province: true,
        assignedToId: true,
        fixEnvironment: true,
        brokenPart: true,
      },
    });

    const envCounts = { INDOOR: 0, OUTDOOR: 0, UNKNOWN: 0 };
    const partCounts = { Hardware: 0, Software: 0, UNKNOWN: 0 };
    rows.forEach((j) => {
      envCounts[this.normalizeFixEnvironment(j.fixEnvironment)]++;
      partCounts[this.normalizeBrokenPart(j.brokenPart)]++;
    });

    const envRows = [
      ['ภายใน (ในอาคาร)', envCounts.INDOOR],
      ['ภายนอก (นอกอาคาร)', envCounts.OUTDOOR],
      ['ไม่ระบุ', envCounts.UNKNOWN],
    ]
      .map(
        ([label, n]) =>
          `<tr><td>${this.htmlEscape(String(label))}</td><td class="num">${n}</td></tr>`,
      )
      .join('');

    const partRows = [
      ['Hardware (ฮาร์ดแวร์)', partCounts.Hardware],
      ['Software (ซอฟต์แวร์)', partCounts.Software],
      ['ไม่ระบุ', partCounts.UNKNOWN],
    ]
      .map(
        ([label, n]) =>
          `<tr><td>${this.htmlEscape(String(label))}</td><td class="num">${n}</td></tr>`,
      )
      .join('');

    const total = rows.length;
    const pending = rows.filter((j) => j.status === 'PENDING').length;
    const inProgress = rows.filter((j) => j.status === 'IN_PROGRESS').length;
    const resolved = rows.filter((j) => j.status === 'RESOLVED').length;
    const cancelled = rows.filter((j) => j.status === 'CANCELLED').length;
    const outOfContract = rows.filter((j) => j.isOutOfContract === true).length;
    const pendingUnassigned = rows.filter(
      (j) => j.status === 'PENDING' && !j.assignedToId,
    ).length;

    const resolutionDays = rows
      .filter((j) => j.status === 'RESOLVED' && j.fixDate)
      .map((j) => {
        const from = new Date(j.reportDate || j.createdAt).getTime();
        const to = new Date(j.fixDate as Date).getTime();
        return Math.max(0, (to - from) / 86_400_000);
      });
    const avgResolutionDays =
      resolutionDays.length > 0
        ? resolutionDays.reduce((a, b) => a + b, 0) / resolutionDays.length
        : null;

    const provinceCount: Record<string, number> = {};
    rows.forEach((j) => {
      const p = (j.province || '').trim() || 'ไม่ระบุ';
      provinceCount[p] = (provinceCount[p] || 0) + 1;
    });
    const topProvinceRows = Object.entries(provinceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(
        ([name, count], idx) =>
          `<tr><td>${idx + 1}</td><td>${this.htmlEscape(name)}</td><td class="num">${count}</td></tr>`,
      )
      .join('');

    const outOfContractKpi = includeOutOfContract
      ? `<div class="kpi"><div class="label">นอกสัญญา</div><div class="value">${outOfContract}</div></div>`
      : '';

    const nowLabel = this.formatDateTimeTh(new Date());
    const html = `<!doctype html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>รายงานสรุปงานแจ้งซ่อม</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { font-family: "TH Sarabun New","Sarabun","Noto Sans Thai",sans-serif; color:#0f172a; margin:0; }
    h1 { margin:0; font-size: 26px; line-height: 1.2; }
    .sub { color:#475569; font-size:14px; margin-top:6px; }
    .grid { margin-top: 14px; display:grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap:10px; }
    .kpi { border:1px solid #cbd5e1; border-radius:10px; padding:10px 12px; }
    .kpi .label { color:#64748b; font-size:12px; }
    .kpi .value { font-size:24px; margin-top:4px; font-weight:700; }
    table { width:100%; border-collapse: collapse; margin-top: 14px; font-size: 13px; }
    th, td { border:1px solid #cbd5e1; padding:8px 10px; text-align:left; vertical-align: top; }
    th { background:#f1f5f9; }
    .num { text-align:right; font-variant-numeric: tabular-nums; }
    .section-title { margin-top: 18px; margin-bottom: 6px; font-weight:700; font-size: 15px; }
    .note { color:#64748b; font-size:12px; margin: 4px 0 8px; line-height: 1.35; }
  </style>
</head>
<body>
  <h1>รายงานสรุปงานแจ้งซ่อม CCTV</h1>
  <div class="sub">ช่วงเวลา: ${this.htmlEscape(labelTh)} | ออกรายงาน: ${this.htmlEscape(nowLabel)}</div>

  <div class="grid">
    <div class="kpi"><div class="label">ทั้งหมดในช่วง</div><div class="value">${total}</div></div>
    <div class="kpi"><div class="label">รอดำเนินการ</div><div class="value">${pending}</div></div>
    <div class="kpi"><div class="label">กำลังแก้ไข</div><div class="value">${inProgress}</div></div>
    <div class="kpi"><div class="label">เสร็จสิ้น</div><div class="value">${resolved}</div></div>
    <div class="kpi"><div class="label">ยกเลิก</div><div class="value">${cancelled}</div></div>
    ${outOfContractKpi}
    <div class="kpi"><div class="label">รอและยังไม่มอบหมาย</div><div class="value">${pendingUnassigned}</div></div>
  </div>

  <div class="section-title">แยกตามสภาพแวดล้อมการแก้ไข (ภายใน / ภายนอก)</div>
  <p class="note">นับจากฟิลด์สถานที่ติดตั้งตอนแก้ไข — งานที่ยังไม่ปิดหรือยังไม่บันทึกจะอยู่ใน &quot;ไม่ระบุ&quot;</p>
  <table>
    <thead><tr><th>ประเภท</th><th class="num">จำนวน (รายการ)</th></tr></thead>
    <tbody>
      ${envRows}
    </tbody>
  </table>

  <div class="section-title">แยกตามประเภทงาน (Hardware / Software)</div>
  <p class="note">นับจากฟิลด์ประเภทงานตอนปิดงาน — งานที่ยังไม่ปิดหรือยังไม่บันทึกจะอยู่ใน &quot;ไม่ระบุ&quot;</p>
  <table>
    <thead><tr><th>ประเภท</th><th class="num">จำนวน (รายการ)</th></tr></thead>
    <tbody>
      ${partRows}
    </tbody>
  </table>

  <div class="section-title">สรุปตัวชี้วัดเพิ่มเติม</div>
  <table>
    <thead><tr><th>รายการ</th><th class="num">ค่า</th></tr></thead>
    <tbody>
      <tr><td>เวลาแก้เฉลี่ย (วัน) ของงานที่ปิดแล้ว</td><td class="num">${avgResolutionDays != null ? avgResolutionDays.toFixed(1) : '-'}</td></tr>
    </tbody>
  </table>

  <div class="section-title">จังหวัดที่มีรายการมากที่สุด (Top 5)</div>
  <table>
    <thead><tr><th style="width:70px">ลำดับ</th><th>จังหวัด</th><th class="num" style="width:140px">จำนวน (รายการ)</th></tr></thead>
    <tbody>
      ${topProvinceRows || '<tr><td colspan="3">ไม่มีข้อมูล</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;

    const browser = await this.launchBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 120_000,
      });
      await page.emulateMediaType('print');
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });
      const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
      return {
        buffer: Buffer.from(pdf),
        filename: `dashboard-summary-${stamp}.pdf`,
      };
    } finally {
      await browser.close();
    }
  }
}
