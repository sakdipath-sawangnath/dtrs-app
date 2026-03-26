"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, LoaderCircle } from "lucide-react";
import PublicLayoutShell from "@/components/PublicLayoutShell";
import { getClientApiBaseUrl } from "@/lib/clientApiBase";

function unwrapApiData<T>(root: unknown): T | null {
  if (!root) return null;
  if (typeof root === "object" && root !== null && "data" in (root as Record<string, unknown>)) {
    return ((root as { data?: unknown }).data as T) ?? null;
  }
  return root as T;
}

function getApiErrorMessageFromBody(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as { error?: { message?: string }; message?: string };
  if (typeof r.error?.message === "string") return r.error.message;
  if (typeof r.message === "string") return r.message;
  return undefined;
}

/** Dark Glass — สอดคล้อง AGENTS.md */
const GLASS_CARD =
  "rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl ring-1 ring-white/5";
const INPUT_GLASS =
  "w-full rounded-xl min-h-[44px] border border-white/10 bg-slate-900/40 backdrop-blur-sm px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner outline-none transition-all focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60 disabled:cursor-not-allowed [color-scheme:dark]";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const identifier = email.trim();
    try {
      const apiBase = getClientApiBaseUrl();
      const loginRes = await fetch(`${apiBase}/backend-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, password }),
      });
      const raw: unknown = await loginRes.json().catch(() => null);

      if (loginRes.status === 403) {
        setError(
          getApiErrorMessageFromBody(raw) ||
            "บัญชีถูกระงับการเข้าสู่ระบบ กรุณาติดต่อผู้ดูแลระบบ",
        );
        setLoading(false);
        return;
      }

      const payload = unwrapApiData<{ access_token?: string }>(raw);
      if (!loginRes.ok || !payload?.access_token) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        setLoading(false);
        return;
      }

      const res = await signIn("credentials", {
        email: identifier,
        accessToken: payload.access_token,
        redirect: false,
      });
      if (res?.error) {
        setError("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
        setLoading(false);
        return;
      }
      if (res?.ok) {
        await router.push("/dashboard");
        router.refresh();
        return;
      }
      setError("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
      setLoading(false);
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่");
      setLoading(false);
    }
  };

  return (
    <PublicLayoutShell subtitle="เข้าสู่ระบบ">
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-md animate-fade-up min-w-0">
          <div className={`relative overflow-hidden ${GLASS_CARD}`}>
            <div
              className="h-1 bg-linear-to-r from-blue-600 via-blue-500 to-blue-400 shrink-0"
              aria-hidden
            />

            {/* Overlay โหลด — กันคลิกซ้ำและบอกสถานะชัด */}
            {loading && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-slate-950/55 backdrop-blur-[3px]"
                role="status"
                aria-live="polite"
                aria-label="กำลังเข้าสู่ระบบ"
              >
                <span
                  className="login-loading-spin inline-flex animate-spin text-blue-400"
                  aria-hidden
                >
                  <LoaderCircle
                    className="h-10 w-10 shrink-0 origin-center"
                    strokeWidth={2}
                    aria-hidden
                  />
                </span>
                <p className="text-sm font-medium text-slate-200">
                  กำลังเข้าสู่ระบบ...
                </p>
              </div>
            )}

            <div className="p-6 sm:p-8 sm:py-10">
              <div className="mb-6 text-center">
                <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-blue-400/90 mb-2">
                  STAFF &amp; ADMIN
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
                  ระบบจัดการงานซ่อม
                </h1>
                <p className="text-sm text-slate-400">
                  สำหรับเจ้าหน้าที่และผู้ดูแลระบบ CCTV
                </p>
              </div>

              {error && (
                <div
                  className="mb-6 flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-950/40 px-3 py-2.5 text-sm text-red-200 backdrop-blur-sm"
                  role="alert"
                >
                  <AlertCircle
                    size={18}
                    className="shrink-0 mt-0.5 text-red-400"
                    aria-hidden
                  />
                  <span>{error}</span>
                </div>
              )}

              <form
                onSubmit={handleLogin}
                className="space-y-5"
                aria-busy={loading}
              >
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-sm font-semibold mb-1.5 text-slate-300"
                  >
                    อีเมล หรือ ชื่อผู้ใช้
                  </label>
                  <input
                    id="login-email"
                    required
                    type="text"
                    className={INPUT_GLASS}
                    placeholder="เช่น staff@dopa.go.th หรือชื่อผู้ใช้"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-semibold mb-1.5 text-slate-300"
                  >
                    รหัสผ่าน
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      required
                      type={showPassword ? "text" : "password"}
                      className={`${INPUT_GLASS} pr-12`}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                      aria-label={
                        showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"
                      }
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeOff size={18} aria-hidden />
                      ) : (
                        <Eye size={18} aria-hidden />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 min-h-[44px] rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  {loading ? (
                    <>
                      <span
                        className="login-loading-spin inline-flex shrink-0 animate-spin"
                        aria-hidden
                      >
                        <LoaderCircle
                          className="h-4 w-4 origin-center"
                          strokeWidth={2}
                          aria-hidden
                        />
                      </span>
                      <span>กำลังเข้าสู่ระบบ...</span>
                    </>
                  ) : (
                    "เข้าสู่ระบบ"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PublicLayoutShell>
  );
}
