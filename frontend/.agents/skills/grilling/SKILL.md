---
name: grilling
description: Interview the user one question at a time to stress-test a plan or design before implementation in the CCTV Maintenance System (dtrs-app). Walk the design tree branch-by-branch until shared understanding. Trigger on /grill, "grill this plan", "stress-test this design" — NOT for PR/diff review, debugging (debug-mantra), or post-fix RCA.
disable-model-invocation: true
license: Internal project skill (no external redistribution terms)
---

# Grilling

Collaborative, Socratic stress-test of a **plan or design before building** — not an outsider audit of finished work.

Pair with domain skills (`ui-ux-pro-max`, `shadcn`, `backend-api-pro`, `nestjs-best-practices`). After shared understanding → implement → skill **`scrutinize`** before merge. **Do not** replace **`debug-mantra`** (broken system) or ad-hoc PR review. Optional follow-up: **`review-bugbot`** / **`review-security`**.

## When to invoke

- `/grill` or "grill this plan / design / approach"
- "stress-test this design", "interview me about this plan", "walk through the design tree"
- Before implementing a non-trivial feature, refactor, or cross-layer change (frontend ↔ backend ↔ MinIO ↔ deploy)
- When the plan has unresolved branches (API shape, RBAC permission, shared vs page-local component, workflow policy, test strategy)

## When NOT to use

- **PR / diff / code already written** ready for audit → skill **`scrutinize`**
- **Active debugging** (symptom, stack trace, failing test) → skill **`debug-mantra`**
- User wants a **read-only plan doc** with no back-and-forth → Cursor Plan mode
- User says **"just implement"** or **"don't question scope"** → skip grilling; optionally **`scrutinize`** later

## Output language

- Questions, recommendations, and summaries to the **user: ภาษาไทย** (technical terms / file paths may stay English).
- Skill body stays English for consistency with other project skills.

---

## Core protocol (verbatim)

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing. Asking multiple questions at once is bewildering.

If a question can be answered by exploring the codebase, explore the codebase instead.

---

## Operating stance

- **Collaborative, not adversarial.** Goal is shared understanding, not a verdict.
- **One branch at a time.** Finish the current decision before opening sibling branches.
- **Recommend, then listen.** Every question includes your recommended answer with brief rationale — user confirms, adjusts, or overrides.
- **Codebase over speculation.** If the repo already answers it, read first (`Read`, `Grep`, `Glob`, `Task explore`) and present findings instead of asking.
- **No implementation during grill** unless the user explicitly asks to prototype one narrow spike to unblock a decision.

**Repo rules (always):** follow [`AGENTS.md`](../../../AGENTS.md); no secrets in code/docs/commits; no logging JWT, SMTP passwords, `Authorization`, or PII; frontend UI must match **Glassmorphism (Dark default + Light toggle)** + **No-Card Layout** (except Dashboard Overview); prefer `@/components/ui/*` via skill **`shadcn`** before custom markup.

---

## Workflow

Run in order. Stay on **one open question** until resolved.

### 0. Scope domain (dtrs-app — before first question)

Identify **frontend**, **backend**, **full-stack**, **infra/deploy**, or **shared** from the plan's paths/URLs/API prefixes. If ambiguous, **first question** must nail scope.

| Signal | Domain | Load skill / doc |
|--------|--------|------------------|
| `/public/report`, `/public/status`, `/report`, `/status` | **Public** | [`README.md`](../../../README.md) (Report UX, phone lookup) |
| `/dashboard/jobs`, `/dashboard/pending`, `JobsList`, job detail | **Jobs / workflow** | [`README.md`](../../../README.md), [`STATUS.md`](../../../STATUS.md), [`docs/Job-Serial-Multi-Row.md`](../../../docs/Job-Serial-Multi-Row.md) |
| `/dashboard/roles`, `GET /roles/me/permissions`, `PermissionsGuard` | **RBAC** | [`backend/docs/RBAC-Setup.md`](../../../backend/docs/RBAC-Setup.md) |
| `/dashboard/users`, `/dashboard/profile`, `/users/me` | **Users** | RBAC doc + `frontend/src/lib/auth.ts` |
| `/dashboard/settings`, SMTP, email templates, `app_meta`, orphan cleanup | **Settings / admin** | [`docs/Email-Notifications.md`](../../../docs/Email-Notifications.md), [`docs/MinIO-Orphan-Cleanup.md`](../../../docs/MinIO-Orphan-Cleanup.md) |
| `/dashboard/sites`, `Site`, `Area`, seed CSV/Excel | **Sites / areas** | [`docs/CSV-vs-System-Mapping.md`](../../../docs/CSV-vs-System-Mapping.md), [`PLAN.md`](../../../PLAN.md) |
| `/job-images`, `/user-images`, `ManagedImage`, MinIO proxy | **Images / storage** | [`docs/Project-Plan-Private-MinIO-Images.md`](../../../docs/Project-Plan-Private-MinIO-Images.md), [`minio.md`](../../../docs/minio.md) |
| `/print/jobs`, `/api/print-jobs`, PDF, Puppeteer | **Print / PDF** | [`backend/postman/PRINT-PDF-DEBUG.md`](../../../backend/postman/PRINT-PDF-DEBUG.md), [`backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md`](../../../backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md) |
| `CrudModal`, `Dialog`, `DashboardLayoutShell`, `form-input-glass` | **Dashboard UI** | skill **`ui-ux-pro-max`**, skill **`shadcn`**, [`AGENTS.md`](../../../AGENTS.md) |
| Nest module, DTO, Guard, migration, `JobsService` | **Backend API** | skill **`backend-api-pro`**, skill **`nestjs-best-practices`**, [`backend/docs/api-endpoints.json`](../../../backend/docs/api-endpoints.json) |
| `.gitlab-ci.yml`, Docker, `ALLOWED_ORIGINS`, `API_INTERNAL_BASE_URL` | **Infra / deploy** | [`README.md`](../../../README.md), [`.gitlab-ci.yml`](../../../.gitlab-ci.yml) |
| Socket.IO, realtime notifications | **Realtime** | `frontend/src` socket client + backend gateway module |
| Job assign / fix / reopen / out-of-contract / status transitions | **Workflow policy** | RBAC doc + `JobsList` / `JobsService` existing patterns |
| `unwrapApiData`, Next API routes, NextAuth | **Frontend ↔ API seam** | `frontend/src/lib/apiResponse.ts`, `frontend/src/lib/auth.ts` |

State in one sentence: **what we're grilling** and **which domain(s)**.

---

### 1. Map the design tree

Before deep questions, sketch (briefly, in Thai) the decision tree:

- Root goal (one sentence)
- Major branches (e.g. new page vs extend `JobsList`, frontend-only vs API + migration, public vs dashboard-only)
- **Dependencies** — which branches must be decided before others?

Pick the **highest-leverage unresolved branch** (blocks the most downstream decisions). That becomes the first question.

---

### 2. Grill loop (repeat until done)

For each question:

1. **Context** — one sentence: why this decision matters now.
2. **Question** — single, specific, answerable.
3. **Recommended answer** — what you suggest and why (cite codebase/docs when possible).
4. **Options** (if non-obvious) — 2–3 alternatives with trade-offs; mark recommended.
5. **Wait** for user feedback. Do not ask the next question in the same turn.

After user answers:

- Record the **resolved decision** in a running summary (short bullet).
- If answer contradicts repo reality, say so gently and offer to re-explore code.
- Move to the next branch per dependency order.

**dtrs-app lenses to weave in** (not all at once — one per question when relevant):

| Lens | Example question |
|------|------------------|
| Layer split | Frontend-only, backend-only, or both? Does Next API route proxy to Nest or call service directly? |
| Public vs auth | Does this endpoint/page need JWT? Should public callers see this field (e.g. reporter phone, image URL)? |
| RBAC | Which permission code (`job.assign`, `menu.settings`, `job.fix.self`, …)? Guard on controller or UI-only hide? |
| Workflow | Which job status transition? Does it match existing PATCH routes and SweetAlert confirm pattern? |
| API contract | Response wrapped in `{ data }` — does frontend use `unwrapApiData`? DTO validation on Nest side? |
| UI primitive | Extend `CrudModal` / `Dialog` (`z-100`) vs new modal? shadcn component exists? Dark Glass classes? |
| Images | Store MinIO key vs public URL? Serve via `/job-images/...` proxy or `/api/jobs/.../image`? |
| Email | Which template (`แจ้งเหตุ` / `รับเรื่อง` / `ปิดงาน`)? To/CC from role ids + manual CC? |
| DB / migration | Prisma schema change needed? One-off script under `backend/scripts/` (don't commit compiled output)? |
| Deploy | New env var for GitLab CI / docker-compose? NPM path rules on reverse proxy? |
| Tests | Unit on service/mapper vs manual checklist on PRD — minimum gate for this risk? |

---

### 3. Close — shared understanding

When major branches are resolved, output a **short plan summary** in Thai:

- **Goal** (one sentence)
- **Domain** — frontend | backend | full-stack | infra | shared
- **Decisions** — bullet list of resolved choices
- **Files / areas** likely touched (best guess; refine during implementation)
- **Risks / open items** — anything deferred or needs spike
- **Next step** — implement → skill **`scrutinize`** → optional **`review-bugbot`** / **`review-security`** → commit (when user asks)

Ask: **"พร้อมลงมือ implement หรือยังมี branch ที่อยาก grill ต่อ?"**

---

## Question quality rules

- **One question per turn.** No numbered lists of 3+ questions.
- **Don't ask what code already proves.** Explore first.
- **Don't ask trivia** the user already stated in the plan.
- **Prefer constrained choices** over open-ended when trade-offs are clear.
- **Escalate to user** only when the decision is product/policy, not discoverable in repo.

---

## Skill routing (dtrs-app)

| Situation | Skill / action |
|-----------|----------------|
| Stress-test plan/design **before** coding | **`grilling`** (this) → domain skill(s) |
| Review PR / plan / diff **before merge** | **`scrutinize`** → optional **`review-bugbot`** / **`review-security`** |
| Something is broken / failing | **`debug-mantra`** |
| After validated fix — write RCA | **`post-mortem`** |
| UI work on dashboard/public | **`ui-ux-pro-max`** + **`shadcn`** |
| NestJS endpoint / service / migration | **`backend-api-pro`** + **`nestjs-best-practices`** |

**Recommended pipeline:** `grilling` → implement → **`scrutinize`** → optional **`review-bugbot`** → commit when user requests

**เร็ว ๆ:** วางแผน → `grill`; review ก่อน merge → `scrutinize`; บั๊ก → `debug-mantra`; ปิดงานหลัง fix → `post-mortem`

---

## อ้างอิง

- Guardrails: [`AGENTS.md`](../../../AGENTS.md)
- Review after grill: skill [`scrutinize`](../scrutinize/SKILL.md)
- Debug (หลังมี symptom): skill [`debug-mantra`](../debug-mantra/SKILL.md)
- RCA หลัง fix: skill [`post-mortem`](../post-mortem/SKILL.md)
- ภาพรวมระบบ: [`README.md`](../../../README.md), [`STATUS.md`](../../../STATUS.md), [`PLAN.md`](../../../PLAN.md), [`TASK.md`](../../../TASK.md)
- ดัชนี docs: [`docs/README.md`](../../../docs/README.md)
- RBAC: [`backend/docs/RBAC-Setup.md`](../../../backend/docs/RBAC-Setup.md)
- API สรุป: [`backend/docs/api-endpoints.json`](../../../backend/docs/api-endpoints.json), [`backend/postman/README.md`](../../../backend/postman/README.md)
- MinIO: [`minio.md`](../../../docs/minio.md), [`docs/Project-Plan-Private-MinIO-Images.md`](../../../docs/Project-Plan-Private-MinIO-Images.md)
- อีเมล: [`docs/Email-Notifications.md`](../../../docs/Email-Notifications.md)
- UI: skill [`ui-ux-pro-max`](../ui-ux-pro-max/SKILL.md), skill [`shadcn`](../shadcn/SKILL.md)
- Backend: skill [`backend-api-pro`](../../../backend/.agents/skills/backend-api-pro/SKILL.md), skill [`nestjs-best-practices`](../../../backend/.agents/skills/nestjs-best-practices/SKILL.md)
