---
name: scrutinize
description: Outsider end-to-end review of a plan, PR, or code change in the CCTV Maintenance System (dtrs-app). Questions intent and simpler alternatives, traces real code paths (not just the diff), verifies RBAC/workflow/MinIO/API guardrails and regression seams. Output concise actionable findings in Thai for the user. Trigger on /scrutinize or when the user asks to review/audit/sanity-check a plan, PR, diff, or design — NOT for active debugging (debug-mantra) or interactive pre-implementation Q&A (grilling).
license: Internal project skill (no external redistribution terms)
---

# Scrutinize

Stand outside the change and ask whether it should exist at all, then verify it actually does what it claims end-to-end.

Pair with domain skills (`ui-ux-pro-max`, `shadcn`, `backend-api-pro`, `nestjs-best-practices`). **Do not** replace **`grilling`** (plan discovery before coding) or **`debug-mantra`** (broken system). Optional follow-up: **`review-bugbot`** / **`review-security`** for automated diff review.

## When to invoke

- `/scrutinize` or "review this PR / diff / plan / approach"
- "sanity-check", "second opinion", "audit this change", "should we ship this?"
- Before merge on PRs that touch **shared hosts** (`JobsList`, `DashboardLayoutShell`, `CrudModal`, auth/proxy, RBAC guards, MinIO image routes)
- After implementing a fix — review the **fix + tests** before merge (static trace; repro optional)

## When NOT to use

- **Interactive plan discovery before coding** (user wants back-and-forth Q&A, one question at a time). Use skill **`grilling`** first; return here after there is an artifact or concrete plan to audit.
- **Active debugging** (symptom, stack trace, failing test, flake). Use skill **`debug-mantra`** first.
- User explicitly says **"don't question scope"** — skip the simpler-alternative pass in step 1 only.
- **Production incident** needing timeline, blast radius, paging. Out of scope unless user narrows to a specific code change.

## Output language

- Findings and verdict to the **user: ภาษาไทย** (technical terms / file paths may stay English).
- Skill body stays English for consistency with other project skills.

---

## Operating stance

- **Outsider.** Forget who wrote it and why they think it's right. Read the artifact cold.
- **End-to-end, not diff-local.** The diff is the entry point, not the scope. Follow the call graph through real code paths.
- **Actionable, concise, with rationale.** Every finding states *what to change*, *why*, and *what evidence* led you there. No filler, no restating the diff back.

---

## Workflow

Run these in order. Do not skip ahead.

### 0. Scope domain (dtrs-app — before step 1)

Identify **frontend**, **backend**, **full-stack**, **infra/deploy**, **public**, or **shared** from paths/URLs/API prefixes. If ambiguous, state what's missing and stop.

| Signal | Domain | Load skill / doc |
|--------|--------|------------------|
| `/public/report`, `/public/status`, `/report`, `/status` | **Public** | [`README.md`](../../../README.md) |
| `/dashboard/pending`, `/dashboard/in-progress`, `/dashboard/my-jobs`, `/dashboard/all`, `JobsList` | **Jobs / workflow** | [`README.md`](../../../README.md), [`STATUS.md`](../../../STATUS.md), [`docs/Job-Serial-Multi-Row.md`](../../../docs/Job-Serial-Multi-Row.md) |
| `/dashboard/jobs/[id]`, job detail, fix/reopen/assign | **Job detail** | `JobsService`, `jobs.controller.ts`, RBAC doc |
| `/dashboard/roles`, `GET /roles/me/permissions`, `PermissionsGuard` | **RBAC** | [`backend/docs/RBAC-Setup.md`](../../../backend/docs/RBAC-Setup.md) |
| `/dashboard/users`, `/dashboard/profile`, `/users/me` | **Users** | RBAC doc + [`frontend/src/lib/auth.ts`](../../../frontend/src/lib/auth.ts) |
| `/dashboard/settings`, SMTP, email templates, orphan cleanup | **Settings / admin** | [`docs/Email-Notifications.md`](../../../docs/Email-Notifications.md), [`docs/MinIO-Orphan-Cleanup.md`](../../../docs/MinIO-Orphan-Cleanup.md) |
| `/dashboard/sites`, `Site`, `Area`, CSV/Excel seed | **Sites / areas** | [`docs/CSV-vs-System-Mapping.md`](../../../docs/CSV-vs-System-Mapping.md) |
| `/job-images`, `/user-images`, `ManagedImage`, MinIO proxy | **Images / storage** | [`docs/Project-Plan-Private-MinIO-Images.md`](../../../docs/Project-Plan-Private-MinIO-Images.md), [`minio.md`](../../../minio.md) |
| `/print/jobs`, `/api/print-jobs`, PDF, Puppeteer | **Print / PDF** | [`backend/postman/PRINT-PDF-DEBUG.md`](../../../backend/postman/PRINT-PDF-DEBUG.md) |
| `CrudModal`, `Dialog`, `DashboardLayoutShell`, `form-input-glass` | **Dashboard UI** | skill **`ui-ux-pro-max`**, skill **`shadcn`**, [`AGENTS.md`](../../../AGENTS.md) |
| Nest module, DTO, Guard, migration, `JobsService` | **Backend API** | skill **`backend-api-pro`**, skill **`nestjs-best-practices`**, [`backend/docs/api-endpoints.json`](../../../backend/docs/api-endpoints.json) |
| `.gitlab-ci.yml`, Docker, `ALLOWED_ORIGINS`, `API_INTERNAL_BASE_URL` | **Infra / deploy** | [`README.md`](../../../README.md), [`.gitlab-ci.yml`](../../../.gitlab-ci.yml) |
| Socket.IO, realtime notifications | **Realtime** | `NotificationsBell`, backend gateway module |
| NextAuth, `/api/auth`, `unwrapApiData`, Next API routes | **Frontend ↔ API seam** | [`frontend/src/lib/apiResponse.ts`](../../../frontend/src/lib/apiResponse.ts), [`frontend/src/lib/auth.ts`](../../../frontend/src/lib/auth.ts) |

**Repo rules (always):** follow [`AGENTS.md`](../../../AGENTS.md); no secrets in code/docs/commits; no logging JWT, `NEXTAUTH_SECRET`, SMTP passwords, `Authorization`, or PII (phone, address); frontend UI must match **Dark Glassmorphism** + **No-Card Layout** (except Dashboard Overview); prefer `@/components/ui/*` via skill **`shadcn`** before custom markup; backend image entry is **`dist/src/main.js`** (not `dist/main.js`).

---

### 1. Intent — what is this actually trying to do?

- State the goal in **one sentence**, in your own words. If you cannot, the artifact is underspecified — say so and stop.
- Ask: **is there a simpler, smaller, or more elegant way to achieve the same goal?** Consider:
  - Doing nothing (is the problem real / load-bearing?).
  - Using something that already exists in the codebase instead of adding new surface.
  - A smaller change that solves 90% of the goal with 10% of the risk.
  - Solving it at a different layer (env/config vs code, DTO validation vs UI check, Next proxy vs client direct call, Prisma migration vs one-off script).
- **dtrs-app lens (mandatory one pass):**
  - Can this stay **page-local** instead of editing `JobsList`, `DashboardLayoutShell`, or `CrudModal`?
  - Can this be **backend-only** (Guard + DTO) without duplicating checks in UI — or vice versa, is UI-only hide enough for the risk?
  - Does this belong on **public** routes (`/public/**`) or **dashboard** only — and is JWT/PII exposure justified?
  - For RBAC: is a new **permission code** + seed + Guard cheaper than hardcoding role checks?
  - For images: can existing **proxy paths** (`/job-images/**`, `/user-images/**`) serve the need instead of new public MinIO URLs?
  - For workflow: does an existing **PATCH route + status enum** already cover the transition?
- If a better alternative exists, name it explicitly with rationale **before** line-by-line review.

---

### 2. Trace — walk the actual code path

For each behavior the change claims, trace end-to-end through **real** code:

- Entry point → call sites → branches taken → state mutated → exit / return / side effect.
- Include **unchanged** code on either side of the diff. Bugs hide at the seams.
- For a plan or design doc: trace the proposed flow against the existing system. Where does it touch reality? What does it assume that isn't true?
- Note every **surprise** (unexpected branch, dead code, unknown state). Surprises are signal.

**dtrs-app seam checklist** (when trace crosses these):

| Layer | Check |
|-------|--------|
| Route | `app/(dashboard)/...` or `app/public/...` → page → client component |
| Auth | NextAuth session → Bearer on axios/fetch → Nest `JwtAuthGuard` |
| Public vs JWT | `/public/**` and `POST /public/jobs` need no token; dashboard must not leak reporter PII |
| API response | Nest `ResponseInterceptor` → `{ success, data }` → frontend **`unwrapApiData()`** |
| Next proxy | `/api/print-jobs`, `/api/job-images`, NextAuth — server uses **`getServerApiBaseUrl()`** / `API_INTERNAL_BASE_URL` |
| RBAC | UI: `GET /roles/me/permissions` in `DashboardLayoutShell`; API: **`PermissionsGuard`** + permission codes |
| Workflow | Job status: `PENDING` → `IN_PROGRESS` → `RESOLVED`; assign/fix/reopen/out-of-contract routes |
| Images | Upload → MinIO key in DB → serve via `/job-images/...` (Next) → Nest `GET /jobs/:id/image/...` |
| Email | Template choice, To/CC from role ids — [`docs/Email-Notifications.md`](../../../docs/Email-Notifications.md) |
| Realtime | Socket.IO base = API origin **without** `/api`; list refresh after assign/fix |
| Build / env | `NEXT_PUBLIC_*` is build-time; Docker ports **8404** (frontend) / **8405** (backend) |

**High-risk shared files** — if the diff touches these, trace **all affected flows**:

- [`JobsList.tsx`](../../../frontend/src/components/JobsList.tsx) — pending, in-progress, all, my-jobs, out-of-contract
- [`DashboardLayoutShell.tsx`](../../../frontend/src/components/DashboardLayoutShell.tsx) — menu visibility vs API 403
- [`CrudModal.tsx`](../../../frontend/src/components/CrudModal.tsx) + `@/components/ui/dialog` (`z-100`)
- [`frontend/src/lib/auth.ts`](../../../frontend/src/lib/auth.ts) + NextAuth route
- [`frontend/src/lib/apiResponse.ts`](../../../frontend/src/lib/apiResponse.ts) — `unwrapApiData`, error formatting
- [`backend/src/auth/permissions.guard.ts`](../../../backend/src/auth/permissions.guard.ts)
- [`backend/src/jobs/jobs.controller.ts`](../../../backend/src/jobs/jobs.controller.ts) + `JobsService`
- [`frontend/src/lib/jobImageProxy.ts`](../../../frontend/src/lib/jobImageProxy.ts), [`userImageProxy.ts`](../../../frontend/src/lib/userImageProxy.ts)
- [`frontend/src/lib/jobAssignEligibility.ts`](../../../frontend/src/lib/jobAssignEligibility.ts)

---

### 3. Verify — does it actually do what it claims?

For each claim the change/plan makes:

- **Does the traced path produce that behavior?** Format: *"Claims X. Path: A → B → C. At C, [observation]. Therefore [holds / doesn't hold]."*
- **What inputs / states would break it?** Edge cases, concurrent callers, error paths, partial failures, empty/null, ordering, permission×status combos, out-of-contract tab, multi-serial rows.
- **What does it silently change?** Performance, error semantics, observability, contract for other callers, on-disk / on-wire format, email recipients, PDF layout.
- **How is it tested?** Do tests exercise the traced path, or pass while skipping it (mocks hiding proxy/Guard branch, happy path only)?

**dtrs-app regression matrix** (apply rows that match the diff):

| If changed… | Must verify path… |
|-------------|-------------------|
| `JobsList` / list pages | ≥1 queue tab each: pending, in-progress, all, my-jobs; CSV export if touched |
| `DashboardLayoutShell` / sidebar | Menu visible **and** API returns 403 when permission missing |
| RBAC seed / Guard / `@RequirePermissions` | UI button hide **and** direct API call without permission → 403 |
| Public report/status | No JWT required; reporter phone/address not exposed on status lookup |
| Job detail / fix / reopen | Status transition valid; `job.fix.self|any`, `job.reopen.self|any` respected |
| Upload / image display | MinIO key stored; proxy serves image; public pages omit image URLs |
| Email notification | Correct template; To/CC; `FRONTEND_BASE_URL` / `publicBaseUrl` in links |
| PDF / print | `/api/print-jobs/:id/data` timeout; images via `/job-images/...`; Chromium path on PRD |
| Settings / SMTP | `menu.settings`; test endpoint; no secrets in logs |
| Prisma schema / migration | Rollback path; seed scripts; no committed `tsc` under `backend/scripts/` |
| Docker / CI / env | `ALLOWED_ORIGINS`, `API_INTERNAL_BASE_URL`, `MINIO_SERVER_FETCH_BASE_URL` pair |

**Backend API changes:** cross-check [`backend/docs/api-endpoints.json`](../../../backend/docs/api-endpoints.json) and [`backend/postman/README.md`](../../../backend/postman/README.md).

**RBAC changes:** cross-check [`backend/docs/RBAC-Setup.md`](../../../backend/docs/RBAC-Setup.md) + `backend/scripts/seed-roles-permissions.ts`.

**UI changes:** cross-check [`AGENTS.md`](../../../AGENTS.md) Definition of Done — accessibility, touch targets, Dark Glass, shadcn primitives.

**Tests:** backend — `cd backend && npm test -- <pattern>` or `npm run test:e2e`; frontend has **no** Jest/Playwright in `package.json` — note manual browser checklist or API-level test instead.

---

### 4. Report

One tight section per finding. Order by severity (**blocker → major → nit**). For each:

- **Finding** — one sentence, specific. Cite `file:line` when applicable.
- **Why it matters** — the consequence, not the principle.
- **Evidence** — the trace step or input that exposes it.
- **Suggested change** — concrete, minimal.
- **Domain** — frontend | backend | full-stack | public | infra | shared.
- **Regression risk** — สูง/กลาง/ต่ำ + paths to manual/Postman/E2E if needed.
- **Docs debt** — `README.md`, `STATUS.md`, `RBAC-Setup.md`, `Email-Notifications.md`, Postman collection (if any).

Close with a **one-line verdict** in Thai:

| Verdict | Meaning |
|---------|---------|
| **ship** | Claims hold; seams checked; test/docs adequate for risk |
| **fix-then-ship** | Correct direction; specific blockers listed |
| **rework** | Wrong layer or simpler alternative wins |
| **reject** | Should not land (e.g. RBAC bypass, public PII leak, wrong API contract, MinIO public read as default fix) |

Plus the **single biggest reason** in one sentence.

If verdict is `ship` or `fix-then-ship` on a **non-trivial change**, suggest optional **`review-bugbot`** / **`review-security`** before merge.

---

## Operating rules

- **No rubber-stamps.** "LGTM" is not an output. If nothing found, state what you traced and what you checked.
- **Cite or it didn't happen.** Every code claim references a path, file, or line.
- **Distinguish claim from verification.** "The PR says X" ≠ "I traced X and confirmed/refuted."
- **One simpler-alternative pass is mandatory** (step 1), unless user said "don't question scope."
- **Don't pad with style nits** when there's a structural problem. Lead with blockers.
- **No flattery, no hedging.** State the finding.
- **Do not run terminal** during review unless the user approves (tests belong in PR Test plan).
- **Security:** if review touches auth/upload/financial or PII data, verify Security Gate in `AGENTS.md` — no secrets logged; public routes don't expose reporter data inappropriately.
- **UI:** if review touches dashboard/public pages, load **`ui-ux-pro-max`** + **`shadcn`** for primitive and accessibility checks.

---

## Skill routing (dtrs-app)

| Situation | Skill |
|-----------|--------|
| Stress-test plan/design **before** implementation (interactive Q&A) | **`grilling`** → domain skill(s) → implement → **`scrutinize`** |
| Review PR / plan / approach **before merge** | **`scrutinize`** (this) → optional **`review-bugbot`** / **`review-security`** |
| Something is broken / failing | **`debug-mantra`** |
| After validated fix — write RCA | **`post-mortem`** |
| UI work on dashboard/public | **`ui-ux-pro-max`** + **`shadcn`** |
| NestJS endpoint / service / migration | **`backend-api-pro`** + **`nestjs-best-practices`** |

**Recommended pipeline:** `grilling` → implement → **`scrutinize`** → optional **`review-bugbot`** → commit when user requests

**เร็ว ๆ:** วางแผน → `grill`; review ก่อน merge → `scrutinize`; บั๊ก → `debug-mantra`; ปิดงานหลัง fix → `post-mortem`; แตะ UI/API → domain skill ที่เกี่ยว

---

## อ้างอิง

- Before implementation: skill [`grilling`](../grilling/SKILL.md)
- Debug (symptom มีแล้ว): skill [`debug-mantra`](../debug-mantra/SKILL.md)
- RCA หลัง fix: skill [`post-mortem`](../post-mortem/SKILL.md)
- Guardrails: [`AGENTS.md`](../../../AGENTS.md)
- ภาพรวมระบบ: [`README.md`](../../../README.md), [`STATUS.md`](../../../STATUS.md), [`PLAN.md`](../../../PLAN.md), [`TASK.md`](../../../TASK.md)
- ดัชนี docs: [`docs/README.md`](../../../docs/README.md)
- RBAC: [`backend/docs/RBAC-Setup.md`](../../../backend/docs/RBAC-Setup.md)
- API สรุป: [`backend/docs/api-endpoints.json`](../../../backend/docs/api-endpoints.json), [`backend/postman/README.md`](../../../backend/postman/README.md)
- MinIO: [`minio.md`](../../../minio.md), [`docs/Project-Plan-Private-MinIO-Images.md`](../../../docs/Project-Plan-Private-MinIO-Images.md)
- อีเมล: [`docs/Email-Notifications.md`](../../../docs/Email-Notifications.md)
- UI: skill [`ui-ux-pro-max`](../ui-ux-pro-max/SKILL.md), skill [`shadcn`](../shadcn/SKILL.md)
- Backend: skill [`backend-api-pro`](../../../backend/.agents/skills/backend-api-pro/SKILL.md), skill [`nestjs-best-practices`](../../../backend/.agents/skills/nestjs-best-practices/SKILL.md)
