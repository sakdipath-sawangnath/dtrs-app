"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  AlertCircle,
  Camera,
  Clock,
  CheckCircle2,
  MapPin,
  User,
  Calendar,
  RefreshCw,
  Wrench,
  Eye,
  FileText,
  Phone,
  Mail,
  X,
  UserPlus,
  Trash2,
  Ban,
  Loader2,
  Plus,
  Minus,
  Download,
  Stamp,
  FileSignature,
} from "lucide-react";
import { toastSuccess, toastError, confirmDialog, toastWarning } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import DashboardPageShell from "./DashboardPageShell";
import DashboardFilterBar from "./DashboardFilterBar";
import JobClassifyDocDialog from "./jobs/JobClassifyDocDialog";
import JobReporterSignDialog from "./jobs/JobReporterSignDialog";
import Select from "react-select";
import { getReactSelectGlassStyles } from "@/lib/reactSelectGlassStyles";
import { useAppTheme } from "@/lib/useAppTheme";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import DataTablePagination, { DataTablePageSize } from "./DataTablePagination";
import { createPortal } from "react-dom";
import { TextHoverTooltip } from "./TextHoverTooltip";
import SegmentedTabs from "./SegmentedTabs";
import {
  extractAssignableArray,
  axiosErrorData,
  formatApiErrorDetail,
  asRecord,
} from "@/lib/apiResponse";
import PersonAvatar from "@/components/PersonAvatar";
import { dashboardJobImagePath } from "@/lib/dashboardJobImageUrl";
import {
  JOB_SERIAL_ROWS_MAX,
  emptyJobSerialRow,
  normalizeSerialNumberInput,
  parseJobSerialRowsFromDb,
  serializeJobSerialRowsToFormFields,
  type JobSerialRowForm,
} from "@/lib/jobSerialRows";
import {
  countJobBreakdowns,
  normalizeBrokenPart,
  normalizeFixEnvironment,
} from "@/lib/jobBreakdownCounts";
import {
  buildJobsListAuditCsv,
  downloadUtf8Csv,
  workDurationDays,
} from "@/lib/jobsListCsvExport";
import JobImageLightbox from "@/components/jobs/JobImageLightbox";
import IssueImagesUploadPanel, {
  countNonemptyIssueImages,
  jobStatusAllowsIssueImageUpload,
} from "@/components/jobs/IssueImagesUploadPanel";
import ManagedImage, { MANAGED_IMAGE_SIZES } from "@/components/ManagedImage";
import { ensureStaffSignatureOrToast } from "@/lib/ensureStaffSignature";
import {
  clearFileInput,
  JOB_IMAGE_ACCEPT,
  JOB_IMAGE_HINT,
  validateJobImageFile,
} from "@/lib/jobImageUpload";
import {
  formatJobImageUploadError,
  runMultipartUploadWithProxyFallback,
} from "@/lib/jobImageProxyFallback";
import { jobNeedsAssignee } from "@/lib/jobAssignEligibility";
import {
  isClassifiedOutOfContractResolved,
  isFormalDocTicketNo,
} from "@/lib/docTicketNo";
import {
  buildFixPreviewUrlsFromJob,
  hasRequiredFixImageSlots,
  isAwaitingReporterSignature,
  isFixInfoComplete,
} from "@/lib/jobFixImageSlots";

function ActionIconButton({
  label,
  onClick,
  color,
  children,
}: {
  label: string;
  onClick?: () => void;
  color?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const computePos = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // วาง tooltip ทางขวากึ่งกลางปุ่ม
    setPos({
      top: r.top + r.height / 2,
      left: r.right + 10,
    });
  };

  useEffect(() => {
    if (!open) return;
    computePos();
    const onWin = () => computePos();
    window.addEventListener("scroll", onWin, true);
    window.addEventListener("resize", onWin);
    return () => {
      window.removeEventListener("scroll", onWin, true);
      window.removeEventListener("resize", onWin);
    };
  }, [open]);

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className="btn-icon btn-icon-sm"
        style={color ? { color } : undefined}
        aria-label={label}
        onMouseEnter={() => {
          setOpen(true);
          computePos();
        }}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => {
          setOpen(true);
          computePos();
        }}
        onBlur={() => setOpen(false)}
      >
        {children}
      </button>

      {open && pos
        ? createPortal(
            <div
              className="fixed pointer-events-none"
              style={{
                top: pos.top,
                left: pos.left,
                transform: "translateY(-50%)",
                zIndex: 9999,
              }}
            >
              <div className="glass-card glass-text text-[11px] px-2 py-1 shadow-lg whitespace-nowrap">
                {label}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

function limitText(s: string, maxLen: number): { short: string; full: string; clipped: boolean } {
  const full = (s ?? "").trim();
  if (!full) return { short: "–", full: "", clipped: false };
  const clipped = full.length > maxLen;
  return { short: clipped ? full.slice(0, maxLen) + "…" : full, full, clipped };
}

/** ให้ตรงกับหน้า `/dashboard/jobs/[id]` — ข้อมูลการแก้ไข */
const FIX_ENVIRONMENT_OPTIONS = [
  { value: "INDOOR", label: "Indoor (ในอาคาร)" },
  { value: "OUTDOOR", label: "Outdoor (นอกอาคาร)" },
] as const;

const FIX_CATEGORY_OPTIONS = [
  { value: "Hardware", label: "Hardware (ฮาร์ดแวร์)" },
  { value: "Software", label: "Software (ซอฟต์แวร์)" },
] as const;

const GLASS_MODAL_LABEL = "glass-label font-semibold";
const GLASS_MODAL_FIELD = "form-input-glass w-full text-xs sm:text-sm shadow-inner transition-all disabled:cursor-not-allowed disabled:opacity-80";
const GLASS_MODAL_TEXTAREA = `${GLASS_MODAL_FIELD} min-h-[100px] resize-y`;

interface Job {
  id: number;
  ticketNo?: string;
  title?: string;
  description?: string;
  location?: string;
  province?: string;
  district?: string;
  status: string;
  reportDate?: string;
  createdAt: string;
  assignedTo?: { id: number; name: string; image?: string | null };
  reporter?: { id?: number; image?: string | null } | null;
  reporterName?: string;
  reporterPhone?: string;
  reporterEmail?: string;
  images?: string[] | null;
  // Fix details
  brokenPart?: string | null;
  cause?: string | null;
  fixMethod?: string | null;
  oldSerialNumber?: string | null;
  newSerialNumber?: string | null;
  fixImages?: string[] | null;
  fixDate?: string | null;
  fixNote?: string | null;
  fixEnvironment?: string | null;
  isOutOfContract?: boolean;
}

function unwrapApiData<T>(root: unknown): T | null {
  if (!root) return null;
  if (typeof root === "object" && root !== null && "data" in (root as Record<string, unknown>)) {
    return ((root as { data?: unknown }).data as T) ?? null;
  }
  return root as T;
}

function getSocketBaseUrl(apiBase: string): string {
  return apiBase.replace(/\/api\/?$/, "");
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeCls: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "รอดำเนินการ",
    badgeCls:
      "border border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300",
    icon: <AlertCircle size={14} className="text-orange-600 dark:text-orange-400" />,
  },
  IN_PROGRESS: {
    label: "กำลังแก้ไข",
    badgeCls:
      "border border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300",
    icon: <Clock size={14} className="text-blue-600 dark:text-blue-400" />,
  },
  RESOLVED: {
    label: "เสร็จสิ้น",
    badgeCls:
      "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
    icon: <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />,
  },
  CANCELLED: {
    label: "ยกเลิก",
    badgeCls:
      "badge border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-500/40 dark:bg-slate-700/40 dark:text-slate-200",
    icon: <Ban size={14} className="text-slate-500 dark:text-slate-400" />,
  },
};

const AWAITING_SIGNATURE_BADGE_CLS =
  "h-auto px-2 py-1 text-xs font-semibold shadow-none ring-0 border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/35 dark:bg-amber-950/30 dark:text-amber-100";

function AwaitingReporterSignatureBadge() {
  return (
    <Badge variant="outline" className={AWAITING_SIGNATURE_BADGE_CLS}>
      รอเซ็นผู้แจ้ง
    </Badge>
  );
}

function getPageTitle(
  statusFilter?: string,
  showOutOfContract?: boolean,
  assignedToMe?: boolean
): { title: string; subtitle: string } {
  if (assignedToMe) {
    if (showOutOfContract === true) {
      return {
        title: "งานที่รับผิดชอบ · นอกสัญญา",
        subtitle: "รายการงานที่คุณได้รับมอบหมาย (นอกสัญญา)",
      };
    }
    return {
      title: "งานที่รับผิดชอบ · สัญญา",
      subtitle: "รายการงานที่คุณได้รับมอบหมายทั้งหมด (สัญญา)",
    };
  }
  if (showOutOfContract)
    return { title: "นอกสัญญา", subtitle: "รายการแจ้งซ่อมนอกสัญญา" };
  switch (statusFilter) {
    case "PENDING":
      return { title: "รอดำเนินการ", subtitle: "รายการที่รอรับเข้าระบบ" };
    case "IN_PROGRESS":
      return { title: "กำลังแก้ไข", subtitle: "รายการที่กำลังดำเนินการ" };
    default:
      return {
        title: "ข้อขัดข้อง",
        subtitle: "ประวัติการแจ้งข้อขัดข้องทั้งหมด",
      };
  }
}

const PAGE_SIZE_OPTIONS = [
  { value: 15, label: "15" },
  { value: 30, label: "30" },
  { value: 45, label: "45" },
  { value: "all", label: "ทั้งหมด" },
] as const;

/** เรียงรายการงาน — ค่า null/parse ไม่ได้ = ไปท้ายรายการเสมอ (ตามแผนตรวจสอบข้อมูล) */
export type JobListSortField = "report" | "created" | "fix";
export type JobListSortDir = "desc" | "asc";

function parseJobTimeMs(iso: string | undefined | null): number | null {
  if (iso == null || String(iso).trim() === "") return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function getJobSortComparable(
  job: Job,
  field: JobListSortField,
): { primary: number | null; secondary: number } {
  const createdMs = parseJobTimeMs(job.createdAt) ?? 0;
  if (field === "created") {
    return { primary: createdMs, secondary: job.id };
  }
  if (field === "report") {
    const reportMs = parseJobTimeMs(job.reportDate ?? null);
    const primary = reportMs ?? createdMs;
    return { primary, secondary: job.id };
  }
  // fix
  const fixMs = parseJobTimeMs(job.fixDate ?? null);
  return { primary: fixMs, secondary: job.id };
}

function compareJobsForList(
  a: Job,
  b: Job,
  field: JobListSortField,
  dir: JobListSortDir,
): number {
  const ca = getJobSortComparable(a, field);
  const cb = getJobSortComparable(b, field);
  const aNull = ca.primary == null;
  const bNull = cb.primary == null;
  if (aNull && bNull) return ca.secondary - cb.secondary;
  if (aNull) return 1;
  if (bNull) return -1;
  const diff = (ca.primary as number) - (cb.primary as number);
  if (diff !== 0) return dir === "desc" ? -diff : diff;
  return ca.secondary - cb.secondary;
}

/** No-Card: แยก Glass ย่อย (AGENTS.md) */
const GLASS_SECTION = "glass-card";

/** แท็บสัญญา/นอกสัญญา — ไม่ห่อ card ซ้อน (กล่องเดียวอยู่ใน SegmentedTabs) */
const CONTRACT_TABS_ROW_WRAP =
  "shrink-0 w-full sm:w-fit max-w-full min-w-0 self-stretch sm:self-start";

/** พื้นหลังรายการแบบ No-Card — glass-card ครอบทั้งแท็บ/ฟิลเตอร์/ตาราง (theme-aware) */
const NO_CARD_SHELL =
  "flex flex-col gap-4 flex-1 min-h-0 overflow-auto p-4 sm:p-5 w-full glass-card text-slate-900 dark:text-slate-100";

export default function JobsList({
  statusFilter,
  statusAllowlist,
  showOutOfContract = false,
  assignedToMe = false,
  showContractTabs = false,
  onShowOutOfContractChange,
  title: customTitle,
  subtitle: customSubtitle,
  noCard = false,
  enableAllBreakdownFilters = false,
  enableMoveOutOfContract = true,
}: {
  statusFilter?: string;
  /** หลายสถานะ (เช่น หน้า นอกสัญญา = PENDING + RESOLVED ที่จำแนกแล้ว) */
  statusAllowlist?: string[];
  showOutOfContract?: boolean;
  assignedToMe?: boolean;
  showContractTabs?: boolean;
  onShowOutOfContractChange?: (value: boolean) => void;
  title?: string;
  subtitle?: string;
  noCard?: boolean;
  /**
   * เฉพาะหน้า `/dashboard/all`:
   * - เพิ่ม Filter Select: ประเภทสถานที่ (fixEnvironment), ประเภทงาน (brokenPart), สถานะ, ผู้รับผิดชอบ
   * - เพิ่ม Card quick filter ที่ทำให้ข้อมูลเปลี่ยนตามค่า
   * - เพิ่มคอลัมน์ในตารางสำหรับ fixEnvironment / brokenPart
   */
  enableAllBreakdownFilters?: boolean;
  /** ปุ่ม «ย้ายนอกสัญญา» ในคอลัมน์จัดการ — ปิดบน `/dashboard/pending` */
  enableMoveOutOfContract?: boolean;
}) {
  const { theme } = useAppTheme();
  const selectStyles = getReactSelectGlassStyles(theme);

  const [jobs, setJobs] = useState<Job[]>([]);
  /** รายการหลังกรองสถานะ/มอบหมายให้ฉัน แต่ก่อนแยกสัญญา/นอกสัญญา — ใช้นับ badge แท็บ */
  const [jobsForContractCounts, setJobsForContractCounts] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  // เฉพาะหน้า `/dashboard/all`: แยกตามประเภทสถานที่, ประเภทงาน, สถานะ, และผู้รับผิดชอบ
  const [statusSelect, setStatusSelect] = useState<string>("");
  const [fixEnvironmentSelect, setFixEnvironmentSelect] = useState<string>("");
  const [brokenPartSelect, setBrokenPartSelect] = useState<string>("");
  /** ค่า `__unassigned__` = ยังไม่มีผู้รับผิดชอบ; อื่นๆ = id ผู้รับงาน */
  const [assignedToSelect, setAssignedToSelect] = useState<string>("");
  const [pageSize, setPageSize] = useState<DataTablePageSize>(15);
  const [page, setPage] = useState(1);
  const [jobSortField, setJobSortField] = useState<JobListSortField>(
    enableAllBreakdownFilters ? "created" : "report",
  );
  const [jobSortDir, setJobSortDir] = useState<JobListSortDir>("desc");
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [assignJob, setAssignJob] = useState<Job | null>(null);
  /** มอบหมายหลายรายการพร้อมกัน (หน้า /dashboard/all) */
  const [assignBulkIds, setAssignBulkIds] = useState<number[]>([]);
  const [bulkAssignSelectedIds, setBulkAssignSelectedIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [assignableStaff, setAssignableStaff] = useState<
    { id: number; name?: string | null; username?: string; email?: string }[]
  >([]);
  const [assignSelectedId, setAssignSelectedId] = useState<number | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [myPermissions, setMyPermissions] = useState<string[] | null>(null);
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role ?? "";
  const userRoleUpper = String(userRole).toUpperCase();
  const [movingOutOfContractJobId, setMovingOutOfContractJobId] = useState<number | null>(null);
  const [classifyJob, setClassifyJob] = useState<Job | null>(null);
  const [signJob, setSignJob] = useState<Job | null>(null);
  const [classifySubmitting, setClassifySubmitting] = useState(false);

  // ---- Update Fix Info Modal (IN_PROGRESS) ----
  const [updateFixJob, setUpdateFixJob] = useState<Job | null>(null);
  const [updateFixLoading, setUpdateFixLoading] = useState(false);
  const [updateFixSaving, setUpdateFixSaving] = useState(false);

  const [updateBrokenPartType, setUpdateBrokenPartType] = useState<string>("");
  const [updateFixEnvironment, setUpdateFixEnvironment] = useState<string>("");
  const [updateCause, setUpdateCause] = useState<string>("");
  const [updateFixMethod, setUpdateFixMethod] = useState<string>("");
  const [updateNote, setUpdateNote] = useState<string>("");
  const [updateSerialRows, setUpdateSerialRows] = useState<JobSerialRowForm[]>([
    emptyJobSerialRow(),
  ]);
  const [updateFixImages, setUpdateFixImages] = useState<(File | null)[]>([
    null,
    null,
    null,
  ]);
  const [updateFixPreviews, setUpdateFixPreviews] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);

  const updateFixFileRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const updateFixEnvironmentSelectValue = useMemo(() => {
    if (!updateFixEnvironment) return null;
    return (
      FIX_ENVIRONMENT_OPTIONS.find((o) => o.value === updateFixEnvironment) ?? null
    );
  }, [updateFixEnvironment]);

  const updateFixCategorySelectValue = useMemo(() => {
    if (!updateBrokenPartType) return null;
    return (
      FIX_CATEGORY_OPTIONS.find((o) => o.value === updateBrokenPartType) ?? null
    );
  }, [updateBrokenPartType]);

  const updateModalSerialRow = (index: number, patch: Partial<JobSerialRowForm>) => {
    setUpdateSerialRows((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const addModalSerialRow = () => {
    setUpdateSerialRows((prev) =>
      prev.length >= JOB_SERIAL_ROWS_MAX ? prev : [...prev, emptyJobSerialRow()],
    );
  };

  const removeModalSerialRow = (index: number) => {
    setUpdateSerialRows((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
    );
  };

  const [updateReopenReason, setUpdateReopenReason] = useState("");
  const [updateFixReopening, setUpdateFixReopening] = useState(false);
  const [updatePreviewImages, setUpdatePreviewImages] = useState<string[] | null>(null);
  const [updatePreviewIndex, setUpdatePreviewIndex] = useState(0);
  const API =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4100/api";
  const token = (session as { accessToken?: string })?.accessToken;
  const router = useRouter();
  const currentUserId = Number((session?.user as { id?: string })?.id ?? 0);

  // ใช้ permission เพื่อให้ปุ่มขึ้น/ลงได้ตามหน้า "จัดการบทบาทและสิทธิ์"
  useEffect(() => {
    const run = async () => {
      if (!token) {
        setMyPermissions(null);
        return;
      }
      try {
        const res = await axios.get(
          `${API}/roles/me/permissions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const payload = unwrapApiData<unknown>(res?.data) as
          | { permissions?: unknown }
          | null;
        const perms = payload?.permissions;
        setMyPermissions(Array.isArray(perms) ? (perms as string[]) : null);
      } catch {
        setMyPermissions(null);
      }
    };
    run();
  }, [token, API]);

  /** สิทธิ์จากหน้า /dashboard/roles — ถ้ายังไม่โหลดให้ fallback ตาม role ใน JWT */
  const canAssignJob = useMemo(() => {
    if (myPermissions !== null) {
      return myPermissions.includes("job.assign");
    }
    return userRoleUpper === "SUPERVISOR" || userRoleUpper === "ADMIN";
  }, [myPermissions, userRoleUpper]);

  const enableBulkAssign = enableAllBreakdownFilters && canAssignJob;

  const canMoveOutOfContract = useMemo(() => {
    if (myPermissions !== null) {
      return myPermissions.includes("job.assign");
    }
    return userRoleUpper === "ADMIN" || userRoleUpper === "SUPERVISOR";
  }, [myPermissions, userRoleUpper]);

  const canClassifyDoc = useMemo(() => {
    if (myPermissions === null) return false;
    return myPermissions.includes("job.classifyDoc");
  }, [myPermissions]);

  const canClassifyDocContract = useMemo(() => {
    if (myPermissions === null) return false;
    return myPermissions.includes("job.classifyDoc.contract");
  }, [myPermissions]);

  const canClassifyDocOutOfContract = useMemo(() => {
    if (myPermissions === null) return false;
    return myPermissions.includes("job.classifyDoc.outOfContract");
  }, [myPermissions]);

  const canDeleteUnassigned =
    myPermissions != null
      ? myPermissions.includes("job.deleteUnassigned")
      : ["ADMIN", "SUPERVISOR"].includes(userRoleUpper);

  /** หน้า «กำลังแก้ไข» — ลบ IN_PROGRESS ตามสิทธิ์ job.deleteInProgress (สอดคล้อง API) */
  const canAdminDeleteInProgress = useMemo(() => {
    if (statusFilter !== "IN_PROGRESS") return false;
    if (myPermissions !== null) {
      return myPermissions.includes("job.deleteInProgress");
    }
    return userRoleUpper === "ADMIN";
  }, [statusFilter, myPermissions, userRoleUpper]);

  const canCancelPending = useMemo(() => {
    if (myPermissions !== null) {
      return myPermissions.includes("job.cancel");
    }
    return userRoleUpper === "ADMIN" || userRoleUpper === "SUPERVISOR";
  }, [myPermissions, userRoleUpper]);

  const canFixAny = useMemo(() => {
    if (myPermissions !== null) {
      return myPermissions.includes("job.fix.any");
    }
    return userRoleUpper === "ADMIN";
  }, [myPermissions, userRoleUpper]);

  const canFixSelf = useMemo(() => {
    if (myPermissions !== null) {
      return myPermissions.includes("job.fix.self");
    }
    return ["STAFF", "SUPERVISOR", "ADMIN"].includes(userRoleUpper);
  }, [myPermissions, userRoleUpper]);

  const canUserCloseJob = useCallback(
    (job: Job) => {
      if (job.status !== "IN_PROGRESS" || !job.assignedTo) return false;
      const isAssignee = String(job.assignedTo.id) === String(currentUserId);
      return canFixAny || (canFixSelf && isAssignee);
    },
    [canFixAny, canFixSelf, currentUserId],
  );

  /** แท็บสัญญา/นอกสัญญา — ตั้งที่ /dashboard/roles (`job.viewContractTabs`) */
  const canViewContractTabs = useMemo(() => {
    if (myPermissions !== null) {
      return myPermissions.includes("job.viewContractTabs");
    }
    return ["ADMIN", "STAFF", "SUPERVISOR"].includes(userRoleUpper);
  }, [myPermissions, userRoleUpper]);

  const effectiveShowContractTabs = showContractTabs && canViewContractTabs;
  const effectiveShowOutOfContract =
    effectiveShowContractTabs && showOutOfContract;

  const { title: derivedTitle, subtitle: derivedSubtitle } = getPageTitle(
    statusFilter,
    effectiveShowOutOfContract,
    assignedToMe,
  );
  const title = customTitle || derivedTitle || "ข้อขัดข้อง";
  const subtitle = customSubtitle || derivedSubtitle || "รายการแจ้งซ่อมและสถานะ";

  const fetchJobs = useCallback(async (opts?: { silent?: boolean }) => {
    if (!token) return;
    if (!opts?.silent) setLoading(true);
    try {
      const res = await axios.get(`${API}/jobs/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = unwrapApiData<unknown>(res?.data);
      let data: Job[] = Array.isArray(payload) ? (payload as Job[]) : [];
      if (statusAllowlist && statusAllowlist.length > 0) {
        const allowed = new Set(statusAllowlist);
        data = data.filter((j) => allowed.has(j.status));
      } else if (statusFilter) {
        data = data.filter((j) => j.status === statusFilter);
      }
      if (assignedToMe && currentUserId) {
        data = data.filter(
          (j) => j.assignedTo && Number(j.assignedTo.id) === currentUserId
        );
      }
      if (effectiveShowContractTabs) {
        setJobsForContractCounts(data);
      } else {
        setJobsForContractCounts([]);
      }
      const dedicatedOutOfContractPage =
        showOutOfContract === true && !showContractTabs;
      if (effectiveShowContractTabs || dedicatedOutOfContractPage) {
        if (showOutOfContract === true) {
          data = data.filter((j) => j.isOutOfContract === true);
        } else {
          data = data.filter((j) => j.isOutOfContract !== true);
        }
      } else {
        data = data.filter((j) => j.isOutOfContract !== true);
      }
      // ประวัติทั้งหมด / งานของฉัน: งาน RESOLVED นอกสัญญาที่จำแนกแล้วไปหน้าเมนูนอกสัญญา
      if (enableAllBreakdownFilters || assignedToMe) {
        data = data.filter((j) => !isClassifiedOutOfContractResolved(j));
      }
      // คิวหน้า นอกสัญญา: RESOLVED เฉพาะที่จำแนกแล้ว (PENDING คงเดิม)
      if (dedicatedOutOfContractPage) {
        data = data.filter(
          (j) =>
            j.status !== "RESOLVED" || isFormalDocTicketNo(j.ticketNo),
        );
      }
      setJobs(data);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        toastError("เซสชันหมดอายุ", "กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
        // เคลียร์ session ฝั่ง NextAuth และพากลับหน้า login
        await signOut({ redirect: false });
        router.replace("/login");
        return;
      }
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [
    API,
    assignedToMe,
    currentUserId,
    router,
    effectiveShowContractTabs,
    effectiveShowOutOfContract,
    statusFilter,
    statusAllowlist,
    token,
    showOutOfContract,
    showContractTabs,
    enableAllBreakdownFilters,
  ]);

  useEffect(() => {
    if (session?.user) {
      void fetchJobs();
    }
  }, [fetchJobs, session]);

  // Real-time refresh: เมื่อมีงานใหม่/อัปเดตสถานะ ให้รีเฟรช list
  useEffect(() => {
    if (!token) return;
    const base = getSocketBaseUrl(API);
    // ปล่อยให้ socket.io จัดการการเชื่อมต่อเอง (รองรับ polling -> websocket)
    // บางสภาพแวดล้อม/หลังบ้านอาจปิด websocket ทำให้ console error บ่อย
    // ใช้ polling เพื่อให้เชื่อมต่อได้เสถียรกว่า แล้ว socket.io จะจัดการ fallback เอง
    const s: Socket = io(base, { transports: ["polling"] });
    const onNewJob = () => void fetchJobs();
    const onJobUpdated = () => void fetchJobs();
    s.on("new-job", onNewJob);
    s.on("job-updated", onJobUpdated);
    return () => {
      s.off("new-job", onNewJob);
      s.off("job-updated", onJobUpdated);
      s.disconnect();
    };
  }, [API, fetchJobs, token]);

  const baseFilteredJobs = useMemo(() => {
    let list = jobs;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (j) =>
          (j.ticketNo && j.ticketNo.toLowerCase().includes(q)) ||
          (j.description && j.description.toLowerCase().includes(q)) ||
          (j.reporterName && j.reporterName.toLowerCase().includes(q)) ||
          (j.assignedTo?.name && j.assignedTo.name.toLowerCase().includes(q)) ||
          (j.province && j.province.toLowerCase().includes(q)) ||
          (j.district && j.district.toLowerCase().includes(q)) ||
          (j.location && j.location.toLowerCase().includes(q))
      );
    }
    if (provinceFilter) list = list.filter((j) => (j.province ?? "") === provinceFilter);
    if (districtFilter) list = list.filter((j) => (j.district ?? "") === districtFilter);
    return list;
  }, [jobs, search, provinceFilter, districtFilter]);

  const assigneeFilterOptions = useMemo(() => {
    const map = new Map<number, string>();
    jobs.forEach((j) => {
      if (j.assignedTo?.id != null) {
        map.set(j.assignedTo.id, j.assignedTo.name?.trim() || `ผู้ใช้ #${j.assignedTo.id}`);
      }
    });
    return Array.from(map.entries()).sort((a, b) =>
      a[1].localeCompare(b[1], "th"),
    );
  }, [jobs]);

  const applyAssignedToFilter = useCallback(
    (list: Job[]) => {
      if (!assignedToSelect) return list;
      if (assignedToSelect === "__unassigned__") {
        return list.filter((j) => !j.assignedTo);
      }
      return list.filter(
        (j) => j.assignedTo && String(j.assignedTo.id) === assignedToSelect,
      );
    },
    [assignedToSelect],
  );

  const filteredJobs = useMemo(() => {
    let list = baseFilteredJobs;
    if (enableAllBreakdownFilters) {
      if (statusSelect) list = list.filter((j) => j.status === statusSelect);
      if (fixEnvironmentSelect)
        list = list.filter(
          (j) => normalizeFixEnvironment(j.fixEnvironment) === fixEnvironmentSelect
        );
      if (brokenPartSelect)
        list = list.filter(
          (j) => normalizeBrokenPart(j.brokenPart) === brokenPartSelect
        );
      list = applyAssignedToFilter(list);
    }
    return list;
  }, [
    baseFilteredJobs,
    enableAllBreakdownFilters,
    statusSelect,
    fixEnvironmentSelect,
    brokenPartSelect,
    applyAssignedToFilter,
  ]);

  const sortedFilteredJobs = useMemo(() => {
    const list = [...filteredJobs];
    list.sort((a, b) => compareJobsForList(a, b, jobSortField, jobSortDir));
    return list;
  }, [filteredJobs, jobSortField, jobSortDir]);

  const provinces = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => j.province && set.add(j.province));
    return Array.from(set).sort();
  }, [jobs]);

  const districts = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (!j.district) return;
      if (provinceFilter && j.province !== provinceFilter) return;
      set.add(j.district);
    });
    return Array.from(set).sort();
  }, [jobs, provinceFilter]);

  /** งานค้าง = ยังไม่เสร็จสิ้น (ไม่นับ RESOLVED / CANCELLED) — แยกนับตามสัญญา/นอกสัญญา */
  const contractTabBadgeCounts = useMemo(() => {
    if (!effectiveShowContractTabs) return { contract: 0, out: 0 };
    const unfinished = (j: Job) =>
      j.status !== "RESOLVED" && j.status !== "CANCELLED";
    return {
      contract: jobsForContractCounts.filter(
        (j) => j.isOutOfContract !== true && unfinished(j),
      ).length,
      out: jobsForContractCounts.filter(
        (j) => j.isOutOfContract === true && unfinished(j),
      ).length,
    };
  }, [effectiveShowContractTabs, jobsForContractCounts]);

  const contractSegmentTabs = useMemo(
    () => [
      {
        id: "contract" as const,
        label: "สัญญา",
        icon: CheckCircle2,
        badgeCount: contractTabBadgeCounts.contract,
      },
      {
        id: "out" as const,
        label: "นอกสัญญา",
        icon: Clock,
        badgeCount: contractTabBadgeCounts.out,
      },
    ],
    [contractTabBadgeCounts],
  );

  const paginatedJobs = useMemo(() => {
    if (pageSize === "all") return sortedFilteredJobs;
    const start = (page - 1) * pageSize;
    return sortedFilteredJobs.slice(start, start + pageSize);
  }, [sortedFilteredJobs, pageSize, page]);

  const totalPages = useMemo(() => {
    if (pageSize === "all") return 1;
    return Math.ceil(sortedFilteredJobs.length / pageSize) || 1;
  }, [sortedFilteredJobs.length, pageSize]);

  const handleExportJobsCsv = useCallback(() => {
    if (sortedFilteredJobs.length === 0) {
      toastError("ไม่มีข้อมูลที่ส่งออก", "ลองปรับตัวกรองหรือรีเฟรชรายการ");
      return;
    }
    const tab = effectiveShowOutOfContract ? "นอกสัญญา" : "สัญญา";
    const stamp = format(new Date(), "yyyy-MM-dd_HHmm", { locale: th });
    const filename = `รายการงาน_${tab}_${stamp}.csv`;
    const body = buildJobsListAuditCsv(sortedFilteredJobs);
    downloadUtf8Csv(filename, body);
    toastSuccess(
      `ส่งออก CSV แล้ว · รวม ${sortedFilteredJobs.length} แถว (ตามตัวกรองและการเรียงปัจจุบัน ไม่จำกัดเฉพาะหน้าตาราง)`,
    );
  }, [sortedFilteredJobs, effectiveShowOutOfContract]);

  const showAssignedToColumn = statusFilter !== "PENDING";

  const filterBarChildren = (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto text-slate-900 dark:text-slate-100">
      {enableAllBreakdownFilters && (
        <>
          <select
            className="select-native-glass w-full sm:w-44 md:min-w-[160px] text-slate-900 dark:text-slate-100"
            value={statusSelect}
            onChange={(e) => setStatusSelect(e.target.value)}
          >
            <option value="">ทุกสถานะ</option>
            <option value="PENDING">{STATUS_CONFIG.PENDING.label}</option>
            <option value="IN_PROGRESS">{STATUS_CONFIG.IN_PROGRESS.label}</option>
            <option value="RESOLVED">{STATUS_CONFIG.RESOLVED.label}</option>
            <option value="CANCELLED">{STATUS_CONFIG.CANCELLED.label}</option>
          </select>

          <select
            className="select-native-glass w-full sm:w-44 md:min-w-[160px] text-slate-900 dark:text-slate-100"
            value={fixEnvironmentSelect}
            onChange={(e) => setFixEnvironmentSelect(e.target.value)}
          >
            <option value="">ทุกประเภทสถานที่</option>
            <option value="INDOOR">Indoor (ในอาคาร)</option>
            <option value="OUTDOOR">Outdoor (นอกอาคาร)</option>
            <option value="UNKNOWN">ไม่ระบุ</option>
          </select>

          <select
            className="select-native-glass w-full sm:w-44 md:min-w-[160px] text-slate-900 dark:text-slate-100"
            value={brokenPartSelect}
            onChange={(e) => setBrokenPartSelect(e.target.value)}
          >
            <option value="">ทุกประเภทงาน</option>
            <option value="Hardware">Hardware (ฮาร์ดแวร์)</option>
            <option value="Software">Software (ซอฟต์แวร์)</option>
            <option value="UNKNOWN">ไม่ระบุ</option>
          </select>

          <select
            className="select-native-glass w-full sm:w-44 md:min-w-[160px] text-slate-900 dark:text-slate-100"
            value={assignedToSelect}
            onChange={(e) => setAssignedToSelect(e.target.value)}
            aria-label="กรองตามผู้รับผิดชอบ"
          >
            <option value="">ทุกผู้รับผิดชอบ</option>
            <option value="__unassigned__">ยังไม่มีผู้รับผิดชอบ</option>
            {assigneeFilterOptions.map(([id, name]) => (
              <option key={id} value={String(id)}>
                {name}
              </option>
            ))}
          </select>
        </>
      )}
      <select
        className="select-native-glass w-full sm:w-44 md:min-w-[160px] text-slate-900 dark:text-slate-100"
        value={provinceFilter}
        onChange={(e) => setProvinceFilter(e.target.value)}
      >
        <option value="">ทุกจังหวัด</option>
        {provinces.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <select
        className="select-native-glass w-full sm:w-44 md:min-w-[160px] text-slate-900 dark:text-slate-100"
        value={districtFilter}
        onChange={(e) => setDistrictFilter(e.target.value)}
        disabled={!provinceFilter && districts.length === 0}
      >
        <option value="">{provinceFilter ? "ทุกอำเภอ" : "ทุกอำเภอ"}</option>
        {districts.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <select
        className="select-native-glass w-full sm:w-48 md:min-w-[180px] text-slate-900 dark:text-slate-100"
        value={jobSortField}
        onChange={(e) => {
          setPage(1);
          setJobSortField(e.target.value as JobListSortField);
        }}
        aria-label="เรียงตามวันที่"
      >
        <option value="report">วันที่แจ้ง (report → สร้าง)</option>
        <option value="created">วันที่สร้างในระบบ</option>
        <option value="fix">วันที่ปิดงาน</option>
      </select>
      <select
        className="select-native-glass w-full sm:w-40 md:min-w-[140px] text-slate-900 dark:text-slate-100"
        value={jobSortDir}
        onChange={(e) => {
          setPage(1);
          setJobSortDir(e.target.value as JobListSortDir);
        }}
        aria-label="ทิศทางการเรียง"
      >
        <option value="desc">ใหม่ → เก่า</option>
        <option value="asc">เก่า → ใหม่</option>
      </select>
      <select
        className="select-native-glass w-full sm:w-28 md:min-w-[112px] text-slate-900 dark:text-slate-100"
        value={pageSize}
        onChange={(e) => {
          const v = e.target.value;
          setPageSize(v === "all" ? "all" : (Number(v) as 15 | 30 | 45));
        }}
      >
        {PAGE_SIZE_OPTIONS.map((o) => (
          <option key={String(o.value)} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  const filterBarProps = {
    searchPlaceholder: "ค้นหา เลขที่, รายละเอียด, ผู้แจ้ง, สถานที่...",
    searchValue: search,
    onSearchChange: setSearch,
    onRefresh: fetchJobs,
    children: filterBarChildren,
    ...(enableAllBreakdownFilters
      ? {
          rightActions: (
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              onClick={handleExportJobsCsv}
              disabled={sortedFilteredJobs.length === 0}
              aria-label="ส่งออกรายการเป็นไฟล์ CSV สำหรับตรวจสอบข้อมูล"
              title="ส่งออกทุกแถวที่ผ่านตัวกรองปัจจุบัน (ไม่จำกัดเฉพาะหน้าตาราง) — UTF-8 พร้อม BOM สำหรับ Excel"
              className="size-11 shrink-0 cursor-pointer rounded-xl border-[var(--glass-input-border)] bg-[var(--glass-input-bg)] glass-text shadow-sm hover:bg-[var(--glass-accent-soft)] hover:border-blue-500/50 focus-visible:ring-blue-500/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
            >
              <Download size={18} className="shrink-0" aria-hidden />
            </Button>
          ),
        }
      : {}),
  };

  const jobsForEnvCardCounts = useMemo(() => {
    if (!enableAllBreakdownFilters) return baseFilteredJobs;
    let list = baseFilteredJobs;
    if (statusSelect) list = list.filter((j) => j.status === statusSelect);
    if (brokenPartSelect) {
      list = list.filter(
        (j) => normalizeBrokenPart(j.brokenPart) === brokenPartSelect
      );
    }
    list = applyAssignedToFilter(list);
    return list;
  }, [
    enableAllBreakdownFilters,
    baseFilteredJobs,
    statusSelect,
    brokenPartSelect,
    applyAssignedToFilter,
  ]);

  const jobsForStatusCardCounts = useMemo(() => {
    if (!enableAllBreakdownFilters) return baseFilteredJobs;
    let list = baseFilteredJobs;
    if (fixEnvironmentSelect) {
      list = list.filter(
        (j) => normalizeFixEnvironment(j.fixEnvironment) === fixEnvironmentSelect
      );
    }
    if (brokenPartSelect) {
      list = list.filter(
        (j) => normalizeBrokenPart(j.brokenPart) === brokenPartSelect
      );
    }
    list = applyAssignedToFilter(list);
    return list;
  }, [
    enableAllBreakdownFilters,
    baseFilteredJobs,
    fixEnvironmentSelect,
    brokenPartSelect,
    applyAssignedToFilter,
  ]);

  const jobsForPartCardCounts = useMemo(() => {
    if (!enableAllBreakdownFilters) return baseFilteredJobs;
    let list = baseFilteredJobs;
    if (statusSelect) list = list.filter((j) => j.status === statusSelect);
    if (fixEnvironmentSelect) {
      list = list.filter(
        (j) => normalizeFixEnvironment(j.fixEnvironment) === fixEnvironmentSelect
      );
    }
    list = applyAssignedToFilter(list);
    return list;
  }, [
    enableAllBreakdownFilters,
    baseFilteredJobs,
    statusSelect,
    fixEnvironmentSelect,
    applyAssignedToFilter,
  ]);

  const envCounts = useMemo(() => {
    if (!enableAllBreakdownFilters) return { INDOOR: 0, OUTDOOR: 0, UNKNOWN: 0 };
    return countJobBreakdowns(jobsForEnvCardCounts).env;
  }, [enableAllBreakdownFilters, jobsForEnvCardCounts]);

  const statusCardCounts = useMemo(() => {
    if (!enableAllBreakdownFilters) {
      return { total: 0, pending: 0, inProgress: 0, resolved: 0 };
    }
    const total = jobsForStatusCardCounts.length;
    const pending = jobsForStatusCardCounts.filter(
      (j) => j.status === "PENDING"
    ).length;
    const inProgress = jobsForStatusCardCounts.filter(
      (j) => j.status === "IN_PROGRESS"
    ).length;
    const resolved = jobsForStatusCardCounts.filter(
      (j) => j.status === "RESOLVED"
    ).length;
    return { total, pending, inProgress, resolved };
  }, [enableAllBreakdownFilters, jobsForStatusCardCounts]);

  const partCounts = useMemo(() => {
    if (!enableAllBreakdownFilters)
      return { Hardware: 0, Software: 0, UNKNOWN: 0 };
    return countJobBreakdowns(jobsForPartCardCounts).part;
  }, [enableAllBreakdownFilters, jobsForPartCardCounts]);

  const breakdownCards = enableAllBreakdownFilters ? (
    <div className="space-y-3 mb-2 text-slate-900 dark:text-slate-100" aria-label="การกรองแบบการ์ด">
      <div>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">สถานะ</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { value: "", label: "ทั้งหมด", count: statusCardCounts.total },
            {
              value: "PENDING",
              label: STATUS_CONFIG.PENDING.label,
              count: statusCardCounts.pending,
            },
            {
              value: "IN_PROGRESS",
              label: STATUS_CONFIG.IN_PROGRESS.label,
              count: statusCardCounts.inProgress,
            },
            {
              value: "RESOLVED",
              label: STATUS_CONFIG.RESOLVED.label,
              count: statusCardCounts.resolved,
            },
          ].map((it) => {
            const active = statusSelect === it.value;
            return (
              <button
                key={it.value || "ALL"}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusSelect(it.value)}
                className={[
                  "rounded-xl border px-3 py-2.5 text-left transition-all active:scale-95 min-h-[44px] cursor-pointer",
                  active
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-slate-200 dark:border-[var(--glass-card-border)] bg-white dark:bg-[var(--glass-input-bg)] hover:border-blue-500/30",
                ].join(" ")}
              >
                <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">
                  {it.label}
                </div>
                <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                  {it.count}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">ประเภทสถานที่</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { value: "", label: "ทั้งหมด", count: jobsForEnvCardCounts.length },
            {
              value: "INDOOR",
              label: "ภายใน (ในอาคาร)",
              count: envCounts.INDOOR,
            },
            {
              value: "OUTDOOR",
              label: "ภายนอก (นอกอาคาร)",
              count: envCounts.OUTDOOR,
            },
            { value: "UNKNOWN", label: "ไม่ระบุ", count: envCounts.UNKNOWN },
          ].map((it) => {
            const active = fixEnvironmentSelect === it.value;
            return (
              <button
                key={it.value || "ALL"}
                type="button"
                aria-pressed={active}
                onClick={() => setFixEnvironmentSelect(it.value)}
                className={[
                  "rounded-xl border px-3 py-2.5 text-left transition-all active:scale-95 min-h-[44px] cursor-pointer",
                  active
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-slate-200 dark:border-[var(--glass-card-border)] bg-white dark:bg-[var(--glass-input-bg)] hover:border-blue-500/30",
                ].join(" ")}
              >
                <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">
                  {it.label}
                </div>
                <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                  {it.count}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">ประเภทงาน</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { value: "", label: "ทั้งหมด", count: jobsForPartCardCounts.length },
            {
              value: "Hardware",
              label: "Hardware (ฮาร์ดแวร์)",
              count: partCounts.Hardware,
            },
            {
              value: "Software",
              label: "Software (ซอฟต์แวร์)",
              count: partCounts.Software,
            },
            { value: "UNKNOWN", label: "ไม่ระบุ", count: partCounts.UNKNOWN },
          ].map((it) => {
            const active = brokenPartSelect === it.value;
            return (
              <button
                key={it.value || "ALL"}
                type="button"
                aria-pressed={active}
                onClick={() => setBrokenPartSelect(it.value)}
                className={[
                  "rounded-xl border px-3 py-2.5 text-left transition-all active:scale-95 min-h-[44px] cursor-pointer",
                  active
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-slate-200 dark:border-[var(--glass-card-border)] bg-white dark:bg-[var(--glass-input-bg)] hover:border-blue-500/30",
                ].join(" ")}
              >
                <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">
                  {it.label}
                </div>
                <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                  {it.count}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  ) : null;

  useEffect(() => {
    setPage(1);
  }, [
    provinceFilter,
    districtFilter,
    search,
    pageSize,
    effectiveShowOutOfContract,
    statusSelect,
    fixEnvironmentSelect,
    brokenPartSelect,
    assignedToSelect,
  ]);

  useEffect(() => {
    // reset district เมื่อเปลี่ยนจังหวัด
    setDistrictFilter("");
  }, [provinceFilter]);

  const handleTakeJob = async (id: number) => {
    if (!token) return;
    if (!(await ensureStaffSignatureOrToast(token))) return;
    const ok = await confirmDialog({
      title: "รับงานนี้?",
      text: "คุณต้องการรับงานนี้เข้าสู่ขั้นตอนการแก้ไขหรือไม่",
      confirmText: "ยืนยัน รับงาน",
      cancelText: "ยกเลิก",
      confirmColor: "#16a34a",
      cancelColor: "#475569",
    });
    if (!ok) return;
    const staffId = currentUserId || 1;
    try {
      await axios.patch(
        `${API}/jobs/${id}/assign`,
        { staffId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toastSuccess("รับงานสำเร็จ", 1200);
      fetchJobs();
    } catch {
      toastError("ข้อผิดพลาด", "ไม่สามารถรับงานได้");
    }
  };

  const openClassifyDocDialog = async (job: Job) => {
    if (!token) return;
    if (!(await ensureStaffSignatureOrToast(token))) return;
    setClassifyJob(job);
  };

  const handleClassifyDoc = async (isOutOfContract: boolean) => {
    if (!token || !classifyJob) return;
    if (!(await ensureStaffSignatureOrToast(token))) return;
    setClassifySubmitting(true);
    try {
      await axios.patch(
        `${API}/jobs/${classifyJob.id}/classify-doc`,
        { isOutOfContract },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toastSuccess(
        isOutOfContract
          ? "จำแนกเป็นนอกสัญญาแล้ว — ย้ายไปเมนูนอกสัญญา"
          : "จำแนกเป็นในสัญญาแล้ว",
        1800,
      );
      setClassifyJob(null);
      fetchJobs();
    } catch (err) {
      toastError(
        "จำแนกเอกสารไม่สำเร็จ",
        formatApiErrorDetail(axiosErrorData(err)) ??
          "ไม่สามารถออกเลข Running Doc No ได้",
      );
    } finally {
      setClassifySubmitting(false);
    }
  };

  const openUpdateFixModal = async (jobId: number) => {
    if (!token) return;

    setUpdateFixLoading(true);
    setUpdateFixSaving(false);
    setUpdateFixJob(null);
    setUpdateReopenReason("");
    setUpdateFixReopening(false);
    setUpdatePreviewImages(null);
    setUpdatePreviewIndex(0);
    setUpdateFixImages([null, null, null]);
    setUpdateFixPreviews([null, null, null]);
    setUpdateFixEnvironment("");

    try {
      const res = await axios.get(`${API}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = unwrapApiData<unknown>(res?.data);
      const job = payload as Job | null;
      if (!job) {
        toastError("ไม่พบข้อมูล", "ไม่สามารถโหลดข้อมูลการแก้ไขได้");
        return;
      }

      setUpdateFixJob(job);
      const env = (job.fixEnvironment ?? "") as string;
      setUpdateFixEnvironment(env);
      setUpdateBrokenPartType(env ? ((job.brokenPart ?? "") as string) : "");
      setUpdateCause((job.cause ?? "") as string);
      setUpdateFixMethod((job.fixMethod ?? "") as string);
      setUpdateNote((job.fixNote ?? "") as string);
      setUpdateSerialRows(
        parseJobSerialRowsFromDb(job.oldSerialNumber, job.newSerialNumber),
      );
      setUpdateFixImages([null, null, null]);
      setUpdateFixPreviews(buildFixPreviewUrlsFromJob(job.id, job.fixImages));
    } catch {
      toastError("โหลดข้อมูลไม่สำเร็จ", "ไม่สามารถโหลดข้อมูลใบแจ้งซ่อมได้");
    } finally {
      setUpdateFixLoading(false);
    }
  };

  const handleReopenUpdateFix = async () => {
    if (!updateFixJob || !token || !updateReopenReason.trim()) return;
    if (!(await ensureStaffSignatureOrToast(token))) return;
    const ok = await confirmDialog({
      title: "ยืนยัน Reopen งาน?",
      text: "สถานะจะเปลี่ยนเป็นกำลังแก้ไข เพื่อให้แก้ไขข้อมูลได้ — เมื่อแก้ครบแล้วให้บันทึกและปิดงานอีกครั้ง",
      confirmText: "ยืนยัน Reopen",
      cancelText: "ยกเลิก",
      confirmColor: "#ea580c",
      cancelColor: "#475569",
    });
    if (!ok) return;

    setUpdateFixReopening(true);
    try {
      await axios.patch(
        `${API}/jobs/${updateFixJob.id}/reopen`,
        { reason: updateReopenReason.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toastSuccess("เปิดงานใหม่แล้ว — สถานะเป็นกำลังแก้ไข", 1500);
      setUpdateReopenReason("");
      const res = await axios.get(`${API}/jobs/${updateFixJob.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = unwrapApiData<unknown>(res?.data);
      const j = payload as Job | null;
      if (j) {
        setUpdateFixJob(j);
        const env = (j.fixEnvironment ?? "") as string;
        setUpdateFixEnvironment(env);
        setUpdateBrokenPartType(env ? ((j.brokenPart ?? "") as string) : "");
        setUpdateCause((j.cause ?? "") as string);
        setUpdateFixMethod((j.fixMethod ?? "") as string);
        setUpdateNote((j.fixNote ?? "") as string);
        setUpdateSerialRows(
          parseJobSerialRowsFromDb(j.oldSerialNumber, j.newSerialNumber),
        );
        setUpdateFixImages([null, null, null]);
        setUpdateFixPreviews(buildFixPreviewUrlsFromJob(j.id, j.fixImages));
      }
      await fetchJobs();
    } catch (err: unknown) {
      const payload = (err as { response?: { data?: { error?: { message?: string } } } })?.response
        ?.data;
      const msg = payload?.error?.message;
      toastError("Reopen ไม่สำเร็จ", (typeof msg === "string" && msg.trim()) || "ไม่สามารถเปิดงานใหม่ได้");
    } finally {
      setUpdateFixReopening(false);
    }
  };

  const handleUpdateFixImage = (
    index: number,
    file: File | null,
    input?: HTMLInputElement | null,
  ) => {
    if (file) {
      const err = validateJobImageFile(file);
      if (err) {
        toastError(err);
        clearFileInput(input ?? updateFixFileRefs[index]?.current ?? null);
        return;
      }
    }
    setUpdateFixImages((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
    setUpdateFixPreviews((prev) => {
      const next = [...prev];
      next[index] = file ? URL.createObjectURL(file) : null;
      return next;
    });
  };

  const persistUpdateFix = async (): Promise<boolean> => {
    if (!updateFixJob || !token) return false;
    if (updateFixSaving) return false;

    const isAssignee =
      !!updateFixJob.assignedTo &&
      !!currentUserId &&
      String(updateFixJob.assignedTo.id) === String(currentUserId);
    const isResolved = updateFixJob.status === "RESOLVED";
    const canEditFix =
      !!updateFixJob && !!updateFixJob.assignedTo && isAssignee && !isResolved;

    if (!canEditFix) {
      toastError("สิทธิ์ไม่เพียงพอ", "เฉพาะผู้รับงานเท่านั้นที่บันทึกการแก้ไขได้");
      return false;
    }
    if (updateFixEnvironment !== "INDOOR" && updateFixEnvironment !== "OUTDOOR") {
      toastError("ข้อมูลไม่ครบ", "กรุณาเลือกประเภทสถานที่ (Indoor / Outdoor)");
      return false;
    }
    if (updateBrokenPartType !== "Hardware" && updateBrokenPartType !== "Software") {
      toastError("ข้อมูลไม่ครบ", "กรุณาเลือกประเภทงาน (Hardware / Software)");
      return false;
    }
    if (!updateCause.trim()) {
      toastError("ข้อมูลไม่ครบ", "กรุณาระบุสาเหตุ");
      return false;
    }
    if (!updateFixMethod.trim()) {
      toastError("ข้อมูลไม่ครบ", "กรุณาระบุวิธีแก้ไข");
      return false;
    }
    if (!hasRequiredFixImageSlots(updateFixImages, updateFixPreviews)) {
      toastError(
        "รูปภาพไม่ครบ",
        "กรุณาแนบรูปการแก้ไขอย่างน้อย 2 รูปแรก หรือใช้รูปเดิมที่มีอยู่แล้ว",
      );
      return false;
    }
    if (!(await ensureStaffSignatureOrToast(token))) return false;

    setUpdateFixSaving(true);
    try {
      const filesToUpload = updateFixImages.filter(
        (f): f is File => f instanceof File,
      );

      await runMultipartUploadWithProxyFallback({
        fields: [{ name: "fixImages", files: filesToUpload }],
        reserveNonImageBytes: 80_000,
        onCompressing: () =>
          toastWarning(
            "กำลังบีบอัดรูป",
            "เซิร์ฟเวอร์จำกัดขนาดคำขอ — ระบบจะลดขนาดรูปแล้วส่งใหม่",
          ),
        upload: async (byField) => {
          const form = new FormData();
          form.append("brokenPartType", updateBrokenPartType);
          form.append("fixEnvironment", updateFixEnvironment);
          form.append("cause", updateCause);
          form.append("fixMethod", updateFixMethod);
          form.append("note", updateNote);
          const ser = serializeJobSerialRowsToFormFields(updateSerialRows);
          form.append("oldSerialNumber", ser.oldSerialNumber);
          form.append("newSerialNumber", ser.newSerialNumber);
          (byField.get("fixImages") ?? []).forEach((file) =>
            form.append("fixImages", file),
          );
          await axios.patch(`${API}/jobs/${updateFixJob.id}/fix`, form, {
            headers: { Authorization: `Bearer ${token}` },
          });
        },
      });
      return true;
    } catch (err: unknown) {
      const msg = formatJobImageUploadError(
        err,
        axios.isAxiosError(err) && err.response?.data?.message
          ? String(
              Array.isArray(err.response.data.message)
                ? err.response.data.message.join(", ")
                : err.response.data.message,
            )
          : "ไม่สามารถบันทึกข้อมูลการแก้ไขได้",
      );
      toastError("ข้อผิดพลาด", msg);
      return false;
    } finally {
      setUpdateFixSaving(false);
    }
  };

  const handleSubmitUpdateFix = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await persistUpdateFix();
    if (!ok) return;
    toastSuccess("บันทึกข้อมูลการแก้ไขเรียบร้อยแล้ว", 1500);
    setUpdateFixJob(null);
    await fetchJobs();
  };

  const handleGoToCloseJob = async () => {
    const job = updateFixJob;
    const ok = await persistUpdateFix();
    if (!ok || !job) return;
    toastSuccess("บันทึกการแก้ไขแล้ว — ให้ผู้แจ้งเซ็นปิดงาน", 1500);
    setUpdateFixJob(null);
    setSignJob(job);
  };

  const loadAssignableStaff = async (): Promise<boolean> => {
    if (!token) {
      toastError("เซสชันหมดอายุ", "กรุณาเข้าสู่ระบบใหม่เพื่อมอบหมายงานได้");
      return false;
    }
    setAssignLoading(true);
    try {
      const res = await axios.get(`${API}/users/assignable`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const extracted = extractAssignableArray(res?.data as unknown);
      setAssignableStaff(
        Array.isArray(extracted)
          ? (extracted as {
              id: number;
              name?: string | null;
              username?: string;
              email?: string;
            }[])
          : [],
      );
      return true;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        (err as { message?: string })?.message ??
        "เกิดข้อผิดพลาดในการดึงข้อมูล";
      toastError("โหลดรายชื่อเจ้าหน้าที่ไม่สำเร็จ", `status=${status ?? "?"} ${msg}`);
      return false;
    } finally {
      setAssignLoading(false);
    }
  };

  const openAssignModal = async (job: Job) => {
    setAssignJob(job);
    setAssignBulkIds([]);
    setAssignSelectedId(null);
    setAssignableStaff([]);
    const ok = await loadAssignableStaff();
    if (!ok) setAssignJob(null);
  };

  const openBulkAssignModal = async () => {
    const ids = [...bulkAssignSelectedIds];
    if (ids.length === 0) return;
    setAssignJob(null);
    setAssignBulkIds(ids);
    setAssignSelectedId(null);
    setAssignableStaff([]);
    const ok = await loadAssignableStaff();
    if (!ok) setAssignBulkIds([]);
  };

  const closeAssignModal = () => {
    setAssignJob(null);
    setAssignBulkIds([]);
    setAssignSelectedId(null);
  };

  const handleAssignSubmit = async () => {
    if (assignSelectedId == null || !token) return;
    if (!(await ensureStaffSignatureOrToast(token))) return;
    const bulkIds = assignBulkIds;
    const singleJob = assignJob;
    if (bulkIds.length === 0 && !singleJob) return;

    setAssignSubmitting(true);
    try {
      if (bulkIds.length > 0) {
        const res = await axios.post<{
          data?: { updated?: number; failed?: { id: number; message: string }[] };
        }>(
          `${API}/jobs/bulk-assign`,
          { jobIds: bulkIds, staffId: assignSelectedId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const payload = unwrapApiData<{
          updated?: number;
          failed?: { id: number; message: string }[];
        }>(res?.data);
        const updated = payload?.updated ?? bulkIds.length;
        const failed = payload?.failed ?? [];
        if (failed.length > 0) {
          toastError(
            `มอบหมายสำเร็จ ${updated} รายการ · ไม่สำเร็จ ${failed.length} รายการ`,
            failed.map((f) => `#${f.id}: ${f.message}`).join("; "),
          );
        } else {
          toastSuccess(`มอบหมายงานสำเร็จ ${updated} รายการ`, 1500);
        }
        setBulkAssignSelectedIds(new Set());
      } else if (singleJob) {
        await axios.patch(
          `${API}/jobs/${singleJob.id}/assign`,
          { staffId: assignSelectedId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toastSuccess("มอบหมายงานสำเร็จ", 1200);
      }
      await fetchJobs();
      closeAssignModal();
    } catch {
      toastError("ข้อผิดพลาด", "ไม่สามารถมอบหมายงานได้");
    } finally {
      setAssignSubmitting(false);
    }
  };

  const moveJobToOutOfContract = async (jobId: number) => {
    if (!token) return;
    if (movingOutOfContractJobId === jobId) return;
    if (!(await ensureStaffSignatureOrToast(token))) return;

    const ok = await confirmDialog({
      title: "ย้ายนอกสัญญา?",
      text: "ยืนยันการย้ายนอกสัญญา โดยยังคงสถานะงานเดิมไว้",
      confirmText: "ยืนยัน ย้ายนอกสัญญา",
      cancelText: "ยกเลิก",
      confirmColor: "#0ea5e9",
      cancelColor: "#475569",
    });

    if (!ok) return;

    setMovingOutOfContractJobId(jobId);
    try {
      await axios.patch(
        `${API}/jobs/${jobId}/out-of-contract`,
        { isOutOfContract: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toastSuccess("ย้ายนอกสัญญาแล้ว", 1200);
      await fetchJobs();
    } catch (err: unknown) {
      const payload = axiosErrorData(err);
      console.error("[out-of-contract] payload:", payload);
      const detailText =
        formatApiErrorDetail(payload) ??
        (payload ? JSON.stringify(payload) : undefined);

      toastError("ไม่สามารถย้ายนอกสัญญาได้", detailText ?? "เกิดข้อผิดพลาด");
      console.error(err);
      try {
        await fetchJobs();
      } catch (refreshErr) {
        console.error("[out-of-contract] refresh failed:", refreshErr);
      }
    } finally {
      setMovingOutOfContractJobId(null);
    }
  };

  const handleDeleteUnassigned = async (jobId: number) => {
    if (!token) return;
    const ok = await confirmDialog({
      title: "ลบงานนี้?",
      text: "งานนี้ต้องยังไม่มีผู้รับผิดชอบ และจะถูกลบออกจากระบบถาวร",
      confirmText: "ยืนยัน ลบ",
      cancelText: "ยกเลิก",
      confirmColor: "#dc2626",
      cancelColor: "#475569",
    });
    if (!ok) return;

    try {
      await axios.delete(`${API}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toastSuccess("ลบสำเร็จ", 1200);
      if (detailJob?.id === jobId) setDetailJob(null);
      if (assignJob?.id === jobId) setAssignJob(null);
      await fetchJobs();
    } catch (err: unknown) {
      const payload = axiosErrorData(err);
      const errInner = asRecord(payload?.error);
      const detailsArr = errInner?.details;
      const firstDetail = Array.isArray(detailsArr) ? asRecord(detailsArr[0]) : undefined;
      const msg =
        (typeof errInner?.message === "string" ? errInner.message : undefined) ??
        (typeof firstDetail?.message === "string" ? firstDetail.message : undefined) ??
        (typeof payload?.message === "string" ? payload.message : undefined) ??
        "ไม่สามารถลบได้";
      toastError("ลบไม่สำเร็จ", String(msg));
    }
  };

  const handleCancelPendingJob = async (jobId: number) => {
    if (!token || !canCancelPending) return;
    const ok = await confirmDialog({
      title: "ยกเลิกการซ่อม?",
      text: "งานจะถูกตั้งสถานะเป็น «ยกเลิก» และจะไม่อยู่ในคิวรอดำเนินการอีกต่อไป",
      confirmText: "ยืนยัน ยกเลิก",
      cancelText: "กลับ",
      confirmColor: "#64748b",
      cancelColor: "#475569",
    });
    if (!ok) return;
    try {
      await axios.patch(
        `${API}/jobs/${jobId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toastSuccess("ยกเลิกงานแล้ว", 1200);
      if (detailJob?.id === jobId) setDetailJob(null);
      if (assignJob?.id === jobId) setAssignJob(null);
      await fetchJobs();
    } catch (err: unknown) {
      const payload = axiosErrorData(err);
      const errInner = asRecord(payload?.error);
      const msg =
        (typeof errInner?.message === "string" ? errInner.message : undefined) ??
        (typeof payload?.message === "string" ? payload.message : undefined) ??
        "ไม่สามารถยกเลิกได้";
      toastError("ยกเลิกไม่สำเร็จ", String(msg));
    }
  };

  const handleDeleteInProgressAdmin = async (jobId: number) => {
    if (!token || !canAdminDeleteInProgress) return;
    const ok = await confirmDialog({
      title: "ลบงานที่กำลังแก้ไข?",
      text: "งานนี้จะถูกลบออกจากระบบถาวร ไม่สามารถกู้คืนได้",
      confirmText: "ยืนยัน ลบ",
      cancelText: "ยกเลิก",
      confirmColor: "#dc2626",
      cancelColor: "#475569",
    });
    if (!ok) return;

    try {
      await axios.delete(`${API}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toastSuccess("ลบสำเร็จ", 1200);
      if (detailJob?.id === jobId) setDetailJob(null);
      if (assignJob?.id === jobId) setAssignJob(null);
      if (updateFixJob?.id === jobId) setUpdateFixJob(null);
      await fetchJobs();
    } catch (err: unknown) {
      const payload = axiosErrorData(err);
      const errInner = asRecord(payload?.error);
      const detailsArr = errInner?.details;
      const firstDetail = Array.isArray(detailsArr) ? asRecord(detailsArr[0]) : undefined;
      const msg =
        (typeof errInner?.message === "string" ? errInner.message : undefined) ??
        (typeof firstDetail?.message === "string" ? firstDetail.message : undefined) ??
        (typeof payload?.message === "string" ? payload.message : undefined) ??
        "ไม่สามารถลบได้";
      toastError("ลบไม่สำเร็จ", String(msg));
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

          // แสดง "ชื่อหลัก" (name) พร้อมรายละเอียดเพิ่มในวงเล็บ
          // ถ้าไม่มี name ให้โชว์เป็น username/email อย่างเดียวเพื่อไม่ให้ซ้ำ
          const suffix = name ? (username ? ` (${username})` : email ? ` (${email})` : "") : "";
          return `${base}${suffix}`;
        })(),
      })),
    [assignableStaff]
  );

  if (loading) {
    return (
      <DashboardPageShell title={title} subtitle={subtitle} noCard={noCard}>
        <div
          className={
            noCard
              ? NO_CARD_SHELL
              : "flex flex-col h-full"
          }
        >
          {effectiveShowContractTabs && onShowOutOfContractChange && (
            <div
              className={
                noCard
                  ? CONTRACT_TABS_ROW_WRAP
                  : "p-4 sm:p-6 shrink-0 border-b border-[var(--glass-card-border)] bg-[var(--glass-input-bg)]"
              }
            >
              <SegmentedTabs
                tabs={contractSegmentTabs}
                activeId={effectiveShowOutOfContract ? "out" : "contract"}
                onChange={(id) => onShowOutOfContractChange(id === "out")}
                ariaLabel="แท็บงานสัญญา/นอกสัญญา"
              />
            </div>
          )}
          <div
            className={
              noCard
                ? `${GLASS_SECTION} flex flex-1 min-h-[40vh] items-center justify-center`
                : "flex-1 p-6 flex items-center justify-center"
            }
          >
            <div className="flex w-full max-w-lg flex-col gap-3 px-4 py-2" aria-busy="true" aria-label="กำลังโหลดรายการ">
              <Skeleton className="h-4 w-[72%] bg-[var(--glass-hover)]" />
              <Skeleton className="h-4 w-[58%] bg-[var(--glass-hover)]" />
              <Skeleton className="h-4 w-[88%] bg-[var(--glass-hover)]" />
              <Skeleton className="h-4 w-[64%] bg-[var(--glass-hover)]" />
              <p className="text-xs glass-subtle-text pt-1">กำลังโหลด...</p>
            </div>
          </div>
        </div>
      </DashboardPageShell>
    );
  }

  if (jobs.length === 0) {
    return (
      <DashboardPageShell title={title} subtitle={subtitle} noCard={noCard}>
        <div
          className={
            noCard
              ? NO_CARD_SHELL
              : "flex flex-col h-full"
          }
        >
          {effectiveShowContractTabs && onShowOutOfContractChange && (
            <div
              className={
                noCard
                  ? CONTRACT_TABS_ROW_WRAP
                  : "p-4 sm:p-6 shrink-0 border-b border-[var(--glass-card-border)] bg-[var(--glass-input-bg)]"
              }
            >
              <SegmentedTabs
                tabs={contractSegmentTabs}
                activeId={effectiveShowOutOfContract ? "out" : "contract"}
                onChange={(id) => onShowOutOfContractChange(id === "out")}
                ariaLabel="แท็บงานสัญญา/นอกสัญญา"
              />
            </div>
          )}
          {noCard ? (
            <>
              <div className={`${GLASS_SECTION} shrink-0`}>
                <DashboardFilterBar {...filterBarProps} className="border-b-0" />
              </div>
              <div
                className={`${GLASS_SECTION} flex flex-col flex-1 min-h-[280px] items-center justify-center px-4 py-12 text-center`}
              >
                <CheckCircle2 size={48} className="opacity-40 mb-3 glass-muted-text" aria-hidden />
                <p className="font-semibold glass-text">ไม่พบรายการ</p>
                <p className="text-sm mt-1 glass-muted-text">
                  ไม่มีงานในสถานะนี้ในขณะนี้
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void fetchJobs()}
                  className="mt-6 min-h-[44px] cursor-pointer gap-1.5 rounded-xl border-[var(--glass-input-border)] bg-[var(--glass-input-bg)] px-4 py-2.5 text-sm font-medium glass-text shadow-lg hover:bg-[var(--glass-hover)] active:scale-95"
                >
                  <RefreshCw size={14} aria-hidden /> รีเฟรช
                </Button>
              </div>
            </>
          ) : (
            <>
              <DashboardFilterBar {...filterBarProps} />
              <div className="flex-1 p-12 flex flex-col items-center justify-center text-center">
                <CheckCircle2 size={48} className="opacity-40 mb-3 glass-muted-text" aria-hidden />
                <p className="font-semibold text-slate-500">ไม่พบรายการ</p>
                <p className="text-sm mt-1 glass-muted-text">
                  ไม่มีงานในสถานะนี้ในขณะนี้
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void fetchJobs()}
                  className="mt-4 min-h-[44px] cursor-pointer gap-1.5 text-sm"
                >
                  <RefreshCw size={14} aria-hidden /> รีเฟรช
                </Button>
              </div>
            </>
          )}
        </div>
      </DashboardPageShell>
    );
  }

  const displayList = paginatedJobs;

  const bulkAssignableFiltered = sortedFilteredJobs.filter((j) =>
    jobNeedsAssignee(j),
  );
  const pageAssignableIds = displayList
    .filter((j) => jobNeedsAssignee(j))
    .map((j) => j.id);
  const allPageAssignableSelected =
    pageAssignableIds.length > 0 &&
    pageAssignableIds.every((id) => bulkAssignSelectedIds.has(id));
  const allFilteredAssignableSelected =
    bulkAssignableFiltered.length > 0 &&
    bulkAssignableFiltered.every((j) => bulkAssignSelectedIds.has(j.id));

  const toggleBulkAssignSelect = (id: number) => {
    setBulkAssignSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleBulkAssignPage = () => {
    setBulkAssignSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageAssignableSelected) {
        for (const id of pageAssignableIds) next.delete(id);
      } else {
        for (const id of pageAssignableIds) next.add(id);
      }
      return next;
    });
  };

  const selectAllBulkAssignableFiltered = () => {
    setBulkAssignSelectedIds(new Set(bulkAssignableFiltered.map((j) => j.id)));
  };

  const clearBulkAssignSelection = () => setBulkAssignSelectedIds(new Set());

  const assignModalOpen = assignJob != null || assignBulkIds.length > 0;

  // Derived permission flags for update-fix modal
  const isUpdateResolved = updateFixJob?.status === "RESOLVED";
  /** ผู้รับงาน — Reopen/บันทึกแก้ไขได้เฉพาะคนนี้ */
  const isUpdateAssignee =
    !!updateFixJob?.assignedTo &&
    !!currentUserId &&
    String(updateFixJob.assignedTo.id) === String(currentUserId);
  const updateCanEditFix =
    !!updateFixJob &&
    !!updateFixJob.assignedTo &&
    isUpdateAssignee &&
    !isUpdateResolved;
  const updateCanUploadIssueImages =
    Array.isArray(myPermissions) &&
    myPermissions.includes("job.issue.upload") &&
    jobStatusAllowsIssueImageUpload(updateFixJob?.status);
  const updateIssueImageCount = countNonemptyIssueImages(updateFixJob?.images);
  const updateIsReadOnlyFix = !!updateFixJob && !updateCanEditFix;

  // หลีกเลี่ยง `useMemo` เพราะไฟล์นี้มี early-return หลายจุด
  // (React Hooks ต้องเรียกทุกครั้งตามกฎ-of-hooks)
  const updateFixSaveReady = updateCanEditFix
    ? isFixInfoComplete({
        fixEnvironment: updateFixEnvironment,
        brokenPart: updateBrokenPartType,
        cause: updateCause,
        fixMethod: updateFixMethod,
        fixImageFiles: updateFixImages,
        fixImagePreviews: updateFixPreviews,
      })
    : true;

  const updateFixFormReadyToSubmit = updateFixSaveReady;

  const tableAndPagination = (
    <>
      {enableBulkAssign && bulkAssignableFiltered.length > 0 && (
        <div className="px-3 sm:px-4 py-2.5 border-b border-[var(--glass-card-border)] flex flex-wrap items-center gap-2 sm:gap-3 bg-[var(--glass-input-bg)] shrink-0">
          {bulkAssignSelectedIds.size === 0 ? (
            <p className="text-xs sm:text-sm glass-muted-text flex flex-wrap items-center gap-2">
              <span className="hidden sm:inline">
                เลือกงานที่ยังไม่มีผู้รับผิดชอบเพื่อมอบหมายทีละหลายรายการ
              </span>
              <button
                type="button"
                onClick={selectAllBulkAssignableFiltered}
                className="text-blue-700 hover:text-blue-800 underline-offset-2 hover:underline cursor-pointer text-xs sm:text-sm font-medium min-h-[44px] sm:min-h-0 inline-flex items-center dark:text-blue-400/95 dark:hover:text-blue-300"
              >
                เลือกทั้งหมดที่ตรงตัวกรอง ({bulkAssignableFiltered.length})
              </button>
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="inline-flex items-center rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-blue-800 tabular-nums dark:border-blue-500/35 dark:bg-blue-950/25 dark:text-blue-100">
                  เลือกแล้ว {bulkAssignSelectedIds.size} รายการ
                </span>
                <button
                  type="button"
                  onClick={selectAllBulkAssignableFiltered}
                  disabled={allFilteredAssignableSelected || assignSubmitting}
                  className="text-xs glass-muted-text hover:text-[var(--glass-text)] underline-offset-2 hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 inline-flex items-center"
                >
                  + เลือกทั้งหมดที่กรอง ({bulkAssignableFiltered.length})
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto">
                <button
                  type="button"
                  onClick={clearBulkAssignSelection}
                  disabled={assignSubmitting}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-xl text-sm font-medium border border-[var(--glass-input-border)] bg-[var(--glass-input-bg)] glass-text hover:bg-[var(--glass-hover)] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X size={16} aria-hidden /> ยกเลิกการเลือก
                </button>
                <button
                  type="button"
                  onClick={() => void openBulkAssignModal()}
                  disabled={assignSubmitting}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-all active:scale-[0.98] shadow-lg shadow-blue-900/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus size={16} aria-hidden /> มอบหมายที่เลือก (
                  {bulkAssignSelectedIds.size})
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full min-w-full text-left border-collapse table-fixed text-slate-900 dark:text-slate-100">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-wide sticky top-0 z-10 bg-white/95 dark:bg-[var(--glass-header-bg)] backdrop-blur-sm text-slate-600 dark:text-slate-400">
              {enableBulkAssign && (
                <th className="px-2 py-2.5 border-b border-slate-200 dark:border-[var(--glass-card-border)] w-10">
                  {pageAssignableIds.length > 0 ? (
                    <input
                      type="checkbox"
                      className="size-4 rounded border-slate-300 dark:border-[var(--glass-card-border)] bg-white dark:bg-[var(--glass-input-bg)] cursor-pointer accent-blue-500"
                      checked={allPageAssignableSelected}
                      onChange={toggleBulkAssignPage}
                      aria-label="เลือกทุกแถวในหน้านี้ที่มอบหมายได้"
                    />
                  ) : null}
                </th>
              )}
              <th className="px-2.5 py-2.5 border-b border-slate-200 dark:border-[var(--glass-card-border)] whitespace-nowrap w-24">เลขที่</th>
              <th className="px-2.5 py-2.5 border-b border-slate-200 dark:border-[var(--glass-card-border)] whitespace-nowrap w-24">วันที่</th>
              <th className="px-2.5 py-2.5 border-b border-slate-200 dark:border-[var(--glass-card-border)] whitespace-nowrap w-52">ผู้แจ้ง</th>
              <th className="px-2.5 py-2.5 border-b border-slate-200 dark:border-[var(--glass-card-border)] whitespace-nowrap w-64">สถานที่</th>
              {enableAllBreakdownFilters && (
                <>
                  <th className="px-2.5 py-2.5 border-b border-slate-200 dark:border-[var(--glass-card-border)] whitespace-nowrap w-40">
                    ประเภทสถานที่
                  </th>
                  <th className="px-2.5 py-2.5 border-b border-slate-200 dark:border-[var(--glass-card-border)] whitespace-nowrap w-40">
                    ประเภทงาน
                  </th>
                  <th className="px-2.5 py-2.5 border-b border-slate-200 dark:border-[var(--glass-card-border)] whitespace-nowrap w-28">
                    ระยะเวลาจบงาน
                  </th>
                </>
              )}
              <th className="px-2.5 py-2.5 border-b border-slate-200 dark:border-[var(--glass-card-border)] whitespace-nowrap">รายละเอียดปัญหา</th>
              <th className="px-2.5 py-2.5 border-b border-slate-200 dark:border-[var(--glass-card-border)] whitespace-nowrap w-52">สถานะ</th>
              {showAssignedToColumn && (
                <th
                  className="px-2.5 py-2.5 border-b border-slate-200 dark:border-[var(--glass-card-border)] whitespace-nowrap w-44"
                >
                  ผู้รับผิดชอบ
                </th>
              )}
              <th className="px-2.5 py-2.5 border-b border-slate-200 dark:border-[var(--glass-card-border)] text-right whitespace-nowrap w-44">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody>
            {displayList.map((job) => {
              const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.PENDING;
              const dateStr = job.reportDate || job.createdAt;
              const location = [job.province, job.district, job.location]
                .filter(Boolean)
                .join(" › ");
              const descRaw = (job.description || job.title || "–") as string;
              const desc = limitText(descRaw, 20);
              const envBucket = normalizeFixEnvironment(job.fixEnvironment);
              const partBucket = normalizeBrokenPart(job.brokenPart);

              const envLabel =
                envBucket === "INDOOR"
                  ? "ภายใน (ในอาคาร)"
                  : envBucket === "OUTDOOR"
                    ? "ภายนอก (นอกอาคาร)"
                    : "ไม่ระบุ";
              const envBadgeCls =
                envBucket === "INDOOR"
                  ? "bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20"
                  : envBucket === "OUTDOOR"
                    ? "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
                    : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[var(--glass-hover)] dark:text-slate-200 dark:border-[var(--glass-card-border)]";

              const partLabel =
                partBucket === "Hardware"
                  ? "Hardware (ฮาร์ดแวร์)"
                  : partBucket === "Software"
                    ? "Software (ซอฟต์แวร์)"
                    : "ไม่ระบุ";
              const partBadgeCls =
                partBucket === "Hardware"
                  ? "bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-200 dark:bg-fuchsia-500/10 dark:text-fuchsia-300 dark:border-fuchsia-500/20"
                  : partBucket === "Software"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                    : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[var(--glass-hover)] dark:text-slate-200 dark:border-[var(--glass-card-border)]";
              const canBulkSelectRow = enableBulkAssign && jobNeedsAssignee(job);
              return (
                <tr
                  key={job.id}
                  className="hover:bg-slate-50 dark:hover:bg-[var(--glass-hover)] transition-colors text-sm border-b border-slate-100 dark:border-[var(--glass-card-border)] text-slate-900 dark:text-slate-100"
                >
                  {enableBulkAssign && (
                    <td className="px-2 py-2.5 align-middle">
                      {canBulkSelectRow ? (
                        <input
                          type="checkbox"
                          className="size-4 rounded border-slate-300 dark:border-[var(--glass-card-border)] bg-white dark:bg-[var(--glass-input-bg)] cursor-pointer accent-blue-500"
                          checked={bulkAssignSelectedIds.has(job.id)}
                          onChange={() => toggleBulkAssignSelect(job.id)}
                          aria-label={`เลือกงาน ${job.ticketNo ?? job.id}`}
                        />
                      ) : null}
                    </td>
                  )}
                  <td className="px-2.5 py-2.5 font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
                    {job.ticketNo?.trim() ? job.ticketNo : "—"}
                  </td>
                  <td className="px-2.5 py-2.5 text-sm whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {dateStr ? format(new Date(dateStr), "dd/MM/yy", { locale: th }) : "–"}
                  </td>
                  <td className="px-2.5 py-2.5 text-sm text-slate-900 dark:text-slate-100">
                    <div className="flex items-start gap-2 min-w-0">
                      <PersonAvatar
                        imageUrl={job.reporter?.image}
                        avatarUserId={
                          job.reporter?.image && job.reporter?.id != null
                            ? job.reporter.id
                            : undefined
                        }
                        nameLabel={job.reporterName ?? undefined}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate max-w-[140px] text-slate-900 dark:text-slate-100" title={job.reporterName ?? undefined}>
                          {job.reporterName ?? "–"}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]" title={job.reporterPhone ?? undefined}>
                          {job.reporterPhone ?? ""}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5 truncate text-sm text-slate-700 dark:text-slate-300" title={location || undefined}>{location || "–"}</td>
                  {enableAllBreakdownFilters && (
                    <>
                      <td className="px-2.5 py-2.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-auto max-w-full whitespace-normal border px-2 py-0.5 text-[11px] font-semibold leading-snug shadow-none",
                            envBadgeCls,
                          )}
                        >
                          {envLabel}
                        </Badge>
                      </td>
                      <td className="px-2.5 py-2.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-auto max-w-full whitespace-normal border px-2 py-0.5 text-[11px] font-semibold leading-snug shadow-none",
                            partBadgeCls,
                          )}
                        >
                          {partLabel}
                        </Badge>
                      </td>
                      <td className="px-2.5 py-2.5 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {(() => {
                          const d = workDurationDays({
                            fixDate: job.fixDate,
                            reportDate: job.reportDate,
                            createdAt: job.createdAt,
                          });
                          return d ? `${d} วัน` : "—";
                        })()}
                      </td>
                    </>
                  )}
                  <td className="px-2.5 py-2.5 truncate text-sm text-slate-800 dark:text-slate-200">
                    {desc.clipped && desc.full ? (
                      <TextHoverTooltip text={desc.full}>
                        <span className="truncate block">{desc.short}</span>
                      </TextHoverTooltip>
                    ) : (
                      <span className="truncate block" title={desc.full || undefined}>
                        {desc.short}
                      </span>
                    )}
                  </td>
                  <td className="px-2.5 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-auto px-2 py-1 text-xs font-semibold shadow-none ring-0",
                          cfg.badgeCls,
                        )}
                      >
                        {cfg.label}
                      </Badge>
                      {isAwaitingReporterSignature(job) && (
                        <AwaitingReporterSignatureBadge />
                      )}
                    </div>
                  </td>
                  {showAssignedToColumn && (
                    <td className="px-2.5 py-2.5 text-sm text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <PersonAvatar
                          imageUrl={job.assignedTo?.image}
                          avatarUserId={
                            job.assignedTo?.image
                              ? job.assignedTo.id
                              : undefined
                          }
                          nameLabel={job.assignedTo?.name}
                        />
                        <span className="truncate font-medium text-slate-900 dark:text-slate-100" title={job.assignedTo?.name ?? undefined}>
                          {job.assignedTo?.name ?? "–"}
                        </span>
                      </div>
                    </td>
                  )}
                  <td className="px-2.5 py-2.5 text-right">
                    <div className="flex flex-nowrap items-center justify-end gap-0.5">
                      <ActionIconButton
                        label="ดูรายละเอียด"
                        onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                      >
                        <Eye size={16} />
                      </ActionIconButton>

                      {jobNeedsAssignee(job) && canAssignJob && !!token && (
                        <ActionIconButton
                          label="มอบหมายงาน"
                          onClick={() => openAssignModal(job)}
                          color="#0284c7"
                        >
                          <UserPlus size={16} />
                        </ActionIconButton>
                      )}

                      {jobNeedsAssignee(job) && !!token && (
                        <ActionIconButton
                          label="รับงาน"
                          onClick={() => handleTakeJob(job.id)}
                          color="#1d4ed8"
                        >
                          <Wrench size={16} />
                        </ActionIconButton>
                      )}

                      {enableMoveOutOfContract &&
                        job.status === "PENDING" &&
                        !effectiveShowOutOfContract &&
                        canMoveOutOfContract &&
                        !!token &&
                        job.isOutOfContract !== true && (
                          <ActionIconButton
                            label="ย้ายนอกสัญญา"
                            onClick={() => moveJobToOutOfContract(job.id)}
                            color="#0ea5e9"
                          >
                            <Clock size={16} />
                          </ActionIconButton>
                        )}

                      {job.status === "PENDING" && canCancelPending && !!token && (
                        <ActionIconButton
                          label="ยกเลิกการซ่อม"
                          onClick={() => handleCancelPendingJob(job.id)}
                          color="#64748b"
                        >
                          <Ban size={16} />
                        </ActionIconButton>
                      )}

                      {job.status === "PENDING" &&
                        !job.assignedTo &&
                        canDeleteUnassigned &&
                        !!token && (
                          <ActionIconButton
                            label="ลบงาน"
                            onClick={() => handleDeleteUnassigned(job.id)}
                            color="#dc2626"
                          >
                            <Trash2 size={16} />
                          </ActionIconButton>
                        )}

                      {enableAllBreakdownFilters &&
                        canClassifyDoc &&
                        job.status === "RESOLVED" &&
                        !isFormalDocTicketNo(job.ticketNo) &&
                        !!token && (
                          <ActionIconButton
                            label="จำแนกเอกสาร"
                            onClick={() => void openClassifyDocDialog(job)}
                            color="#7c3aed"
                          >
                            <Stamp size={16} />
                          </ActionIconButton>
                        )}

                      {job.status === "IN_PROGRESS" &&
                        job.assignedTo &&
                        String(job.assignedTo.id) === String(currentUserId) &&
                        !!token && (
                          <ActionIconButton
                            label="อัปเดต"
                            color="#c2410c"
                            onClick={() => openUpdateFixModal(job.id)}
                          >
                            <Wrench size={16} />
                          </ActionIconButton>
                        )}

                      {isAwaitingReporterSignature(job) &&
                        canUserCloseJob(job) &&
                        !!token && (
                          <ActionIconButton
                            label="ให้ผู้แจ้งเซ็นปิดงาน"
                            color="#059669"
                            onClick={() => setSignJob(job)}
                          >
                            <FileSignature size={16} />
                          </ActionIconButton>
                        )}

                      {job.status === "IN_PROGRESS" &&
                        canAdminDeleteInProgress &&
                        !!token && (
                          <ActionIconButton
                            label="ลบงาน (ผู้ดูแลระบบ)"
                            onClick={() => handleDeleteInProgressAdmin(job.id)}
                            color="#dc2626"
                          >
                            <Trash2 size={16} />
                          </ActionIconButton>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <DataTablePagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        filteredCount={sortedFilteredJobs.length}
        showExtraTotal={
          !!search.trim() ||
          !!provinceFilter ||
          !!districtFilter ||
          (enableAllBreakdownFilters &&
            (!!statusSelect || !!fixEnvironmentSelect || !!brokenPartSelect))
        }
        extraTotalCount={jobs.length}
        onPageChange={setPage}
      />
    </>
  );

  return (
    <DashboardPageShell title={title} subtitle={subtitle} noCard={noCard}>
      <div
        className={
          noCard
            ? NO_CARD_SHELL
            : "flex flex-col h-full"
        }
      >
        {effectiveShowContractTabs && onShowOutOfContractChange && (
          <div
            className={
              noCard
                ? CONTRACT_TABS_ROW_WRAP
                : "p-4 sm:p-6 shrink-0 border-b border-[var(--glass-card-border)] bg-[var(--glass-input-bg)]"
            }
          >
            <SegmentedTabs
              tabs={contractSegmentTabs}
              activeId={effectiveShowOutOfContract ? "out" : "contract"}
              onChange={(id) => onShowOutOfContractChange(id === "out")}
              ariaLabel="แท็บงานสัญญา/นอกสัญญา"
            />
          </div>
        )}

        {noCard ? (
          <>
            <div className={`${GLASS_SECTION} shrink-0`}>
              {breakdownCards}
              <DashboardFilterBar {...filterBarProps} className="border-b-0" />
            </div>
            <div
              className={`${GLASS_SECTION} flex flex-col flex-1 min-h-0 overflow-hidden`}
            >
              {tableAndPagination}
            </div>
          </>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {breakdownCards}
            <DashboardFilterBar {...filterBarProps} />
            {tableAndPagination}
          </div>
        )}
      </div>

      {/* Modal ดูรายละเอียดปัญหา */}
      <Dialog
        open={detailJob != null}
        onOpenChange={(open) => {
          if (!open) setDetailJob(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-black/50"
          className="max-h-[min(92vh,calc(100vh-2rem))] w-full max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-5xl"
        >
          <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <DialogHeader
              className="shrink-0 flex-row items-center justify-between space-y-0 border-b px-5 py-4"
              style={{ borderColor: "#e2e8f0" }}
            >
              <DialogTitle
                className="font-bold text-base sm:text-lg"
                style={{ color: "#334155" }}
              >
                รายละเอียดข้อขัดข้อง {detailJob?.ticketNo && `· ${detailJob.ticketNo}`}
              </DialogTitle>
              <button
                type="button"
                onClick={() => setDetailJob(null)}
                className="cursor-pointer rounded-lg p-2 hover:bg-slate-100"
                aria-label="ปิด"
              >
                <X size={20} style={{ color: "#64748b" }} />
              </button>
            </DialogHeader>
            <div className="px-5 sm:px-6 py-4 overflow-y-auto">
              {detailJob == null ? null : (
                <div className="grid gap-6 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)]">
                    <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={STATUS_CONFIG[detailJob.status]?.badgeCls ?? "badge"}>
                        {STATUS_CONFIG[detailJob.status]?.label ?? detailJob.status}
                      </span>
                      {isAwaitingReporterSignature(detailJob) && (
                        <AwaitingReporterSignatureBadge />
                      )}
                      {(detailJob.reportDate || detailJob.createdAt) && (
                        <span
                          className="text-xs flex items-center gap-1"
                          style={{ color: "#64748b" }}
                        >
                          <Calendar size={12} /> วันที่แจ้ง:{" "}
                          {format(
                            new Date(detailJob.reportDate || detailJob.createdAt),
                            "dd/MM/yyyy HH:mm",
                            { locale: th }
                          )}
                        </span>
                      )}
                    </div>
                    <div>
                      <p
                        className="text-xs font-semibold mb-2 flex items-center gap-1"
                        style={{ color: "#64748b" }}
                      >
                        <User size={12} /> ผู้แจ้ง
                      </p>
                      <div className="flex items-start gap-3">
                        <PersonAvatar
                          imageUrl={detailJob.reporter?.image}
                          avatarUserId={
                            detailJob.reporter?.image &&
                            detailJob.reporter?.id != null
                              ? detailJob.reporter.id
                              : undefined
                          }
                          nameLabel={detailJob.reporterName ?? undefined}
                          size="md"
                          variant="light"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium" style={{ color: "#334155" }}>
                            {detailJob.reporterName ?? "–"}
                          </p>
                          {detailJob.reporterPhone && (
                            <p
                              className="text-xs flex items-center gap-1 mt-0.5"
                              style={{ color: "#475569" }}
                            >
                              <Phone size={12} /> {detailJob.reporterPhone}
                            </p>
                          )}
                          {detailJob.reporterEmail && (
                            <p
                              className="text-xs flex items-center gap-1 mt-0.5"
                              style={{ color: "#475569" }}
                            >
                              <Mail size={12} /> {detailJob.reporterEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <p
                        className="text-xs font-semibold mb-1 flex items-center gap-1"
                        style={{ color: "#64748b" }}
                      >
                        <MapPin size={12} /> สถานที่
                      </p>
                      <p className="text-sm" style={{ color: "#334155" }}>
                        {[detailJob.province, detailJob.district, detailJob.location]
                          .filter(Boolean)
                          .join(" · ") || "–"}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-xs font-semibold mb-1 flex items-center gap-1"
                        style={{ color: "#64748b" }}
                      >
                        <FileText size={12} /> รายละเอียดปัญหา
                      </p>
                      <p
                        className="text-sm whitespace-pre-wrap wrap-break-word"
                        style={{ color: "#334155" }}
                      >
                        {detailJob.description || detailJob.title || "–"}
                      </p>
                    </div>
                    {detailJob.assignedTo && (
                      <div>
                        <p
                          className="text-xs font-semibold mb-2"
                          style={{ color: "#64748b" }}
                        >
                          ผู้รับผิดชอบ
                        </p>
                        <div className="flex items-center gap-3">
                          <PersonAvatar
                            imageUrl={detailJob.assignedTo.image}
                            avatarUserId={
                              detailJob.assignedTo.image
                                ? detailJob.assignedTo.id
                                : undefined
                            }
                            nameLabel={detailJob.assignedTo.name}
                            size="md"
                            variant="light"
                          />
                          <p className="text-sm font-medium" style={{ color: "#334155" }}>
                            {detailJob.assignedTo.name}
                          </p>
                        </div>
                      </div>
                    )}
                    {jobNeedsAssignee(detailJob) && (
                      <div className="pt-2 flex flex-col sm:flex-row gap-2">
                        {canAssignJob && (
                          <button
                            type="button"
                            onClick={() => {
                              setDetailJob(null);
                              openAssignModal(detailJob);
                            }}
                            className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
                            style={{
                              borderColor: "#0ea5e9",
                              color: "#0ea5e9",
                              background: "#f0f9ff",
                            }}
                          >
                            <UserPlus size={14} className="inline mr-1.5" /> มอบหมายงาน
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            handleTakeJob(detailJob.id);
                            setDetailJob(null);
                          }}
                          className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
                          style={{ background: "#475569" }}
                        >
                          <Wrench size={14} className="inline mr-1.5" /> รับงานนี้
                        </button>
                      </div>
                    )}
                  </div>

                  {detailJob.images && Array.isArray(detailJob.images) && detailJob.images.length > 0 && (
                    <div className="space-y-3">
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "#64748b" }}
                      >
                        รูปภาพประกอบ
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {detailJob.images.slice(0, 4).map((src, i) => {
                          if (!src) return null;
                          return (
                          <div
                            key={i}
                            className="relative w-full aspect-4/3 sm:aspect-video rounded-2xl border overflow-hidden bg-slate-100"
                            style={{ borderColor: "#e2e8f0" }}
                          >
                            <ManagedImage
                              src={dashboardJobImagePath(detailJob.id, "issue", i)}
                              alt={`รูปประกอบ ${i + 1}`}
                              fill
                              sizes={MANAGED_IMAGE_SIZES.galleryResponsiveMd}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.05]"
                            />
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <JobImageLightbox
        open={Boolean(updatePreviewImages && updatePreviewImages.length > 0)}
        onOpenChange={(open) => {
          if (!open) setUpdatePreviewImages(null);
        }}
        urls={updatePreviewImages ?? []}
        index={updatePreviewIndex}
        onIndexChange={setUpdatePreviewIndex}
      />

      <Dialog
        open={updateFixJob != null}
        onOpenChange={(open) => {
          if (!open) {
            setUpdateFixJob(null);
            setUpdatePreviewImages(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-[var(--glass-overlay)] backdrop-blur-md"
          className="max-h-[min(90dvh,calc(100dvh-2rem))] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden border-0 bg-transparent p-0 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] shadow-none ring-0 sm:max-w-5xl"
        >
          <div
            className={`${GLASS_SECTION} flex max-h-[min(90dvh,calc(100dvh-2rem))] w-full flex-col overflow-hidden shadow-2xl ring-1 ring-white/5`}
          >
            <DialogHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-[var(--glass-card-border)] px-5 py-4">
              <DialogTitle
                id="update-fix-modal-title"
                className="font-bold text-base glass-text sm:text-lg"
              >
                ข้อมูลการแก้ไข {updateFixJob?.ticketNo && `· ${updateFixJob.ticketNo}`}
              </DialogTitle>
              <button
                type="button"
                onClick={() => {
                  setUpdateFixJob(null);
                  setUpdatePreviewImages(null);
                }}
                className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl p-2 glass-muted-text transition-colors hover:bg-[var(--glass-hover)] hover:text-[var(--glass-text)]"
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </DialogHeader>

              <div className="px-5 sm:px-6 py-4 overflow-y-auto flex-1 min-h-0">
                {updateFixLoading ? (
                  <p className="text-sm glass-muted-text">กำลังโหลด...</p>
                ) : (
                  updateFixJob && (
                    <div className="space-y-4">
                      <div className={`${GLASS_SECTION} p-4 sm:p-6 h-fit`}>
                        <h3 className="text-sm font-bold mb-3 glass-text">
                          รูปภาพปัญหาที่แจ้ง
                        </h3>
                        <div className="flex flex-col gap-3">
                        {Array.isArray(updateFixJob.images) &&
                        updateFixJob.images.some(
                          (u) => typeof u === "string" && u.trim(),
                        ) ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {updateFixJob.images.map((src, i) => {
                              if (!src || typeof src !== "string") return null;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  className="relative aspect-video overflow-hidden rounded-xl border border-[var(--glass-card-border)] cursor-pointer"
                                  onClick={() => {
                                    const urls = (updateFixJob.images ?? [])
                                      .map((u, idx) =>
                                        u
                                          ? dashboardJobImagePath(
                                              updateFixJob.id,
                                              "issue",
                                              idx,
                                            )
                                          : null,
                                      )
                                      .filter(Boolean) as string[];
                                    setUpdatePreviewImages(urls);
                                    setUpdatePreviewIndex(
                                      Math.max(0, urls.indexOf(
                                        dashboardJobImagePath(
                                          updateFixJob.id,
                                          "issue",
                                          i,
                                        ),
                                      )),
                                    );
                                  }}
                                  aria-label={`ดูรูปปัญหาที่ ${i + 1}`}
                                >
                                  <ManagedImage
                                    src={dashboardJobImagePath(
                                      updateFixJob.id,
                                      "issue",
                                      i,
                                    )}
                                    alt={`รูปปัญหา ${i + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes={MANAGED_IMAGE_SIZES.galleryResponsiveSm}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        ) : !updateCanUploadIssueImages ? (
                          <p className="text-xs glass-muted-text">
                            ยังไม่มีรูปปัญหาที่แจ้ง
                          </p>
                        ) : null}
                          <IssueImagesUploadPanel
                            key={updateIssueImageCount}
                            jobId={updateFixJob.id}
                            token={token}
                            canUpload={updateCanUploadIssueImages}
                            existingCount={updateIssueImageCount}
                            onUploaded={async () => {
                              const res = await axios.get(
                                `${API}/jobs/${updateFixJob.id}`,
                                {
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                },
                              );
                              const j = unwrapApiData(res.data) as Job;
                              setUpdateFixJob(j);
                            }}
                          />
                        </div>
                      </div>

                      <div className={`${GLASS_SECTION} p-4 sm:p-6 h-fit`}>
                        <h3 className="text-sm font-bold mb-3 glass-text">
                          ข้อมูลการแก้ไข
                        </h3>

                        {/* หัวข้อสถานะ + ข้อมูลประกอบ */}
                        <div className="space-y-3 text-xs glass-muted-text">
                          <div className="flex justify-between gap-2 items-center">
                            <span>สถานะปัจจุบัน:</span>
                            <span className="flex flex-wrap items-center justify-end gap-1.5">
                              <span
                                className={
                                  STATUS_CONFIG[updateFixJob.status]?.badgeCls ??
                                  "badge badge-pending"
                                }
                              >
                                {STATUS_CONFIG[updateFixJob.status]?.label ??
                                  updateFixJob.status}
                              </span>
                              {isAwaitingReporterSignature(updateFixJob) && (
                                <AwaitingReporterSignatureBadge />
                              )}
                            </span>
                          </div>

                          {!updateFixJob.assignedTo && (
                            <div className="rounded-xl border border-[var(--glass-card-border)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs glass-text">
                              งานนี้ยังไม่มีผู้รับผิดชอบ
                            </div>
                          )}

                          {updateFixJob.assignedTo && (
                            <div className="flex justify-between gap-2">
                              <span>ผู้แก้ไข (ผู้รับผิดชอบ):</span>
                              <span className="font-semibold text-slate-900 dark:text-slate-200">
                                {updateFixJob.assignedTo.name}
                              </span>
                            </div>
                          )}

                          {updateFixJob.fixImages &&
                            Array.isArray(updateFixJob.fixImages) &&
                            updateFixJob.fixImages.length > 0 && (
                              <div className="pt-3 space-y-2">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  รูปการแก้ไข
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {updateFixJob.fixImages
                                    .slice(0, 3)
                                    .map((src, i) => {
                                      if (!src) return null;
                                      return (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                          const slice = (
                                            updateFixJob.fixImages as string[]
                                          ).slice(0, 3);
                                          const proxyUrls: string[] = [];
                                          const origIdx: number[] = [];
                                          slice.forEach((u, idx) => {
                                            if (u) {
                                              origIdx.push(idx);
                                              proxyUrls.push(
                                                dashboardJobImagePath(
                                                  updateFixJob.id,
                                                  "fix",
                                                  idx,
                                                ),
                                              );
                                            }
                                          });
                                          const pos = origIdx.indexOf(i);
                                          if (pos < 0) return;
                                          setUpdatePreviewImages(proxyUrls);
                                          setUpdatePreviewIndex(pos);
                                        }}
                                        className="relative w-full aspect-4/3 rounded-xl border border-[var(--glass-card-border)] overflow-hidden bg-[var(--glass-input-bg)] group cursor-pointer"
                                      >
                                        <ManagedImage
                                          src={dashboardJobImagePath(
                                            updateFixJob.id,
                                            "fix",
                                            i,
                                          )}
                                          alt={`รูปการแก้ไข ${i + 1}`}
                                          fill
                                          sizes={MANAGED_IMAGE_SIZES.galleryResponsiveMd}
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

                        {/* ฟอร์ม */}
                        <div className="mt-4 border-t border-[var(--glass-card-border)] pt-4 space-y-4">
                          <form onSubmit={handleSubmitUpdateFix} className="space-y-4">
                            <div className="rounded-xl border border-[var(--glass-card-border)] bg-[var(--glass-input-bg)] p-3 sm:p-4 space-y-3">
                              <p className="text-xs glass-muted-text leading-relaxed">
                                <span className="text-red-400">*</span> บังคับกรอก:{" "}
                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                  ประเภทสถานที่ (Indoor / Outdoor)
                                </span>
                                ,{" "}
                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                  ประเภทงาน (Hardware / Software)
                                </span>
                                ,{" "}
                                <span className="text-slate-700 dark:text-slate-300 font-medium">สาเหตุ</span>
                                ,{" "}
                                <span className="text-slate-700 dark:text-slate-300 font-medium">วิธีแก้ไข</span>
                                และแนบรูป 2 รูปแรก — เลือกประเภทสถานที่ก่อน จึงจะเลือกประเภทงานได้
                                หมายเหตุและ Serial ไม่บังคับ
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label
                                    className={GLASS_MODAL_LABEL}
                                    htmlFor="modal-update-fix-environment"
                                  >
                                    ประเภทสถานที่ <span className="text-red-400">*</span>
                                  </label>
                                  <Select
                                    inputId="modal-update-fix-environment"
                                    instanceId="modal-update-fix-environment"
                                    options={[...FIX_ENVIRONMENT_OPTIONS]}
                                    value={updateFixEnvironmentSelectValue}
                                    onChange={(opt) => {
                                      const v = opt
                                        ? String((opt as { value: string }).value)
                                        : "";
                                      setUpdateFixEnvironment(v);
                                      if (!v) setUpdateBrokenPartType("");
                                    }}
                                    isDisabled={updateFixSaving || updateIsReadOnlyFix}
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
                                  <label
                                    className={GLASS_MODAL_LABEL}
                                    htmlFor="modal-update-fix-category"
                                  >
                                    ประเภทงาน <span className="text-red-400">*</span>
                                  </label>
                                  <Select
                                    inputId="modal-update-fix-category"
                                    instanceId="modal-update-fix-category"
                                    options={[...FIX_CATEGORY_OPTIONS]}
                                    value={updateFixCategorySelectValue}
                                    onChange={(opt) =>
                                      setUpdateBrokenPartType(
                                        opt
                                          ? String((opt as { value: string }).value)
                                          : "",
                                      )
                                    }
                                    isDisabled={
                                      updateFixSaving ||
                                      updateIsReadOnlyFix ||
                                      !updateFixEnvironment
                                    }
                                    isClearable
                                    placeholder={
                                      updateFixEnvironment
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
                              <label className={GLASS_MODAL_LABEL} htmlFor="modal-update-cause">
                                สาเหตุ <span className="text-red-400">*</span>
                              </label>
                              <input
                                id="modal-update-cause"
                                type="text"
                                className={GLASS_MODAL_FIELD}
                                value={updateCause}
                                onChange={(e) => setUpdateCause(e.target.value)}
                                disabled={updateFixSaving || updateIsReadOnlyFix}
                                required={updateCanEditFix}
                              />
                            </div>

                            <div>
                              <label className={GLASS_MODAL_LABEL} htmlFor="modal-update-fix-method">
                                วิธีแก้ไข <span className="text-red-400">*</span>
                              </label>
                              <textarea
                                id="modal-update-fix-method"
                                className={GLASS_MODAL_TEXTAREA}
                                value={updateFixMethod}
                                onChange={(e) => setUpdateFixMethod(e.target.value)}
                                disabled={updateFixSaving || updateIsReadOnlyFix}
                                required={updateCanEditFix}
                              />
                            </div>

                            <div>
                              <label className={GLASS_MODAL_LABEL} htmlFor="modal-update-note">
                                หมายเหตุการแก้ไข
                              </label>
                              <input
                                id="modal-update-note"
                                type="text"
                                className={GLASS_MODAL_FIELD}
                                value={updateNote}
                                onChange={(e) => setUpdateNote(e.target.value)}
                                disabled={updateFixSaving || updateIsReadOnlyFix}
                              />
                            </div>

                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                                <p
                                  id="modal-update-serial-hint"
                                  className="text-xs text-slate-500 leading-relaxed flex-1"
                                >
                                  <span className="glass-muted-text font-medium">S/N:</span>{" "}
                                  A–Z / 0–9 / - เท่านั้น — สูงสุด {JOB_SERIAL_ROWS_MAX} แถว
                                </p>
                                {!updateIsReadOnlyFix && (
                                  <button
                                    type="button"
                                    onClick={addModalSerialRow}
                                    disabled={
                                      updateFixSaving ||
                                      updateSerialRows.length >= JOB_SERIAL_ROWS_MAX
                                    }
                                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700/90 transition-all active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer shrink-0"
                                    aria-label="เพิ่มแถว Serial Number"
                                  >
                                    <Plus size={16} aria-hidden />
                                    เพิ่มอุปกรณ์
                                  </button>
                                )}
                              </div>
                              <div className="space-y-3">
                                {updateSerialRows.map((row, idx) => (
                                  <div
                                    key={idx}
                                    className="rounded-xl border border-[var(--glass-card-border)] bg-[var(--glass-input-bg)] p-3 space-y-3"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        อุปกรณ์ {idx + 1}
                                      </span>
                                      {!updateIsReadOnlyFix && updateSerialRows.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removeModalSerialRow(idx)}
                                          disabled={updateFixSaving}
                                          className="inline-flex items-center justify-center min-h-10 min-w-10 rounded-lg border border-[var(--glass-card-border)] glass-muted-text hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                                          aria-label={`ลบแถวอุปกรณ์ ${idx + 1}`}
                                        >
                                          <Minus size={18} aria-hidden />
                                        </button>
                                      )}
                                    </div>
                                    <div>
                                      <label
                                        className={GLASS_MODAL_LABEL}
                                        htmlFor={`modal-serial-name-${idx}`}
                                      >
                                        ชื่ออุปกรณ์
                                      </label>
                                      <input
                                        id={`modal-serial-name-${idx}`}
                                        type="text"
                                        maxLength={200}
                                        autoComplete="off"
                                        className={GLASS_MODAL_FIELD}
                                        value={row.deviceName}
                                        onChange={(e) =>
                                          updateModalSerialRow(idx, {
                                            deviceName: e.target.value.slice(0, 200),
                                          })
                                        }
                                        disabled={updateFixSaving || updateIsReadOnlyFix}
                                        placeholder="เช่น DVR / กล้อง"
                                        aria-describedby="modal-update-serial-hint"
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label
                                          className={GLASS_MODAL_LABEL}
                                          htmlFor={`modal-serial-old-${idx}`}
                                        >
                                          S/N เดิม
                                        </label>
                                        <input
                                          id={`modal-serial-old-${idx}`}
                                          type="text"
                                          inputMode="text"
                                          autoComplete="off"
                                          spellCheck={false}
                                          className={`${GLASS_MODAL_FIELD} font-mono tracking-wide uppercase`}
                                          value={row.oldSerial}
                                          onChange={(e) =>
                                            updateModalSerialRow(idx, {
                                              oldSerial: normalizeSerialNumberInput(
                                                e.target.value,
                                              ),
                                            })
                                          }
                                          disabled={updateFixSaving || updateIsReadOnlyFix}
                                          aria-describedby="modal-update-serial-hint"
                                        />
                                      </div>
                                      <div>
                                        <label
                                          className={GLASS_MODAL_LABEL}
                                          htmlFor={`modal-serial-new-${idx}`}
                                        >
                                          S/N ใหม่
                                        </label>
                                        <input
                                          id={`modal-serial-new-${idx}`}
                                          type="text"
                                          inputMode="text"
                                          autoComplete="off"
                                          spellCheck={false}
                                          className={`${GLASS_MODAL_FIELD} font-mono tracking-wide uppercase`}
                                          value={row.newSerial}
                                          onChange={(e) =>
                                            updateModalSerialRow(idx, {
                                              newSerial: normalizeSerialNumberInput(
                                                e.target.value,
                                              ),
                                            })
                                          }
                                          disabled={updateFixSaving || updateIsReadOnlyFix}
                                          aria-describedby="modal-update-serial-hint"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {updateFixJob.assignedTo && !updateIsReadOnlyFix && (
                              <div>
                                <span className={GLASS_MODAL_LABEL}>
                                  รูปการแก้ไข{" "}
                                  <span className="glass-muted-text font-normal">
                                    (บังคับ 2 รูปแรก — ใช้รูปเดิมได้ / อัปโหลดใหม่เพื่อเปลี่ยน) · {JOB_IMAGE_HINT}
                                  </span>
                                </span>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-1">
                                  {[0, 1, 2].map((i) => (
                                    <div key={i} className="flex flex-col group">
                                      <p className="text-[11px] mb-1.5 font-medium glass-muted-text">
                                        รูปที่ {i + 1}{" "}
                                        {i < 2 && (
                                          <span className="text-red-400">*</span>
                                        )}
                                      </p>
                                      <div
                                        onClick={() => updateFixFileRefs[i].current?.click()}
                                        className={`relative aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-200 ${
                                          updateFixPreviews[i]
                                            ? "border-transparent bg-transparent"
                                            : "border-[var(--glass-card-border)] bg-[var(--glass-input-bg)]"
                                        }`}
                                      >
                                        {!updateFixPreviews[i] && (
                                          <div className="absolute inset-0 group-hover:bg-slate-800/40 transition-colors" />
                                        )}
                                        {updateFixPreviews[i] ? (
                                          <>
                                            <ManagedImage
                                              src={updateFixPreviews[i]!}
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
                                          <div className="flex flex-col items-center gap-1.5 z-10 glass-muted-text group-hover:text-sky-500 transition-colors">
                                            <Camera size={22} aria-hidden />
                                            <span className="text-[10px] font-medium uppercase tracking-wider">
                                              Upload
                                            </span>
                                          </div>
                                        )}
                                        <input
                                          type="file"
                                          accept={JOB_IMAGE_ACCEPT}
                                          className="hidden"
                                          ref={updateFixFileRefs[i]}
                                          onChange={(e) =>
                                            handleUpdateFixImage(
                                              i,
                                              e.target.files?.[0] || null,
                                              e.target,
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {updateCanEditFix ? (
                              <>
                                <button
                                  type="submit"
                                  disabled={
                                    updateFixSaving ||
                                    updateFixLoading ||
                                    updateIsReadOnlyFix ||
                                    !updateFixFormReadyToSubmit
                                  }
                                  className="w-full mt-3 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 transition-all focus:ring-2 focus:ring-blue-500/40 outline-none cursor-pointer disabled:cursor-not-allowed"
                                >
                                  {updateFixSaving
                                    ? "กำลังบันทึก..."
                                    : "บันทึกการแก้ไข"}
                                </button>
                                {updateFixSaveReady && updateFixJob && (
                                  <button
                                    type="button"
                                    onClick={() => void handleGoToCloseJob()}
                                    disabled={updateFixSaving || updateFixLoading}
                                    className="w-full mt-2 min-h-11 py-3 rounded-xl text-sm font-semibold text-emerald-900 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed dark:text-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-500/35 dark:hover:bg-emerald-900/40"
                                  >
                                    {updateFixSaving
                                      ? "กำลังบันทึก..."
                                      : "บันทึกแล้วให้ผู้แจ้งเซ็นปิดงาน"}
                                  </button>
                                )}
                              </>
                            ) : isUpdateResolved && isUpdateAssignee ? (
                              <div className="w-full mt-2 py-2.5 rounded-xl text-xs font-semibold text-center border border-dashed border-[var(--glass-card-border)] bg-[var(--glass-input-bg)] glass-muted-text">
                                งานนี้ถูกปิดแล้ว — หากต้องการแก้ไข ให้ใช้ขั้นตอน Reopen ด้านล่าง
                              </div>
                            ) : isUpdateResolved ? (
                              <div className="w-full mt-2 py-2.5 rounded-xl text-xs font-semibold text-center border border-dashed border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-500">
                                งานนี้ปิดแล้ว — โหมดอ่านอย่างเดียว — หากต้องการแก้ไข ให้ติดต่อผู้รับงานหรือผู้ดูแลระบบ
                              </div>
                            ) : updateFixJob && jobNeedsAssignee(updateFixJob) ? (
                              <div className="w-full mt-2 space-y-2">
                                <div className="py-2.5 rounded-xl text-xs font-semibold text-center border border-dashed border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/20 dark:text-amber-100/90">
                                  ยังไม่มีผู้รับผิดชอบ — มอบหมายหรือรับงานก่อน จึงจะบันทึกการแก้ไขได้
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  {canAssignJob && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!updateFixJob) return;
                                        void openAssignModal(updateFixJob);
                                      }}
                                      className="flex-1 min-h-11 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-sky-400/60 bg-sky-100 text-sky-900 cursor-pointer hover:bg-sky-200/80 dark:border-sky-500/50 dark:bg-sky-950/40 dark:text-sky-100 dark:hover:bg-sky-900/50"
                                    >
                                      <UserPlus size={14} className="inline mr-1.5" aria-hidden />
                                      มอบหมายงาน
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!updateFixJob) return;
                                      void handleTakeJob(updateFixJob.id);
                                    }}
                                    className="flex-1 min-h-11 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[var(--glass-input-bg)] glass-text cursor-pointer hover:bg-[var(--glass-hover)]"
                                  >
                                    <Wrench size={14} className="inline mr-1.5" aria-hidden />
                                    รับงานนี้
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full mt-2 py-2.5 rounded-xl text-xs font-semibold text-center border border-dashed border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-500">
                                เฉพาะผู้รับงานที่ถูกมอบหมายเท่านั้นที่บันทึกและปิดงานได้
                              </div>
                            )}

                            {isUpdateResolved && isUpdateAssignee && updateFixJob && (
                                <div className="rounded-xl border border-orange-300 bg-orange-50 px-3 py-3 flex flex-col gap-2 text-xs sm:text-sm mt-3 text-orange-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
                                  <div className="font-semibold text-orange-900 dark:text-amber-200">
                                    เฉพาะผู้รับงาน: Reopen เพื่อเปลี่ยนสถานะเป็น &quot;กำลังแก้ไข&quot; แล้วจึงแก้ไขข้อมูลได้
                                  </div>
                                  <textarea
                                    className="w-full rounded-xl border border-orange-500/30 bg-white/80 dark:bg-slate-900/50 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-orange-700/50 dark:placeholder:text-orange-200/40 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-500/25 outline-none transition-all min-h-[80px] resize-y"
                                    rows={2}
                                    placeholder="ระบุเหตุผลในการ Reopen เช่น ต้องแก้ไขรายละเอียดวิธีการแก้ไข หรืออัปเดตรูปเพิ่มเติม"
                                    value={updateReopenReason}
                                    onChange={(e) => setUpdateReopenReason(e.target.value)}
                                    disabled={updateFixReopening}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => void handleReopenUpdateFix()}
                                      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${
                                        updateReopenReason.trim() && !updateFixReopening
                                          ? "bg-orange-600 hover:bg-orange-500 text-white"
                                          : "bg-slate-800 text-slate-500"
                                      }`}
                                      disabled={!updateReopenReason.trim() || updateFixReopening}
                                    >
                                      {updateFixReopening ? (
                                        <Loader2 size={16} className="animate-spin shrink-0" aria-hidden />
                                      ) : null}
                                      Reopen → กำลังแก้ไข (ผู้รับงานเท่านั้น)
                                    </button>
                                  </div>
                                </div>
                              )}
                          </form>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Modal มอบหมายงาน (สำหรับ SUPERVISOR/ADMIN) */}
      <Dialog
        open={assignModalOpen}
        onOpenChange={(open) => {
          if (!open) closeAssignModal();
        }}
      >
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-black/60 backdrop-blur-sm"
          className="max-w-md gap-0 overflow-visible border-0 bg-transparent p-3 shadow-none ring-0 sm:max-w-md"
        >
          <div className="glass-card flex flex-col overflow-visible shadow-2xl">
            <DialogHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-[var(--glass-card-border)] p-4">
              <DialogTitle className="font-bold text-base glass-text">
                {assignBulkIds.length > 0
                  ? `มอบหมายงาน ${assignBulkIds.length} รายการ`
                  : `เลขที่แจ้งซ่อม ${assignJob?.ticketNo ? `· ${assignJob.ticketNo}` : ""}`}
              </DialogTitle>
              <button
                type="button"
                onClick={closeAssignModal}
                className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-white/5"
                aria-label="ปิด"
              >
                <X size={20} className="glass-muted-text" />
              </button>
            </DialogHeader>
            <div className="space-y-5 p-5">
              {assignLoading ? (
                <p className="text-sm glass-muted-text">กำลังโหลดรายชื่อเจ้าหน้าที่...</p>
              ) : (
                <>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {assignBulkIds.length > 0
                      ? "เลือกเจ้าหน้าที่ที่ต้องการมอบหมายให้ทุกงานที่เลือก — สถานะจะเป็น «กำลังแก้ไข» หลังมอบหมาย"
                      : "เลือกเจ้าหน้าที่ที่ต้องการมอบหมายงานนี้ให้ — สถานะจะเป็น «กำลังแก้ไข» หลังมอบหมาย"}
                  </p>
                  <Select
                    instanceId="assign-staff-select"
                    styles={selectStyles}
                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                    menuPosition="fixed"
                    options={assignOptions}
                    placeholder="ค้นหาและเลือกเจ้าหน้าที่..."
                    value={
                      assignSelectedId != null
                        ? assignOptions.find((o) => o.value === assignSelectedId) ?? null
                        : null
                    }
                    onChange={(opt: { value: number; label: string } | null) =>
                      setAssignSelectedId(opt ? Number(opt.value) : null)
                    }
                    isClearable
                    isSearchable
                    noOptionsMessage={() => "ไม่พบเจ้าหน้าที่"}
                  />
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={closeAssignModal}
                      disabled={assignSubmitting}
                      className="flex-1 cursor-pointer rounded-xl border border-[var(--glass-input-border)] bg-[var(--glass-input-bg)] glass-muted-text hover:bg-[var(--glass-hover)] hover:text-[var(--glass-text)]"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void handleAssignSubmit()}
                      disabled={assignSelectedId == null || assignSubmitting}
                      className="flex flex-1 cursor-pointer items-center justify-center rounded-xl bg-blue-600 text-sm font-medium text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <UserPlus size={16} className="mr-2 shrink-0" aria-hidden />
                      {assignSubmitting
                        ? "กำลังมอบหมาย..."
                        : assignBulkIds.length > 0
                          ? `มอบหมาย ${assignBulkIds.length} รายการ`
                          : "มอบหมายงาน"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <JobClassifyDocDialog
        open={classifyJob != null}
        onOpenChange={(open) => {
          if (!open && !classifySubmitting) setClassifyJob(null);
        }}
        ticketNo={classifyJob?.ticketNo}
        submitting={classifySubmitting}
        canClassifyContract={canClassifyDocContract}
        canClassifyOutOfContract={canClassifyDocOutOfContract}
        onConfirm={(isOutOfContract) => void handleClassifyDoc(isOutOfContract)}
      />

      <JobReporterSignDialog
        open={signJob != null}
        onOpenChange={(open) => {
          if (!open) setSignJob(null);
        }}
        job={signJob}
        token={token}
        onSuccess={() => fetchJobs({ silent: true })}
      />
    </DashboardPageShell>
  );
}
