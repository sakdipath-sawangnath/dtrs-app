import type { ReactEventHandler, ReactNode } from "react";
import { cn } from "@/lib/utils";
import ManagedImage from "@/components/ManagedImage";

type ManagedImageFrameProps = {
  src?: string | null;
  alt: string;
  sizes: string;
  frameClassName?: string;
  imageClassName?: string;
  forceRaw?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
  onError?: ReactEventHandler<HTMLImageElement>;
  fallback?: ReactNode;
  imageOverlay?: ReactNode;
};

export default function ManagedImageFrame({
  src,
  alt,
  sizes,
  frameClassName,
  imageClassName = "object-cover",
  forceRaw = false,
  priority = false,
  unoptimized = true,
  onError,
  fallback = null,
  imageOverlay,
}: ManagedImageFrameProps) {
  const normalizedSrc = typeof src === "string" ? src.trim() : "";
  const showImage = normalizedSrc.length > 0;

  return (
    <div className={cn("relative overflow-hidden", frameClassName)}>
      {showImage ? (
        <ManagedImage
          src={normalizedSrc}
          alt={alt}
          fill
          sizes={sizes}
          forceRaw={forceRaw}
          priority={priority}
          unoptimized={unoptimized}
          className={imageClassName}
          onError={onError}
        />
      ) : (
        fallback
      )}
      {showImage ? imageOverlay : null}
    </div>
  );
}
