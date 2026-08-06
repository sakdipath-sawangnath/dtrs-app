"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { FileWarning, Search, LayoutDashboard } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ManagedImage, { MANAGED_IMAGE_SIZES } from "@/components/ManagedImage";
import ManagedImageFrame from "@/components/ManagedImageFrame";
import ThemeToggle from "@/components/ThemeToggle";

/** ความสูงรวมของ header (stripe + แถบหลัก) ใช้สำหรับ spacer */
export const SITE_HEADER_HEIGHT = 62; // px

const STEP_MENU_BASE = [
  { label: "แจ้งปัญหา", href: "/public/report", icon: FileWarning },
  { label: "ตรวจสอบสถานะ", href: "/public/status", icon: Search },
] as const;

const MENU_OVERVIEW = { label: "ภาพรวม", href: "/dashboard", icon: LayoutDashboard } as const;

interface SiteHeaderProps {
  /** เนื้อหาด้านขวา (ถ้าไม่ส่ง = ตามสถานะ login หรือลิงก์ เจ้าหน้าที่) */
  right?: React.ReactNode;
  /** ข้อความใต้ชื่อระบบ */
  subtitle?: string;
  /** คงไว้เพื่อ API เดิม — สไตล์ใช้ CSS tokens ไม่พึ่ง isDark (กัน hydration mismatch) */
  isDark?: boolean;
}

export default function SiteHeader({ right, subtitle }: SiteHeaderProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;

  const avatarImage = useMemo(
    () => (session?.user as { image?: string })?.image as string | undefined,
    [session?.user],
  );
  const [avatarImgError, setAvatarImgError] = useState(false);

  useEffect(() => {
    setAvatarImgError(false);
  }, [avatarImage]);

  const stepMenu = isLoggedIn
    ? [MENU_OVERVIEW, STEP_MENU_BASE[0], STEP_MENU_BASE[1]]
    : [...STEP_MENU_BASE];

  const getInitials = () => {
    const name = session?.user?.name || "";
    const email = (session?.user as { email?: string })?.email || "";
    if (name.trim()) {
      const parts = name.trim().split(/\s+/);
      const first = parts[0]?.[0] ?? "";
      const last = parts[1]?.[0] ?? "";
      const initials = (first + last || first).toUpperCase();
      if (initials) return initials;
    }
    if (email) {
      const local = email.split("@")[0] || "";
      return (local.slice(0, 2) || "U").toUpperCase();
    }
    return "U";
  };

  const rightContent =
    right != null
      ? right
      : isLoggedIn
        ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg border transition-colors min-w-0 border-[var(--glass-input-border)] bg-[var(--glass-input-bg)] glass-muted-text hover:bg-[var(--glass-hover)]"
            >
              {session?.user && avatarImage && !avatarImgError ? (
                <ManagedImageFrame
                  src={avatarImage}
                  alt={session.user.name || "โปรไฟล์"}
                  sizes={MANAGED_IMAGE_SIZES.avatarXs}
                  frameClassName="w-7 h-7 rounded-full border shrink-0 border-[var(--glass-card-border)]"
                  imageClassName="object-cover"
                  onError={() => setAvatarImgError(true)}
                />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 bg-slate-600">
                  {getInitials()}
                </div>
              )}
              <span className="text-xs sm:text-sm font-medium truncate max-w-[100px] sm:max-w-[140px]">
                {session?.user?.name ?? "เจ้าหน้าที่"}
              </span>
            </Link>
          )
        : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-[var(--glass-input-border)] bg-[var(--glass-input-bg)] glass-muted-text hover:bg-[var(--glass-hover)] hover:text-[var(--glass-text)]"
            >
              เจ้าหน้าที่
            </Link>
          );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md shadow-sm border-b glass-header-surface border-[var(--glass-header-border)]">
        <div className="h-1" style={{ background: "linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa)" }} />

        <div className="flex items-center justify-between px-4 sm:px-6 h-14 gap-4 min-w-0">
          <Link href="/" className="flex items-center gap-3 group shrink-0 min-w-0">
            <div className="p-1.5">
              <ManagedImage
                src="/logo/NBTC.png"
                alt="DOPA"
                width={28}
                height={28}
                sizes={MANAGED_IMAGE_SIZES.avatarXs}
                className="shrink-0"
                style={{ objectFit: "contain" }}
              />
            </div>
            <div className="leading-tight min-w-0 hidden sm:block">
              <p className="text-sm font-bold tracking-tight truncate glass-text">ระบบแจ้งซ่อม</p>
              <p className="text-[11px] font-medium truncate glass-muted-text">
                {subtitle || "กรมการปกครอง"}
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2 flex-1 justify-center min-w-0" aria-label="เมนูหลัก">
            {stepMenu.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/public/report" &&
                  item.href !== "/public/status" &&
                  pathname.startsWith(item.href)) ||
                (item.href === "/public/status" && pathname.startsWith("/public/status")) ||
                (item.href === "/public/report" && pathname.startsWith("/public/report"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 shrink-0 ${
                    isActive ? "glass-nav-active" : "glass-nav-item"
                  }`}
                >
                  <item.icon
                    size={16}
                    className={isActive ? "text-glass-accent" : "text-glass-subtle"}
                  />
                  <span className="hidden sm:inline-block">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            {rightContent}
          </div>
        </div>
      </header>
      <div style={{ height: SITE_HEADER_HEIGHT }} aria-hidden />
    </>
  );
}
