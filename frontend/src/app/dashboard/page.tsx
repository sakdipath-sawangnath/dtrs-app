"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  format,
  subDays,
  startOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
} from "date-fns";
import { th } from "date-fns/locale";
import {
  AlertCircle,
  Wrench,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  BarChart3,
  PieChart as PieChartIcon,
  ClipboardList,
  Users,
  Shield,
  Settings,
  FileEdit,
  Search,
  User,
  UserX,
  FileWarning,
  Timer,
  FileDown,
  Building2,
  Cpu,
  X,
  ChevronDown,
  Ban,
  BookOpen,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { toastError, toastWarning } from "@/lib/toast";
import DashboardRouteLoading from "@/components/DashboardRouteLoading";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { countJobBreakdowns } from "@/lib/jobBreakdownCounts";
import { useAppTheme } from "@/lib/useAppTheme";

interface Job {
  id: number;
  status: string;
  reportDate?: string;
  createdAt: string;
  fixDate?: string | null;
  province?: string | null;
  district?: string | null;
  isOutOfContract?: boolean;
  assignedTo?: { id: number; name: string } | null;
  fixEnvironment?: string | null;
  brokenPart?: string | null;
}

interface Stats {
  pending: number;
  in_progress: number;
  resolved: number;
  cancelled: number;
  total: number;
}

function unwrapApiData<T>(root: unknown): T | null {
  if (!root) return null;
  if (typeof root === "object" && root !== null && "data" in (root as Record<string, unknown>)) {
    return ((root as { data?: unknown }).data as T) ?? null;
  }
  return root as T;
}

const STATUS_COLORS = {
  PENDING: "#e65100",
  IN_PROGRESS: "#1565c0",
  RESOLVED: "#2e7d32",
  CANCELLED: "#64748b",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  IN_PROGRESS: "กำลังแก้ไข",
  RESOLVED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

const TH_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
] as const;

/** ความสูงเดียวกับปุ่ม (44px) — !padding ทับ .form-input-glass ที่ใช้ shorthand padding */
const FILTER_SELECT_CLASS =
  "form-input-glass h-11 min-h-11 box-border w-full max-w-full appearance-none !pl-4 !pr-10 !py-1.5 text-sm leading-5 cursor-pointer";
const FILTER_INPUT_CLASS =
  "form-input-glass h-11 min-h-11 box-border w-full max-w-full !px-3 !py-1.5 text-sm leading-5 shadow-inner";
const FILTER_DATE_INPUT_CLASS =
  `${FILTER_INPUT_CLASS} !pr-9 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-90 hover:[&::-webkit-calendar-picker-indicator]:opacity-100`;

type DashboardFilterMode = "all" | "year" | "month" | "last7" | "last30" | "custom";

type ReportApiQuery =
  | { periodType: "year"; year: string }
  | { periodType: "month"; month: string }
  | { periodType: "range"; start: string; end: string };

function jobReportTimeMs(j: Job): number {
  return new Date(j.reportDate || j.createdAt).getTime();
}

function toDateTimeLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** เมนูด่วน — อ้างอิงสิทธิ์ RBAC (permission) หรือ role */
const QUICK_LINKS = [
  { label: "ข้อขัดข้องทั้งหมด", href: "/dashboard/all", desc: "ประวัติการแจ้งข้อขัดข้องและ filter", permission: "menu.all", roles: ["ADMIN", "STAFF"], icon: ClipboardList },
  { label: "จัดการผู้ใช้", href: "/dashboard/users", desc: "รายชื่อผู้ใช้และบทบาท", permission: "menu.users", roles: ["ADMIN"], icon: Users },
  { label: "จัดการบทบาทและสิทธิ์", href: "/dashboard/roles", desc: "กำหนดสิทธิ์เมนูให้แต่ละบทบาท", permission: "menu.roles", roles: ["ADMIN"], icon: Shield },
  { label: "คู่มือระบบ", href: "/dashboard/user-guide", desc: "Workflow และความหมายสิทธิ์สำหรับแอดมิน", permission: "menu.userGuide", roles: ["ADMIN"], icon: BookOpen },
  { label: "ตั้งค่าระบบ", href: "/dashboard/settings", desc: "กำหนดค่า MinIO และ Email", permission: "menu.settings", roles: ["ADMIN"], icon: Settings },
  { label: "แจ้งปัญหา", href: "/public/report", desc: "แบบฟอร์มแจ้งซ่อม", permission: "menu.report", roles: ["USER", "ADMIN", "STAFF"], icon: FileEdit },
  { label: "ตรวจสอบสถานะ", href: "/public/status", desc: "ตรวจสอบสถานะใบแจ้งซ่อม", permission: "menu.status", roles: ["USER", "ADMIN", "STAFF"], icon: Search },
  { label: "โปรไฟล์", href: "/dashboard/profile", desc: "ข้อมูลส่วนตัวและเปลี่ยนรหัสผ่าน", permission: "menu.profile", roles: ["USER", "ADMIN", "STAFF"], icon: User },
];

const METRICS_SKELETON_BLOCK = "rounded-xl bg-slate-200/80 dark:bg-white/10";

/** placeholder จน `/roles/me/permissions` โหลด — กัน KPI fail-open/fail-closed ชั่วคราว */
function DashboardOverviewMetricsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="กำลังโหลดสรุปภาพรวม">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card p-4 sm:p-5 flex items-center gap-3 min-h-[88px]">
            <Skeleton className={`h-11 w-11 shrink-0 ${METRICS_SKELETON_BLOCK}`} />
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className={`h-7 w-12 ${METRICS_SKELETON_BLOCK}`} />
              <Skeleton className={`h-3 w-20 ${METRICS_SKELETON_BLOCK}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className={`h-40 w-full ${METRICS_SKELETON_BLOCK}`} />
        <Skeleton className={`h-40 w-full ${METRICS_SKELETON_BLOCK}`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Skeleton className={`h-[280px] w-full ${METRICS_SKELETON_BLOCK}`} />
        <Skeleton className={`h-[280px] w-full ${METRICS_SKELETON_BLOCK}`} />
      </div>
      <Skeleton className={`h-[320px] w-full ${METRICS_SKELETON_BLOCK}`} />
      <div className="space-y-3">
        <Skeleton className={`h-4 w-52 ${METRICS_SKELETON_BLOCK}`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Skeleton className={`h-28 w-full ${METRICS_SKELETON_BLOCK}`} />
          <Skeleton className={`h-28 w-full ${METRICS_SKELETON_BLOCK}`} />
          <Skeleton className={`h-28 w-full ${METRICS_SKELETON_BLOCK}`} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { isDark, mounted } = useAppTheme();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [filterMode, setFilterMode] = useState<DashboardFilterMode>("all");
  const [reportMonth, setReportMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [reportYear, setReportYear] = useState(() => format(new Date(), "yyyy"));
  const [rangeStart, setRangeStart] = useState(() => toDateTimeLocalInputValue(subDays(new Date(), 30)));
  const [rangeEnd, setRangeEnd] = useState(() => toDateTimeLocalInputValue(new Date()));
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportPrintBusy, setReportPrintBusy] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4100/api";
  const token = (session as { accessToken?: string })?.accessToken;
  const userRole = (session?.user as { role?: string })?.role ?? "USER";

  /** UI (การ์ดนอกสัญญา) — ซ่อนจนโหลด permissions เสร็จ สอดคล้อง JobsList */
  const canViewContractTabs = useMemo(() => {
    if (!permissionsLoaded) return false;
    return permissions?.includes("job.viewContractTabs") ?? false;
  }, [permissions, permissionsLoaded]);

  /** KPI/กราฟ — ใช้หลัง `permissionsLoaded` เท่านั้น (ระหว่างโหลดแสดง skeleton) */
  const scopedJobs = useMemo(() => {
    if (!permissionsLoaded) return [];
    if (permissions?.includes("job.viewContractTabs")) return jobs;
    return jobs.filter((j) => j.isOutOfContract !== true);
  }, [jobs, permissions, permissionsLoaded]);

  const monthYear = useMemo(() => {
    const m = String(reportMonth || "");
    const match = m.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1 };
    }
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1 };
    }
    return { year, month };
  }, [reportMonth]);

  const activeRange = useMemo((): null | { start: Date; end: Date; labelTh: string; api: ReportApiQuery } => {
    const now = new Date();
    if (filterMode === "all") {
      const sortedTimes = scopedJobs
        .map((j) => jobReportTimeMs(j))
        .filter((t) => Number.isFinite(t))
        .sort((a, b) => a - b);
      const firstTime = sortedTimes.length > 0 ? sortedTimes[0] : now.getTime();
      const lastTime = sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] : now.getTime();
      const start = startOfDay(new Date(firstTime));
      const end = new Date(Math.max(now.getTime(), lastTime));
      return {
        start,
        end,
        labelTh: "ทั้งหมด (ถึงปัจจุบัน)",
        api: { periodType: "range", start: start.toISOString(), end: end.toISOString() },
      };
    }
    if (filterMode === "year") {
      const y = parseInt(reportYear, 10);
      if (!Number.isFinite(y) || y < 1990 || y > 2100) return null;
      const d = new Date(y, 0, 15);
      return {
        start: startOfYear(d),
        end: endOfYear(d),
        labelTh: `ปี ${y}`,
        api: { periodType: "year", year: String(y) },
      };
    }
    if (filterMode === "month") {
      const d = parseISO(`${reportMonth}-01T12:00:00`);
      if (Number.isNaN(d.getTime())) return null;
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      return {
        start,
        end,
        labelTh: `เดือน ${format(start, "MMMM yyyy", { locale: th })}`,
        api: { periodType: "month", month: reportMonth },
      };
    }
    if (filterMode === "last7" || filterMode === "last30") {
      const days = filterMode === "last7" ? 7 : 30;
      const end = now;
      const start = subDays(now, days);
      return {
        start,
        end,
        labelTh: `${days} วันล่าสุด`,
        api: { periodType: "range", start: start.toISOString(), end: end.toISOString() },
      };
    }
    const s = new Date(rangeStart);
    const e = new Date(rangeEnd);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) return null;
    return {
      start: s,
      end: e,
      labelTh: `${format(s, "dd/MM/yyyy HH:mm", { locale: th })} – ${format(e, "dd/MM/yyyy HH:mm", { locale: th })}`,
      api: { periodType: "range", start: s.toISOString(), end: e.toISOString() },
    };
  }, [filterMode, reportYear, reportMonth, rangeStart, rangeEnd, scopedJobs]);

  const filteredJobs = useMemo(() => {
    if (!activeRange) return [];
    const a = activeRange.start.getTime();
    const b = activeRange.end.getTime();
    return scopedJobs.filter((j) => {
      const t = jobReportTimeMs(j);
      return t >= a && t <= b;
    });
  }, [scopedJobs, activeRange]);

  useEffect(() => {
    if (!token || !session?.user) {
      setPermissions(null);
      setPermissionsLoaded(false);
      return;
    }
    setPermissionsLoaded(false);
    axios
      .get<{ permissions: string[] }>(`${API}/roles/me/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        const payload = unwrapApiData<unknown>(r?.data) as { permissions?: string[] } | null;
        setPermissions(payload?.permissions ?? null);
      })
      .catch(() => setPermissions(null))
      .finally(() => setPermissionsLoaded(true));
  }, [token, session?.user, API]);

  useEffect(() => {
    if (!session?.user) return;
    axios
      .get<Job[]>(`${API}/jobs/list`, {
        headers: { Authorization: `Bearer ${(session as { accessToken?: string })?.accessToken}` },
      })
      .then((res) => {
        const payload = unwrapApiData<unknown>(res?.data);
        setJobs(Array.isArray(payload) ? (payload as Job[]) : []);
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [session, API]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const stats: Stats = useMemo(() => ({
    pending: filteredJobs.filter((j) => j.status === "PENDING").length,
    in_progress: filteredJobs.filter((j) => j.status === "IN_PROGRESS").length,
    resolved: filteredJobs.filter((j) => j.status === "RESOLVED").length,
    cancelled: filteredJobs.filter((j) => j.status === "CANCELLED").length,
    total: filteredJobs.length,
  }), [filteredJobs]);

  const jobBreakdown = useMemo(
    () => countJobBreakdowns(filteredJobs),
    [filteredJobs],
  );

  const pieData = useMemo(() => [
    { name: STATUS_LABELS.PENDING, value: stats.pending, color: STATUS_COLORS.PENDING },
    { name: STATUS_LABELS.IN_PROGRESS, value: stats.in_progress, color: STATUS_COLORS.IN_PROGRESS },
    { name: STATUS_LABELS.RESOLVED, value: stats.resolved, color: STATUS_COLORS.RESOLVED },
    { name: STATUS_LABELS.CANCELLED, value: stats.cancelled, color: STATUS_COLORS.CANCELLED },
  ].filter((d) => d.value > 0), [stats]);

  const provinceData = useMemo(() => {
    const count: Record<string, number> = {};
    filteredJobs.forEach((j) => {
      const p = j.province?.trim() || "ไม่ระบุ";
      count[p] = (count[p] || 0) + 1;
    });
    return Object.entries(count)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredJobs]);

  const trendMeta = useMemo(() => {
    if (!activeRange) {
      return {
        label: "แนวโน้ม",
        data: [] as Array<{ date: string; แจ้งในช่วง: number; ปิดในช่วง: number }>,
      };
    }
    const ms = activeRange.end.getTime() - activeRange.start.getTime();
    const days = Math.max(1, Math.ceil(ms / 86_400_000));
    const isDaily = days <= 45;
    const data: Array<{ date: string; แจ้งในช่วง: number; ปิดในช่วง: number }> = [];

    if (isDaily) {
      for (let i = 0; i < days; i++) {
        const d = startOfDay(subDays(activeRange.end, days - 1 - i));
        const dateStr = format(d, "dd/MM", { locale: th });
        const dayStart = d.getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        const reportedThatDay = filteredJobs.filter((j) => {
          const t = new Date(j.reportDate || j.createdAt).getTime();
          return t >= dayStart && t < dayEnd;
        }).length;
        const resolvedThatDay = filteredJobs.filter((j) => {
          const fd = j.fixDate ? new Date(j.fixDate).getTime() : null;
          return fd != null && fd >= dayStart && fd < dayEnd;
        }).length;
        data.push({ date: dateStr, แจ้งในช่วง: reportedThatDay, ปิดในช่วง: resolvedThatDay });
      }
      return { label: "แนวโน้มรายวัน", data };
    }

    const start = new Date(activeRange.start);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    let cursor = start;
    let safety = 0;
    while (cursor.getTime() <= activeRange.end.getTime() && safety < 24) {
      const monthStart = new Date(cursor);
      const monthEnd = endOfMonth(monthStart);
      const a = monthStart.getTime();
      const b = Math.min(monthEnd.getTime(), activeRange.end.getTime());
      const reported = filteredJobs.filter((j) => {
        const t = new Date(j.reportDate || j.createdAt).getTime();
        return t >= a && t <= b;
      }).length;
      const resolved = filteredJobs.filter((j) => {
        const fd = j.fixDate ? new Date(j.fixDate).getTime() : null;
        return fd != null && fd >= a && fd <= b;
      }).length;
      data.push({
        date: format(monthStart, "MMM yy", { locale: th }),
        แจ้งในช่วง: reported,
        ปิดในช่วง: resolved,
      });
      cursor = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
      safety++;
    }
    return { label: "แนวโน้มรายเดือน", data };
  }, [activeRange, filteredJobs]);

  /** สรุปตัวเลขจากชุดข้อมูลในกราฟ */
  const trendSummary = useMemo(() => {
    const reported = trendMeta.data.reduce((a, d) => a + d.แจ้งในช่วง, 0);
    const resolved = trendMeta.data.reduce((a, d) => a + d.ปิดในช่วง, 0);
    const net = reported - resolved;
    const peakReported = trendMeta.data.reduce(
      (best, d) => (d.แจ้งในช่วง > best.v ? { date: d.date, v: d.แจ้งในช่วง } : best),
      { date: "–", v: 0 },
    );
    const peakResolved = trendMeta.data.reduce(
      (best, d) => (d.ปิดในช่วง > best.v ? { date: d.date, v: d.ปิดในช่วง } : best),
      { date: "–", v: 0 },
    );
    return {
      reported,
      resolved,
      net,
      avgReported: trendMeta.data.length ? reported / trendMeta.data.length : 0,
      avgResolved: trendMeta.data.length ? resolved / trendMeta.data.length : 0,
      peakReported,
      peakResolved,
    };
  }, [trendMeta]);

  /** งาน PENDING ที่ยังไม่มีผู้รับผิดชอบ */
  const pendingUnassigned = useMemo(
    () => filteredJobs.filter((j) => j.status === "PENDING" && !j.assignedTo).length,
    [filteredJobs],
  );

  /** งานนอกสัญญาที่ยังไม่ปิด */
  const openOutOfContract = useMemo(
    () =>
      filteredJobs.filter(
        (j) => j.isOutOfContract === true && (j.status === "PENDING" || j.status === "IN_PROGRESS"),
      ).length,
    [filteredJobs],
  );

  /** เวลาแก้เฉลี่ย (วัน) สำหรับงานที่ปิดแล้วและมี fixDate */
  const avgResolutionDays = useMemo(() => {
    const resolved = filteredJobs.filter(
      (j) => j.status === "RESOLVED" && j.fixDate && (j.reportDate || j.createdAt),
    );
    if (resolved.length === 0) return null;
    let sum = 0;
    for (const j of resolved) {
      const start = new Date(j.reportDate || j.createdAt).getTime();
      const end = new Date(j.fixDate!).getTime();
      sum += Math.max(0, (end - start) / 86_400_000);
    }
    return sum / resolved.length;
  }, [filteredJobs]);

  /** Top อำเภอ (จากข้อมูลงานทั้งหมด) */
  const districtTop5 = useMemo(() => {
    const count: Record<string, number> = {};
    filteredJobs.forEach((j) => {
      const prov = j.province?.trim() || "ไม่ระบุ";
      const dist = j.district?.trim() || "ไม่ระบุ";
      const key = `${prov} · ${dist}`;
      count[key] = (count[key] || 0) + 1;
    });
    return Object.entries(count)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredJobs]);

  const reportStats = stats;

  const chartColors = useMemo(
    () =>
      mounted && !isDark
        ? {
            grid: "#e2e8f0",
            axis: "#cbd5e1",
            tick: "#475569",
            tooltipBg: "#ffffff",
            tooltipBorder: "#e2e8f0",
            tooltipText: "#0f172a",
          }
        : {
            grid: "#334155",
            axis: "#334155",
            tick: "#94a3b8",
            tooltipBg: "#1e293b",
            tooltipBorder: "rgba(255,255,255,0.1)",
            tooltipText: "#e2e8f0",
          },
    [isDark, mounted],
  );

  const cards = [
    { label: "ทั้งหมด", value: stats.total, icon: TrendingUp, color: "#94a3b8", bg: "rgba(71,85,105,0.15)", border: "rgba(255,255,255,0.1)", href: "/dashboard/all" },
    { label: "รอดำเนินการ", value: stats.pending, icon: AlertCircle, color: "#fb923c", bg: "rgba(230,81,0,0.12)", border: "rgba(251,146,60,0.25)", href: "/dashboard/pending" },
    { label: "กำลังแก้ไข", value: stats.in_progress, icon: Wrench, color: "#60a5fa", bg: "rgba(21,101,192,0.12)", border: "rgba(96,165,250,0.25)", href: "/dashboard/in-progress" },
    { label: "เสร็จสิ้น", value: stats.resolved, icon: CheckCircle2, color: "#4ade80", bg: "rgba(46,125,50,0.12)", border: "rgba(74,222,128,0.25)", href: "/dashboard/all" },
    { label: "ยกเลิก", value: stats.cancelled, icon: Ban, color: "#94a3b8", bg: "rgba(100,116,139,0.15)", border: "rgba(148,163,184,0.25)", href: "/dashboard/all" },
  ];

  const runExportReportPdf = () => {
    if (!activeRange) {
      toastWarning("ช่วงวันที่ไม่ถูกต้อง", "กรุณาตรวจสอบวันที่หรือช่วงเวลาที่เลือก");
      return;
    }
    if (!token) {
      toastError("ไม่พบสิทธิ์เข้าใช้งาน", "กรุณาเข้าสู่ระบบใหม่ก่อนส่งออกรายงาน");
      return;
    }
    setReportPrintBusy(true);
    const params = new URLSearchParams();
    params.set("periodType", activeRange.api.periodType);
    if (activeRange.api.periodType === "month") {
      params.set("month", activeRange.api.month);
    } else if (activeRange.api.periodType === "year") {
      params.set("year", activeRange.api.year);
    } else {
      params.set("start", activeRange.api.start);
      params.set("end", activeRange.api.end);
    }

    axios.get(`${API}/jobs/reports/summary-pdf?${params.toString()}`, {
      responseType: "blob",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        const blob = new Blob([res.data], { type: "application/pdf" });
        const disposition = res.headers["content-disposition"] as string | undefined;
        const fallbackName = `dashboard-summary-${format(new Date(), "yyyyMMdd-HHmmss")}.pdf`;
        const filenameMatch = disposition?.match(/filename="?([^"]+)"?/i);
        const filename = filenameMatch?.[1] || fallbackName;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch((err: unknown) => {
        const message = axios.isAxiosError(err)
          ? (typeof err.response?.data === "string"
            ? err.response.data
            : (err.response?.data as { message?: string })?.message) || "ไม่สามารถส่งออก PDF ได้ในขณะนี้"
          : "ไม่สามารถส่งออก PDF ได้ในขณะนี้";
        toastError("ส่งออก PDF ไม่สำเร็จ", message);
      })
      .finally(() => setReportPrintBusy(false));
  };

  const handleViewReport = () => {
    if (!activeRange) {
      toastWarning("ช่วงวันที่ไม่ถูกต้อง", "กรุณาตรวจสอบวันที่หรือช่วงเวลาที่เลือก");
      return;
    }
    setReportDialogOpen(true);
  };

  if (loading) {
    return <DashboardRouteLoading variant="page" />;
  }

  return (
    <div className="animate-fade-up w-full min-w-0 max-w-[1600px] mx-auto space-y-6">
      {/* หัวข้อ + สรุปรายงาน — หลีกเลี่ยง w-full บนแถบขวาในโหมดแถว (กัน flex บีบคอลัมน์ซ้ายจนแคบเกินไป) */}
      <div className="flex flex-col gap-4 min-w-0 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
        <div className="min-w-0 w-full xl:flex-1 xl:min-w-[min(100%,18rem)] xl:max-w-2xl">
          <h1 className="text-lg sm:text-xl font-bold glass-text wrap-break-word">
            สวัสดี, {session?.user?.name || "เจ้าหน้าที่"}
          </h1>
          <p className="text-sm mt-0.5 glass-muted-text wrap-break-word leading-relaxed">
            ภาพรวมงานแจ้งซ่อม · สรุปผลและแนวโน้ม
          </p>
        </div>
        <div
          className="w-full shrink-0 glass-card px-4 py-4 sm:px-5 sm:py-4 xl:w-auto xl:max-w-none"
          role="region"
          aria-label="สรุปรายงานและส่งออก PDF"
        >
          <div className="min-w-max overflow-x-auto flex flex-wrap items-end gap-3 sm:gap-4 xl:flex-nowrap xl:justify-end">
            <Label className="relative flex w-[176px] shrink-0 flex-col gap-1">
              <span className="text-[11px] font-medium glass-subtle-text">ช่วงสรุป</span>
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as DashboardFilterMode)}
                className={FILTER_SELECT_CLASS}
                aria-label="เลือกช่วงสรุปรายงาน"
              >
                <option value="all">ทั้งหมด (ค่าเริ่มต้น)</option>
                <option value="year">รายปี</option>
                <option value="month">รายเดือน</option>
                <option value="last30">30 วันล่าสุด</option>
                <option value="last7">7 วันล่าสุด</option>
                <option value="custom">กำหนดช่วง</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-[33px] glass-muted-text"
                aria-hidden="true"
              />
            </Label>
            {filterMode === "month" && (
              <>
                <Label className="relative flex w-[150px] shrink-0 flex-col gap-1">
                  <span className="text-[11px] font-medium glass-subtle-text">เดือน</span>
                  <select
                    value={monthYear.month}
                    onChange={(e) => {
                      const nextMonth = parseInt(e.target.value, 10);
                      const mm = String(nextMonth).padStart(2, "0");
                      setReportMonth(`${monthYear.year}-${mm}`);
                    }}
                    className={FILTER_SELECT_CLASS}
                    aria-label="เลือกเดือนสำหรับรายงาน"
                  >
                    {TH_MONTHS.map((label, idx) => (
                      <option key={label} value={idx + 1}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-[33px] glass-muted-text"
                    aria-hidden="true"
                  />
                </Label>
                <Label className="relative flex w-[120px] shrink-0 flex-col gap-1">
                  <span className="text-[11px] font-medium glass-subtle-text">ปี (ค.ศ.)</span>
                  <select
                    value={monthYear.year}
                    onChange={(e) => {
                      const nextYear = parseInt(e.target.value, 10);
                      const mm = String(monthYear.month).padStart(2, "0");
                      setReportMonth(`${nextYear}-${mm}`);
                    }}
                    className={`${FILTER_SELECT_CLASS} tabular-nums`}
                    aria-label="เลือกปีสำหรับรายงานรายเดือน"
                  >
                    {Array.from({ length: 8 }).map((_, i) => {
                      const y = new Date().getFullYear() - 5 + i;
                      return (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-[33px] glass-muted-text"
                    aria-hidden="true"
                  />
                </Label>
              </>
            )}
            {filterMode === "year" && (
              <Label className="flex w-[110px] shrink-0 flex-col gap-1">
                <span className="text-[11px] font-medium glass-subtle-text">ปี (ค.ศ.)</span>
                <Input
                  type="number"
                  min={1990}
                  max={2100}
                  value={reportYear}
                  onChange={(e) => setReportYear(e.target.value)}
                  className={`${FILTER_INPUT_CLASS} tabular-nums`}
                  aria-label="เลือกปีสำหรับรายงาน"
                />
              </Label>
            )}
            {filterMode === "custom" && (
              <>
                <Label className="flex w-[190px] shrink-0 flex-col gap-1">
                  <span className="text-[11px] font-medium glass-subtle-text">เริ่ม</span>
                  <Input
                    type="datetime-local"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    className={FILTER_DATE_INPUT_CLASS}
                    aria-label="วันเวลาเริ่มต้นช่วงรายงาน"
                  />
                </Label>
                <Label className="flex w-[190px] shrink-0 flex-col gap-1">
                  <span className="text-[11px] font-medium glass-subtle-text">สิ้นสุด</span>
                  <Input
                    type="datetime-local"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    className={FILTER_DATE_INPUT_CLASS}
                    aria-label="วันเวลาสิ้นสุดช่วงรายงาน"
                  />
                </Label>
              </>
            )}
            <Button
              type="button"
              onClick={handleViewReport}
              className="inline-flex h-11 min-h-11 min-w-[120px] shrink-0 cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white shadow-lg transition-all hover:bg-blue-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ดูรายงาน
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={runExportReportPdf}
              disabled={reportPrintBusy}
              className="inline-flex h-11 min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] glass-text shadow-lg transition-all hover:border-blue-500/30 hover:bg-[var(--glass-nav-hover-bg)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/45 focus:ring-inset"
              aria-label="ส่งออก PDF จากเซิร์ฟเวอร์"
              title="ส่งออก PDF"
            >
              <FileDown size={20} className="shrink-0" aria-hidden />
            </Button>
          </div>
        </div>
      </div>

      {!permissionsLoaded ? (
        <DashboardOverviewMetricsSkeleton />
      ) : (
        <>
      {/* การ์ดสรุป KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border p-4 sm:p-5 flex items-center gap-3 sm:gap-4 group hover:shadow-lg transition-all min-w-0 backdrop-blur-sm"
            style={{ borderColor: card.border, background: card.bg }}
          >
            <div
              className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl shrink-0 transition-transform group-hover:scale-105"
              style={{ background: "rgba(255,255,255,0.05)", border: `2px solid ${card.border}` }}
            >
              <card.icon size={22} style={{ color: card.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold truncate" style={{ color: card.color }}>
                {card.value}
              </p>
              <p className="text-xs font-medium mt-0.5 truncate glass-muted-text">
                {card.label}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* สรุปแยกประเภท (ตรงกับ PDF summary-pdf) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <section
          className="glass-card p-4 sm:p-5 bg-[var(--glass-input-bg)] backdrop-blur-sm"
          aria-labelledby="dash-breakdown-env-title"
        >
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={18} className="glass-muted-text shrink-0" aria-hidden />
            <h3 id="dash-breakdown-env-title" className="font-bold text-sm glass-text">
              แยกตามสภาพแวดล้อมการแก้ไข
            </h3>
          </div>
          <p className="text-xs glass-subtle-text mb-3 leading-relaxed">
            จากฟิลด์สถานที่ติดตั้งตอนปิดงาน — งานที่ยังไม่ปิดหรือยังไม่บันทึกจะอยู่ใน &quot;ไม่ระบุ&quot;
          </p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3 border-b border-[var(--glass-card-border)] pb-2">
              <dt className="glass-muted-text">ภายใน (ในอาคาร)</dt>
              <dd className="tabular-nums font-semibold glass-text">{jobBreakdown.env.INDOOR}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-[var(--glass-card-border)] pb-2">
              <dt className="glass-muted-text">ภายนอก (นอกอาคาร)</dt>
              <dd className="tabular-nums font-semibold glass-text">{jobBreakdown.env.OUTDOOR}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="glass-muted-text">ไม่ระบุ</dt>
              <dd className="tabular-nums font-semibold glass-text">{jobBreakdown.env.UNKNOWN}</dd>
            </div>
          </dl>
        </section>
        <section
          className="glass-card p-4 sm:p-5 bg-[var(--glass-input-bg)] backdrop-blur-sm"
          aria-labelledby="dash-breakdown-part-title"
        >
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={18} className="glass-muted-text shrink-0" aria-hidden />
            <h3 id="dash-breakdown-part-title" className="font-bold text-sm glass-text">
              แยกตามประเภทงาน (Hardware / Software)
            </h3>
          </div>
          <p className="text-xs glass-subtle-text mb-3 leading-relaxed">
            จากฟิลด์ประเภทงานตอนปิดงาน — งานที่ยังไม่ปิดหรือยังไม่บันทึกจะอยู่ใน &quot;ไม่ระบุ&quot;
          </p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3 border-b border-[var(--glass-card-border)] pb-2">
              <dt className="glass-muted-text">Hardware (ฮาร์ดแวร์)</dt>
              <dd className="tabular-nums font-semibold glass-text">{jobBreakdown.part.Hardware}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-[var(--glass-card-border)] pb-2">
              <dt className="glass-muted-text">Software (ซอฟต์แวร์)</dt>
              <dd className="tabular-nums font-semibold glass-text">{jobBreakdown.part.Software}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="glass-muted-text">ไม่ระบุ</dt>
              <dd className="tabular-nums font-semibold glass-text">{jobBreakdown.part.UNKNOWN}</dd>
            </div>
          </dl>
        </section>
      </div>

      {/* แถวกราฟ: สัดส่วนสถานะ + แยกตามจังหวัด */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* กราฟวง – สัดส่วนตามสถานะ */}
        <div
          className="glass-card p-4 sm:p-5 min-h-[280px] flex flex-col"
        >
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <PieChartIcon size={18} className="glass-muted-text" />
            <h3 className="font-bold text-sm glass-text">
              สัดส่วนตามสถานะ
            </h3>
          </div>
          {/* ความสูงคงที่: Recharts ResponsiveContainer ต้องการ parent ที่มี height ชัดเจน ไม่ใช่แค่ min-height + flex-1 */}
          <div className="w-full min-w-0 h-[260px]">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm glass-subtle-text">
                ยังไม่มีข้อมูล
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, "รายการ"]}
                    contentStyle={{ borderRadius: 8, border: `1px solid ${chartColors.tooltipBorder}`, background: chartColors.tooltipBg, color: chartColors.tooltipText }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* กราฟแท่ง – จำนวนแยกตามจังหวัด */}
        <div
          className="glass-card p-4 sm:p-5 min-h-[280px] flex flex-col"
        >
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <MapPin size={18} className="glass-muted-text" />
            <h3 className="font-bold text-sm glass-text">
              จำนวนแจ้งซ่อมแยกตามจังหวัด (Top 8)
            </h3>
          </div>
          <div className="w-full min-w-0 h-[260px]">
            {provinceData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm glass-subtle-text">
                ยังไม่มีข้อมูล
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={provinceData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartColors.tick }} stroke={chartColors.axis} />
                  <YAxis tick={{ fontSize: 11, fill: chartColors.tick }} stroke={chartColors.axis} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => [value, "รายการ"]}
                    contentStyle={{ borderRadius: 8, border: `1px solid ${chartColors.tooltipBorder}`, background: chartColors.tooltipBg, color: chartColors.tooltipText }}
                  />
                  <Bar dataKey="value" name="รายการ" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* กราฟแนวโน้ม – 14 วัน: จำนวนที่แจ้ง vs จำนวนที่แก้ไขเสร็จในแต่ละวัน */}
      <div
        className="glass-card p-4 sm:p-5 min-h-[280px] flex flex-col"
      >
          <div className="flex flex-col gap-1 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="glass-muted-text" />
            <h3 className="font-bold text-sm glass-text">
              {trendMeta.label} (ตามช่วงที่เลือก)
            </h3>
          </div>
          <p className="text-xs glass-subtle-text leading-relaxed">
            <strong>ใช้ทำอะไร:</strong> ดูว่าแต่ละวันมีงาน<strong>เข้าใหม่</strong>กี่ใบ (เส้น/พื้นเทา — นับตามวันที่แจ้ง) เทียบกับงานที่<strong>ปิดเสร็จ</strong>กี่ใบ (เขียว — นับตามวันที่บันทึกแก้ไขเสร็จ) ถ้าเข้ามามากกว่าปิดต่อเนื่อง
            แปลว่าคิวงานสะสม (backlog) มีแนวโน้มเพิ่ม — ใช้ประกอบการวางคนและลำดับความสำคัญ ไม่ใช่ SLA ตามสัญญาโดยตรง
          </p>
        </div>
        <div className="w-full min-w-0 h-[280px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendMeta.data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="dashTrendReport" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="dashTrendResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: chartColors.tick }} stroke={chartColors.axis} />
              <YAxis tick={{ fontSize: 11, fill: chartColors.tick }} stroke={chartColors.axis} allowDecimals={false} domain={[0, "auto"]} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: `1px solid ${chartColors.tooltipBorder}`, background: chartColors.tooltipBg, color: chartColors.tooltipText }}
                formatter={(value: number, name: string) => [value, name === "แจ้งในช่วง" ? "แจ้งในช่วง (รายการ)" : "ปิดในช่วง (รายการ)"]}
              />
              <Legend />
              <Area type="monotone" dataKey="แจ้งในช่วง" stroke="#94a3b8" fillOpacity={1} fill="url(#dashTrendReport)" strokeWidth={2} />
              <Area type="monotone" dataKey="ปิดในช่วง" stroke="#4ade80" fillOpacity={1} fill="url(#dashTrendResolved)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--glass-card-border)] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
            <div className="glass-card px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide glass-subtle-text font-semibold">แจ้งรวม 14 วัน</p>
              <p className="text-lg font-bold glass-text tabular-nums">{trendSummary.reported}</p>
              <p className="text-[11px] glass-subtle-text">เฉลี่ย {trendSummary.avgReported.toFixed(1)} ต่อจุด</p>
            </div>
            <div className="glass-card px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide glass-subtle-text font-semibold">ปิดรวม 14 วัน</p>
              <p className="text-lg font-bold text-emerald-700 tabular-nums dark:text-emerald-300">{trendSummary.resolved}</p>
              <p className="text-[11px] glass-subtle-text">เฉลี่ย {trendSummary.avgResolved.toFixed(1)} ต่อจุด</p>
            </div>
            <div className="glass-card px-3 py-2.5 col-span-2 sm:col-span-1 lg:col-span-1">
              <p className="text-[10px] uppercase tracking-wide glass-subtle-text font-semibold">สุทธิใน 14 วัน (เข้า − ปิด)</p>
              <p className={`text-lg font-bold tabular-nums flex items-center gap-1.5 ${trendSummary.net > 0 ? "text-amber-700 dark:text-amber-300" : trendSummary.net < 0 ? "text-sky-700 dark:text-sky-300" : "glass-text"}`}>
                {trendSummary.net > 0 ? <TrendingUp size={18} className="shrink-0 opacity-90" aria-hidden /> : null}
                {trendSummary.net < 0 ? <TrendingDown size={18} className="shrink-0 opacity-90" aria-hidden /> : null}
                {trendSummary.net === 0 ? <Minus size={18} className="shrink-0 glass-subtle-text" aria-hidden /> : null}
                {trendSummary.net > 0 ? "+" : ""}
                {trendSummary.net}
              </p>
              <p className="text-[11px] glass-subtle-text">
                {trendSummary.net > 0
                  ? "งานเข้ามากกว่าปิดในช่วงนี้"
                  : trendSummary.net < 0
                    ? "ปิดได้มากกว่างานเข้าใหม่"
                    : "เข้าและปิดเท่ากัน"}
              </p>
            </div>
            <div className="glass-card px-3 py-2.5 col-span-2 lg:col-span-2">
              <p className="text-[10px] uppercase tracking-wide glass-subtle-text font-semibold">จุดสูงสุดในกราฟ 14 วัน</p>
              <p className="text-xs glass-muted-text mt-1 leading-snug">
                แจ้งสูงสุด <span className="font-semibold glass-text">{trendSummary.peakReported.v}</span> ใบ วันที่{" "}
                {trendSummary.peakReported.date}
                <span className="glass-subtle-text"> · </span>
                ปิดสูงสุด <span className="font-semibold text-emerald-700 dark:text-emerald-200/90">{trendSummary.peakResolved.v}</span> ใบ วันที่{" "}
                {trendSummary.peakResolved.date}
              </p>
            </div>
          </div>
      </div>

      {/* สรุปวิเคราะห์จากข้อมูลชุดเดียวกับรายการงาน */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold glass-text tracking-tight">สรุปสำหรับวิเคราะห์เพิ่มเติม</h2>
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 ${
            canViewContractTabs ? "lg:grid-cols-4" : "lg:grid-cols-3"
          }`}
        >
          <div className="glass-card p-4 bg-[var(--glass-card-bg)] backdrop-blur-sm flex gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 border border-amber-200 text-amber-700 dark:bg-amber-500/15 dark:border-amber-500/25 dark:text-amber-300">
              <UserX size={20} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold glass-muted-text">รอดำเนินการ · ยังไม่มีผู้รับ</p>
              <p className="text-2xl font-bold glass-text tabular-nums">{pendingUnassigned}</p>
              <p className="text-[11px] glass-subtle-text mt-0.5">ควรมอบหมายหรือรับงานเพื่อไม่ให้ค้างที่สถานะรอ</p>
            </div>
          </div>
          {canViewContractTabs ? (
            <div className="glass-card p-4 bg-[var(--glass-card-bg)] backdrop-blur-sm flex gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 border border-orange-200 text-orange-700 dark:bg-orange-500/15 dark:border-orange-500/25 dark:text-orange-300">
                <FileWarning size={20} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold glass-muted-text">นอกสัญญา · ยังไม่ปิด</p>
                <p className="text-2xl font-bold glass-text tabular-nums">{openOutOfContract}</p>
                <p className="text-[11px] glass-subtle-text mt-0.5">PENDING / IN_PROGRESS ที่ทำเครื่องหมายนอกสัญญา</p>
              </div>
            </div>
          ) : null}
          <div className="glass-card p-4 bg-[var(--glass-card-bg)] backdrop-blur-sm flex gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 border border-sky-200 text-sky-700 dark:bg-sky-500/15 dark:border-sky-500/25 dark:text-sky-300">
              <Timer size={20} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold glass-muted-text">เวลาแก้เฉลี่ย (งานปิดแล้ว)</p>
              <p className="text-2xl font-bold glass-text tabular-nums">
                {avgResolutionDays != null ? avgResolutionDays.toFixed(1) : "–"}
              </p>
              <p className="text-[11px] glass-subtle-text mt-0.5">วัน จากวันแจ้งถึงวันบันทึกแก้ไขเสร็จ (ทุกใบที่ RESOLVED)</p>
            </div>
          </div>
          <div
            className={`glass-card p-4 bg-[var(--glass-card-bg)] backdrop-blur-sm min-w-0 ${
              canViewContractTabs ? "sm:col-span-2 lg:col-span-1" : ""
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="glass-muted-text shrink-0" aria-hidden />
              <p className="text-xs font-semibold glass-muted-text">พื้นที่แจ้งถี่ (จังหวัด · อำเภอ Top 5)</p>
            </div>
            {districtTop5.length === 0 ? (
              <p className="text-sm glass-subtle-text">ยังไม่มีข้อมูล</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {districtTop5.map((row, i) => (
                  <li key={row.name} className="flex justify-between gap-2 glass-muted-text">
                    <span className="truncate" title={row.name}>
                      {i + 1}. {row.name}
                    </span>
                    <span className="shrink-0 font-semibold glass-text tabular-nums">{row.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
        </>
      )}

      {/* เมนูด่วน — แสดงตามสิทธิ์ RBAC */}
      <div
        className="glass-card p-4 sm:p-5 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-blue-500" />
          <h3 className="font-bold text-sm glass-text">
            เมนูด่วน
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Array.isArray(permissions) && permissions.length > 0
            ? QUICK_LINKS.filter((item) => item.permission && permissions.includes(item.permission))
            : QUICK_LINKS.filter((item) => item.roles.includes(userRole))
          ).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-start gap-3 p-4 glass-card transition-all hover:border-blue-500/30 hover:shadow-lg hover:bg-[var(--glass-card-bg)]"
            >
              {link.icon && (
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 glass-muted-text group-hover:bg-blue-500/15 group-hover:text-blue-400 transition-colors shrink-0">
                  <link.icon size={18} />
                </span>
              )}
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm glass-muted-text group-hover:text-[var(--glass-text)] block">
                  {link.label}
                </span>
                <span className="text-xs glass-subtle-text">{link.desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {portalReady && reportDialogOpen && activeRange && createPortal(
        <div
          className="fixed inset-0 z-100 flex items-start justify-center p-4 pt-16 sm:pt-20"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-report-dialog-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-pointer bg-[var(--glass-card-bg)] backdrop-blur-[2px] outline-none"
            aria-label="ปิดหน้าต่างรายงาน"
            onClick={() => setReportDialogOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] backdrop-blur-md shadow-2xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 id="dashboard-report-dialog-title" className="text-base font-bold glass-text pr-2">
                สรุปรายงานในช่วงที่เลือก
              </h2>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReportDialogOpen(false)}
                className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] glass-muted-text transition-colors hover:bg-[var(--glass-nav-hover-bg)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                aria-label="ปิด"
              >
                <X size={18} aria-hidden />
              </Button>
            </div>
            <p className="text-xs glass-muted-text mb-4 leading-relaxed">{activeRange.labelTh}</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="glass-card px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide glass-subtle-text font-semibold">ทั้งหมด</p>
                <p className="text-lg font-bold glass-text tabular-nums">{reportStats.total}</p>
              </div>
              <div className="glass-card px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide glass-subtle-text font-semibold">{STATUS_LABELS.PENDING}</p>
                <p className="text-lg font-bold text-amber-300 tabular-nums">{reportStats.pending}</p>
              </div>
              <div className="glass-card px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide glass-subtle-text font-semibold">{STATUS_LABELS.IN_PROGRESS}</p>
                <p className="text-lg font-bold text-sky-300 tabular-nums">{reportStats.in_progress}</p>
              </div>
              <div className="glass-card px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide glass-subtle-text font-semibold">{STATUS_LABELS.RESOLVED}</p>
                <p className="text-lg font-bold text-emerald-300 tabular-nums">{reportStats.resolved}</p>
              </div>
              <div className="glass-card px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide glass-subtle-text font-semibold">{STATUS_LABELS.CANCELLED}</p>
                <p className="text-lg font-bold glass-muted-text tabular-nums">{reportStats.cancelled}</p>
              </div>
            </div>

            <div className="space-y-3 mb-4" aria-label="สรุปแยกประเภทตามช่วงที่เลือก">
              <div className="glass-card px-3 py-3">
                <p className="text-xs font-semibold glass-muted-text mb-2">แยกตามสภาพแวดล้อมการแก้ไข</p>
                <p className="text-[11px] glass-subtle-text mb-2 leading-relaxed">
                  จากฟิลด์ตอนปิดงาน — ยังไม่ปิดหรือยังไม่บันทึกจะอยู่ใน &quot;ไม่ระบุ&quot;
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="glass-muted-text">ภายใน (ในอาคาร)</span>
                    <span className="tabular-nums font-medium glass-text">{jobBreakdown.env.INDOOR}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="glass-muted-text">ภายนอก (นอกอาคาร)</span>
                    <span className="tabular-nums font-medium glass-text">{jobBreakdown.env.OUTDOOR}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="glass-muted-text">ไม่ระบุ</span>
                    <span className="tabular-nums font-medium glass-text">{jobBreakdown.env.UNKNOWN}</span>
                  </div>
                </div>
              </div>
              <div className="glass-card px-3 py-3">
                <p className="text-xs font-semibold glass-muted-text mb-2">แยกตามประเภทงาน (Hardware / Software)</p>
                <p className="text-[11px] glass-subtle-text mb-2 leading-relaxed">
                  จากฟิลด์ตอนปิดงาน — ยังไม่ปิดหรือยังไม่บันทึกจะอยู่ใน &quot;ไม่ระบุ&quot;
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="glass-muted-text">Hardware (ฮาร์ดแวร์)</span>
                    <span className="tabular-nums font-medium glass-text">{jobBreakdown.part.Hardware}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="glass-muted-text">Software (ซอฟต์แวร์)</span>
                    <span className="tabular-nums font-medium glass-text">{jobBreakdown.part.Software}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="glass-muted-text">ไม่ระบุ</span>
                    <span className="tabular-nums font-medium glass-text">{jobBreakdown.part.UNKNOWN}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] glass-subtle-text mb-4 leading-relaxed">
              นับจากวันที่แจ้ง (หรือวันที่สร้างใบ) ให้ตรงกับช่วงที่เลือก — ใช้ปุ่มด้านล่างเพื่อดาวน์โหลดไฟล์ PDF ที่สร้างจากเซิร์ฟเวอร์
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setReportDialogOpen(false)}
                className="min-h-11 cursor-pointer rounded-xl border border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] px-4 py-2.5 text-sm font-medium glass-text transition-all hover:bg-[var(--glass-nav-hover-bg)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                ปิด
              </Button>
              <Button
                type="button"
                onClick={() => {
                  runExportReportPdf();
                }}
                disabled={reportPrintBusy}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-blue-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileDown size={18} className="shrink-0" aria-hidden />
                พิมพ์ / บันทึกเป็น PDF
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
