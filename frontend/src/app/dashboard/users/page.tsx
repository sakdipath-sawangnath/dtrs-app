"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import {
  UserCog,
  Plus,
  Pencil,
  Trash2,
  Briefcase,
  User,
  Shield,
  X,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
} from "lucide-react";
import DashboardPageShell from "@/components/DashboardPageShell";
import DashboardFilterBar from "@/components/DashboardFilterBar";
import DashboardRouteLoading from "@/components/DashboardRouteLoading";
import { MANAGED_IMAGE_SIZES } from "@/components/ManagedImage";
import ManagedImageFrame from "@/components/ManagedImageFrame";
import CrudModal from "@/components/CrudModal";
import RoleBadge from "@/components/RoleBadge";
import { toastSuccess, toastError, toastWarning, confirmDialog } from "@/lib/toast";
import DataTablePagination, { DataTablePageSize } from "@/components/DataTablePagination";
import DataTablePageSizeSelect from "@/components/dashboard/DataTablePageSizeSelect";
import GlassReactSelect, {
  glassSelectRequiredValue,
  glassSelectValue,
  type GlassSelectOption,
} from "@/components/dashboard/GlassReactSelect";
import { buildRoleBadgeStyleMap, type RoleBadgeStyleMap } from "@/lib/roleBadge";
import {
  mergeUserRoleOptions,
  resolveUserManagementAccess,
  usersManagementSubtitle,
} from "@/lib/userManagementAccess";

interface UserRow {
  id: number;
  name: string | null;
  username: string;
  email: string | null;
  role: string;
  phone: string | null;
  position: string | null;
  image?: string | null;
  isLocked?: boolean;
}

type AxiosErrorLike = {
  response?: {
    data?: {
      error?: { message?: string };
      message?: string;
    };
  };
};

function unwrapApiData<T>(root: unknown): T | null {
  if (!root) return null;
  if (typeof root === "object" && root !== null && "data" in (root as Record<string, unknown>)) {
    return ((root as { data?: unknown }).data as T) ?? null;
  }
  return root as T;
}

function getApiErrorMessage(err: unknown): string | undefined {
  const e = err as AxiosErrorLike;
  return (
    e.response?.data?.error?.message ??
    e.response?.data?.message ??
    undefined
  );
}

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "ผู้ดูแลระบบ" },
  { value: "STAFF", label: "ช่างเทคนิค" },
  { value: "SUPERVISOR", label: "หัวหน้างาน" },
  { value: "USER", label: "ผู้แจ้งซ่อม" },
];

const DEFAULT_PASS_SENTINEL = "__DEFAULT_PASS__";

const LOCK_FILTER_OPTIONS: GlassSelectOption[] = [
  { value: "unlocked", label: "เข้าใช้ได้" },
  { value: "locked", label: "ล็อกแล้ว" },
];

/** รูปโปรไฟล์เท่านั้น — ชี้ชื่อ/username ใน tooltip (Dark Glass) — คลิกเปิดดูรูปใหญ่ได้ */
function UserAvatarCell({
  u,
  onPreview,
}: {
  u: UserRow;
  onPreview?: (src: string, alt: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const raw = u.image?.trim();
  const src = raw ? `/user-images/${u.id}` : undefined;
  const showImg = Boolean(src) && !imgError;
  const initial = (u.name?.trim()?.[0] || u.username?.[0] || "?").toUpperCase();
  const tooltip = [u.name?.trim(), u.username ? `@${u.username}` : ""]
    .filter(Boolean)
    .join(" · ");
  const imgAlt = tooltip ? `รูปโปรไฟล์ ${tooltip}` : `รูปโปรไฟล์ ${u.username}`;

  const frameClass =
    "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] ring-1 ring-white/5";

  return (
    <div className="flex justify-center" title={tooltip || u.username}>
      {showImg && onPreview ? (
        <button
          type="button"
          onClick={() => onPreview(src ?? "", imgAlt)}
          className={`${frameClass} cursor-pointer transition-shadow hover:ring-2 hover:ring-blue-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50`}
          aria-label="ดูรูปโปรไฟล์"
        >
          <ManagedImageFrame
            src={src ?? ""}
            alt={imgAlt}
            sizes={MANAGED_IMAGE_SIZES.avatarMd}
            frameClassName="absolute inset-0"
            imageClassName="h-full w-full object-cover pointer-events-none"
            onError={() => setImgError(true)}
          />
        </button>
      ) : (
        <ManagedImageFrame
          src={showImg ? src ?? "" : null}
          alt={imgAlt}
          sizes={MANAGED_IMAGE_SIZES.avatarMd}
          frameClassName={frameClass}
          imageClassName="h-full w-full object-cover"
          onError={() => setImgError(true)}
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-[var(--glass-card-bg)] text-xs font-semibold glass-muted-text">
              {initial}
            </div>
          }
        />
      )}
    </div>
  );
}

const emptyForm = () => ({
  username: "",
  password: DEFAULT_PASS_SENTINEL,
  name: "",
  email: "",
  phone: "",
  position: "",
  role: "USER",
  image: "",
  isLocked: false,
});

function normalizeEmail(v: string) {
  return v.trim().toLowerCase();
}

function normalizePhone(v: string) {
  return v.replace(/\s+/g, "").trim();
}

function generateRandomPassword(length = 12) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@$!%*?";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/** Glass — ช่องกรอกใน modal */
const MODAL_GLASS_FIELD =
  "form-input-glass w-full text-sm shadow-inner transition-all min-h-[44px]";
const MODAL_GLASS_FIELD_DISABLED =
  "form-input-glass w-full text-sm cursor-not-allowed min-h-[44px] shadow-inner opacity-60";

export default function UsersPage() {
  const [list, setList] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [lockFilter, setLockFilter] = useState<"" | "locked" | "unlocked">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [modalTab, setModalTab] = useState<"account" | "role">("account");
  const [pageTab, setPageTab] = useState<"list" | "role">("list");
  const [pageSize, setPageSize] = useState<DataTablePageSize>(15);
  const [page, setPage] = useState(1);
  const { data: session, status } = useSession();
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4100/api";
  const token = (session as { accessToken?: string })?.accessToken;
  const userRole = (session?.user as { role?: string })?.role ?? "STAFF";
  const sessionUserId = Number((session?.user as { id?: string })?.id);
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const userMgmtAccess = resolveUserManagementAccess({ permissions, userRole });
  const canManageUsers = userMgmtAccess.canManage;
  const usersSubtitle = usersManagementSubtitle(userMgmtAccess);
  const [roleCatalog, setRoleCatalog] = useState<Array<{ code: string; name?: string | null }>>(
    [],
  );
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleStyleMap, setRoleStyleMap] = useState<RoleBadgeStyleMap>({});
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [resettingUserId, setResettingUserId] = useState<number | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  /** lightbox รูปโปรไฟล์จากตาราง */
  const [avatarLightbox, setAvatarLightbox] = useState<{ src: string; alt: string } | null>(
    null,
  );

  const fetchRoleStyles = () => {
    if (!token) return;
    setRolesLoading(true);
    axios
      .get<Array<{ code: string; name?: string | null; badgeTextColor?: string | null; badgeBgColor?: string | null }>>(
        `${API}/roles/public-styles`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then((r) => {
        const payload = unwrapApiData<unknown>(r?.data);
        const rows = Array.isArray(payload)
          ? (payload as Array<{
              code: string;
              name?: string | null;
              badgeTextColor?: string | null;
              badgeBgColor?: string | null;
            }>)
          : [];
        setRoleCatalog(rows);
        setRoleStyleMap(buildRoleBadgeStyleMap(rows));
      })
      .catch(() => {
        setRoleCatalog([]);
        setRoleStyleMap({});
      })
      .finally(() => setRolesLoading(false));
  };

  useEffect(() => {
    if (!token || status !== "authenticated") {
      setPermissions(null);
      return;
    }
    fetch(`${API}/roles/me/permissions`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((raw) => {
        const payload = unwrapApiData<{ permissions?: string[] }>(raw);
        const list = payload?.permissions;
        setPermissions(Array.isArray(list) ? list : []);
      })
      .catch(() => setPermissions([]));
  }, [token, status, API]);

  useEffect(() => {
    fetchRoleStyles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const allRoleOptions = useMemo(
    () => mergeUserRoleOptions(ROLE_OPTIONS, roleCatalog),
    [roleCatalog],
  );

  const roleSelectOptions = useMemo(
    (): GlassSelectOption[] =>
      allRoleOptions.map((o) => ({ value: o.value, label: o.label })),
    [allRoleOptions],
  );

  const roleLabelByCode = useMemo(() => {
    return allRoleOptions.reduce<Record<string, string>>((acc, o) => {
      acc[o.value] = o.label;
      return acc;
    }, {});
  }, [allRoleOptions]);

  const getRoleSummaryText = (code: string) => {
    const c = code.toUpperCase().trim();
    if (c === "ADMIN") return "เทียบเท่าเจ้าหน้าที่ แต่สามารถมอบหมายงานให้เจ้าหน้าที่ได้";
    if (c === "STAFF") return "ภาพรวม, รอดำเนินการ, กำลังแก้ไข, ประวัติทั้งหมด, นอกสัญญา · ไม่มีเมนู จัดการผู้ใช้ และ ตั้งค่าระบบ";
    if (c === "USER") return "เฉพาะ โปรไฟล์, แจ้งปัญหา, ตรวจสอบสถานะ";
    return "สิทธิ์ตามที่กำหนดไว้ในหน้าบทบาทและสิทธิ์ (RBAC)";
  };

  const fetchUsers = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    axios
      .get<UserRow[]>(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const payload = unwrapApiData<unknown>(res?.data);
        setList(Array.isArray(payload) ? (payload as UserRow[]) : []);
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          toastWarning("ไม่มีสิทธิ์", "เฉพาะผู้ดูแลระบบเท่านั้นที่จัดการผู้ใช้ได้");
        } else {
          const msg = err.response?.data?.message ?? err.response?.data?.error ?? err.message ?? "โหลดข้อมูลไม่สำเร็จ";
          setError(typeof msg === "string" ? msg : "โหลดข้อมูลไม่สำเร็จ");
        }
        setList([]);
      })
      .finally(() => setLoading(false));
  }, [API, token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, session]);

  useEffect(() => {
    if (!avatarLightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAvatarLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [avatarLightbox]);

  const filteredList = useMemo(() => {
    let data = list;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        (u) =>
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone && u.phone.includes(q)) ||
          (u.position && u.position.toLowerCase().includes(q))
      );
    }
    if (roleFilter) data = data.filter((u) => u.role === roleFilter);
    if (lockFilter === "locked") data = data.filter((u) => u.isLocked === true);
    if (lockFilter === "unlocked") data = data.filter((u) => !u.isLocked);
    return data;
  }, [list, search, roleFilter, lockFilter]);

  const paginatedList = useMemo(() => {
    if (pageSize === "all") return filteredList;
    const start = (page - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, pageSize, page]);

  const totalPages = useMemo(() => {
    if (pageSize === "all") return 1;
    return Math.ceil(filteredList.length / pageSize) || 1;
  }, [filteredList.length, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, lockFilter, search, pageSize]);

  /** จำนวนผู้ใช้ role ADMIN ในระบบ (จากรายการเต็ม ไม่ใช่หลัง filter) */
  const adminUserCount = useMemo(
    () => list.filter((u) => u.role === "ADMIN").length,
    [list]
  );

  /** เป็นผู้ดูแลระบบคนสุดท้าย — ห้ามลบ */
  const isSoleAdmin = (u: UserRow) => u.role === "ADMIN" && adminUserCount === 1;

  const isEditingSelf = useMemo(
    () =>
      modalMode === "edit" &&
      editingId != null &&
      Number.isFinite(sessionUserId) &&
      sessionUserId === editingId,
    [modalMode, editingId, sessionUserId],
  );

  const openCreate = () => {
    setForm(emptyForm());
    setModalMode("create");
    setModalTab("account");
    setEditingId(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    setShowEditPassword(false);
    setModalOpen(true);
  };

  const openEdit = (u: UserRow) => {
    setForm({
      username: u.username,
      password: "",
      name: u.name ?? "",
      email: u.email ?? "",
      phone: u.phone ?? "",
      position: u.position ?? "",
      role: u.role,
      image: u.image ?? "",
      isLocked: u.isLocked === true,
    });
    setModalMode("edit");
    setModalTab("account");
    setEditingId(u.id);
    setAvatarFile(null);
    setAvatarPreview(u.image?.trim() ? `/user-images/${u.id}` : null);
    setShowEditPassword(false);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (modalMode === "create" && (!form.email.trim() || !form.password.trim())) {
      toastWarning("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    if (modalMode === "create") {
      const email = normalizeEmail(form.email);
      const fullName = form.name.trim();
      const phone = normalizePhone(form.phone || "");
      if (!fullName) {
        toastWarning("กรุณากรอกชื่อ-สกุล");
        return;
      }
      if (!phone) {
        toastWarning("กรุณากรอกเบอร์โทร");
        return;
      }

      const emailExists = list.some(
        (u) => normalizeEmail(u.email ?? u.username ?? "") === email,
      );
      if (emailExists) {
        toastError("เพิ่มผู้ใช้ไม่สำเร็จ", "อีเมลนี้มีอยู่แล้วในระบบ");
        return;
      }

      const nameExists = list.some(
        (u) => (u.name ?? "").trim().toLowerCase() === fullName.toLowerCase(),
      );
      if (nameExists) {
        toastError("เพิ่มผู้ใช้ไม่สำเร็จ", "ชื่อ-สกุลนี้มีอยู่แล้วในระบบ");
        return;
      }

      const phoneExists = list.some((u) => normalizePhone(u.phone ?? "") === phone);
      if (phoneExists) {
        toastError("เพิ่มผู้ใช้ไม่สำเร็จ", "เบอร์โทรนี้มีอยู่แล้วในระบบ");
        return;
      }
    }
    setSaving(true);
    try {
      let userId: number | null = null;
      if (modalMode === "create") {
        const res = await axios.post(
          `${API}/users`,
          {
            email: form.email.trim(),
            password: form.password,
            name: form.name.trim() || undefined,
            phone: form.phone.trim() || undefined,
            position: form.position.trim() || undefined,
            role: form.role,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        userId = (res.data as { id?: number })?.id ?? null;
        toastSuccess("เพิ่มผู้ใช้สำเร็จ", 1200);
      } else if (editingId != null) {
        userId = editingId;
        await axios.patch(
          `${API}/users/${editingId}`,
          {
            name: form.name.trim() || undefined,
            email: form.email.trim() || undefined,
            phone: form.phone.trim() || undefined,
            position: form.position.trim() || undefined,
            role: form.role,
            isLocked: form.isLocked,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (form.password.trim()) {
          await axios.patch(
            `${API}/users/${editingId}/password`,
            { password: form.password },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
        toastSuccess("บันทึกสำเร็จ", 1200);
      }
      // upload avatar ถ้ามี
      if (userId && avatarFile) {
        const fd = new FormData();
        fd.append("image", avatarFile);
        await axios.patch(`${API}/users/${userId}/avatar`, fd, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const msg =
        getApiErrorMessage(err);
      toastError(
        modalMode === "create" ? "เพิ่มผู้ใช้ไม่สำเร็จ" : "บันทึกไม่สำเร็จ",
        Array.isArray(msg) ? msg.join(", ") : msg || "เกิดข้อผิดพลาด"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (userId: number, username: string) => {
    const ok = await confirmDialog({
      title: "รีเซ็ตรหัสผ่าน",
      text: `ต้องการรีเซ็ตรหัสผ่านของ "${username}" เป็น Default Pass ใช่หรือไม่?`,
      confirmText: "รีเซ็ตรหัสผ่าน",
      cancelText: "ยกเลิก",
    });
    if (!ok || !token) return;

    try {
      setResettingUserId(userId);
      await axios.post(
        `${API}/users/${userId}/reset-password`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toastSuccess("รีเซ็ตรหัสผ่านแล้ว", 1200);
      fetchUsers();
    } catch (err: unknown) {
      const msg =
        getApiErrorMessage(err);
      toastError("รีเซ็ตรหัสผ่านไม่สำเร็จ", Array.isArray(msg) ? msg.join(", ") : msg || "เกิดข้อผิดพลาด");
    } finally {
      setResettingUserId(null);
    }
  };

  const handleDelete = async (id: number, username: string) => {
    const target = list.find((x) => x.id === id);
    if (target?.role === "ADMIN" && adminUserCount === 1) {
      toastWarning(
        "ไม่สามารถลบได้",
        "ต้องมีผู้ดูแลระบบ (ADMIN) อย่างน้อย 1 บัญชีในระบบ"
      );
      return;
    }
    const ok = await confirmDialog({
      title: "ยืนยันการลบ",
      text: `ต้องการลบผู้ใช้ "${username}" ใช่หรือไม่?`,
      confirmText: "ลบ",
      cancelText: "ยกเลิก",
    });
    if (!ok || !token) return;
    try {
      await axios.delete(`${API}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toastSuccess("ลบผู้ใช้แล้ว", 1200);
      fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toastError("ลบไม่สำเร็จ", Array.isArray(msg) ? msg.join(", ") : msg || "เกิดข้อผิดพลาด");
    }
  };

  if (loading) {
    return (
      <DashboardPageShell
        title="จัดการผู้ใช้และบทบาท"
        subtitle={usersSubtitle}
        noCard={true}
      >
        <DashboardRouteLoading variant="page" />
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell
      title="จัดการผู้ใช้และบทบาท"
      subtitle={usersSubtitle}
      noCard={true}
    >
      <div className="flex flex-col space-y-6 flex-1 min-h-0">
        {/* แท็บระดับหน้า: รายชื่อผู้ใช้ | บทบาท (Role) */}
        <div className="flex shrink-0">
          <div className="p-1 rounded-xl bg-[var(--glass-card-bg)] border border-[var(--glass-card-border)] backdrop-blur-sm flex gap-1">
            <button
              type="button"
              onClick={() => setPageTab("list")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pageTab === "list"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "glass-muted-text hover:glass-muted-text hover:bg-white/5"
              }`}
            >
              <UserCog size={16} /> รายชื่อผู้ใช้
            </button>
            <button
              type="button"
              onClick={() => setPageTab("role")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pageTab === "role"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "glass-muted-text hover:glass-muted-text hover:bg-white/5"
              }`}
            >
              <Shield size={16} /> บทบาท (Role)
            </button>
          </div>
        </div>

        {pageTab === "role" ? (
          <div className="flex-1 overflow-auto glass-card p-4 sm:p-6">
          <div className="max-w-2xl space-y-4">
            <h3 className="text-base font-bold glass-text">สิทธิ์ตามบทบาท (RBAC)</h3>
            <div className="rounded-xl border border-[var(--glass-card-border)] p-4 space-y-3 bg-[var(--glass-input-bg)]">
              {allRoleOptions.map((o) => (
                <div key={o.value}>
                  <p className="font-semibold text-sm glass-text">
                    {o.label} ({o.value})
                  </p>
                  <p className="text-sm mt-0.5 glass-muted-text">{getRoleSummaryText(o.value)}</p>
                </div>
              ))}
              {rolesLoading && (
                <div>
                  <p className="text-sm mt-0.5 glass-muted-text">กำลังโหลดบทบาทใหม่...</p>
                </div>
              )}
            </div>
            <div className="glass-card p-4">
              <p className="text-xs font-medium mb-2 glass-muted-text">สรุปจำนวนผู้ใช้ตามบทบาท</p>
              <div className="flex flex-wrap gap-3">
                {allRoleOptions.map((o) => (
                  <span key={o.value} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-[var(--glass-card-bg)] glass-muted-text border border-[var(--glass-card-border)]">
                    {o.label}: <strong>{list.filter((u) => u.role === o.value).length}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 glass-card overflow-hidden">
      <DashboardFilterBar
        searchPlaceholder="ค้นหา username, ชื่อ, อีเมล, เบอร์..."
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={fetchUsers}
        rightActions={canManageUsers ? (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus size={16} /> เพิ่มผู้ใช้
          </button>
        ) : undefined}
      >
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <GlassReactSelect
            className="w-full sm:w-56 md:min-w-[180px]"
            options={roleSelectOptions}
            placeholder="ทุกบทบาท"
            value={glassSelectValue(roleFilter, roleSelectOptions)}
            onChange={(opt) => setRoleFilter(opt?.value ?? "")}
            aria-label="กรองตามบทบาท"
          />
          <GlassReactSelect
            className="w-full sm:w-44 md:min-w-[160px]"
            options={LOCK_FILTER_OPTIONS}
            placeholder="ทุกสถานะการเข้าใช้"
            value={glassSelectValue(lockFilter, LOCK_FILTER_OPTIONS)}
            onChange={(opt) =>
              setLockFilter((opt?.value ?? "") as "" | "locked" | "unlocked")
            }
            isSearchable={false}
            aria-label="กรองสถานะการเข้าใช้"
          />
          <DataTablePageSizeSelect
            value={pageSize}
            onChange={setPageSize}
            className="w-full sm:w-32 md:min-w-[112px]"
          />
        </div>
      </DashboardFilterBar>

      {error ? (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-red-400">{error}</p>
          <button type="button" onClick={fetchUsers} className="mt-3 px-4 py-2 rounded-lg border border-[var(--glass-card-border)] text-sm glass-muted-text hover:bg-white/5 transition-colors">
            โหลดใหม่
          </button>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="flex-1 p-12 flex flex-col items-center justify-center text-center">
          <UserCog size={48} className="opacity-40 mb-3 glass-subtle-text" />
          <p className="font-semibold glass-muted-text">
            {list.length === 0 ? "ยังไม่มีผู้ใช้" : "ไม่พบรายการตามตัวกรอง"}
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full min-w-[720px] text-left border-collapse">
              <thead>
                <tr
                  className="text-xs font-semibold uppercase tracking-wide sticky top-0 z-10 bg-[var(--glass-card-bg)] backdrop-blur-sm glass-muted-text"
                >
                  <th className="w-14 px-2 py-3 border-b border-[var(--glass-card-border)] text-center whitespace-nowrap">
                    รูป
                  </th>
                  <th className="px-4 py-3 border-b border-[var(--glass-card-border)] min-w-[120px]">ชื่อ-สกุล</th>
                  <th className="px-4 py-3 border-b border-[var(--glass-card-border)] min-w-[160px]">อีเมล</th>
                  <th className="px-4 py-3 border-b border-[var(--glass-card-border)] min-w-[140px]">เบอร์ / ตำแหน่ง</th>
                  <th className="px-4 py-3 border-b border-[var(--glass-card-border)] whitespace-nowrap w-28">บทบาท</th>
                  <th className="px-4 py-3 border-b border-[var(--glass-card-border)] whitespace-nowrap w-30 text-center">
                    เข้าใช้
                  </th>
                  {canManageUsers && (
                    <th className="px-4 py-3 border-b border-[var(--glass-card-border)] text-right whitespace-nowrap w-24">จัดการ</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-white/5 transition-colors text-sm border-b border-[var(--glass-card-border)]"
                  >
                    <td className="w-14 px-2 py-3 align-middle">
                      <UserAvatarCell
                        u={u}
                        onPreview={(src, alt) => setAvatarLightbox({ src, alt })}
                      />
                    </td>
                    <td className="px-4 py-3 truncate min-w-0 glass-muted-text max-w-[220px]">
                      {u.name || "–"}
                    </td>
                    <td className="px-4 py-3 truncate min-w-0 text-xs glass-muted-text max-w-[min(100%,280px)]">
                      {u.email || "–"}
                    </td>
                    <td className="px-4 py-3 text-xs glass-muted-text">
                      {u.phone || "–"}
                      {u.position && <span className="mt-0.5 flex items-center gap-1"><Briefcase size={10} /> {u.position}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge
                        roleCode={u.role}
                        label={roleLabelByCode[u.role] || u.role}
                        styleMap={roleStyleMap}
                        className="justify-center"
                      />
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      {u.isLocked ? (
                        <span
                          className="inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium bg-red-50 text-red-800 border border-red-300 dark:bg-red-950/35 dark:text-red-200 dark:border-red-500/25"
                          title="ล็อกการเข้าสู่ระบบ"
                        >
                          <Lock size={12} className="shrink-0" aria-hidden />
                          ล็อก
                        </span>
                      ) : (
                        <span className="text-xs glass-subtle-text">ปกติ</span>
                      )}
                    </td>
                    {canManageUsers && (
                      <td className="px-4 py-3 text-right">
                        {!isSoleAdmin(u) && (
                          <button
                            type="button"
                            onClick={() => void handleResetPassword(u.id, u.username)}
                            disabled={resettingUserId === u.id}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 inline-flex glass-muted-text hover:text-[var(--glass-text)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="รีเซ็ตรหัสผ่านเป็น Default Pass"
                          >
                            <KeyRound size={14} />
                          </button>
                        )}
                        <button type="button" onClick={() => openEdit(u)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 inline-flex glass-muted-text hover:text-[var(--glass-text)] transition-colors" title="แก้ไข">
                          <Pencil size={14} />
                        </button>
                        {!isSoleAdmin(u) && (
                          <button
                            type="button"
                            onClick={() => handleDelete(u.id, u.username)}
                            className="p-2 rounded-lg hover:bg-red-500/10 inline-flex text-red-400 hover:text-red-300 transition-colors"
                            title="ลบ"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DataTablePagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            filteredCount={filteredList.length}
            showExtraTotal={!!search.trim() || !!roleFilter || !!lockFilter}
            extraTotalCount={list.length}
            onPageChange={setPage}
          />
        </>
      )}
          </div>
        )}
      </div>

      <CrudModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === "create" ? "เพิ่มผู้ใช้" : "แก้ไขผู้ใช้"}
        saving={saving}
        submitLabel={modalMode === "create" ? "เพิ่มผู้ใช้" : "บันทึก"}
        onSubmit={handleSubmit}
      >
        {/* แท็บ: ข้อมูลบัญชี | บทบาท — Dark Glass */}
        <div className="flex gap-1 p-1 rounded-xl border border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] backdrop-blur-sm mb-4">
          <button
            type="button"
            onClick={() => setModalTab("account")}
            className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${modalTab === "account" ? "bg-blue-100 text-blue-800 border border-blue-300 shadow-inner dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30" : "glass-muted-text hover:glass-text hover:bg-slate-100 dark:hover:bg-white/5"}`}
          >
            <User size={14} aria-hidden /> ข้อมูลบัญชี
          </button>
          <button
            type="button"
            onClick={() => setModalTab("role")}
            className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${modalTab === "role" ? "bg-blue-100 text-blue-800 border border-blue-300 shadow-inner dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30" : "glass-muted-text hover:glass-text hover:bg-slate-100 dark:hover:bg-white/5"}`}
          >
            <Shield size={14} aria-hidden /> บทบาท (Role)
          </button>
        </div>

        {modalTab === "account" && (
          <>
            <div className="glass-card backdrop-blur-sm p-4 flex items-center gap-4 mb-1">
              {avatarPreview ? (
                <ManagedImageFrame
                  src={avatarPreview}
                  alt=""
                  sizes={MANAGED_IMAGE_SIZES.avatarLg}
                  frameClassName="w-14 h-14 rounded-2xl border border-[var(--glass-card-border)] ring-2 ring-white/5 shrink-0"
                  imageClassName="object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-base font-semibold glass-muted-text bg-[var(--glass-card-bg)] border border-[var(--glass-card-border)] shrink-0">
                  {(form.name || form.email || form.username || "U")[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex flex-col gap-1.5 min-w-0">
                {modalMode === "create" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (ev: Event) => {
                          const file =
                            (ev.target as HTMLInputElement).files?.[0] || null;
                          if (file) {
                            setAvatarFile(file);
                            setAvatarPreview(URL.createObjectURL(file));
                          }
                        };
                        input.click();
                      }}
                      className="w-fit px-3 py-2 rounded-xl border border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] backdrop-blur-sm text-xs font-medium glass-text hover:bg-[var(--glass-nav-hover-bg)] hover:border-blue-500/25 transition-all active:scale-95 cursor-pointer"
                    >
                      {avatarPreview ? "เปลี่ยนรูปโปรไฟล์" : "อัปโหลดรูปโปรไฟล์"}
                    </button>
                    <span className="text-[11px] glass-subtle-text leading-snug">
                      รองรับ JPG, PNG ขนาดไม่เกิน ~2MB
                    </span>
                  </>
                ) : (
                  <div
                    className="w-fit px-3 py-2 rounded-xl border border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] text-xs font-medium glass-muted-text flex items-center gap-2"
                    aria-label="ใช้รูปโปรไฟล์เดิม"
                  >
                    <User size={14} aria-hidden />
                    <span>รูปเดิม</span>
                  </div>
                )}
              </div>
            </div>
            {modalMode === "create" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1 glass-muted-text">อีเมล <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    required
                    className={MODAL_GLASS_FIELD}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 glass-muted-text">รหัสผ่าน <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      className={`${MODAL_GLASS_FIELD} pr-32`}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="รหัสผ่าน"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, password: DEFAULT_PASS_SENTINEL }))}
                        className="h-10 px-3 rounded-lg border border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] text-xs glass-muted-text hover:bg-[var(--glass-nav-hover-bg)] transition-colors cursor-pointer"
                      >
                        ค่าเริ่มต้น
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, password: generateRandomPassword(12) }))}
                        className="h-10 px-3 rounded-lg border border-blue-300 bg-blue-50 text-xs text-blue-800 hover:bg-blue-100 transition-colors cursor-pointer dark:border-[var(--glass-card-border)] dark:bg-blue-600/20 dark:text-blue-200 dark:hover:bg-blue-600/30"
                      >
                        สุ่ม
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
            {modalMode === "edit" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1 glass-muted-text">เปลี่ยนรหัสผ่าน (ถ้าต้องการ)</label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? "text" : "password"}
                      className={`${MODAL_GLASS_FIELD} pr-12`}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="เว้นว่างถ้าไม่เปลี่ยน"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword((v) => !v)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg glass-muted-text hover:text-[var(--glass-text)] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                      aria-label={showEditPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                      aria-pressed={showEditPassword}
                    >
                      {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 glass-muted-text">Username / อีเมล</label>
                  <input type="text" className={MODAL_GLASS_FIELD_DISABLED} value={form.username} disabled readOnly />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium mb-1 glass-muted-text">ชื่อ-สกุล</label>
              <input
                type="text"
                className={MODAL_GLASS_FIELD}
                required={modalMode === "create"}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ชื่อจริง"
              />
            </div>
            {modalMode === "edit" && (
              <div>
                <label className="block text-sm font-medium mb-1 glass-muted-text">อีเมล</label>
                <input
                  type="email"
                  className={MODAL_GLASS_FIELD}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1 glass-muted-text">เบอร์โทร</label>
              <input
                type="text"
                className={MODAL_GLASS_FIELD}
                required={modalMode === "create"}
                value={form.phone}
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/[^0-9]/g, "");
                  setForm({ ...form, phone: onlyDigits });
                }}
                placeholder="08xxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 glass-muted-text">ตำแหน่ง</label>
              <input
                type="text"
                className={MODAL_GLASS_FIELD}
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="ตำแหน่งงาน"
              />
            </div>
            {modalMode === "edit" && canManageUsers && (
              <div className="flex items-start gap-3 rounded-xl border border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] p-4">
                <input
                  type="checkbox"
                  id="user-is-locked"
                  checked={form.isLocked}
                  disabled={saving || isEditingSelf}
                  onChange={(e) => setForm({ ...form, isLocked: e.target.checked })}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="min-w-0">
                  <label htmlFor="user-is-locked" className="text-sm font-medium glass-text cursor-pointer">
                    ล็อกการเข้าสู่ระบบ
                  </label>
                  <p className="text-xs glass-subtle-text mt-1 leading-snug">
                    ผู้ใช้จะไม่สามารถเข้าสู่ระบบหรือเรียก API ได้จนกว่าจะปลดล็อก
                  </p>
                  {isEditingSelf && (
                    <p className="text-xs text-amber-400/90 mt-1">ไม่สามารถล็อกบัญชีของตัวเองได้</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {modalTab === "role" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 glass-muted-text" htmlFor="user-form-role">
                บทบาท (Role)
              </label>
              <GlassReactSelect
                inputId="user-form-role"
                options={roleSelectOptions}
                value={glassSelectRequiredValue(
                  form.role,
                  roleSelectOptions,
                  roleSelectOptions[0] ?? { value: form.role, label: form.role },
                )}
                onChange={(opt) => {
                  if (!opt) return;
                  setForm({ ...form, role: opt.value });
                }}
                isClearable={false}
                aria-label="บทบาทผู้ใช้"
              />
            </div>
            <div className="rounded-2xl p-4 text-xs space-y-2 bg-[var(--glass-card-bg)] backdrop-blur-sm border border-[var(--glass-card-border)] glass-muted-text shadow-inner">
              <p className="font-semibold glass-muted-text">สิทธิ์ตามบทบาท (RBAC)</p>
              <div className="flex items-center gap-2">
                <RoleBadge
                  roleCode={form.role}
                  label={roleLabelByCode[form.role] || form.role}
                  styleMap={roleStyleMap}
                />
                <p className="glass-muted-text">{getRoleSummaryText(form.role)}</p>
              </div>
              <p className="glass-subtle-text">รายละเอียดสิทธิ์แต่ละเมนูดูได้ที่หน้าจัดการบทบาทและสิทธิ์</p>
            </div>
          </div>
        )}
      </CrudModal>

      {avatarLightbox && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm"
          onClick={() => setAvatarLightbox(null)}
          role="presentation"
        >
          <div
            className="relative w-full max-w-[min(100%,20rem)] glass-card backdrop-blur-md shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={avatarLightbox.alt}
          >
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4 border-b border-[var(--glass-card-border)] shrink-0">
              <p className="text-xs sm:text-sm font-medium glass-text truncate min-w-0 pr-2">
                {avatarLightbox.alt}
              </p>
              <button
                type="button"
                onClick={() => setAvatarLightbox(null)}
                className="shrink-0 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 glass-muted-text hover:text-[var(--glass-text)] transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex items-center justify-center bg-[var(--glass-card-bg)] p-4 sm:p-5">
              <ManagedImageFrame
                src={avatarLightbox.src}
                alt={avatarLightbox.alt}
                sizes={MANAGED_IMAGE_SIZES.lightboxSquare}
                frameClassName="w-full max-w-[240px] aspect-square flex items-center justify-center rounded-xl bg-[var(--glass-card-bg)] ring-1 ring-white/10"
                imageClassName="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
