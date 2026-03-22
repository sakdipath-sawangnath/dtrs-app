import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const DEFAULT_TIMER_MS = 1800;

/* ─── Dark Glassmorphism base mixin (modal dialogs) ─── */
const MySwal = Swal.mixin({
  customClass: {
    popup:
      "rounded-2xl shadow-2xl border border-white/10 p-5 backdrop-blur-xl",
    title: "text-white font-bold font-sans",
    htmlContainer: "text-slate-300 font-sans text-sm",
    confirmButton:
      "rounded-xl px-6 py-2.5 font-medium shadow-lg transition-all text-white bg-blue-600 hover:bg-blue-500 active:scale-95",
    cancelButton:
      "rounded-xl px-6 py-2.5 ml-3 font-medium transition-all text-slate-300 bg-slate-800 hover:bg-slate-700 active:scale-95",
  },
  background: "rgba(15,23,42,0.95)",   // slate-900/95
  color: "#e2e8f0",                     // slate-200
  buttonsStyling: false,
  showClass: {
    popup: "animate-fade-up",
  },
  hideClass: {
    popup: "swal2-hide",
  },
});

/* ─── Toast mixin (top-end, auto-dismiss, non-blocking) ─── */
const ToastMixin = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timerProgressBar: true,
  background: "rgba(15,23,42,0.92)",
  color: "#e2e8f0",
  customClass: {
    popup:
      "rounded-xl shadow-2xl border border-white/10 backdrop-blur-xl !py-3 !px-4",
    title: "text-white font-semibold font-sans !text-sm",
    timerProgressBar: "!bg-blue-500/40",
  },
  showClass: {
    popup: "animate-fade-up",
  },
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

/**
 * แสดง success แบบ toast (มุมขวาบน, ปิดอัตโนมัติ)
 * @param title ข้อความหลัก
 * @param timerMs มิลลิวินาที (ค่าเริ่มต้น 1.8 วินาที)
 */
export function toastSuccess(
  title: string,
  timerMs: number = DEFAULT_TIMER_MS,
): void {
  ToastMixin.fire({
    icon: "success",
    title,
    timer: timerMs,
    iconColor: "#22c55e", // green-500
  });
}

/**
 * แสดง error (ต้องกดปิด)
 */
export function toastError(title: string, text?: string): void {
  MySwal.fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: "#3b82f6", // blue-500
    iconColor: "#ef4444",          // red-500
  });
}

/**
 * แสดง warning (ต้องกดปิด)
 */
export function toastWarning(title: string, text?: string): void {
  MySwal.fire({
    icon: "warning",
    title,
    text,
    confirmButtonColor: "#3b82f6",
    iconColor: "#f59e0b",          // amber-500
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
  return MySwal.fire({
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
      popup: "rounded-2xl shadow-2xl border border-white/10 p-5 backdrop-blur-xl",
      title: "text-white font-bold font-sans",
      htmlContainer: "text-slate-300 font-sans text-sm",
      confirmButton: `rounded-xl px-6 py-2.5 font-medium shadow-lg transition-all text-white active:scale-95 ${
        options.confirmColor === "#dc2626" 
          ? "bg-red-600 hover:bg-red-500 shadow-red-600/20" 
          : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
      }`,
      cancelButton: "rounded-xl px-6 py-2.5 ml-3 font-medium transition-all text-slate-300 bg-slate-800 hover:bg-slate-700 active:scale-95",
    },
  }).then((res) => res.isConfirmed === true);
}
