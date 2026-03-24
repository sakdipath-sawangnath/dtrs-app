"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Loader2, Save, Info, Send, Settings, Eye, EyeOff, Mail } from "lucide-react";
import { toastSuccess, toastError } from "@/lib/toast";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

function unwrapApiData<T>(root: unknown): T | null {
  if (!root) return null;
  if (typeof root === "object" && root !== null && "data" in (root as Record<string, unknown>)) {
    return ((root as { data?: unknown }).data as T) ?? null;
  }
  return root as T;
}

type EmailSmtpResponse = {
  smtpHost: string;
  smtpPort: string;
  username: string;
  secure: boolean;
  from: string;
  passwordSet: boolean;
  tlsRejectUnauthorized: boolean;
};

type DefaultPassResponse = {
  passwordSet: boolean;
};

type EmailTemplateBlockResponse = {
  enabled: boolean;
  toExtra: string[];
  cc: string[];
  notifyRoleIds?: number[];
};

type EmailTemplatesResponse = {
  brandingLogoUrl: string;
  /** Origin สำหรับลิงก์ในอีเมล — ว่างแล้วใช้ FRONTEND_BASE_URL ของเซิร์ฟเวอร์ */
  publicBaseUrl?: string;
  onReported: EmailTemplateBlockResponse;
  onAssigned: EmailTemplateBlockResponse;
  onClosed: EmailTemplateBlockResponse;
};

type TemplateBlockForm = {
  enabled: boolean;
  toExtra: string;
  cc: string;
  notifyRoleIds: number[];
};

function splitEmails(s: string): string[] {
  return s.split(/[,;\n\r]+/).map((x) => x.trim()).filter(Boolean);
}

function apiErrorMessage(err: unknown): string {
  const payload = (err as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response
    ?.data;
  const m =
    payload?.error?.message ??
    (typeof payload?.message === "string" ? payload.message : undefined);
  return m && String(m).trim() ? String(m) : "เกิดข้อผิดพลาด";
}

export default function SettingsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;

  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingEmail, setSavingEmail] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  const [passwordSet, setPasswordSet] = useState(false);

  const [defaultPassSet, setDefaultPassSet] = useState(false);
  const [defaultPassForm, setDefaultPassForm] = useState({ password: "" });
  const [savingDefaultPass, setSavingDefaultPass] = useState(false);
  const [showDefaultPass, setShowDefaultPass] = useState(false);

  const [emailForm, setEmailForm] = useState({
    smtpHost: "",
    smtpPort: "587",
    username: "",
    password: "",
    secure: "false",
    from: "",
    tlsRejectUnauthorized: true,
  });

  const [testTo, setTestTo] = useState("");

  const [savingTemplates, setSavingTemplates] = useState(false);
  const [rolesList, setRolesList] = useState<{ id: number; code: string; name: string }[]>([]);
  const [emailTemplatesForm, setEmailTemplatesForm] = useState<{
    brandingLogoUrl: string;
    publicBaseUrl: string;
    onReported: TemplateBlockForm;
    onAssigned: TemplateBlockForm;
    onClosed: TemplateBlockForm;
  }>({
    brandingLogoUrl: "",
    publicBaseUrl: "",
    onReported: { enabled: true, toExtra: "", cc: "", notifyRoleIds: [] },
    onAssigned: { enabled: true, toExtra: "", cc: "", notifyRoleIds: [] },
    onClosed: { enabled: true, toExtra: "", cc: "", notifyRoleIds: [] },
  });

  const loadSettings = useCallback(async () => {
    if (!token) return;
    setLoadingSettings(true);
    try {
      const [smtpRes, defaultPassRes, templatesRes, meRes] = await Promise.all([
        axios.get(`${API}/settings/email-smtp`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/settings/default-pass`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/settings/email-templates`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const smtp = unwrapApiData<EmailSmtpResponse>(smtpRes.data);
      if (smtp) {
        setEmailForm({
          smtpHost: smtp.smtpHost ?? "",
          smtpPort: smtp.smtpPort || "587",
          username: smtp.username ?? "",
          password: "",
          secure: smtp.secure ? "true" : "false",
          from: smtp.from ?? "",
          tlsRejectUnauthorized: smtp.tlsRejectUnauthorized !== false,
        });
        setPasswordSet(!!smtp.passwordSet);
      }

      const dp = unwrapApiData<DefaultPassResponse>(defaultPassRes.data);
      setDefaultPassSet(!!dp?.passwordSet);

      const et = unwrapApiData<EmailTemplatesResponse>(templatesRes.data);
      if (et) {
        const joinList = (arr: string[] | undefined) => (arr && arr.length ? arr.join(", ") : "");
        const roleIds = (arr: number[] | undefined) =>
          Array.isArray(arr)
            ? arr.filter((n): n is number => typeof n === "number" && Number.isInteger(n))
            : [];
        setEmailTemplatesForm({
          brandingLogoUrl: et.brandingLogoUrl ?? "",
          publicBaseUrl: et.publicBaseUrl ?? "",
          onReported: {
            enabled: et.onReported.enabled !== false,
            toExtra: joinList(et.onReported.toExtra),
            cc: joinList(et.onReported.cc),
            notifyRoleIds: roleIds(et.onReported.notifyRoleIds),
          },
          onAssigned: {
            enabled: et.onAssigned.enabled !== false,
            toExtra: joinList(et.onAssigned.toExtra),
            cc: joinList(et.onAssigned.cc),
            notifyRoleIds: roleIds(et.onAssigned.notifyRoleIds),
          },
          onClosed: {
            enabled: et.onClosed.enabled !== false,
            toExtra: joinList(et.onClosed.toExtra),
            cc: joinList(et.onClosed.cc),
            notifyRoleIds: roleIds(et.onClosed.notifyRoleIds),
          },
        });
      }

      try {
        const rolesRes = await axios.get(`${API}/roles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const raw = unwrapApiData<unknown>(rolesRes.data);
        const arr = Array.isArray(raw) ? raw : [];
        setRolesList(
          arr
            .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null && "id" in x)
            .map((x) => ({
              id: Number(x.id),
              code: String(x.code ?? ""),
              name: String(x.name ?? ""),
            }))
            .filter((r) => Number.isInteger(r.id) && r.id > 0),
        );
      } catch {
        setRolesList([]);
      }

      const me = unwrapApiData<{ email?: string | null }>(meRes.data);
      const defaultTo = me?.email?.trim();
      if (defaultTo) {
        setTestTo((prev) => (prev.trim() ? prev : defaultTo));
      }
    } catch (err: unknown) {
      toastError("โหลดการตั้งค่าไม่สำเร็จ", apiErrorMessage(err));
    } finally {
      setLoadingSettings(false);
    }
  }, [token]);

  const handleSaveDefaultPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toastError("กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    const pwd = defaultPassForm.password.trim();
    if (!pwd) {
      toastError("กรุณาระบุ Default Pass");
      return;
    }

    setSavingDefaultPass(true);
    try {
      const res = await axios.put(
        `${API}/settings/default-pass`,
        { password: pwd },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const updated = unwrapApiData<DefaultPassResponse>(res.data);
      setDefaultPassSet(!!updated?.passwordSet);
      setDefaultPassForm({ password: "" });
      toastSuccess("บันทึก Default Pass สำเร็จ");
    } catch (err: unknown) {
      toastError("บันทึก Default Pass ไม่สำเร็จ", apiErrorMessage(err));
    } finally {
      setSavingDefaultPass(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === "authenticated" && token) {
      void loadSettings();
    }
    if (sessionStatus === "unauthenticated") {
      setLoadingSettings(false);
    }
  }, [sessionStatus, token, loadSettings]);

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toastError("กรุณาเข้าสู่ระบบใหม่");
      return;
    }
    if (!passwordSet && !emailForm.password.trim()) {
      toastError("กรุณาระบุรหัสผ่าน SMTP สำหรับการบันทึกครั้งแรก");
      return;
    }

    setSavingEmail(true);
    try {
      const body: Record<string, unknown> = {
        smtpHost: emailForm.smtpHost.trim(),
        smtpPort: emailForm.smtpPort.trim(),
        username: emailForm.username.trim(),
        secure: emailForm.secure === "true",
        from: emailForm.from.trim(),
        tlsRejectUnauthorized: emailForm.tlsRejectUnauthorized,
      };
      if (emailForm.password.trim()) {
        body.password = emailForm.password;
      }

      const res = await axios.put(`${API}/settings/email-smtp`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = unwrapApiData<EmailSmtpResponse>(res.data);
      if (updated) {
        setPasswordSet(!!updated.passwordSet);
        setEmailForm((prev) => ({ ...prev, password: "" }));
      }
      toastSuccess("บันทึกการตั้งค่า Email สำเร็จ");
    } catch (err: unknown) {
      toastError("บันทึกไม่สำเร็จ", apiErrorMessage(err));
    } finally {
      setSavingEmail(false);
    }
  };

  const handleTestEmail = async () => {
    if (!token) {
      toastError("กรุณาเข้าสู่ระบบใหม่");
      return;
    }
    const to = testTo.trim();
    if (!to) {
      toastError("กรุณาระบุอีเมลปลายทางสำหรับทดสอบ");
      return;
    }

    setTestingEmail(true);
    try {
      const body: Record<string, unknown> = {
        to,
        smtpHost: emailForm.smtpHost.trim(),
        smtpPort: emailForm.smtpPort.trim(),
        username: emailForm.username.trim(),
        secure: emailForm.secure === "true",
        from: emailForm.from.trim(),
        tlsRejectUnauthorized: emailForm.tlsRejectUnauthorized,
      };
      if (emailForm.password.trim()) {
        body.password = emailForm.password;
      }

      await axios.post(`${API}/settings/email-smtp/test`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toastSuccess("ส่งอีเมลทดสอบสำเร็จ — ตรวจสอบกล่องจดหมาย (รวมถังขยะ)");
    } catch (err: unknown) {
      toastError("ทดสอบส่งอีเมลไม่สำเร็จ", apiErrorMessage(err));
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSaveEmailTemplates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toastError("กรุณาเข้าสู่ระบบใหม่");
      return;
    }
    setSavingTemplates(true);
    try {
      const body = {
        brandingLogoUrl: emailTemplatesForm.brandingLogoUrl.trim(),
        publicBaseUrl: emailTemplatesForm.publicBaseUrl.trim(),
        onReported: {
          enabled: emailTemplatesForm.onReported.enabled,
          toExtra: splitEmails(emailTemplatesForm.onReported.toExtra),
          cc: splitEmails(emailTemplatesForm.onReported.cc),
          notifyRoleIds: [...emailTemplatesForm.onReported.notifyRoleIds],
        },
        onAssigned: {
          enabled: emailTemplatesForm.onAssigned.enabled,
          toExtra: splitEmails(emailTemplatesForm.onAssigned.toExtra),
          cc: splitEmails(emailTemplatesForm.onAssigned.cc),
          notifyRoleIds: [...emailTemplatesForm.onAssigned.notifyRoleIds],
        },
        onClosed: {
          enabled: emailTemplatesForm.onClosed.enabled,
          toExtra: splitEmails(emailTemplatesForm.onClosed.toExtra),
          cc: splitEmails(emailTemplatesForm.onClosed.cc),
          notifyRoleIds: [...emailTemplatesForm.onClosed.notifyRoleIds],
        },
      };
      await axios.put(`${API}/settings/email-templates`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toastSuccess("บันทึกเทมเพลตอีเมลสำเร็จ");
    } catch (err: unknown) {
      toastError("บันทึกเทมเพลตไม่สำเร็จ", apiErrorMessage(err));
    } finally {
      setSavingTemplates(false);
    }
  };

  const disabledForm = loadingSettings || sessionStatus !== "authenticated" || !token;

  return (
    <div className="animate-fade-up w-full min-w-0 space-y-6">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold truncate text-white">
          ตั้งค่าระบบ
        </h1>
        <p className="text-sm mt-0.5 text-slate-400">
          กำหนดค่าอีเมล (SMTP)
        </p>
      </div>

      <div className="rounded-xl border border-white/10 p-4 sm:p-5 w-full bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <Settings size={18} className="text-slate-400 shrink-0" aria-hidden />
          <h2 className="font-bold text-sm text-slate-200">
            จัดการการส่งอีเมล (SMTP)
          </h2>
        </div>

          {loadingSettings ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 className="animate-spin" size={22} aria-hidden />
              <span>กำลังโหลดการตั้งค่า…</span>
            </div>
          ) : (
            <form onSubmit={handleSaveEmail} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-300" htmlFor="smtp-host">
                      SMTP Host
                    </label>
                    <input
                      id="smtp-host"
                      type="text"
                      className="form-input-glass"
                      value={emailForm.smtpHost}
                      onChange={(e) => setEmailForm({ ...emailForm, smtpHost: e.target.value })}
                      placeholder="เช่น smtp.gmail.com"
                      required
                      disabled={disabledForm}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-300" htmlFor="smtp-port">
                      SMTP Port
                    </label>
                    <input
                      id="smtp-port"
                      type="text"
                      className="form-input-glass"
                      value={emailForm.smtpPort}
                      onChange={(e) => setEmailForm({ ...emailForm, smtpPort: e.target.value })}
                      placeholder="เช่น 587"
                      required
                      disabled={disabledForm}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-300" htmlFor="smtp-secure">
                      Secure (SSL/TLS)
                    </label>
                    <select
                      id="smtp-secure"
                      className="select-native-glass w-full"
                      value={emailForm.secure}
                      onChange={(e) => setEmailForm({ ...emailForm, secure: e.target.value })}
                      disabled={disabledForm}
                    >
                      <option value="false">false (STARTTLS / Port 587)</option>
                      <option value="true">true (SSL / Port 465)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-300" htmlFor="smtp-user">
                      User (Username)
                    </label>
                    <input
                      id="smtp-user"
                      type="text"
                      className="form-input-glass"
                      value={emailForm.username}
                      onChange={(e) => setEmailForm({ ...emailForm, username: e.target.value })}
                      required
                      disabled={disabledForm}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-300" htmlFor="smtp-password">
                      Password
                    </label>
                    <input
                      id="smtp-password"
                      type="password"
                      className="form-input-glass"
                      value={emailForm.password}
                      onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                      placeholder={passwordSet ? "เว้นว่างหากไม่ต้องการเปลี่ยน" : "********"}
                      required={!passwordSet}
                      autoComplete="new-password"
                      disabled={disabledForm}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-300" htmlFor="smtp-from">
                      Sender Email (From)
                    </label>
                    <input
                      id="smtp-from"
                      type="email"
                      className="form-input-glass"
                      value={emailForm.from}
                      onChange={(e) => setEmailForm({ ...emailForm, from: e.target.value })}
                      placeholder="noreply@example.com"
                      required
                      disabled={disabledForm}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <label className="flex items-start gap-3 cursor-pointer group min-h-[44px]">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-900/60 text-blue-600 focus:ring-blue-500/50 shrink-0 cursor-pointer"
                    checked={emailForm.tlsRejectUnauthorized}
                    onChange={(e) =>
                      setEmailForm({
                        ...emailForm,
                        tlsRejectUnauthorized: e.target.checked,
                      })
                    }
                    disabled={disabledForm}
                    aria-describedby="smtp-tls-hint"
                  />
                  <span className="text-sm text-slate-300 leading-snug">
                    ตรวจสอบใบรับรอง TLS (ปิดเมื่อ SMTP ใช้ใบ self-signed หรือ CA ภายในองค์กร)
                  </span>
                </label>
                <p id="smtp-tls-hint" className="text-xs text-slate-500 mt-2 pl-7">
                  ปิดตัวเลือกนี้ช่วยแก้ข้อความ «self-signed certificate» — ใช้เฉพาะเครือข่ายที่เชื่อถือได้
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
                <p className="text-sm font-medium text-slate-300">ทดสอบส่งอีเมล</p>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium mb-1.5 text-slate-300" htmlFor="test-to">
                      ส่งทดสอบไปที่
                    </label>
                    <input
                      id="test-to"
                      type="email"
                      className="form-input-glass w-full"
                      value={testTo}
                      onChange={(e) => setTestTo(e.target.value)}
                      placeholder="example@domain.com"
                      disabled={disabledForm || testingEmail}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleTestEmail()}
                    disabled={disabledForm || testingEmail || savingEmail}
                    className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all active:scale-95 shadow-lg shadow-black/20 disabled:opacity-50 disabled:active:scale-100 cursor-pointer shrink-0 min-h-[44px]"
                  >
                    {testingEmail ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} aria-hidden />}
                    ทดสอบส่งอีเมล
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  ใช้ค่าจากฟอร์มด้านบน (รวมรหัสผ่านที่เคยบันทึก หากไม่กรอกใหม่) — บันทึกได้ก่อนหรือหลังทดสอบ
                </p>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end">
                <button
                  type="submit"
                  disabled={savingEmail || disabledForm}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all active:scale-95 shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:active:scale-100 cursor-pointer min-h-[44px]"
                >
                  {savingEmail ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  บันทึกการตั้งค่า Email
                </button>
              </div>
            </form>
          )}
      </div>

      <div className="rounded-xl border border-white/10 p-4 sm:p-5 w-full bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <Mail size={18} className="text-slate-400 shrink-0" aria-hidden />
          <h2 className="font-bold text-sm text-slate-200">เทมเพลตอีเมลแจ้งงาน (HTML)</h2>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed" role="note">
          Flow อัตโนมัติ: <span className="text-slate-300">แจ้งเหตุ</span> (หลังบันทึกคำร้อง) →{" "}
          <span className="text-slate-300">รับเรื่อง / มอบหมาย</span> (เมื่อเปลี่ยนผู้รับงาน) →{" "}
          <span className="text-slate-300">ปิดงาน</span> (เมื่อบันทึกแก้ไขครบหรือสถานะเป็นเสร็จสิ้น)
          ต้องตั้งค่า SMTP ด้านบน และเปิดเทมเพลตที่ต้องการ — ผู้รับหลักตามคำอธิบายในแต่ละกล่อง
        </p>

        {loadingSettings ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="animate-spin" size={22} aria-hidden />
            <span>กำลังโหลดการตั้งค่า…</span>
          </div>
        ) : (
          <form onSubmit={handleSaveEmailTemplates} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-300" htmlFor="brand-logo-url">
                URL โลโก้ (แสดงในอีเมล)
              </label>
              <input
                id="brand-logo-url"
                type="url"
                className="form-input-glass"
                value={emailTemplatesForm.brandingLogoUrl}
                onChange={(e) =>
                  setEmailTemplatesForm({ ...emailTemplatesForm, brandingLogoUrl: e.target.value })
                }
                placeholder="https://example.com/logo.png"
                disabled={disabledForm}
              />
              <p className="text-xs text-slate-500 mt-1.5">
                ใช้ URL รูปแบบ https ที่เข้าถึงได้สาธารณะ หากเว้นว่างจะแสดงหัวข้อข้อความแทนโลโก้
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-300" htmlFor="email-public-base-url">
                Public URL สำหรับลิงก์ในอีเมล
              </label>
              <input
                id="email-public-base-url"
                type="url"
                className="form-input-glass"
                value={emailTemplatesForm.publicBaseUrl}
                onChange={(e) =>
                  setEmailTemplatesForm({
                    ...emailTemplatesForm,
                    publicBaseUrl: e.target.value,
                  })
                }
                placeholder="https://cctv-app.forth.co.th"
                disabled={disabledForm}
              />
              <p className="text-xs text-slate-500 mt-1.5">
                ใช้เป็นลิงก์ &quot;เปิดงานในระบบ&quot; และตรวจสอบสถานะในอีเมลแจ้งงาน — แนะนำใส่ URL Production
                หาก backend รันที่ dev แต่ต้องการให้ผู้รับเมลคลิกเข้าเว็บจริง หากเว้นว่างระบบใช้ค่า{" "}
                <code className="text-slate-400 text-[11px]">FRONTEND_BASE_URL</code> ของเซิร์ฟเวอร์
              </p>
            </div>

            {(
              [
                {
                  key: "onReported" as const,
                  title: "แจ้งเหตุ (บันทึกคำร้องใหม่)",
                  hint: "ผู้รับหลัก: อีเมลผู้แจ้ง (จากแบบฟอร์มหรือบัญชีที่จับคู่เบอร์โทร)",
                },
                {
                  key: "onAssigned" as const,
                  title: "รับเรื่อง / มอบหมายงาน",
                  hint: "ผู้รับหลัก: อีเมลผู้รับงาน (Staff ที่ได้รับมอบหมาย)",
                },
                {
                  key: "onClosed" as const,
                  title: "ปิดงาน (บันทึกการแก้ไขครบ)",
                  hint: "ผู้รับหลัก: อีเมลผู้แจ้ง — CC จากช่องด้านล่างและบทบาทที่เลือกเท่านั้น (ไม่แทรกผู้รับงานอัตโนมัติ)",
                },
              ] as const
            ).map((section) => (
              <div
                key={section.key}
                className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-start gap-3 min-h-[44px]">
                  <input
                    type="checkbox"
                    id={`tpl-${section.key}-en`}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-900/60 text-blue-600 focus:ring-blue-500/50 shrink-0 cursor-pointer"
                    checked={emailTemplatesForm[section.key].enabled}
                    onChange={(e) =>
                      setEmailTemplatesForm({
                        ...emailTemplatesForm,
                        [section.key]: {
                          ...emailTemplatesForm[section.key],
                          enabled: e.target.checked,
                        },
                      })
                    }
                    disabled={disabledForm}
                  />
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`tpl-${section.key}-en`} className="font-medium text-slate-200 cursor-pointer">
                      {section.title}
                    </label>
                    <p className="text-xs text-slate-500 mt-1">{section.hint}</p>
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5 text-slate-300"
                    htmlFor={`tpl-${section.key}-to`}
                  >
                    To เพิ่มเติม (คั่นด้วยจุลภาค)
                  </label>
                  <input
                    id={`tpl-${section.key}-to`}
                    type="text"
                    className="form-input-glass"
                    value={emailTemplatesForm[section.key].toExtra}
                    onChange={(e) =>
                      setEmailTemplatesForm({
                        ...emailTemplatesForm,
                        [section.key]: {
                          ...emailTemplatesForm[section.key],
                          toExtra: e.target.value,
                        },
                      })
                    }
                    placeholder="ops@company.com, manager@company.com"
                    disabled={disabledForm}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5 text-slate-300"
                    htmlFor={`tpl-${section.key}-cc`}
                  >
                    CC
                  </label>
                  <input
                    id={`tpl-${section.key}-cc`}
                    type="text"
                    className="form-input-glass"
                    value={emailTemplatesForm[section.key].cc}
                    onChange={(e) =>
                      setEmailTemplatesForm({
                        ...emailTemplatesForm,
                        [section.key]: {
                          ...emailTemplatesForm[section.key],
                          cc: e.target.value,
                        },
                      })
                    }
                    placeholder="cc@company.com"
                    disabled={disabledForm}
                  />
                  <p className="text-xs text-slate-500 mt-1.5">
                    เว้นว่างได้ — จะไม่มี CC จากช่องนี้ (ยังแจ้งตามบทบาทด้านล่างได้เมื่อเลือก)
                  </p>
                </div>
                {rolesList.length > 0 ? (
                  <div className="rounded-lg border border-white/10 bg-slate-900/30 p-3 space-y-2">
                    <p className="text-xs font-medium text-slate-300">แจ้งเตือนผู้ใช้ในบทบาท (CC)</p>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      เลือกบทบาทที่ต้องการส่งสำเนา — ระบบจะส่งไปยังอีเมลของผู้ใช้ที่ผูกบทบาทนั้น (ไม่รวมผู้ที่ไม่มีอีเมลในระบบ)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {rolesList.map((r) => {
                        const checked = emailTemplatesForm[section.key].notifyRoleIds.includes(r.id);
                        return (
                          <label
                            key={r.id}
                            className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-white/10 bg-slate-950/50 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800/60 min-h-[40px]"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-white/20 bg-slate-900/60 text-blue-600 focus:ring-blue-500/50 shrink-0 cursor-pointer"
                              checked={checked}
                              onChange={(e) => {
                                const cur = emailTemplatesForm[section.key].notifyRoleIds;
                                const next = e.target.checked
                                  ? [...cur, r.id]
                                  : cur.filter((id) => id !== r.id);
                                setEmailTemplatesForm({
                                  ...emailTemplatesForm,
                                  [section.key]: {
                                    ...emailTemplatesForm[section.key],
                                    notifyRoleIds: next,
                                  },
                                });
                              }}
                              disabled={disabledForm}
                            />
                            <span className="truncate max-w-[200px]" title={`${r.name} (${r.code})`}>
                              {r.name}
                              <span className="text-slate-500 font-mono text-[10px] ml-1">({r.code})</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                type="submit"
                disabled={disabledForm || savingTemplates}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all active:scale-95 shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:active:scale-100 cursor-pointer min-h-[44px]"
              >
                {savingTemplates ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                บันทึกเทมเพลตอีเมล
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="rounded-xl border border-white/10 p-4 sm:p-5 w-full bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <Settings size={18} className="text-slate-400 shrink-0" aria-hidden />
          <h2 className="font-bold text-sm text-slate-200">Default Pass สำหรับ Reset Password</h2>
        </div>

        {loadingSettings ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="animate-spin" size={22} aria-hidden />
            <span>กำลังโหลดการตั้งค่า…</span>
          </div>
        ) : (
          <form onSubmit={handleSaveDefaultPass} className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                ใช้สำหรับปุ่ม <span className="text-slate-200 font-medium">Reset Pass</span> ในหน้า <span className="text-slate-200 font-medium">จัดการผู้ใช้</span>
              </p>
              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm">
                  สถานะ:{" "}
                  <span className="text-slate-200 font-medium">
                    {defaultPassSet ? "ตั้งค่าแล้ว" : "ยังไม่ได้ตั้งค่า (ใช้ค่าเริ่มต้น F0rth2026@)"}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-300" htmlFor="default-pass">
                  Default Pass
                </label>
                <div className="relative">
                  <input
                    id="default-pass"
                    type={showDefaultPass ? "text" : "password"}
                    className="form-input-glass pr-12"
                    value={defaultPassForm.password}
                    onChange={(e) => setDefaultPassForm({ password: e.target.value })}
                    placeholder="ระบุ Default Pass ใหม่"
                    required
                    disabled={disabledForm || savingDefaultPass}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDefaultPass((v) => !v)}
                    disabled={disabledForm || savingDefaultPass}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={showDefaultPass ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                    aria-pressed={showDefaultPass}
                  >
                    {showDefaultPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDefaultPassForm({ password: "F0rth2026@" })}
                disabled={disabledForm || savingDefaultPass}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all active:scale-95 shadow-lg shadow-black/20 disabled:opacity-50 disabled:active:scale-100 cursor-pointer min-h-[44px]"
              >
                ใส่ค่าเริ่มต้น
              </button>
              <button
                type="submit"
                disabled={disabledForm || savingDefaultPass || !defaultPassForm.password.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all active:scale-95 shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:active:scale-100 cursor-pointer min-h-[44px]"
              >
                {savingDefaultPass ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                บันทึก Default Pass
              </button>
            </div>
          </form>
        )}
      </div>

      <div
        className="rounded-xl border border-white/10 p-4 sm:p-5 text-sm text-slate-400 flex gap-3 items-start bg-slate-900/50 backdrop-blur-sm"
        role="note"
      >
        <Info size={18} className="text-slate-400 shrink-0 mt-0.5" aria-hidden />
        <p className="leading-relaxed">
          <span className="font-medium text-slate-300">ที่เก็บไฟล์ (MinIO / S3)</span> ตั้งค่าผ่านตัวแปรสภาพแวดล้อม (เช่น{" "}
          <code className="text-slate-300 font-mono text-xs">.env</code>) — ไม่เปิดฟอร์มแก้ไขในหน้านี้
        </p>
      </div>
    </div>
  );
}
