"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, LogOut, ChevronDown, LoaderCircle } from "lucide-react";
import { signOut } from "next-auth/react";
import { confirmDialog } from "@/lib/toast";
import { MANAGED_IMAGE_SIZES } from "@/components/ManagedImage";
import ManagedImageFrame from "@/components/ManagedImageFrame";

interface UserMenuDropdownProps {
  name?: string | null;
  image?: string | null;
  /** ปิด dropdown เมื่อกดนอก (เช่นเมื่อเปิด sidebar mobile) */
  onClose?: () => void;
}

export default function UserMenuDropdown({ name, image, onClose }: UserMenuDropdownProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [imgError, setImgError] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    setImgError(false);
  }, [image]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => !signingOut && setOpen((o) => !o)}
        disabled={signingOut}
        aria-busy={signingOut}
        className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:min-h-[44px] rounded-lg border border-white/15 min-w-0 transition-colors bg-slate-800/50 text-slate-300 hover:bg-slate-700/60 hover:text-white disabled:opacity-85 disabled:cursor-wait disabled:hover:bg-slate-800/50"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {signingOut ? (
          <>
            <span
              className="login-loading-spin inline-flex shrink-0 animate-spin text-blue-400"
              aria-hidden
            >
              <LoaderCircle className="h-4 w-4 origin-center" strokeWidth={2} aria-hidden />
            </span>
            <span className="text-xs sm:text-sm font-semibold truncate max-w-[140px] sm:max-w-[200px]">
              กำลังออกจากระบบ...
            </span>
          </>
        ) : (
          <>
            {image && !imgError ? (
              <ManagedImageFrame
                src={image}
                alt={name ?? "โปรไฟล์"}
                sizes={MANAGED_IMAGE_SIZES.avatarXs}
                frameClassName="w-7 h-7 rounded-full shrink-0"
                imageClassName="object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 bg-slate-600"
              >
                {name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <span className="text-xs sm:text-sm font-medium truncate max-w-[100px] sm:max-w-[120px] hidden sm:inline">
              {name ?? "เจ้าหน้าที่"}
            </span>
            <ChevronDown size={14} className={`shrink-0 transition-transform text-slate-500 ${open ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 py-1 rounded-xl border border-white/10 shadow-2xl bg-slate-900/95 backdrop-blur-xl z-50 min-w-[160px]"
        >
          <Link
            href="/dashboard/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <User size={16} className="text-slate-400" />
            โปรไฟล์
          </Link>
          <button
            type="button"
            disabled={signingOut}
            onClick={async () => {
              const ok = await confirmDialog({
                title: "ออกจากระบบ?",
                text: "คุณต้องการออกจากระบบหรือไม่",
                confirmText: "ยืนยันออกจากระบบ",
                cancelText: "ยกเลิก",
                confirmColor: "#dc2626",
                cancelColor: "#475569",
              });
              if (!ok) return;
              setOpen(false);
              onClose?.();
              setSigningOut(true);
              try {
                await signOut({ callbackUrl: "/login" });
              } catch {
                setSigningOut(false);
              }
            }}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left text-slate-400 transition-colors hover:bg-white/10 hover:text-red-400 disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
          >
            <LogOut size={16} className="text-slate-500 shrink-0" aria-hidden />
            ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  );
}
