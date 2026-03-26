import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import puppeteer from 'puppeteer';
import { PrismaService } from '../prisma/prisma.service';

/**
 * ค้นหา Chrome / Edge ที่ติดตั้งในเครื่อง — แก้กรณี Puppeteer ยังไม่ได้รัน
 * `npx puppeteer browsers install chrome` (cache ว่าง)
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
    const p =
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
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
  constructor(private readonly prisma: PrismaService) {}

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

    const chromePath = findChromeExecutable();
    const edgePath = findEdgeExecutable();

    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ] as const;

    let browser: Awaited<ReturnType<typeof puppeteer.launch>>;
    try {
      if (chromePath) {
        browser = await puppeteer.launch({
          headless: true,
          executablePath: chromePath,
          args: [...launchArgs],
        });
      } else if (edgePath) {
        browser = await puppeteer.launch({
          headless: true,
          executablePath: edgePath,
          args: [...launchArgs],
        });
      } else {
        /** ใช้ Chrome ที่ติดตั้งในระบบ (ไม่พึ่ง cache ของ Puppeteer) */
        browser = await puppeteer.launch({
          headless: true,
          channel: 'chrome',
          args: [...launchArgs],
        });
      }
    } catch (firstErr: unknown) {
      const msg =
        firstErr instanceof Error ? firstErr.message : String(firstErr);
      throw new InternalServerErrorException(
        `ไม่สามารถสร้าง PDF ได้: ${msg} — ติดตั้ง Google Chrome หรือ Microsoft Edge หรือตั้ง PUPPETEER_EXECUTABLE_PATH ชี้ไปที่ chrome.exe / msedge.exe หรือรันในโฟลเดอร์ backend: npx puppeteer browsers install chrome`,
      );
    }

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
}
