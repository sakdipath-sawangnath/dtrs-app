import Image from "next/image";
import type { CSSProperties, ReactEventHandler } from "react";

export const MANAGED_IMAGE_SIZES = {
  avatarXs: "28px",
  avatarSm: "32px",
  avatarMd: "40px",
  avatarLg: "56px",
  avatarXlResponsive: "(min-width: 640px) 88px, 80px",
  avatar2xl: "96px",
  avatar3xl: "112px",
  lightboxSquare: "240px",
  galleryResponsiveSm: "(min-width: 640px) 50vw, 100vw",
  galleryResponsiveMd: "(min-width: 768px) 50vw, 100vw",
  uploadGridResponsive: "(min-width: 768px) 33vw, 50vw",
  viewport: "100vw",
} as const;

type ManagedImageProps = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  forceRaw?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
  onError?: ReactEventHandler<HTMLImageElement>;
};

function shouldUseRawImage(src: string): boolean {
  return /^(blob:|data:|https?:)/i.test(src);
}

export default function ManagedImage({
  src,
  alt,
  className,
  style,
  forceRaw = false,
  fill = false,
  width,
  height,
  sizes,
  priority = false,
  unoptimized = true,
  onError,
}: ManagedImageProps) {
  if (forceRaw || shouldUseRawImage(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} style={style} onError={onError} />;
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized}
        className={className}
        style={style}
        onError={onError}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 1600}
      height={height ?? 1200}
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
      className={className}
      style={style}
      onError={onError}
    />
  );
}
