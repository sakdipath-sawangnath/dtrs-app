import { redirect } from 'next/navigation';

/** เดิม `/status` — ใช้ `/public/status` เพื่อแยกเส้นทางสาธารณะ */
export default async function LegacyStatusRedirect({
  searchParams,
}: {
  searchParams: Promise<{ ticketNo?: string }>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.ticketNo) q.set('ticketNo', sp.ticketNo);
  const qs = q.toString();
  redirect(`/public/status${qs ? `?${qs}` : ''}`);
}
