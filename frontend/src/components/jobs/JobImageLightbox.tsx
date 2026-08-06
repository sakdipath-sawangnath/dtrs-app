"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ManagedImage, { MANAGED_IMAGE_SIZES } from "@/components/ManagedImage";
import {
  MODAL_GHOST_BUTTON_CLASS,
  MODAL_GHOST_DARK_NAV_BUTTON_CLASS,
} from "@/components/ui/modalGhostButtonStyles";

interface JobImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  urls: string[];
  index: number;
  onIndexChange: (index: number) => void;
}

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
        overlayClassName="bg-[var(--glass-overlay)] backdrop-blur-sm"
        className="flex h-[min(92vh,900px)] w-full max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-[var(--glass-card-border)] bg-black/90 p-0 shadow-2xl sm:max-w-5xl"
      >
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-2 border-b border-[var(--glass-card-border)] bg-black/70 px-4 py-3 text-xs glass-muted-text sm:text-sm">
          <DialogTitle className="text-xs font-medium glass-text sm:text-sm">
            รูปที่ {n > 0 ? safeIndex + 1 : 0} / {n}
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={MODAL_GHOST_BUTTON_CLASS}
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
                className={`absolute top-1/2 left-3 z-10 -translate-y-1/2 rounded-full bg-black/60 px-2.5 py-2 text-xs sm:left-4 sm:text-sm ${MODAL_GHOST_DARK_NAV_BUTTON_CLASS}`}
                onClick={() =>
                  onIndexChange(safeIndex === 0 ? n - 1 : safeIndex - 1)
                }
              >
                ‹ Prev
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`absolute top-1/2 right-3 z-10 -translate-y-1/2 rounded-full bg-black/60 px-2.5 py-2 text-xs sm:right-4 sm:text-sm ${MODAL_GHOST_DARK_NAV_BUTTON_CLASS}`}
                onClick={() =>
                  onIndexChange(safeIndex === n - 1 ? 0 : safeIndex + 1)
                }
              >
                Next ›
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
