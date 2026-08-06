"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { User, Lock, Eye, EyeOff, Camera } from "lucide-react";
import ManagedImageFrame from "@/components/ManagedImageFrame";
import DashboardRouteLoading from "@/components/DashboardRouteLoading";
import SegmentedTabs from "@/components/SegmentedTabs";
import RoleBadge from "@/components/RoleBadge";
import { toastSuccess, toastError } from "@/lib/toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { unwrapApiData } from "@/lib/apiResponse";
import { buildRoleBadgeStyleMap, type RoleBadgeStyleMap } from "@/lib/roleBadge";
import { MANAGED_IMAGE_SIZES } from "@/components/ManagedImage";

interface Profile {
  id: number;
  name: string | null;
  username: string;
  email: string | null;
  role: string;
  phone: string | null;
  position: string | null;
  image: string | null;
}

type TabId = "profile" | "password";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [tab, setTab] = useState<TabId>("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarObjectUrl, setAvatarObjectUrl] = useState<string | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [roleStyleMap, setRoleStyleMap] = useState<RoleBadgeStyleMap>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4100/api";
  const token = (session as { accessToken?: string })?.accessToken;

  const fetchProfile = useCallback((): Promise<Profile | null> => {
    if (!token) return Promise.resolve(null);
    setLoading(true);
    setLoadError(null);
    return axios
      .get<Profile>(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const p = unwrapApiData<Profile>(res.data);
        if (!p) {
          const apiRoot = res.data as unknown as Record<string, unknown> | null | undefined;
          const inner = apiRoot?.data;
          console.error("[profile][fetchProfile] invalid payload", apiRoot);
          const notFoundMsg =
            inner === null
              ? "ไม่พบข้อมูลผู้ใช้ในระบบ (data=null) — กรุณาลองออก/เข้าใหม่"
              : "API ตอบกลับมาไม่ถูกต้อง";
          setProfile(null);
          setForm({ name: "", email: "", phone: "", position: "" });
          setAvatarPreview(null);
          setLoadError(notFoundMsg);
          return null;
        }
        setProfile(p);
        setForm({
          name: p.name ?? "",
          email: p.email ?? "",
          phone: p.phone ?? "",
          position: p.position ?? "",
        });
        setAvatarPreview(
          p.image?.trim() ? `/user-images/${p.id}` : null,
        );
        setAvatarObjectUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setAvatarLoadFailed(false);
        return p;
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          (err as { message?: string })?.message ??
          "โหลดโปรไฟล์ไม่สำเร็จ";
        setLoadError(`(${status ?? "?"}) ${msg}`);
        toastError("โหลดโปรไฟล์ไม่สำเร็จ", msg);
        return null;
      })
      .finally(() => setLoading(false));
  }, [token, API]);

  const fetchRoleStyles = useCallback(() => {
    if (!token) return;
    axios
      .get(`${API}/roles/public-styles`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const rows = unwrapApiData<Array<{ code: string; badgeTextColor?: string | null; badgeBgColor?: string | null }>>(res.data);
        setRoleStyleMap(buildRoleBadgeStyleMap(Array.isArray(rows) ? rows : []));
      })
      .catch(() => setRoleStyleMap({}));
  }, [token, API]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchRoleStyles();
  }, [fetchRoleStyles]);

  const avatarFallbackText = useMemo(() => {
    const email = profile?.email ?? form.email ?? "";
    if (!email) {
      const nameFirst = form.name?.trim()?.[0] ?? profile?.username?.trim()?.[0];
      return nameFirst ? nameFirst.toUpperCase() : "?";
    }

    // ใช้ "ชื่ออีเมล" ก่อน @ แล้วเอาตัวอักษรช่วงต้นเป็นตัวย่อ
    const local = email.split("@")[0] || "";
    const parts = local
      .split(/[\.\-_]+/g)
      .map((p) => p.trim())
      .filter(Boolean);
    const letters = (parts.length ? parts : [local])
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2);

    return letters.join("").toUpperCase() || local.slice(0, 2).toUpperCase() || "?";
  }, [form.email, form.name, profile?.email, profile?.username]);

  useEffect(() => {
    // เมื่อ preview เปลี่ยน ให้กลับไปโหลดใหม่
    setAvatarLoadFailed(false);
  }, [avatarPreview]);

  useEffect(() => {
    // cleanup objectURL เมื่อออกจากหน้า
    return () => {
      if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
    };
  }, [avatarObjectUrl]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append("image", avatarFile);
        await axios.patch(`${API}/users/me/avatar`, fd, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
      }
      await axios.patch(
        `${API}/users/me`,
        {
          name: form.name.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          position: form.position.trim() || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toastSuccess("บันทึกโปรไฟล์สำเร็จ", 1200);
      setAvatarFile(null);
      const refreshed = await fetchProfile();
      if (refreshed) {
        await updateSession({
          user: {
            name: refreshed.name ?? undefined,
            image: refreshed.image?.trim()
              ? `/user-images/${refreshed.id}`
              : undefined,
          },
        });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toastError("บันทึกไม่สำเร็จ", Array.isArray(msg) ? msg.join(", ") : msg || "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toastError("รหัสผ่านใหม่กับยืนยันไม่ตรงกัน");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toastError("รหัสผ่านใหม่ต้องอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (!token) return;
    setSaving(true);
    try {
      await axios.patch(
        `${API}/users/me/password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toastSuccess("เปลี่ยนรหัสผ่านสำเร็จ", 1200);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toastError("เปลี่ยนรหัสผ่านไม่สำเร็จ", Array.isArray(msg) ? msg.join(", ") : msg || "รหัสผ่านปัจจุบันอาจไม่ถูกต้อง");
    } finally {
      setSaving(false);
    }
  };

  const tabs: Array<{
    id: TabId;
    label: string;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
  }> = [
    { id: "profile", label: "ข้อมูลผู้ใช้", icon: User },
    { id: "password", label: "รหัสผ่าน", icon: Lock },
  ];

  const pwdToggleBtn =
    "absolute right-1.5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50";

  return (
    <div className="animate-fade-up w-full min-w-0 space-y-6">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold truncate text-white">โปรไฟล์</h1>
        <p className="text-sm mt-0.5 text-slate-400">
          จัดการข้อมูลส่วนตัวและรหัสผ่าน
        </p>
      </div>

      <div className="rounded-xl border border-white/10 p-4 sm:p-5 w-full bg-slate-900/50 backdrop-blur-md shadow-2xl ring-1 ring-white/5">
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <User size={18} className="text-slate-400 shrink-0" aria-hidden />
          <h2 className="font-bold text-sm text-slate-200">ข้อมูลบัญชี</h2>
        </div>

        <SegmentedTabs
          tabs={tabs}
          activeId={tab}
          onChange={setTab}
          ariaLabel="แท็บโปรไฟล์"
        />

        <div className="mt-4 sm:mt-6">
          {loading ? (
            <DashboardRouteLoading variant="overlay" />
          ) : tab === "profile" ? (
            <form onSubmit={handleSaveProfile} className="w-full">
              {loadError && (
                <div
                  className="mb-4 rounded-xl border border-red-500/30 px-3 py-2 text-sm bg-red-500/10 text-red-400"
                  role="alert"
                >
                  {loadError}
                </div>
              )}
              <div className="rounded-xl border border-white/10 bg-slate-950/40 backdrop-blur-sm p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="shrink-0">
                    {avatarPreview && !avatarLoadFailed ? (
                      <ManagedImageFrame
                        src={avatarPreview}
                        alt="รูปโปรไฟล์"
                        sizes={MANAGED_IMAGE_SIZES.avatar2xl}
                        frameClassName="w-24 h-24 rounded-full border-2 border-white/20 bg-slate-800/50"
                        imageClassName="w-full h-full object-cover"
                        onError={() => setAvatarLoadFailed(true)}
                        imageOverlay={<div className="absolute inset-0 pointer-events-none bg-black/20" />}
                      />
                    ) : (
                      <div
                        className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white bg-slate-700"
                      >
                        {avatarFallbackText}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full min-w-0 space-y-2">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      aria-hidden="true"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (!file) return;
                        // ~2MB ตาม UI
                        if (file.size > 2 * 1024 * 1024) {
                          toastError("ไฟล์ใหญ่เกินไป", "กรุณาเลือกไฟล์ไม่เกิน ~2MB");
                          return;
                        }
                        setAvatarFile(file);
                        setAvatarObjectUrl((prev) => {
                          if (prev) URL.revokeObjectURL(prev);
                          return null;
                        });
                        const objUrl = URL.createObjectURL(file);
                        setAvatarObjectUrl(objUrl);
                        setAvatarPreview(objUrl);
                        setAvatarLoadFailed(false);
                      }}
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-xl border border-white/10 text-xs sm:text-sm font-medium bg-slate-800/50 text-slate-300 hover:bg-slate-700/60 hover:text-white transition-all active:scale-95 cursor-pointer shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                        aria-label="เปลี่ยนรูปโปรไฟล์"
                      >
                        <Camera size={16} /> เปลี่ยนรูป
                      </Button>
                      {avatarPreview && (
                        <div className="text-[11px] text-slate-500">
                          ตัวอย่างพร้อมอัปโหลด
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      รองรับ JPG/PNG
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate text-white">
                      {profile?.name ?? form.name ?? "-"}
                    </div>
                    <div className="text-xs truncate text-slate-400">
                      {profile?.email ?? form.email ?? "-"}
                    </div>
                  </div>
                  {profile?.role && (
                    <RoleBadge roleCode={profile.role} styleMap={roleStyleMap} />
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-slate-300">
                      ชื่อ-สกุล
                    </Label>
                    <Input
                      type="text"
                      className="form-input-glass"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="ชื่อจริง"
                    />
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-slate-300">
                      Username
                    </Label>
                    <Input
                      type="text"
                      className="form-input-glass opacity-70 cursor-not-allowed"
                      value={profile?.username ?? ""}
                      disabled
                    />
                    <p className="text-xs mt-1 text-slate-500">
                      ไม่สามารถแก้ไขได้
                    </p>
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-slate-300">
                      อีเมล
                    </Label>
                    <Input
                      type="email"
                      className="form-input-glass"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-slate-300">
                      เบอร์โทร
                    </Label>
                    <Input
                      type="text"
                      className="form-input-glass"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="08xxxxxxxx"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="mb-1.5 block text-sm font-medium text-slate-300">
                      ตำแหน่ง
                    </Label>
                    <Input
                      type="text"
                      className="form-input-glass"
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                      placeholder="ตำแหน่งงาน"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 disabled:active:scale-100 bg-blue-600 hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-900/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="w-full">
              <div className="rounded-xl border border-white/10 bg-slate-950/40 backdrop-blur-sm p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Lock size={18} className="text-slate-400 shrink-0" aria-hidden />
                  <h3 className="text-sm font-bold text-slate-200">เปลี่ยนรหัสผ่าน</h3>
                </div>

                <div className="space-y-4">
                  <section className="rounded-xl border border-white/10 p-4 bg-slate-900/40">
                    <Label className="mb-1.5 block text-sm font-medium text-slate-300">
                      รหัสผ่านปัจจุบัน
                    </Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        required
                        className="form-input-glass pr-11"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                        }
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        className={pwdToggleBtn}
                        aria-label={showCurrentPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                        aria-pressed={showCurrentPassword}
                        onClick={() => setShowCurrentPassword((v) => !v)}
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </Button>
                    </div>
                  </section>

                  <section className="rounded-xl border border-white/10 p-4 bg-slate-900/40">
                    <Label className="mb-1.5 block text-sm font-medium text-slate-300">
                      รหัสผ่านใหม่
                    </Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={6}
                        className="form-input-glass pr-11"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                        }
                        placeholder="อย่างน้อย 6 ตัวอักษร"
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        className={pwdToggleBtn}
                        aria-label={showNewPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                        aria-pressed={showNewPassword}
                        onClick={() => setShowNewPassword((v) => !v)}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </Button>
                    </div>
                    <p className="text-[11px] mt-1.5 text-slate-500">
                      ต้องมีความยาวอย่างน้อย 6 ตัวอักษร
                    </p>
                  </section>

                  <section className="rounded-xl border border-white/10 p-4 bg-slate-900/40">
                    <Label className="mb-1.5 block text-sm font-medium text-slate-300">
                      ยืนยันรหัสผ่านใหม่
                    </Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        className="form-input-glass pr-11"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                        }
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        className={pwdToggleBtn}
                        aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                        aria-pressed={showConfirmPassword}
                        onClick={() => setShowConfirmPassword((v) => !v)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </Button>
                    </div>
                  </section>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 disabled:active:scale-100 bg-blue-600 hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-900/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    {saving ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
