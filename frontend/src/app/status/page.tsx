import { redirect } from 'next/navigation';

/** เดิม `/status` — ใช้ `/public/status` เพื่อแยกเส้นทางสาธารณะ */
export default async function LegacyStatusRedirect({
  searchParams,
}: {
  searchParams: Promise<{ ticketNo?: string; phone?: string }>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.ticketNo) q.set('ticketNo', sp.ticketNo);
  if (sp.phone) q.set('phone', sp.phone);
  const qs = q.toString();
  redirect(`/public/status${qs ? `?${qs}` : ''}`);
}
