"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  UserPlus,
  Phone,
  Mail,
  FileText,
  Camera,
  FileDown,
  Printer,
  Wrench,
  X,
  AlertTriangle,
  Loader2,
  Clock3,
  Plus,
  Minus,
} from "lucide-react";
import DashboardPageShell from "@/components/DashboardPageShell";
import JobTimelineCard from "@/components/JobTimelineCard";
import PersonAvatar from "@/components/PersonAvatar";
import { confirmDialog, toastError, toastSuccess } from "@/lib/toast";
import Select from "react-select";
import { reactSelectGlassStyles } from "@/lib/reactSelectGlassStyles";
import { extractAssignableArray, unwrapApiData } from "@/lib/apiResponse";
import { dashboardJobImagePath } from "@/lib/dashboardJobImageUrl";
import {
  JOB_SERIAL_ROWS_MAX,
  emptyJobSerialRow,
  normalizeSerialNumberInput,
  parseJobSerialRowsFromDb,
  serializeJobSerialRowsToFormFields,
  type JobSerialRowForm,
} from "@/lib/jobSerialRows";

interface JobDetail {
  id: number;
  ticketNo?: string;
  status: string;
  reportDate?: string;
  createdAt: string;
  reporterName?: string;
  reporterPhone?: string;
  reporterEmail?: string;
  province?: string;
  district?: string;
  location?: string;
  description?: string;
  title?: string;
  images?: string[] | null;
  reporter?: { id?: number; image?: string | null } | null;
  assignedTo?: { id: number; name: string; image?: string | null } | null;
  /** ผู้ใช้ที่กดมอบหมาย/รับงาน (จาก API หลังอัปเดตระบบ) */
  assignedBy?: { id: number; name: string; image?: string | null } | null;
  fixDate?: string | null;
  brokenPart?: string | null;
  cause?: string | null;
  fixMethod?: string | null;
  fixImages?: string[] | null;
  fixNote?: string | null;
  fixEnvironment?: string | null;
  oldSerialNumber?: string | null;
  newSerialNumber?: string | null;
  systemStatus?: string | null;
}

function isJobDetail(v: unknown): v is JobDetail {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === "number" && typeof o.status === "string";
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  IN_PROGRESS: "กำลังแก้ไข",
  RESOLVED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  PENDING: "badge badge-pending",
  IN_PROGRESS: "badge badge-progress",
  RESOLVED: "badge badge-resolved",
  CANCELLED: "badge border border-slate-500/40 bg-slate-700/40 text-slate-200",
};

const FIX_ENVIRONMENT_OPTIONS = [
  { value: "INDOOR", label: "Indoor (ในอาคาร)" },
  { value: "OUTDOOR", label: "Outdoor (นอกอาคาร)" },
] as const;

const FIX_CATEGORY_OPTIONS = [
  { value: "Hardware", label: "Hardware (ฮาร์ดแวร์)" },
  { value: "Software", label: "Software (ซอฟต์แวร์)" },
] as const;

/** Dark Glassmorphism — ฟิลด์ฟอร์ม (AGENTS.md: inputs) */
const GLASS_LABEL = "block text-xs font-semibold mb-1 text-slate-200";
const GLASS_FIELD =
  "w-full text-xs sm:text-sm rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 shadow-inner focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all disabled:cursor-not-allowed disabled:bg-slate-900/25 disabled:text-slate-500 disabled:opacity-80 [color-scheme:dark]";
/** No-Card: แยกเป็น Glass ย่อยหลายก้อน (AGENTS.md) */
const GLASS_SECTION =
  "rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl p-4 sm:p-5";

function toDateTimeLocalInputValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hour = pad(d.getHours());
  const minute = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";
  const token = (session as { accessToken?: string })?.accessToken;

  const [permissions, setPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    if (!token) {
      setPermissions(null);
      return;
    }
    fetch(`${API}/roles/me/permissions`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((raw) => {
        const payload = unwrapApiData<{ permissions?: string[] }>(raw);
        const list = payload?.permissions;
        setPermissions(Array.isArray(list) ? list : null);
      })
      .catch(() => setPermissions(null));
  }, [token, API]);

  const [brokenPartType, setBrokenPartType] = useState<string>("");
  const [fixEnvironment, setFixEnvironment] = useState<string>("");
  const [cause, setCause] = useState<string>("");
  const [fixMethod, setFixMethod] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [serialRows, setSerialRows] = useState<JobSerialRowForm[]>([emptyJobSerialRow()]);
  const [fixImages, setFixImages] = useState<(File | null)[]>([null, null, null]);
  const [fixPreviews, setFixPreviews] = useState<(string | null)[]>([null, null, null]);
  const fixFileRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const [saving, setSaving] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[] | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  // ---- Assignment UI (เมื่อยังไม่มีผู้รับผิดชอบ) ----
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignableStaff, setAssignableStaff] = useState<
    { id: number; name?: string | null; username?: string; email?: string }[]
  >([]);
  const [assignSelectedId, setAssignSelectedId] = useState<number | null>(null);
  const [assignActionSaving, setAssignActionSaving] = useState(false);
  const [serverPdfDownloading, setServerPdfDownloading] = useState(false);

  useEffect(() => {
    const id = Number(params?.id);
    if (!id || !token) return;

    setLoading(true);
    setError(null);
    axios
      .get<JobDetail>(`${API}/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const payload = unwrapApiData<unknown>(res?.data);
        const data = isJobDetail(payload) ? payload : null;
        setJob(data);
        if (data) {
          const env = data.fixEnvironment ?? "";
          setFixEnvironment(env);
          setBrokenPartType(env ? (data.brokenPart ?? "") : "");
          setCause(data.cause ?? "");
          setFixMethod(data.fixMethod ?? "");
          setNote(data.fixNote ?? "");
          setSerialRows(
            parseJobSerialRowsFromDb(data.oldSerialNumber, data.newSerialNumber),
          );
          setBackfillReportDate(
            toDateTimeLocalInputValue(data.reportDate ?? data.createdAt),
          );
          setBackfillFixDate(toDateTimeLocalInputValue(data.fixDate ?? null));
        }
      })
      .catch(() => setError("ไม่พบข้อมูลใบแจ้งซ่อมนี้"))
      .finally(() => setLoading(false));
  }, [API, params?.id, token]);

  const title = "รายละเอียดข้อขัดข้อง";
  const subtitle = job?.ticketNo
    ? `เลขที่ใบแจ้งซ่อม: ${job.ticketNo}`
    : "ดูรายละเอียดงานแจ้งซ่อม";

  const isResolved = job?.status === "RESOLVED";
  const userRole = (session?.user as { role?: string })?.role ?? "USER";
  const currentUserId =
    (session as unknown as { userId?: string })?.userId ??
    (session?.user as { id?: string })?.id ??
    "";

  const canAssignAny = ["ADMIN", "SUPERVISOR"].includes(userRole);
  const canTakeJob = ["ADMIN", "SUPERVISOR", "STAFF"].includes(userRole);
  const canFixAny = Array.isArray(permissions) && permissions.includes("job.fix.any");
  const canFixSelf = Array.isArray(permissions) && permissions.includes("job.fix.self");
  const canReopenAny = Array.isArray(permissions) && permissions.includes("job.reopen.any");
  const canReopenSelf = Array.isArray(permissions) && permissions.includes("job.reopen.self");
  const canBackfillDate =
    Array.isArray(permissions) && permissions.includes("job.backfillDate");

  /** ผู้รับงาน (Owner) = ผู้ที่ถูกมอบหมายในงาน (assignedTo) — Reopen/บันทึกแก้ไขได้เฉพาะคนนี้ */
  const isAssignee =
    !!job?.assignedTo &&
    !!currentUserId &&
    String(job.assignedTo.id) === String(currentUserId);

  const [reopenReason, setReopenReason] = useState("");
  const [reopening, setReopening] = useState(false);
  const [backfillReportDate, setBackfillReportDate] = useState("");
  const [backfillFixDate, setBackfillFixDate] = useState("");
  const [backfillSaving, setBackfillSaving] = useState(false);

  /** แก้ไข/บันทึกได้เมื่อยังไม่ปิดงาน — หลังปิดต้อง Reopen (API) ให้เป็นกำลังแก้ไขก่อน */
  const canEditFix =
    !!job &&
    job.status === "IN_PROGRESS" &&
    !!job.assignedTo &&
    (canFixAny || (canFixSelf && isAssignee));

  const isReadOnlyFix = !!job && !canEditFix;

  const resolvedAtText = useMemo(() => {
    if (!job?.fixDate) return null;
    return new Date(job.fixDate).toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }, [job?.fixDate]);

  const fixEnvironmentSelectValue = useMemo(() => {
    if (!fixEnvironment) return null;
    return (
      FIX_ENVIRONMENT_OPTIONS.find((o) => o.value === fixEnvironment) ?? null
    );
  }, [fixEnvironment]);

  const fixCategorySelectValue = useMemo(() => {
    if (!brokenPartType) return null;
    return (
      FIX_CATEGORY_OPTIONS.find((o) => o.value === brokenPartType) ?? null
    );
  }, [brokenPartType]);

  /** บังคับ: ประเภทสถานที่ + ประเภทงาน + สาเหตุ + วิธีแก้ไข + รูป 2 รูปแรก — ใช้ปิดปุ่มบันทึก */
  const fixFormReadyToSubmit = useMemo(() => {
    if (!canEditFix) return true;
    const envOk =
      fixEnvironment === "INDOOR" || fixEnvironment === "OUTDOOR";
    const catOk =
      brokenPartType === "Hardware" || brokenPartType === "Software";
    const causeOk = cause.trim().length > 0;
    const methodOk = fixMethod.trim().length > 0;
    const imagesOk = fixImages[0] != null && fixImages[1] != null;
    return envOk && catOk && causeOk && methodOk && imagesOk;
  }, [
    canEditFix,
    fixEnvironment,
    brokenPartType,
    cause,
    fixMethod,
    fixImages,
  ]);

  const handleFixImage = (index: number, file: File | null) => {
    const imgs = [...fixImages];
    imgs[index] = file;
    const pv = [...fixPreviews];
    pv[index] = file ? URL.createObjectURL(file) : null;
    setFixImages(imgs);
    setFixPreviews(pv);
  };

  const updateSerialRow = (index: number, patch: Partial<JobSerialRowForm>) => {
    setSerialRows((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const addSerialRow = () => {
    setSerialRows((prev) =>
      prev.length >= JOB_SERIAL_ROWS_MAX ? prev : [...prev, emptyJobSerialRow()],
    );
  };

  const removeSerialRow = (index: number) => {
    setSerialRows((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
    );
  };

  const handleSubmitFix = async (e: FormEvent) => {
    e.preventDefault();
    if (!job || !token) return;
    if (!canEditFix) {
      toastError(
        "สิทธิ์ไม่เพียงพอ",
        "เฉพาะผู้รับงาน หรือผู้ดูแลระบบที่เกี่ยวข้องเท่านั้นที่บันทึกและปิดงานได้",
      );
      return;
    }
    if (fixEnvironment !== "INDOOR" && fixEnvironment !== "OUTDOOR") {
      toastError("ข้อมูลไม่ครบ", "กรุณาเลือกประเภทสถานที่ (Indoor / Outdoor)");
      return;
    }
    if (brokenPartType !== "Hardware" && brokenPartType !== "Software") {
      toastError("ข้อมูลไม่ครบ", "กรุณาเลือกประเภทงาน (Hardware / Software)");
      return;
    }
    if (!cause.trim()) {
      toastError("ข้อมูลไม่ครบ", "กรุณาระบุสาเหตุ");
      return;
    }
    if (!fixMethod.trim()) {
      toastError("ข้อมูลไม่ครบ", "กรุณาระบุวิธีแก้ไข");
      return;
    }
    if (!fixImages[0] || !fixImages[1]) {
      toastError("รูปภาพไม่ครบ", "กรุณาแนบรูปการแก้ไขอย่างน้อย 2 รูปแรก");
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.append("brokenPartType", brokenPartType);
      form.append("fixEnvironment", fixEnvironment);
      form.append("cause", cause);
      form.append("fixMethod", fixMethod);
      form.append("note", note);
      const ser = serializeJobSerialRowsToFormFields(serialRows);
      form.append("oldSerialNumber", ser.oldSerialNumber);
      form.append("newSerialNumber", ser.newSerialNumber);
      const filesToUpload = fixImages.filter(
        (f): f is File => f instanceof File,
      );
      filesToUpload.forEach((file) => form.append("fixImages", file));

      // ไม่ต้องกำหนด Content-Type เอง เพื่อให้ axios ใส่ boundary ให้ถูกต้อง
      await axios.patch(`${API}/jobs/${job.id}/fix`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toastSuccess("บันทึกข้อมูลการแก้ไขเรียบร้อยแล้ว", 1500);
      // reload detail
      const res = await axios.get<JobDetail>(`${API}/jobs/${job.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = unwrapApiData<unknown>(res?.data);
      const data = isJobDetail(payload) ? payload : null;
      setJob(data);
      if (data) {
        setSerialRows(
          parseJobSerialRowsFromDb(data.oldSerialNumber, data.newSerialNumber),
        );
      }
    } catch {
      toastError("ข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลการแก้ไขได้");
    } finally {
      setSaving(false);
    }
  };

  const reloadJob = async () => {
    const id = Number(params?.id);
    if (!id || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<JobDetail>(`${API}/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = unwrapApiData<unknown>(res?.data);
      const data = isJobDetail(payload) ? payload : null;
      setJob(data);
      if (data) {
        const env = data.fixEnvironment ?? "";
        setFixEnvironment(env);
        setBrokenPartType(env ? (data.brokenPart ?? "") : "");
        setCause(data.cause ?? "");
        setFixMethod(data.fixMethod ?? "");
        setNote(data.fixNote ?? "");
        setSerialRows(
          parseJobSerialRowsFromDb(data.oldSerialNumber, data.newSerialNumber),
        );
        setBackfillReportDate(toDateTimeLocalInputValue(data.reportDate ?? data.createdAt));
        setBackfillFixDate(toDateTimeLocalInputValue(data.fixDate ?? null));
      }
    } catch {
      setError("ไม่พบข้อมูลใบแจ้งซ่อมนี้");
    } finally {
      setLoading(false);
    }
  };

  const handleBackfillDates = async (e: FormEvent) => {
    e.preventDefault();
    if (!job || !token) return;
    if (!canBackfillDate) {
      toastError("สิทธิ์ไม่เพียงพอ", "คุณไม่มีสิทธิ์แก้ไขวันเวลาย้อนหลัง");
      return;
    }

    const reportLocal = backfillReportDate.trim();
    const fixLocal = backfillFixDate.trim();
    if (!reportLocal && !fixLocal) {
      toastError("ข้อมูลไม่ครบ", "กรุณาระบุวันที่แจ้งย้อนหลังหรือวันที่ปิดย้อนหลังอย่างน้อย 1 ค่า");
      return;
    }

    if (fixLocal && job.status !== "RESOLVED") {
      toastError("ทำรายการไม่ได้", "ตั้งวันที่ปิดย้อนหลังได้เฉพาะงานสถานะเสร็จสิ้น (RESOLVED)");
      return;
    }

    if (reportLocal && fixLocal) {
      const reportDt = new Date(reportLocal);
      const fixDt = new Date(fixLocal);
      if (Number.isNaN(reportDt.getTime()) || Number.isNaN(fixDt.getTime())) {
        toastError("รูปแบบเวลาไม่ถูกต้อง", "กรุณาตรวจสอบรูปแบบวันที่และเวลา");
        return;
      }
      if (fixDt.getTime() < reportDt.getTime()) {
        toastError("ข้อมูลไม่ถูกต้อง", "วันที่ปิดย้อนหลังต้องไม่น้อยกว่าวันที่แจ้งย้อนหลัง");
        return;
      }
    }

    const payload: { reportDate?: string; fixDate?: string } = {};
    if (reportLocal) payload.reportDate = new Date(reportLocal).toISOString();
    if (fixLocal) payload.fixDate = new Date(fixLocal).toISOString();

    setBackfillSaving(true);
    try {
      await axios.patch(`${API}/jobs/${job.id}/backfill-dates`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toastSuccess("บันทึกวันเวลาย้อนหลังเรียบร้อยแล้ว", 1400);
      await reloadJob();
    } catch (err: unknown) {
      const payloadErr = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data;
      const msg =
        payloadErr?.error?.message ??
        (typeof payloadErr === "object" && payloadErr && "message" in payloadErr
          ? String((payloadErr as { message?: string }).message)
          : null);
      toastError("บันทึกไม่สำเร็จ", msg?.trim() || "ไม่สามารถบันทึกวันเวลาย้อนหลังได้");
    } finally {
      setBackfillSaving(false);
    }
  };

  const handleReopenJob = async () => {
    if (!job || !token || !reopenReason.trim()) return;
    const ok = await confirmDialog({
      title: "ยืนยัน Reopen งาน?",
      text: "สถานะจะเปลี่ยนเป็นกำลังแก้ไข เพื่อให้แก้ไขข้อมูลได้ — เมื่อแก้ครบแล้วให้บันทึกและปิดงานอีกครั้ง",
      confirmText: "ยืนยัน Reopen",
      cancelText: "ยกเลิก",
      confirmColor: "#ea580c",
      cancelColor: "#475569",
    });
    if (!ok) return;

    setReopening(true);
    try {
      await axios.patch(
        `${API}/jobs/${job.id}/reopen`,
        { reason: reopenReason.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toastSuccess("เปิดงานใหม่แล้ว — สถานะเป็นกำลังแก้ไข", 1800);
      setReopenReason("");
      await reloadJob();
    } catch (err: unknown) {
      const payload = (err as { response?: { data?: { error?: { message?: string } } } })?.response
        ?.data;
      const msg =
        payload?.error?.message ??
        (typeof payload === "object" && payload && "message" in payload
          ? String((payload as { message?: string }).message)
          : null);
      toastError("Reopen ไม่สำเร็จ", msg?.trim() || "ไม่สามารถเปิดงานใหม่ได้");
    } finally {
      setReopening(false);
    }
  };

  const handleTakeJob = async () => {
    if (!job || !token) return;
    if (!canTakeJob) {
      toastError("สิทธิ์ไม่เพียงพอ", "คุณไม่มีสิทธิ์รับงาน");
      return;
    }
    if (job.status !== "PENDING") {
      toastError("ทำรายการไม่ได้", "งานนี้ไม่อยู่ในสถานะ PENDING");
      return;
    }
    if (job.assignedTo) return;
    if (!currentUserId) {
      toastError("สิทธิ์ไม่เพียงพอ", "ไม่พบข้อมูลผู้ใช้");
      return;
    }

    const ok = await confirmDialog({
      title: "รับงานนี้?",
      text: "คุณต้องการรับงานนี้เข้าสู่ขั้นตอนการแก้ไขหรือไม่",
      confirmText: "ยืนยัน รับงาน",
      cancelText: "ยกเลิก",
      confirmColor: "#16a34a",
      cancelColor: "#475569",
    });
    if (!ok) return;

    setAssignActionSaving(true);
    try {
      await axios.patch(
        `${API}/jobs/${job.id}/assign`,
        { staffId: Number(currentUserId) },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toastSuccess("รับงานสำเร็จ", 1200);
      await reloadJob();
    } catch {
      toastError("ข้อผิดพลาด", "ไม่สามารถรับงานได้");
    } finally {
      setAssignActionSaving(false);
    }
  };

  const openAssignModal = async () => {
    if (!job || !token) return;
    if (!canAssignAny) return;
    if (job.status !== "PENDING") return;
    setAssignOpen(true);
    setAssignSelectedId(null);
    setAssignableStaff([]);

    setAssignLoading(true);
    try {
      const res = await axios.get(`${API}/users/assignable`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const extracted = extractAssignableArray(res?.data as unknown);
      setAssignableStaff(
        Array.isArray(extracted)
          ? (extracted as { id: number; name?: string | null; username?: string; email?: string }[])
          : [],
      );
    } catch {
      toastError("โหลดรายชื่อเจ้าหน้าที่ไม่สำเร็จ");
      setAssignOpen(false);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignSubmit = async () => {
    if (!job || !token) return;
    if (!canAssignAny) return;
    if (assignSelectedId == null) return;

    setAssignActionSaving(true);
    try {
      await axios.patch(
        `${API}/jobs/${job.id}/assign`,
        { staffId: assignSelectedId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toastSuccess("มอบหมายงานสำเร็จ", 1200);
      setAssignOpen(false);
      await reloadJob();
    } catch {
      toastError("ข้อผิดพลาด", "ไม่สามารถมอบหมายงานได้");
    } finally {
      setAssignActionSaving(false);
    }
  };

  const handleDownloadServerPdf = async () => {
    if (!job || !token) {
      toastError("เข้าสู่ระบบไม่ถูกต้อง", "กรุณาเข้าสู่ระบบใหม่");
      return;
    }
    if (job.status !== "RESOLVED") {
      toastError("ดาวน์โหลดไม่ได้", "งานต้องมีสถานะเสร็จสิ้นก่อน");
      return;
    }
    setServerPdfDownloading(true);
    try {
      const res = await fetch(`${API}/jobs/${job.id}/report-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || res.statusText);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${job.ticketNo || job.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toastSuccess("ดาวน์โหลด PDF (เซิร์ฟเวอร์) แล้ว", 1200);
    } catch (e: unknown) {
      console.error("[PDF server]", e);
      const detail =
        e instanceof Error ? e.message : "ตรวจสอบ FRONTEND_BASE_URL / Puppeteer บน backend";
      toastError("ดาวน์โหลดไม่สำเร็จ", detail);
    } finally {
      setServerPdfDownloading(false);
    }
  };

  const assignOptions = useMemo(
    () =>
      assignableStaff.map((s) => ({
        value: s.id,
        label: (() => {
          const name = (s.name ?? "").trim();
          const username = (s.username ?? "").trim();
          const email = (s.email ?? "").trim();
          const base = name || username || email || `#${s.id}`;

          const suffix = name ? (username ? ` (${username})` : email ? ` (${email})` : "") : "";
          return `${base}${suffix}`;
        })(),
      })),
    [assignableStaff],
  );

  return (
    <DashboardPageShell title={title} subtitle={subtitle} noCard>
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#020617] min-h-0">
        <div className="space-y-4 max-w-[1600px] mx-auto w-full">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-white/10 bg-slate-800/50 text-slate-300 hover:bg-slate-700/60 hover:text-white shadow-sm transition-all focus:ring-2 focus:ring-slate-500/20 outline-none font-medium cursor-pointer"
          >
            <ArrowLeft size={16} /> กลับไปหน้ารายการ
          </button>

          {!loading && !error && job ? (
            <JobTimelineCard job={job} />
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            {/* คอลัมน์ซ้าย — No-Card: แยก Glass หลายก้อน */}
            <div className="space-y-4 min-w-0">
              <h2 className="text-sm font-bold text-white tracking-tight">
                ข้อมูลการแจ้งข้อขัดข้อง
              </h2>
              {loading ? (
                <div className={GLASS_SECTION}>
                  <div className="h-40 flex items-center justify-center text-sm text-slate-400">
                    <span className="animate-pulse">กำลังโหลดข้อมูล...</span>
                  </div>
                </div>
              ) : error || !job ? (
                <div className={GLASS_SECTION}>
                  <div className="h-40 flex items-center justify-center text-sm text-red-400">
                    {error ?? "ไม่พบข้อมูลใบแจ้งซ่อมนี้"}
                  </div>
                </div>
              ) : (
                <>
                  <div className={GLASS_SECTION}>
                    <div className="space-y-4">
                      <div className="space-y-1 text-xs text-slate-400">
                        <div className="flex justify-between gap-2 items-center">
                          <span>สถานะปัจจุบัน:</span>
                          <span
                            className={
                              STATUS_BADGE_CLASS[job.status] ?? "badge badge-pending"
                            }
                          >
                            {STATUS_LABELS[job.status] ?? job.status}
                          </span>
                        </div>
                        {(job.reportDate || job.createdAt) && (
                          <div className="flex justify-between gap-2">
                            <span>วันที่แจ้ง:</span>
                            <span className="flex items-center gap-1 text-slate-300">
                              <Calendar size={12} aria-hidden />
                              {new Date(job.reportDate || job.createdAt).toLocaleString(
                                "th-TH",
                                { dateStyle: "short", timeStyle: "short" }
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-semibold mb-2 flex items-center gap-1 text-slate-400">
                          <User size={12} aria-hidden /> ผู้แจ้ง
                        </p>
                        <div className="flex items-start gap-3 min-w-0">
                          <PersonAvatar
                            imageUrl={job.reporter?.image}
                            avatarUserId={
                              job.reporter?.image && job.reporter?.id != null
                                ? job.reporter.id
                                : undefined
                            }
                            nameLabel={job.reporterName ?? undefined}
                            size="md"
                          />
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="text-sm text-slate-100 font-medium">
                              {job.reporterName ?? "–"}
                            </p>
                            {job.reporterPhone && (
                              <p className="text-xs flex items-center gap-1 text-slate-400">
                                <Phone size={12} aria-hidden /> {job.reporterPhone}
                              </p>
                            )}
                            {job.reporterEmail && (
                              <p className="text-xs flex items-center gap-1 text-slate-400">
                                <Mail size={12} aria-hidden /> {job.reporterEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1 text-slate-400">
                          <MapPin size={12} aria-hidden /> สถานที่
                        </p>
                        <p className="text-sm text-slate-200">
                          {[job.province, job.district, job.location]
                            .filter(Boolean)
                            .join(" · ") || "–"}
                        </p>
                      </div>

                      {job.assignedTo && (
                        <div>
                          <p className="text-xs font-semibold mb-2 text-slate-400">
                            ผู้รับผิดชอบ
                          </p>
                          <div className="flex items-center gap-3 min-w-0">
                            <PersonAvatar
                              imageUrl={job.assignedTo.image}
                              avatarUserId={
                                job.assignedTo.image
                                  ? job.assignedTo.id
                                  : undefined
                              }
                              nameLabel={job.assignedTo.name}
                              size="md"
                            />
                            <p className="text-sm text-slate-200 font-medium min-w-0 truncate">
                              {job.assignedTo.name}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={GLASS_SECTION}>
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1 text-slate-400">
                      <FileText size={12} aria-hidden /> รายละเอียดปัญหา
                    </p>
                    <p className="text-sm text-slate-100 whitespace-pre-wrap wrap-break-word leading-relaxed">
                      {job.description || job.title || "–"}
                    </p>
                  </div>

                  {job.images && Array.isArray(job.images) && job.images.length > 0 && (
                    <div className={GLASS_SECTION}>
                      <p className="text-xs font-semibold text-slate-400 mb-3">
                        รูปภาพประกอบ
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {job.images.slice(0, 4).map((src, i) => {
                          if (!src) return null;
                          return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              if (!job) return;
                              const slice = (job.images as string[]).slice(0, 4);
                              const proxyUrls: string[] = [];
                              const origIdx: number[] = [];
                              slice.forEach((u, idx) => {
                                if (u) {
                                  origIdx.push(idx);
                                  proxyUrls.push(
                                    dashboardJobImagePath(job.id, "issue", idx),
                                  );
                                }
                              });
                              const pos = origIdx.indexOf(i);
                              if (pos < 0) return;
                              setPreviewImages(proxyUrls);
                              setPreviewIndex(pos);
                            }}
                            className="relative w-full aspect-4/3 sm:aspect-video rounded-xl border border-white/10 overflow-hidden bg-slate-800/50 group cursor-pointer"
                          >
                            <img
                              src={dashboardJobImagePath(job.id, "issue", i)}
                              alt={`รูปประกอบ ${i + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs font-medium px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                                คลิกเพื่อขยาย
                              </span>
                            </div>
                          </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* คอลัมน์ขวา — No-Card: สถานะ / ฟอร์ม แยก Glass */}
            <div className="space-y-4 min-w-0">
              <h2 className="text-sm font-bold text-white tracking-tight">
                ข้อมูลการแก้ไข
              </h2>

              {job && (
                <div className={`${GLASS_SECTION} space-y-3 text-xs text-slate-400`}>
                  <div className="flex justify-between gap-2 items-center">
                    <span>สถานะปัจจุบัน:</span>
                    <span
                      className={STATUS_BADGE_CLASS[job.status] ?? "badge badge-pending"}
                    >
                      {STATUS_LABELS[job.status] ?? job.status}
                    </span>
                  </div>
                  {resolvedAtText && (
                    <div className="flex justify-between gap-2">
                      <span>วันที่แก้ไขล่าสุด:</span>
                      <span className="font-semibold text-slate-200">{resolvedAtText}</span>
                    </div>
                  )}
                  {!job.assignedTo && job.status !== "CANCELLED" && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-amber-500/35 bg-amber-950/30 backdrop-blur-sm p-4 shadow-inner animate-pulse-slow">
                        <div className="flex items-start gap-3">
                          <div className="bg-amber-500/15 p-2 rounded-lg text-amber-400 shrink-0 border border-amber-500/25">
                            <AlertTriangle size={18} aria-hidden />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-amber-200 mb-0.5">สถานะ: รอผู้รับผิดชอบ</h4>
                            <p className="text-xs text-amber-100/85 leading-relaxed">
                              กรุณามอบหมายงานหรือรับงานนี้ก่อน จึงจะสามารถปลดล็อคแบบฟอร์มเพื่อบันทึกการแก้ไขและปิดงานได้
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2.5 mt-2">
                      {job?.status === "PENDING" && canAssignAny && (
                          <button
                            type="button"
                            onClick={openAssignModal}
                            disabled={assignActionSaving || assignLoading}
                            className="flex-1 min-h-[44px] py-2.5 rounded-xl text-sm font-semibold border border-sky-500/50 text-sky-100 bg-sky-950/40 hover:bg-sky-900/50 disabled:opacity-50 transition-all shadow-lg active:scale-95 focus:ring-2 focus:ring-sky-500/30 outline-none cursor-pointer"
                          >
                            <UserPlus size={16} className="inline-block mr-1.5 -mt-0.5" aria-hidden /> มอบหมายงาน
                          </button>
                        )}

                      {job?.status === "PENDING" && canTakeJob && (
                          <button
                            type="button"
                            onClick={handleTakeJob}
                            disabled={assignActionSaving || assignLoading}
                            className="flex-1 min-h-[44px] py-2.5 rounded-xl text-sm font-semibold text-slate-100 bg-slate-800 border border-white/10 hover:bg-slate-700 disabled:opacity-50 transition-all shadow-lg active:scale-95 focus:ring-2 focus:ring-slate-500/25 outline-none cursor-pointer"
                          >
                            <Wrench size={16} className="inline-block mr-1.5 -mt-0.5" aria-hidden /> รับงานด้วยตนเอง
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {job.assignedTo && (
                    <div className="flex justify-between gap-2">
                      <span>ผู้รับงาน (ผู้แก้ไข):</span>
                      <span className="font-semibold text-slate-200">
                        {job.assignedTo.name}
                      </span>
                    </div>
                  )}
                  {isResolved && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <span className="text-sm">ไฟล์ PDF รายงาน:</span>
                      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                        <a
                          href={`/print/jobs/${job.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold border border-white/10 bg-slate-800/50 text-slate-100 hover:bg-slate-700/80 transition-all active:scale-95 shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        >
                          <Printer size={14} aria-hidden />
                          <span>เปิดหน้าพิมพ์ (เบราว์เซอร์)</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => void handleDownloadServerPdf()}
                          disabled={serverPdfDownloading || !token}
                          aria-label="ดาวน์โหลด PDF จากเซิร์ฟเวอร์ Chromium"
                          aria-busy={serverPdfDownloading}
                          className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold border border-sky-500/40 bg-sky-900/40 text-sky-100 hover:bg-sky-800/50 transition-all active:scale-95 shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                        >
                          <FileDown size={14} aria-hidden />
                          <span>
                            {serverPdfDownloading
                              ? "กำลังสร้าง PDF…"
                              : "ดาวน์โหลด (เซิร์ฟเวอร์)"}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                  {job.fixImages && Array.isArray(job.fixImages) && job.fixImages.length > 0 && (
                    <div className="pt-3 space-y-2">
                      <span className="text-xs font-semibold text-slate-400">
                        รูปการแก้ไข
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {job.fixImages.slice(0, 3).map((src, i) => {
                          if (!src) return null;
                          return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              if (!job) return;
                              const slice = (job.fixImages as string[]).slice(0, 3);
                              const proxyUrls: string[] = [];
                              const origIdx: number[] = [];
                              slice.forEach((u, idx) => {
                                if (u) {
                                  origIdx.push(idx);
                                  proxyUrls.push(
                                    dashboardJobImagePath(job.id, "fix", idx),
                                  );
                                }
                              });
                              const pos = origIdx.indexOf(i);
                              if (pos < 0) return;
                              setPreviewImages(proxyUrls);
                              setPreviewIndex(pos);
                            }}
                            className="relative w-full aspect-4/3 rounded-xl border border-white/10 overflow-hidden bg-slate-800/50 group cursor-pointer"
                          >
                            <img
                              src={dashboardJobImagePath(job.id, "fix", i)}
                              alt={`รูปการแก้ไข ${i + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs font-medium px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                                คลิกเพื่อขยาย
                              </span>
                            </div>
                          </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {job && canBackfillDate && (
                <div className={`${GLASS_SECTION} space-y-4`}>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 rounded-lg border border-cyan-500/25 bg-cyan-950/25 p-2 text-cyan-300">
                      <Clock3 size={15} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-100">
                        ลงข้อมูลย้อนหลัง (Backfill วันที่)
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        ใช้สำหรับเคสเก่า: แก้ไขวันที่แจ้ง/วันที่ปิดให้ตรงข้อมูลจริงตามเอกสารอ้างอิง
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleBackfillDates} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={GLASS_LABEL} htmlFor="job-backfill-report-date">
                          วันที่แจ้งย้อนหลัง
                        </label>
                        <input
                          id="job-backfill-report-date"
                          type="datetime-local"
                          className={GLASS_FIELD}
                          value={backfillReportDate}
                          onChange={(e) => setBackfillReportDate(e.target.value)}
                          disabled={backfillSaving}
                        />
                      </div>
                      <div>
                        <label className={GLASS_LABEL} htmlFor="job-backfill-fix-date">
                          วันที่ปิดย้อนหลัง
                        </label>
                        <input
                          id="job-backfill-fix-date"
                          type="datetime-local"
                          className={GLASS_FIELD}
                          value={backfillFixDate}
                          onChange={(e) => setBackfillFixDate(e.target.value)}
                          disabled={backfillSaving}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      หมายเหตุ: วันที่ปิดย้อนหลังตั้งได้เฉพาะงานสถานะ{" "}
                      <span className="text-slate-300 font-medium">เสร็จสิ้น (RESOLVED)</span>{" "}
                      และต้องไม่น้อยกว่าวันที่แจ้งย้อนหลัง
                    </p>
                    <button
                      type="submit"
                      disabled={backfillSaving}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-cyan-100 bg-cyan-900/40 border border-cyan-500/35 hover:bg-cyan-800/45 disabled:opacity-60 transition-all shadow-lg active:scale-95 focus:ring-2 focus:ring-cyan-500/40 outline-none cursor-pointer"
                    >
                      {backfillSaving ? "กำลังบันทึกวันเวลาย้อนหลัง..." : "บันทึกวันเวลาย้อนหลัง"}
                    </button>
                  </form>
                </div>
              )}

              {job && (
                <div className={`${GLASS_SECTION} space-y-4`}>
                {job.status === "CANCELLED" ? (
                  <p className="text-sm text-slate-300 text-center py-6 px-2">
                    งานนี้ถูกยกเลิกแล้ว — ไม่มีการดำเนินการซ่อมต่อ และไม่สามารถบันทึกการแก้ไขหรือ Reopen ได้
                  </p>
                ) : (canEditFix || isReadOnlyFix) ? (
                  <form onSubmit={handleSubmitFix} className="space-y-4">
                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 sm:p-4 space-y-3">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        <span className="text-red-400">*</span> บังคับกรอก:{" "}
                        <span className="text-slate-300 font-medium">
                          ประเภทสถานที่ (Indoor / Outdoor)
                        </span>
                        ,{" "}
                        <span className="text-slate-300 font-medium">
                          ประเภทงาน (Hardware / Software)
                        </span>{" "}
                        ,{" "}
                        <span className="text-slate-300 font-medium">สาเหตุ</span>
                        ,{" "}
                        <span className="text-slate-300 font-medium">วิธีแก้ไข</span>
                        และแนบรูป 2 รูปแรก — เลือกประเภทสถานที่ก่อน จึงจะเลือกประเภทงานได้
                        หมายเหตุและ Serial ไม่บังคับ
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            className={GLASS_LABEL}
                            htmlFor="job-fix-environment"
                          >
                            ประเภทสถานที่ <span className="text-red-400">*</span>
                          </label>
                          <Select
                            inputId="job-fix-environment"
                            instanceId="job-fix-environment"
                            options={[...FIX_ENVIRONMENT_OPTIONS]}
                            value={fixEnvironmentSelectValue}
                            onChange={(opt) => {
                              const v = opt
                                ? String((opt as { value: string }).value)
                                : "";
                              setFixEnvironment(v);
                              if (!v) setBrokenPartType("");
                            }}
                            isDisabled={isReadOnlyFix}
                            isClearable
                            placeholder="เลือก Indoor / Outdoor"
                            styles={reactSelectGlassStyles}
                            menuPortalTarget={
                              typeof document !== "undefined"
                                ? document.body
                                : null
                            }
                            menuPosition="fixed"
                            classNamePrefix="react-select"
                          />
                        </div>
                        <div>
                          <label
                            className={GLASS_LABEL}
                            htmlFor="job-fix-category"
                          >
                            ประเภทงาน <span className="text-red-400">*</span>
                          </label>
                          <Select
                            inputId="job-fix-category"
                            instanceId="job-fix-category"
                            options={[...FIX_CATEGORY_OPTIONS]}
                            value={fixCategorySelectValue}
                            onChange={(opt) =>
                              setBrokenPartType(
                                opt ? String((opt as { value: string }).value) : "",
                              )
                            }
                            isDisabled={isReadOnlyFix || !fixEnvironment}
                            isClearable
                            placeholder={
                              fixEnvironment
                                ? "เลือก Hardware / Software"
                                : "เลือกประเภทสถานที่ก่อน"
                            }
                            styles={reactSelectGlassStyles}
                            menuPortalTarget={
                              typeof document !== "undefined"
                                ? document.body
                                : null
                            }
                            menuPosition="fixed"
                            classNamePrefix="react-select"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className={GLASS_LABEL} htmlFor="job-cause">
                        สาเหตุ <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="job-cause"
                        type="text"
                        className={GLASS_FIELD}
                        value={cause}
                        onChange={(e) => setCause(e.target.value)}
                        disabled={isReadOnlyFix}
                        required={canEditFix}
                      />
                    </div>
                    <div>
                      <label className={GLASS_LABEL} htmlFor="job-fix-method">
                        วิธีแก้ไข <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        id="job-fix-method"
                        className={`${GLASS_FIELD} min-h-[100px] resize-y`}
                        value={fixMethod}
                        onChange={(e) => setFixMethod(e.target.value)}
                        disabled={isReadOnlyFix}
                        required={canEditFix}
                      />
                    </div>
                    <div>
                      <label className={GLASS_LABEL} htmlFor="job-fix-note">
                        หมายเหตุการแก้ไข
                      </label>
                      <input
                        id="job-fix-note"
                        type="text"
                        className={GLASS_FIELD}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        disabled={isReadOnlyFix}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                        <p
                          id="job-serial-hint"
                          className="text-xs text-slate-500 leading-relaxed flex-1"
                        >
                          <span className="text-slate-400 font-medium">S/N:</span>{" "}
                          รับเฉพาะ A–Z / 0–9 / - (ตัวพิมพ์เล็กเป็นตัวใหญ่อัตโนมัติ อักขระอื่นถูกตัด)
                          — เพิ่มได้สูงสุด {JOB_SERIAL_ROWS_MAX} แถว
                        </p>
                        {!isReadOnlyFix && (
                          <button
                            type="button"
                            onClick={addSerialRow}
                            disabled={serialRows.length >= JOB_SERIAL_ROWS_MAX}
                            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] sm:min-w-0 px-3 rounded-xl border border-white/15 bg-slate-800/80 text-slate-200 text-xs font-semibold hover:bg-slate-700/90 transition-all active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer shrink-0"
                            aria-label="เพิ่มแถว Serial Number"
                          >
                            <Plus size={16} aria-hidden />
                            เพิ่มอุปกรณ์
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {serialRows.map((row, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-white/10 bg-slate-950/35 p-3 sm:p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                อุปกรณ์ {idx + 1}
                              </span>
                              {!isReadOnlyFix && serialRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSerialRow(idx)}
                                  className="inline-flex items-center justify-center min-h-10 min-w-10 rounded-lg border border-white/10 text-slate-400 hover:text-red-300 hover:border-red-500/30 hover:bg-red-950/20 transition-colors cursor-pointer"
                                  aria-label={`ลบแถวอุปกรณ์ ${idx + 1}`}
                                >
                                  <Minus size={18} aria-hidden />
                                </button>
                              )}
                            </div>
                            <div>
                              <label
                                className={GLASS_LABEL}
                                htmlFor={`job-serial-name-${idx}`}
                              >
                                ชื่ออุปกรณ์
                              </label>
                              <input
                                id={`job-serial-name-${idx}`}
                                type="text"
                                maxLength={200}
                                autoComplete="off"
                                className={GLASS_FIELD}
                                value={row.deviceName}
                                onChange={(e) =>
                                  updateSerialRow(idx, {
                                    deviceName: e.target.value.slice(0, 200),
                                  })
                                }
                                disabled={isReadOnlyFix}
                                placeholder="เช่น DVR / กล้องหน้าประตู"
                                aria-describedby="job-serial-hint"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label
                                  className={GLASS_LABEL}
                                  htmlFor={`job-serial-old-${idx}`}
                                >
                                  S/N เดิม
                                </label>
                                <input
                                  id={`job-serial-old-${idx}`}
                                  type="text"
                                  inputMode="text"
                                  autoComplete="off"
                                  spellCheck={false}
                                  className={`${GLASS_FIELD} font-mono tracking-wide uppercase`}
                                  value={row.oldSerial}
                                  onChange={(e) =>
                                    updateSerialRow(idx, {
                                      oldSerial: normalizeSerialNumberInput(
                                        e.target.value,
                                      ),
                                    })
                                  }
                                  disabled={isReadOnlyFix}
                                  aria-describedby="job-serial-hint"
                                />
                              </div>
                              <div>
                                <label
                                  className={GLASS_LABEL}
                                  htmlFor={`job-serial-new-${idx}`}
                                >
                                  S/N ใหม่
                                </label>
                                <input
                                  id={`job-serial-new-${idx}`}
                                  type="text"
                                  inputMode="text"
                                  autoComplete="off"
                                  spellCheck={false}
                                  className={`${GLASS_FIELD} font-mono tracking-wide uppercase`}
                                  value={row.newSerial}
                                  onChange={(e) =>
                                    updateSerialRow(idx, {
                                      newSerial: normalizeSerialNumberInput(
                                        e.target.value,
                                      ),
                                    })
                                  }
                                  disabled={isReadOnlyFix}
                                  aria-describedby="job-serial-hint"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {!isReadOnlyFix && (
                      <div>
                        <span className={GLASS_LABEL}>
                          รูปการแก้ไข{" "}
                          <span className="text-slate-400 font-normal">
                            (บังคับ 2 รูปแรก — รูปที่ 3 ไม่บังคับ)
                          </span>
                        </span>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-1">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="flex flex-col group">
                              <p className="text-[11px] mb-1.5 font-medium text-slate-400">
                                รูปที่ {i + 1}{" "}
                                {i < 2 && (
                                  <span className="text-red-400">*</span>
                                )}
                              </p>
                              <div
                                onClick={() => fixFileRefs[i].current?.click()}
                                className={`relative aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-200 ${
                                  fixPreviews[i]
                                    ? "border-transparent bg-transparent"
                                    : "border-white/20 bg-slate-900/30"
                                }`}
                              >
                                {!fixPreviews[i] && (
                                  <div className="absolute inset-0 group-hover:bg-slate-800/40 transition-colors" />
                                )}
                                {fixPreviews[i] ? (
                                  <>
                                    <img
                                      src={fixPreviews[i]!}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <span className="text-white text-xs font-semibold px-2 py-1 bg-black/50 rounded-lg backdrop-blur-sm">
                                        เปลี่ยนรูปภาพ
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center gap-1.5 z-10 text-slate-400 group-hover:text-sky-400 transition-colors">
                                    <Camera size={22} aria-hidden />
                                    <span className="text-[10px] font-medium uppercase tracking-wider">
                                      Upload
                                    </span>
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  ref={fixFileRefs[i]}
                                  onChange={(e) =>
                                    handleFixImage(
                                      i,
                                      e.target.files?.[0] || null,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {canEditFix ? (
                      <button
                        type="submit"
                        disabled={saving || !fixFormReadyToSubmit}
                        className="w-full mt-3 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 transition-all focus:ring-2 focus:ring-blue-500/40 outline-none cursor-pointer disabled:cursor-not-allowed"
                      >
                        {saving ? "กำลังบันทึก..." : "บันทึกและปิดงาน (สถานะ: เสร็จสิ้น)"}
                      </button>
                    ) : isResolved && (canReopenAny || (canReopenSelf && isAssignee)) ? (
                      <div className="w-full mt-3 py-3 rounded-xl text-xs sm:text-sm font-medium text-center border border-dashed border-white/15 text-slate-300 bg-slate-800/40 backdrop-blur-sm">
                        งานนี้ถูกปิดแล้ว — หากต้องการแก้ไขข้อมูลการแก้ไข ให้ใช้ขั้นตอน Reopen ด้านล่าง
                      </div>
                    ) : isResolved ? (
                      <div className="w-full mt-3 py-3 rounded-xl text-xs sm:text-sm font-medium text-center border border-dashed border-white/15 text-slate-400 bg-slate-800/40 backdrop-blur-sm">
                        งานนี้ปิดแล้ว — ข้อมูลการแก้ไขเป็นโหมดอ่านอย่างเดียว — หากต้องการแก้ไข ให้ติดต่อผู้รับงานหรือผู้ดูแลระบบ
                      </div>
                    ) : job && job.status === "PENDING" ? (
                      <div className="w-full mt-3 py-3 rounded-xl text-xs sm:text-sm font-medium text-center border border-dashed border-amber-500/25 text-amber-100/90 bg-amber-950/20 backdrop-blur-sm">
                        งานสถานะรอดำเนินการ (PENDING) ยังปิดงานไม่ได้ — กรุณามอบหมายงานก่อนเพื่อเปลี่ยนเป็นกำลังแก้ไข
                      </div>
                    ) : job && !job.assignedTo ? (
                      <div className="w-full mt-3 py-3 rounded-xl text-xs sm:text-sm font-medium text-center border border-dashed border-amber-500/25 text-amber-100/90 bg-amber-950/20 backdrop-blur-sm">
                        ยังไม่มีผู้รับผิดชอบงาน — มอบหมายหรือรับงานด้านบนก่อน จึงจะบันทึกการแก้ไขและปิดงานได้
                      </div>
                    ) : (
                      <div className="w-full mt-3 py-3 rounded-xl text-xs sm:text-sm font-medium text-center border border-dashed border-white/15 text-slate-400 bg-slate-800/40 backdrop-blur-sm">
                        เฉพาะผู้รับงานที่ถูกมอบหมายเท่านั้นที่บันทึกและปิดงานได้
                      </div>
                    )}

                    {job && isResolved && (canReopenAny || (canReopenSelf && isAssignee)) && (
                      <div className="rounded-xl border border-orange-500/35 bg-orange-950/25 backdrop-blur-md p-4 flex flex-col gap-3 text-xs sm:text-sm mt-4 shadow-lg">
                        <div className="font-semibold text-orange-200">
                          Reopen เพื่อเปลี่ยนสถานะเป็น &quot;กำลังแก้ไข&quot; แล้วจึงแก้ไขข้อมูลได้
                        </div>
                        <textarea
                          className="w-full rounded-xl border border-orange-500/30 bg-slate-900/50 px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-orange-200/40 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-500/25 outline-none transition-all"
                          rows={2}
                          placeholder="ระบุเหตุผลในการ Reopen เช่น ต้องแก้ไขรายละเอียดวิธีการแก้ไข หรืออัปเดตรูปเพิ่มเติม"
                          value={reopenReason}
                          onChange={(e) => setReopenReason(e.target.value)}
                          disabled={reopening}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void handleReopenJob()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-900/50 transition-all shadow-lg active:scale-95 disabled:opacity-60"
                            disabled={!reopenReason.trim() || reopening}
                          >
                            {reopening ? (
                              <Loader2 size={16} className="animate-spin shrink-0" aria-hidden />
                            ) : null}
                            Reopen → กำลังแก้ไข
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">
                    ข้อมูลการแก้ไขถูกบันทึกแล้ว — การ Reopen/แก้ไขเพิ่มทำได้ตามสิทธิ์ที่กำหนดในบทบาท หากคุณไม่สามารถดำเนินการได้ โปรดติดต่อผู้ดูแลระบบ
                  </p>
                )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {previewImages && previewImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-3 sm:px-6"
          onClick={() => setPreviewImages(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[92vh] bg-black/90 rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 text-xs sm:text-sm text-slate-200 bg-black/70">
              <span>
                รูปที่ {previewIndex + 1} / {previewImages.length}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImages(null)}
                className="px-2 py-1 rounded-lg hover:bg-white/10"
              >
                ปิด
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center bg-black">
              <img
                src={previewImages[previewIndex]}
                alt=""
                className="max-h-[82vh] max-w-full object-contain"
              />
              {previewImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewIndex((prev) =>
                        prev === 0 ? previewImages.length - 1 : prev - 1,
                      )
                    }
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 px-2.5 py-2 rounded-full bg-black/60 text-xs sm:text-sm text-slate-100 hover:bg-black/80"
                  >
                    ‹ Prev
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewIndex((prev) =>
                        prev === previewImages.length - 1 ? 0 : prev + 1,
                      )
                    }
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 px-2.5 py-2 rounded-full bg-black/60 text-xs sm:text-sm text-slate-100 hover:bg-black/80"
                  >
                    Next ›
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal มอบหมายงาน (ADMIN/SUPERVISOR) — Dark Glassmorphism */}
      {assignOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          onClick={() => setAssignOpen(false)}
          role="presentation"
        >
          <div
            className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl w-full max-w-md overflow-visible flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-modal-title"
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
              <h3
                id="assign-modal-title"
                className="font-bold text-base text-white"
              >
                มอบหมายงาน {job?.ticketNo && `· ${job.ticketNo}`}
              </h3>
              <button
                type="button"
                onClick={() => setAssignOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {assignLoading ? (
                <p className="text-sm text-slate-400">กำลังโหลดรายชื่อเจ้าหน้าที่...</p>
              ) : (
                <>
                  <p className={`${GLASS_LABEL} mb-0`}>
                    เลือกเจ้าหน้าที่ที่ต้องการมอบหมายงานนี้ให้
                  </p>

                  <Select
                    instanceId="assign-staff-select-detail"
                    styles={reactSelectGlassStyles}
                    menuPortalTarget={
                      typeof document !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                    options={assignOptions}
                    placeholder="ค้นหาและเลือกเจ้าหน้าที่..."
                    value={
                      assignSelectedId != null
                        ? assignOptions.find((o) => o.value === assignSelectedId) ?? null
                        : null
                    }
                    onChange={(opt: { value: number } | null) =>
                      setAssignSelectedId(opt ? Number(opt.value) : null)
                    }
                    isClearable
                    isSearchable
                    isDisabled={assignActionSaving}
                    noOptionsMessage={() => "ไม่พบเจ้าหน้าที่"}
                  />

                  <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setAssignOpen(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700/90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer min-h-[44px]"
                      disabled={assignActionSaving}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleAssignSubmit}
                      disabled={assignSelectedId == null || assignActionSaving}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
                    >
                      <UserPlus size={14} className="inline mr-1.5" aria-hidden /> มอบหมายให้เจ้าหน้าที่
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}

