import { redirect } from 'next/navigation';

/** เดิม `/report` — ใช้ `/public/report` เพื่อแยกเส้นทางสาธารณะ */
export default async function LegacyReportRedirect({
  searchParams,
}: {
  searchParams: Promise<{ contractStatus?: string }>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.contractStatus) q.set('contractStatus', sp.contractStatus);
  const qs = q.toString();
  redirect(`/public/report${qs ? `?${qs}` : ''}`);
}
