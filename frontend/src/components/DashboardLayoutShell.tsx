"use client";

import { useState, useEffect, useTransition } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  AlertCircle,
  Wrench,
  CheckCircle,
  Clock,
  Settings,
  ChevronRight,
  Menu,
  X,
  UserCog,
  User,
  MapPin,
  FileEdit,
  Search,
  Shield,
  Loader2,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import UserMenuDropdown from "@/components/UserMenuDropdown";
import NotificationsBell from "@/components/NotificationsBell";
import DashboardRouteLoading from "@/components/DashboardRouteLoading";
import { unwrapApiData } from "@/lib/apiResponse";

/** เมนูตาม permission (RBAC dynamic) — ถ้าไม่มี permissions จาก API จะ fallback ใช้ roles */
const navigation = [
  { name: "แจ้งปัญหา", href: "/public/report", icon: FileEdit, permission: "menu.report", roles: ["USER"] },
  { name: "ตรวจสอบสถานะ", href: "/public/status", icon: Search, permission: "menu.status", roles: ["USER"] },
  { name: "โปรไฟล์", href: "/dashboard/profile", icon: User, permission: "menu.profile", roles: ["USER", "ADMIN", "STAFF", "SUPERVISOR"] },
  { name: "ภาพรวม", href: "/dashboard", icon: LayoutDashboard, permission: "menu.dashboard", roles: ["ADMIN", "STAFF", "SUPERVISOR"] },
  { name: "รอดำเนินการ", href: "/dashboard/pending", icon: AlertCircle, permission: "menu.pending", roles: ["ADMIN", "STAFF", "SUPERVISOR"] },
  { name: "งานที่รับผิดชอบ", href: "/dashboard/my-jobs", icon: User, permission: "menu.myJobs", roles: ["ADMIN", "STAFF", "SUPERVISOR"] },
  { name: "กำลังแก้ไข", href: "/dashboard/in-progress", icon: Wrench, permission: "menu.inProgress", roles: ["ADMIN", "STAFF", "SUPERVISOR"] },
  { name: "ประวัติทั้งหมด", href: "/dashboard/all", icon: CheckCircle, permission: "menu.all", roles: ["ADMIN", "STAFF", "SUPERVISOR"] },
  { name: "นอกสัญญา", href: "/dashboard/out-of-contract", icon: Clock, permission: "menu.outOfContract", roles: ["ADMIN", "STAFF", "SUPERVISOR"] },
  { name: "จัดการ Site", href: "/dashboard/sites", icon: MapPin, permission: "menu.sites", roles: ["ADMIN", "SUPERVISOR"] },
  { name: "จัดการผู้ใช้", href: "/dashboard/users", icon: UserCog, permission: "menu.users", roles: ["ADMIN"] },
  { name: "จัดการบทบาทและสิทธิ์", href: "/dashboard/roles", icon: Shield, permission: "menu.roles", roles: ["ADMIN"] },
  { name: "ตั้งค่าระบบ", href: "/dashboard/settings", icon: Settings, permission: "menu.settings", roles: ["ADMIN"] },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

/** หน้าปัจจุบันตรงกับลิงก์เมนูแล้ว — ไม่ต้องนำทางซ้ำ */
function isSameRouteAsNav(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function DashboardLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isNavPending, startNavTransition] = useTransition();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const userRole = (
    (session?.user as { role?: string })?.role ?? "USER"
  ).toUpperCase();
  const token = (session as { accessToken?: string })?.accessToken;
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4100/api";

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
        setPermissions(Array.isArray(list) ? list : null);
      })
      .catch(() => setPermissions(null));
  }, [token, status, API]);

  useEffect(() => {
    setNavigatingTo(null);
  }, [pathname]);

  const navigateFromSidebar = (href: string) => {
    setSidebarOpen(false);
    if (isSameRouteAsNav(href, pathname)) return;
    setNavigatingTo(href);
    startNavTransition(() => {
      router.push(href);
    });
  };

  const navFiltered = (() => {
    const byRole = () => navigation.filter((n) => n.roles.includes(userRole));
    if (Array.isArray(permissions) && permissions.length > 0) {
      const byPerm = navigation.filter(
        (n) => n.permission && permissions.includes(n.permission)
      );
      // ถ้า DB มีแค่สิทธิ์ที่ไม่มีเมนูใน sidebar (เช่น menu.profile อย่างเดียว) ให้ fallback ตาม role
      if (byPerm.length > 0) return byPerm;
    }
    return byRole();
  })();
  const currentPage = navFiltered.find((n) => isActive(n.href, pathname));

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    // กันกรณี permissions กำลังโหลด: ถ้าเพิ่งเข้า route `/dashboard/...`
    // แล้ว state permissions ยังเป็น `null` จะทำให้ fallback byRole ตัดเมนูออกและ redirect ทันที
    // รอให้ permissions โหลดเสร็จก่อน (โดยเฉพาะ route ที่อาศัย permission เช่น `/dashboard/profile`)
    if (pathname.startsWith("/dashboard") && permissions === null) return;
    const allowedPaths = navFiltered.flatMap((n) => (n.href === "/dashboard" ? [n.href] : [n.href, n.href + "/"]));
    const pathAllowed =
      pathname === "/public/report" ||
      pathname === "/public/status" ||
      pathname === "/report" ||
      pathname === "/status" ||
      allowedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (
      !pathAllowed &&
      (pathname.startsWith("/dashboard") ||
        pathname === "/report" ||
        pathname === "/status" ||
        pathname === "/public/report" ||
        pathname === "/public/status")
    ) {
      router.replace(allowedPaths[0] || "/public/report");
    }
  }, [status, session, pathname, router, navFiltered, permissions]);

  const headerRight = (
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--glass-input-border)] bg-[var(--glass-input-bg)] glass-nav-item transition-colors"
        aria-label="เปิดเมนู"
      >
        <Menu size={18} />
      </button>
      {status === "authenticated" && token && ["ADMIN", "STAFF", "SUPERVISOR"].includes(userRole) && (
        <NotificationsBell token={token} apiBase={API} />
      )}
      <UserMenuDropdown
        name={session?.user?.name ?? undefined}
        image={(session?.user as { image?: string })?.image}
      />
    </div>
  );

  const sidebarContent = (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navFiltered.map((item) => {
          const active = isActive(item.href, pathname);
          const rowLoading = navigatingTo === item.href && isNavPending;
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => navigateFromSidebar(item.href)}
              disabled={rowLoading}
              aria-current={active ? "page" : undefined}
              aria-busy={rowLoading}
              className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer disabled:opacity-80 disabled:cursor-wait ${
                active
                  ? "glass-nav-active font-semibold shadow-sm ring-1 ring-[var(--glass-input-focus-border)]"
                  : "glass-nav-item font-medium"
              }`}
            >
              <item.icon
                size={18}
                className={`shrink-0 transition-colors ${active ? "text-glass-accent" : "text-glass-subtle"}`}
              />
              <span className="flex-1 truncate">{item.name}</span>
              {rowLoading ? (
                <Loader2 size={16} className="shrink-0 text-glass-accent animate-spin" aria-hidden />
              ) : active ? (
                <ChevronRight size={14} className="text-glass-accent opacity-70 shrink-0" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden glass-page">
      <SiteHeader right={headerRight} subtitle={currentPage?.name} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 z-40 backdrop-blur-sm"
            style={{ backgroundColor: "var(--glass-overlay)" }}
            aria-label="ปิดเมนู"
          />
        )}

        <aside
          className={`
            w-64 xl:w-72 shrink-0 glass-sidebar-surface backdrop-blur-xl border-r shadow-2xl flex flex-col z-50
            fixed md:sticky left-0 top-[62px] md:top-0 transform transition-transform duration-300 ease-out
            h-[calc(100vh-62px)] md:h-full md:self-stretch
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <div className="flex items-center justify-between p-3 border-b border-[var(--glass-sidebar-border)] md:hidden glass-sidebar-surface">
            <span className="text-sm font-semibold glass-text">
              เมนู
            </span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg glass-nav-item transition-colors"
              aria-label="ปิด"
            >
              <X size={18} className="text-glass-subtle" />
            </button>
          </div>
          {sidebarContent}
        </aside>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 min-w-0 w-full relative min-h-0">
          <div
            className={isNavPending ? "opacity-45 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}
            aria-hidden={isNavPending}
          >
            {children}
          </div>
          {isNavPending && (
            <div
              className="absolute inset-0 z-20 flex items-start justify-center pt-10 sm:pt-14 px-4 backdrop-blur-sm"
              style={{ backgroundColor: "var(--glass-overlay)" }}
              aria-busy="true"
              aria-label="กำลังเปลี่ยนหน้า"
            >
              <DashboardRouteLoading variant="overlay" />
            </div>
          )}
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
