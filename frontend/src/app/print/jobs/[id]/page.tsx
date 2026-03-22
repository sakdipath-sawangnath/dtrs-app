import { PrintJobPageClient } from "./PrintJobPageClient";

export default async function PrintJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isFinite(jobId)) {
    return (
      <div className="p-8 text-center text-slate-800">รหัสงานไม่ถูกต้อง</div>
    );
  }

  /** ข้อมูลงาน + รูปโหลดทาง `/api/print-jobs/[id]/data` ใน client (กัน stack overflow จาก RSC props ใหญ่) */
  return <PrintJobPageClient jobId={jobId} />;
}
