/**
 * มาสก์ข้อความสาธารณะ: แสดงตัวอักษรนำ 2 ตัว + **** + ท้ายตาม trail (รองรับ Unicode/ไทย)
 */
export function maskTextForPublic(
  s: string | null | undefined,
  lead = 2,
  trail = 2,
): string | null {
  if (s == null) {
    return null;
  }
  const t = s.trim();
  if (t.length === 0) {
    return null;
  }
  const chars = [...t];
  if (chars.length <= lead + trail) {
    return `${chars.slice(0, Math.min(lead, chars.length)).join('')}****`;
  }
  return `${chars.slice(0, lead).join('')}****${chars.slice(-trail).join('')}`;
}

/** เบอร์โทร: ตัวเลขนำ 2 + **** + ท้าย 3 หลัก */
export function maskPhoneForPublic(
  s: string | null | undefined,
): string | null {
  if (s == null) {
    return null;
  }
  const digits = s.replace(/\D/g, '');
  if (digits.length === 0) {
    return null;
  }
  const lead = 2;
  const trail = 3;
  if (digits.length <= lead + trail) {
    return `${digits.slice(0, Math.min(lead, digits.length))}****`;
  }
  return `${digits.slice(0, lead)}****${digits.slice(-trail)}`;
}

/** อีเมล: มาสก์ส่วน local และ domain แยกกัน */
export function maskEmailForPublic(
  s: string | null | undefined,
): string | null {
  if (s == null) {
    return null;
  }
  const t = s.trim();
  const at = t.indexOf('@');
  if (at < 0) {
    return maskTextForPublic(t);
  }
  const local = t.slice(0, at);
  const domain = t.slice(at + 1);
  const localMasked = maskTextForPublic(local, 2, 2);
  const domainMasked = maskTextForPublic(domain, 1, 2);
  if (!localMasked || !domainMasked) {
    return '****@****';
  }
  return `${localMasked}@${domainMasked}`;
}
