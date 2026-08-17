"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ManagedImage, { MANAGED_IMAGE_SIZES } from "@/components/ManagedImage";
import { cn } from "@/lib/utils";

interface JobImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  urls: string[];
  index: number;
  onIndexChange: (index: number) => void;
}

/** ปุ่มบนพื้นดำ — ห้ามใช้ glass-text (light mode บังคับสีเข้ม) */
const LIGHTBOX_GHOST_CLASS =
  "cursor-pointer text-white hover:bg-white/10 hover:text-white focus-visible:text-white focus-visible:ring-white/40";

export default function JobImageLightbox({
  open,
  onOpenChange,
  urls,
  index,
  onIndexChange,
}: JobImageLightboxProps) {
  const n = urls.length;
  const safeIndex = n > 0 ? Math.min(Math.max(0, index), n - 1) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[110] bg-black/50 backdrop-blur-sm"
        className="z-[110] flex h-[min(92vh,900px)] w-full max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-white/15 bg-black p-0 text-white shadow-2xl sm:max-w-5xl"
      >
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-2 border-b border-white/15 bg-black px-4 py-3 text-xs text-white/80 sm:text-sm">
          <DialogTitle className="text-xs font-medium text-white sm:text-sm">
            รูปที่ {n > 0 ? safeIndex + 1 : 0} / {n}
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "min-h-11 min-w-11 rounded-xl",
              LIGHTBOX_GHOST_CLASS,
            )}
            onClick={() => onOpenChange(false)}
          >
            ปิด
          </Button>
        </DialogHeader>

        <div className="relative min-h-[280px] flex-1 bg-black sm:min-h-[420px]">
          {n > 0 ? (
            <div className="relative h-full w-full">
              <ManagedImage
                src={urls[safeIndex]}
                alt=""
                fill
                sizes={MANAGED_IMAGE_SIZES.viewport}
                className="object-contain"
              />
            </div>
          ) : null}

          {n > 1 ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="รูปก่อนหน้า"
                className={cn(
                  "absolute top-1/2 left-3 z-10 min-h-11 min-w-11 -translate-y-1/2 rounded-full bg-black/70 px-2.5 sm:left-4",
                  LIGHTBOX_GHOST_CLASS,
                )}
                onClick={() =>
                  onIndexChange(safeIndex === 0 ? n - 1 : safeIndex - 1)
                }
              >
                <ChevronLeft size={20} aria-hidden />
                <span className="sr-only">ก่อนหน้า</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="รูปถัดไป"
                className={cn(
                  "absolute top-1/2 right-3 z-10 min-h-11 min-w-11 -translate-y-1/2 rounded-full bg-black/70 px-2.5 sm:right-4",
                  LIGHTBOX_GHOST_CLASS,
                )}
                onClick={() =>
                  onIndexChange(safeIndex === n - 1 ? 0 : safeIndex + 1)
                }
              >
                <ChevronRight size={20} aria-hidden />
                <span className="sr-only">ถัดไป</span>
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
