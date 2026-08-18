"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import SignaturePad, {
  type SignaturePadHandle,
} from "@/components/SignaturePad";
import { MODAL_GHOST_BUTTON_CLASS } from "@/components/ui/modalGhostButtonStyles";
import { axiosErrorData, formatApiErrorDetail } from "@/lib/apiResponse";
import { ensureStaffSignatureOrToast } from "@/lib/ensureStaffSignature";
import { toastError, toastSuccess } from "@/lib/toast";
import { GLASS_LABEL } from "./jobDetailStyles";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4100/api";

export type JobReporterSignTarget = {
  id: number;
  ticketNo?: string | null;
  reporterName?: string | null;
  province?: string | null;
  district?: string | null;
  location?: string | null;
};

interface JobReporterSignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobReporterSignTarget | null;
  token: string | undefined;
  onSuccess: () => void | Promise<void>;
}

export default function JobReporterSignDialog({
  open,
  onOpenChange,
  job,
  token,
  onSuccess,
}: JobReporterSignDialogProps) {
  const reporterSigRef = useRef<SignaturePadHandle | null>(null);
  const [reporterSigReady, setReporterSigReady] = useState(false);
  const [closing, setClosing] = useState(false);

  const locationLine = [job?.province, job?.district, job?.location]
    .filter(Boolean)
    .join(" › ");

  const resetPad = () => {
    reporterSigRef.current?.clear();
    setReporterSigReady(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && closing) return;
    if (!next) resetPad();
    onOpenChange(next);
  };

  const handleCloseJob = async () => {
    if (!job || !token) return;
    if (!(await ensureStaffSignatureOrToast(token))) return;

    const sigBlob = await reporterSigRef.current?.toBlob("image/png");
    if (!sigBlob) {
      toastError("ข้อมูลไม่ครบ", "กรุณาเซ็นลายเซ็นผู้แจ้งก่อนปิดงาน");
      return;
    }

    setClosing(true);
    try {
      const closeForm = new FormData();
      closeForm.append("reporterSignature", sigBlob, "reporter-signature.png");
      await axios.patch(`${API}/jobs/${job.id}/close`, closeForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toastSuccess("ปิดงานเรียบร้อยแล้ว (สถานะ: เสร็จสิ้น)", 1800);
      resetPad();
      onOpenChange(false);
      await onSuccess();
    } catch (err: unknown) {
      const msg =
        formatApiErrorDetail(axiosErrorData(err)) ?? "ไม่สามารถปิดงานได้";
      toastError("ข้อผิดพลาด", msg);
    } finally {
      setClosing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-[var(--glass-overlay)] backdrop-blur-md"
        className="glass-card max-h-[min(92vh,720px)] max-w-[calc(100%-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-3 border-b border-[var(--glass-card-border)] p-4 sm:p-5">
          <DialogTitle className="font-bold text-base glass-text">
            ปิดงาน — ลายเซ็นผู้แจ้ง
            {job?.ticketNo ? ` · ${job.ticketNo}` : ""}
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={`min-h-11 min-w-11 shrink-0 ${MODAL_GHOST_BUTTON_CLASS}`}
            aria-label="ปิด"
            disabled={closing}
            onClick={() => handleOpenChange(false)}
          >
            <X size={20} aria-hidden />
          </Button>
        </DialogHeader>

        <div className="space-y-4 p-4 sm:p-5">
          <p className="text-xs glass-muted-text leading-relaxed">
            ให้ผู้แจ้งปัญหาเซ็นบนอุปกรณ์นี้ (มือถือ/แท็บเล็ต/แล็ปท็อป) หลังบันทึกการแก้ไขครบแล้ว
          </p>

          {job && (
            <dl className="rounded-xl border border-[var(--glass-card-border)] bg-[var(--glass-input-bg)] px-3 py-2.5 text-xs space-y-1.5">
              {job.reporterName ? (
                <div className="flex gap-2">
                  <dt className="shrink-0 font-semibold glass-muted-text">ผู้แจ้ง</dt>
                  <dd className="glass-text">{job.reporterName}</dd>
                </div>
              ) : null}
              {locationLine ? (
                <div className="flex gap-2">
                  <dt className="shrink-0 font-semibold glass-muted-text">สถานที่</dt>
                  <dd className="glass-text">{locationLine}</dd>
                </div>
              ) : null}
            </dl>
          )}

          <div className="space-y-2">
            <Label className={GLASS_LABEL}>
              ลายเซ็นผู้แจ้ง <span className="text-red-600 dark:text-red-400">*</span>
            </Label>
            <SignaturePad
              handleRef={reporterSigRef}
              height={160}
              onStrokeChange={setReporterSigReady}
              disabled={closing}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-[var(--glass-card-border)] p-4 sm:flex-col sm:p-5">
          <Button
            type="button"
            variant="default"
            disabled={closing || !reporterSigReady}
            onClick={() => void handleCloseJob()}
            className="w-full min-h-11 cursor-pointer rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 focus-visible:ring-emerald-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
          >
            {closing ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin shrink-0" aria-hidden />
                กำลังปิดงาน...
              </>
            ) : (
              "ปิดงาน (สถานะ: เสร็จสิ้น)"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
