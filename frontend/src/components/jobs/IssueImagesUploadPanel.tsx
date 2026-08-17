"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Camera } from "lucide-react";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast";
import { axiosErrorData, formatApiErrorDetail } from "@/lib/apiResponse";
import {
  formatJobImageUploadError,
  runMultipartUploadWithProxyFallback,
} from "@/lib/jobImageProxyFallback";
import ManagedImage from "@/components/ManagedImage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  clearFileInput,
  isHeicLike,
  JOB_IMAGE_ACCEPT,
  JOB_IMAGE_HINT,
  validateJobImageFile,
} from "@/lib/jobImageUpload";

function revokePreviewUrls(urls: (string | null)[]): void {
  for (const url of urls) {
    if (url) URL.revokeObjectURL(url);
  }
}

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4100/api";

export const MAX_ISSUE_IMAGES = 3;

export function countNonemptyIssueImages(images: unknown): number {
  if (!Array.isArray(images)) return 0;
  return images.filter((u) => typeof u === "string" && u.trim().length > 0)
    .length;
}

export function jobStatusAllowsIssueImageUpload(
  status: string | null | undefined,
): boolean {
  return status === "PENDING" || status === "IN_PROGRESS";
}

type Props = {
  jobId: number;
  token?: string;
  canUpload: boolean;
  existingCount?: number;
  onUploaded: () => void | Promise<void>;
};

/** อัปโหลดรูปปัญหา — เติมช่องว่างถึง 3 รูป (ใช้ใน wrench modal / job detail) */
export default function IssueImagesUploadPanel({
  jobId,
  token,
  canUpload,
  existingCount = 0,
  onUploaded,
}: Props) {
  const existing = Math.max(0, Math.min(MAX_ISSUE_IMAGES, existingCount));
  const remaining = MAX_ISSUE_IMAGES - existing;
  const [files, setFiles] = useState<(File | null)[]>(() =>
    Array.from({ length: Math.max(remaining, 0) }, () => null),
  );
  const [previews, setPreviews] = useState<(string | null)[]>(() =>
    Array.from({ length: Math.max(remaining, 0) }, () => null),
  );
  const previewsRef = useRef(previews);
  previewsRef.current = previews;
  const [saving, setSaving] = useState(false);
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const refs = [ref0, ref1, ref2];

  useEffect(() => {
    const slotCount = Math.max(remaining, 0);
    setFiles(Array.from({ length: slotCount }, () => null));
    setPreviews((prev) => {
      revokePreviewUrls(prev);
      return Array.from({ length: slotCount }, () => null);
    });
  }, [remaining]);

  useEffect(() => {
    return () => revokePreviewUrls(previewsRef.current);
  }, []);

  const setFileAt = (i: number, file: File | null, input?: HTMLInputElement | null) => {
    if (file) {
      const err = validateJobImageFile(file);
      if (err) {
        toastError(err);
        clearFileInput(input ?? refs[i]?.current ?? null);
        return;
      }
    }
    setFiles((prev) => {
      const next = [...prev];
      next[i] = file;
      return next;
    });
    setPreviews((prev) => {
      const next = [...prev];
      if (next[i]) URL.revokeObjectURL(next[i]!);
      next[i] =
        file && !isHeicLike(file) ? URL.createObjectURL(file) : null;
      return next;
    });
  };

  const handleUpload = async () => {
    if (!token || !canUpload) return;
    const toSend = files.filter((f): f is File => !!f);
    if (toSend.length < 1) {
      toastError("กรุณาเลือกอย่างน้อย 1 รูป");
      return;
    }
    setSaving(true);
    try {
      await runMultipartUploadWithProxyFallback({
        fields: [{ name: "images", files: toSend }],
        reserveNonImageBytes: 12_000,
        onCompressing: () =>
          toastWarning(
            "กำลังบีบอัดรูป",
            "เซิร์ฟเวอร์จำกัดขนาดคำขอ — ระบบจะลดขนาดรูปแล้วส่งใหม่",
          ),
        upload: async (byField) => {
          const form = new FormData();
          (byField.get("images") ?? []).forEach((f) => form.append("images", f));
          await axios.patch(`${API}/jobs/${jobId}/issue-images`, form, {
            headers: { Authorization: `Bearer ${token}` },
          });
        },
      });
      toastSuccess("อัปโหลดรูปปัญหาแล้ว", 1200);
      setFiles(Array.from({ length: remaining }, () => null));
      setPreviews((prev) => {
        revokePreviewUrls(prev);
        return Array.from({ length: remaining }, () => null);
      });
      await onUploaded();
    } catch (err: unknown) {
      toastError(
        "อัปโหลดไม่สำเร็จ",
        formatJobImageUploadError(
          err,
          formatApiErrorDetail(axiosErrorData(err)) ??
            "ไม่สามารถอัปโหลดรูปปัญหาได้",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!canUpload || remaining < 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs glass-muted-text">
        {existing === 0
          ? "ยังไม่มีรูปปัญหา — อัปโหลดได้สูงสุด 3 รูป"
          : `อัปโหลดเพิ่มได้อีก ${remaining} รูป (สูงสุด 3 รูป)`}
        {" · "}
        {JOB_IMAGE_HINT}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {files.map((file, i) => {
          const slotLabel = `เลือกไฟล์รูปปัญหาช่องที่ ${existing + i + 1}`;
          const selectedLabel = file
            ? `${slotLabel} — ${file.name}`
            : slotLabel;
          return (
            <div key={i} className="min-w-0">
              <button
                type="button"
                disabled={saving}
                onClick={() => refs[i]?.current?.click()}
                aria-label={selectedLabel}
                className={cn(
                  "relative flex min-h-11 w-full cursor-pointer flex-col items-center justify-center gap-1 aspect-video overflow-hidden rounded-xl border border-dashed transition-colors hover:bg-[var(--glass-hover)] disabled:cursor-not-allowed disabled:opacity-50",
                  previews[i] || file
                    ? "border-transparent"
                    : "border-[var(--glass-card-border)]",
                )}
              >
                {previews[i] ? (
                  <>
                    <ManagedImage
                      src={previews[i]!}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1 py-0.5 text-[10px] text-white">
                      {file?.name ?? "เปลี่ยนรูป"}
                    </span>
                  </>
                ) : file ? (
                  <>
                    <Camera size={18} className="glass-muted-text" aria-hidden />
                    <span className="max-w-full truncate px-1 text-[10px] glass-text">
                      {file.name}
                    </span>
                    {isHeicLike(file) ? (
                      <span className="px-1 text-[10px] glass-muted-text">
                        HEIC — พร้อมอัปโหลด
                      </span>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Camera size={18} className="glass-muted-text" aria-hidden />
                    <span className="max-w-full truncate px-1 text-[10px] glass-muted-text">
                      เลือกไฟล์
                    </span>
                  </>
                )}
              </button>
              <input
                ref={refs[i]}
                type="file"
                accept={JOB_IMAGE_ACCEPT}
                className="hidden"
                disabled={saving}
                onChange={(e) =>
                  setFileAt(i, e.target.files?.[0] ?? null, e.target)
                }
              />
            </div>
          );
        })}
      </div>
      <Button
        type="button"
        disabled={saving || !files.some(Boolean)}
        onClick={() => void handleUpload()}
        aria-busy={saving}
        className="min-h-11 cursor-pointer rounded-xl shadow-lg transition-all active:scale-95"
      >
        {saving ? "กำลังอัปโหลด..." : "อัปโหลดรูปปัญหา"}
      </Button>
    </div>
  );
}
