"use client";

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Search, MapPin, Calendar, FileText, User, Phone, Mail, Image as ImageIcon, AlertTriangle, Info } from 'lucide-react';
import DashboardLayoutShell from '@/components/DashboardLayoutShell';
import PublicLayoutShell from '@/components/PublicLayoutShell';
import Link from 'next/link';

const STATUS_LABEL: Record<string, { text: string; badgeClass: string }> = {
  PENDING: {
    text: "รอดำเนินการ",
    badgeClass:
      "border border-amber-400/30 bg-amber-500/15 text-amber-200 backdrop-blur-md shadow-inner",
  },
  IN_PROGRESS: {
    text: "กำลังแก้ไข",
    badgeClass:
      "border border-blue-400/30 bg-blue-500/15 text-blue-200 backdrop-blur-md shadow-inner",
  },
  RESOLVED: {
    text: "แล้วเสร็จ",
    badgeClass:
      "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200 backdrop-blur-md shadow-inner",
  },
};

const STATUS_BADGE_FALLBACK =
  "border border-white/10 bg-slate-500/20 text-slate-200 backdrop-blur-md shadow-inner";

/** ปุ่มรอง — Dark Glass (สอดคล้อง AGENTS: Cancel slate) */
const GLASS_BUTTON_SECONDARY =
  "inline-flex items-center justify-center rounded-xl border border-white/15 bg-slate-800/50 backdrop-blur-md text-slate-100 shadow-lg hover:bg-slate-700/55 hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500/50 transition-all active:scale-95";

const GLASS_SECTION =
  'rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl px-5 sm:px-7 py-5 sm:py-6';

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

/** รูปโปรไฟล์ผู้แจ้ง (เจ้าหน้าที่ที่ล็อกอิน) — Dark Glass + fallback */
function ReporterAvatarGlass({
  imageUrl,
  name,
}: {
  imageUrl: string | null | undefined;
  name: string | null | undefined;
}) {
  const [imgError, setImgError] = useState(false);
  const trimmed = imageUrl?.trim();
  const showImg = Boolean(trimmed) && !imgError;

  return (
    <div className="relative flex h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-slate-800/50 shadow-inner ring-1 ring-white/10 backdrop-blur-md sm:h-22 sm:w-22">
      {showImg ? (
        <img
          src={trimmed}
          alt={name ? `รูปโปรไฟล์ ${name}` : "ผู้แจ้ง"}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-slate-800/80 text-slate-500"
          aria-hidden
        >
          <User size={40} strokeWidth={1.35} className="opacity-95" />
        </div>
      )}
    </div>
  );
}

function StatusPageInner() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
  const initialTicketFromUrl = searchParams.get('ticketNo') ?? '';
  const [ticketNo, setTicketNo] = useState(initialTicketFromUrl);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    id?: number;
    ticketNo: string;
    status: string;
    reportDate: string | null;
    detailLevel?: 'masked' | 'full';
    description?: string | null;
    province?: string | null;
    district?: string | null;
    location?: string | null;
    reporterName?: string | null;
    reporterPhone?: string | null;
    reporterEmail?: string | null;
    images?: unknown;
    /** จำนวนรูป (โหมด public มาสก์ — ไม่ส่ง URL รูป) */
    issueImageCount?: number;
    reporter?: { image: string | null } | null;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);

  const isStatusResult = (v: unknown): v is {
    id?: number;
    ticketNo: string;
    status: string;
    reportDate: string | null;
    detailLevel?: 'masked' | 'full';
    description?: string | null;
    province?: string | null;
    district?: string | null;
    location?: string | null;
    reporterName?: string | null;
    reporterPhone?: string | null;
    reporterEmail?: string | null;
    images?: unknown;
    issueImageCount?: number;
    reporter?: { image: string | null } | null;
  } => {
    if (!v || typeof v !== 'object') return false;
    const o = v as Record<string, unknown>;
    return typeof o.ticketNo === 'string' && typeof o.status === 'string';
  };

  const performSearch = useCallback(
    async (no: string) => {
      if (!no) return;
      setLoading(true);
      setResult(null);
      setNotFound(false);
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
  };

  useEffect(() => {
    if (!initialTicketFromUrl) return;
    if (status === 'loading') return;
    performSearch(initialTicketFromUrl);
  }, [initialTicketFromUrl, status, performSearch]);

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

  const isDark = true;
  const cardOuterClass = isDark
    ? `${GLASS_SECTION} transition-all duration-300`
    : "bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 px-5 sm:px-7 py-5 sm:py-6 shadow-md transition-all duration-300";
  const headerClass = isDark ? "flex items-center gap-2 mb-4 pb-3 border-b border-white/10" : "flex items-center gap-2 mb-4 pb-3 border-b border-slate-100";
  const headerIconClass = isDark ? "text-blue-400" : "text-blue-600";
  const headerTitleClass = isDark ? "text-base font-bold text-white" : "text-base font-bold text-slate-800";
  const inputClass = isDark 
    ? "w-full rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-sm pl-10 pr-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-500 min-w-0" 
    : "w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400 min-w-0";
  const pageContent = (
        <div
          className={`w-full space-y-4 animate-fade-up min-w-0 ${
            isStaffFlow ? "max-w-5xl mx-auto" : "max-w-3xl mx-auto"
          }`}
        >
          {/* มุมมองสาธารณะ — แจ้งเตือน บนสุด (เหนือฟอร์มค้นหา) เมื่อมีผลแบบมาสก์ */}
          {result && isPublicMasked && (
            <section
              role="alert"
              aria-live="polite"
              className="rounded-2xl border border-amber-500/45 bg-amber-950/55 backdrop-blur-md px-4 py-3.5 sm:px-5 sm:py-4 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400/15"
            >
              <div className="flex gap-3 sm:gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/15 text-amber-300"
                  aria-hidden
                >
                  <AlertTriangle size={22} strokeWidth={2} className="drop-shadow-sm" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/95">
                    มุมมองสาธารณะ
                  </p>
                  <p className="mt-1 text-sm leading-snug text-amber-50/95">
                    ข้อมูลส่วนตัวและรูปถูกมาสก์ —{' '}
                    <Link
                      href="/login"
                      className="font-semibold text-amber-200 underline decoration-amber-400/70 underline-offset-2 hover:text-white hover:decoration-amber-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/80"
                    >
                      เข้าสู่ระบบ
                    </Link>{' '}
                    เพื่อดูข้อมูลจริง
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Page Title for public view (Show only when not logged in และยังไม่มีผลค้นหา) */}
          {!session && !result && (
             <div className="text-center mb-8">
               <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 mt-4 drop-shadow-sm">
                 ตรวจสอบสถานะการแจ้งซ่อม
               </h1>
               <p className="text-[13px] sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                 ค้นหาสถานะใบแจ้งซ่อมด้วยเลขที่ Ticket เพื่อติดตามการดำเนินการ
               </p>
             </div>
          )}

          {/* ค้นหา */}
          <section className={cardOuterClass}>
            <div className={headerClass}>
              <Search size={18} className={headerIconClass} />
              <h2 className={headerTitleClass}>ตรวจสอบสถานะ</h2>
            </div>
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
                <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  className={inputClass}
                  placeholder="กรอกเลขที่ใบแจ้งซ่อม"
                  value={ticketNo}
                  onChange={e => setTicketNo(e.target.value)}
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary whitespace-nowrap disabled:opacity-60 w-full sm:w-auto">
                {loading ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"/> : <Search size={16} />}
                ตรวจสอบ
              </button>
            </form>
          </section>

          {/* Info card (public): ข้อมูลส่วนตัว/รูปถูกมาสก์ */}
          {!session && (
            <section
              role="note"
              aria-label="คำแนะนำการดูข้อมูลแบบสาธารณะ"
              className="rounded-2xl border border-sky-500/25 bg-sky-950/35 backdrop-blur-md px-4 py-3 shadow-lg shadow-sky-950/30 ring-1 ring-sky-400/10"
            >
              <div className="flex gap-3 sm:gap-4 items-start">
                <Info
                  size={18}
                  className="text-sky-300 shrink-0 mt-0.5"
                  aria-hidden
                />
                <div className="min-w-0 space-y-1 text-[13px] sm:text-sm leading-relaxed">
                  <p className="text-slate-200/95">
                    ในโหมดสาธารณะ ข้อมูลส่วนตัวและรูปภาพจะแสดงแบบมาสก์
                  </p>
                  <p className="text-slate-400">
                    เข้าสู่ระบบเพื่อดูข้อมูลจริง
                    {" "}
                    <Link
                      href="/login"
                      className="font-semibold text-sky-200 underline decoration-sky-400/60 underline-offset-2 hover:text-white hover:decoration-sky-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/80"
                    >
                      ที่นี่
                    </Link>
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ผลลัพธ์ */}
          {notFound && !loading && (
            <section className={`${cardOuterClass} text-center py-8`}>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>ไม่พบข้อมูลใบแจ้งซ่อมเลขที่นี้</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>กรุณาตรวจสอบเลขที่ใบแจ้งซ่อมอีกครั้ง</p>
            </section>
          )}

          {result && (
            <>
              {!session && (
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white text-left">
                  ข้อมูลการแจ้งข้อขัดข้อง
                </h1>
              )}

              {/* การ์ดบน: สถานะ / วันที่ / ผู้แจ้ง / สถานที่ */}
              <section className={GLASS_SECTION}>
                <div className="flex flex-wrap items-start justify-between gap-3 pb-5 mb-5 border-b border-white/10">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-400">เลขที่ใบแจ้งซ่อม</p>
                    <p className="text-base font-semibold text-white break-all mt-0.5">{result.ticketNo}</p>
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
                  <span className="text-sm text-slate-400">สถานะปัจจุบัน</span>
                  {statusStyle && (
                    <span
                      className={`text-sm font-semibold px-3 py-1 rounded-full justify-self-end whitespace-nowrap ${statusStyle.badgeClass}`}
                    >
                      {statusStyle.text}
                    </span>
                  )}

                  <span className="text-sm text-slate-400">วันที่แจ้ง</span>
                  <div className="flex items-center gap-1.5 justify-self-end text-sm text-slate-200 min-w-0">
                    <Calendar size={16} className="text-slate-400 shrink-0" aria-hidden />
                    <span className="break-all text-right">{formatReportDateTime(result.reportDate)}</span>
                  </div>
                </div>

                {(result.reporterName || result.reporterPhone || result.reporterEmail) && (
                  <div className="mt-6 pt-5 border-t border-white/10">
                    <p className="text-sm text-slate-400 mb-3">ผู้แจ้ง</p>
                    <div className="flex items-start gap-4 sm:gap-5">
                      {isStaffFlow && !isPublicMasked ? (
                        <ReporterAvatarGlass
                          imageUrl={result.reporter?.image}
                          name={result.reporterName}
                        />
                      ) : (
                        <User
                          size={22}
                          className="text-slate-400 shrink-0 mt-1"
                          aria-hidden
                        />
                      )}
                      <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                        {result.reporterName ? (
                          <p className="text-sm font-medium text-white">{result.reporterName}</p>
                        ) : null}
                        {result.reporterPhone ? (
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Phone size={16} className="text-slate-500 shrink-0" aria-hidden />
                            {isPublicMasked ? (
                              <span className="break-all select-none">{result.reporterPhone}</span>
                            ) : (
                              <a
                                href={`tel:${result.reporterPhone.replace(/\s/g, '')}`}
                                className="hover:text-white transition-colors break-all cursor-pointer"
                              >
                                {result.reporterPhone}
                              </a>
                            )}
                          </div>
                        ) : null}
                        {result.reporterEmail ? (
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Mail size={16} className="text-slate-500 shrink-0" aria-hidden />
                            {isPublicMasked ? (
                              <span className="break-all select-none">{result.reporterEmail}</span>
                            ) : (
                              <a
                                href={`mailto:${result.reporterEmail}`}
                                className="hover:text-white transition-colors break-all cursor-pointer"
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
                  <div className="mt-6 pt-5 border-t border-white/10">
                    <p className="text-sm text-slate-400 mb-2">สถานที่</p>
                    <div className="flex items-start gap-2 min-w-0">
                      <MapPin size={18} className="text-slate-400 shrink-0 mt-0.5" aria-hidden />
                      <span className="text-sm text-slate-200 leading-relaxed wrap-break-word">
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
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                  <FileText size={18} className="text-blue-400 shrink-0" aria-hidden />
                  <h2 className="text-base font-bold text-white">รายละเอียดปัญหา</h2>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap wrap-break-word leading-relaxed min-h-12">
                  {result.description?.trim() ? result.description : '–'}
                </p>
              </section>

              {/* รูปภาพประกอบ — เต็ม: แสดงรูป | public มาสก์: การ์ดทึบตามจำนวน */}
              {!isPublicMasked && issueImages.length > 0 && (
                <section className={GLASS_SECTION}>
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                    <ImageIcon size={18} className="text-blue-400 shrink-0" aria-hidden />
                    <h2 className="text-base font-bold text-white">รูปภาพประกอบ</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {issueImages.map((src, i) => (
                      <div
                        key={`${src.slice(0, 48)}-${i}`}
                        className="relative w-full aspect-video rounded-xl border border-white/10 overflow-hidden bg-slate-800/50"
                      >
                        <img
                          src={src}
                          alt={`รูปภาพประกอบ ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {isPublicMasked && maskedImageSlots > 0 && (
                <section className={GLASS_SECTION} aria-label="รูปภาพประกอบ (ซ่อนในหน้าสาธารณะ)">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                    <ImageIcon size={18} className="text-blue-400 shrink-0" aria-hidden />
                    <h2 className="text-base font-bold text-white">รูปภาพประกอบ</h2>
                    <span className="text-xs font-medium text-slate-500">({maskedImageSlots} รูป — ซ่อนในหน้าสาธารณะ)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: maskedImageSlots }).map((_, i) => (
                      <div
                        key={`placeholder-${i}`}
                        className="relative w-full aspect-video rounded-xl border border-white/10 bg-[#0a0f1a] shadow-inner"
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full mb-3" />
        <div className="text-sm font-medium text-slate-500">กำลังโหลด...</div>
      </div>
    );
  }

  if (session) {
    return (
      <DashboardLayoutShell>
        <div className="animate-fade-up w-full min-w-0 space-y-6">
          <div className="min-w-0">
            {result ? (
              <>
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  ข้อมูลการแจ้งข้อขัดข้อง
                </h1>
                <p className="text-sm mt-0.5 text-slate-400 break-all">
                  เลขที่ {result.ticketNo}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-lg sm:text-xl font-bold truncate text-white">
                  ตรวจสอบสถานะการแจ้งซ่อม
                </h1>
                <p className="text-sm mt-0.5 text-slate-400">
                  ค้นหาสถานะใบแจ้งซ่อมด้วยเลขที่ Ticket ที่ได้รับจากระบบ
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
          <div className="animate-spin w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full mb-3" />
          <div className="text-sm font-medium text-slate-500">กำลังโหลด...</div>
        </div>
      }
    >
      <StatusPageInner />
    </Suspense>
  );
}
