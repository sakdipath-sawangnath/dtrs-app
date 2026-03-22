"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * หน้า /staff ถูกรวมกับ /users แล้ว - redirect ไป /dashboard/users
 */
export default function StaffRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/users");
  }, [router]);
  return (
    <div className="flex items-center justify-center p-8 text-sm" style={{ color: "#64748b" }}>
      กำลังเปลี่ยนไปหน้ารายชื่อผู้ใช้...
    </div>
  );
}
