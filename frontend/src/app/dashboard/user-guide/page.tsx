"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  Shield,
  Settings,
  ArrowRight,
  Workflow,
  KeyRound,
  Users,
  FileEdit,
  Wrench,
  HelpCircle,
  ClipboardList,
  CheckCircle2,
  Landmark,
} from "lucide-react";
import DashboardPageShell from "@/components/DashboardPageShell";
import SegmentedTabs from "@/components/SegmentedTabs";
import { Button } from "@/components/ui/button";
import { unwrapApiData } from "@/lib/apiResponse";
import {
  USER_GUIDE_ADMIN_MASTER_STEPS,
  USER_GUIDE_DEFAULT_ROLES,
  USER_GUIDE_END_USER_FAQ,
  USER_GUIDE_END_USER_STEPS,
  USER_GUIDE_JOB_STATUS_ROWS,
  USER_GUIDE_PERMISSION_GROUPS,
  USER_GUIDE_STAFF_CHECKLIST,
  USER_GUIDE_STAFF_LIMITS,
  USER_GUIDE_STAFF_STEPS,
  USER_GUIDE_SUPERVISOR_NOTES,
  USER_GUIDE_WORKFLOW_STEPS,
} from "@/lib/userGuideContent";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4100/api";

type UserGuideTab = "general" | "staff" | "admin";

const GUIDE_TABS: { id: UserGuideTab; label: string; icon: typeof FileEdit }[] = [
  { id: "general", label: "ผู้แจ้งปัญหา", icon: FileEdit },
  { id: "staff", label: "เจ้าหน้าที่", icon: Wrench },
  { id: "admin", label: "ผู้ดูแลระบบ", icon: Shield },
];

function PermissionCode({ code }: { code: string }) {
  return (
    <code className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-xs font-mono text-slate-800 dark:bg-slate-800/80 dark:text-slate-200">
      {code}
    </code>
  );
}

function NumberedSteps({
  steps,
  accentClass = "border-blue-500/30 bg-blue-600",
}: {
  steps: { order: number; title: string; description: string; routes?: string[] | { label: string; href: string }[]; tips?: string[] }[];
  accentClass?: string;
}) {
  const [borderColor, bgColor] = accentClass.split(" ");
  return (
    <ol className="space-y-4 list-none p-0 m-0">
      {steps.map((step) => (
        <li
          key={step.order}
          className={`relative pl-10 sm:pl-12 border-l-2 ${borderColor} ml-3 sm:ml-4 pb-1`}
        >
          <span
            className={`absolute left-0 -translate-x-1/2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full ${bgColor} text-xs sm:text-sm font-bold text-white shadow-lg`}
            aria-hidden
          >
            {step.order}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{step.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
            {step.routes && step.routes.length > 0 && (
              <p className="mt-2 flex flex-wrap gap-2">
                {step.routes.map((r) => {
                  if (typeof r === "string") {
                    return (
                      <span key={r} className="text-xs font-mono text-slate-500 dark:text-slate-500">
                        {r}
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={r.href}
                      href={r.href}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {r.label} →
                    </Link>
                  );
                })}
              </p>
            )}
            {step.tips?.map((tip) => (
              <p key={tip} className="mt-2 text-xs text-amber-700 dark:text-amber-400/90">
                {tip}
              </p>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

function JobStatusTable() {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full min-w-[480px] text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-white/10 text-left">
            <th className="py-2 pr-3 font-medium text-slate-700 dark:text-slate-300">สถานะ</th>
            <th className="py-2 pr-3 font-medium text-slate-700 dark:text-slate-300">ผู้แจ้งเห็นว่า</th>
            <th className="py-2 font-medium text-slate-700 dark:text-slate-300">ช่าง/เจ้าหน้าที่</th>
          </tr>
        </thead>
        <tbody>
          {USER_GUIDE_JOB_STATUS_ROWS.map((row) => (
            <tr key={row.status} className="border-b border-slate-100 dark:border-white/5 align-top">
              <td className="py-2.5 pr-3 font-medium text-slate-900 dark:text-slate-100">{row.label}</td>
              <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">{row.forReporter}</td>
              <td className="py-2.5 text-slate-600 dark:text-slate-400">{row.forStaff}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminGuideSection() {
  return (
    <>
      <section className="min-w-0" aria-labelledby="user-guide-workflow-heading">
        <div className="flex items-center gap-2 mb-4">
          <Workflow size={22} className="shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
          <h2 id="user-guide-workflow-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            Workflow งานแจ้งซ่อม (เชิงเทคนิค)
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-5 max-w-3xl">
          ลำดับหลักพร้อม permission ที่เกี่ยวข้อง — รายละเอียด API เต็มอยู่ใน{" "}
          <span className="font-mono text-xs">docs/System-Workflow.md</span>
        </p>
        <ol className="space-y-4 list-none p-0 m-0">
          {USER_GUIDE_WORKFLOW_STEPS.map((step) => (
            <li
              key={step.order}
              className="relative pl-10 sm:pl-12 border-l-2 border-blue-500/30 ml-3 sm:ml-4 pb-1"
            >
              <span
                className="absolute left-0 -translate-x-1/2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-blue-600 text-xs sm:text-sm font-bold text-white shadow-lg"
                aria-hidden
              >
                {step.order}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{step.title}</h3>
                  {step.status && (
                    <span className="text-xs font-mono rounded-md px-2 py-0.5 bg-slate-200/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300">
                      {step.status}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
                {step.permissions && step.permissions.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-500 flex flex-wrap items-center gap-1.5">
                    <KeyRound size={14} className="shrink-0" aria-hidden />
                    สิทธิ์ที่เกี่ยวข้อง:
                    {step.permissions.map((p) => (
                      <PermissionCode key={p} code={p} />
                    ))}
                  </p>
                )}
                {step.routes && step.routes.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-500 font-mono break-all">
                    {step.routes.join(" · ")}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="min-w-0" aria-labelledby="user-guide-master-heading">
        <div className="flex items-center gap-2 mb-4">
          <Landmark size={22} className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <h2 id="user-guide-master-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            Master Site / พื้นที่
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-5 max-w-3xl">
          แยกสิทธิ์ <PermissionCode code="menu.locations" /> /{" "}
          <PermissionCode code="location.create" /> จาก{" "}
          <PermissionCode code="menu.sites" /> / <PermissionCode code="site.*" /> — มีเมนู locations
          อย่างเดียวจะดู master ได้โดยไม่เห็นปุ่มเพิ่ม
        </p>
        <ol className="space-y-4 list-none p-0 m-0">
          {USER_GUIDE_ADMIN_MASTER_STEPS.map((step) => (
            <li
              key={step.order}
              className="relative pl-10 sm:pl-12 border-l-2 border-emerald-500/30 ml-3 sm:ml-4 pb-1"
            >
              <span
                className="absolute left-0 -translate-x-1/2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-emerald-600 text-xs sm:text-sm font-bold text-white shadow-lg"
                aria-hidden
              >
                {step.order}
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{step.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
                {step.permissions && step.permissions.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-500 flex flex-wrap items-center gap-1.5">
                    <KeyRound size={14} className="shrink-0" aria-hidden />
                    สิทธิ์ที่เกี่ยวข้อง:
                    {step.permissions.map((p) => (
                      <PermissionCode key={p} code={p} />
                    ))}
                  </p>
                )}
                {step.routes && step.routes.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-500 font-mono break-all">
                    {step.routes.join(" · ")}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="min-w-0" aria-labelledby="user-guide-roles-heading">
        <div className="flex items-center gap-2 mb-4">
          <Users size={22} className="shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
          <h2 id="user-guide-roles-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            บทบาทมาตรฐาน (ค่าเริ่มต้น)
          </h2>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {USER_GUIDE_DEFAULT_ROLES.map((role) => (
            <li
              key={role.code}
              className="rounded-xl border border-slate-200/80 dark:border-white/10 px-4 py-3 bg-white/40 dark:bg-slate-900/30"
            >
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {role.name}{" "}
                <span className="font-mono text-xs font-normal text-slate-500">({role.code})</span>
              </p>
              <p className="text-sm mt-1 text-slate-600 dark:text-slate-400">{role.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="min-w-0" aria-labelledby="user-guide-permissions-heading">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={22} className="shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
          <h2 id="user-guide-permissions-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            คู่มือสิทธิ์ (Permission)
          </h2>
        </div>
        <div className="space-y-8">
          {USER_GUIDE_PERMISSION_GROUPS.map((group) => (
            <div key={group.id}>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{group.title}</h3>
              {group.intro && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{group.intro}</p>
              )}
              <div className="overflow-x-auto -mx-1 px-1">
                <table className="w-full min-w-[320px] text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-left">
                      <th className="py-2 pr-3 font-medium text-slate-700 dark:text-slate-300 w-[38%]">Code</th>
                      <th className="py-2 pr-3 font-medium text-slate-700 dark:text-slate-300 w-[22%]">ชื่อ</th>
                      <th className="py-2 font-medium text-slate-700 dark:text-slate-300">คำอธิบาย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item) => (
                      <tr key={item.code} className="border-b border-slate-100 dark:border-white/5 align-top">
                        <td className="py-2.5 pr-3">
                          <PermissionCode code={item.code} />
                        </td>
                        <td className="py-2.5 pr-3 text-slate-900 dark:text-slate-100">{item.name}</td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-400">
                          {item.description}
                          {item.note && (
                            <span className="block mt-1 text-xs text-amber-700 dark:text-amber-400/90">
                              {item.note}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default function UserGuidePage() {
  const { data: session, status } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [activeTab, setActiveTab] = useState<UserGuideTab>("general");

  useEffect(() => {
    if (!token || status !== "authenticated") {
      setPermissions(null);
      return;
    }
    fetch(`${API}/roles/me/permissions`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((raw) => {
        const payload = unwrapApiData<{ permissions?: string[] }>(raw);
        setPermissions(Array.isArray(payload?.permissions) ? payload.permissions : null);
      })
      .catch(() => setPermissions(null));
  }, [token, status]);

  const canRoles = permissions?.includes("menu.roles") ?? false;
  const canSettings = permissions?.includes("menu.settings") ?? false;

  return (
    <DashboardPageShell
      title="คู่มือระบบ"
      subtitle="การใช้งานสำหรับผู้แจ้งปัญหา เจ้าหน้าที่ และผู้ดูแลระบบ — เลือกแท็บด้านล่าง"
      noCard
    >
      <div className="flex flex-col gap-6 pb-8 min-w-0">
        {(canRoles || canSettings) && (
          <div className="flex flex-wrap gap-3">
            {canRoles && (
              <Button
                render={<Link href="/dashboard/roles" />}
                nativeButton={false}
                className="inline-flex items-center gap-2 rounded-xl transition-all active:scale-95 shadow-lg bg-blue-600 hover:bg-blue-500 text-white"
              >
                <Shield size={18} aria-hidden />
                จัดการบทบาทและสิทธิ์
                <ArrowRight size={16} aria-hidden />
              </Button>
            )}
            {canSettings && (
              <Button
                render={<Link href="/dashboard/settings" />}
                nativeButton={false}
                variant="outline"
                className="inline-flex items-center gap-2 rounded-xl transition-all active:scale-95 shadow-lg border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
              >
                <Settings size={18} aria-hidden />
                ตั้งค่าระบบ
                <ArrowRight size={16} aria-hidden />
              </Button>
            )}
          </div>
        )}

        <SegmentedTabs
          tabs={GUIDE_TABS}
          activeId={activeTab}
          onChange={setActiveTab}
          ariaLabel="หมวดคู่มือระบบ"
        />

        {activeTab === "general" && (
          <div className="flex flex-col gap-8 min-w-0" role="tabpanel" aria-label="ผู้แจ้งปัญหา">
            <section aria-labelledby="end-user-steps-heading">
              <div className="flex items-center gap-2 mb-4">
                <FileEdit size={22} className="shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
                <h2 id="end-user-steps-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  ขั้นตอนการใช้งาน (ผู้แจ้งปัญหา)
                </h2>
              </div>
              <NumberedSteps steps={USER_GUIDE_END_USER_STEPS} />
            </section>

            <section aria-labelledby="job-status-heading">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList size={22} className="shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
                <h2 id="job-status-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  ความหมายสถานะงาน
                </h2>
              </div>
              <JobStatusTable />
            </section>

            <section aria-labelledby="end-user-faq-heading">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle size={22} className="shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
                <h2 id="end-user-faq-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  คำถามที่พบบ่อย
                </h2>
              </div>
              <ul className="space-y-3">
                {USER_GUIDE_END_USER_FAQ.map((item) => (
                  <li
                    key={item.question}
                    className="rounded-xl border border-slate-200/80 dark:border-white/10 px-4 py-3 bg-white/40 dark:bg-slate-900/30"
                  >
                    <p className="font-medium text-slate-900 dark:text-slate-100">{item.question}</p>
                    <p className="text-sm mt-1 text-slate-600 dark:text-slate-400">{item.answer}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {activeTab === "staff" && (
          <div className="flex flex-col gap-8 min-w-0" role="tabpanel" aria-label="เจ้าหน้าที่">
            <section aria-labelledby="staff-checklist-heading">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={22} className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                <h2 id="staff-checklist-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Checklist ก่อนเริ่มงาน
                </h2>
              </div>
              <ul className="space-y-2">
                {USER_GUIDE_STAFF_CHECKLIST.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm">
                <Link
                  href="/dashboard/profile"
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  ตั้งลายเซ็นและโปรไฟล์ →
                </Link>
              </p>
            </section>

            <section aria-labelledby="staff-steps-heading">
              <div className="flex items-center gap-2 mb-4">
                <Wrench size={22} className="shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
                <h2 id="staff-steps-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  ขั้นตอนงานช่าง / เจ้าหน้าที่
                </h2>
              </div>
              <NumberedSteps
                steps={USER_GUIDE_STAFF_STEPS}
                accentClass="border-emerald-500/30 bg-emerald-600"
              />
            </section>

            <section aria-labelledby="staff-status-heading">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList size={22} className="shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
                <h2 id="staff-status-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  ความหมายสถานะงาน
                </h2>
              </div>
              <JobStatusTable />
            </section>

            <section aria-labelledby="staff-limits-heading">
              <h2 id="staff-limits-heading" className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                ข้อจำกัดและเคล็ดลับ
              </h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                {USER_GUIDE_STAFF_LIMITS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="supervisor-notes-heading">
              <h2 id="supervisor-notes-heading" className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                หมายเหตุสำหรับหัวหน้างาน (SUPERVISOR)
              </h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                {USER_GUIDE_SUPERVISOR_NOTES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {activeTab === "admin" && (
          <div className="flex flex-col gap-8 min-w-0" role="tabpanel" aria-label="ผู้ดูแลระบบ">
            <AdminGuideSection />
          </div>
        )}
      </div>
    </DashboardPageShell>
  );
}
