"use client";

interface CrudModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** กำลังบันทึก/ส่ง - ปิด modal ไม่ได้ และปุ่ม submit ถูก disable */
  saving?: boolean;
  /** ปุ่มยกเลิก (ถ้าไม่ส่ง จะมีปุ่มยกเลิก default) */
  cancelLabel?: string;
  /** ปุ่มบันทึก/ส่ง (ถ้าไม่ส่ง จะไม่มีปุ่ม submit ใน footer) */
  submitLabel?: string;
  onSubmit?: (e: React.FormEvent) => void;
}

/**
 * Modal รองรับ CRUD - ใช้ได้ทุกหน้าที่มีฟอร์มใน popup (สร้าง/แก้ไข)
 */
export default function CrudModal({
  open,
  onClose,
  title,
  children,
  saving = false,
  cancelLabel = "ยกเลิก",
  submitLabel,
  onSubmit,
}: CrudModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => !saving && onClose()}
    >
      <div
        className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-4 sm:p-6 border-b border-white/10 shrink-0">
          <h3 className="text-lg font-bold tracking-tight text-white">{title}</h3>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.(e);
          }}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">{children}</div>
          <div className="flex gap-3 p-4 sm:p-6 border-t border-white/10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 min-h-11 py-2.5 rounded-xl border border-white/10 bg-slate-800/50 backdrop-blur-sm text-sm font-medium text-slate-300 hover:bg-slate-700/55 hover:border-white/15 disabled:opacity-50 transition-all active:scale-95"
            >
              {cancelLabel}
            </button>
            {submitLabel != null && (
              <button
                type="submit"
                disabled={saving}
                className="flex-1 min-h-11 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/25 active:scale-95"
              >
                {saving ? "กำลังบันทึก..." : submitLabel}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
