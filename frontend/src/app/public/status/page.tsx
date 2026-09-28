"use client";

import { Suspense, useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Search, MapPin, Calendar, FileText, User, Phone, Mail, Image as ImageIcon, AlertTriangle, Info, ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import DashboardLayoutShell from '@/components/DashboardLayoutShell';
import PublicLayoutShell from '@/components/PublicLayoutShell';
import Link from 'next/link';
import { dashboardJobImagePath } from '@/lib/dashboardJobImageUrl';
import { useDashboardTablePaging } from '@/hooks/useDashboardTablePaging';
import DataTablePagination from '@/components/DataTablePagination';
import DataTablePageSizeSelect from '@/components/dashboard/DataTablePageSizeSelect';
import { TextHoverTooltip } from '@/components/TextHoverTooltip';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PublicRouteLoading from "@/components/PublicRouteLoading";
import ManagedImage, { MANAGED_IMAGE_SIZES } from "@/components/ManagedImage";
import ManagedImageFrame from "@/components/ManagedImageFrame";

const STATUS_LABEL: Record<string, { text: string; badgeClass: string }> = {
  PENDING: {
    text: "รอดำเนินการ",
    badgeClass:
      "border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200 backdrop-blur-md shadow-inner",
  },
  IN_PROGRESS: {
    text: "กำลังแก้ไข",
    badgeClass:
      "border border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-200 backdrop-blur-md shadow-inner",
  },
  RESOLVED: {
    text: "แล้วเสร็จ",
    badgeClass:
      "border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200 backdrop-blur-md shadow-inner",
  },
  CANCELLED: {
    text: "ยกเลิก",
    badgeClass:
      "border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-400/30 dark:bg-slate-600/20 dark:text-slate-200 backdrop-blur-md shadow-inner",
  },
};

const STATUS_BADGE_FALLBACK =
  "border border-slate-300 bg-slate-100 text-slate-700 dark:border-[var(--glass-card-border)] dark:bg-slate-500/20 dark:text-slate-200 backdrop-blur-md shadow-inner";

/** ปุ่มรอง — Dark Glass (สอดคล้อง AGENTS: Cancel slate) */
const GLASS_BUTTON_SECONDARY =
  "inline-flex items-center justify-center rounded-xl border border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] backdrop-blur-md glass-text shadow-lg hover:bg-[var(--glass-nav-hover-bg)] hover:border-blue-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500/50 transition-all active:scale-95";

/** ปุ่มฟ้าแบบกะทัดรัดสำหรับแถวในตาราง (ไม่ให้ช่องอาการถูกบีบจากปุ่มใหญ่เกินจำเป็น) */
const GLASS_BUTTON_PRIMARY_TABLE_ROW =
  "inline-flex items-center justify-center rounded-lg border border-blue-400/35 bg-blue-600/90 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-medium shadow-md shadow-blue-950/25 ring-1 ring-white/10 px-2 py-1.5 sm:px-2.5 gap-1 min-h-10 hover:bg-blue-500/95 hover:border-blue-300/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400/70 transition-all active:scale-95 cursor-pointer";

const GLASS_SECTION = 'glass-card px-5 sm:px-7 py-5 sm:py-6';

function normalizeIssueImages(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === 'string' && x.length > 0);
  }
  return [];
}

function formatReportDateTime(iso: string | null): string {
  if (!iso) return '–';
  try {
    const d = new Date(iso);
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '–';
  }
}

/**
 * มาสก์ข้อความให้แสดงเฉพาะ "ตัวแรก" และ "ตัวท้าย" 1 ตัว
 * - ส่วนที่เหลือแทนด้วย `*`
 */
function maskFirstAndLastChar(input: string): string {
  const s = (input ?? '').trim();
  if (!s) return '–';
  const chars = [...s];
  if (chars.length <= 2) return s;
  const first = chars[0];
  const last = chars[chars.length - 1];
  return `${first}${'*'.repeat(chars.length - 2)}${last}`;
}

/** รูปโปรไฟล์ผู้แจ้ง (เจ้าหน้าที่ที่ล็อกอิน) — Dark Glass + fallback — โหลดผ่าน `/user-images` */
function ReporterAvatarGlass({
  imageUrl,
  reporterUserId,
  name,
}: {
  imageUrl: string | null | undefined;
  reporterUserId?: number | null;
  name: string | null | undefined;
}) {
  const [imgError, setImgError] = useState(false);
  const trimmed = imageUrl?.trim();
  const src =
    trimmed && reporterUserId != null
      ? `/user-images/${reporterUserId}`
      : trimmed ?? undefined;
  const showImg = Boolean(src) && !imgError;

  return (
    <ManagedImageFrame
      src={showImg ? src ?? "" : null}
      alt={name ? `รูปโปรไฟล์ ${name}` : "ผู้แจ้ง"}
      sizes={MANAGED_IMAGE_SIZES.avatarXlResponsive}
      frameClassName="flex h-20 w-20 shrink-0 rounded-2xl border border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] shadow-inner ring-1 ring-white/10 backdrop-blur-md sm:h-22 sm:w-22"
      imageClassName="h-full w-full object-cover"
      onError={() => setImgError(true)}
      fallback={
        <div
          className="flex h-full w-full items-center justify-center bg-[var(--glass-card-bg)] glass-subtle-text"
          aria-hidden
        >
          <User size={40} strokeWidth={1.35} className="opacity-95" />
        </div>
      }
    />
  );
}

type PhoneStatusListItem = {
  id?: number;
  ticketNo: string | null;
  status: string;
  reportDate: string | null;
  /** อาการ/รายละเอียดคร่าวๆ (description หรือ fallback title) */
  issueSummary?: string | null;
  /** บันทึกเมื่อปิดงาน — จากช่าง */
  cause?: string | null;
  fixMethod?: string | null;
};

const ISSUE_PREVIEW_MAX = 50;

function formatIssuePreview(full: string | null | undefined) {
  const t = (full ?? '').trim();
  if (!t) return { short: '–' as const, full: '', clipped: false };
  const clipped = t.length > ISSUE_PREVIEW_MAX;
  return {
    short: clipped ? `${t.slice(0, ISSUE_PREVIEW_MAX)}..` : t,
    full: t,
    clipped,
  };
}

/** คีย์คงที่สำหรับแถวรายการตามเบอร์ (เปิด/ปิดรายละเอียดสาเหตุ–วิธีแก้) */
function phoneFixDetailRowKey(row: PhoneStatusListItem): string {
  const idPart = typeof row.id === 'number' ? String(row.id) : 'noid';
  return `${idPart}|${row.ticketNo ?? ''}|${row.reportDate ?? ''}`;
}

function CauseFixFields({
  cause,
  fixMethod,
  emptyHint,
  compact,
}: {
  cause?: string | null;
  fixMethod?: string | null;
  emptyHint: string;
  compact?: boolean;
}) {
  const c = (cause ?? '').trim();
  const m = (fixMethod ?? '').trim();
  const blockPad = compact ? 'px-3.5 py-3 sm:px-4 sm:py-3.5' : 'px-4 py-4 sm:px-5 sm:py-4';
  const bodyCls =
    'mt-2 text-[15px] sm:text-base glass-text font-medium whitespace-pre-wrap wrap-break-word leading-relaxed';
  const dashCls = 'mt-2 text-base glass-subtle-text italic';

  if (!c && !m) {
    return (
      <p
        className={
          compact ? 'text-sm glass-muted-text leading-relaxed' : 'text-sm sm:text-base glass-muted-text leading-relaxed'
        }
      >
        {emptyHint}
      </p>
    );
  }

  return (
    <div className={compact ? 'space-y-4' : 'grid gap-4 sm:gap-5'}>
      <div
        className={`rounded-xl border border-[var(--glass-card-border)] border-l-4 border-l-amber-400/90 bg-[var(--glass-card-bg)] backdrop-blur-sm shadow-inner ${blockPad}`}
      >
        <p className="text-sm sm:text-[0.9375rem] font-bold tracking-wide text-amber-800 dark:text-amber-100">
          สาเหตุ
        </p>
        <p className={c ? bodyCls : dashCls} role={c ? undefined : 'status'}>
          {c || '–'}
        </p>
      </div>
      <div
        className={`rounded-xl border border-[var(--glass-card-border)] border-l-4 border-l-emerald-400/90 bg-[var(--glass-card-bg)] backdrop-blur-sm shadow-inner ${blockPad}`}
      >
        <p className="text-sm sm:text-[0.9375rem] font-bold tracking-wide text-emerald-800 dark:text-emerald-100">
          วิธีการแก้ไขและผลทดสอบ
        </p>
        <p className={m ? bodyCls : dashCls} role={m ? undefined : 'status'}>
          {m || '–'}
        </p>
      </div>
    </div>
  );
}

function StatusPageInner() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4100/api';
  const initialTicketFromUrl = searchParams.get('ticketNo') ?? '';
  const initialPhoneFromUrl = searchParams.get('phone') ?? '';
  const [searchMode, setSearchMode] = useState<'phone' | 'ticket'>(
    initialTicketFromUrl ? 'ticket' : 'phone',
  );
  const [ticketNo, setTicketNo] = useState(initialTicketFromUrl);
  const [phone, setPhone] = useState(() => initialPhoneFromUrl.replace(/\D/g, ''));
  const [loading, setLoading] = useState(false);
  /** undefined = ยังไม่ค้นหาเบอร์, array = ค้นหาแล้ว (อาจว่าง) */
  const [phoneList, setPhoneList] = useState<PhoneStatusListItem[] | undefined>(undefined);
  const [phoneSearchError, setPhoneSearchError] = useState<string | null>(null);
  /** คีย์สำหรับรีเซ็ตหน้าแบ่งเมื่อค้นหาเบอร์ใหม่ */
  const [phoneQueryKey, setPhoneQueryKey] = useState('');
  /** แถวที่ขยายดูสาเหตุ/วิธีแก้ในรายการตามเบอร์ */
  const [phoneDetailExpandedKey, setPhoneDetailExpandedKey] = useState<string | null>(null);
  const [result, setResult] = useState<{
    id?: number;
    ticketNo: string;
    status: string;
    reportDate: string | null;
    detailLevel?: 'masked' | 'full';
    description?: string | null;
    cause?: string | null;
    fixMethod?: string | null;
    province?: string | null;
    district?: string | null;
    location?: string | null;
    reporterName?: string | null;
    reporterPhone?: string | null;
    reporterEmail?: string | null;
    images?: unknown;
    /** จำนวนรูป (โหมด public มาสก์ — ไม่ส่ง URL รูป) */
    issueImageCount?: number;
    reporter?: { id?: number; image: string | null } | null;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);

  const isStatusResult = (v: unknown): v is {
    id?: number;
    ticketNo: string;
    status: string;
    reportDate: string | null;
    detailLevel?: 'masked' | 'full';
    description?: string | null;
    cause?: string | null;
    fixMethod?: string | null;
    province?: string | null;
    district?: string | null;
    location?: string | null;
    reporterName?: string | null;
    reporterPhone?: string | null;
    reporterEmail?: string | null;
    images?: unknown;
    issueImageCount?: number;
    reporter?: { id?: number; image: string | null } | null;
  } => {
    if (!v || typeof v !== 'object') return false;
    const o = v as Record<string, unknown>;
    return typeof o.ticketNo === 'string' && typeof o.status === 'string';
  };

  const isPhoneListPayload = (v: unknown): v is {
    items: PhoneStatusListItem[];
    detailLevel: string;
  } => {
    if (!v || typeof v !== 'object') return false;
    const o = v as Record<string, unknown>;
    if (!Array.isArray(o.items) || o.detailLevel !== 'summary') return false;
    return o.items.every((row) => {
      if (!row || typeof row !== 'object') return false;
      const r = row as Record<string, unknown>;
      const tnOk = r.ticketNo === null || typeof r.ticketNo === 'string';
      const idOk = r.id === undefined || typeof r.id === 'number';
      const issueOk =
        r.issueSummary === undefined ||
        r.issueSummary === null ||
        typeof r.issueSummary === 'string';
      const causeOk =
        r.cause === undefined || r.cause === null || typeof r.cause === 'string';
      const fixOk =
        r.fixMethod === undefined ||
        r.fixMethod === null ||
        typeof r.fixMethod === 'string';
      return (
        idOk &&
        tnOk &&
        typeof r.status === 'string' &&
        (r.reportDate === null || typeof r.reportDate === 'string') &&
        issueOk &&
        causeOk &&
        fixOk
      );
    });
  };

  const performPhoneListSearch = useCallback(
    async (rawPhone: string, opts?: { syncUrl?: boolean }) => {
      const digits = String(rawPhone).replace(/\D/g, '');
      if (digits.length < 9 || digits.length > 12) {
        setPhoneSearchError('กรุณากรอกเบอร์ 9–12 หลัก (รองรับ 0 นำหน้าหรือรหัส 66)');
        return;
      }
      setLoading(true);
      setResult(null);
      setNotFound(false);
      setPhoneSearchError(null);
      try {
        const token = (session as { accessToken?: string } | null)?.accessToken;
        const url = token ? `${API}/jobs/status-by-phone` : `${API}/public/jobs/status-by-phone`;
        const res = await axios.get(url, {
          params: { phone: digits },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const root: unknown = res?.data;
        const nested =
          root && typeof root === 'object' && 'data' in root
            ? (root as { data?: unknown }).data
            : undefined;
        const payload: unknown = nested ?? root;
        if (isPhoneListPayload(payload)) {
          setPhoneQueryKey(digits);
          setPhoneList(payload.items);
          if (opts?.syncUrl) {
            const q = new URLSearchParams();
            q.set('phone', digits);
            router.replace(`${pathname}?${q.toString()}`);
          }
        } else {
          setPhoneList([]);
        }
      } catch (e) {
        setPhoneList(undefined);
        if (axios.isAxiosError(e) && e.response?.status === 400) {
          const data = e.response.data as { message?: string | string[] };
          const m = data?.message;
          const msg = Array.isArray(m) ? m[0] : m;
          setPhoneSearchError(typeof msg === 'string' && msg ? msg : 'เบอร์โทรไม่ถูกต้อง');
        } else {
          setPhoneSearchError('เกิดข้อผิดพลาด กรุณาลองใหม่');
        }
      } finally {
        setLoading(false);
      }
    },
    [API, session, pathname, router],
  );

  const performSearch = useCallback(
    async (no: string) => {
      if (!no) return;
      setLoading(true);
      setResult(null);
      setNotFound(false);
      setPhoneList(undefined);
      setPhoneSearchError(null);
      try {
        const token = (session as { accessToken?: string } | null)?.accessToken;
        const url = token
          ? `${API}/jobs/status/${encodeURIComponent(no)}`
          : `${API}/public/jobs/status/${encodeURIComponent(no)}`;
        const res = await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const root: unknown = res?.data;
        const nested =
          root && typeof root === 'object' && 'data' in root
            ? (root as { data?: unknown }).data
            : undefined;
        const payload: unknown = nested ?? root;

        if (isStatusResult(payload)) {
          setResult(payload);
          setNotFound(false);
        } else {
          setResult(null);
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [API, session],
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const no = ticketNo.trim();
    await performSearch(no);
    const q = new URLSearchParams();
    q.set('ticketNo', no);
    router.replace(`${pathname}?${q.toString()}`);
  };

  const handlePhoneSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    await performPhoneListSearch(digits, { syncUrl: true });
  };

  useEffect(() => {
    if (!initialTicketFromUrl) return;
    if (status === 'loading') return;
    performSearch(initialTicketFromUrl);
  }, [initialTicketFromUrl, status, performSearch]);

  useEffect(() => {
    setPhoneDetailExpandedKey(null);
  }, [phoneQueryKey]);

  useEffect(() => {
    if (initialTicketFromUrl) return;
    if (!initialPhoneFromUrl) return;
    if (status === 'loading') return;
    const digits = initialPhoneFromUrl.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 12) return;
    void performPhoneListSearch(digits, { syncUrl: false });
  }, [initialTicketFromUrl, initialPhoneFromUrl, status, performPhoneListSearch]);

  /** หลังล็อกอิน: ดึงข้อมูลเต็มอีกครั้งเมื่อเคยได้ masked แบบไม่มี token */
  useEffect(() => {
    if (status === 'loading') return;
    const token = (session as { accessToken?: string } | null)?.accessToken;
    if (!token) return;
    if (!result || result.detailLevel !== 'masked') return;
    const no =
      ticketNo.trim() || initialTicketFromUrl || (typeof result.ticketNo === 'string' ? result.ticketNo : '');
    if (!no) return;
    performSearch(no);
  }, [status, session, result, ticketNo, initialTicketFromUrl, performSearch]);

  const statusStyle = result
    ? STATUS_LABEL[result.status] ?? {
        text: result.status,
        badgeClass: STATUS_BADGE_FALLBACK,
      }
    : null;
  const issueImages = result ? normalizeIssueImages(result.images) : [];
  /** สาธารณะแบบมาสก์: ไม่มี URL รูป — ใช้ issueImageCount วาดการ์ดทึบ */
  const isPublicMasked = result?.detailLevel === 'masked';
  const maskedImageSlots =
    isPublicMasked && typeof result?.issueImageCount === 'number'
      ? Math.max(0, Math.min(20, result.issueImageCount))
      : 0;

  const role = (session?.user as { role?: string })?.role;
  const isStaffFlow =
    Boolean(session) &&
    ["STAFF", "ADMIN", "SUPERVISOR"].includes(role || "");

  const phoneRowsForTable = useMemo(
    () => (searchMode === 'phone' && phoneList !== undefined ? phoneList : []),
    [searchMode, phoneList],
  );

  const phonePagingFilterKey = `${phoneQueryKey}|${phoneRowsForTable.length}`;

  const {
    page: phonePage,
    setPage: setPhonePage,
    pageSize: phonePageSize,
    setPageSize: setPhonePageSize,
    paginatedItems: phonePageRows,
    totalPages: phoneTotalPages,
    filteredCount: phoneFilteredCount,
  } = useDashboardTablePaging(phoneRowsForTable, phonePagingFilterKey);

  const cardOuterClass = `${GLASS_SECTION} transition-all duration-300`;
  const headerClass = "flex items-center gap-2 mb-4 pb-3 border-b border-[var(--glass-card-border)]";
  const headerIconClass = "text-blue-500";
  const headerTitleClass = "text-base font-bold glass-text";
  const inputClass = "form-input-glass w-full text-sm pr-4 py-2.5 min-w-0";
  const pageContent = (
        <div
          className={`w-full space-y-4 animate-fade-up min-w-0 ${
            isStaffFlow
              ? "max-w-5xl mx-auto"
              : searchMode === "phone" && phoneList !== undefined && phoneList.length > 0
                ? "max-w-6xl mx-auto"
                : "max-w-3xl mx-auto"
          }`}
        >
          {/* มุมมองสาธารณะ — แจ้งเตือน บนสุด (เหนือฟอร์มค้นหา) เมื่อมีผลแบบมาสก์ */}
          {result && isPublicMasked && (
            <section
              role="alert"
              aria-live="polite"
              className="rounded-2xl border border-amber-300 bg-amber-50 backdrop-blur-md px-4 py-3.5 sm:px-5 sm:py-4 shadow-lg ring-1 ring-amber-200/80 dark:border-amber-500/45 dark:bg-amber-950/55 dark:shadow-amber-950/40 dark:ring-amber-400/15"
            >
              <div className="flex gap-3 sm:gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-300"
                  aria-hidden
                >
                  <AlertTriangle size={22} strokeWidth={2} className="drop-shadow-sm" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200/95">
                    มุมมองสาธารณะ
                  </p>
                  <p className="mt-1 text-sm leading-snug text-amber-900/90 dark:text-amber-50/95">
                    ข้อมูลส่วนตัวและรูปถูกมาสก์ —{' '}
                    <Link
                      href="/login"
                      className="font-semibold text-amber-800 underline decoration-amber-500/70 underline-offset-2 hover:text-[var(--glass-text)] hover:decoration-amber-700 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/80 dark:text-amber-200 dark:decoration-amber-400/70 dark:hover:decoration-amber-200 dark:focus-visible:outline-amber-400/80"
                    >
                      เข้าสู่ระบบ
                    </Link>{' '}
                    เพื่อดูข้อมูลจริง
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Page Title for public view */}
          {!session && !result && phoneList === undefined && (
             <div className="text-center mb-8">
               <h1 className="text-2xl sm:text-3xl font-bold tracking-tight glass-text mb-2 mt-4 drop-shadow-sm">
                 ตรวจสอบสถานะการแจ้งซ่อม
               </h1>
               <p className="text-[13px] sm:text-sm glass-muted-text max-w-lg mx-auto leading-relaxed">
                 {searchMode === 'phone'
                   ? 'กรอกเบอร์โทรผู้แจ้งซ่อมเพื่อดูรายการใบแจ้งทั้งหมดของเบอร์นั้น เรียงจากล่าสุด พร้อมสถานะปัจจุบัน'
                   : 'ค้นหาด้วยเลขที่ใบแจ้งซ่อมเพื่อดูรายละเอียดการแจ้งแบบเต็ม'}
               </p>
             </div>
          )}

          {/* ค้นหา — สลับโหมดเบอร์โทร / เลขที่ใบ */}
          <section className={cardOuterClass}>
            <div className={`${headerClass} flex-wrap gap-y-2`}>
              <div className="flex items-center gap-2 min-w-0">
                <Search size={18} className={headerIconClass} />
                <h2 className={headerTitleClass}>ตรวจสอบสถานะ</h2>
              </div>
              <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSearchMode('phone');
                    setResult(null);
                    setNotFound(false);
                    setTicketNo('');
                  }}
                  className={cn(
                    "h-auto min-h-10 cursor-pointer rounded-xl px-3 py-2 text-xs font-medium transition-all active:scale-95",
                    searchMode === 'phone'
                      ? 'bg-blue-600/90 text-white shadow-lg ring-1 ring-white/10 hover:bg-blue-600/90'
                      : `${GLASS_BUTTON_SECONDARY} glass-text`,
                  )}
                >
                  ตามเบอร์โทร
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSearchMode('ticket');
                    setPhoneList(undefined);
                    setPhoneSearchError(null);
                  }}
                  className={cn(
                    "h-auto min-h-10 cursor-pointer rounded-xl px-3 py-2 text-xs font-medium transition-all active:scale-95",
                    searchMode === 'ticket'
                      ? 'bg-blue-600/90 text-white shadow-lg ring-1 ring-white/10 hover:bg-blue-600/90'
                      : `${GLASS_BUTTON_SECONDARY} glass-text`,
                  )}
                >
                  ตามเลขที่ใบ
                </Button>
              </div>
            </div>

            {searchMode === 'phone' ? (
              <form
                onSubmit={handlePhoneSearch}
                className={`flex flex-col sm:flex-row gap-3 w-full ${
                  isStaffFlow ? "sm:items-center max-w-md sm:max-w-lg" : ""
                }`}
              >
                <div
                  className={`relative min-w-0 flex-1 ${
                    isStaffFlow ? "sm:max-w-sm" : ""
                  }`}
                >
                  <Phone
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-600 dark:text-slate-400"
                    aria-hidden
                  />
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="tel"
                    className={cn(inputClass, "has-leading-icon min-h-11 h-auto")}
                    placeholder="เบอร์โทรผู้แจ้ง (9–12 หลัก)"
                    aria-label="เบอร์โทรผู้แจ้งซ่อม"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary inline-flex h-auto min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-60 sm:w-auto"
                >
                  {loading ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden /> : <Search size={16} />}
                  <span>ค้นหา</span>
                </Button>
              </form>
            ) : (
              <form
                onSubmit={handleSearch}
                className={`flex flex-col sm:flex-row gap-3 w-full ${
                  isStaffFlow ? "sm:items-center max-w-md sm:max-w-lg" : ""
                }`}
              >
                <div
                  className={`relative min-w-0 flex-1 ${
                    isStaffFlow ? "sm:max-w-sm" : ""
                  }`}
                >
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-600 dark:text-slate-400"
                    aria-hidden
                  />
                  <Input
                    type="text"
                    className={cn(inputClass, "has-leading-icon min-h-11 h-auto")}
                    placeholder="กรอกเลขที่ใบแจ้งซ่อม"
                    aria-label="เลขที่ใบแจ้งซ่อม"
                    value={ticketNo}
                    onChange={(e) => setTicketNo(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary inline-flex h-auto min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-60 sm:w-auto"
                >
                  {loading ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden /> : <Search size={16} />}
                  <span>ตรวจสอบ</span>
                </Button>
              </form>
            )}
          </section>

          {/* Info card (public) */}
          {!session && (
            <section
              role="note"
              aria-label="คำแนะนำการดูข้อมูลแบบสาธารณะ"
              className="rounded-2xl border border-sky-300 bg-sky-50 backdrop-blur-md px-4 py-3 shadow-lg ring-1 ring-sky-200/80 dark:border-sky-500/25 dark:bg-sky-950/35 dark:shadow-sky-950/30 dark:ring-sky-400/10"
            >
              <div className="flex gap-3 sm:gap-4 items-start">
                <Info
                  size={18}
                  className="text-sky-700 shrink-0 mt-0.5 dark:text-sky-300"
                  aria-hidden
                />
                <div className="min-w-0 space-y-1 text-[13px] sm:text-sm leading-relaxed">
                  <p className="glass-text">
                    {searchMode === 'phone'
                      ? 'การค้นตามเบอร์แสดงเลขที่ใบ อาการคร่าวๆ วันที่แจ้ง และสถานะ — ใช้ปุ่ม «สาเหตุ / วิธีแก้» เพื่อเปิดดูรายละเอียดจากผู้ซ่อม (เมื่อมีการบันทึก) และวางเมาส์บนข้อความอาการยาวเพื่อดูเต็ม'
                      : 'ในโหมดสาธารณะ ข้อมูลส่วนตัวและรูปภาพจะแสดงแบบมาสก์'}
                  </p>
                  <p className="glass-muted-text">
                    เข้าสู่ระบบเพื่อดูข้อมูลจริง
                    {" "}
                    <Link
                      href="/login"
                      className="font-semibold text-sky-800 underline decoration-sky-500/60 underline-offset-2 hover:text-[var(--glass-text)] hover:decoration-sky-700 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500/80 dark:text-sky-200 dark:decoration-sky-400/60 dark:hover:decoration-sky-200 dark:focus-visible:outline-sky-400/80"
                    >
                      ที่นี่
                    </Link>
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ผลลัพธ์ — ค้นหาตามเบอร์ */}
          {phoneSearchError && !loading && searchMode === 'phone' && (
            <section
              role="alert"
              className={`${cardOuterClass} border-rose-300 bg-rose-50 text-left py-4 dark:border-rose-500/30 dark:bg-rose-950/25`}
            >
              <p className="text-sm text-rose-800 dark:text-rose-100">{phoneSearchError}</p>
            </section>
          )}

          {phoneList !== undefined && !loading && searchMode === 'phone' && phoneList.length === 0 && !phoneSearchError && (
            <section className={`${cardOuterClass} text-center py-8`}>
              <p className={`text-sm font-medium glass-muted-text`}>
                ไม่พบรายการแจ้งซ่อมสำหรับเบอร์นี้
              </p>
              <p className={`text-xs mt-1 glass-subtle-text`}>
                ตรวจสอบตัวเลขอีกครั้ง หรือลองค้นด้วยเลขที่ใบแจ้งซ่อม
              </p>
            </section>
          )}

          {phoneList !== undefined && phoneList.length > 0 && searchMode === 'phone' && (
            <section
              className="glass-card px-4 sm:px-6 md:px-8 py-5 sm:py-6"
              aria-label="รายการแจ้งซ่อมตามเบอร์โทร"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--glass-card-border)]">
                <h2 className="text-base sm:text-lg font-bold glass-text tracking-tight">รายการแจ้งซ่อม</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                  <p className="text-xs sm:text-[13px] glass-muted-text order-2 sm:order-1 leading-snug">
                    พบ{" "}
                    <span className="font-semibold glass-text tabular-nums">
                      {phoneFilteredCount}
                    </span>{" "}
                    รายการ · ทุกสถานะ · เรียงวันที่แจ้งล่าสุดก่อน
                  </p>
                  <DataTablePageSizeSelect
                    value={phonePageSize}
                    onChange={setPhonePageSize}
                    className="w-full sm:w-32 min-h-11 order-1 sm:order-2"
                    aria-label="จำนวนแถวต่อหน้า"
                  />
                </div>
              </div>
              <div className="rounded-xl border border-[var(--glass-card-border)] overflow-hidden -mx-0.5 sm:mx-0">
              <div className="overflow-x-auto">
                {/*
                  ใช้ table-auto + w-[1%] ที่คอลัมน์แคบ (เลขที่ใบ/วัน/สถานะ/ปุ่ม) และ min-w ที่คอลัมน์อาการ
                  แทน table-fixed เพื่อไม่ให้ผลรวม rem เกินความกว้างตารางแล้วบีบคอลัมน์กลางจนเหลือทีละตัวอักษร
                */}
                <table className="w-full max-w-full table-auto text-left text-[0.8125rem] sm:text-[0.9375rem]">
                  <thead>
                    <tr className="border-b border-[var(--glass-card-border)] glass-muted-text text-[11px] sm:text-xs uppercase tracking-wide bg-[var(--glass-input-bg)]">
                      <th className="py-2.5 pl-3 pr-2 font-semibold align-bottom whitespace-nowrap w-[1%]">
                        เลขที่ใบ
                      </th>
                      <th className="py-2.5 pr-2 sm:pr-3 font-semibold align-bottom min-w-48 sm:min-w-72 w-[42%] max-w-xl">
                        อาการเสีย (คร่าวๆ)
                      </th>
                      <th className="py-2.5 px-2 font-semibold align-bottom whitespace-nowrap w-[1%] text-center sm:text-left">
                        วันที่แจ้ง
                      </th>
                      <th className="py-2.5 px-2 font-semibold align-bottom whitespace-nowrap w-[1%] text-center sm:text-left">
                        สถานะ
                      </th>
                      <th className="py-2.5 pl-2 pr-3 font-semibold align-bottom whitespace-nowrap w-[1%] text-center sm:text-left">
                        สาเหตุ / วิธีแก้
                      </th>
                      {isStaffFlow ? (
                        <th className="py-2.5 pl-2 pr-3 font-semibold text-right align-bottom whitespace-nowrap w-[1%]">
                          จัดการ
                        </th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody className="glass-text">
                    {phonePageRows.map((row, rowIdx) => {
                      const st =
                        STATUS_LABEL[row.status] ?? {
                          text: row.status,
                          badgeClass: STATUS_BADGE_FALLBACK,
                        };
                      const issue = formatIssuePreview(row.issueSummary);
                      const rowKey = phoneFixDetailRowKey(row);
                      const expanded = phoneDetailExpandedKey === rowKey;
                      const detailPanelId = `job-fix-detail-p${phonePage}-i${rowIdx}`;
                      const tableColSpan = isStaffFlow ? 6 : 5;
                      return (
                        <Fragment key={`${phonePage}-${rowIdx}-${rowKey}`}>
                          <tr className="border-b border-[var(--glass-card-border)] last:border-0">
                            <td className="py-2.5 pl-3 pr-2 align-top font-mono text-[0.8125rem] sm:text-sm glass-text tracking-tight whitespace-nowrap" title={row.ticketNo?.trim() || undefined}>
                              {row.ticketNo?.trim() ? row.ticketNo : '–'}
                            </td>
                            <td className="py-2.5 pr-2 sm:pr-3 glass-muted-text align-top min-w-48 sm:min-w-72 wrap-break-word">
                              {issue.clipped ? (
                                <TextHoverTooltip text={issue.full}>
                                  <span className="block cursor-help wrap-break-word leading-snug">
                                    {issue.short}
                                  </span>
                                </TextHoverTooltip>
                              ) : (
                                <span className="block wrap-break-word leading-snug">
                                  {issue.short}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 glass-muted-text whitespace-nowrap text-[0.8125rem] sm:text-[0.9375rem] align-top tabular-nums text-center sm:text-left">
                              {formatReportDateTime(row.reportDate)}
                            </td>
                            <td className="py-2.5 px-2 align-top text-center sm:text-left">
                              <span className={`inline-flex text-[11px] sm:text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ${st.badgeClass}`}>
                                {st.text}
                              </span>
                            </td>
                            <td className="py-2.5 pl-2 pr-3 align-top text-center sm:text-right">
                              <Button
                                type="button"
                                id={`${detailPanelId}-btn`}
                                aria-expanded={expanded}
                                aria-controls={detailPanelId}
                                onClick={() =>
                                  setPhoneDetailExpandedKey(expanded ? null : rowKey)
                                }
                                className={cn(GLASS_BUTTON_PRIMARY_TABLE_ROW, "cursor-pointer")}
                                aria-label={expanded ? `ซ่อนรายละเอียดสาเหตุ ใบ ${row.ticketNo ?? ''}` : `สาเหตุและวิธีแก้ ใบ ${row.ticketNo ?? ''}`}
                              >
                                <Wrench size={14} className="shrink-0 text-white/95" aria-hidden />
                                <span className="whitespace-nowrap text-left leading-tight">
                                  {expanded ? 'ซ่อนรายละเอียด' : 'สาเหตุ / วิธีแก้'}
                                </span>
                                {expanded ? (
                                  <ChevronUp size={14} className="shrink-0 text-white/90" aria-hidden />
                                ) : (
                                  <ChevronDown size={14} className="shrink-0 text-white/90" aria-hidden />
                                )}
                              </Button>
                            </td>
                            {isStaffFlow ? (
                              <td className="py-2.5 pl-2 pr-3 text-right whitespace-nowrap align-middle">
                                {typeof row.id === 'number' ? (
                                  <Link
                                    href={`/dashboard/jobs/${row.id}`}
                                    className={`${GLASS_BUTTON_SECONDARY} inline-flex items-center justify-center min-h-10 px-2.5 py-1.5 text-[11px] sm:text-xs cursor-pointer font-medium whitespace-nowrap shrink-0 rounded-lg`}
                                  >
                                    รายละเอียด
                                  </Link>
                                ) : (
                                  <span className="glass-subtle-text text-xs">–</span>
                                )}
                              </td>
                            ) : null}
                          </tr>
                          {expanded ? (
                            <tr className="border-b border-[var(--glass-card-border)] bg-[var(--glass-card-bg)]">
                              <td colSpan={tableColSpan} className="px-3 pb-4 pt-0">
                                <div
                                  id={detailPanelId}
                                  role="region"
                                  aria-labelledby={`${detailPanelId}-btn`}
                                  className="glass-card backdrop-blur-md px-4 py-4 shadow-inner"
                                >
                                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--glass-card-border)]">
                                    <Wrench size={16} className="text-blue-400 shrink-0" aria-hidden />
                                    <p className="text-sm font-semibold glass-text">
                                      รายละเอียดจากผู้ซ่อม
                                      {row.ticketNo?.trim() ? (
                                        <span className="font-normal glass-muted-text ms-1 break-all">
                                          ({row.ticketNo.trim()})
                                        </span>
                                      ) : null}
                                    </p>
                                  </div>
                                  <CauseFixFields
                                    compact
                                    cause={row.cause}
                                    fixMethod={row.fixMethod}
                                    emptyHint="ยังไม่มีการบันทึกสาเหตุหรือวิธีแก้ไข — ข้อมูลจะแสดงเมื่อผู้รับผิดชอบกรอกขณะปิดงาน"
                                  />
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <DataTablePagination
                page={phonePage}
                totalPages={phoneTotalPages}
                pageSize={phonePageSize}
                filteredCount={phoneFilteredCount}
                onPageChange={setPhonePage}
              />
              </div>
            </section>
          )}

          {/* ผลลัพธ์ — เลขที่ใบ */}
          {notFound && !loading && searchMode === 'ticket' && (
            <section className={`${cardOuterClass} text-center py-8`}>
              <p className={`text-sm font-medium glass-muted-text`}>ไม่พบข้อมูลใบแจ้งซ่อมเลขที่นี้</p>
              <p className={`text-xs mt-1 glass-subtle-text`}>กรุณาตรวจสอบเลขที่ใบแจ้งซ่อมอีกครั้ง</p>
            </section>
          )}

          {result && (
            <>
              {!session && (
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight glass-text text-left">
                  ข้อมูลการแจ้งข้อขัดข้อง
                </h1>
              )}

              {/* การ์ดบน: สถานะ / วันที่ / ผู้แจ้ง / สถานที่ */}
              <section className={GLASS_SECTION}>
                <div className="flex flex-wrap items-start justify-between gap-3 pb-5 mb-5 border-b border-[var(--glass-card-border)]">
                  <div className="min-w-0">
                    <p className="text-xs font-medium glass-muted-text">เลขที่ใบแจ้งซ่อม</p>
                    <p className="text-base font-semibold glass-text break-all mt-0.5">{result.ticketNo}</p>
                  </div>
                  {session && result.id != null && (
                    <Link
                      href={`/dashboard/jobs/${result.id}`}
                      className={`${GLASS_BUTTON_SECONDARY} px-3 py-2 text-xs sm:text-sm shrink-0 cursor-pointer font-medium`}
                    >
                      ดูรายละเอียดในแดชบอร์ด
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 items-start">
                  <span className="text-sm glass-muted-text">สถานะปัจจุบัน</span>
                  {statusStyle && (
                    <span
                      className={`text-sm font-semibold px-3 py-1 rounded-full justify-self-end whitespace-nowrap ${statusStyle.badgeClass}`}
                    >
                      {statusStyle.text}
                    </span>
                  )}

                  <span className="text-sm glass-muted-text">วันที่แจ้ง</span>
                  <div className="flex items-center gap-1.5 justify-self-end text-sm glass-text min-w-0">
                    <Calendar size={16} className="glass-subtle-text shrink-0" aria-hidden />
                    <span className="break-all text-right">{formatReportDateTime(result.reportDate)}</span>
                  </div>
                </div>

                {(result.reporterName || result.reporterPhone || result.reporterEmail) && (
                  <div className="mt-6 pt-5 border-t border-[var(--glass-card-border)]">
                    <p className="text-sm glass-muted-text mb-3">ผู้แจ้ง</p>
                    <div className="flex items-start gap-4 sm:gap-5">
                      {isStaffFlow && !isPublicMasked ? (
                        <ReporterAvatarGlass
                          imageUrl={result.reporter?.image}
                          reporterUserId={result.reporter?.id}
                          name={result.reporterName}
                        />
                      ) : (
                        <User
                          size={22}
                          className="glass-muted-text shrink-0 mt-1"
                          aria-hidden
                        />
                      )}
                      <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                        {result.reporterName ? (
                          <p className="text-sm font-medium glass-text">{result.reporterName}</p>
                        ) : null}
                        {result.reporterPhone ? (
                          <div className="flex items-center gap-2 text-sm glass-muted-text">
                            <Phone size={16} className="glass-subtle-text shrink-0" aria-hidden />
                            {isPublicMasked ? (
                              <span className="break-all select-none">{result.reporterPhone}</span>
                            ) : (
                              <a
                                href={`tel:${result.reporterPhone.replace(/\s/g, '')}`}
                                className="hover:text-[var(--glass-text)] transition-colors break-all cursor-pointer"
                              >
                                {result.reporterPhone}
                              </a>
                            )}
                          </div>
                        ) : null}
                        {result.reporterEmail ? (
                          <div className="flex items-center gap-2 text-sm glass-muted-text">
                            <Mail size={16} className="glass-subtle-text shrink-0" aria-hidden />
                            {isPublicMasked ? (
                              <span className="break-all select-none">{result.reporterEmail}</span>
                            ) : (
                              <a
                                href={`mailto:${result.reporterEmail}`}
                                className="hover:text-[var(--glass-text)] transition-colors break-all cursor-pointer"
                              >
                                {result.reporterEmail}
                              </a>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                {(result.province || result.district || result.location) && (
                  <div className="mt-6 pt-5 border-t border-[var(--glass-card-border)]">
                    <p className="text-sm glass-muted-text mb-2">สถานที่</p>
                    <div className="flex items-start gap-2 min-w-0">
                      <MapPin size={18} className="glass-muted-text shrink-0 mt-0.5" aria-hidden />
                      <span className="text-sm glass-text leading-relaxed wrap-break-word">
                        {(() => {
                          const placeText = [result.province, result.district, result.location]
                            .filter(Boolean)
                            .join(' • ');
                          return isPublicMasked ? maskFirstAndLastChar(placeText) : placeText;
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </section>

              {/* การ์ดกลาง: รายละเอียดปัญหา */}
              <section className={GLASS_SECTION}>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--glass-card-border)]">
                  <FileText size={18} className="text-blue-500 shrink-0" aria-hidden />
                  <h2 className="text-base font-bold glass-text">รายละเอียดปัญหา</h2>
                </div>
                <p className="text-sm glass-muted-text whitespace-pre-wrap wrap-break-word leading-relaxed min-h-12">
                  {result.description?.trim() ? result.description : '–'}
                </p>
              </section>

              <section className={GLASS_SECTION} aria-labelledby="status-cause-fix-heading">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--glass-card-border)]">
                  <Wrench size={18} className="text-blue-500 shrink-0" aria-hidden />
                  <h2 id="status-cause-fix-heading" className="text-base font-bold glass-text">
                    สาเหตุและวิธีการแก้ไข
                  </h2>
                </div>
                <CauseFixFields
                  cause={result.cause}
                  fixMethod={result.fixMethod}
                  emptyHint="ยังไม่มีการบันทึกสาเหตุหรือวิธีแก้ไข — ข้อมูลจะแสดงเมื่อผู้รับผิดชอบกรอกขณะปิดงาน"
                />
              </section>

              {/* รูปภาพประกอบ — เต็ม: แสดงรูป | public มาสก์: การ์ดทึบตามจำนวน */}
              {!isPublicMasked &&
                result.id != null &&
                Array.isArray(result.images) &&
                issueImages.length > 0 && (
                <section className={GLASS_SECTION}>
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--glass-card-border)]">
                    <ImageIcon size={18} className="text-blue-400 shrink-0" aria-hidden />
                    <h2 className="text-base font-bold glass-text">รูปภาพประกอบ</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(result.images as unknown[]).map((src, i) => {
                      if (typeof src !== 'string' || !src.trim()) return null;
                      return (
                      <div
                        key={i}
                        className="relative w-full aspect-video glass-card overflow-hidden bg-[var(--glass-card-bg)]"
                      >
                        <ManagedImage
                          src={dashboardJobImagePath(result.id!, "issue", i)}
                          alt={`รูปภาพประกอบ ${i + 1}`}
                          fill
                          sizes={MANAGED_IMAGE_SIZES.galleryResponsiveSm}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      );
                    })}
                  </div>
                </section>
              )}
              {isPublicMasked && maskedImageSlots > 0 && (
                <section className={GLASS_SECTION} aria-label="รูปภาพประกอบ (ซ่อนในหน้าสาธารณะ)">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--glass-card-border)]">
                    <ImageIcon size={18} className="text-blue-400 shrink-0" aria-hidden />
                    <h2 className="text-base font-bold glass-text">รูปภาพประกอบ</h2>
                    <span className="text-xs font-medium glass-subtle-text">({maskedImageSlots} รูป — ซ่อนในหน้าสาธารณะ)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: maskedImageSlots }).map((_, i) => (
                      <div
                        key={`placeholder-${i}`}
                        className="relative w-full aspect-video rounded-xl border border-[var(--glass-card-border)] bg-slate-100 shadow-inner dark:bg-[#0a0f1a]"
                        aria-hidden
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
  );

  if (status === 'loading') {
    return (
      <PublicRouteLoading
        title="กำลังตรวจสอบสิทธิ์..."
        description="กำลังเตรียมข้อมูลสำหรับตรวจสอบสถานะ"
      />
    );
  }

  if (session) {
    return (
      <DashboardLayoutShell>
        <div className="animate-fade-up w-full min-w-0 space-y-6">
          <div className="min-w-0">
            {result ? (
              <>
                <h1 className="text-lg sm:text-xl font-bold glass-text">
                  ข้อมูลการแจ้งข้อขัดข้อง
                </h1>
                <p className="text-sm mt-0.5 glass-muted-text break-all">
                  เลขที่ {result.ticketNo}
                </p>
              </>
            ) : phoneList !== undefined && phoneList.length > 0 ? (
              <>
                <h1 className="text-lg sm:text-xl font-bold glass-text">
                  รายการแจ้งซ่อมตามเบอร์โทร
                </h1>
                <p className="text-sm mt-0.5 glass-muted-text">
                  พบ {phoneList.length} รายการ · เรียงจากวันที่แจ้งล่าสุด
                </p>
              </>
            ) : (
              <>
                <h1 className="text-lg sm:text-xl font-bold truncate glass-text">
                  ตรวจสอบสถานะการแจ้งซ่อม
                </h1>
                <p className="text-sm mt-0.5 glass-muted-text">
                  ค้นหาตามเบอร์โทรผู้แจ้ง หรือเลขที่ใบแจ้งซ่อม
                </p>
              </>
            )}
          </div>
          <div className="w-full min-w-0">
            {pageContent}
          </div>
        </div>
      </DashboardLayoutShell>
    );
  }

  return (
    <PublicLayoutShell subtitle="ตรวจสอบสถานะการแจ้งซ่อม">
      {pageContent}
    </PublicLayoutShell>
  );
}

export default function StatusPage() {
  // Next.js requirement: useSearchParams ต้องอยู่ภายใน Suspense boundary
  return (
    <Suspense
      fallback={
        <PublicRouteLoading
          title="กำลังโหลดหน้าตรวจสอบสถานะ..."
          description="กำลังเตรียมแบบฟอร์มค้นหาและผลลัพธ์"
        />
      }
    >
      <StatusPageInner />
    </Suspense>
  );
}
