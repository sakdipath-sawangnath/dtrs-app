"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PublicRouteLoading from "@/components/PublicRouteLoading";
import ReportPageContent from "@/components/ReportPageContent";
import { resolveOutOfContractAccess } from "@/lib/outOfContractAccess";
import { unwrapApiData } from "@/lib/apiResponse";

function ReportOocGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [permissions, setPermissions] = useState<string[] | null>(null);
  const token = (session as { accessToken?: string })?.accessToken;
  const userRole = (
    (session as { userRole?: string })?.userRole ??
    (session?.user as { role?: string })?.role ??
    ""
  ).toUpperCase();
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4100/api";

  useEffect(() => {
    if (!token || status !== "authenticated") {
      setPermissions(null);
      return;
    }
    let cancelled = false;
    fetch(`${API}/roles/me/permissions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((raw) => {
        if (cancelled) return;
        const payload = unwrapApiData<{ permissions?: string[] }>(raw);
        setPermissions(Array.isArray(payload?.permissions) ? payload.permissions : []);
      })
      .catch(() => {
        if (!cancelled) setPermissions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [token, status, API]);

  const access = resolveOutOfContractAccess({
    permissions,
    userRole,
  });

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=" + encodeURIComponent("/public/report-ooc"));
      return;
    }
    // ถ้าผู้ใช้ยืนยันตัวตนแล้ว แต่ไม่มีสิทธิ์ (เช่น USER หรือบทบาทที่ไม่ได้ติ๊ก menu.outOfContract)
    // ให้ redirect ไปยัง /dashboard หลังจากโหลด permissions เรียบร้อยแล้ว
    if (status === "authenticated" && access.ready && !access.canAccess) {
      router.replace("/dashboard");
    }
  }, [status, access, router]);

  // กำลังโหลด session หรือกำลังรอตรวจสิทธิ์จาก API (กรณีไม่ใช่บทบาทมาตรฐาน)
  if (status === "loading" || (!access.canAccess && !access.ready)) {
    return (
      <PublicRouteLoading
        title="กำลังตรวจสอบสิทธิ์..."
        description="การแจ้งงานนอกสัญญาจำกัดเฉพาะเจ้าหน้าที่และผู้ดูแลระบบ"
      />
    );
  }

  // ไม่ authenticated หรือ สิทธิ์แน่ชัดแล้วว่าเข้าไม่ได้ (กำลัง redirect)
  if (status === "unauthenticated" || !access.canAccess) {
    return (
      <PublicRouteLoading
        title="กำลังนำทาง..."
        description="การแจ้งงานนอกสัญญาจำกัดเฉพาะเจ้าหน้าที่และผู้ดูแลระบบ"
      />
    );
  }

  return <ReportPageContent forceOutOfContract={true} />;
}

export default function ReportOocPage() {
  return (
    <Suspense
      fallback={
        <PublicRouteLoading
          title="กำลังโหลดหน้าแจ้งปัญหานอกสัญญา..."
          description="กำลังเตรียมข้อมูลเริ่มต้นของแบบฟอร์ม"
        />
      }
    >
      <ReportOocGuard />
    </Suspense>
  );
}
