"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { toastSuccess, toastError, toastWarning } from '@/lib/toast';
import { MapPin, User as UserIcon, UserCircle, MessageSquare, Camera, Phone, Search, AlertCircle, Info } from 'lucide-react';
import PublicLayoutShell from '@/components/PublicLayoutShell';
import DashboardLayoutShell from '@/components/DashboardLayoutShell';
import Select from 'react-select';
import { getReactSelectGlassStyles } from '@/lib/reactSelectGlassStyles';
import { useAppTheme } from '@/lib/useAppTheme';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import PublicRouteLoading from "@/components/PublicRouteLoading";
import ManagedImage, { MANAGED_IMAGE_SIZES } from "@/components/ManagedImage";
import ManagedImageFrame from "@/components/ManagedImageFrame";
import {
  fetchSiteOptionAgencies,
  fetchSiteOptionDistricts,
  fetchSiteOptionProvinces,
  fetchSiteOptionStations,
  fetchSiteOptionSubdistricts,
} from "@/lib/sitesOptionsApi";
import {
  clearFileInput,
  JOB_IMAGE_ACCEPT,
  JOB_IMAGE_HINT,
  validateJobImageFile,
} from "@/lib/jobImageUpload";
import {
  formatJobImageUploadError,
  isNetworkOrConnectionError,
  runMultipartUploadWithProxyFallback,
  STORAGE_CONNECTION_ERROR_MESSAGE,
} from "@/lib/jobImageProxyFallback";

type ReporterPayload = {
  name: string;
  email?: string | null;
  position?: string | null;
  image?: string | null;
};

function isReporterPayload(v: unknown): v is ReporterPayload {
  return !!v && typeof v === 'object' && 'name' in v && typeof (v as { name?: unknown }).name === 'string';
}

/** ต้องตรงกับ `CreateJobSchema.description` ใน backend */
const REPORT_DESCRIPTION_MIN_LENGTH = 10;
const REPORT_DESCRIPTION_MAX_LENGTH = 500;

function clampReportDescription(value: string): string {
  return value.length > REPORT_DESCRIPTION_MAX_LENGTH
    ? value.slice(0, REPORT_DESCRIPTION_MAX_LENGTH)
    : value;
}

/** ดึงข้อความจาก Nest + axios (รองรับ error.message / error.error.message / details) */
function extractApiErrorMessage(err: unknown): string {
  if (isNetworkOrConnectionError(err)) {
    return STORAGE_CONNECTION_ERROR_MESSAGE;
  }
  const res = (err as { response?: { data?: unknown } })?.response?.data;
  let raw = '';
  if (res && typeof res === 'object') {
    const d = res as Record<string, unknown>;
    if (typeof d.message === 'string') raw = d.message;
    else if (Array.isArray(d.message)) raw = d.message.join(', ');
    else if (d.error && typeof d.error === 'object') {
      const e = d.error as Record<string, unknown>;
      if (typeof e.message === 'string') raw = e.message;
      else if (Array.isArray(e.details)) {
        raw = e.details
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
  } else if (err instanceof Error && err.message) {
    raw = err.message;
  }
  if (raw && isNetworkOrConnectionError(raw)) {
    return STORAGE_CONNECTION_ERROR_MESSAGE;
  }
  return raw;
}

export default function ReportPageContent({
  forceOutOfContract,
}: {
  forceOutOfContract?: boolean;
} = {}) {
  const { theme } = useAppTheme();
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4100/api';

  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [subdistricts, setSubdistricts] = useState<string[]>([]);
  const [agencies, setAgencies] = useState<string[]>([]);
  const [stations, setStations] = useState<string[]>([]);
  const [provincesLoading, setProvincesLoading] = useState(false);
  const [cascadeLoading, setCascadeLoading] = useState(false);
  const [sitesError, setSitesError] = useState<string | null>(null);
  const [provincesFetched, setProvincesFetched] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [phoneSearched, setPhoneSearched] = useState(false);
  const [isUserFound, setIsUserFound] = useState(false);

  const contractStatus = searchParams?.get('contractStatus');
  const isOutOfContract = forceOutOfContract === true || contractStatus === 'OUT_OF_CONTRACT';

  const [form, setForm] = useState({
    province: '', district: '', subdistrict: '', agency: '', location: '',
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

  /** P1: หลังตรวจเบอร์ (หรือ staff พร้อมแจ้ง) โหลดแค่รายการจังหวัดจาก Site */
  const loadProvinces = async (): Promise<void> => {
    if (provincesFetched || provincesLoading) return;

    setProvincesLoading(true);
    setSitesError(null);
    try {
      const list = await fetchSiteOptionProvinces();
      setProvinces(list);
      setProvincesFetched(true);
      if (list.length === 0) {
        setSitesError(
          'ไม่พบข้อมูลสถานที่ในระบบ (Site) — กรุณา seed ข้อมูลพื้นที่ก่อน',
        );
      }
    } catch {
      setSitesError('โหลดรายการจังหวัดไม่สำเร็จ');
      setProvinces([]);
    } finally {
      setProvincesLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (reporterAvatarLocalUrl) URL.revokeObjectURL(reporterAvatarLocalUrl);
    };
  }, [reporterAvatarLocalUrl]);

  // --- 1. Load Draft from Session Storage ---
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('reportFormDraft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.form) {
          const restored = { ...parsed.form } as typeof form;
          if (typeof restored.description === 'string') {
            restored.description = clampReportDescription(restored.description);
          }
          setForm((prev) => ({ ...prev, ...restored }));
        }
        if (parsed?.isUserFound) setIsUserFound(parsed.isUserFound);
        if (parsed?.phoneSearched) setPhoneSearched(parsed.phoneSearched);
        if (parsed?.phoneSearched) {
          void loadProvinces();
        }
      }
    } catch (e) {
      console.error('Failed to parse report form draft', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 2. Save Draft to Session Storage ---
  useEffect(() => {
    if (phoneSearched || form.reporterPhone) {
      const draft = { form, isUserFound, phoneSearched };
      sessionStorage.setItem('reportFormDraft', JSON.stringify(draft));
    }
  }, [form, isUserFound, phoneSearched]);

  /** Staff: เมื่อเบอร์ครบ 10 หลัก (canProceed) ให้โหลดจังหวัด */
  const isPhoneValidEarly = /^\d{10}$/.test(form.reporterPhone.trim());
  useEffect(() => {
    if (!isStaffFlow || !isPhoneValidEarly) return;
    void loadProvinces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaffFlow, isPhoneValidEarly]);

  /** เลือกจังหวัด → โหลดอำเภอจาก Site */
  const cascadeInflight = useRef(0);
  const beginCascadeLoad = () => {
    cascadeInflight.current += 1;
    setCascadeLoading(true);
  };
  const endCascadeLoad = () => {
    cascadeInflight.current = Math.max(0, cascadeInflight.current - 1);
    if (cascadeInflight.current === 0) setCascadeLoading(false);
  };

  useEffect(() => {
    if (!form.province) {
      setDistricts([]);
      setSubdistricts([]);
      setAgencies([]);
      setStations([]);
      return;
    }
    let cancelled = false;
    const ac = new AbortController();
    beginCascadeLoad();
    (async () => {
      try {
        const list = await fetchSiteOptionDistricts(form.province, ac.signal);
        if (!cancelled) setDistricts(list);
      } catch {
        if (!ac.signal.aborted && !cancelled) setDistricts([]);
      } finally {
        endCascadeLoad();
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [form.province]);

  /** เลือกอำเภอ → โหลดตำบลจาก Site */
  useEffect(() => {
    if (!form.district || !form.province) {
      setSubdistricts([]);
      return;
    }
    let cancelled = false;
    const ac = new AbortController();
    beginCascadeLoad();
    (async () => {
      try {
        const list = await fetchSiteOptionSubdistricts(
          form.province,
          form.district,
          ac.signal,
        );
        if (!cancelled) setSubdistricts(list);
      } catch {
        if (!ac.signal.aborted && !cancelled) setSubdistricts([]);
      } finally {
        endCascadeLoad();
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [form.district, form.province]);

  /** อำเภอ (+ตำบล optional) → โหลดสถานที่/หน่วยงาน */
  useEffect(() => {
    if (!form.district || !form.province) {
      setAgencies([]);
      return;
    }
    let cancelled = false;
    const ac = new AbortController();
    beginCascadeLoad();
    (async () => {
      try {
        const list = await fetchSiteOptionAgencies(
          form.province,
          form.district,
          form.subdistrict || undefined,
          ac.signal,
        );
        if (!cancelled) setAgencies(list);
      } catch {
        if (!ac.signal.aborted && !cancelled) setAgencies([]);
      } finally {
        endCascadeLoad();
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [form.district, form.province, form.subdistrict]);

  /** เลือกสถานที่ → โหลดชื่อสถานี */
  useEffect(() => {
    if (!form.agency || !form.district || !form.province) {
      setStations([]);
      return;
    }
    let cancelled = false;
    const ac = new AbortController();
    beginCascadeLoad();
    (async () => {
      try {
        const list = await fetchSiteOptionStations(
          form.province,
          form.district,
          form.agency,
          form.subdistrict || undefined,
          ac.signal,
        );
        if (!cancelled) setStations(list);
      } catch {
        if (!ac.signal.aborted && !cancelled) setStations([]);
      } finally {
        endCascadeLoad();
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [form.agency, form.district, form.province, form.subdistrict]);

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
        void loadProvinces();
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
        void loadProvinces();
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
      void loadProvinces();
    } finally {
      setIsSearchingPhone(false);
    }
  };

  const handleImage = (i: number, file: File | null, input?: HTMLInputElement | null) => {
    if (file) {
      const err = validateJobImageFile(file);
      if (err) {
        toastError(err);
        clearFileInput(input ?? fileRefs[i].current);
        return;
      }
    }
    const imgs = [...images]; imgs[i] = file;
    const pv = [...previews]; pv[i] = file ? URL.createObjectURL(file) : null;
    setImages(imgs); setPreviews(pv);
  };

  const handleReporterAvatarChange = (file: File | null, input?: HTMLInputElement | null) => {
    if (file) {
      const err = validateJobImageFile(file);
      if (err) {
        toastError(err);
        clearFileInput(input ?? reporterAvatarRef.current);
        return;
      }
    }
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
      setReporterEmailError(null);
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
    if (emailTrim) {
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
    } else {
      setReporterEmailError(null);
    }
    if (!provincesFetched) {
      toastWarning('กรุณารอสักครู่', 'ระบบกำลังโหลดรายการจังหวัด');
      return;
    }
    if (!form.province || !form.district || !form.agency || !form.location) {
      toastWarning('ข้อมูลสถานที่ไม่ครบ', 'กรุณาเลือก จังหวัด / อำเภอ / สถานที่ / ชื่อสถานี ให้ครบถ้วน');
      return;
    }
    const descriptionTrimmed = form.description.trim();
    if (!descriptionTrimmed || descriptionTrimmed.length < REPORT_DESCRIPTION_MIN_LENGTH) {
      toastWarning(
        'รายละเอียดไม่ครบ',
        `รายละเอียดต้องมีอย่างน้อย ${REPORT_DESCRIPTION_MIN_LENGTH} ตัวอักษร`,
      );
      return;
    }
    if (descriptionTrimmed.length > REPORT_DESCRIPTION_MAX_LENGTH) {
      toastWarning(
        'รายละเอียดยาวเกินไป',
        `รายละเอียดต้องไม่เกิน ${REPORT_DESCRIPTION_MAX_LENGTH} ตัวอักษร`,
      );
      return;
    }
    setSubmitting(true);
    try {
      const issueFiles = images.filter((img): img is File => img instanceof File);
      const imageFields = [
        { name: 'images', files: issueFiles },
        ...(reporterAvatarFile
          ? [{ name: 'reporterAvatar', files: [reporterAvatarFile] }]
          : []),
      ];

      const headers: Record<string, string> = {};
      const token = (session as { accessToken?: string })?.accessToken;
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await runMultipartUploadWithProxyFallback({
        fields: imageFields,
        reserveNonImageBytes: 64_000,
        onCompressing: () =>
          toastWarning(
            'กำลังบีบอัดรูป',
            'เซิร์ฟเวอร์จำกัดขนาดคำขอ — ระบบจะลดขนาดรูปแล้วส่งใหม่',
          ),
        upload: async (byField) => {
          const formData = new FormData();
          Object.entries(form).forEach(([key, value]) => {
            let str = typeof value === 'string' ? value.trim() : String(value ?? '');
            if (key === 'reporterEmail') str = str.replace(/\s/g, '');
            formData.append(key, str);
          });
          formData.append('isOutOfContract', isOutOfContract ? 'true' : 'false');
          formData.append('reportDate', new Date().toISOString());
          (byField.get('reporterAvatar') ?? []).forEach((f) =>
            formData.append('reporterAvatar', f),
          );
          (byField.get('images') ?? []).forEach((f) => formData.append('images', f));
          return axios.post(`${API}/public/jobs`, formData, { headers });
        },
      });
      const root: unknown = res?.data;
      const nested =
        root && typeof root === 'object' && 'data' in root
          ? (root as { data?: unknown }).data
          : undefined;
      const created = (nested ?? root) as { ticketNo?: string; requestTicketNo?: string } | undefined;
      const ticketNo = (created?.requestTicketNo || created?.ticketNo) as string | undefined;
      const phoneDigits = form.reporterPhone.replace(/\D/g, '').slice(0, 10);

      // เคลียร์ Draft ทิ้งเมื่อสำเร็จ
      sessionStorage.removeItem('reportFormDraft');

      const ticket = typeof ticketNo === 'string' ? ticketNo.trim() : '';
      if (ticket) {
        toastSuccess(`แจ้งซ่อมสำเร็จ! เลขที่ใบแจ้งซ่อมของคุณคือ ${ticket}`, 2200);
      } else {
        toastSuccess('แจ้งซ่อมสำเร็จ! ทีมช่างจะดำเนินการในเร็วๆ นี้', 1500);
      }
      setTimeout(() => {
        if (phoneDigits.length >= 9) {
          router.push(`/public/status?phone=${encodeURIComponent(phoneDigits)}`);
        } else if (ticket) {
          router.push(`/public/status?ticketNo=${encodeURIComponent(ticket)}`);
        }
      }, 800);
      setForm({
        province: '',
        district: '',
        subdistrict: '',
        agency: '',
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
      const text = formatJobImageUploadError(
        err,
        extractApiErrorMessage(err) || 'ไม่สามารถส่งข้อมูลได้',
      );
      toastError('เกิดข้อผิดพลาด', text);
    } finally { setSubmitting(false); }
  };

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
  const emailFormatOk =
    emailTrimForUi.length === 0 || EMAIL_PATTERN.test(emailTrimForUi);
  const emailOk = emailFormatOk && !reporterEmailError;
  const descriptionLen = form.description.trim().length;
  const descriptionOk =
    descriptionLen >= REPORT_DESCRIPTION_MIN_LENGTH &&
    descriptionLen <= REPORT_DESCRIPTION_MAX_LENGTH;
  const canSubmit =
    canProceed &&
    nameOk &&
    emailOk &&
    !emailChecking &&
    provincesFetched &&
    !!form.province &&
    !!form.district &&
    !!form.agency &&
    !!form.location &&
    descriptionOk;
  
  const customStyles = getReactSelectGlassStyles(theme);

  const cardOuterClass = "glass-card px-5 sm:px-7 py-5 sm:py-6 transition-all duration-300";
  const headerClass = "flex items-center gap-2 mb-5 pb-3 border-b border-[var(--glass-card-border)]";
  const headerIconClass = "text-blue-500";
  const headerTitleClass = "text-base font-bold glass-text";
  const labelClass = "glass-label";
  const inputClass = "form-input-glass w-full text-sm";

  const formInner = (
    <div
      className={`w-full space-y-6 animate-fade-up min-w-0 ${
        isStaffFlow ? "max-w-5xl mx-auto" : "max-w-3xl mx-auto"
      }`}
    >
      
      {/* Page Title for public view */}
      {!session && (
         <div className="text-center mb-8">
           <div className="flex flex-wrap items-center justify-center gap-2 mb-2 mt-4">
             <h1 className="text-2xl sm:text-3xl font-bold tracking-tight glass-text drop-shadow-sm">
               {isOutOfContract ? "แจ้งปัญหาการใช้งาน (งานนอกสัญญา)" : "แจ้งปัญหาการใช้งาน"}
             </h1>
             {isOutOfContract && (
               <span className="inline-flex items-center rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/30">
                 นอกสัญญา
               </span>
             )}
           </div>
           <p className="text-[13px] sm:text-sm glass-muted-text max-w-lg mx-auto leading-relaxed">
             กรุณากรอกข้อมูลเบื้องต้น เพื่อความรวดเร็วในการให้ทีมช่างเข้าตรวจสอบและแก้ไขปัญหา
           </p>
         </div>
      )}

      {sitesError ? (
        <Alert
          variant="destructive"
          className="alert-error rounded-2xl border-red-300 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-950/35 dark:text-red-100"
        >
          <AlertCircle size={18} aria-hidden />
          <AlertDescription>{sitesError}</AlertDescription>
        </Alert>
      ) : null}

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
              className="mb-5 flex gap-3 rounded-xl border border-sky-300 bg-sky-50 px-3.5 py-3 sm:px-4 sm:py-3.5 backdrop-blur-sm dark:border-sky-500/25 dark:bg-sky-950/35"
            >
              <Info
                className="h-5 w-5 shrink-0 text-sky-700 mt-0.5 dark:text-sky-400"
                strokeWidth={2}
                aria-hidden="true"
              />
              <div className="min-w-0 space-y-2 text-[13px] sm:text-sm leading-snug glass-muted-text">
                {isStaffFlow ? (
                  <p>
                    กด &quot;ตรวจสอบ&quot; เพื่อดึงข้อมูลจากระบบ หรือกรอกแทนได้ — ส่งแล้วจะอัปเดตผู้แจ้งและผูกกับใบแจ้งซ่อมนี้
                  </p>
                ) : (
                  <>
                    <p className="glass-text">
                      กรอกเบอร์ → กด &quot;ตรวจสอบ&quot; — มีบัญชีในระบบจะดึงข้อมูลให้
                    </p>
                    <p className="glass-subtle-text border-t border-[var(--glass-card-border)] pt-2">
                      ยังไม่มีบัญชี: กรอกชื่อ (อีเมล/ตำแหน่ง/รูปโปรไฟล์ถ้ามี) — ส่งแล้วระบบจะสร้าง/อัปเดตบัญชีผู้แจ้งซ่อมให้เอง
                    </p>
                  </>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className={labelClass}>เบอร์โทรศัพท์ <span className="text-red-500">*</span></Label>
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
                    <Phone
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-600 dark:text-slate-400"
                      aria-hidden
                    />
                    <Input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="กรอกเบอร์โทรศัพท์มือถือ"
                      className={cn(inputClass, "has-leading-icon min-h-11 h-auto")}
                      aria-label="เบอร์โทรศัพท์"
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
                        if (!isStaffFlow && provincesFetched) {
                          setProvincesFetched(false);
                          setProvinces([]);
                          setDistricts([]);
                          setSubdistricts([]);
                          setAgencies([]);
                          setStations([]);
                          setForm(p => ({ ...p, province: '', district: '', subdistrict: '', agency: '', location: '' }));
                          setSitesError(null);
                          setProvincesLoading(false);
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
                  <Button
                    type="button"
                    onClick={handlePhoneSearch}
                    disabled={isSearchingPhone || !form.reporterPhone}
                    className="btn btn-primary h-auto min-h-11 w-full cursor-pointer whitespace-nowrap sm:w-auto"
                    aria-label="ตรวจสอบเบอร์โทรศัพท์"
                  >
                    {isSearchingPhone ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"/> : <Search size={16} />}
                    ตรวจสอบ
                  </Button>
                </div>
                {!phoneSearched && isStaffFlow && (
                  <p className="text-xs glass-subtle-text mt-2">กรอกเบอร์ 10 หลักได้เลย หรือกด &quot;ตรวจสอบ&quot; หากต้องการดึงข้อมูลผู้แจ้งจากระบบ</p>
                )}
                {!phoneSearched && !isStaffFlow && (
                  <p className="text-xs glass-subtle-text mt-2">
                    กรอกเบอร์ 10 หลักแล้วกด &quot;ตรวจสอบ&quot; — หากมีข้อมูลในระบบจะดึงชื่อให้อัตโนมัติ
                    หากยังไม่มีบัญชี ให้กรอกชื่อ-สกุล (อีเมลถ้ามี)
                  </p>
                )}
              </div>

              {(isUserFound ||
                (isPhoneValid && !isUserFound && (phoneSearched || isStaffFlow))) && (
                <div className="md:col-span-2 animate-fade-in mt-2 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="flex flex-col items-center sm:items-start gap-2 shrink-0">
                      <Label className={labelClass}>รูปโปรไฟล์</Label>
                      <div className="relative">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => reporterAvatarRef.current?.click()}
                          className={`relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed p-0 transition-colors min-h-[112px] min-w-[112px] border-[var(--glass-card-border)] bg-[var(--glass-input-bg)] hover:border-blue-400/40`}
                          aria-label="เลือกรูปโปรไฟล์ผู้แจ้ง"
                        >
                          <ManagedImageFrame
                            src={reporterAvatarDisplayUrl}
                            alt="รูปโปรไฟล์ผู้แจ้ง"
                            sizes={MANAGED_IMAGE_SIZES.avatar3xl}
                            frameClassName="absolute inset-0"
                            imageClassName="h-full w-full object-cover"
                            fallback={<UserCircle className="h-14 w-14 glass-subtle-text" aria-hidden="true" />}
                          />
                        </Button>
                        <input
                          ref={reporterAvatarRef}
                          type="file"
                          accept={JOB_IMAGE_ACCEPT}
                          className="hidden"
                          onChange={(e) =>
                            handleReporterAvatarChange(
                              e.target.files?.[0] ?? null,
                              e.target,
                            )
                          }
                        />
                        <p className="mt-2 text-xs glass-muted-text">{JOB_IMAGE_HINT}</p>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className={labelClass}>ชื่อ-สกุล <span className="text-red-500">*</span></Label>
                        <Input
                          type="text"
                          required
                          readOnly={isUserFound}
                          placeholder="ชื่อ และ นามสกุล"
                          className={cn(
                            inputClass,
                            "min-h-11 h-auto",
                            isUserFound ? "cursor-not-allowed opacity-60" : "",
                          )}
                          value={form.reporterName}
                          onChange={(e) => setForm({ ...form, reporterName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className={labelClass} htmlFor="reporter-email-input">
                          อีเมล{' '}
                          <span className="glass-subtle-text font-normal text-xs ml-1">(ถ้ามี)</span>
                        </Label>
                        <Input
                          id="reporter-email-input"
                          type="email"
                          readOnly={isUserFound && !!form.reporterEmail.trim()}
                          placeholder="example@email.com"
                          autoComplete="email"
                          aria-invalid={reporterEmailError ? true : undefined}
                          aria-describedby={reporterEmailError ? "reporter-email-error" : undefined}
                          className={cn(
                            inputClass,
                            "min-h-11 h-auto",
                            isUserFound && !!form.reporterEmail.trim()
                              ? "cursor-not-allowed opacity-60"
                              : "",
                            reporterEmailError ? "border-red-500/60 focus:ring-red-500/20" : "",
                          )}
                          value={form.reporterEmail}
                          onChange={(e) => {
                            setReporterEmailError(null);
                            setForm({ ...form, reporterEmail: e.target.value.replace(/\s/g, "") });
                          }}
                          onBlur={() => void validateReporterEmailOnBlur()}
                        />
                        {emailChecking && (
                          <p className="text-xs glass-subtle-text mt-1.5" aria-live="polite">
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
                        <Label className={labelClass}>
                          ตำแหน่ง <span className="glass-subtle-text font-normal text-xs ml-1">(ถ้ามี)</span>
                        </Label>
                        <Input
                          type="text"
                          readOnly={isUserFound}
                          placeholder="เช่น เจ้าหน้าที่ IT, ผู้ประสานงาน"
                          maxLength={200}
                          className={cn(
                            inputClass,
                            "min-h-11 h-auto",
                            isUserFound ? "cursor-not-allowed opacity-60" : "",
                          )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={labelClass}>จังหวัด <span className="text-red-500">*</span></Label>
                <Select
                  options={provinces.map(p => ({ value: p, label: p }))}
                  styles={customStyles}
                  placeholder="– เลือกจังหวัด –"
                  menuPosition="fixed"
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  value={form.province ? { value: form.province, label: form.province } : null}
                  onChange={(opt: { value: string; label: string } | null) => {
                    const next = opt?.value || '';
                    setForm({
                      ...form,
                      province: next,
                      district: '',
                      subdistrict: '',
                      agency: '',
                      location: '',
                    });
                  }}
                  isDisabled={provincesLoading}
                  noOptionsMessage={() => "ไม่พบข้อมูล"}
                  isClearable
                />
              </div>
              <div>
                <Label className={labelClass}>อำเภอ <span className="text-red-500">*</span></Label>
                <Select
                  options={districts.map(d => ({ value: d, label: d }))}
                  styles={customStyles}
                  placeholder="– เลือกอำเภอ –"
                  menuPosition="fixed"
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  value={form.district ? { value: form.district, label: form.district } : null}
                  onChange={(opt: { value: string; label: string } | null) => {
                    const next = opt?.value || '';
                    setForm({
                      ...form,
                      district: next,
                      subdistrict: '',
                      agency: '',
                      location: '',
                    });
                  }}
                  isDisabled={!form.province || cascadeLoading}
                  noOptionsMessage={() => "กรุณาเลือกจังหวัดก่อน"}
                  isClearable
                />
              </div>
              <div>
                <Label className={labelClass}>
                  ตำบล{' '}
                  <span className="glass-subtle-text font-normal text-xs">(ถ้ามี)</span>
                </Label>
                <Select
                  options={subdistricts.map(s => ({ value: s, label: s }))}
                  styles={customStyles}
                  placeholder={subdistricts.length === 0 ? "– ยังไม่มีตำบลในระบบ –" : "– เลือกตำบล –"}
                  menuPosition="fixed"
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  value={form.subdistrict ? { value: form.subdistrict, label: form.subdistrict } : null}
                  onChange={(opt: { value: string; label: string } | null) => {
                    const next = opt?.value || '';
                    setForm({
                      ...form,
                      subdistrict: next,
                      agency: '',
                      location: '',
                    });
                  }}
                  isDisabled={!form.district || cascadeLoading}
                  noOptionsMessage={() => "ยังไม่มีตำบล — เลือกสถานที่/หน่วยงานได้เลย"}
                  isClearable
                />
              </div>
              <div>
                <Label className={labelClass}>สถานที่/หน่วยงาน <span className="text-red-500">*</span></Label>
                <Select
                  options={agencies.map(a => ({ value: a, label: a }))}
                  styles={customStyles}
                  placeholder="– เลือกสถานที่/หน่วยงาน –"
                  menuPosition="fixed"
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  value={form.agency ? { value: form.agency, label: form.agency } : null}
                  onChange={(opt: { value: string; label: string } | null) => {
                    const next = opt?.value || '';
                    setForm({
                      ...form,
                      agency: next,
                      location: '',
                    });
                  }}
                  isDisabled={!form.district || cascadeLoading}
                  noOptionsMessage={() => "กรุณาเลือกอำเภอก่อน หรือยังไม่มี Site ในพื้นที่นี้"}
                  isClearable
                />
              </div>
              <div>
                <Label className={labelClass}>ชื่อสถานี <span className="text-red-500">*</span></Label>
                <Select
                  options={stations.map(s => ({ value: s, label: s }))}
                  styles={customStyles}
                  placeholder="– เลือกชื่อสถานี –"
                  menuPosition="fixed"
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  value={form.location ? { value: form.location, label: form.location } : null}
                  onChange={(opt: { value: string; label: string } | null) =>
                    setForm({ ...form, location: opt?.value || '' })
                  }
                  isDisabled={!form.agency || cascadeLoading}
                  noOptionsMessage={() => "กรุณาเลือกสถานที่/หน่วยงานก่อน"}
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
              <Label className={labelClass} htmlFor="report-description">
                เหตุขัดข้อง <span className="text-red-500">*</span>
              </Label>
              <p
                id="report-description-hint"
                className="text-xs glass-subtle-text leading-relaxed mb-2 max-w-3xl"
              >
                ระบบจะรับเมื่อมีอย่างน้อย{' '}
                <span className="glass-muted-text font-medium">
                  {REPORT_DESCRIPTION_MIN_LENGTH} ตัวอักษร
                </span>
                {' '}และไม่เกิน{' '}
                <span className="glass-muted-text font-medium">
                  {REPORT_DESCRIPTION_MAX_LENGTH} ตัวอักษร
                </span>
                {' '}กรุณาเขียนให้ครบอย่างน้อยหนึ่งประโยค เช่น เหตุขัดข้องที่พบ (เสียง ภาพ ไฟ ฯลฯ) จุดที่เกิด
                (ห้อง/ชั้น/อุปกรณ์) เวลาที่พบ หรือความถี่ของปัญหา
              </p>
              <Textarea
                id="report-description"
                required
                minLength={REPORT_DESCRIPTION_MIN_LENGTH}
                maxLength={REPORT_DESCRIPTION_MAX_LENGTH}
                className={cn(inputClass, "min-h-[140px] resize-y")}
                placeholder="ระบุเหตุขัดข้อง, จุดสังเกต หรือปัญหาที่พบให้ละเอียด..."
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: clampReportDescription(e.target.value),
                  })
                }
                rows={5}
                aria-describedby="report-description-hint report-description-count"
              />
              <p
                id="report-description-count"
                className={cn(
                  "mt-1.5 text-xs text-right tabular-nums",
                  form.description.length >= REPORT_DESCRIPTION_MAX_LENGTH
                    ? "font-medium text-amber-700 dark:text-amber-400"
                    : "glass-subtle-text",
                )}
                aria-live="polite"
              >
                {form.description.length}/{REPORT_DESCRIPTION_MAX_LENGTH}
              </p>
            </div>
          </section>

              {/* 4. รูปภาพประกอบ */}
              <section className={cardOuterClass}>
            <div className={headerClass}>
              <Camera size={18} className={headerIconClass} />
              <div className="flex flex-col">
                 <h2 className={headerTitleClass}>รูปภาพประกอบ</h2>
                 <p className="text-xs glass-subtle-text font-normal">ถ่ายรูปจุดที่เกิดปัญหา (ถ้ามี) · {JOB_IMAGE_HINT}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex flex-col group">
                  <p className={`text-xs mb-1.5 font-medium glass-muted-text`}>
                    รูปที่ {i + 1}
                  </p>
                    <div
                      onClick={() => fileRefs[i].current?.click()}
                      className={`relative aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-200 cursor-pointer group hover:border-blue-400/50`}
                    style={{ 
                      borderColor: previews[i] ? 'transparent' : undefined, 
                      background: previews[i] ? 'transparent' : 'var(--glass-input-bg)' 
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
                        <div className="absolute inset-0 transition-colors group-hover:bg-blue-400/10" />
                    )}
                    {previews[i] ? (
                      <>
                        <ManagedImage
                          src={previews[i]!}
                          alt={`รูปภาพประกอบที่ ${i + 1}`}
                          fill
                          sizes={MANAGED_IMAGE_SIZES.uploadGridResponsive}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <span className="text-white text-xs font-semibold px-2 py-1 bg-black/50 rounded-lg backdrop-blur-sm">เปลี่ยนรูปภาพ</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 z-10 transition-colors glass-subtle-text group-hover:text-blue-500">
                         <Camera size={24} />
                         <span className="text-[10px] font-medium uppercase tracking-wider">Upload</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept={JOB_IMAGE_ACCEPT}
                        className="hidden"
                        ref={fileRefs[i]}
                        onChange={e => handleImage(i, e.target.files?.[0] || null, e.target)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

              {/* ปุ่มแจ้งปัญหาด้านล่าง */}
              <div className="pt-4 pb-8 flex justify-center w-full">
                 <Button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="btn btn-primary inline-flex h-auto min-h-12 w-full cursor-pointer items-center justify-center gap-2 px-10 py-3.5 text-base shadow-lg shadow-blue-600/20 active:scale-[0.98] sm:w-auto"
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
            </Button>
              </div>
            </div>
          )}
        </form>
    </div>
  );

  if (status === 'loading') {
    return (
      <PublicRouteLoading
        title="กำลังตรวจสอบสิทธิ์..."
        description="กำลังเตรียมแบบฟอร์มแจ้งปัญหา"
      />
    );
  }

  if (session) {
    return (
      <DashboardLayoutShell>
        <div className="animate-fade-up w-full min-w-0 space-y-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold truncate glass-text">
                {isOutOfContract ? "แจ้งปัญหา (งานนอกสัญญา)" : "แจ้งปัญหาจากผู้ใช้งาน"}
              </h1>
              {isOutOfContract && (
                <span className="inline-flex items-center rounded-lg bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  นอกสัญญา
                </span>
              )}
            </div>
            <p className="text-sm mt-0.5 glass-muted-text">
              {isOutOfContract
                ? "สำหรับเจ้าหน้าที่บันทึกการแจ้งซ่อมงานนอกสัญญา / ตรวจสอบข้อมูลก่อนสร้างใบงาน"
                : "สำหรับเจ้าหน้าที่บันทึกการแจ้งซ่อมแทนผู้ใช้งาน / ตรวจสอบข้อมูลก่อนสร้างใบงาน"}
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
    <PublicLayoutShell subtitle={isOutOfContract ? "แจ้งปัญหาการใช้งาน (นอกสัญญา)" : "แจ้งปัญหาการใช้งาน"}>
      {formInner}
    </PublicLayoutShell>
  );
}
