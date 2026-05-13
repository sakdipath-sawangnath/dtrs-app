"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import ManagedImageFrame from "@/components/ManagedImageFrame";
import { MANAGED_IMAGE_SIZES } from "@/components/ManagedImage";

/** วงกลมรูปโปรไฟล์ / fallback ไอคอน — ใช้ใน JobsList, หน้ารายละเอียดงาน */
export default function PersonAvatar({
  imageUrl,
  /** ถ้ามี — โหลดรูปผ่าน `/user-images/:id` (JWT cookie) แทน URL MinIO ตรง */
  avatarUserId,
  nameLabel,
  size = "sm",
  variant = "dark",
}: {
  imageUrl?: string | null;
  avatarUserId?: number | null;
  nameLabel?: string;
  size?: "sm" | "md";
  variant?: "dark" | "light";
}) {
  const [imgErr, setImgErr] = useState(false);
  const trimmed = imageUrl?.trim();
  const proxySrc =
    avatarUserId != null && Number.isFinite(avatarUserId) && trimmed
      ? `/user-images/${avatarUserId}`
      : null;
  const legacySrc = !proxySrc && trimmed ? trimmed : null;
  const url = proxySrc ?? legacySrc;
  const showImg = Boolean(url) && !imgErr;

  useEffect(() => {
    setImgErr(false);
  }, [proxySrc, legacySrc]);

  const dim = size === "md" ? "h-10 w-10" : "h-8 w-8";
  const iconSz = size === "md" ? 18 : 16;
  const shell =
    variant === "light"
      ? "border border-slate-200 bg-slate-100 ring-1 ring-slate-200/60"
      : "border border-white/10 bg-slate-800/80 ring-1 ring-white/5";
  const iconCls = variant === "light" ? "text-slate-400" : "text-slate-500";
  return (
    <ManagedImageFrame
      src={showImg && url ? url : null}
      alt={nameLabel ? `รูป ${nameLabel}` : "รูปโปรไฟล์"}
      sizes={size === "md" ? MANAGED_IMAGE_SIZES.avatarMd : MANAGED_IMAGE_SIZES.avatarSm}
      frameClassName={`${dim} shrink-0 rounded-full flex items-center justify-center ${shell}`}
      imageClassName="h-full w-full object-cover"
      onError={() => setImgErr(true)}
      fallback={<User size={iconSz} className={iconCls} aria-hidden />}
    />
  );
}
