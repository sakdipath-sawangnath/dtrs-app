"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import DashboardPageShell from "@/components/DashboardPageShell";
import DashboardFilterBar from "@/components/DashboardFilterBar";
import CrudModal from "@/components/CrudModal";
import { toastSuccess, toastError, toastWarning, confirmDialog } from "@/lib/toast";
import DataTablePagination, { DataTablePageSize } from "@/components/DataTablePagination";

interface UserRow {
  id: number;
  name: string | null;
  username: string;
  email: string | null;
  role: string;
  phone: string | null;
  position: string | null;
  image?: string | null;
}

function unwrapApiData<T>(root: unknown): T | null {
  if (!root) return null;
  if (typeof root === "object" && root !== null && "data" in (root as Record<string, unknown>)) {
    return ((root as { data?: unknown }).data as T) ?? null;
  }
  return root as T;
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  STAFF: "ช่างเทคนิค",
  USER: "ผู้แจ้งซ่อม",
  SUPERVISOR: "หัวหน้างาน",
};

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "ผู้ดูแลระบบ" },
  { value: "STAFF", label: "ช่างเทคนิค" },
  { value: "SUPERVISOR", label: "หัวหน้างาน" },
  { value: "USER", label: "ผู้แจ้งซ่อม" },
];

const PAGE_SIZE_OPTIONS = [
  { value: 15, label: "15" },
  { value: 30, label: "30" },
  { value: 45, label: "45" },
  { value: "all", label: "ทั้งหมด" },
] as const;

/** รูปโปรไฟล์เท่านั้น — ชี้ชื่อ/username ใน tooltip (Dark Glass) — คลิกเปิดดูรูปใหญ่ได้ */
function UserAvatarCell({
  u,
  onPreview,
}: {
  u: UserRow;
  onPreview?: (src: string, alt: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const src = u.image?.trim();
  const showImg = Boolean(src) && !imgError;
  const initial = (u.name?.trim()?.[0] || u.username?.[0] || "?").toUpperCase();
  const tooltip = [u.name?.trim(), u.username ? `@${u.username}` : ""]
    .filter(Boolean)
    .join(" · ");
  const imgAlt = tooltip ? `รูปโปรไฟล์ ${tooltip}` : `รูปโปรไฟล์ ${u.username}`;

  const frameClass =
    "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-800/60 ring-1 ring-white/5";

  return (
    <div className="flex justify-center" title={tooltip || u.username}>
      {showImg && onPreview ? (
        <button
          type="button"
          onClick={() => onPreview(src!, imgAlt)}
          className={`${frameClass} cursor-pointer transition-shadow hover:ring-2 hover:ring-blue-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50`}
          aria-label="ดูรูปโปรไฟล์"
        >
          <img
            src={src}
            alt={imgAlt}
            className="h-full w-full object-cover pointer-events-none"
            onError={() => setImgError(true)}
          />
        </button>
      ) : (
        <div className={frameClass}>
          {showImg ? (
            <img
              src={src}
              alt={imgAlt}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-800/80 text-xs font-semibold text-slate-400">
              {initial}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const emptyForm = () => ({
  username: "",
  password: "",
  name: "",
  email: "",
  phone: "",
  position: "",
  role: "STAFF",
  image: "",
});

/** Dark Glass — ช่องกรอกใน modal (ไม่ใช้ .form-input เพื่อไม่ให้พื้นขาว) */
const MODAL_GLASS_FIELD =
  "w-full rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-sm px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner outline-none transition-all min-h-[44px] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/50 [color-scheme:dark]";
const MODAL_GLASS_FIELD_DISABLED =
  "w-full rounded-xl border border-white/10 bg-slate-900/25 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed min-h-[44px] shadow-inner opacity-90 [color-scheme:dark]";

export default function UsersPage() {
  const [list, setList] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [modalTab, setModalTab] = useState<"account" | "role">("account");
  const [pageTab, setPageTab] = useState<"list" | "role">("list");
  const [pageSize, setPageSize] = useState<DataTablePageSize>(15);
  const [page, setPage] = useState(1);
  const { data: session } = useSession();
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";
  const token = (session as { accessToken?: string })?.accessToken;
  const userRole = (session?.user as { role?: string })?.role ?? "STAFF";
  const isAdmin = userRole === "ADMIN";
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  /** lightbox รูปโปรไฟล์จากตาราง */
  const [avatarLightbox, setAvatarLightbox] = useState<{ src: string; alt: string } | null>(
    null,
  );

  const fetchUsers = () => {
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
  };

  useEffect(() => {
    fetchUsers();
  }, [session]);

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
    return data;
  }, [list, search, roleFilter]);

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
  }, [roleFilter, search, pageSize]);

  /** จำนวนผู้ใช้ role ADMIN ในระบบ (จากรายการเต็ม ไม่ใช่หลัง filter) */
  const adminUserCount = useMemo(
    () => list.filter((u) => u.role === "ADMIN").length,
    [list]
  );

  /** เป็นผู้ดูแลระบบคนสุดท้าย — ห้ามลบ */
  const isSoleAdmin = (u: UserRow) => u.role === "ADMIN" && adminUserCount === 1;

  const openCreate = () => {
    setForm(emptyForm());
    setModalMode("create");
    setModalTab("account");
    setEditingId(null);
    setAvatarFile(null);
    setAvatarPreview(null);
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
    });
    setModalMode("edit");
    setModalTab("account");
    setEditingId(u.id);
    setAvatarFile(null);
    setAvatarPreview(u.image ?? null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (modalMode === "create" && (!form.email.trim() || !form.password.trim())) {
      toastWarning("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toastError(
        modalMode === "create" ? "เพิ่มผู้ใช้ไม่สำเร็จ" : "บันทึกไม่สำเร็จ",
        Array.isArray(msg) ? msg.join(", ") : msg || "เกิดข้อผิดพลาด"
      );
    } finally {
      setSaving(false);
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

  return (
    <DashboardPageShell
      title="จัดการผู้ใช้และบทบาท"
      subtitle={isAdmin ? "เพิ่ม/แก้ไข/ลบผู้ใช้ และกำหนด Role (ADMIN, STAFF, USER)" : "รายชื่อผู้ใช้และบทบาท (ดูอย่างเดียว)"}
      noCard={true}
    >
      <div className="flex flex-col space-y-6 flex-1 min-h-0">
        {/* แท็บระดับหน้า: รายชื่อผู้ใช้ | บทบาท (Role) */}
        <div className="flex shrink-0">
          <div className="p-1 rounded-xl bg-slate-800/40 border border-white/5 backdrop-blur-sm flex gap-1">
            <button
              type="button"
              onClick={() => setPageTab("list")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pageTab === "list"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
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
                  : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              <Shield size={16} /> บทบาท (Role)
            </button>
          </div>
        </div>

        {pageTab === "role" ? (
          <div className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl p-4 sm:p-6">
          <div className="max-w-2xl space-y-4">
            <h3 className="text-base font-bold text-white">สิทธิ์ตามบทบาท (RBAC)</h3>
            <div className="rounded-xl border border-white/10 p-4 space-y-3 bg-slate-800/30">
              <div>
                <p className="font-semibold text-sm text-slate-200">ผู้ดูแลระบบ (ADMIN)</p>
                <p className="text-sm mt-0.5 text-slate-400">เข้าถึงทุกเมนู รวม จัดการผู้ใช้ และ ตั้งค่าระบบ · CRUD ผู้ใช้ได้ทั้งหมด</p>
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-200">ช่างเทคนิค (STAFF)</p>
                <p className="text-sm mt-0.5 text-slate-400">ภาพรวม, รอดำเนินการ, กำลังแก้ไข, ประวัติทั้งหมด, นอกสัญญา · ไม่มีเมนู จัดการผู้ใช้ และ ตั้งค่าระบบ</p>
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-200">ผู้แจ้งซ่อม (USER)</p>
                <p className="text-sm mt-0.5 text-slate-400">เฉพาะ โปรไฟล์, แจ้งปัญหา, ตรวจสอบสถานะ</p>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-xs font-medium mb-2 text-slate-400">สรุปจำนวนผู้ใช้ตามบทบาท</p>
              <div className="flex flex-wrap gap-3">
                {ROLE_OPTIONS.map((o) => (
                  <span key={o.value} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-slate-800/50 text-slate-300 border border-white/5">
                    {o.label}: <strong>{list.filter((u) => u.role === o.value).length}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl overflow-hidden">
      <DashboardFilterBar
        searchPlaceholder="ค้นหา username, ชื่อ, อีเมล, เบอร์..."
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={fetchUsers}
        rightActions={isAdmin ? (
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
          <select
            className="select-native-glass w-full sm:w-56 md:min-w-[180px]"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">ทุกบทบาท</option>
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            className="select-native-glass w-full sm:w-32 md:min-w-[112px]"
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
      </DashboardFilterBar>

      {error ? (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-red-400">{error}</p>
          <button type="button" onClick={fetchUsers} className="mt-3 px-4 py-2 rounded-lg border border-white/10 text-sm text-slate-400 hover:bg-white/5 transition-colors">
            โหลดใหม่
          </button>
        </div>
      ) : loading ? (
        <div className="flex-1 p-8 flex justify-center">
          <div className="animate-pulse text-sm text-slate-500">
            กำลังโหลด...
          </div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="flex-1 p-12 flex flex-col items-center justify-center text-center">
          <UserCog size={48} className="opacity-40 mb-3 text-slate-600" />
          <p className="font-semibold text-slate-400">
            {list.length === 0 ? "ยังไม่มีผู้ใช้" : "ไม่พบรายการตามตัวกรอง"}
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full min-w-[600px] text-left border-collapse">
              <thead>
                <tr
                  className="text-xs font-semibold uppercase tracking-wide sticky top-0 z-10 bg-slate-800/80 backdrop-blur-sm text-slate-400"
                >
                  <th className="w-14 px-2 py-3 border-b border-white/5 text-center whitespace-nowrap">
                    รูป
                  </th>
                  <th className="px-4 py-3 border-b border-white/5 min-w-[120px]">ชื่อ-สกุล</th>
                  <th className="px-4 py-3 border-b border-white/5 min-w-[160px]">อีเมล</th>
                  <th className="px-4 py-3 border-b border-white/5 min-w-[140px]">เบอร์ / ตำแหน่ง</th>
                  <th className="px-4 py-3 border-b border-white/5 whitespace-nowrap w-28">บทบาท</th>
                  {isAdmin && (
                    <th className="px-4 py-3 border-b border-white/5 text-right whitespace-nowrap w-24">จัดการ</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-white/5 transition-colors text-sm border-b border-white/5"
                  >
                    <td className="w-14 px-2 py-3 align-middle">
                      <UserAvatarCell
                        u={u}
                        onPreview={(src, alt) => setAvatarLightbox({ src, alt })}
                      />
                    </td>
                    <td className="px-4 py-3 truncate min-w-0 text-slate-300 max-w-[220px]">
                      {u.name || "–"}
                    </td>
                    <td className="px-4 py-3 truncate min-w-0 text-xs text-slate-400 max-w-[min(100%,280px)]">
                      {u.email || "–"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {u.phone || "–"}
                      {u.position && <span className="mt-0.5 flex items-center gap-1"><Briefcase size={10} /> {u.position}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge justify-center min-w-[88px] ${u.role === "ADMIN" ? "badge-resolved" : u.role === "USER" ? "badge-pending" : "badge-progress"}`}>
                        {ROLE_LABEL[u.role] || u.role}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => openEdit(u)} className="p-2 rounded-lg hover:bg-white/10 inline-flex text-slate-400 hover:text-white transition-colors" title="แก้ไข">
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
            showExtraTotal={!!search.trim() || !!roleFilter}
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
        <div className="flex gap-1 p-1 rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-sm mb-4">
          <button
            type="button"
            onClick={() => setModalTab("account")}
            className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${modalTab === "account" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-inner" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
          >
            <User size={14} aria-hidden /> ข้อมูลบัญชี
          </button>
          <button
            type="button"
            onClick={() => setModalTab("role")}
            className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${modalTab === "role" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-inner" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
          >
            <Shield size={14} aria-hidden /> บทบาท (Role)
          </button>
        </div>

        {modalTab === "account" && (
          <>
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-sm p-4 flex items-center gap-4 mb-1">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt=""
                  className="w-14 h-14 rounded-2xl object-cover border border-white/15 ring-2 ring-white/5 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-base font-semibold text-slate-300 bg-slate-800/80 border border-white/10 shrink-0">
                  {(form.name || form.email || form.username || "U")[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex flex-col gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (ev: Event) => {
                      const file = (ev.target as HTMLInputElement).files?.[0] || null;
                      if (file) {
                        setAvatarFile(file);
                        setAvatarPreview(URL.createObjectURL(file));
                      }
                    };
                    input.click();
                  }}
                  className="w-fit px-3 py-2 rounded-xl border border-white/15 bg-slate-800/50 backdrop-blur-sm text-xs font-medium text-slate-200 hover:bg-slate-700/55 hover:border-white/25 transition-all active:scale-95 cursor-pointer"
                >
                  {avatarPreview ? "เปลี่ยนรูปโปรไฟล์" : "อัปโหลดรูปโปรไฟล์"}
                </button>
                <span className="text-[11px] text-slate-500 leading-snug">
                  รองรับ JPG, PNG ขนาดไม่เกิน ~2MB
                </span>
              </div>
            </div>
            {modalMode === "create" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-300">อีเมล <span className="text-red-400">*</span></label>
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
                  <label className="block text-sm font-medium mb-1 text-slate-300">รหัสผ่าน <span className="text-red-400">*</span></label>
                  <input
                    type="password"
                    required
                    className={MODAL_GLASS_FIELD}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="รหัสผ่าน"
                  />
                </div>
              </>
            )}
            {modalMode === "edit" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-300">เปลี่ยนรหัสผ่าน (ถ้าต้องการ)</label>
                  <input
                    type="password"
                    className={MODAL_GLASS_FIELD}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="เว้นว่างถ้าไม่เปลี่ยน"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-300">Username / อีเมล</label>
                  <input type="text" className={MODAL_GLASS_FIELD_DISABLED} value={form.username} disabled readOnly />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">ชื่อ-สกุล</label>
              <input
                type="text"
                className={MODAL_GLASS_FIELD}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ชื่อจริง"
              />
            </div>
            {modalMode === "edit" && (
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">อีเมล</label>
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
              <label className="block text-sm font-medium mb-1 text-slate-300">เบอร์โทร</label>
              <input
                type="text"
                className={MODAL_GLASS_FIELD}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="08xxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">ตำแหน่ง</label>
              <input
                type="text"
                className={MODAL_GLASS_FIELD}
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="ตำแหน่งงาน"
              />
            </div>
          </>
        )}

        {modalTab === "role" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">บทบาท (Role)</label>
              <select className="select-native-glass w-full" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="rounded-2xl p-4 text-xs space-y-2 bg-slate-900/40 backdrop-blur-sm border border-white/10 text-slate-400 shadow-inner">
              <p className="font-semibold text-slate-300">สิทธิ์ตามบทบาท (RBAC)</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li><strong>ผู้ดูแลระบบ (ADMIN):</strong> เข้าถึงทุกเมนู รวมจัดการผู้ใช้ และตั้งค่าระบบ (CRUD ได้ทั้งหมด)</li>
                <li><strong>ช่างเทคนิค (STAFF):</strong> ภาพรวม, แจ้งปัญหา, ตรวจสอบสถานะ, รอดำเนินการ, กำลังแก้ไข, ประวัติ, นอกสัญญา, โปรไฟล์ (ไม่มีจัดการผู้ใช้/ตั้งค่า)</li>
                <li><strong>ผู้แจ้งซ่อม (USER):</strong> เฉพาะ โปรไฟล์, แจ้งปัญหา, ตรวจสอบสถานะ</li>
              </ul>
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
            className="relative w-full max-w-[min(100%,20rem)] rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={avatarLightbox.alt}
          >
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4 border-b border-white/10 shrink-0">
              <p className="text-xs sm:text-sm font-medium text-slate-200 truncate min-w-0 pr-2">
                {avatarLightbox.alt}
              </p>
              <button
                type="button"
                onClick={() => setAvatarLightbox(null)}
                className="shrink-0 p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex items-center justify-center bg-slate-950/90 p-4 sm:p-5">
              <div className="w-full max-w-[240px] aspect-square flex items-center justify-center rounded-xl bg-slate-900/50 ring-1 ring-white/10 overflow-hidden">
                <img
                  src={avatarLightbox.src}
                  alt={avatarLightbox.alt}
                  className="max-h-full max-w-full h-full w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
