/** เทมเพลต HTML สำหรับอีเมลแจ้งเตือนงาน (inline CSS — โทนสว่าง อ่านง่ายในไคลเอนต์อีเมล) */

export type JobEmailPayload = {
  ticketNo: string | null;
  title: string | null;
  province: string | null;
  district: string | null;
  location: string | null;
  /** PENDING | IN_PROGRESS | RESOLVED */
  statusCode: string;
  statusLabel: string;
  reporterName: string | null;
  assigneeName: string | null;
  reportDateLabel: string;
  fixDateLabel: string | null;
  dashboardUrl: string;
  publicStatusUrl: string;
};

function esc(s: string | null | undefined): string {
  if (s == null || s === '') return '—';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusBadgeHtml(code: string, label: string): string {
  const c = (code || '').toUpperCase();
  let bg = '#e2e8f0';
  let fg = '#334155';
  let border = '#cbd5e1';
  if (c === 'PENDING') {
    bg = '#fef3c7';
    fg = '#92400e';
    border = '#fcd34d';
  } else if (c === 'IN_PROGRESS') {
    bg = '#dbeafe';
    fg = '#1e40af';
    border = '#93c5fd';
  } else if (c === 'RESOLVED') {
    bg = '#d1fae5';
    fg = '#065f46';
    border = '#6ee7b7';
  }
  return `<span style="display:inline-block;padding:5px 14px;border-radius:9999px;font-size:12px;font-weight:600;background:${bg};color:${fg};border:1px solid ${border};">${esc(label)}</span>`;
}

function rowText(label: string, value: string): string {
  return `<tr>
  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;width:38%;vertical-align:top;">${esc(label)}</td>
  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;vertical-align:top;">${value}</td>
</tr>`;
}

function rowStatus(label: string, payload: JobEmailPayload): string {
  const badge = statusBadgeHtml(payload.statusCode, payload.statusLabel);
  return `<tr>
  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;width:38%;vertical-align:middle;">${esc(label)}</td>
  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;vertical-align:middle;">${badge}</td>
</tr>`;
}

function wrapBody(opts: {
  brandingLogoUrl: string;
  accentTitle: string;
  subtitle: string;
  payload: JobEmailPayload;
  extraRows?: string;
}): string {
  const { brandingLogoUrl, accentTitle, subtitle, payload, extraRows = '' } = opts;
  const logoBlock =
    brandingLogoUrl && /^https?:\/\//i.test(brandingLogoUrl.trim())
      ? `<img src="${esc(brandingLogoUrl.trim())}" alt="Logo" width="160" style="max-width:200px;height:auto;display:block;margin:0 auto 20px;border:0;" />`
      : `<div style="text-align:center;font-size:20px;font-weight:700;color:#0369a1;letter-spacing:0.02em;margin-bottom:16px;">CCTV Maintenance</div>`;

  const loc =
    [payload.province, payload.district, payload.location].filter(Boolean).join(' · ') ||
    '—';

  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="padding:28px 28px 12px;text-align:center;background:#ffffff;">
              ${logoBlock}
              <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;font-weight:700;">${esc(accentTitle)}</h1>
              <p style="margin:0;font-size:14px;color:#64748b;line-height:1.55;">${esc(subtitle)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 16px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                ${rowText('เลขที่ใบแจ้ง', esc(payload.ticketNo))}
                ${rowText('หัวข้อ / อาการ', esc(payload.title))}
                ${rowText('สถานที่', esc(loc))}
                ${rowStatus('สถานะ', payload)}
                ${rowText('ผู้แจ้ง', esc(payload.reporterName))}
                ${rowText('ผู้รับผิดชอบ', esc(payload.assigneeName))}
                ${rowText('วันที่แจ้ง', esc(payload.reportDateLabel))}
                ${payload.fixDateLabel ? rowText('วันที่ปิดงาน', esc(payload.fixDateLabel)) : ''}
                ${extraRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 24px;background:#ffffff;">
              <p style="margin:0 0 12px;font-size:13px;color:#64748b;">ลิงก์ดำเนินการในระบบ</p>
              <a href="${esc(payload.dashboardUrl)}" style="display:inline-block;padding:12px 22px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">เปิดงานในระบบ</a>
              <p style="margin:16px 0 0;font-size:12px;color:#64748b;line-height:1.5;">ตรวจสอบสถานะแบบสาธารณะ:<br /><a href="${esc(payload.publicStatusUrl)}" style="color:#2563eb;word-break:break-all;">${esc(payload.publicStatusUrl)}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;border-top:1px solid #e2e8f0;background:#ffffff;">
              <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;text-align:center;">Forth Co., Ltd. · ระบบแจ้งซ่อม CCTV</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildReportedEmailHtml(
  payload: JobEmailPayload,
  brandingLogoUrl: string,
): { subject: string; html: string; text: string } {
  const subject = `[แจ้งเหตุ] ใบแจ้งซ่อม ${payload.ticketNo ?? payload.title ?? ''}`.trim();
  const html = wrapBody({
    brandingLogoUrl,
    accentTitle: 'ได้รับเรื่องแจ้งซ่อมแล้ว',
    subtitle: 'ระบบบันทึกคำร้องของท่านเรียบร้อย',
    payload,
  });
  const text = `${subject}\nเลขที่: ${payload.ticketNo}\n${payload.dashboardUrl}`;
  return { subject, html, text };
}

export function buildAssignedEmailHtml(
  payload: JobEmailPayload,
  brandingLogoUrl: string,
): { subject: string; html: string; text: string } {
  const subject = `[รับเรื่อง] มอบหมายงาน ${payload.ticketNo ?? ''}`.trim();
  const html = wrapBody({
    brandingLogoUrl,
    accentTitle: 'มีงานมอบหมาย / รับเรื่องแล้ว',
    subtitle: 'ท่านได้รับมอบหมายให้ดำเนินการแจ้งซ่อมนี้',
    payload,
  });
  const text = `${subject}\nเลขที่: ${payload.ticketNo}\n${payload.dashboardUrl}`;
  return { subject, html, text };
}

export function buildClosedEmailHtml(
  payload: JobEmailPayload,
  brandingLogoUrl: string,
): { subject: string; html: string; text: string } {
  const subject = `[ปิดงาน] แจ้งซ่อม ${payload.ticketNo ?? ''} เสร็จสิ้น`.trim();
  const html = wrapBody({
    brandingLogoUrl,
    accentTitle: 'ปิดงานเรียบร้อย',
    subtitle: 'งานแจ้งซ่อมของท่านได้ปิดและบันทึกผลแล้ว',
    payload,
  });
  const text = `${subject}\nเลขที่: ${payload.ticketNo}\n${payload.dashboardUrl}`;
  return { subject, html, text };
}
