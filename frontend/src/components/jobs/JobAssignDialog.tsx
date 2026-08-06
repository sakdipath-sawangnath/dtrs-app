"use client";

import { UserPlus, X } from "lucide-react";
import Select from "react-select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MODAL_GHOST_BUTTON_CLASS } from "@/components/ui/modalGhostButtonStyles";
import { reactSelectGlassStyles } from "@/lib/reactSelectGlassStyles";
import { GLASS_LABEL } from "./jobDetailStyles";

export type AssignOption = { value: number; label: string };

interface JobAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketNo?: string;
  assignLoading: boolean;
  assignOptions: AssignOption[];
  assignSelectedId: number | null;
  onSelectStaff: (id: number | null) => void;
  assignActionSaving: boolean;
  onSubmit: () => void;
}

export default function JobAssignDialog({
  open,
  onOpenChange,
  ticketNo,
  assignLoading,
  assignOptions,
  assignSelectedId,
  onSelectStaff,
  assignActionSaving,
  onSubmit,
}: JobAssignDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-[var(--glass-overlay)] backdrop-blur-md"
        className="glass-card max-h-[min(90vh,720px)] max-w-[calc(100%-2rem)] gap-0 overflow-visible p-0 sm:max-w-md"
      >
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-3 border-b border-[var(--glass-card-border)] p-4 sm:p-5">
          <DialogTitle
            id="assign-modal-title"
            className="font-bold text-base glass-text"
          >
            มอบหมายงาน {ticketNo ? `· ${ticketNo}` : ""}
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={`min-h-11 min-w-11 shrink-0 ${MODAL_GHOST_BUTTON_CLASS}`}
            aria-label="ปิด"
            onClick={() => onOpenChange(false)}
          >
            <X size={20} aria-hidden />
          </Button>
        </DialogHeader>

        <div className="space-y-4 p-4 sm:p-5">
          {assignLoading ? (
            <p className="text-sm glass-muted-text">กำลังโหลดรายชื่อเจ้าหน้าที่...</p>
          ) : (
            <>
              <p className={`${GLASS_LABEL} mb-0`}>เลือกเจ้าหน้าที่ที่ต้องการมอบหมายงานนี้ให้</p>

              <Select
                instanceId="assign-staff-select-detail"
                styles={reactSelectGlassStyles}
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                menuPosition="fixed"
                options={assignOptions}
                placeholder="ค้นหาและเลือกเจ้าหน้าที่..."
                value={
                  assignSelectedId != null
                    ? assignOptions.find((o) => o.value === assignSelectedId) ?? null
                    : null
                }
                onChange={(opt: AssignOption | null) =>
                  onSelectStaff(opt ? Number(opt.value) : null)
                }
                isClearable
                isSearchable
                isDisabled={assignActionSaving}
                noOptionsMessage={() => "ไม่พบเจ้าหน้าที่"}
              />
            </>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 border-t border-[var(--glass-card-border)] p-4 sm:flex-row sm:justify-end sm:gap-3 sm:p-5">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 flex-1 cursor-pointer rounded-xl border-[var(--glass-input-border)] bg-[var(--glass-input-bg)] glass-muted-text hover:bg-[var(--glass-hover)] hover:text-[var(--glass-text)] sm:flex-initial"
            disabled={assignActionSaving}
            onClick={() => onOpenChange(false)}
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            variant="default"
            className="min-h-11 flex-1 cursor-pointer rounded-xl bg-blue-600 text-white shadow-lg hover:bg-blue-500 sm:flex-initial"
            disabled={assignSelectedId == null || assignActionSaving}
            onClick={onSubmit}
          >
            <UserPlus size={14} className="inline mr-1.5" aria-hidden /> มอบหมายให้เจ้าหน้าที่
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
