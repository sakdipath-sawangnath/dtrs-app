import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { can, PERMISSIONS, type SessionUser } from '@/lib/auth/permissions';
import { fetchServerPermissions } from '@/lib/auth/serverPermissions';
import { logSecurityAudit } from '@/lib/auth/auditLog';
import PublicRouteLoading from '@/components/PublicRouteLoading';
import ReportPageContent from '@/components/ReportPageContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'แจ้งงานนอกสัญญา — ระบบจัดการงาน',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardReportOocPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login?returnTo=' + encodeURIComponent('/dashboard/report-ooc'));
  }

  const token = (session as { accessToken?: string })?.accessToken;
  const permissions = await fetchServerPermissions(token);

  const sessionUser: SessionUser = {
    id: (session as { userId?: string })?.userId ?? (session.user as { id?: string })?.id,
    name: session.user.name,
    email: (session.user as { email?: string })?.email,
    role: (session as { userRole?: string })?.userRole ?? (session.user as { role?: string })?.role,
    permissions,
  };

  if (!can(sessionUser, PERMISSIONS.OOC_VIEW)) {
    logSecurityAudit({
      event: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      userId: sessionUser.id,
      role: sessionUser.role,
      path: '/dashboard/report-ooc',
      reason: 'User lacks OOC_VIEW permission',
    });
    notFound();
  }

  return (
    <Suspense
      fallback={
        <PublicRouteLoading
          title="กำลังโหลดหน้าแจ้งปัญหานอกสัญญา..."
          description="กำลังเตรียมข้อมูลเริ่มต้นของแบบฟอร์ม"
        />
      }
    >
      <ReportPageContent forceOutOfContract={true} />
    </Suspense>
  );
}
