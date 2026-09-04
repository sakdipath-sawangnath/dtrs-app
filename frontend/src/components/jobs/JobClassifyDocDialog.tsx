"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  FileCheck2,
  FolderOutput,
  Loader2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MODAL_GHOST_BUTTON_CLASS } from "@/components/ui/modalGhostButtonStyles";
import { cn } from "@/lib/utils";

type ClassifyKind = "in" | "ooc";

interface JobClassifyDocDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketNo?: string;
  submitting: boolean;
  canClassifyContract: boolean;
  canClassifyOutOfContract: boolean;
  onConfirm: (isOutOfContract: boolean) => void;
}

const CHOICES: {
  kind: ClassifyKind;
  title: string;
  description: string;
  icon: typeof FileCheck2;
}[] = [
  {
    kind: "in",
    title: "ในสัญญา",
    description: "เลข CM-SHF-YYYY-… งานยังอยู่ในประวัติทั้งหมด",
    icon: FileCheck2,
  },
  {
    kind: "ooc",
    title: "นอกสัญญา",
    description: "เลข YYYYMM… ย้ายไปเมนูนอกสัญญา ไม่โชว์ในประวัติทั้งหมด",
    icon: FolderOutput,
  },
];

export default function JobClassifyDocDialog({
  open,
  onOpenChange,
  ticketNo,
  submitting,
  canClassifyContract,
  canClassifyOutOfContract,
  onConfirm,
}: JobClassifyDocDialogProps) {
  const [selected, setSelected] = useState<ClassifyKind | null>(null);
  const visibleChoices = CHOICES.filter((choice) =>
    choice.kind === "in" ? canClassifyContract : canClassifyOutOfContract,
  );
  const hasVisibleChoice = visibleChoices.length > 0;

  useEffect(() => {
    if (open) setSelected(null);
  }, [open, ticketNo]);

  const confirmLabel =
    selected === "ooc"
      ? "ออกเลขและย้ายไปนอกสัญญา"
      : selected === "in"
        ? "ออกเลขในสัญญา"
        : "ออกเลขเอกสาร";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && submitting) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-[var(--glass-overlay)] backdrop-blur-md"
        className="glass-card max-h-[min(90vh,720px)] max-w-[calc(100%-2rem)] gap-0 overflow-visible p-0 sm:max-w-lg"
        aria-busy={submitting}
      >
        <DialogHeader className="flex shrink-0 flex-row items-start justify-between gap-3 border-b border-[var(--glass-card-border)] p-4 sm:p-5">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <DialogTitle
              id="classify-doc-title"
              className="font-bold text-base glass-text"
            >
              จำแนกประเภทเอกสาร
            </DialogTitle>
            {ticketNo ? (
              <Badge
                variant="outline"
                className="w-fit max-w-full font-mono text-xs glass-muted-text"
              >
                เลขชั่วคราว {ticketNo}
              </Badge>
            ) : null}
            <DialogDescription className="sr-only">
              เลือกในสัญญาหรือนอกสัญญา แล้วกดยืนยันเพื่อออกเลข Running Doc No
              ครั้งเดียว เลขชั่วคราวจะถูกแทนที่
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={`min-h-11 min-w-11 shrink-0 ${MODAL_GHOST_BUTTON_CLASS}`}
            aria-label="ปิด"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            <X size={20} aria-hidden />
          </Button>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <Alert
            className="border-amber-300 bg-amber-50 text-amber-950 [&>svg]:text-amber-700 dark:border-amber-500/35 dark:bg-amber-950/30 dark:text-amber-100 dark:[&>svg]:text-amber-400"
          >
            <AlertTriangle aria-hidden />
            <AlertTitle className="text-sm font-semibold text-amber-950 dark:text-amber-100">
              ออกเลขได้ครั้งเดียว
            </AlertTitle>
            <AlertDescription className="text-sm leading-relaxed text-amber-900 dark:text-amber-100/90">
              เลขชั่วคราวจะถูกแทนที่ด้วย Running Doc No
              และใช้ค้นสถานะสาธารณะต่อไม่ได้
            </AlertDescription>
          </Alert>

          {hasVisibleChoice ? (
            <div
              role="radiogroup"
              aria-labelledby="classify-doc-title"
              className={cn(
                "grid grid-cols-1 gap-3",
                visibleChoices.length > 1 && "sm:grid-cols-2",
              )}
            >
              {visibleChoices.map((choice) => {
              const Icon = choice.icon;
              const isOn = selected === choice.kind;
              return (
                <button
                  key={choice.kind}
                  type="button"
                  role="radio"
                  aria-checked={isOn}
                  disabled={submitting}
                  onClick={() => setSelected(choice.kind)}
                  className={cn(
                    "flex min-h-11 cursor-pointer flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    isOn
                      ? choice.kind === "ooc"
                        ? "border-amber-500 bg-amber-50 text-slate-900 shadow-md dark:border-amber-400/60 dark:bg-amber-950/40 dark:text-slate-100"
                        : "border-blue-600 bg-blue-50 text-slate-900 shadow-md dark:border-blue-400/70 dark:bg-blue-950/40 dark:text-slate-100"
                      : "border-[var(--glass-card-border)] bg-[var(--glass-input-bg)] glass-text hover:bg-[var(--glass-hover)]",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icon aria-hidden />
                    {choice.title}
                  </span>
                  <span
                    className={cn(
                      "text-xs leading-relaxed",
                      isOn
                        ? "text-slate-700 dark:text-slate-200"
                        : "glass-muted-text",
                    )}
                  >
                    {choice.description}
                  </span>
                </button>
              );
              })}
            </div>
          ) : (
            <Alert
              className="border-amber-300 bg-amber-50 text-amber-950 [&>svg]:text-amber-700 dark:border-amber-500/35 dark:bg-amber-950/30 dark:text-amber-100 dark:[&>svg]:text-amber-400"
            >
              <AlertTriangle aria-hidden />
              <AlertTitle className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                ไม่มีสิทธิ์เลือกประเภทเอกสาร
              </AlertTitle>
              <AlertDescription className="text-sm leading-relaxed text-amber-900 dark:text-amber-100/90">
                คุณไม่มีสิทธิ์จำแนกประเภทเอกสาร กรุณาติดต่อผู้ดูแลระบบ /
                ผู้ที่เกี่ยวข้อง
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 border-t border-[var(--glass-card-border)] p-4 sm:flex-row sm:justify-end sm:gap-3 sm:p-5">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 flex-1 cursor-pointer rounded-xl border-[var(--glass-input-border)] bg-[var(--glass-input-bg)] glass-muted-text hover:bg-[var(--glass-hover)] hover:text-[var(--glass-text)] sm:flex-initial"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            variant="default"
            className="min-h-11 flex-1 cursor-pointer rounded-xl bg-blue-600 text-white shadow-lg hover:bg-blue-500 active:scale-95 sm:flex-initial"
            disabled={selected == null || submitting || !hasVisibleChoice}
            onClick={() => {
              if (selected == null) return;
              onConfirm(selected === "ooc");
            }}
          >
            {submitting ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : null}
            {submitting ? "กำลังออกเลข…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
