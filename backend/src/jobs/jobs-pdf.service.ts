import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import puppeteer from 'puppeteer';
import { JobsService } from './jobs.service';

/**
 * สร้าง PDF จากหน้า Next `/print/jobs/:id` ด้วย Chromium (ไม่ผ่าน html2canvas)
 * ต้องตั้ง FRONTEND_BASE_URL ให้ชี้ frontend ที่รันได้ (เช่น http://localhost:3000)
 */
@Injectable()
export class JobsPdfService {
  constructor(private readonly jobsService: JobsService) {}

  async generateReportPdf(jobId: number, jwt: string): Promise<Buffer> {
    if (!jwt?.trim()) {
      throw new BadRequestException('ต้องมี Authorization Bearer');
    }

    const job = await this.jobsService.findOne(jobId);
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

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

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
