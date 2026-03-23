"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FileWarning, Search, LayoutDashboard } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

/** ความสูงรวมของ header (stripe + แถบหลัก) ใช้สำหรับ spacer */
export const SITE_HEADER_HEIGHT = 62; // px

const STEP_MENU_BASE = [
  { label: 'แจ้งปัญหา', href: '/public/report', icon: FileWarning },
  { label: 'ตรวจสอบสถานะ', href: '/public/status', icon: Search },
] as const;

const MENU_OVERVIEW = { label: 'ภาพรวม', href: '/dashboard', icon: LayoutDashboard } as const;

interface SiteHeaderProps {
  /** เนื้อหาด้านขวา (ถ้าไม่ส่ง = ตามสถานะ login หรือลิงก์ เจ้าหน้าที่) */
  right?: React.ReactNode;
  /** ข้อความใต้ชื่อระบบ */
  subtitle?: string;
  isDark?: boolean;
}

export default function SiteHeader({ right, subtitle, isDark = false }: SiteHeaderProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated' && !!session?.user;

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
              className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg border transition-colors min-w-0 ${
                isDark 
                  ? 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800' 
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {session?.user && avatarImage && !avatarImgError ? (
                <img
                  src={avatarImage}
                  alt={session.user.name || "โปรไฟล์"}
                  className={`w-7 h-7 rounded-full object-cover border shrink-0 ${isDark ? 'border-slate-600' : 'border-slate-200'}`}
                  onError={() => setAvatarImgError(true)}
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 bg-slate-600"
                >
                  {getInitials()}
                </div>
              )}
              <span className="text-xs sm:text-sm font-medium truncate max-w-[100px] sm:max-w-[140px]">
                {session?.user?.name ?? 'เจ้าหน้าที่'}
              </span>
            </Link>
          )
        : (
            <Link
              href="/login"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                isDark 
                  ? 'border-slate-700 text-slate-300 bg-slate-800/50 hover:bg-slate-800 hover:text-white' 
                  : 'border-slate-300 text-slate-600 bg-white hover:bg-slate-50'
              }`}
            >
              เจ้าหน้าที่
            </Link>
          );

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md shadow-sm border-b ${
          isDark ? 'bg-[#0a1128]/80 border-slate-800' : 'bg-white/80 border-slate-200'
        }`}
      >
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa)' }} />

        <div className="flex items-center justify-between px-4 sm:px-6 h-14 gap-4 min-w-0">
          {/* Logo + ชื่อระบบ */}
          <Link href="/" className="flex items-center gap-3 group shrink-0 min-w-0">
            <div className="p-1.5">
              <img
                src="/logo/dopa-logo.png"
                alt="DOPA"
                width={28}
                height={28}
                style={{ objectFit: 'contain' }}
                className="shrink-0"
              />
            </div>
            <div className="leading-tight min-w-0 hidden sm:block">
              <p className={`text-sm font-bold tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>ระบบแจ้งซ่อม CCTV</p>
              <p className={`text-[11px] font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {subtitle || 'กรมการปกครอง'}
              </p>
            </div>
          </Link>

          {/* เมนูกลาง: ภาพรวม / แจ้งปัญหา / ตรวจสอบสถานะ (ภาพรวมเมื่อ login) */}
          <nav className="flex items-center gap-1 sm:gap-2 flex-1 justify-center min-w-0" aria-label="เมนูหลัก">
            {stepMenu.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/public/report' && item.href !== '/public/status' && pathname.startsWith(item.href)) ||
                (item.href === '/public/status' && pathname.startsWith('/public/status')) ||
                (item.href === '/public/report' && pathname.startsWith('/public/report'));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 shrink-0 ${
                    isActive
                      ? (isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-700")
                      : (isDark ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50")
                  }`}
                >
                  <item.icon size={16} className={isActive ? (isDark ? "text-blue-400" : "text-blue-600") : (isDark ? "text-slate-500" : "text-slate-400")} />
                  <span className="hidden sm:inline-block">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* ด้านขวา: ข้อมูลผู้ใช้ (เมื่อ login) หรือ เจ้าหน้าที่ */}
          <div className="flex items-center gap-3 shrink-0">
            {rightContent}
          </div>
        </div>
      </header>
      <div style={{ height: SITE_HEADER_HEIGHT }} aria-hidden />
    </>
  );
}
