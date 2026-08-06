"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { unwrapApiData } from "@/lib/apiResponse";
import { getClientApiBaseUrl } from "@/lib/clientApiBase";
import { formatAppVersionBadge, resolveFooterAppMeta, type AppMeta } from "@/lib/appMeta";

type SiteFooterProps = {
  /** คงไว้เพื่อ API เดิม — สไตล์ใช้ CSS tokens ไม่พึ่ง isDark (กัน hydration mismatch) */
  isDark?: boolean;
};

const API = getClientApiBaseUrl();

export default function SiteFooter(_props: SiteFooterProps) {
  const currentYear = new Date().getFullYear();
  const [dbMeta, setDbMeta] = useState<Partial<AppMeta> | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/public/settings/app-meta`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((raw) => {
        const payload = unwrapApiData<Partial<AppMeta>>(raw);
        if (payload && typeof payload === "object") {
          setDbMeta(payload);
        }
      })
      .catch(() => {
        // ใช้ fallback จาก env/package.json ต่อทันทีเมื่อเรียก public endpoint ไม่สำเร็จ
      });

    return () => controller.abort();
  }, []);

  const meta = useMemo(() => resolveFooterAppMeta(dbMeta), [dbMeta]);
  const versionBadge = formatAppVersionBadge(meta.version);

  return (
    <footer className="mt-auto relative z-10 border-t glass-header-surface border-[var(--glass-header-border)]">
      <div className="w-full px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] sm:text-sm">
        <div className="flex items-center gap-2 font-medium glass-muted-text">
          <ShieldCheck size={16} className="text-glass-accent shrink-0" />
          <span className="wrap-break-word">
            © {currentYear} {meta.appName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-medium glass-subtle-text">{meta.companyName}</span>
          <div className="flex items-center pl-3 border-l border-[var(--glass-card-border)]">
            <span className="px-2 py-0.5 rounded-md text-xs font-bold tracking-wide border bg-[var(--glass-accent-soft)] text-glass-accent border-[var(--glass-input-focus-border)]/30">
              {versionBadge}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
