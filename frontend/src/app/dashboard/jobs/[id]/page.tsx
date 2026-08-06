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
  AlertTriangle,
  Loader2,
  Clock3,
  Plus,
  Minus,
} from "lucide-react";
import DashboardPageShell from "@/components/DashboardPageShell";
import JobTimelineCard from "@/components/JobTimelineCard";
import ManagedImage, { MANAGED_IMAGE_SIZES } from "@/components/ManagedImage";
import PersonAvatar from "@/components/PersonAvatar";
import { confirmDialog, toastError, toastSuccess } from "@/lib/toast";
import Select from "react-select";
import { getReactSelectGlassStyles } from "@/lib/reactSelectGlassStyles";
import { useAppTheme } from "@/lib/useAppTheme";
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
import { validateBackfillDate } from "@/lib/jobBackfillDatePolicy";
import { formatThaiDateTimeDisplay } from "@/lib/formatThaiDateTimeDisplay";
import BackfillDateTimeFields from "@/components/jobs/BackfillDateTimeFields";
import JobStatusBadge from "@/components/jobs/JobStatusBadge";
import JobAssignDialog from "@/components/jobs/JobAssignDialog";
import JobImageLightbox from "@/components/jobs/JobImageLightbox";
import { GLASS_FIELD, GLASS_LABEL, GLASS_SECTION } from "@/components/jobs/jobDetailStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { jobNeedsAssignee } from "@/lib/jobAssignEligibility";
import {
  buildFixPreviewUrlsFromJob,
  hasRequiredFixImageSlots,
} from "@/lib/jobFixImageSlots";

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

const FIX_ENVIRONMENT_OPTIONS = [
  { value: "INDOOR", label: "Indoor (ในอาคาร)" },
  { value: "OUTDOOR", label: "Outdoor (นอกอาคาร)" },
] as const;

const FIX_CATEGORY_OPTIONS = [
  { value: "Hardware", label: "Hardware (ฮาร์ดแวร์)" },
  { value: "Software", label: "Software (ซอฟต์แวร์)" },
] as const;

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
  const { theme } = useAppTheme();
  const selectStyles = getReactSelectGlassStyles(theme);
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4100/api";
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
          setFixImages([null, null, null]);
          setFixPreviews(buildFixPreviewUrlsFromJob(data.id, data.fixImages));
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
  const [backfillReportDateValid, setBackfillReportDateValid] = useState(true);
  const [backfillFixDate, setBackfillFixDate] = useState("");
  const [backfillFixDateValid, setBackfillFixDateValid] = useState(true);
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
    return formatThaiDateTimeDisplay(job.fixDate);
  }, [job?.fixDate]);

  /** แบนเนอร์เตือนก่อน submit — สอดคล้องกฎเดียวกับ backend */
  const backfillPolicyWarnings = useMemo(() => {
    const lines: string[] = [];
    const r = backfillReportDate.trim();
    const f = backfillFixDate.trim();
    if (!backfillReportDateValid) {
      lines.push("วันที่แจ้งย้อนหลังต้องกรอกเป็น dd/mm/yyyy และต้องเป็นวันที่จริง");
    }
    if (!backfillFixDateValid) {
      lines.push("วันที่ปิดย้อนหลังต้องกรอกเป็น dd/mm/yyyy และต้องเป็นวันที่จริง");
    }
    if (r) {
      const d = new Date(r);
      if (!Number.isNaN(d.getTime())) {
        const err = validateBackfillDate(d, "reportDate");
        if (err) lines.push(err);
      }
    }
    if (f) {
      const d = new Date(f);
      if (!Number.isNaN(d.getTime())) {
        const err = validateBackfillDate(d, "fixDate");
        if (err) lines.push(err);
      }
    }
    if (job) {
      const reportMsCandidate = r
        ? new Date(r).getTime()
        : new Date(job.reportDate || job.createdAt).getTime();
      const fixMsCandidate = f
        ? new Date(f).getTime()
        : job.fixDate
          ? new Date(job.fixDate).getTime()
          : null;
      if (
        fixMsCandidate != null &&
        !Number.isNaN(reportMsCandidate) &&
        !Number.isNaN(fixMsCandidate) &&
        fixMsCandidate < reportMsCandidate
      ) {
        lines.push(
          "วันที่ปิดย้อนหลังต้องไม่น้อยกว่าวันที่แจ้ง (รวมค่าที่มีอยู่แล้วในระบบ)",
        );
      }
    }
    return lines;
  }, [backfillFixDate, backfillFixDateValid, backfillReportDate, backfillReportDateValid, job]);

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
    const imagesOk = hasRequiredFixImageSlots(fixImages, fixPreviews);
    return envOk && catOk && causeOk && methodOk && imagesOk;
  }, [
    canEditFix,
    fixEnvironment,
    brokenPartType,
    cause,
    fixMethod,
    fixImages,
    fixPreviews,
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
    if (!hasRequiredFixImageSlots(fixImages, fixPreviews)) {
      toastError(
        "รูปภาพไม่ครบ",
        "กรุณาแนบรูปการแก้ไขอย่างน้อย 2 รูปแรก หรือใช้รูปเดิมที่มีอยู่แล้ว",
      );
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
        setFixImages([null, null, null]);
        setFixPreviews(buildFixPreviewUrlsFromJob(data.id, data.fixImages));
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
        setFixImages([null, null, null]);
        setFixPreviews(buildFixPreviewUrlsFromJob(data.id, data.fixImages));
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

    if (!backfillReportDateValid || !backfillFixDateValid) {
      toastError("รูปแบบวันที่ไม่ถูกต้อง", "กรุณากรอกวันที่ย้อนหลังเป็น dd/mm/yyyy ให้ครบถ้วนก่อนบันทึก");
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

    if (reportLocal) {
      const reportDt = new Date(reportLocal);
      if (Number.isNaN(reportDt.getTime())) {
        toastError("รูปแบบเวลาไม่ถูกต้อง", "กรุณาตรวจสอบวันที่แจ้งย้อนหลัง");
        return;
      }
      const err = validateBackfillDate(reportDt, "reportDate");
      if (err) {
        toastError("วันที่แจ้งไม่ถูกต้อง", err);
        return;
      }
    }
    if (fixLocal) {
      const fixDt = new Date(fixLocal);
      if (Number.isNaN(fixDt.getTime())) {
        toastError("รูปแบบเวลาไม่ถูกต้อง", "กรุณาตรวจสอบวันที่ปิดย้อนหลัง");
        return;
      }
      const err = validateBackfillDate(fixDt, "fixDate");
      if (err) {
        toastError("วันที่ปิดงานไม่ถูกต้อง", err);
        return;
      }
    }

    const nextReportMs = reportLocal
      ? new Date(reportLocal).getTime()
      : new Date(job.reportDate || job.createdAt).getTime();
    const nextFixMs = fixLocal
      ? new Date(fixLocal).getTime()
      : job.fixDate
        ? new Date(job.fixDate).getTime()
        : null;
    if (
      nextFixMs != null &&
      !Number.isNaN(nextReportMs) &&
      !Number.isNaN(nextFixMs) &&
      nextFixMs < nextReportMs
    ) {
      toastError(
        "ข้อมูลไม่ถูกต้อง",
        "วันที่ปิดย้อนหลังต้องไม่น้อยกว่าวันที่แจ้ง (รวมค่าที่มีอยู่แล้วในระบบ)",
      );
      return;
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
    if (!jobNeedsAssignee(job)) {
      toastError("ทำรายการไม่ได้", "งานนี้มีผู้รับผิดชอบแล้ว หรือไม่สามารถรับงานในสถานะนี้ได้");
      return;
    }
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
    if (!jobNeedsAssignee(job)) return;
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
      const res = await fetch(`/api/jobs/${job.id}/report-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        let detail = res.statusText;
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const payload = (await res.json()) as
            | { error?: { message?: string }; message?: string }
            | null;
          detail =
            payload?.error?.message ??
            payload?.message ??
            detail;
        } else {
          detail = (await res.text()) || detail;
        }
        throw new Error(detail || "ไม่สามารถดาวน์โหลด PDF ได้");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("content-disposition") || "";
      const match =
        /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i.exec(
          disposition,
        );
      const filename = match
        ? decodeURIComponent(match[1] || match[2] || match[3] || "")
        : `report-${job.ticketNo || job.id}.pdf`;
      a.download = filename;
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
      <div className="flex-1 overflow-auto p-4 sm:p-6 min-h-0">
        <div className="space-y-4 max-w-[1600px] mx-auto w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] px-3.5 py-2 text-xs font-medium glass-muted-text shadow-sm hover:bg-[var(--glass-nav-hover-bg)] hover:text-[var(--glass-text)] focus-visible:ring-2 focus-visible:ring-slate-500/20 sm:text-sm"
          >
            <ArrowLeft size={16} aria-hidden /> กลับไปหน้ารายการ
          </Button>

          {!loading && !error && job ? (
            <JobTimelineCard job={job} />
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            {/* คอลัมน์ซ้าย — No-Card: แยก Glass หลายก้อน */}
            <div className="space-y-4 min-w-0">
              <h2 className="text-sm font-bold glass-text tracking-tight">
                ข้อมูลการแจ้งข้อขัดข้อง
              </h2>
              {loading ? (
                <div className={GLASS_SECTION}>
                  <div className="h-40 flex items-center justify-center text-sm glass-muted-text">
                    <span className="animate-pulse">กำลังโหลดข้อมูล...</span>
                  </div>
                </div>
              ) : error || !job ? (
                <div className={GLASS_SECTION}>
                  <div className="h-40 flex items-center justify-center text-sm text-red-600 dark:text-red-400">
                    {error ?? "ไม่พบข้อมูลใบแจ้งซ่อมนี้"}
                  </div>
                </div>
              ) : (
                <>
                  <div className={GLASS_SECTION}>
                    <div className="space-y-4">
                      <div className="space-y-1 text-xs glass-muted-text">
                        <div className="flex justify-between gap-2 items-center">
                          <span>สถานะปัจจุบัน:</span>
                          <JobStatusBadge status={job.status} />
                        </div>
                        {(job.reportDate || job.createdAt) && (
                          <div className="flex justify-between gap-2">
                            <span>วันที่แจ้ง:</span>
                            <span className="flex items-center gap-1 glass-muted-text">
                              <Calendar size={12} aria-hidden />
                              {formatThaiDateTimeDisplay(
                                job.reportDate || job.createdAt,
                              ) ?? "–"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-semibold mb-2 flex items-center gap-1 glass-muted-text">
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
                            <p className="text-sm glass-text font-medium">
                              {job.reporterName ?? "–"}
                            </p>
                            {job.reporterPhone && (
                              <p className="text-xs flex items-center gap-1 glass-muted-text">
                                <Phone size={12} aria-hidden /> {job.reporterPhone}
                              </p>
                            )}
                            {job.reporterEmail && (
                              <p className="text-xs flex items-center gap-1 glass-muted-text">
                                <Mail size={12} aria-hidden /> {job.reporterEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1 glass-muted-text">
                          <MapPin size={12} aria-hidden /> สถานที่
                        </p>
                        <p className="text-sm glass-text">
                          {[job.province, job.district, job.location]
                            .filter(Boolean)
                            .join(" · ") || "–"}
                        </p>
                      </div>

                      {job.assignedTo && (
                        <div>
                          <p className="text-xs font-semibold mb-2 glass-muted-text">
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
                            <p className="text-sm glass-text font-medium min-w-0 truncate">
                              {job.assignedTo.name}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={GLASS_SECTION}>
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1 glass-muted-text">
                      <FileText size={12} aria-hidden /> รายละเอียดปัญหา
                    </p>
                    <p className="text-sm glass-text whitespace-pre-wrap wrap-break-word leading-relaxed">
                      {job.description || job.title || "–"}
                    </p>
                  </div>

                  {job.images && Array.isArray(job.images) && job.images.length > 0 && (
                    <div className={GLASS_SECTION}>
                      <p className="text-xs font-semibold glass-muted-text mb-3">
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
                            className="relative w-full aspect-4/3 sm:aspect-video glass-card overflow-hidden bg-[var(--glass-card-bg)] group cursor-pointer"
                          >
                            <ManagedImage
                              src={dashboardJobImagePath(job.id, "issue", i)}
                              alt={`รูปประกอบ ${i + 1}`}
                              fill
                              sizes={MANAGED_IMAGE_SIZES.galleryResponsiveSm}
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
              <h2 className="text-sm font-bold glass-text tracking-tight">
                ข้อมูลการแก้ไข
              </h2>

              {job && (
                <div className={`${GLASS_SECTION} space-y-3 text-xs glass-muted-text`}>
                  <div className="flex justify-between gap-2 items-center">
                    <span>สถานะปัจจุบัน:</span>
                    <JobStatusBadge status={job.status} />
                  </div>
                  {resolvedAtText && (
                    <div className="flex justify-between gap-2">
                      <span>วันที่แก้ไขล่าสุด:</span>
                      <span className="font-semibold glass-text">{resolvedAtText}</span>
                    </div>
                  )}
                  {!job.assignedTo && job.status !== "CANCELLED" && (
                    <div className="space-y-4">
                      <Alert className="animate-pulse-slow border-amber-300 bg-amber-50 text-amber-950 shadow-inner backdrop-blur-sm [&>svg]:text-amber-600 dark:border-amber-500/35 dark:bg-amber-950/30 dark:text-amber-100/85 dark:[&>svg]:text-amber-400">
                        <AlertTriangle size={18} aria-hidden />
                        <AlertTitle className="text-sm font-bold text-amber-900 dark:text-amber-200">
                          สถานะ: รอผู้รับผิดชอบ
                        </AlertTitle>
                        <AlertDescription className="text-xs leading-relaxed text-amber-900/90 dark:text-amber-100/85">
                          กรุณามอบหมายงานหรือรับงานนี้ก่อน จึงจะสามารถปลดล็อคแบบฟอร์มเพื่อบันทึกการแก้ไขและปิดงานได้
                        </AlertDescription>
                      </Alert>

                      <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
                      {job && jobNeedsAssignee(job) && canAssignAny && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={openAssignModal}
                            disabled={assignActionSaving || assignLoading}
                            className="min-h-11 flex-1 cursor-pointer rounded-xl border-sky-400/60 bg-sky-100 py-2.5 text-sm font-semibold text-sky-900 shadow-lg hover:bg-sky-200/80 focus-visible:ring-sky-500/30 active:scale-95 dark:border-sky-500/50 dark:bg-sky-950/40 dark:text-sky-100 dark:hover:bg-sky-900/50"
                          >
                            <UserPlus size={16} className="mr-1.5 inline-block -mt-0.5" aria-hidden /> มอบหมายงาน
                          </Button>
                        )}

                      {job && jobNeedsAssignee(job) && canTakeJob && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleTakeJob}
                            disabled={assignActionSaving || assignLoading}
                            className="min-h-11 flex-1 cursor-pointer rounded-xl border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] py-2.5 text-sm font-semibold glass-text shadow-lg hover:bg-[var(--glass-nav-hover-bg)] focus-visible:ring-slate-500/25 active:scale-95"
                          >
                            <Wrench size={16} className="mr-1.5 inline-block -mt-0.5" aria-hidden /> รับงานด้วยตนเอง
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  {job.assignedTo && (
                    <div className="flex justify-between gap-2">
                      <span>ผู้รับงาน (ผู้แก้ไข):</span>
                      <span className="font-semibold glass-text">
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
                          className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold border border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] glass-text hover:bg-[var(--glass-nav-hover-bg)] transition-all active:scale-95 shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        >
                          <Printer size={14} aria-hidden />
                          <span>เปิดหน้าพิมพ์ (เบราว์เซอร์)</span>
                        </a>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void handleDownloadServerPdf()}
                          disabled={serverPdfDownloading || !token}
                          aria-label="ดาวน์โหลด PDF จากเซิร์ฟเวอร์ Chromium"
                          aria-busy={serverPdfDownloading}
                          className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-sky-400/60 bg-sky-100 px-3 py-2 text-xs font-semibold text-sky-900 shadow-lg hover:bg-sky-200/80 focus-visible:ring-sky-500/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sky-500/40 dark:bg-sky-900/40 dark:text-sky-100 dark:hover:bg-sky-800/50"
                        >
                          <FileDown size={14} aria-hidden />
                          <span>
                            {serverPdfDownloading
                              ? "กำลังสร้าง PDF…"
                              : "ดาวน์โหลด (เซิร์ฟเวอร์)"}
                          </span>
                        </Button>
                      </div>
                    </div>
                  )}
                  {job.fixImages && Array.isArray(job.fixImages) && job.fixImages.length > 0 && (
                    <div className="pt-3 space-y-2">
                      <span className="text-xs font-semibold glass-muted-text">
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
                            className="relative w-full aspect-4/3 glass-card overflow-hidden bg-[var(--glass-card-bg)] group cursor-pointer"
                          >
                            <ManagedImage
                              src={dashboardJobImagePath(job.id, "fix", i)}
                              alt={`รูปการแก้ไข ${i + 1}`}
                              fill
                              sizes={MANAGED_IMAGE_SIZES.galleryResponsiveSm}
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
                    <div className="mt-0.5 rounded-lg border border-cyan-300 bg-cyan-50 p-2 text-cyan-700 dark:border-cyan-500/25 dark:bg-cyan-950/25 dark:text-cyan-300">
                      <Clock3 size={15} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold glass-text">
                        ลงข้อมูลย้อนหลัง (Backfill วันที่)
                      </h3>
                      <p className="text-xs glass-muted-text mt-1 leading-relaxed">
                        ใช้สำหรับเคสเก่า: แก้ไขวันที่แจ้ง/วันที่ปิดให้ตรงข้อมูลจริงตามเอกสารอ้างอิง
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleBackfillDates} className="space-y-3">
                    {backfillPolicyWarnings.length > 0 ? (
                      <Alert
                        role="status"
                        className="border-amber-300 bg-amber-50 text-amber-950 [&>svg]:text-amber-600 dark:border-amber-500/35 dark:bg-amber-950/25 dark:text-amber-100/95 dark:[&>svg]:text-amber-400"
                      >
                        <AlertTriangle size={16} aria-hidden />
                        <AlertTitle className="text-amber-900 dark:text-amber-100">
                          ตรวจสอบวันที่ก่อนบันทึก
                        </AlertTitle>
                        <AlertDescription className="text-amber-900/90 dark:text-amber-100/95">
                          <ul className="mt-1 list-inside list-disc space-y-0.5">
                            {backfillPolicyWarnings.map((w, idx) => (
                              <li key={`${idx}-${w.slice(0, 40)}`}>{w}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <BackfillDateTimeFields
                        groupAriaLabel="วันที่แจ้งย้อนหลัง"
                        dateId="job-backfill-report-date"
                        timeId="job-backfill-report-time"
                        value={backfillReportDate}
                        onChange={setBackfillReportDate}
                        onValidityChange={setBackfillReportDateValid}
                        disabled={backfillSaving}
                      />
                      <BackfillDateTimeFields
                        groupAriaLabel="วันที่ปิดย้อนหลัง"
                        dateId="job-backfill-fix-date"
                        timeId="job-backfill-fix-time"
                        value={backfillFixDate}
                        onChange={setBackfillFixDate}
                        onValidityChange={setBackfillFixDateValid}
                        disabled={backfillSaving}
                      />
                    </div>
                    <p className="text-xs glass-subtle-text leading-relaxed">
                      หมายเหตุ: วันที่ปิดย้อนหลังตั้งได้เฉพาะงานสถานะ{" "}
                      <span className="glass-muted-text font-medium">เสร็จสิ้น (RESOLVED)</span>{" "}
                      และต้องไม่น้อยกว่าวันที่แจ้งย้อนหลัง
                    </p>
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={backfillSaving || backfillPolicyWarnings.length > 0}
                      className="min-h-11 cursor-pointer rounded-xl border-cyan-400/50 bg-cyan-100 px-4 py-2.5 text-xs font-semibold text-cyan-900 shadow-lg hover:bg-cyan-200/80 focus-visible:ring-cyan-500/40 disabled:opacity-60 sm:text-sm dark:border-cyan-500/35 dark:bg-cyan-900/40 dark:text-cyan-100 dark:hover:bg-cyan-800/45"
                    >
                      {backfillSaving ? "กำลังบันทึกวันเวลาย้อนหลัง..." : "บันทึกวันเวลาย้อนหลัง"}
                    </Button>
                  </form>
                </div>
              )}

              {job && (
                <div className={`${GLASS_SECTION} space-y-4`}>
                {job.status === "CANCELLED" ? (
                  <p className="text-sm glass-muted-text text-center py-6 px-2">
                    งานนี้ถูกยกเลิกแล้ว — ไม่มีการดำเนินการซ่อมต่อ และไม่สามารถบันทึกการแก้ไขหรือ Reopen ได้
                  </p>
                ) : (canEditFix || isReadOnlyFix) ? (
                  <form onSubmit={handleSubmitFix} className="space-y-4">
                    <div className="glass-card p-3 sm:p-4 space-y-3">
                      <p className="text-xs glass-muted-text leading-relaxed">
                        <span className="text-red-600 dark:text-red-400">*</span> บังคับกรอก:{" "}
                        <span className="glass-muted-text font-medium">
                          ประเภทสถานที่ (Indoor / Outdoor)
                        </span>
                        ,{" "}
                        <span className="glass-muted-text font-medium">
                          ประเภทงาน (Hardware / Software)
                        </span>{" "}
                        ,{" "}
                        <span className="glass-muted-text font-medium">สาเหตุ</span>
                        ,{" "}
                        <span className="glass-muted-text font-medium">วิธีแก้ไข</span>
                        และแนบรูป 2 รูปแรก — เลือกประเภทสถานที่ก่อน จึงจะเลือกประเภทงานได้
                        หมายเหตุและ Serial ไม่บังคับ
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label
                            className={GLASS_LABEL}
                            htmlFor="job-fix-environment"
                          >
                            ประเภทสถานที่ <span className="text-red-600 dark:text-red-400">*</span>
                          </Label>
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
                            styles={selectStyles}
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
                          <Label
                            className={GLASS_LABEL}
                            htmlFor="job-fix-category"
                          >
                            ประเภทงาน <span className="text-red-600 dark:text-red-400">*</span>
                          </Label>
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
                            styles={selectStyles}
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
                      <Label className={GLASS_LABEL} htmlFor="job-cause">
                        สาเหตุ <span className="text-red-600 dark:text-red-400">*</span>
                      </Label>
                      <Input
                        id="job-cause"
                        type="text"
                        className={cn("h-auto min-h-10", GLASS_FIELD)}
                        value={cause}
                        onChange={(e) => setCause(e.target.value)}
                        disabled={isReadOnlyFix}
                        required={canEditFix}
                      />
                    </div>
                    <div>
                      <Label className={GLASS_LABEL} htmlFor="job-fix-method">
                        วิธีแก้ไข <span className="text-red-600 dark:text-red-400">*</span>
                      </Label>
                      <Textarea
                        id="job-fix-method"
                        className={cn("min-h-[100px] resize-y", GLASS_FIELD)}
                        value={fixMethod}
                        onChange={(e) => setFixMethod(e.target.value)}
                        disabled={isReadOnlyFix}
                        required={canEditFix}
                      />
                    </div>
                    <div>
                      <Label className={GLASS_LABEL} htmlFor="job-fix-note">
                        หมายเหตุการแก้ไข
                      </Label>
                      <Input
                        id="job-fix-note"
                        type="text"
                        className={cn("h-auto min-h-10", GLASS_FIELD)}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        disabled={isReadOnlyFix}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                        <p
                          id="job-serial-hint"
                          className="text-xs glass-subtle-text leading-relaxed flex-1"
                        >
                          <span className="glass-muted-text font-medium">S/N:</span>{" "}
                          รับเฉพาะ A–Z / 0–9 / - (ตัวพิมพ์เล็กเป็นตัวใหญ่อัตโนมัติ อักขระอื่นถูกตัด)
                          — เพิ่มได้สูงสุด {JOB_SERIAL_ROWS_MAX} แถว
                        </p>
                        {!isReadOnlyFix && (
                          <button
                            type="button"
                            onClick={addSerialRow}
                            disabled={serialRows.length >= JOB_SERIAL_ROWS_MAX}
                            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] sm:min-w-0 px-3 rounded-xl border border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] glass-text text-xs font-semibold hover:bg-[var(--glass-nav-hover-bg)] transition-all active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer shrink-0"
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
                            className="glass-card p-3 sm:p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold uppercase tracking-wide glass-subtle-text">
                                อุปกรณ์ {idx + 1}
                              </span>
                              {!isReadOnlyFix && serialRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSerialRow(idx)}
                                  className="inline-flex items-center justify-center min-h-10 min-w-10 rounded-lg border border-[var(--glass-card-border)] glass-muted-text hover:text-red-600 hover:border-red-400/50 hover:bg-red-50 transition-colors cursor-pointer dark:hover:text-red-300 dark:hover:border-red-500/30 dark:hover:bg-red-950/20"
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
                          <span className="glass-muted-text font-normal">
                            (บังคับ 2 รูปแรก — ใช้รูปเดิมได้ / อัปโหลดใหม่เพื่อเปลี่ยน)
                          </span>
                        </span>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-1">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="flex flex-col group">
                              <p className="text-[11px] mb-1.5 font-medium glass-muted-text">
                                รูปที่ {i + 1}{" "}
                                {i < 2 && (
                                  <span className="text-red-600 dark:text-red-400">*</span>
                                )}
                              </p>
                              <div
                                onClick={() => fixFileRefs[i].current?.click()}
                                className={`relative aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-200 ${
                                  fixPreviews[i]
                                    ? "border-transparent bg-transparent"
                                    : "border-[var(--glass-card-border)] bg-[var(--glass-card-bg)]"
                                }`}
                              >
                                {!fixPreviews[i] && (
                                  <div className="absolute inset-0 group-hover:bg-[var(--glass-card-bg)] transition-colors" />
                                )}
                                {fixPreviews[i] ? (
                                  <>
                                    <ManagedImage
                                      src={fixPreviews[i]!}
                                      alt=""
                                      fill
                                      sizes={MANAGED_IMAGE_SIZES.uploadGridResponsive}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <span className="text-white text-xs font-semibold px-2 py-1 bg-black/50 rounded-lg backdrop-blur-sm">
                                        เปลี่ยนรูปภาพ
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center gap-1.5 z-10 glass-muted-text group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
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
                      <Button
                        type="submit"
                        variant="default"
                        disabled={saving || !fixFormReadyToSubmit}
                        className="mt-3 w-full cursor-pointer rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 focus-visible:ring-blue-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
                      >
                        {saving ? "กำลังบันทึก..." : "บันทึกและปิดงาน (สถานะ: เสร็จสิ้น)"}
                      </Button>
                    ) : isResolved && (canReopenAny || (canReopenSelf && isAssignee)) ? (
                      <div className="w-full mt-3 py-3 rounded-xl text-xs sm:text-sm font-medium text-center border border-dashed border-[var(--glass-card-border)] glass-muted-text bg-[var(--glass-card-bg)] backdrop-blur-sm">
                        งานนี้ถูกปิดแล้ว — หากต้องการแก้ไขข้อมูลการแก้ไข ให้ใช้ขั้นตอน Reopen ด้านล่าง
                      </div>
                    ) : isResolved ? (
                      <div className="w-full mt-3 py-3 rounded-xl text-xs sm:text-sm font-medium text-center border border-dashed border-[var(--glass-card-border)] glass-muted-text bg-[var(--glass-card-bg)] backdrop-blur-sm">
                        งานนี้ปิดแล้ว — ข้อมูลการแก้ไขเป็นโหมดอ่านอย่างเดียว — หากต้องการแก้ไข ให้ติดต่อผู้รับงานหรือผู้ดูแลระบบ
                      </div>
                    ) : job && job.status === "PENDING" ? (
                      <div className="w-full mt-3 py-3 rounded-xl text-xs sm:text-sm font-medium text-center border border-dashed border-amber-300 text-amber-900 bg-amber-50 backdrop-blur-sm dark:border-amber-500/25 dark:text-amber-100/90 dark:bg-amber-950/20">
                        งานสถานะรอดำเนินการ (PENDING) ยังปิดงานไม่ได้ — กรุณามอบหมายงานก่อนเพื่อเปลี่ยนเป็นกำลังแก้ไข
                      </div>
                    ) : job && !job.assignedTo ? (
                      <div className="w-full mt-3 py-3 rounded-xl text-xs sm:text-sm font-medium text-center border border-dashed border-amber-300 text-amber-900 bg-amber-50 backdrop-blur-sm dark:border-amber-500/25 dark:text-amber-100/90 dark:bg-amber-950/20">
                        ยังไม่มีผู้รับผิดชอบงาน — มอบหมายหรือรับงานด้านบนก่อน จึงจะบันทึกการแก้ไขและปิดงานได้
                      </div>
                    ) : (
                      <div className="w-full mt-3 py-3 rounded-xl text-xs sm:text-sm font-medium text-center border border-dashed border-[var(--glass-card-border)] glass-muted-text bg-[var(--glass-card-bg)] backdrop-blur-sm">
                        เฉพาะผู้รับงานที่ถูกมอบหมายเท่านั้นที่บันทึกและปิดงานได้
                      </div>
                    )}

                    {job && isResolved && (canReopenAny || (canReopenSelf && isAssignee)) && (
                      <div className="rounded-xl border border-orange-300 bg-orange-50 backdrop-blur-md p-4 flex flex-col gap-3 text-xs sm:text-sm mt-4 shadow-lg dark:border-orange-500/35 dark:bg-orange-950/25">
                        <div className="font-semibold text-orange-900 dark:text-orange-200">
                          Reopen เพื่อเปลี่ยนสถานะเป็น &quot;กำลังแก้ไข&quot; แล้วจึงแก้ไขข้อมูลได้
                        </div>
                        <Textarea
                          className="w-full rounded-xl border border-orange-300 bg-[var(--glass-card-bg)] px-3 py-2 text-xs glass-text placeholder:text-orange-700/50 focus-visible:border-orange-400/60 focus-visible:ring-orange-500/25 sm:text-sm dark:border-orange-500/30 dark:placeholder:text-orange-200/40"
                          rows={2}
                          placeholder="ระบุเหตุผลในการ Reopen เช่น ต้องแก้ไขรายละเอียดวิธีการแก้ไข หรืออัปเดตรูปเพิ่มเติม"
                          value={reopenReason}
                          onChange={(e) => setReopenReason(e.target.value)}
                          disabled={reopening}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="default"
                            onClick={() => void handleReopenJob()}
                            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-orange-700 focus-visible:ring-orange-500/40 active:scale-95 disabled:bg-orange-900/50 disabled:opacity-60"
                            disabled={!reopenReason.trim() || reopening}
                          >
                            {reopening ? (
                              <Loader2 size={16} className="animate-spin shrink-0" aria-hidden />
                            ) : null}
                            Reopen → กำลังแก้ไข
                          </Button>
                        </div>
                      </div>
                    )}
                  </form>
                ) : (
                  <p className="text-xs glass-muted-text text-center py-2">
                    ข้อมูลการแก้ไขถูกบันทึกแล้ว — การ Reopen/แก้ไขเพิ่มทำได้ตามสิทธิ์ที่กำหนดในบทบาท หากคุณไม่สามารถดำเนินการได้ โปรดติดต่อผู้ดูแลระบบ
                  </p>
                )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <JobImageLightbox
        open={!!previewImages?.length}
        onOpenChange={(open) => {
          if (!open) setPreviewImages(null);
        }}
        urls={previewImages ?? []}
        index={previewIndex}
        onIndexChange={setPreviewIndex}
      />

      <JobAssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        ticketNo={job?.ticketNo}
        assignLoading={assignLoading}
        assignOptions={assignOptions}
        assignSelectedId={assignSelectedId}
        onSelectStaff={setAssignSelectedId}
        assignActionSaving={assignActionSaving}
        onSubmit={() => void handleAssignSubmit()}
      />
    </DashboardPageShell>
  );
}

