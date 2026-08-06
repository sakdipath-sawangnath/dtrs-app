/** ตั้งค่าเทมเพลตอีเมลแจ้งงาน (เก็บใน Setting key email_templates) */

export type EmailTemplateBlock = {
  /** เปิด/ปิดการส่งเทมเพลตนี้ */
  enabled: boolean;
  /** อีเมล To เพิ่มเติม (นอกเหนือจากผู้รับหลักอัตโนมัติ) */
  toExtra: string[];
  /** สำเนา (CC) */
  cc: string[];
  /** แจ้งไปยังอีเมลของผู้ใช้ที่ผูกบทบาท (AppRole id) — รวมเป็น CC */
  notifyRoleIds: number[];
};

export type EmailTemplatesSettings = {
  /** URL โลโก้แสดงในอีเมล (https แนะนำ) */
  brandingLogoUrl: string;
  /**
   * Origin ของหน้าเว็บสำหรับลิงก์ในอีเมล (เช่น https://dtrs-app.forth.co.th)
   * ถ้าว่าง → ใช้ FRONTEND_BASE_URL ของ backend (บน dev มักเป็น localhost)
   */
  publicBaseUrl: string;
  /** แจ้งเหตุ — ผู้รับหลัก: อีเมลผู้แจ้ง */
  onReported: EmailTemplateBlock;
  /** รับเรื่อง / มอบหมาย — ผู้รับหลัก: อีเมลผู้รับงาน */
  onAssigned: EmailTemplateBlock;
  /** ปิดงาน — ผู้รับหลัก: อีเมลผู้แจ้ง; CC ตามช่อง CC + บทบาทใน settings เท่านั้น */
  onClosed: EmailTemplateBlock;
};

export const EMAIL_TEMPLATES_SETTING_KEY = 'email_templates';

export function defaultEmailTemplateBlock(): EmailTemplateBlock {
  return { enabled: true, toExtra: [], cc: [], notifyRoleIds: [] };
}

export function defaultEmailTemplatesSettings(): EmailTemplatesSettings {
  return {
    brandingLogoUrl: '',
    publicBaseUrl: '',
    onReported: defaultEmailTemplateBlock(),
    onAssigned: defaultEmailTemplateBlock(),
    onClosed: defaultEmailTemplateBlock(),
  };
}
