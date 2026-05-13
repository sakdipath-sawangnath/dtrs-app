"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Shield, Plus, Pencil, Trash2 } from "lucide-react";
import DashboardPageShell from "@/components/DashboardPageShell";
import DashboardFilterBar from "@/components/DashboardFilterBar";
import DashboardRouteLoading from "@/components/DashboardRouteLoading";
import CrudModal from "@/components/CrudModal";
import RoleBadge from "@/components/RoleBadge";
import { toastSuccess, toastError, confirmDialog } from "@/lib/toast";
import {
  buildRoleBadgeStyleMap,
  normalizeHexColorOrNull,
  resolveRoleBadgePalette,
} from "@/lib/roleBadge";

interface AppRole {
  id: number;
  code: string;
  name: string;
  description: string | null;
  badgeTextColor?: string | null;
  badgeBgColor?: string | null;
  _count?: { users: number; permissions: number };
}

interface Permission {
  id: number;
  code: string;
  name: string;
  category: string | null;
}

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

function unwrapApiData<T>(root: unknown): T | null {
  if (!root) return null;
  if (typeof root === "object" && root !== null && "data" in (root as Record<string, unknown>)) {
    return ((root as { data?: unknown }).data as T) ?? null;
  }
  return root as T;
}

export default function RolesPage() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "permissions">("create");
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [rolePermissionIds, setRolePermissionIds] = useState<number[]>([]);
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    badgeTextColor: "#E2E8F0",
    badgeBgColor: "#334155",
  });
  const [saving, setSaving] = useState(false);

  const fetchRoles = () => {
    if (!token) return;
    axios
      .get<AppRole[]>(`${API}/roles`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        const payload = unwrapApiData<unknown>(r?.data);
        setRoles(Array.isArray(payload) ? (payload as AppRole[]) : []);
      })
      .catch(() => setRoles([]));
  };

  const fetchPermissions = () => {
    if (!token) return;
    axios
      .get<Permission[]>(`${API}/roles/permissions`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        const payload = unwrapApiData<unknown>(r?.data);
        setPermissions(Array.isArray(payload) ? (payload as Permission[]) : []);
      })
      .catch(() => setPermissions([]));
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      axios.get(`${API}/roles`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API}/roles/permissions`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(([rRoles, rPerms]) => {
        const rolesPayload = unwrapApiData<unknown>(rRoles?.data);
        const permsPayload = unwrapApiData<unknown>(rPerms?.data);
        setRoles(Array.isArray(rolesPayload) ? (rolesPayload as AppRole[]) : []);
        setPermissions(Array.isArray(permsPayload) ? (permsPayload as Permission[]) : []);
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          (err as { message?: string })?.message ??
          "โหลดข้อมูลบทบาท/สิทธิ์ไม่สำเร็จ";
        setLoadError(String(msg));
        setRoles([]);
        setPermissions([]);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const openCreate = () => {
    const initial = resolveRoleBadgePalette("USER");
    setForm({
      code: "",
      name: "",
      description: "",
      badgeTextColor: initial.textColor,
      badgeBgColor: initial.bgColor,
    });
    setModalMode("create");
    setEditingRole(null);
    setModalOpen(true);
  };

  const openEdit = (role: AppRole) => {
    const palette = resolveRoleBadgePalette(
      role.code,
      buildRoleBadgeStyleMap([
        {
          code: role.code,
          badgeTextColor: role.badgeTextColor ?? null,
          badgeBgColor: role.badgeBgColor ?? null,
        },
      ]),
    );
    setForm({
      code: role.code,
      name: role.name,
      description: role.description || "",
      badgeTextColor: palette.textColor,
      badgeBgColor: palette.bgColor,
    });
    setModalMode("edit");
    setEditingRole(role);
    setModalOpen(true);
  };

  const openPermissions = (role: AppRole) => {
    setEditingRole(role);
    setModalMode("permissions");
    setModalOpen(true);
    if (!token) return;
    axios
      .get<number[]>(`${API}/roles/${role.id}/permissions`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        const payload = unwrapApiData<unknown>(r?.data);
        setRolePermissionIds(Array.isArray(payload) ? (payload as number[]) : []);
      })
      .catch(() => setRolePermissionIds([]));
  };

  const togglePermission = (id: number) => {
    setRolePermissionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (modalMode === "create" && !form.code.trim()) {
      toastError("กรุณากรอกรหัสบทบาท");
      return;
    }
    if (!form.name.trim()) {
      toastError("กรุณากรอกชื่อบทบาท");
      return;
    }
    setSaving(true);
    try {
      if (modalMode === "create") {
        await axios.post(
          `${API}/roles`,
          {
            code: form.code.trim().toUpperCase(),
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            badgeTextColor: normalizeHexColorOrNull(form.badgeTextColor) ?? undefined,
            badgeBgColor: normalizeHexColorOrNull(form.badgeBgColor) ?? undefined,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toastSuccess("สร้างบทบาทสำเร็จ", 1200);
      } else if (editingRole && modalMode === "edit") {
        await axios.patch(
          `${API}/roles/${editingRole.id}`,
          {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            badgeTextColor: normalizeHexColorOrNull(form.badgeTextColor) ?? undefined,
            badgeBgColor: normalizeHexColorOrNull(form.badgeBgColor) ?? undefined,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toastSuccess("บันทึกสำเร็จ", 1200);
      }
      setModalOpen(false);
      fetchRoles();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toastError("ดำเนินการไม่สำเร็จ", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingRole) return;
    setSaving(true);
    try {
      await axios.patch(
        `${API}/roles/${editingRole.id}/permissions`,
        { permissionIds: rolePermissionIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toastSuccess("บันทึกสิทธิ์สำเร็จ", 1200);
      setModalOpen(false);
      fetchRoles();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toastError("บันทึกไม่สำเร็จ", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: AppRole) => {
    const usersCount = (role as AppRole & { _count?: { users?: number } })._count?.users ?? 0;
    if (usersCount > 0) {
      toastError("ไม่สามารถลบได้", "มีผู้ใช้ในบทบาทนี้");
      return;
    }
    const ok = await confirmDialog({ title: "ยืนยันการลบ", text: `ลบบทบาท "${role.name}"?` });
    if (!ok || !token) return;
    try {
      await axios.delete(`${API}/roles/${role.id}`, { headers: { Authorization: `Bearer ${token}` } });
      toastSuccess("ลบแล้ว", 1200);
      fetchRoles();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toastError("ลบไม่สำเร็จ", Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  const rolePerms = permissions;
  const roleStyleMap = buildRoleBadgeStyleMap(
    roles.map((r) => ({
      code: r.code,
      name: r.name,
      badgeTextColor: r.badgeTextColor ?? null,
      badgeBgColor: r.badgeBgColor ?? null,
    })),
  );

  if (loading) {
    return (
      <DashboardPageShell
        title="จัดการบทบาทและสิทธิ์"
        subtitle="สร้าง/แก้ไขบทบาท และกำหนดสิทธิ์เมนู (RBAC) ให้แต่ละบทบาท"
        noCard={true}
      >
        <DashboardRouteLoading variant="page" />
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell
      title="จัดการบทบาทและสิทธิ์"
      subtitle="สร้าง/แก้ไขบทบาท และกำหนดสิทธิ์เมนู (RBAC) ให้แต่ละบทบาท"
      noCard={true}
    >
      <div className="flex flex-col space-y-6">
        <DashboardFilterBar
          onRefresh={() => { fetchRoles(); fetchPermissions(); }}
          rightActions={
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
            >
              <Plus size={16} /> เพิ่มบทบาท
            </button>
          }
        />

        {roles.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl p-12 flex flex-col items-center justify-center text-center">
            <Shield size={48} className="opacity-40 mb-3 text-slate-600" />
            <p className="font-semibold text-slate-400">
              {loadError ? loadError : "ยังไม่มีบทบาท · รัน seed-roles-permissions ก่อน"}
            </p>
            {loadError == null && (
              <p className="text-sm mt-2 text-slate-500">
                ถ้าเพิ่งเพิ่ม permission ใหม่ ให้รัน seed-roles-permissions อีกครั้ง
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className="rounded-2xl border border-white/10 p-5 flex flex-col bg-slate-900/50 backdrop-blur-md shadow-xl hover:border-blue-500/30 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <RoleBadge
                      roleCode={role.code}
                      label={role.name}
                      styleMap={roleStyleMap}
                      className="min-w-[112px] justify-center"
                    />
                    <p className="text-xs font-mono mt-0.5 text-slate-400">{role.code}</p>
                    {role.description && (
                      <p className="text-xs mt-1 line-clamp-2 text-slate-500">{role.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openPermissions(role)}
                      className="p-2 rounded-lg hover:bg-white/10 text-sm text-slate-400 hover:text-white transition-colors"
                      title="กำหนดสิทธิ์"
                    >
                      <Shield size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(role)}
                      className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="แก้ไข"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(role)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                      title="ลบ"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-slate-400">
                  <span>ผู้ใช้: {(role as AppRole & { _count?: { users: number } })._count?.users ?? 0}</span>
                  <span>สิทธิ์: {(role as AppRole & { _count?: { permissions: number } })._count?.permissions ?? 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CrudModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size={modalMode === "permissions" ? "lg" : "md"}
        title={
          modalMode === "create"
            ? "เพิ่มบทบาท"
            : modalMode === "permissions" && editingRole
              ? `กำหนดสิทธิ์: ${editingRole.name}`
              : "แก้ไขบทบาท"
        }
        saving={saving}
        submitLabel={modalMode === "permissions" ? "บันทึกสิทธิ์" : modalMode === "create" ? "สร้าง" : "บันทึก"}
        onSubmit={modalMode === "permissions" ? handleSavePermissions : handleSaveRole}
      >
        {modalMode === "permissions" ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 leading-relaxed">
              เลือกสิทธิ์เมนู/งานที่บทบาทนี้สามารถใช้งานได้
            </p>
            <div
              className="rounded-xl border border-white/10 bg-slate-950/40 backdrop-blur-sm p-3 max-h-[min(22rem,50vh)] overflow-y-auto space-y-0.5 shadow-inner ring-1 ring-white/5"
              role="group"
              aria-label="รายการสิทธิ์"
            >
              {rolePerms.map((p) => (
                <label
                  key={p.id}
                  className="flex items-start gap-3 cursor-pointer rounded-lg px-2 py-2 hover:bg-white/5 transition-colors min-h-[44px]"
                >
                  <input
                    type="checkbox"
                    checked={rolePermissionIds.includes(p.id)}
                    onChange={() => togglePermission(p.id)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-slate-900/60 text-blue-600 focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-slate-200">{p.name}</span>
                    <span className="text-xs font-mono text-slate-500">({p.code})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-200" htmlFor="role-code">
                รหัสบทบาท (code)
              </label>
              <input
                id="role-code"
                type="text"
                className="form-input-glass"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="เช่น STAFF, CUSTOM"
                disabled={modalMode === "edit"}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-200" htmlFor="role-name">
                ชื่อบทบาท
              </label>
              <input
                id="role-name"
                type="text"
                className="form-input-glass"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="เช่น ช่างเทคนิค"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-200" htmlFor="role-desc">
                คำอธิบาย
              </label>
              <textarea
                id="role-desc"
                className="form-input-glass min-h-[88px] py-2.5 resize-y"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="อธิบายบทบาทนี้"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-200" htmlFor="role-badge-bg">
                  สีพื้น Badge
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="role-badge-bg"
                    type="color"
                    className="h-11 w-14 rounded-lg border border-white/10 bg-slate-900/40 cursor-pointer"
                    value={normalizeHexColorOrNull(form.badgeBgColor) ?? "#334155"}
                    onChange={(e) => setForm({ ...form, badgeBgColor: e.target.value.toUpperCase() })}
                    aria-label="เลือกสีพื้น Badge"
                  />
                  <input
                    type="text"
                    className="form-input-glass"
                    value={form.badgeBgColor}
                    onChange={(e) => setForm({ ...form, badgeBgColor: e.target.value })}
                    placeholder="#334155"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-200" htmlFor="role-badge-text">
                  สีตัวอักษร Badge
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="role-badge-text"
                    type="color"
                    className="h-11 w-14 rounded-lg border border-white/10 bg-slate-900/40 cursor-pointer"
                    value={normalizeHexColorOrNull(form.badgeTextColor) ?? "#E2E8F0"}
                    onChange={(e) => setForm({ ...form, badgeTextColor: e.target.value.toUpperCase() })}
                    aria-label="เลือกสีตัวอักษร Badge"
                  />
                  <input
                    type="text"
                    className="form-input-glass"
                    value={form.badgeTextColor}
                    onChange={(e) => setForm({ ...form, badgeTextColor: e.target.value })}
                    placeholder="#E2E8F0"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/30 p-3">
              <p className="mb-2 text-xs text-slate-400">ตัวอย่าง Badge</p>
              <RoleBadge
                roleCode={form.code || "CUSTOM"}
                label={form.name || (form.code || "บทบาทตัวอย่าง")}
                styleMap={buildRoleBadgeStyleMap([
                  {
                    code: form.code || "CUSTOM",
                    badgeTextColor: normalizeHexColorOrNull(form.badgeTextColor),
                    badgeBgColor: normalizeHexColorOrNull(form.badgeBgColor),
                  },
                ])}
              />
            </div>
          </>
        )}
      </CrudModal>
    </DashboardPageShell>
  );
}
