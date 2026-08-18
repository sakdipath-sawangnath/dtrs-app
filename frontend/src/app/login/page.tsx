"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, LoaderCircle } from "lucide-react";
import PublicLayoutShell from "@/components/PublicLayoutShell";
import { getClientApiBaseUrl } from "@/lib/clientApiBase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
          <div className="glass-card relative overflow-hidden ring-1 ring-[var(--glass-card-border)]">
            <div
              className="h-1 bg-linear-to-r from-blue-600 via-blue-500 to-blue-400 shrink-0"
              aria-hidden
            />

            {/* Overlay โหลด — กันคลิกซ้ำและบอกสถานะชัด */}
            {loading && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[var(--glass-page-bg)]/55 backdrop-blur-[3px]"
                role="status"
                aria-live="polite"
                aria-label="กำลังเข้าสู่ระบบ"
              >
                <span
                  className="login-loading-spin inline-flex animate-spin text-blue-600 dark:text-blue-400"
                  aria-hidden
                >
                  <LoaderCircle
                    className="h-10 w-10 shrink-0 origin-center"
                    strokeWidth={2}
                    aria-hidden
                  />
                </span>
                <p className="text-sm font-medium glass-text">
                  กำลังเข้าสู่ระบบ...
                </p>
              </div>
            )}

            <div className="p-6 sm:p-8 sm:py-10">
              <div className="mb-6 text-center">
                <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-blue-700/90 mb-2 dark:text-blue-400/90">
                  STAFF &amp; ADMIN
                </p>
                <h1 className="text-2xl font-semibold tracking-tight glass-text mb-1">
                  ระบบจัดการงานซ่อม
                </h1>
                <p className="text-sm glass-muted-text">
                  สำหรับเจ้าหน้าที่และผู้ดูแลระบบ
                </p>
              </div>

              {error ? (
                <Alert
                  variant="destructive"
                  className="mb-6 rounded-xl border-red-300 bg-red-50 text-red-800 backdrop-blur-sm dark:border-red-500/25 dark:bg-red-950/40 dark:text-red-200"
                >
                  <AlertCircle
                    size={18}
                    className="shrink-0 text-red-600 dark:text-red-400"
                    aria-hidden
                  />
                  <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
                </Alert>
              ) : null}

              <form
                onSubmit={handleLogin}
                className="space-y-5"
                aria-busy={loading}
              >
                <div>
                  <Label
                    htmlFor="login-email"
                    className="glass-label font-semibold"
                  >
                    อีเมล หรือ ชื่อผู้ใช้
                  </Label>
                  <Input
                    id="login-email"
                    required
                    type="text"
                    className="form-input-glass h-auto min-h-11 text-sm"
                    placeholder="เช่น staff@dopa.go.th หรือชื่อผู้ใช้"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="login-password"
                    className="glass-label font-semibold"
                  >
                    รหัสผ่าน
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      required
                      type={showPassword ? "text" : "password"}
                      className="form-input-glass h-auto min-h-11 pr-12 text-sm"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute right-1 top-1/2 size-11 -translate-y-1/2 cursor-pointer glass-muted-text hover:bg-[var(--glass-hover)] hover:text-[var(--glass-text)]"
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
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex h-auto min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
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
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PublicLayoutShell>
  );
}
