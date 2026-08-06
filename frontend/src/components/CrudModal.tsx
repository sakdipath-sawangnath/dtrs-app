"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CrudModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** ความกว้างกรอบ — `lg` สำหรับฟอร์มยาว (เช่น กำหนดสิทธิ์) */
  size?: "md" | "lg";
  /** กำลังบันทึก/ส่ง - ปิด modal ไม่ได้ และปุ่ม submit ถูก disable */
  saving?: boolean;
  /** ปุ่มยกเลิก (ถ้าไม่ส่ง จะมีปุ่มยกเลิก default) */
  cancelLabel?: string;
  /** ปุ่มบันทึก/ส่ง (ถ้าไม่ส่ง จะไม่มีปุ่ม submit ใน footer) */
  submitLabel?: string;
  onSubmit?: (e: React.FormEvent) => void;
}

/**
 * Modal รองรับ CRUD — ใช้ shadcn Dialog (portal + z-100) คง API เดิม
 */
export default function CrudModal({
  open,
  onClose,
  title,
  children,
  size = "md",
  saving = false,
  cancelLabel = "ยกเลิก",
  submitLabel,
  onSubmit,
}: CrudModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) onClose();
      }}
      modal
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-[var(--glass-overlay)] backdrop-blur-md supports-backdrop-filter:backdrop-blur-md"
        className={cn(
          "glass-card flex max-h-[min(90vh,calc(100vh-2rem))] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md",
          size === "lg" && "sm:max-w-lg",
        )}
      >
        <DialogHeader className="shrink-0 space-y-0 border-b border-[var(--glass-card-border)] p-4 sm:p-6">
          <DialogTitle
            id="crud-modal-title"
            className="glass-text text-lg font-bold tracking-tight"
          >
            {title}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.(e);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {children}
          </div>
          <div className="flex shrink-0 gap-3 border-t border-[var(--glass-card-border)] p-4 backdrop-blur-sm sm:p-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="min-h-11 flex-1 cursor-pointer rounded-xl border-[var(--glass-input-border)] bg-[var(--glass-input-bg)] py-2.5 text-sm font-medium glass-muted-text hover:bg-[var(--glass-hover)] hover:text-[var(--glass-text)] disabled:opacity-50"
            >
              {cancelLabel}
            </Button>
            {submitLabel != null && (
              <Button
                type="submit"
                variant="default"
                disabled={saving}
                className="min-h-11 flex-1 cursor-pointer rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : submitLabel}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
