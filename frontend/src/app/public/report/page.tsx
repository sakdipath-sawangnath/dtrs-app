"use client";

import { Suspense } from "react";
import PublicRouteLoading from "@/components/PublicRouteLoading";
import ReportPageContent from "@/components/ReportPageContent";

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <PublicRouteLoading
          title="กำลังโหลดหน้าแจ้งปัญหา..."
          description="กำลังเตรียมข้อมูลเริ่มต้นของแบบฟอร์ม"
        />
      }
    >
      <ReportPageContent />
    </Suspense>
  );
}
