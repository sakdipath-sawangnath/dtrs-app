"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Circle,
  Copy,
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
import { Button } from "@/components/ui/button";
import { MODAL_GHOST_BUTTON_CLASS } from "@/components/ui/modalGhostButtonStyles";
import { cn } from "@/lib/utils";

export type ClassifyKind = "in" | "ooc";

export interface JobClassifyDocDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketNo?: string;
  submitting: boolean;
  canClassifyContract: boolean;
  canClassifyOutOfContract: boolean;
  onConfirm: (isOutOfContract: boolean) => Promise<boolean | void> | void;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export const CLASSIFY_CHOICES: {
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
    description: "เลข OOC-YYYY-… ย้ายไปเมนูนอกสัญญา ไม่โชว์ในประวัติทั้งหมด",
    icon: FolderOutput,
  },
];

/** คำนวณข้อความพรีวิวรูปแบบเลขที่จะออก */
export function classifyDocPreview(kind: ClassifyKind, year = new Date().getFullYear()): string {
  return kind === "in"
    ? `จะได้เลขรูปแบบ CM-SHF-${year}-XXXX`
    : `จะได้เลขรูปแบบ OOC-${year}-XXXX`;
}

/** คำนวณข้อความปุ่มกดยืนยันตามประเภทที่เลือก เพื่อความชัดเจนต่อการดำเนินการที่ไม่สามารถย้อนกลับได้ */
export function classifyDocConfirmLabel(kind: ClassifyKind | null): string {
  if (kind === "in") return "ออกเลขเอกสาร (ในสัญญา)";
  if (kind === "ooc") return "ออกเลขเอกสาร (นอกสัญญา)";
  return "ออกเลขเอกสาร";
}

/** คำนวณ index ถัดไปสำหรับการเลื่อน radio ด้วยคีย์บอร์ด */
export function classifyNextRadioIndex(
  currentIndex: number,
  total: number,
  key: string,
): number {
  if (total <= 0) return 0;
  if (key === "ArrowDown" || key === "ArrowRight") {
    return (currentIndex + 1) % total;
  }
  if (key === "ArrowUp" || key === "ArrowLeft") {
    return (currentIndex - 1 + total) % total;
  }
  if (key === "Home") return 0;
  if (key === "End") return total - 1;
  return currentIndex;
}

export default function JobClassifyDocDialog({
  open,
  onOpenChange,
  ticketNo,
  submitting,
  canClassifyContract,
  canClassifyOutOfContract,
  onConfirm,
  errorMessage,
  onClearError,
}: JobClassifyDocDialogProps) {
  const [selected, setSelected] = useState<ClassifyKind | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const currentYear = new Date().getFullYear();

  const visibleChoices = CLASSIFY_CHOICES.filter((choice) =>
    choice.kind === "in" ? canClassifyContract : canClassifyOutOfContract,
  );
  const hasVisibleChoice = visibleChoices.length > 0;

  useEffect(() => {
    if (open) {
      setSelected(null);
      setLocalError(null);
      setCopied(false);
    }
  }, [open, ticketNo]);

  const activeError = errorMessage ?? localError;

  const handleCopyTicketNo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ticketNo || copied) return;
    try {
      await navigator.clipboard.writeText(ticketNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore clipboard rejection */
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (submitting || !hasVisibleChoice) return;

    if (
      e.key === "ArrowDown" ||
      e.key === "ArrowRight" ||
      e.key === "ArrowUp" ||
      e.key === "ArrowLeft" ||
      e.key === "Home" ||
      e.key === "End"
    ) {
      e.preventDefault();
      const nextIdx = classifyNextRadioIndex(index, visibleChoices.length, e.key);
      const nextChoice = visibleChoices[nextIdx];
      setSelected(nextChoice.kind);
      setLocalError(null);
      onClearError?.();
      cardRefs.current[nextIdx]?.focus();
      return;
    }

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setSelected(visibleChoices[index].kind);
      setLocalError(null);
      onClearError?.();
    }
  };

  const handleSubmit = async () => {
    if (selected == null || submitting || !hasVisibleChoice) return;
    setLocalError(null);
    onClearError?.();
    try {
      const res = onConfirm(selected === "ooc");
      if (res && typeof (res as Promise<unknown>).then === "function") {
        await res;
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string }; message?: string } } })
          ?.response?.data?.error?.message ??
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : null) ??
        "ไม่สามารถออกเลขเอกสารได้ กรุณาลองใหม่อีกครั้ง";
      setLocalError(msg);
    }
  };

  const confirmLabel = classifyDocConfirmLabel(selected);
  const isActionDisabled = selected == null || submitting || !hasVisibleChoice;

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
        className="glass-card flex flex-col max-h-[min(90vh,720px)] max-w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-lg"
        aria-busy={submitting}
      >
        {/* Header (shrink-0) */}
        <DialogHeader className="flex shrink-0 flex-row items-start justify-between gap-3 border-b border-[var(--glass-card-border)] p-4 sm:p-5">
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <DialogTitle
              id="classify-doc-title"
              className="font-bold text-base glass-text"
            >
              จำแนกประเภทเอกสาร
            </DialogTitle>

            <div className="flex flex-wrap items-center gap-2">
              {ticketNo ? (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--glass-card-border)] bg-[var(--glass-input-bg)] px-2.5 py-1 text-xs font-mono glass-text shadow-xs">
                  <span
                    className="max-w-[170px] sm:max-w-[210px] truncate"
                    title={`เลขรับแจ้ง ${ticketNo}`}
                  >
                    เลขรับแจ้ง {ticketNo}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTicketNo}
                    className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-[var(--glass-hover)] transition-colors cursor-pointer text-slate-400 hover:text-slate-200"
                    title={copied ? "คัดลอกแล้ว" : "คัดลอก"}
                    aria-label={
                      copied ? "คัดลอกแล้ว" : `คัดลอกเลขรับแจ้ง ${ticketNo}`
                    }
                  >
                    {copied ? (
                      <Check
                        size={13}
                        className="text-emerald-500"
                        aria-hidden
                      />
                    ) : (
                      <Copy size={13} aria-hidden />
                    )}
                  </button>
                  <span className="sr-only" aria-live="polite">
                    {copied ? "คัดลอกเลขรับแจ้งแล้ว" : ""}
                  </span>
                </div>
              ) : null}

              <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 border border-amber-500/25">
                ใช้ค้นสถานะสาธารณะต่อไม่ได้หลังออกเลข
              </span>
            </div>

            <DialogDescription className="sr-only">
              เลือกจำแนกประเภทเอกสารเป็นในสัญญาหรือนอกสัญญาเพื่อออกหมายเลขเอกสารถาวร
              การดำเนินการนี้ทำได้เพียงครั้งเดียวและไม่สามารถย้อนกลับได้
            </DialogDescription>
          </div>

          <Button
            type="button"
            variant="ghost"
            className={cn(
              "h-11 w-11 min-h-11 min-w-11 shrink-0 p-0 rounded-xl",
              MODAL_GHOST_BUTTON_CLASS,
            )}
            aria-label="ปิด"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            <X size={20} aria-hidden />
          </Button>
        </DialogHeader>

        {/* Body (flex-1 overflow-y-auto overscroll-contain) */}
        <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <Alert className="border-amber-300 bg-amber-50 text-amber-950 [&>svg]:text-amber-700 dark:border-amber-500/35 dark:bg-amber-950/30 dark:text-amber-100 dark:[&>svg]:text-amber-400">
            <AlertTriangle aria-hidden />
            <AlertTitle className="text-sm font-semibold text-amber-950 dark:text-amber-100">
              ออกเลขได้ครั้งเดียว
            </AlertTitle>
            <AlertDescription className="text-sm leading-relaxed text-amber-900 dark:text-amber-100/90">
              เลขชั่วคราวจะถูกแทนที่ด้วย Running Doc No
              และใช้ค้นสถานะสาธารณะต่อไม่ได้
            </AlertDescription>
          </Alert>

          {activeError && (
            <Alert
              variant="destructive"
              className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between w-full">
                <div>
                  <AlertTitle className="text-sm font-semibold">
                    เกิดข้อผิดพลาดในการออกเลข
                  </AlertTitle>
                  <AlertDescription className="text-xs leading-relaxed mt-0.5">
                    {activeError}
                  </AlertDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2 sm:mt-0 shrink-0 h-8 rounded-lg border-red-500/30 hover:bg-red-500/20 text-xs cursor-pointer"
                  disabled={submitting}
                  onClick={handleSubmit}
                >
                  ลองอีกครั้ง
                </Button>
              </div>
            </Alert>
          )}

          {hasVisibleChoice ? (
            <div
              role="radiogroup"
              aria-label="ประเภทเอกสาร"
              className={cn(
                "grid grid-cols-1 gap-3",
                visibleChoices.length > 1 && "sm:grid-cols-2",
              )}
            >
              {visibleChoices.map((choice, index) => {
                const Icon = choice.icon;
                const isOn = selected === choice.kind;
                const isFocusedCard = selected ? isOn : index === 0;
                const cardTabIndex = isFocusedCard ? 0 : -1;
                const previewText = classifyDocPreview(choice.kind, currentYear);

                return (
                  <button
                    key={choice.kind}
                    ref={(el) => {
                      cardRefs.current[index] = el;
                    }}
                    id={`choice-${choice.kind}`}
                    type="button"
                    role="radio"
                    aria-checked={isOn}
                    tabIndex={cardTabIndex}
                    disabled={submitting}
                    onClick={() => {
                      setSelected(choice.kind);
                      setLocalError(null);
                      onClearError?.();
                    }}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    aria-describedby={`choice-desc-${choice.kind}${isOn ? ` choice-preview-${choice.kind}` : ""}`}
                    className={cn(
                      "relative flex min-h-[104px] cursor-pointer flex-col justify-between rounded-xl border p-4 text-left transition-all duration-150 motion-reduce:transform-none motion-reduce:transition-none active:scale-[0.99]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      isOn
                        ? choice.kind === "ooc"
                          ? "border-2 border-amber-500 bg-amber-500/10 text-slate-900 shadow-md ring-1 ring-amber-500/20 dark:border-amber-400 dark:bg-amber-950/40 dark:text-slate-100"
                          : "border-2 border-primary bg-primary/10 text-slate-900 shadow-md ring-1 ring-primary/20 dark:border-primary dark:bg-primary/20 dark:text-slate-100"
                        : "border border-[var(--glass-card-border)] bg-[var(--glass-input-bg)] glass-text hover:bg-[var(--glass-hover)]",
                    )}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <Icon
                          size={18}
                          className={
                            isOn
                              ? choice.kind === "ooc"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-primary"
                              : "text-slate-400"
                          }
                          aria-hidden
                        />
                        {choice.title}
                      </span>
                      {isOn ? (
                        <CheckCircle2
                          size={18}
                          className={
                            choice.kind === "ooc"
                              ? "text-amber-600 dark:text-amber-400 shrink-0"
                              : "text-primary shrink-0"
                          }
                          aria-hidden
                        />
                      ) : (
                        <Circle
                          size={18}
                          className="text-slate-400/50 shrink-0"
                          aria-hidden
                        />
                      )}
                    </div>

                    <span
                      id={`choice-desc-${choice.kind}`}
                      className={cn(
                        "text-xs leading-relaxed mt-1.5",
                        isOn
                          ? "text-slate-700 dark:text-slate-200"
                          : "glass-muted-text",
                      )}
                    >
                      {choice.description}
                    </span>

                    {isOn && (
                      <span
                        id={`choice-preview-${choice.kind}`}
                        className={cn(
                          "mt-2.5 inline-flex items-center gap-1 font-mono text-[11px] font-medium px-2 py-0.5 rounded-md border",
                          choice.kind === "ooc"
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-300"
                            : "bg-primary/15 border-primary/30 text-primary-900 dark:text-primary-200",
                        )}
                      >
                        {previewText}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <Alert className="border-amber-300 bg-amber-50 text-amber-950 [&>svg]:text-amber-700 dark:border-amber-500/35 dark:bg-amber-950/30 dark:text-amber-100 dark:[&>svg]:text-amber-400">
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

        {/* Footer (shrink-0 m-0: overrides -mx-4 -mb-4 default in dialog.tsx) */}
        <DialogFooter className="m-0 flex shrink-0 flex-col-reverse gap-3 border-t border-[var(--glass-card-border)] bg-[var(--glass-input-bg)]/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex-1 min-w-0">
            {selected == null && (
              <span
                id="classify-btn-helper"
                className="text-xs glass-muted-text block text-left"
              >
                เลือกประเภทเอกสารก่อนจึงจะออกเลขได้
              </span>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 min-h-11 flex-1 sm:flex-initial rounded-xl border-[var(--glass-input-border)] bg-[var(--glass-input-bg)] glass-muted-text hover:bg-[var(--glass-hover)] hover:text-[var(--glass-text)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="default"
              className={cn(
                "h-11 min-h-11 flex-1 sm:flex-initial rounded-xl bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-[0.98] motion-reduce:transform-none cursor-pointer",
                isActionDisabled &&
                  "cursor-not-allowed opacity-60 hover:bg-primary active:scale-100",
              )}
              disabled={isActionDisabled}
              aria-disabled={isActionDisabled}
              aria-describedby={selected == null ? "classify-btn-helper" : undefined}
              onClick={handleSubmit}
            >
              {submitting ? (
                <Loader2 className="animate-spin mr-2 shrink-0" size={18} aria-hidden />
              ) : null}
              {submitting ? "กำลังออกเลข…" : confirmLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
