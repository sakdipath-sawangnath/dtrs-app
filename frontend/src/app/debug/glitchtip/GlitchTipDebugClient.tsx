"use client";

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { Bug, Server } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function GlitchTipDebugClient() {
  const [serverPending, setServerPending] = useState(false);
  const [serverResult, setServerResult] = useState("");

  function throwClientError(): void {
    const err = new Error(`GlitchTip frontend test ${Date.now()}`);
    Sentry.captureException(err);
    throw err;
  }

  async function throwServerError(): Promise<void> {
    setServerPending(true);
    setServerResult("");
    try {
      const res = await fetch("/debug/glitchtip/server", { method: "GET" });
      const body = await res.text();
      setServerResult(
        `HTTP ${res.status}${body ? ` — ${body.slice(0, 200)}` : ""} — ตรวจ Issues ฝั่ง server ใน GlitchTip`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "request failed";
      setServerResult(`เรียก server ไม่สำเร็จ: ${message}`);
    } finally {
      setServerPending(false);
    }
  }

  return (
    <div className="w-full max-w-lg flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          ทดสอบ GlitchTip
        </h1>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          โยน error แล้วเปิด Issues ใน GlitchTip โปรเจกต์ที่ตรงกับ DSN ของ env นี้
          environment ควรเป็น{" "}
          <code className="font-mono text-xs">development</code> หรือ{" "}
          <code className="font-mono text-xs">staging</code>
        </p>
      </div>

      <Alert className="bg-background/80">
        <AlertTitle>ต้องล็อกอิน และไม่มีบน production</AlertTitle>
        <AlertDescription>
          ใช้ชั่วคราวสำหรับตรวจ ingest ผ่าน{" "}
          <code className="font-mono">/monitoring</code>
          — เฉพาะผู้ที่เข้าแดชบอร์ดได้ และปิดเมื่อ{" "}
          <code className="font-mono">NEXT_PUBLIC_APP_ENV=production</code>
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          size="lg"
          variant="destructive"
          className="min-h-11 cursor-pointer rounded-xl shadow-lg transition-all active:scale-95"
          onClick={throwClientError}
        >
          <Bug data-icon="inline-start" />
          โยน error ฝั่งเบราว์เซอร์
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="min-h-11 cursor-pointer rounded-xl shadow-lg transition-all active:scale-95"
          disabled={serverPending}
          onClick={() => {
            void throwServerError();
          }}
        >
          <Server data-icon="inline-start" />
          {serverPending ? "กำลังเรียก server..." : "โยน error ฝั่ง server"}
        </Button>
      </div>

      {serverResult ? (
        <p className="text-sm text-slate-800 dark:text-slate-200" role="status">
          {serverResult}
        </p>
      ) : null}
    </div>
  );
}
