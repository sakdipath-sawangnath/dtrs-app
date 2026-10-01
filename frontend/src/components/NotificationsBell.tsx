"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Dot, RefreshCw } from "lucide-react";
import axios from "axios";
import { io, Socket } from "socket.io-client";

type NotificationJob = {
  id: number;
  ticketNo: string | null;
  requestTicketNo?: string | null;
  status: string;
  reportDate: string | null;
  province: string | null;
  district: string | null;
  location: string | null;
};

function isNotificationJob(v: unknown): v is NotificationJob {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === "number" && typeof o.status === "string";
}

function getApiPayload<T>(root: unknown): T | null {
  if (!root) return null;
  if (typeof root === "object" && "data" in (root as Record<string, unknown>)) {
    return ((root as { data?: unknown }).data as T) ?? null;
  }
  return root as T;
}

function getSocketBaseUrl(apiBase: string): string {
  return apiBase.replace(/\/api\/?$/, "");
}

export default function NotificationsBell({
  token,
  apiBase,
}: {
  token: string;
  apiBase: string;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const unreadCount = useMemo(
    () => items.filter((j) => (j.status || "").toUpperCase() === "PENDING").length,
    [items],
  );

  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    setErrorText(null);
    try {
      const res = await axios.get(`${apiBase}/jobs/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      const payload = getApiPayload<unknown>(res?.data);
      const arr = Array.isArray(payload) ? payload : [];
      const cleaned = arr.filter(isNotificationJob);
      setItems(cleaned);
    } catch {
      setErrorText("โหลดแจ้งเตือนไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, apiBase]);

  useEffect(() => {
    if (!token) return;

    const base = getSocketBaseUrl(apiBase);
    const s = io(base, {
      transports: ["polling"],
    });
    socketRef.current = s;

    const onNewJob = () => fetchNotifications();
    const onJobUpdated = () => fetchNotifications();
    s.on("new-job", onNewJob);
    s.on("job-updated", onJobUpdated);

    return () => {
      s.off("new-job", onNewJob);
      s.off("job-updated", onJobUpdated);
      s.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, apiBase]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return;
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--glass-input-border)] bg-[var(--glass-input-bg)] glass-nav-item hover:text-[var(--glass-text)] hover:bg-[var(--glass-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        aria-label="แจ้งเตือน"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shadow"
            aria-label={`มีแจ้งเตือน ${unreadCount} รายการ`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-24px)] rounded-2xl glass-card shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-card-border)]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold glass-text">แจ้งเตือน</span>
              <span className="text-xs font-semibold glass-muted-text">
                ({items.length})
              </span>
            </div>
            <button
              type="button"
              onClick={fetchNotifications}
              className="inline-flex items-center gap-1.5 text-xs font-semibold glass-muted-text hover:text-[var(--glass-text)] cursor-pointer px-2 py-1 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
              aria-label="รีเฟรชแจ้งเตือน"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              รีเฟรช
            </button>
          </div>

          {errorText && (
            <div className="px-4 py-3 text-sm text-red-500 bg-red-500/10 border-b border-red-500/20">
              {errorText}
            </div>
          )}

          <div className="max-h-[360px] overflow-auto">
            {items.length === 0 && !loading ? (
              <div className="px-4 py-10 text-center">
                <div className="text-sm font-semibold glass-text">
                  ยังไม่มีแจ้งเตือน
                </div>
                <div className="text-xs glass-subtle-text mt-1">
                  เมื่อมีการแจ้งปัญหาใหม่ จะปรากฏที่นี่
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--glass-card-border)]">
                {items.map((j) => {
                  const displayNo = j.ticketNo || j.requestTicketNo;
                  const title = displayNo ? `Ticket ${displayNo}` : `Job #${j.id}`;
                  const place = [j.province, j.district, j.location].filter(Boolean).join(" · ");
                  const pending = (j.status || "").toUpperCase() === "PENDING";
                  return (
                    <li key={j.id}>
                      <Link
                        href={`/dashboard/jobs/${j.id}`}
                        onClick={() => setOpen(false)}
                        className="flex gap-3 px-4 py-3 hover:bg-[var(--glass-hover)] transition-colors cursor-pointer focus:outline-none focus:bg-[var(--glass-hover)]"
                      >
                        <div className="pt-1">
                          {pending ? (
                            <Dot className="text-blue-400" size={22} aria-hidden="true" />
                          ) : (
                            <Dot className="glass-subtle-text" size={22} aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-bold glass-text truncate">
                              {title}
                            </div>
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                pending
                                  ? "bg-blue-500/15 text-blue-500 dark:text-blue-400"
                                  : "bg-[var(--glass-hover)] glass-muted-text"
                              }`}
                            >
                              {pending ? "ใหม่" : j.status}
                            </span>
                          </div>
                          <div className="text-xs glass-muted-text mt-1 line-clamp-2">
                            {place || "—"}
                          </div>
                          {j.reportDate && (
                            <div className="text-[11px] glass-subtle-text mt-1">
                              {new Date(j.reportDate).toLocaleString("th-TH")}
                            </div>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
