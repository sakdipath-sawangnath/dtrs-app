"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import {
  JobMaintenancePdfTemplate,
  type JobMaintenancePdfJob,
  type PdfPrefetchedImages,
} from "@/components/pdf/JobMaintenancePdfTemplate";
import { sarabun } from "@/lib/fonts";
import { waitForFonts } from "@/lib/jobMaintenancePdf";
import { Button } from "@/components/ui/button";

type Props = {
  jobId: number;
};

export function PrintJobPageClient({ jobId }: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;

  const [job, setJob] = useState<JobMaintenancePdfJob | null>(null);
  const [prefetched, setPrefetched] = useState<PdfPrefetchedImages | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;
    (async () => {
      try {
        const headers: HeadersInit = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`/api/print-jobs/${jobId}/data`, {
          credentials: "include",
          headers,
          cache: "no-store",
        });
        const body = (await res.json()) as {
          error?: string;
          job?: JobMaintenancePdfJob;
          prefetchedImages?: PdfPrefetchedImages;
        };
        if (cancelled) return;
        if (!res.ok) {
          if (res.status === 401) {
            setError("กรุณาเข้าสู่ระบบแล้วเปิดหน้านี้อีกครั้ง");
            return;
          }
          setError(body?.error || "โหลดข้อมูลไม่สำเร็จ");
          return;
        }
        if (body.job) {
          setJob(body.job);
          setPrefetched(body.prefetchedImages);
        } else {
          setError("ไม่พบข้อมูลงาน");
        }
      } catch {
        if (!cancelled) setError("โหลดข้อมูลงานไม่สำเร็จ");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId, token, status]);

  const handlePrint = async () => {
    await waitForFonts();
    window.print();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white p-8 text-center text-slate-800">
        <p>{error}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/jobs")}
          className="mt-4 cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm"
        >
          กลับไปหน้ารายการ
        </Button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-100 p-8 text-center text-slate-600">
        กำลังโหลดรายงาน…
      </div>
    );
  }

  const ticketLabel =
    job.ticketNo?.trim() || job.requestTicketNo?.trim() || `งาน #${job.id}`;

  return (
    <div
      className={`print-shell min-h-screen bg-slate-200/90 text-black ${sarabun.className}`}
    >
      <header className="no-print sticky top-0 z-10 border-b border-slate-300/80 bg-slate-100/95 px-4 py-3 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-[calc(210mm+3rem)] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold text-slate-800">พิมพ์รายงาน</p>
            <p className="truncate text-xs text-slate-500">
              {ticketLabel} · ขนาด A4 ·{" "}
              <span className="font-medium text-slate-600">2 หน้า</span> (กระดาษ 2 แผ่น)
            </p>
          </div>
          <div className="flex shrink-0 justify-end">
            <Button
              type="button"
              onClick={() => void handlePrint()}
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/40"
            >
              <Printer size={18} aria-hidden />
              พิมพ์ / บันทึกเป็น PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="print-root mx-auto max-w-[calc(210mm+3rem)] px-3 pb-10 pt-6 sm:px-6">
        <JobMaintenancePdfTemplate
          job={job}
          prefetchedImages={prefetched}
          showScreenPageLabels
        />
      </div>
    </div>
  );
}
