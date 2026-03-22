"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { User, Lock, Loader2, Eye, EyeOff, Camera } from "lucide-react";
import DashboardPageShell from "@/components/DashboardPageShell";
import SegmentedTabs from "@/components/SegmentedTabs";
import { toastSuccess, toastError } from "@/lib/toast";

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

function unwrapApiData<T>(root: unknown): T | null {
  if (!root) return null;
  if (
    typeof root === "object" &&
    root !== null &&
    "data" in (root as Record<string, unknown>)
  ) {
    return ((root as { data?: unknown }).data as T) ?? null;
  }
  return root as T;
}

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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";
  const token = (session as { accessToken?: string })?.accessToken;

  const fetchProfile = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    axios
      .get<Profile>(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const p = unwrapApiData<Profile>(res.data);
        if (!p) {
          const apiRoot = res.data as any;
          const inner = apiRoot?.data;
          // eslint-disable-next-line no-console
          console.error("[profile][fetchProfile] invalid payload", apiRoot);
          const notFoundMsg =
            inner === null
              ? "ไม่พบข้อมูลผู้ใช้ในระบบ (data=null) — กรุณาลองออก/เข้าใหม่"
              : "API ตอบกลับมาไม่ถูกต้อง";
          setProfile(null);
          setForm({ name: "", email: "", phone: "", position: "" });
          setAvatarPreview(null);
          setLoadError(notFoundMsg);
          return;
        }
        setProfile(p);
        setForm({
          name: p.name ?? "",
          email: p.email ?? "",
          phone: p.phone ?? "",
          position: p.position ?? "",
        });
        setAvatarPreview(p.image ?? null);
        setAvatarObjectUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setAvatarLoadFailed(false);
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          (err as { message?: string })?.message ??
          "โหลดโปรไฟล์ไม่สำเร็จ";
        setLoadError(`(${status ?? "?"}) ${msg}`);
        toastError("โหลดโปรไฟล์ไม่สำเร็จ", msg);
      })
      .finally(() => setLoading(false));
  }, [token, API]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
      // อัปโหลด avatar ถ้ามีไฟล์ใหม่
      let newImageUrl: string | undefined;
      if (avatarFile) {
        const fd = new FormData();
        fd.append("image", avatarFile);
        const res = await axios.patch(`${API}/users/me/avatar`, fd, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        const payload = unwrapApiData<{ image?: string }>(res.data);
        newImageUrl = payload?.image;
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
      fetchProfile();
      await updateSession({
        user: {
          ...session?.user,
          name: (form.name.trim() || session?.user?.name) ?? undefined,
          image: newImageUrl ?? (session?.user as { image?: string })?.image ?? undefined,
        },
      });
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

  return (
    <DashboardPageShell
      title="โปรไฟล์"
      subtitle="จัดการข้อมูลส่วนตัวและรหัสผ่าน"
      cardOverflow="visible"
    >
      <div className="flex flex-col h-full min-h-0">
        {/* Tab menu (shared segmented control) */}
        <SegmentedTabs
          tabs={tabs}
          activeId={tab}
          onChange={setTab}
          ariaLabel="แท็บโปรไฟล์"
        />

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} className="animate-spin text-slate-500" />
            </div>
          ) : tab === "profile" ? (
            <form onSubmit={handleSaveProfile} className="w-full">
              {loadError && (
                <div
                  className="mb-4 rounded-xl border border-red-500/30 px-3 py-2 text-sm bg-red-500/10 text-red-400"
                >
                  {loadError}
                </div>
              )}
              <div
                className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-4 sm:p-5"
              >
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="shrink-0">
                    {avatarPreview && !avatarLoadFailed ? (
                      <div
                        className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 bg-slate-800/50"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={avatarPreview}
                          alt="รูปโปรไฟล์"
                          className="w-full h-full object-cover"
                          onError={() => setAvatarLoadFailed(true)}
                        />
                        <div className="absolute inset-0 pointer-events-none bg-black/20" />
                      </div>
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
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-xs sm:text-sm font-medium bg-slate-800/50 text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors"
                        aria-label="เปลี่ยนรูปโปรไฟล์"
                      >
                        <Camera size={16} /> เปลี่ยนรูป
                      </button>
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
                    <span
                      className="badge bg-blue-500/15 text-blue-400 border border-blue-500/25"
                    >
                      {profile.role}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">
                      ชื่อ-สกุล
                    </label>
                    <input
                      type="text"
                      className="form-input rounded-xl border border-white/10 bg-slate-800/50 text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="ชื่อจริง"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">
                      Username
                    </label>
                    <input
                      type="text"
                      className="form-input rounded-xl border border-white/10 bg-slate-800/70 text-slate-500 cursor-not-allowed"
                      value={profile?.username ?? ""}
                      disabled
                    />
                    <p className="text-xs mt-1 text-slate-500">
                      ไม่สามารถแก้ไขได้
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">
                      อีเมล
                    </label>
                    <input
                      type="email"
                      className="form-input rounded-xl border border-white/10 bg-slate-800/50 text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">
                      เบอร์โทร
                    </label>
                    <input
                      type="text"
                      className="form-input rounded-xl border border-white/10 bg-slate-800/50 text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="08xxxxxxxx"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-slate-300">
                      ตำแหน่ง
                    </label>
                    <input
                      type="text"
                      className="form-input rounded-xl border border-white/10 bg-slate-800/50 text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                      placeholder="ตำแหน่งงาน"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                  >
                    {saving ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="w-full space-y-4">
              <div
                className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-4 sm:p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Lock size={16} className="text-slate-400" />
                  <h2 className="text-sm font-bold text-white">
                    เปลี่ยนรหัสผ่าน
                  </h2>
                </div>

                <div className="space-y-3">
                  {/* Panel: current password */}
                  <section className="rounded-xl border border-white/10 p-3 bg-slate-800/30">
                    <label className="block text-sm font-medium mb-1 text-slate-300">
                      รหัสผ่านปัจจุบัน
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        required
                        className="form-input pr-10 rounded-xl border border-white/10 bg-slate-800/50 text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                        }
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="btn-icon absolute right-2 top-1/2 -translate-y-1/2"
                        aria-label={showCurrentPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                        aria-pressed={showCurrentPassword}
                        onClick={() => setShowCurrentPassword((v) => !v)}
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </section>

                  {/* Panel: new password */}
                  <section className="rounded-xl border border-white/10 p-3 bg-slate-800/30">
                    <label className="block text-sm font-medium mb-1 text-slate-300">
                      รหัสผ่านใหม่
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={6}
                        className="form-input pr-10 rounded-xl border border-white/10 bg-slate-800/50 text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                        }
                        placeholder="อย่างน้อย 6 ตัวอักษร"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="btn-icon absolute right-2 top-1/2 -translate-y-1/2"
                        aria-label={showNewPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                        aria-pressed={showNewPassword}
                        onClick={() => setShowNewPassword((v) => !v)}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-[11px] mt-1 text-slate-500">
                      ต้องมีความยาวอย่างน้อย 6 ตัวอักษร
                    </p>
                  </section>

                  {/* Panel: confirm password */}
                  <section className="rounded-xl border border-white/10 p-3 bg-slate-800/30">
                    <label className="block text-sm font-medium mb-1 text-slate-300">
                      ยืนยันรหัสผ่านใหม่
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        className="form-input pr-10 rounded-xl border border-white/10 bg-slate-800/50 text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                        }
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="btn-icon absolute right-2 top-1/2 -translate-y-1/2"
                        aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                        aria-pressed={showConfirmPassword}
                        onClick={() => setShowConfirmPassword((v) => !v)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </section>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                  >
                    {saving ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardPageShell>
  );
}
