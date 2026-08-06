import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const DEFAULT_TIMER_MS = 1800;

function isDarkTheme(): boolean {
  if (typeof document === "undefined") return true;
  const root = document.documentElement;
  if (root.classList.contains("dark")) return true;
  if (root.classList.contains("light")) return false;
  try {
    const stored = localStorage.getItem("dtrs-theme");
    if (stored === "light") return false;
    if (stored === "dark") return true;
  } catch {
    /* ignore */
  }
  return true;
}

function swalChrome(isDark: boolean) {
  return isDark
    ? {
        background: "rgba(15,23,42,0.95)",
        color: "#e2e8f0",
        popupBorder: "border-white/10",
        title: "text-white font-bold font-sans",
        html: "text-slate-300 font-sans text-sm",
        cancelButton:
          "rounded-xl px-6 py-2.5 ml-3 font-medium transition-all text-slate-300 bg-slate-800 hover:bg-slate-700 active:scale-95",
      }
    : {
        background: "rgba(255,255,255,0.98)",
        color: "#0f172a",
        popupBorder: "border-slate-200",
        title: "text-slate-900 font-bold font-sans",
        html: "text-slate-600 font-sans text-sm",
        cancelButton:
          "rounded-xl px-6 py-2.5 ml-3 font-medium transition-all text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95",
      };
}

function createMySwal() {
  const chrome = swalChrome(isDarkTheme());
  return Swal.mixin({
    customClass: {
      popup: `rounded-2xl shadow-2xl border ${chrome.popupBorder} p-5 backdrop-blur-xl`,
      title: chrome.title,
      htmlContainer: chrome.html,
      confirmButton:
        "rounded-xl px-6 py-2.5 font-medium shadow-lg transition-all text-white bg-blue-600 hover:bg-blue-500 active:scale-95",
      cancelButton: chrome.cancelButton,
    },
    background: chrome.background,
    color: chrome.color,
    buttonsStyling: false,
    showClass: { popup: "animate-fade-up" },
    hideClass: { popup: "swal2-hide" },
  });
}

function createToastMixin() {
  const isDark = isDarkTheme();
  const chrome = swalChrome(isDark);
  return Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timerProgressBar: true,
    background: isDark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.96)",
    color: chrome.color,
    customClass: {
      popup: `rounded-xl shadow-2xl border ${chrome.popupBorder} backdrop-blur-xl !py-3 !px-4`,
      title: `${isDark ? "text-white" : "text-slate-900"} font-semibold font-sans !text-sm`,
      timerProgressBar: "!bg-blue-500/40",
    },
    showClass: { popup: "animate-fade-up" },
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });
}

/**
 * แสดง success แบบ toast (มุมขวาบน, ปิดอัตโนมัติ)
 */
export function toastSuccess(
  title: string,
  timerMs: number = DEFAULT_TIMER_MS,
): void {
  createToastMixin().fire({
    icon: "success",
    title,
    timer: timerMs,
    iconColor: "#22c55e",
  });
}

/**
 * แสดง error (ต้องกดปิด)
 */
export function toastError(title: string, text?: string): void {
  createMySwal().fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: "#3b82f6",
    iconColor: "#ef4444",
  });
}

/**
 * แสดง warning (ต้องกดปิด)
 */
export function toastWarning(title: string, text?: string): void {
  createMySwal().fire({
    icon: "warning",
    title,
    text,
    confirmButtonColor: "#3b82f6",
    iconColor: "#f59e0b",
  });
}

/**
 * ยืนยันก่อนดำเนินการ (เช่น ลบ)
 */
export function confirmDialog(options: {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  cancelColor?: string;
  confirmColor?: string;
}): Promise<boolean> {
  const chrome = swalChrome(isDarkTheme());
  return createMySwal().fire({
    icon: "warning",
    title: options.title,
    text: options.text,
    showCancelButton: true,
    confirmButtonColor: options.confirmColor ?? "#dc2626",
    cancelButtonColor: options.cancelColor ?? "#475569",
    confirmButtonText: options.confirmText ?? "ยืนยัน",
    cancelButtonText: options.cancelText ?? "ยกเลิก",
    iconColor: "#f59e0b",
    customClass: {
      popup: `rounded-2xl shadow-2xl border ${chrome.popupBorder} p-5 backdrop-blur-xl`,
      title: chrome.title,
      htmlContainer: chrome.html,
      confirmButton: `rounded-xl px-6 py-2.5 font-medium shadow-lg transition-all text-white active:scale-95 ${
        options.confirmColor === "#dc2626"
          ? "bg-red-600 hover:bg-red-500 shadow-red-600/20"
          : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
      }`,
      cancelButton: chrome.cancelButton,
    },
  }).then((res) => res.isConfirmed === true);
}
