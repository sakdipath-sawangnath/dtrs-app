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
          <div className="flex-1 min-h-[220px]">
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
          <div className="flex-1 min-h-[220px]">
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
          <p className="text-xs text-slate-500">
            <strong>วัตถุประสงค์:</strong> เปรียบเทียบปริมาณงานที่เข้ามา (แจ้งซ่อม) กับงานที่ปิดได้ในแต่ละวัน · สีเทา = จำนวนที่<strong>แจ้งในวันนั้น</strong> (reportDate) · สีเขียว = จำนวนที่<strong>แก้ไขเสร็จในวันนั้น</strong> (fixDate) · ใช้ดูว่า backlog ลดหรือเพิ่ม
          </p>
        </div>
        <div className="flex-1 min-h-[220px]">
          {loading ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">
              กำลังโหลด...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReport" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#475569" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#475569" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2e7d32" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="rgba(255,255,255,0.1)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#1e293b", color: "#e2e8f0" }}
                  formatter={(value: number, name: string) => [value, name === "แจ้งในวันนั้น" ? "แจ้งในวันนั้น (รายการ)" : "เสร็จในวันนั้น (รายการ)"]}
                />
                <Legend />
                <Area type="monotone" dataKey="แจ้งในวันนั้น" stroke="#475569" fillOpacity={1} fill="url(#colorReport)" strokeWidth={2} />
                <Area type="monotone" dataKey="เสร็จในวันนั้น" stroke="#2e7d32" fillOpacity={1} fill="url(#colorResolved)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
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
