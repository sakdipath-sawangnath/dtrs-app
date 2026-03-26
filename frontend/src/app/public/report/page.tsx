"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { toastSuccess, toastError, toastWarning } from '@/lib/toast';
import { MapPin, User as UserIcon, UserCircle, MessageSquare, Camera, Phone, Search, AlertCircle, Info } from 'lucide-react';
import PublicLayoutShell from '@/components/PublicLayoutShell';
import DashboardLayoutShell from '@/components/DashboardLayoutShell';
import Select from 'react-select';
import { getReactSelectGlassStyles } from '@/lib/reactSelectGlassStyles';

interface Site { id: number; province: string; district: string; agency: string; }
type ReporterPayload = {
  name: string;
  email?: string | null;
  position?: string | null;
  image?: string | null;
};

function isReporterPayload(v: unknown): v is ReporterPayload {
  return !!v && typeof v === 'object' && 'name' in v && typeof (v as { name?: unknown }).name === 'string';
}

/** ดึงข้อความจาก Nest + axios (รองรับ error.message / error.error.message / details) */
function extractApiErrorMessage(err: unknown): string {
  const res = (err as { response?: { data?: unknown } })?.response?.data;
  if (!res || typeof res !== 'object') return '';
  const d = res as Record<string, unknown>;
  if (typeof d.message === 'string') return d.message;
  if (Array.isArray(d.message)) return d.message.join(', ');
  const inner = d.error;
  if (inner && typeof inner === 'object') {
    const e = inner as Record<string, unknown>;
    if (typeof e.message === 'string') return e.message;
    const details = e.details;
    if (Array.isArray(details)) {
      return details
        .map((item: unknown) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'message' in item) {
            const o = item as { field?: string; message?: string };
            return [o.field, o.message].filter(Boolean).join(': ');
          }
          return String(item);
        })
        .join('; ');
    }
  }
  return '';
}

function ReportPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

  const [sites, setSites] = useState<Site[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [agencies, setAgencies] = useState<string[]>([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [sitesError, setSitesError] = useState<string | null>(null);
  const [sitesFetched, setSitesFetched] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [phoneSearched, setPhoneSearched] = useState(false);
  const [isUserFound, setIsUserFound] = useState(false);

  const contractStatus = searchParams?.get('contractStatus');
  const isOutOfContract = contractStatus === 'OUT_OF_CONTRACT';

  const [form, setForm] = useState({
    province: '', district: '', location: '',
    reporterName: '', reporterPhone: '', reporterEmail: '',
    reporterPosition: '',
    description: '',
  });

  const [images, setImages] = useState<(File | null)[]>([null, null, null]);
  const [previews, setPreviews] = useState<(string | null)[]>([null, null, null]);
  const fileRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const reporterAvatarRef = useRef<HTMLInputElement>(null);
  const [reporterAvatarFile, setReporterAvatarFile] = useState<File | null>(null);
  const [reporterAvatarLocalUrl, setReporterAvatarLocalUrl] = useState<string | null>(null);
  const [remoteReporterAvatarUrl, setRemoteReporterAvatarUrl] = useState<string | null>(null);
  const [reporterEmailError, setReporterEmailError] = useState<string | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);

  const role = (session?.user as { role?: string })?.role;
  const isStaffFlow =
    Boolean(session) &&
    ['STAFF', 'ADMIN', 'SUPERVISOR'].includes(role || '');

  // โหลดรายการสถานที่ (Sites): สาธารณะ — หลังตรวจสอบเบอร์สำเร็จ; เจ้าหน้าที่ที่ล็อกอิน — โหลดทันที
  const fetchSites = async (): Promise<void> => {
    // กันยิงซ้ำ
    if (sitesFetched || sitesLoading) return;

    setSitesLoading(true);
    setSitesError(null);
    try {
      const r = await axios.get<Site[]>(`${API}/sites`, { timeout: 10000 });
      const root: unknown = r?.data;
      const nested =
        root && typeof root === 'object' && 'data' in root
          ? (root as { data?: unknown }).data
          : undefined;
      const payload: unknown = nested ?? root;

      const arr = Array.isArray(payload) ? (payload as unknown[]) : [];
      const cleaned = arr.filter((s): s is Site => {
        if (!s || typeof s !== 'object') return false;
        const o = s as Record<string, unknown>;
        return (
          typeof o.id === 'number' &&
          typeof o.province === 'string' &&
          typeof o.district === 'string' &&
          typeof o.agency === 'string'
        );
      });

      setSites(cleaned);
      setSitesFetched(true);
      if (cleaned.length === 0) {
        setSitesError('ไม่พบข้อมูลสถานที่ในระบบ (Site) — กรุณา seed ข้อมูลพื้นที่ก่อน');
      }
    } catch {
      setSitesError('โหลดรายการสถานที่ไม่สำเร็จ');
      setSites([]);
    } finally {
      setSitesLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'authenticated' || !isStaffFlow) return;
    void fetchSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isStaffFlow]);

  useEffect(() => {
    return () => {
      if (reporterAvatarLocalUrl) URL.revokeObjectURL(reporterAvatarLocalUrl);
    };
  }, [reporterAvatarLocalUrl]);

  // --- 1. Load Draft from Session Storage ---
  useEffect(() => {
    setSitesLoading(false);
    
    try {
      const saved = sessionStorage.getItem('reportFormDraft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.form) {
          // Merge specifically to avoid stale missing fields
          setForm(prev => ({ ...prev, ...parsed.form }));
        }
        if (parsed?.isUserFound) setIsUserFound(parsed.isUserFound);
        if (parsed?.phoneSearched) setPhoneSearched(parsed.phoneSearched);
        
        // หลังกดตรวจสอบเบอร์แล้ว (พบหรือไม่พบในระบบ) ต้องโหลด sites
        if (parsed?.phoneSearched) {
          fetchSites();
        }
      }
    } catch (e) {
      console.error("Failed to parse report form draft", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 2. Save Draft to Session Storage ---
  useEffect(() => {
    // Only save logic if the user has actually started interacting
    if (phoneSearched || form.reporterPhone) {
      const draft = { form, isUserFound, phoneSearched };
      sessionStorage.setItem('reportFormDraft', JSON.stringify(draft));
    }
  }, [form, isUserFound, phoneSearched]);

  useEffect(() => {
    if (form.province) {
      setDistricts([...new Set(sites.filter(s => s.province === form.province).map(s => s.district))]);
      setForm(p => ({ ...p, district: '', location: '' }));
    }
  }, [form.province, sites]);

  useEffect(() => {
    if (form.district && form.province) {
      const raw = sites
        .filter((s) => s.province === form.province && s.district === form.district)
        .map((s) => (s.agency ?? "").trim())
        .filter(Boolean);
      const unique = [...new Set(raw)].sort((a, b) => a.localeCompare(b, "th"));
      setAgencies(unique);
      setForm((p) => ({ ...p, location: "" }));
    } else {
      setAgencies([]);
    }
  }, [form.district, form.province, sites]);

  const handlePhoneSearch = async () => {
    const phone = form.reporterPhone.trim();
    if (!phone) {
      toastWarning('กรุณาระบุ', 'เบอร์โทรศัพท์ก่อนกดค้นหา');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      toastWarning('เบอร์โทรศัพท์', 'กรุณาระบุเบอร์ให้ถูกต้อง (10 หลัก)');
      return;
    }

    setIsSearchingPhone(true);
    try {
      const res = await axios.get(`${API}/public/users/reporter-by-phone/${phone}`);
      const root: unknown = res?.data;
      const nested =
        root && typeof root === 'object' && 'data' in root
          ? (root as { data?: unknown }).data
          : undefined;
      // รองรับทั้ง backend ที่ส่ง { data: {...} } และแบบส่ง {...} ตรง ๆ
      const payload: unknown = nested ?? root;

      if (isReporterPayload(payload)) {
        setForm(p => ({
          ...p,
          reporterName: payload.name,
          reporterEmail: (payload.email || '').replace(/\s/g, ''),
          reporterPosition: (payload.position ?? '').trim(),
        }));
        setRemoteReporterAvatarUrl(
          typeof payload.image === 'string' && payload.image.trim() ? payload.image.trim() : null,
        );
        setReporterAvatarFile(null);
        setReporterAvatarLocalUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setIsUserFound(true);
        toastSuccess('ดึงข้อมูลผู้แจ้งสำเร็จ', 1500);
        // เมื่อผ่านการตรวจสอบเบอร์โทรแล้วค่อยโหลดรายการสถานที่
        fetchSites();
      } else {
        setForm(p => ({ ...p, reporterName: '', reporterEmail: '', reporterPosition: '' }));
        setRemoteReporterAvatarUrl(null);
        setReporterAvatarFile(null);
        setReporterAvatarLocalUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setIsUserFound(false);
        toastWarning(
          'ไม่พบประวัติในระบบ',
          'กรุณากรอกชื่อ-สกุล (และอีเมลถ้ามี) แล้วดำเนินการแจ้งซ่อมได้',
        );
        fetchSites();
      }
      setPhoneSearched(true);
    } catch {
      toastWarning(
        'ไม่พบประวัติในระบบ',
        'กรุณากรอกชื่อ-สกุล (และอีเมลถ้ามี) แล้วดำเนินการแจ้งซ่อมได้',
      );
      setForm(p => ({ ...p, reporterName: '', reporterEmail: '', reporterPosition: '' }));
      setRemoteReporterAvatarUrl(null);
      setReporterAvatarFile(null);
      setReporterAvatarLocalUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setIsUserFound(false);
      setPhoneSearched(true);
      fetchSites();
    } finally {
      setIsSearchingPhone(false);
    }
  };

  const handleImage = (i: number, file: File | null) => {
    const imgs = [...images]; imgs[i] = file;
    const pv = [...previews]; pv[i] = file ? URL.createObjectURL(file) : null;
    setImages(imgs); setPreviews(pv);
  };

  const handleReporterAvatarChange = (file: File | null) => {
    setReporterAvatarFile(file);
    setReporterAvatarLocalUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const reporterAvatarDisplayUrl = reporterAvatarLocalUrl || remoteReporterAvatarUrl || null;

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const parseEmailAvailablePayload = (root: unknown): { available?: boolean } => {
    if (!root || typeof root !== 'object') return {};
    const d = root as Record<string, unknown>;
    if ('data' in d && d.data && typeof d.data === 'object') {
      return d.data as { available?: boolean };
    }
    return root as { available?: boolean };
  };

  const checkReporterEmailAvailability = async (
    emailTrim: string,
    phoneTrim: string,
  ): Promise<boolean> => {
    if (!EMAIL_PATTERN.test(emailTrim)) return false;
    if (!/^\d{10}$/.test(phoneTrim)) return true;
    const r = await axios.get(`${API}/public/users/email-available`, {
      params: { email: emailTrim, phone: phoneTrim },
      timeout: 10000,
    });
    const root: unknown = r?.data;
    const nested =
      root && typeof root === 'object' && 'data' in root
        ? (root as { data?: unknown }).data
        : undefined;
    const payload = parseEmailAvailablePayload(nested ?? root);
    return payload.available === true;
  };

  const validateReporterEmailOnBlur = async () => {
    const emailTrim = form.reporterEmail.trim();
    const phoneTrim = form.reporterPhone.trim();
    if (!emailTrim) {
      setReporterEmailError('กรุณาระบุอีเมล');
      return;
    }
    if (!EMAIL_PATTERN.test(emailTrim)) {
      setReporterEmailError('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }
    if (!/^\d{10}$/.test(phoneTrim)) {
      setReporterEmailError(null);
      return;
    }
    setEmailChecking(true);
    setReporterEmailError(null);
    try {
      const ok = await checkReporterEmailAvailability(emailTrim, phoneTrim);
      if (!ok) {
        setReporterEmailError('อีเมลนี้ถูกใช้โดยผู้ใช้อื่นแล้ว');
      }
    } catch {
      setReporterEmailError(null);
    } finally {
      setEmailChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneOk = /^\d{10}$/.test(form.reporterPhone.trim());
    if (!phoneOk) {
      toastWarning('เบอร์โทรศัพท์', 'กรุณากรอกเบอร์โทรให้ถูกต้อง (10 หลัก)');
      return;
    }
    if (!isStaffFlow) {
      if (!phoneSearched) {
        toastWarning('ข้อมูลผู้แจ้งไม่ครบ', 'กรุณากด "ตรวจสอบ" หลังกรอกเบอร์โทรศัพท์');
        return;
      }
      if (!isUserFound && !form.reporterName.trim()) {
        toastWarning('ข้อมูลผู้แจ้งไม่ครบ', 'กรุณาระบุชื่อ-สกุลผู้แจ้ง');
        return;
      }
    }
    if (isStaffFlow && !isUserFound && !form.reporterName.trim()) {
      toastWarning('ไม่พบประวัติจากเบอร์', 'กรุณาระบุชื่อ-สกุลผู้แจ้ง');
      return;
    }
    const emailTrim = form.reporterEmail.trim();
    if (!emailTrim) {
      setReporterEmailError('กรุณาระบุอีเมล');
      toastWarning('อีเมล', 'กรุณาระบุอีเมล');
      return;
    }
    if (!EMAIL_PATTERN.test(emailTrim)) {
      setReporterEmailError('รูปแบบอีเมลไม่ถูกต้อง');
      toastWarning('อีเมล', 'รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }
    const phoneTrim = form.reporterPhone.trim();
    try {
      const emailFree = await checkReporterEmailAvailability(emailTrim, phoneTrim);
      if (!emailFree) {
        setReporterEmailError('อีเมลนี้ถูกใช้โดยผู้ใช้อื่นแล้ว');
        toastWarning('อีเมล', 'อีเมลนี้ถูกใช้โดยผู้ใช้อื่นแล้ว กรุณาใช้อีเมลอื่น');
        return;
      }
    } catch {
      toastWarning('การเชื่อมต่อ', 'ไม่สามารถตรวจสอบอีเมลได้ ลองอีกครั้ง');
      return;
    }
    if (!sitesFetched) {
      toastWarning('กรุณารอสักครู่', 'ระบบกำลังโหลดรายการสถานที่');
      return;
    }
    if (!form.province || !form.district || !form.location) {
      toastWarning('ข้อมูลสถานที่ไม่ครบ', 'กรุณาเลือก จังหวัด / อำเภอ / สถานที่ ให้ครบถ้วน');
      return;
    }
    if (!form.description || form.description.trim().length < 10) {
      toastWarning('รายละเอียดไม่ครบ', 'รายละเอียดต้องมีอย่างน้อย 10 ตัวอักษร');
      return;
    }
    if (!images[0] || !images[1]) {
      toastWarning('รูปภาพไม่ครบ', 'กรุณาแนบรูปภาพอย่างน้อย 2 รูปแรก');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        let str = typeof value === 'string' ? value.trim() : String(value ?? '');
        if (key === 'reporterEmail') str = str.replace(/\s/g, '');
        formData.append(key, str);
      });
      formData.append('isOutOfContract', isOutOfContract ? 'true' : 'false');
      formData.append('reportDate', new Date().toISOString());

      if (reporterAvatarFile) {
        formData.append('reporterAvatar', reporterAvatarFile);
      }
      
      images.forEach((img) => {
        if (img) {
          formData.append('images', img);
        }
      });

      const headers: Record<string, string> = {};
      const token = (session as { accessToken?: string })?.accessToken;
      if (token) headers.Authorization = `Bearer ${token}`;
      // ไม่ต้องกำหนด Content-Type เอง เพื่อให้ axios ใส่ boundary ให้ถูกต้อง
      const res = await axios.post(`${API}/public/jobs`, formData, { headers });
      const root: unknown = res?.data;
      const nested =
        root && typeof root === 'object' && 'data' in root
          ? (root as { data?: unknown }).data
          : undefined;
      const created = (nested ?? root) as { ticketNo?: string } | undefined;
      const ticketNo = created?.ticketNo as string | undefined;

      // เคลียร์ Draft ทิ้งเมื่อสำเร็จ
      sessionStorage.removeItem('reportFormDraft');

      if (ticketNo) {
        toastSuccess(`แจ้งซ่อมสำเร็จ! เลขที่ใบแจ้งซ่อมของคุณคือ ${ticketNo}`, 2200);
        setTimeout(() => {
          router.push(`/public/status?ticketNo=${encodeURIComponent(ticketNo)}`);
        }, 800);
      } else {
        toastSuccess('แจ้งซ่อมสำเร็จ! ทีมช่างจะดำเนินการในเร็วๆ นี้', 1500);
      }
      setForm({
        province: '',
        district: '',
        location: '',
        reporterName: '',
        reporterPhone: '',
        reporterEmail: '',
        reporterPosition: '',
        description: '',
      });
      setImages([null, null, null]); setPreviews([null, null, null]);
      setReporterAvatarFile(null);
      setRemoteReporterAvatarUrl(null);
      setReporterAvatarLocalUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setReporterEmailError(null);
      setPhoneSearched(false);
      setIsUserFound(false);
    } catch (err: unknown) {
      const text = extractApiErrorMessage(err);
      toastError('เกิดข้อผิดพลาด', text || 'ไม่สามารถส่งข้อมูลได้');
    } finally { setSubmitting(false); }
  };

  const provinces = [...new Set(sites.map((s) => s.province))];
  const isPhoneValid = /^\d{10}$/.test(form.reporterPhone.trim());
  /** สาธารณะ: หลังกดตรวจสอบแล้ว — พบผู้แจ้ง หรือ ไม่พบแต่จะกรอกชื่อเอง; เจ้าหน้าที่: เบอร์ถูกต้องพอ */
  const canProceed =
    isPhoneValid &&
    (isStaffFlow ||
      isUserFound ||
      (phoneSearched && !isUserFound));
  const nameOk =
    isUserFound || form.reporterName.trim().length > 0;
  const emailTrimForUi = form.reporterEmail.trim();
  const emailFormatOk = EMAIL_PATTERN.test(emailTrimForUi);
  const emailOk =
    emailFormatOk && emailTrimForUi.length > 0 && !reporterEmailError;
  const canSubmit =
    canProceed &&
    nameOk &&
    emailOk &&
    !emailChecking &&
    sitesFetched &&
    !!form.province &&
    !!form.district &&
    !!form.location &&
    form.description.trim().length >= 10 &&
    !!images[0] &&
    !!images[1];
  
  // Design Tokens (Standardized on Dark Glassmorphism)
  const isDark = true;
  const cardOuterClass = isDark
    ? "bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 px-5 sm:px-7 py-5 sm:py-6 shadow-2xl transition-all duration-300"
    : "bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 px-5 sm:px-7 py-5 sm:py-6 shadow-md transition-all duration-300";
  const headerClass = isDark ? "flex items-center gap-2 mb-5 pb-3 border-b border-white/10" : "flex items-center gap-2 mb-5 pb-3 border-b border-slate-100";
  const headerIconClass = isDark ? "text-blue-400" : "text-blue-600";
  const headerTitleClass = isDark ? "text-base font-bold text-white" : "text-base font-bold text-slate-800";
  const labelClass = isDark ? "block text-sm font-semibold mb-1.5 text-slate-300" : "block text-sm font-semibold mb-1.5 text-slate-700";
  const inputClass = isDark 
    ? "w-full rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-sm px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-500"
    : "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400";

  const customStyles = getReactSelectGlassStyles(isDark ? 'dark' : 'light');

  const formInner = (
    <div
      className={`w-full space-y-6 animate-fade-up min-w-0 ${
        isStaffFlow ? "max-w-5xl mx-auto" : "max-w-3xl mx-auto"
      }`}
    >
      
      {/* Page Title for public view */}
      {!session && (
         <div className="text-center mb-8">
           <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 mt-4 drop-shadow-sm">
             แจ้งปัญหาการใช้งาน
           </h1>
           <p className="text-[13px] sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
             กรุณากรอกข้อมูลเบื้องต้น เพื่อความรวดเร็วในการให้ทีมช่างเข้าตรวจสอบและแก้ไขปัญหา
           </p>
         </div>
      )}

      {sitesError && (
        <div className="alert alert-error rounded-2xl" role="alert">
          <AlertCircle size={18} aria-hidden="true" /> 
          <span>{sitesError}</span>
        </div>
      )}

        <form id="report-form" onSubmit={handleSubmit} className="w-full space-y-6">

          {/* 1. ผู้แจ้ง (Phone Lookup) */}
          <section className={cardOuterClass}>
            <div className={headerClass}>
              <UserIcon size={18} className={headerIconClass} />
              <h2 className={headerTitleClass}>ข้อมูลผู้แจ้ง</h2>
            </div>
            <div
              role="note"
              aria-label="คำแนะนำการกรอกข้อมูลผู้แจ้ง"
              className="mb-5 flex gap-3 rounded-xl border border-sky-500/25 bg-sky-950/35 px-3.5 py-3 sm:px-4 sm:py-3.5 backdrop-blur-sm"
            >
              <Info
                className="h-5 w-5 shrink-0 text-sky-400 mt-0.5"
                strokeWidth={2}
                aria-hidden="true"
              />
              <div className="min-w-0 space-y-2 text-[13px] sm:text-sm leading-snug text-slate-300">
                {isStaffFlow ? (
                  <p>
                    กด &quot;ตรวจสอบ&quot; เพื่อดึงข้อมูลจากระบบ หรือกรอกแทนได้ — ส่งแล้วจะอัปเดตผู้แจ้งและผูกกับใบแจ้งซ่อมนี้
                  </p>
                ) : (
                  <>
                    <p className="text-slate-200/95">
                      กรอกเบอร์ → กด &quot;ตรวจสอบ&quot; — มีบัญชีในระบบจะดึงข้อมูลให้
                    </p>
                    <p className="text-slate-400 border-t border-white/5 pt-2">
                      ยังไม่มีบัญชี: กรอกชื่อ อีเมล ตำแหน่ง และรูปโปรไฟล์ — ส่งแล้วระบบจะสร้าง/อัปเดตบัญชีผู้แจ้งซ่อมให้เอง
                    </p>
                  </>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                <div
                  className={`flex flex-col sm:flex-row gap-3 w-full ${
                    isStaffFlow ? "sm:items-center max-w-md sm:max-w-lg" : ""
                  }`}
                >
                  <div
                    className={`relative min-w-0 flex-1 ${
                      isStaffFlow ? "sm:max-w-[16rem]" : ""
                    }`}
                  >
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="tel" 
                      required
                      maxLength={10}
                      placeholder="กรอกเบอร์โทรศัพท์มือถือ"
                      className={`${inputClass} pl-10`}
                      value={form.reporterPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setForm({ ...form, reporterPhone: val });
                        if(phoneSearched) setPhoneSearched(false);
                        if(isUserFound) setIsUserFound(false);
                        setReporterAvatarFile(null);
                        setRemoteReporterAvatarUrl(null);
                        setReporterAvatarLocalUrl((prev) => {
                          if (prev) URL.revokeObjectURL(prev);
                          return null;
                        });
                        setReporterEmailError(null);
                        // สาธารณะ: เปลี่ยนเบอร์ต้องตรวจสอบใหม่ — รีเซ็ตสถานที่; เจ้าหน้าที่โหลดสถานที่ไว้แล้ว ไม่ต้องรีเซ็ต
                        if (!isStaffFlow && sitesFetched) {
                          setSitesFetched(false);
                          setSites([]);
                          setDistricts([]);
                          setAgencies([]);
                          setForm(p => ({ ...p, province: '', district: '', location: '' }));
                          setSitesError(null);
                          setSitesLoading(false);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handlePhoneSearch();
                        }
                      }}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={handlePhoneSearch}
                    disabled={isSearchingPhone || !form.reporterPhone}
                    className="btn btn-primary whitespace-nowrap disabled:opacity-60 w-full sm:w-auto"
                    aria-label="ตรวจสอบเบอร์โทรศัพท์"
                  >
                    {isSearchingPhone ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"/> : <Search size={16} />}
                    ตรวจสอบ
                  </button>
                </div>
                {!phoneSearched && isStaffFlow && (
                  <p className="text-xs text-slate-500 mt-2">กรอกเบอร์ 10 หลักได้เลย หรือกด &quot;ตรวจสอบ&quot; หากต้องการดึงข้อมูลผู้แจ้งจากระบบ</p>
                )}
                {!phoneSearched && !isStaffFlow && (
                  <p className="text-xs text-slate-500 mt-2">
                    กรอกเบอร์ 10 หลักแล้วกด &quot;ตรวจสอบ&quot; — หากมีข้อมูลในระบบจะดึงชื่อให้อัตโนมัติ
                    หากยังไม่มีบัญชี ให้กรอกชื่อ-สกุลและอีเมล
                  </p>
                )}
              </div>

              {(isUserFound ||
                (isPhoneValid && !isUserFound && (phoneSearched || isStaffFlow))) && (
                <div className="md:col-span-2 animate-fade-in mt-2 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="flex flex-col items-center sm:items-start gap-2 shrink-0">
                      <span className={labelClass}>รูปโปรไฟล์</span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => reporterAvatarRef.current?.click()}
                          className={`relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors cursor-pointer min-h-[112px] min-w-[112px] ${
                            isDark
                              ? 'border-white/15 bg-slate-900/50 hover:border-blue-400/40'
                              : 'border-slate-300 bg-slate-50 hover:border-blue-400'
                          }`}
                          aria-label="เลือกรูปโปรไฟล์ผู้แจ้ง"
                        >
                          {reporterAvatarDisplayUrl ? (
                            <img
                              src={reporterAvatarDisplayUrl}
                              alt="รูปโปรไฟล์ผู้แจ้ง"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserCircle className="h-14 w-14 text-slate-500" aria-hidden="true" />
                          )}
                        </button>
                        <input
                          ref={reporterAvatarRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleReporterAvatarChange(e.target.files?.[0] ?? null)
                          }
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>ชื่อ-สกุล <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          required
                          readOnly={isUserFound}
                          placeholder="ชื่อ และ นามสกุล"
                          className={`${inputClass} ${isUserFound ? (isDark ? 'bg-slate-800/30 text-slate-500 cursor-not-allowed border-white/5 opacity-60' : 'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200 focus:ring-0 shadow-inner') : ''}`}
                          value={form.reporterName}
                          onChange={(e) => setForm({ ...form, reporterName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="reporter-email-input">
                          อีเมล <span className="text-red-500">*</span>
                        </label>
                        <input 
                          id="reporter-email-input"
                          type="email" 
                          required
                          readOnly={isUserFound && !!form.reporterEmail.trim()}
                          placeholder="example@email.com"
                          autoComplete="email"
                          aria-invalid={reporterEmailError ? true : undefined}
                          aria-describedby={reporterEmailError ? 'reporter-email-error' : undefined}
                          className={`${inputClass} ${isUserFound && !!form.reporterEmail.trim() ? (isDark ? 'bg-slate-800/30 text-slate-500 cursor-not-allowed border-white/5 opacity-60' : 'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200 focus:ring-0 shadow-inner') : ''} ${reporterEmailError ? 'border-red-500/60 focus:ring-red-500/20' : ''}`}
                          value={form.reporterEmail}
                          onChange={(e) => {
                            setReporterEmailError(null);
                            setForm({ ...form, reporterEmail: e.target.value.replace(/\s/g, '') });
                          }}
                          onBlur={() => void validateReporterEmailOnBlur()}
                        />
                        {emailChecking && (
                          <p className="text-xs text-slate-500 mt-1.5" aria-live="polite">
                            กำลังตรวจสอบอีเมลซ้ำ…
                          </p>
                        )}
                        {reporterEmailError && !emailChecking && (
                          <p id="reporter-email-error" className="text-xs text-red-400 mt-1.5" role="alert">
                            {reporterEmailError}
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>
                          ตำแหน่ง <span className="text-slate-400 font-normal text-xs ml-1">(ถ้ามี)</span>
                        </label>
                        <input
                          type="text"
                          readOnly={isUserFound}
                          placeholder="เช่น เจ้าหน้าที่ IT, ผู้ประสานงาน"
                          maxLength={200}
                          className={`${inputClass} ${isUserFound ? (isDark ? 'bg-slate-800/30 text-slate-500 cursor-not-allowed border-white/5 opacity-60' : 'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200 focus:ring-0 shadow-inner') : ''}`}
                          value={form.reporterPosition}
                          onChange={(e) =>
                            setForm({ ...form, reporterPosition: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Conditional Animation Wrapper for Steps 2-4 */}
          {canProceed && (
            <div className="space-y-6 animate-fade-up" style={{ animationDuration: '500ms' }}>
              {/* 2. สถานที่ */}
              <section className={cardOuterClass}>
            <div className={headerClass}>
              <MapPin size={18} className={headerIconClass} />
              <h2 className={headerTitleClass}>สถานที่เกิดปัญหา</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>จังหวัด <span className="text-red-500">*</span></label>
                <Select
                  options={provinces.map(p => ({ value: p, label: p }))}
                  styles={customStyles}
                  placeholder="– เลือกจังหวัด –"
                  menuPosition="fixed"
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  value={form.province ? { value: form.province, label: form.province } : null}
                  onChange={(opt: { value: string; label: string } | null) => setForm({ ...form, province: opt?.value || '' })}
                  isDisabled={sitesLoading}
                  noOptionsMessage={() => "ไม่พบข้อมูล"}
                  isClearable
                />
              </div>
              <div>
                <label className={labelClass}>อำเภอ <span className="text-red-500">*</span></label>
                <Select
                  options={districts.map(d => ({ value: d, label: d }))}
                  styles={customStyles}
                  placeholder="– เลือกอำเภอ –"
                  menuPosition="fixed"
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  value={form.district ? { value: form.district, label: form.district } : null}
                  onChange={(opt: { value: string; label: string } | null) => setForm({ ...form, district: opt?.value || '' })}
                  isDisabled={!form.province}
                  noOptionsMessage={() => "กรุณาเลือกจังหวัดก่อน"}
                  isClearable
                />
              </div>
              <div>
                <label className={labelClass}>สถานที่ / หน่วยงาน <span className="text-red-500">*</span></label>
                <Select
                  options={agencies.map(a => ({ value: a, label: a }))}
                  styles={customStyles}
                  placeholder="– เลือกสถานที่ –"
                  menuPosition="fixed"
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  value={form.location ? { value: form.location, label: form.location } : null}
                  onChange={(opt: { value: string; label: string } | null) => setForm({ ...form, location: opt?.value || '' })}
                  isDisabled={!form.district}
                  noOptionsMessage={() => "กรุณาเลือกอำเภอก่อน"}
                  isClearable
                />
              </div>
            </div>
          </section>

              {/* 3. รายละเอียดปัญหา */}
              <section className={cardOuterClass}>
            <div className={headerClass}>
              <MessageSquare size={18} className={headerIconClass} />
              <h2 className={headerTitleClass}>รายละเอียดปัญหา</h2>
            </div>
            <div>
              <label className={labelClass} htmlFor="report-description">
                อาการที่พบ <span className="text-red-500">*</span>
              </label>
              <p
                id="report-description-hint"
                className="text-xs text-slate-500 leading-relaxed mb-2 max-w-3xl"
              >
                ระบบจะรับเมื่อมีอย่างน้อย <span className="text-slate-400 font-medium">10 ตัวอักษร</span>
                &nbsp;กรุณาเขียนให้ครบอย่างน้อยหนึ่งประโยค เช่น อาการที่เห็น (เสียง ภาพ ไฟ ฯลฯ) จุดที่เกิด
                (ห้อง/ชั้น/อุปกรณ์) เวลาที่พบ หรือความถี่ของปัญหา
              </p>
              <textarea
                id="report-description"
                required
                minLength={10}
                className={`${inputClass} min-h-[140px] resize-y`}
                placeholder="ระบุอาการ, จุดสังเกต หรือปัญหาที่พบให้ละเอียด..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={5}
                aria-describedby="report-description-hint"
              />
            </div>
          </section>

              {/* 4. รูปภาพประกอบ */}
              <section className={cardOuterClass}>
            <div className={headerClass}>
              <Camera size={18} className={headerIconClass} />
              <div className="flex flex-col">
                 <h2 className={headerTitleClass}>รูปภาพประกอบ</h2>
                 <p className="text-xs text-slate-500 font-normal">ถ่ายรูปจุดที่เกิดปัญหา (บังคับ 2 รูปแรก)</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex flex-col group">
                  <p className={`text-xs mb-1.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    รูปที่ {i + 1} {i < 2 && <span className="text-red-500">*</span>}
                  </p>
                    <div
                      onClick={() => fileRefs[i].current?.click()}
                      className={`relative aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-200 cursor-pointer group ${isDark ? 'hover:border-blue-400/50' : 'hover:border-blue-400'}`}
                    style={{ 
                      borderColor: previews[i] ? 'transparent' : (isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1'), 
                      background: previews[i] ? 'transparent' : (isDark ? 'rgba(30,41,59,0.3)' : '#f8fafc') 
                    }}
                    role="button"
                      tabIndex={0}
                      aria-label={`อัปโหลดรูปภาพที่ ${i + 1}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileRefs[i].current?.click();
                      }
                    }}
                  >
                    {!previews[i] && (
                        <div className={`absolute inset-0 transition-colors ${isDark ? 'group-hover:bg-blue-400/10' : 'group-hover:bg-blue-50/50'}`} />
                    )}
                    {previews[i] ? (
                      <>
                        <img src={previews[i]!} alt={`รูปภาพประกอบที่ ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <span className="text-white text-xs font-semibold px-2 py-1 bg-black/50 rounded-lg backdrop-blur-sm">เปลี่ยนรูปภาพ</span>
                        </div>
                      </>
                    ) : (
                      <div className={`flex flex-col items-center gap-1.5 z-10 transition-colors ${isDark ? 'text-slate-500 group-hover:text-blue-400/80' : 'text-slate-400 group-hover:text-blue-500'}`}>
                         <Camera size={24} />
                         <span className="text-[10px] font-medium uppercase tracking-wider">Upload</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                        className="hidden"
                        ref={fileRefs[i]}
                        required={i < 2}
                        onChange={e => handleImage(i, e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

              {/* ปุ่มแจ้งปัญหาด้านล่าง */}
              <div className="pt-4 pb-8 flex justify-center w-full">
                 <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="btn btn-primary w-full sm:w-auto px-10 py-3.5 text-base shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                  aria-label="ส่งข้อมูลแจ้งปัญหา"
                >
              {submitting ? (
                 <>
                   <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                   กำลังส่งข้อมูล...
                 </>
              ) : (
                 'ส่งข้อมูลแจ้งปัญหา'
              )}
            </button>
              </div>
            </div>
          )}
        </form>
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
            <h1 className="text-lg sm:text-xl font-bold truncate text-white">
              แจ้งปัญหาจากผู้ใช้งาน
            </h1>
            <p className="text-sm mt-0.5 text-slate-400">
              สำหรับเจ้าหน้าที่บันทึกการแจ้งซ่อมแทนผู้ใช้งาน / ตรวจสอบข้อมูลก่อนสร้างใบงาน
            </p>
          </div>
          <div className="w-full min-w-0">
            {formInner}
          </div>
        </div>
      </DashboardLayoutShell>
    );
  }

  return (
    <PublicLayoutShell subtitle="แจ้งปัญหาการใช้งาน">
      {formInner}
    </PublicLayoutShell>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full mb-3" />
          <div className="text-sm text-slate-400">กำลังโหลด...</div>
        </div>
      }
    >
      <ReportPageContent />
    </Suspense>
  );
}
