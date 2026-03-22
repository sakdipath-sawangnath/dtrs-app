"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Loader2, Save, Info, Send, Settings } from "lucide-react";
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

  const loadSettings = useCallback(async () => {
    if (!token) return;
    setLoadingSettings(true);
    try {
      const [smtpRes, meRes] = await Promise.all([
        axios.get(`${API}/settings/email-smtp`, {
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
