"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  History,
  Mail,
  Phone,
  UserCircle2,
} from "lucide-react";
import PersonAvatar from "@/components/PersonAvatar";
import { formatThaiDateTimeDisplay } from "@/lib/formatThaiDateTimeDisplay";
import { GLASS_SECTION } from "@/components/jobs/jobDetailStyles";

export type JobTimelineJob = {
  status: string;
  reportDate?: string;
  createdAt: string;
  fixDate?: string | null;
  ticketNo?: string | null;
  requestTicketNo?: string | null;
  /** หัวข้อ/เรื่องที่แจ้ง — แสดงใต้ขั้นแจ้งซ่อมถ้ามี */
  title?: string;
  reporterName?: string;
  reporterPhone?: string;
  reporterEmail?: string;
  reporter?: { id?: number; image?: string | null } | null;
  assignedTo?: { id: number; name: string; image?: string | null } | null;
  /** ผู้ใช้ที่กดมอบหมาย/รับงาน — ใช้แยก มอบหมาย vs รับงานเอง */
  assignedBy?: { id: number; name: string; image?: string | null } | null;
};

type AssignMode = "none" | "self" | "delegate" | "unknown";

type StepState = "done" | "current" | "upcoming";

const STATUS_LABELS_SHORT: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  IN_PROGRESS: "กำลังแก้ไข",
  RESOLVED: "เสร็จสิ้น",
};

function buildCollapsedSummary(job: JobTimelineJob): string {
  const statusLabel = STATUS_LABELS_SHORT[job.status] ?? job.status;
  const reported = formatThaiDateTimeDisplay(job.reportDate ?? job.createdAt);
  const parts = [`สถานะ ${statusLabel}`];
  if (reported) parts.push(`แจ้งเมื่อ ${reported}`);
  if (job.assignedTo && job.assignedBy) {
    if (job.assignedBy.id === job.assignedTo.id) {
      parts.push("รับงานเอง");
    } else {
      parts.push(`มอบหมายโดย ${job.assignedBy.name?.trim() || "ผู้ใช้"}`);
    }
  }
  if (job.status === "RESOLVED") {
    const closed = formatThaiDateTimeDisplay(job.fixDate ?? undefined);
    if (closed) parts.push(`ปิดเมื่อ ${closed}`);
  }
  return parts.join(" · ");
}

function computeSteps(job: JobTimelineJob) {
  const reportedAt = formatThaiDateTimeDisplay(job.reportDate ?? job.createdAt);
  const hasAssignee = Boolean(job.assignedTo);
  const isPending = job.status === "PENDING";
  const isInProgress = job.status === "IN_PROGRESS";
  const isResolved = job.status === "RESOLVED";

  const assignStep: {
    state: StepState;
    title: string;
    detail: string;
    mode: AssignMode;
    assigner: JobTimelineJob["assignedBy"];
    assignee: JobTimelineJob["assignedTo"];
  } = (() => {
    if (!hasAssignee) {
      if (isPending) {
        return {
          state: "current",
          title: "มอบหมาย / รับงาน",
          detail: "ยังไม่มีผู้รับผิดชอบ — รอมอบหมายหรือรับงาน",
          mode: "none" as const,
          assigner: null,
          assignee: null,
        };
      }
      if (isInProgress) {
        return {
          state: "current",
          title: "มอบหมาย / รับงาน",
          detail: "ยังไม่มีผู้รับผิดชอบในระบบ — ควรตรวจสอบข้อมูลงาน",
          mode: "none" as const,
          assigner: null,
          assignee: null,
        };
      }
      return {
        state: "upcoming",
        title: "มอบหมาย / รับงาน",
        detail: "ยังไม่มีผู้รับผิดชอบ",
        mode: "none" as const,
        assigner: null,
        assignee: null,
      };
    }

    const to = job.assignedTo!;
    const by = job.assignedBy;

    if (!by) {
      return {
        state: "done",
        title: "มอบหมาย / รับงาน",
        detail:
          "มีผู้รับผิดชอบแล้ว — ไม่มีบันทึกผู้มอบหมาย (ข้อมูลก่อนอัปเดตระบบ)",
        mode: "unknown" as const,
        assigner: null,
        assignee: to,
      };
    }

    if (by.id === to.id) {
      return {
        state: "done",
        title: "รับงาน",
        detail: "รับงานนี้เข้าดำเนินการด้วยตนเอง (ผู้รับงานเป็นผู้กดรับงาน)",
        mode: "self" as const,
        assigner: null,
        assignee: to,
      };
    }

    return {
      state: "done",
      title: "มอบหมายงาน",
      detail: "มอบหมายให้ผู้รับผิดชอบด้านล่าง โดยผู้มอบหมายตามการ์ดถัดไป",
      mode: "delegate" as const,
      assigner: by,
      assignee: to,
    };
  })();

  const work: { state: StepState; detail: string } = (() => {
    if (isResolved) {
      return { state: "done", detail: "ดำเนินการแก้ไขครบตามขั้นตอนแล้ว" };
    }
    if (isInProgress) {
      return { state: "current", detail: "กำลังดำเนินการแก้ไข" };
    }
    if (isPending && hasAssignee) {
      return {
        state: "current",
        detail: "รับงานแล้ว — รอดำเนินการในคิว / รอเริ่มแก้ไข",
      };
    }
    return { state: "upcoming", detail: "รอเริ่มดำเนินการแก้ไข" };
  })();

  const closedAt = formatThaiDateTimeDisplay(job.fixDate ?? undefined);
  const close: { state: StepState; detail: string; time: string | null } = (() => {
    if (isResolved) {
      return {
        state: "done",
        detail: closedAt ? "ปิดงานแล้ว" : "สถานะเสร็จสิ้น (ไม่มีวันที่ปิดในระบบ)",
        time: closedAt,
      };
    }
    if (isInProgress || (isPending && hasAssignee)) {
      return {
        state: "upcoming",
        detail: "รอบันทึกและปิดงานเมื่อแก้ไขครบ",
        time: null,
      };
    }
    return {
      state: "upcoming",
      detail: "รอปิดงานหลังแก้ไขครบ",
      time: null,
    };
  })();

  type Row =
    | {
        id: "report";
        title: string;
        state: StepState;
        detail: string;
        time: string | null;
        issueTitle?: string | null;
        assignee?: undefined;
      }
    | {
        id: "assign";
        title: string;
        state: StepState;
        detail: string;
        time: null;
        assignMode: AssignMode;
        assigner: JobTimelineJob["assignedBy"];
        assignee: JobTimelineJob["assignedTo"];
      }
    | {
        id: "work" | "close";
        title: string;
        state: StepState;
        detail: string;
        time: string | null;
        assignee?: undefined;
      };

  const steps: Row[] = [
    {
      id: "report",
      title: "แจ้งซ่อม",
      state: "done",
      detail: reportedAt
        ? "เปิดเคสและบันทึกเวลาแจ้งซ่อมแล้ว"
        : "เปิดเคสแล้ว (ไม่มีวันที่แจ้งในระบบ)",
      time: reportedAt,
      issueTitle: job.title?.trim() || null,
    },
    {
      id: "assign",
      title: assignStep.title,
      state: assignStep.state,
      detail: assignStep.detail,
      time: null,
      assignMode: assignStep.mode,
      assigner: assignStep.assigner,
      assignee: assignStep.assignee,
    },
    {
      id: "work",
      title: "ดำเนินการแก้ไข",
      state: work.state,
      detail: work.detail,
      time: null,
    },
    {
      id: "close",
      title: "ปิดเคส",
      state: close.state,
      detail: close.detail,
      time: close.time,
    },
  ];

  return steps;
}

function dotClass(state: StepState): string {
  if (state === "done") {
    return "border-emerald-400/90 bg-emerald-500/30 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]";
  }
  if (state === "current") {
    return "border-sky-400 bg-sky-500/25 shadow-[0_0_0_3px_rgba(56,189,248,0.2)] ring-2 ring-sky-500/40";
  }
  return "border-[var(--glass-card-border)] bg-[var(--glass-input-bg)]";
}

/** การ์ดผู้แจ้งซ่อม — โทนเดียวกับขั้นมอบหมาย แต่เน้นรายละเอียดติดต่อ */
function ReporterContactBlock({ job }: { job: JobTimelineJob }) {
  const name = job.reporterName?.trim();
  const phone = job.reporterPhone?.trim();
  const email = job.reporterEmail?.trim();
  const hasReporterUser = job.reporter?.id != null;
  const showPlaceholder = !name && !phone && !email;

  return (
    <div className="mt-2 rounded-xl border border-[var(--glass-card-border)] bg-[var(--glass-input-bg)] p-3 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider glass-subtle-text">
        ผู้แจ้งซ่อม
      </p>
      {showPlaceholder ? (
        <div className="flex items-center gap-3 glass-subtle-text">
          <UserCircle2 className="h-9 w-9 shrink-0 opacity-70" aria-hidden />
          <span className="text-xs">ไม่มีข้อมูลผู้แจ้งในระบบ</span>
        </div>
      ) : (
        <div className="flex items-start gap-3 min-w-0">
          <PersonAvatar
            imageUrl={job.reporter?.image}
            avatarUserId={
              hasReporterUser && job.reporter?.image
                ? job.reporter.id
                : undefined
            }
            nameLabel={name || undefined}
            size="md"
          />
          <div className="min-w-0 flex-1 space-y-1.5">
            {name ? (
              <p className="text-sm font-medium glass-text leading-snug">
                {name}
              </p>
            ) : (
              <p className="text-xs glass-subtle-text">ไม่ระบุชื่อ</p>
            )}
            {phone ? (
              <p className="text-xs flex items-center gap-1.5 glass-muted-text">
                <Phone
                  className="h-3.5 w-3.5 shrink-0 glass-subtle-text"
                  aria-hidden
                />
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="glass-text hover:text-sky-500 dark:hover:text-sky-300 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-500/40 rounded"
                >
                  {phone}
                </a>
              </p>
            ) : null}
            {email ? (
              <p className="text-xs flex items-center gap-1.5 glass-muted-text">
                <Mail
                  className="h-3.5 w-3.5 shrink-0 glass-subtle-text"
                  aria-hidden
                />
                <a
                  href={`mailto:${email}`}
                  className="text-slate-700 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300 break-all underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-500/40 rounded"
                >
                  {email}
                </a>
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobTimelineCard({ job }: { job: JobTimelineJob }) {
  const [expanded, setExpanded] = useState(false);
  const steps = computeSteps(job);
  const summaryLine = buildCollapsedSummary(job);
  const panelId = "job-timeline-panel";

  return (
    <section
      className={GLASS_SECTION}
      aria-labelledby="job-timeline-heading"
    >
      <div
        className={`flex items-start justify-between gap-3 ${expanded ? "mb-4" : "mb-0"}`}
      >
        <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
          <History className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
          <h2
            id="job-timeline-heading"
            className="text-sm font-bold glass-text tracking-tight"
          >
            ไทม์ไลน์งาน
          </h2>
          {job.ticketNo || job.requestTicketNo ? (
            <span className="text-xs font-mono glass-subtle-text">
              #{job.ticketNo || job.requestTicketNo}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-[var(--glass-input-border)] bg-[var(--glass-input-bg)] glass-text shadow-sm transition-all hover:bg-[var(--glass-hover)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-95"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={expanded ? "ย่อไทม์ไลน์งาน" : "ขยายไทม์ไลน์งาน"}
        >
          {expanded ? (
            <ChevronUp className="h-5 w-5" aria-hidden />
          ) : (
            <ChevronDown className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>

      {!expanded ? (
        <p className="mt-3 border-t border-[var(--glass-card-border)] pt-3 text-xs leading-relaxed glass-muted-text">
          {summaryLine}
        </p>
      ) : null}

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            id={panelId}
            inert={!expanded}
            aria-hidden={!expanded}
          >
      <ol
        className="relative"
        role="list"
        aria-label="ลำดับเหตุการณ์ของงานตั้งแต่แจ้งจนปิดเคส"
      >
        <div
          className="absolute left-[11px] top-3 bottom-3 w-px bg-[var(--glass-card-border)] pointer-events-none"
          aria-hidden
        />
        {steps.map((step) => {
          const isAssignStep = step.id === "assign";
          const isReportStep = step.id === "report";
          const issueTitle =
            isReportStep && "issueTitle" in step ? step.issueTitle : null;

          return (
            <li
              key={step.id}
              className="relative pl-9 pb-8 last:pb-0"
            >
              <div className="absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center z-1">
                <span
                  className={`h-3 w-3 rounded-full border-2 ${dotClass(step.state)}`}
                  aria-hidden
                />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="text-sm font-semibold glass-text">
                    {step.title}
                  </h3>
                  {step.state === "current" && (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-sky-700 dark:text-sky-300/90">
                      ปัจจุบัน
                    </span>
                  )}
                  {step.state === "upcoming" && (
                    <span className="text-[10px] font-medium uppercase tracking-wide glass-subtle-text">
                      รอ
                    </span>
                  )}
                </div>
                <p className="text-xs glass-muted-text leading-relaxed">
                  {step.detail}
                </p>
                {step.time ? (
                  <p className="text-xs glass-subtle-text tabular-nums">{step.time}</p>
                ) : null}
                {isReportStep ? (
                  <>
                    {issueTitle ? (
                      <div className="mt-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 dark:border-sky-500/20 dark:bg-sky-950/25">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700 mb-1 dark:text-sky-400/90">
                          หัวข้อที่แจ้ง
                        </p>
                        <p className="text-sm glass-text leading-snug">
                          {issueTitle}
                        </p>
                      </div>
                    ) : null}
                    <ReporterContactBlock job={job} />
                  </>
                ) : null}
                {isAssignStep && step.id === "assign" ? (
                  <>
                    {step.assignMode === "delegate" && step.assigner ? (
                      <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-950/25">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 mb-2 dark:text-amber-200/85">
                          ผู้มอบหมาย
                        </p>
                        <div className="flex items-center gap-3 min-w-0">
                          <PersonAvatar
                            imageUrl={step.assigner.image}
                            avatarUserId={
                              step.assigner.image
                                ? step.assigner.id
                                : undefined
                            }
                            nameLabel={step.assigner.name}
                            size="md"
                          />
                          <span className="text-sm font-medium glass-text truncate">
                            {step.assigner.name}
                          </span>
                        </div>
                      </div>
                    ) : null}
                    {step.assignee ? (
                      <div className="mt-2 rounded-xl border border-[var(--glass-card-border)] bg-[var(--glass-input-bg)] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider glass-subtle-text mb-2">
                          ผู้รับผิดชอบ
                        </p>
                        <div className="flex items-center gap-3 min-w-0">
                          <PersonAvatar
                            imageUrl={step.assignee.image}
                            avatarUserId={
                              step.assignee.image
                                ? step.assignee.id
                                : undefined
                            }
                            nameLabel={step.assignee.name}
                            size="md"
                          />
                          <span className="text-sm font-medium glass-text truncate">
                            {step.assignee.name}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-[var(--glass-card-border)] bg-[var(--glass-input-bg)] p-3 glass-subtle-text">
                        <UserCircle2
                          className="h-9 w-9 shrink-0 opacity-70"
                          aria-hidden
                        />
                        <span className="text-xs">ยังไม่ระบุผู้รับผิดชอบ</span>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-2 text-[11px] leading-snug glass-subtle-text border-t border-[var(--glass-card-border)] pt-3">
        เวลาบางขั้นตอนอาจไม่แสดง — ระบบบันทึกเฉพาะข้อมูลที่มีในฐานข้อมูล (ยังไม่มีประวัติเหตุการณ์แยกต่างหาก)
      </p>
          </div>
        </div>
      </div>
    </section>
  );
}
