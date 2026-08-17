import { buildReportedEmailHtml, type JobEmailPayload } from './job-email-html';

describe('job-email-html location line (agency + station)', () => {
  const base: JobEmailPayload = {
    ticketNo: 'CM-SHF-2002-0001',
    issueSummary: 'ทดสอบ',
    province: 'กาญจนบุรี',
    district: 'เลาขวัญ',
    agency: 'ที่ทำการบ้านผู้ใหญ่บ้าน',
    location: 'หมู่ 13 หนองจิกน้ำดำ',
    fixEnvironmentLabel: null,
    jobTypeLabel: null,
    statusCode: 'PENDING',
    statusLabel: 'รอดำเนินการ',
    reporterName: 'ผู้แจ้ง',
    assigneeName: null,
    reportDateLabel: '1/1/2026',
    fixDateLabel: null,
    dashboardUrl: 'http://localhost/dashboard/jobs/1',
    publicStatusUrl: 'http://localhost/public/status?ticketNo=1',
  };

  it('includes agency and station in email body', () => {
    const { html } = buildReportedEmailHtml(base, '');
    expect(html).toContain('ที่ทำการบ้านผู้ใหญ่บ้าน');
    expect(html).toContain('หมู่ 13 หนองจิกน้ำดำ');
  });

  it('shows only location when agency is null (legacy job)', () => {
    const { html } = buildReportedEmailHtml({ ...base, agency: null }, '');
    expect(html).toContain('หมู่ 13 หนองจิกน้ำดำ');
    expect(html).not.toContain('ที่ทำการบ้านผู้ใหญ่บ้าน');
  });
});
