"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format, subDays, startOfDay } from "date-fns";
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
  Lightbulb,
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
}

interface Stats {
  pending: number;
  in_progress: number;
  resolved: number;
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
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  IN_PROGRESS: "กำลังแก้ไข",
  RESOLVED: "เสร็จสิ้น",
};

/** เมนูด่วน — อ้างอิงสิทธิ์ RBAC (permission) หรือ role */
const QUICK_LINKS = [
  { label: "ข้อขัดข้องทั้งหมด", href: "/dashboard/all", desc: "ประวัติการแจ้งข้อขัดข้องและ filter", permission: "menu.all", roles: ["ADMIN", "STAFF"], icon: ClipboardList },
  { label: "จัดการผู้ใช้", href: "/dashboard/users", desc: "รายชื่อผู้ใช้และบทบาท", permission: "menu.users", roles: ["ADMIN"], icon: Users },
  { label: "จัดการบทบาทและสิทธิ์", href: "/dashboard/roles", desc: "กำหนดสิทธิ์เมนูให้แต่ละบทบาท", permission: "menu.roles", roles: ["ADMIN"], icon: Shield },
  { label: "ตั้งค่าระบบ", href: "/dashboard/settings", desc: "กำหนดค่า MinIO และ Email", permission: "menu.settings", roles: ["ADMIN"], icon: Settings },
  { label: "แจ้งปัญหา", href: "/public/report", desc: "แบบฟอร์มแจ้งซ่อม", permission: "menu.report", roles: ["USER", "ADMIN", "STAFF"], icon: FileEdit },
  { label: "ตรวจสอบสถานะ", href: "/public/status", desc: "ตรวจสอบสถานะใบแจ้งซ่อม", permission: "menu.status", roles: ["USER", "ADMIN", "STAFF"], icon: Search },
  { label: "โปรไฟล์", href: "/dashboard/profile", desc: "ข้อมูลส่วนตัวและเปลี่ยนรหัสผ่าน", permission: "menu.profile", roles: ["USER", "ADMIN", "STAFF"], icon: User },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";
  const token = (session as { accessToken?: string })?.accessToken;
  const userRole = (session?.user as { role?: string })?.role ?? "USER";

  useEffect(() => {
    if (!token || !session?.user) {
      setPermissions(null);
      return;
    }
    axios.get<{ permissions: string[] }>(`${API}/roles/me/permissions`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        const payload = unwrapApiData<unknown>(r?.data) as { permissions?: string[] } | null;
        setPermissions(payload?.permissions ?? null);
      })
      .catch(() => setPermissions(null));
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

  const stats: Stats = useMemo(() => ({
    pending: jobs.filter((j) => j.status === "PENDING").length,
    in_progress: jobs.filter((j) => j.status === "IN_PROGRESS").length,
    resolved: jobs.filter((j) => j.status === "RESOLVED").length,
    total: jobs.length,
  }), [jobs]);

  const pieData = useMemo(() => [
    { name: STATUS_LABELS.PENDING, value: stats.pending, color: STATUS_COLORS.PENDING },
    { name: STATUS_LABELS.IN_PROGRESS, value: stats.in_progress, color: STATUS_COLORS.IN_PROGRESS },
    { name: STATUS_LABELS.RESOLVED, value: stats.resolved, color: STATUS_COLORS.RESOLVED },
  ].filter((d) => d.value > 0), [stats]);

  const provinceData = useMemo(() => {
    const count: Record<string, number> = {};
    jobs.forEach((j) => {
      const p = j.province?.trim() || "ไม่ระบุ";
      count[p] = (count[p] || 0) + 1;
    });
    return Object.entries(count)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [jobs]);

  const trendDays = 14;
  const trendData = useMemo(() => {
    const days: { date: string; แจ้งในวันนั้น: number; เสร็จในวันนั้น: number }[] = [];
    const now = new Date();
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = startOfDay(subDays(now, i));
      const dateStr = format(d, "dd/MM", { locale: th });
      const dayStart = d.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const reportedThatDay = jobs.filter((j) => {
        const t = new Date(j.reportDate || j.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      });
      const resolvedThatDay = jobs.filter((j) => {
        const fd = j.fixDate ? new Date(j.fixDate).getTime() : null;
        return fd != null && fd >= dayStart && fd < dayEnd;
      });
      days.push({ date: dateStr, แจ้งในวันนั้น: reportedThatDay.length, เสร็จในวันนั้น: resolvedThatDay.length });
    }
    return days;
  }, [jobs]);

  /** สรุปตัวเลขจากชุด 14 วันเดียวกับกราฟ */
  const trendSummary14 = useMemo(() => {
    const reported = trendData.reduce((a, d) => a + d.แจ้งในวันนั้น, 0);
    const resolved = trendData.reduce((a, d) => a + d.เสร็จในวันนั้น, 0);
    const net = reported - resolved;
    const peakReported = trendData.reduce(
      (best, d) => (d.แจ้งในวันนั้น > best.v ? { date: d.date, v: d.แจ้งในวันนั้น } : best),
      { date: "–", v: 0 },
    );
    const peakResolved = trendData.reduce(
      (best, d) => (d.เสร็จในวันนั้น > best.v ? { date: d.date, v: d.เสร็จในวันนั้น } : best),
      { date: "–", v: 0 },
    );
    return {
      reported,
      resolved,
      net,
      avgReported: reported / trendDays,
      avgResolved: resolved / trendDays,
      peakReported,
      peakResolved,
    };
  }, [trendData, trendDays]);

  /** งาน PENDING ที่ยังไม่มีผู้รับผิดชอบ */
  const pendingUnassigned = useMemo(
    () => jobs.filter((j) => j.status === "PENDING" && !j.assignedTo).length,
    [jobs],
  );

  /** งานนอกสัญญาที่ยังไม่ปิด */
  const openOutOfContract = useMemo(
    () =>
      jobs.filter(
        (j) => j.isOutOfContract === true && (j.status === "PENDING" || j.status === "IN_PROGRESS"),
      ).length,
    [jobs],
  );

  /** เวลาแก้เฉลี่ย (วัน) สำหรับงานที่ปิดแล้วและมี fixDate */
  const avgResolutionDays = useMemo(() => {
    const resolved = jobs.filter(
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
  }, [jobs]);

  /** Top อำเภอ (จากข้อมูลงานทั้งหมด) */
  const districtTop5 = useMemo(() => {
    const count: Record<string, number> = {};
    jobs.forEach((j) => {
      const prov = j.province?.trim() || "ไม่ระบุ";
      const dist = j.district?.trim() || "ไม่ระบุ";
      const key = `${prov} · ${dist}`;
      count[key] = (count[key] || 0) + 1;
    });
    return Object.entries(count)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [jobs]);

  const cards = [
    { label: "ทั้งหมด", value: stats.total, icon: TrendingUp, color: "#94a3b8", bg: "rgba(71,85,105,0.15)", border: "rgba(255,255,255,0.1)", href: "/dashboard/all" },
    { label: "รอดำเนินการ", value: stats.pending, icon: AlertCircle, color: "#fb923c", bg: "rgba(230,81,0,0.12)", border: "rgba(251,146,60,0.25)", href: "/dashboard/pending" },
    { label: "กำลังแก้ไข", value: stats.in_progress, icon: Wrench, color: "#60a5fa", bg: "rgba(21,101,192,0.12)", border: "rgba(96,165,250,0.25)", href: "/dashboard/in-progress" },
    { label: "เสร็จสิ้น", value: stats.resolved, icon: CheckCircle2, color: "#4ade80", bg: "rgba(46,125,50,0.12)", border: "rgba(74,222,128,0.25)", href: "/dashboard/all" },
  ];

  return (
    <div className="animate-fade-up w-full min-w-0 space-y-6">
      {/* หัวข้อ */}
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold truncate text-white">
          สวัสดี, {session?.user?.name || "เจ้าหน้าที่"}
        </h1>
        <p className="text-sm mt-0.5 text-slate-400">
          ภาพรวมงานแจ้งซ่อม CCTV · สรุปผลและแนวโน้ม
        </p>
      </div>

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
                {loading ? "–" : card.value}
              </p>
              <p className="text-xs font-medium mt-0.5 truncate text-slate-400">
                {card.label}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* แถวกราฟ: สัดส่วนสถานะ + แยกตามจังหวัด */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* กราฟวง – สัดส่วนตามสถานะ */}
        <div
          className="rounded-xl border border-white/10 p-4 sm:p-5 min-h-[280px] flex flex-col bg-slate-900/50 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <PieChartIcon size={18} className="text-slate-400" />
            <h3 className="font-bold text-sm text-slate-200">
              สัดส่วนตามสถานะ
            </h3>
          </div>
          {/* ความสูงคงที่: Recharts ResponsiveContainer ต้องการ parent ที่มี height ชัดเจน ไม่ใช่แค่ min-height + flex-1 */}
          <div className="w-full min-w-0 h-[260px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                กำลังโหลด...
              </div>
            ) : pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
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
                  <Tooltip formatter={(value: number) => [value, "รายการ"]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* กราฟแท่ง – จำนวนแยกตามจังหวัด */}
        <div
          className="rounded-xl border border-white/10 p-4 sm:p-5 min-h-[280px] flex flex-col bg-slate-900/50 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <MapPin size={18} className="text-slate-400" />
            <h3 className="font-bold text-sm text-slate-200">
              จำนวนแจ้งซ่อมแยกตามจังหวัด (Top 8)
            </h3>
          </div>
          <div className="w-full min-w-0 h-[260px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                กำลังโหลด...
              </div>
            ) : provinceData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                ยังไม่มีข้อมูล
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={provinceData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="rgba(255,255,255,0.1)" />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="rgba(255,255,255,0.1)" allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => [value, "รายการ"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#1e293b", color: "#e2e8f0" }}
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
        className="rounded-xl border border-white/10 p-4 sm:p-5 min-h-[280px] flex flex-col bg-slate-900/50 backdrop-blur-sm"
      >
          <div className="flex flex-col gap-1 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-slate-400" />
            <h3 className="font-bold text-sm text-slate-200">
              แนวโน้มรายวัน (14 วันล่าสุด)
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong>ใช้ทำอะไร:</strong> ดูว่าแต่ละวันมีงาน<strong>เข้าใหม่</strong>กี่ใบ (เส้น/พื้นเทา — นับตามวันที่แจ้ง) เทียบกับงานที่<strong>ปิดเสร็จ</strong>กี่ใบ (เขียว — นับตามวันที่บันทึกแก้ไขเสร็จ) ถ้าเข้ามามากกว่าปิดต่อเนื่อง
            แปลว่าคิวงานสะสม (backlog) มีแนวโน้มเพิ่ม — ใช้ประกอบการวางคนและลำดับความสำคัญ ไม่ใช่ SLA ตามสัญญาโดยตรง
          </p>
        </div>
        <div className="w-full min-w-0 h-[280px] sm:h-[300px]">
          {loading ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">
              กำลังโหลด...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="rgba(255,255,255,0.1)" allowDecimals={false} domain={[0, "auto"]} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#1e293b", color: "#e2e8f0" }}
                  formatter={(value: number, name: string) => [value, name === "แจ้งในวันนั้น" ? "แจ้งในวันนั้น (รายการ)" : "เสร็จในวันนั้น (รายการ)"]}
                />
                <Legend />
                <Area type="monotone" dataKey="แจ้งในวันนั้น" stroke="#94a3b8" fillOpacity={1} fill="url(#dashTrendReport)" strokeWidth={2} />
                <Area type="monotone" dataKey="เสร็จในวันนั้น" stroke="#4ade80" fillOpacity={1} fill="url(#dashTrendResolved)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        {!loading && (
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
            <div className="rounded-xl border border-white/10 bg-slate-800/40 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">แจ้งรวม 14 วัน</p>
              <p className="text-lg font-bold text-slate-200 tabular-nums">{trendSummary14.reported}</p>
              <p className="text-[11px] text-slate-500">เฉลี่ย {trendSummary14.avgReported.toFixed(1)} ใบ/วัน</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-800/40 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">ปิดรวม 14 วัน</p>
              <p className="text-lg font-bold text-emerald-300 tabular-nums">{trendSummary14.resolved}</p>
              <p className="text-[11px] text-slate-500">เฉลี่ย {trendSummary14.avgResolved.toFixed(1)} ใบ/วัน</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-800/40 px-3 py-2.5 col-span-2 sm:col-span-1 lg:col-span-1">
              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">สุทธิใน 14 วัน (เข้า − ปิด)</p>
              <p className={`text-lg font-bold tabular-nums flex items-center gap-1.5 ${trendSummary14.net > 0 ? "text-amber-300" : trendSummary14.net < 0 ? "text-sky-300" : "text-slate-200"}`}>
                {trendSummary14.net > 0 ? <TrendingUp size={18} className="shrink-0 opacity-90" aria-hidden /> : null}
                {trendSummary14.net < 0 ? <TrendingDown size={18} className="shrink-0 opacity-90" aria-hidden /> : null}
                {trendSummary14.net === 0 ? <Minus size={18} className="shrink-0 text-slate-500" aria-hidden /> : null}
                {trendSummary14.net > 0 ? "+" : ""}
                {trendSummary14.net}
              </p>
              <p className="text-[11px] text-slate-500">
                {trendSummary14.net > 0
                  ? "งานเข้ามากกว่าปิดในช่วงนี้"
                  : trendSummary14.net < 0
                    ? "ปิดได้มากกว่างานเข้าใหม่"
                    : "เข้าและปิดเท่ากัน"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-800/40 px-3 py-2.5 col-span-2 lg:col-span-2">
              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">จุดสูงสุดในกราฟ 14 วัน</p>
              <p className="text-xs text-slate-300 mt-1 leading-snug">
                แจ้งสูงสุด <span className="font-semibold text-slate-100">{trendSummary14.peakReported.v}</span> ใบ วันที่{" "}
                {trendSummary14.peakReported.date}
                <span className="text-slate-500"> · </span>
                ปิดสูงสุด <span className="font-semibold text-emerald-200/90">{trendSummary14.peakResolved.v}</span> ใบ วันที่{" "}
                {trendSummary14.peakResolved.date}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* สรุปวิเคราะห์จากข้อมูลชุดเดียวกับรายการงาน */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-200 tracking-tight">สรุปสำหรับวิเคราะห์เพิ่มเติม</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-xl border border-white/10 p-4 bg-slate-900/50 backdrop-blur-sm flex gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-300">
              <UserX size={20} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400">รอดำเนินการ · ยังไม่มีผู้รับ</p>
              <p className="text-2xl font-bold text-slate-100 tabular-nums">{loading ? "–" : pendingUnassigned}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">ควรมอบหมายหรือรับงานเพื่อไม่ให้ค้างที่สถานะรอ</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 p-4 bg-slate-900/50 backdrop-blur-sm flex gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-300">
              <FileWarning size={20} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400">นอกสัญญา · ยังไม่ปิด</p>
              <p className="text-2xl font-bold text-slate-100 tabular-nums">{loading ? "–" : openOutOfContract}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">PENDING / IN_PROGRESS ที่ทำเครื่องหมายนอกสัญญา</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 p-4 bg-slate-900/50 backdrop-blur-sm flex gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-300">
              <Timer size={20} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400">เวลาแก้เฉลี่ย (งานปิดแล้ว)</p>
              <p className="text-2xl font-bold text-slate-100 tabular-nums">
                {loading ? "–" : avgResolutionDays != null ? avgResolutionDays.toFixed(1) : "–"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">วัน จากวันแจ้งถึงวันบันทึกแก้ไขเสร็จ (ทุกใบที่ RESOLVED)</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 p-4 bg-slate-900/50 backdrop-blur-sm min-w-0 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-slate-400 shrink-0" aria-hidden />
              <p className="text-xs font-semibold text-slate-400">พื้นที่แจ้งถี่ (จังหวัด · อำเภอ Top 5)</p>
            </div>
            {loading ? (
              <p className="text-sm text-slate-500">กำลังโหลด...</p>
            ) : districtTop5.length === 0 ? (
              <p className="text-sm text-slate-500">ยังไม่มีข้อมูล</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {districtTop5.map((row, i) => (
                  <li key={row.name} className="flex justify-between gap-2 text-slate-300">
                    <span className="truncate" title={row.name}>
                      {i + 1}. {row.name}
                    </span>
                    <span className="shrink-0 font-semibold text-slate-100 tabular-nums">{row.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-4 sm:p-5 bg-slate-900/40 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300 border border-violet-500/20">
              <Lightbulb size={18} aria-hidden />
            </span>
            <div className="min-w-0 text-xs text-slate-400 leading-relaxed space-y-2">
              <p className="font-semibold text-slate-300 text-sm">แนวทางขยายวิเคราะห์ในอนาคต (จากข้อมูลเดิมในระบบ)</p>
              <ul className="list-disc pl-4 space-y-1 marker:text-slate-600">
                <li>ภาระงานต่อเจ้าหน้าที่ (นับจากผู้รับผิดชอบ + งานค้าง)</li>
                <li>สัดส่วนใน / นอกสัญญา และแนวโน้มรายเดือน</li>
                <li>กราฟเวลาแก้ตามจังหวัดหรือตามประเภทสถานที่ (Site)</li>
                <li>เป้า SLA ถ้ามีกำหนดวันปิดในนโยบาย — เปรียบเทียบกับวันจริงที่ปิด</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* เมนูด่วน — แสดงตามสิทธิ์ RBAC */}
      <div
        className="rounded-xl border border-white/10 p-4 sm:p-5 bg-slate-900/50 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-blue-500" />
          <h3 className="font-bold text-sm text-slate-200">
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
              className="group flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-slate-800/30 transition-all hover:border-blue-500/30 hover:shadow-lg hover:bg-slate-800/60"
            >
              {link.icon && (
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 text-slate-400 group-hover:bg-blue-500/15 group-hover:text-blue-400 transition-colors shrink-0">
                  <link.icon size={18} />
                </span>
              )}
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm text-slate-300 group-hover:text-white block">
                  {link.label}
                </span>
                <span className="text-xs text-slate-500">{link.desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
