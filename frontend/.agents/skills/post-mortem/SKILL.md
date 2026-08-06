---
name: post-mortem
description: >-
  Write the canonical engineering record of a fixed dtrs-app bug with a
  full-stack / UI + Next seam lens (pages, JobsList, NextAuth, unwrapApiData,
  /job-images proxy). Use after debug-mantra lands a validated fix, before
  closing the ticket or GitLab MR. Trigger when the user asks for post-mortem,
  RCA, root cause writeup, or to document/close out a fixed bug. For
  Nest/Prisma/MinIO-only RCA with no UI surface, prefer
  backend/.agents/skills/post-mortem.
license: Internal project skill (no external redistribution terms)
---

# Post-mortem (frontend / full-stack)

The canonical engineering record of a bug fix in **CCTV Maintenance System (dtrs-app)**, written from the **UI → Next route → Nest** seam. Stack: Next.js 15 App Router + NextAuth + shadcn/ui. Written **after** debugging lands a real fix, **for** other engineers (and future-you). Code identifiers are welcome.

Pair with skill **`debug-mantra`** (this folder): mantra steps 1–4 must be satisfied before drafting; the step-4 breadcrumb ledger feeds **How it was found**. Optional before drafting: skill **`scrutinize`** on the fix (static review, not a substitute for validation). Load **`ui-ux-pro-max`** + **`shadcn`** when the fix touched dashboard/public UI.

Twin skill (Nest/Prisma/MinIO-only, no UI surface): [`backend/.agents/skills/post-mortem/SKILL.md`](../../../../backend/.agents/skills/post-mortem/SKILL.md). Same 9-block template — do not invent a second format.

## When to invoke

- `/post-mortem` or "write the post-mortem / postmortem / RCA / root-cause analysis"
- "document this fix" / "write up the root cause" / "close out this bug with a writeup"
- After a debug session has clearly landed a **validated** fix — offer to draft one.
- Prefer **this** copy when the fail path started in a page, layout, client fetch, NextAuth, or Next route handler (`src/app/api/**`, `/job-images/**`, `/user-images/**`, `/api/print-jobs/**`).

## When NOT to use

- **Bug not fixed yet, or fix not validated.** Refuse and state what's missing. Point back to **`debug-mantra`**.
- **Production outage / incident** needing timeline, blast radius, paging, comms. This skill is **bug-fix scope** only. Confirm with the user before using this template for incidents.
- **Trivial fix** (typo, copy, one-line class tweak with no mechanism). The GitLab MR description is enough.
- **Plan / design stress-test before coding** → **`grilling`**. **PR review before merge** → **`scrutinize`**.
- **Pure backend RCA** (DTO/Guard/Prisma/MinIO server only, no page/proxy change) → backend **`post-mortem`**.

## Output language

- Draft to the **user: ภาษาไทย** (technical terms, file paths, permission codes, env names stay English).
- Skill body stays English for consistency with other project skills.

## Required inputs — refuse to draft without these

Confirm all four before writing. If any are missing, list gaps and stop:

- [ ] **Reliable repro** exists (browser steps and/or Postman; next person can run it).
- [ ] **Root cause is known** (mechanism identified, not a hypothesis).
- [ ] **Fix is identified** (GitLab MR / commit / branch pointer).
- [ ] **Fix is validated** (original repro passes; backend test green if any; **manual UI path succeeds**).

Maps to `debug-mantra` steps 1–4.

> Frontend has **no** Jest/Playwright in `package.json`. Do not invent a green frontend unit run. Validation is browser + optional backend contract test.

## Structure

Use these blocks **in this order**. **Summary, Root cause, Fix, and Validation are mandatory.**

### 1. Summary _(mandatory)_

One paragraph: what broke (user/workload terms), what fixed it (one sentence). **Flow + layer + env:**

| Signal | Flow |
|--------|------|
| `/public/report`, `/report` | Public report |
| `/public/status`, `/status` | Public status |
| `/login` | Auth / NextAuth |
| `/dashboard/pending`, `JobsList` | Pending queue |
| `/dashboard/in-progress`, `/dashboard/my-jobs` | Fix / my jobs |
| `/dashboard/all`, `/dashboard/out-of-contract` | History / OOC |
| `/dashboard/jobs/[id]` | Job detail |
| `/print/jobs/[id]` | Print / PDF |
| `/dashboard/settings`, `/dashboard/roles`, `/dashboard/users`, `/dashboard/sites`, `/dashboard/profile` | Admin / RBAC / sites |
| `/job-images`, `/user-images`, `ManagedImage` | Images |
| `NotificationsBell`, Socket.IO | Realtime |

**Layer:** `frontend` | `next-route-handler` | `nest-api` | `prisma` | `minio` | `smtp` | `socket.io`

**Env:** local `:3000`+`:4100` / Docker `8404`+`8405` / UAT (`staging`) / PRD (`https://dtrs-app.forth.co.th`)

Ticket / GitLab issue, MR `!N`, owner. Reader stopping here should have the right answer.

### 2. Symptom

What the **user saw** first — blank sidebar, button missing, modal behind header, broken `<img>`, toast/error near the field, public form reject. Then Network: status, URL (`/api/**` vs `/job-images/**` vs `/api/auth/**`), and whether Nest was hit. Concrete identifiers (`ticketNo`, `jobId`, permission code, route). **Redact** phone numbers, addresses, tokens.

### 3. Root cause _(mandatory)_

The actual bug mechanism. **Frontend identifiers expected** — page/component, hook, `unwrapApiData`, NextAuth `authorize()`, route handler, env **names**. Walk the cause chain:

`page / layout / JobsList` → `clientApiBase` / `serverApiBase` → `next-route-handler` (if any) → `nest-api`

Name the contract that was violated when relevant:

- Nest `ResponseInterceptor` → `{ success, data }` vs missing [`unwrapApiData()`](../../src/lib/apiResponse.ts)
- `GET /roles/me/permissions` → must unwrap `data.permissions` in [`DashboardLayoutShell`](../../src/components/DashboardLayoutShell.tsx)
- Public `/public/**` vs dashboard JWT (Bearer from NextAuth session in [`src/lib/auth.ts`](../../src/lib/auth.ts))
- Reverse proxy: `/api/auth`, `/api/print-jobs`, `/api/job-images` → Next **8404**; `/api/` + `/socket.io` → Nest **8405**
- Image proxy: [`src/app/api/job-images/...`](../../src/app/api/job-images/[id]/[kind]/[index]/route.ts) / `user-images` — not under `/api` on the browser path `/job-images/...`
- Socket.IO base = API origin **without** `/api` suffix
- Shared hosts edited for a page-local bug: `JobsList`, `DashboardLayoutShell`, `CrudModal`

### 4. Why it produced the symptom

Link root cause to what the user saw (often non-obvious — e.g. wrapper JSON → empty permission list → sidebar falls back to role enum → wrong menus; or modal `z-index` under header `z-50`).

### 5. Fix _(mandatory)_

What changed and **why it addresses the root cause**, not the symptom. Link MR/commit. Name prior attempts that papered over the symptom (hardcoded role in sidebar, opening MinIO public read, bypassing `unwrapApiData`, custom markup instead of `@/components/ui/*`).

If UI changed, note DoD briefly: Dark Glass + No-Card (except Dashboard Overview), `form-input-glass` on dashboard, `CrudModal`/`Dialog` `z-100`, Lucide not emoji.

### 6. How it was found

Short debugging path for the next debugger:

- Repro: browser steps (URL, role, permission), viewport if layout-related (375 / 768 / 1024 / 1440).
- Tools: DevTools Network (compare `/api/**` vs `/job-images/**` vs `/api/auth/**`), React DevTools, `[DBG-xxxx]` in page/handler, Nest direct vs Next proxy.
- Hypotheses rejected (one line each) — from breadcrumb ledger.
- Single experiment that confirmed the cause.

### 7. Why it slipped through

Blameless — describe the **gap**, not the person. Common on the **frontend seam**:

- Assumed unwrapped array/object; missed `unwrapApiData()` / `data.permissions`.
- Sidebar fallback by role hid a 403 / empty permission list.
- Wrong permission code in UI (`job.assign` vs `job.fix.self|any` vs `menu.*`) vs `PermissionsGuard`.
- Public reporter expected or leaked `image` URL / phone PII.
- Edited `JobsList` / `DashboardLayoutShell` / `CrudModal` for a one-page bug.
- Dashboard used `.form-input` (light) instead of `form-input-glass`; modal under header (`z-50` vs `z-100`).
- NextAuth / `NEXTAUTH_URL` mismatch; client used `NEXT_PUBLIC_API_BASE_URL` from server code (hairpin) instead of `API_INTERNAL_BASE_URL`.
- Socket.IO pointed at `.../api` and never connected.
- `/job-images` or `/user-images` not in reverse proxy → Next.
- No CI UI test (no Playwright/Jest) — only backend contract covered, or neither.
- Incomplete prior fix (hide the button instead of fixing unwrap / Guard).

Also list backend/infra gaps when they are part of the chain (MinIO fetch URL, CORS `ALLOWED_ORIGINS`, seed permissions).

### 8. Validation _(mandatory)_

Concrete evidence the fix works. Be honest about scope.

**UI (required if a page changed)**

- Manual browser path: role + permission + URL. Disable-during-async, error near the field, `aria-label` on icon-only if touched.
- Viewports if layout/CSS: 375 / 768 / 1024 / 1440 — no horizontal scroll, content not under fixed header.
- Public vs dashboard: confirm public still has no reporter `image` URL / no JWT leak.

**Seam / API**

- Network: wrapped `{ success, data }` is unwrapped in UI; 401/403 behave as designed.
- Optional Postman: [`backend/postman/CCTV-Maintenance-API.postman_collection.json`](../../../../backend/postman/CCTV-Maintenance-API.postman_collection.json) or print/image collection + [`PRINT-PDF-DEBUG.md`](../../../../backend/postman/PRINT-PDF-DEBUG.md).
- Optional backend: `cd backend && npm test -- <pattern>` — only if a contract test was added.

**Env matrix:** local (`:3000`+`:4100`) vs Docker (`8404`/`8405`) vs UAT vs PRD — state which were actually re-run.

Example honesty: *"Validated sidebar on Technician + Admin at 1440 and 375 local; UAT/PRD not re-run. No frontend automated test exists."*

Terminal test commands require **user approval** per [`AGENTS.md`](../../../../AGENTS.md).

### 9. Action items / follow-ups

What + owner + tracking artifact. Frontend-shaped examples:

- Keep the check **page-local** vs document why a shared host changed.
- Note in [`AGENTS.md`](../../../../AGENTS.md) / skill **`shadcn`** if a primitive rule was missing.
- Backend contract test so the unwrap/permission combo cannot regress without CI (frontend has no e2e runner).
- Seed / RBAC doc: [`backend/docs/RBAC-Setup.md`](../../../../backend/docs/RBAC-Setup.md).
- Image/proxy: [`docs/Project-Plan-Private-MinIO-Images.md`](../../../../docs/Project-Plan-Private-MinIO-Images.md).

If none: *"None — the fix is sufficient and no class-of-bug follow-up is warranted."*

## Tone

- Engineer-to-engineer; **code identifiers are first-class.**
- Mechanism over narrative — which page/guard/proxy under which env.
- Active voice, short paragraphs, **no hedging** ("we believe", "may have").
- **Blameless** — gaps and bugs, not people.
- **No advocacy** in the post-mortem; refactors belong in action items as separate tickets.

## DTRS output flow

1. **Confirm all four required inputs.** Missing → list and stop.
2. **Confirm destination** (default: **GitLab MR description** section or comment). Also valid:
   - [`docs/postmortems/<ticket-or-slug>.md`](../../../../docs/postmortems/) in repo (no secrets)
   - Paste in chat for review only
   - **Not default:** external JIRA/wiki — only if user requests; agent does not POST to external systems without explicit approval and credentials.
3. **Produce draft** as a single markdown block (Thai prose + English identifiers).
4. **Sign-off:** show draft; user says *"post it"* / *"go ahead"* / *"commit"* before adding to MR or writing `docs/postmortems/`.
5. **Secrets / PII:** never include JWT, `access_token`, `NEXTAUTH_SECRET`, SMTP passwords, MinIO keys, `Authorization`, full phone numbers, addresses, or image payloads. Use redacted ids (`jobId=…`, `ticketNo=TKxxxx`, phone `08x-xxx-xxxx`). Env **names** only — values as `***`.

## Worked example — empty sidebar after login (illustrative)

> **Summary.** หลัง login แดชบอร์ดโชว์เมนูไม่ครบ / ว่าง เพราะ UI อ่าน `GET /roles/me/permissions` โดยไม่ `unwrapApiData()` จึงได้ wrapper แทน `permissions[]` แล้วตกไป sidebar fallback ตาม role enum. Flow: **RBAC / layout** · layer `frontend` · env **local**. แก้ที่ [`DashboardLayoutShell.tsx`](../../src/components/DashboardLayoutShell.tsx) ให้ unwrap `data.permissions`. MR !55, owner (team).
>
> **Symptom.** Login ด้วย role ที่มี `menu.pending` ใน seed แต่ sidebar ไม่มี Pending. Network: `GET /api/roles/me/permissions` → 200 body `{ success: true, data: { permissions: ["menu.pending", ...] } }`. ไม่มี 403.
>
> **Root cause.** Client treat response as `{ permissions }` โดยตรง. [`unwrapApiData`](../../src/lib/apiResponse.ts) ไม่ถูกเรียกใน layout. Fallback ใน `DashboardLayoutShell` ใช้ enum role เมื่อ list ว่าง → เมนูไม่ตรง seed.
>
> **Why it produced the symptom.** `permissions` เป็น `undefined` → length 0 → fallback path. ผู้ใช้เห็น “สิทธิ์หาย” ทั้งที่ API ถูก.
>
> **Fix.** MR !55: unwrap ก่อนใช้ list; ไม่ hardcode role ใน sidebar. ไม่แก้ `PermissionsGuard`.
>
> **How it was found.** Repro: login Admin vs Technician บน `:3000`. Hypothesis "seed ผิด" ถูก disprove ด้วย Postman ตรง Nest `:4100` (permissions ครบ). Hypothesis "NextAuth session หมด" ถูก disprove เพราะ `GET /jobs` 200. Confirmed ใน Network preview ว่า UI log ได้ wrapper object. Ledger: `[DBG-perm]` ใน layout พิมพ์ raw vs unwrapped.
>
> **Why it slipped through.** ไม่มี frontend e2e; รีวิวดูหน้าตา sidebar จาก fallback จึงผ่านบนเครื่อง dev ที่ role ตรงเมนูตั้งต้น; contract `{ success, data }` ไม่มี regression test ฝั่ง UI.
>
> **Validation.** Manual: Admin + Technician local 1440 และ 375 — เมนูตรง seed, focus/contrast ไม่เปลี่ยน. Postman permissions 200 ไม่เปลี่ยน. UAT/PRD ไม่ได้รันซ้ำ. ไม่มี frontend automated test.
>
> **Action items.**
> - เพิ่ม backend/e2e หรือ note ใน RBAC doc ว่า UI ต้อง unwrap `data.permissions`. (owner, ticket TBD.)
> - ไม่ขยาย `DashboardLayoutShell` สำหรับบั๊กหน้าอื่นโดยไม่จำเป็น.

## Rules

- **Refuse without all four inputs.**
- **Never invent** root cause, owners, validation runs, frontend test results, or action items.
- **Never strip code identifiers** in the engineering record.
- **Blameless**; **honest validation scope** (especially: no Playwright/Jest on frontend).
- **One iteration is normal**; on third vague revision pass, ask which section is wrong.
- Follow [`AGENTS.md`](../../../../AGENTS.md) Security Gate, UI DoD, and path restriction. Do not log or commit secrets.

## Skill routing (dtrs-app)

| Situation | Skill / action |
|-----------|----------------|
| Active debugging | **`debug-mantra`** (this folder — full-stack) |
| After validated fix — write RCA (UI / Next seam) | **`post-mortem`** (this) |
| Nest/Prisma/MinIO-only RCA | backend **`post-mortem`** |
| Review fix **before merge** | **`scrutinize`** → optional **`review-bugbot`** / **`review-security`** |
| Stress-test plan **before** coding | **`grilling`** |
| UI primitives / a11y | **`ui-ux-pro-max`** + **`shadcn`** |

**Recommended close-out:** `debug-mantra` → fix → validate (browser) → optional **`scrutinize`** → **`post-mortem`** → user approves destination → commit/MR when requested

## อ้างอิง

- ก่อนเขียน: skill [`debug-mantra`](../debug-mantra/SKILL.md)
- Review fix ก่อน merge: skill [`scrutinize`](../scrutinize/SKILL.md)
- Twin (API-only): [`backend/.agents/skills/post-mortem/SKILL.md`](../../../../backend/.agents/skills/post-mortem/SKILL.md)
- Guardrails + UI DoD: [`AGENTS.md`](../../../../AGENTS.md)
- ภาพรวม: [`README.md`](../../../../README.md), [`STATUS.md`](../../../../STATUS.md)
- ดัชนี docs: [`docs/README.md`](../../../../docs/README.md)
- ปลายทางไฟล์: [`docs/postmortems/`](../../../../docs/postmortems/)
- Unwrap / auth: [`src/lib/apiResponse.ts`](../../src/lib/apiResponse.ts), [`src/lib/auth.ts`](../../src/lib/auth.ts), [`src/lib/clientApiBase.ts`](../../src/lib/clientApiBase.ts), [`src/lib/serverApiBase.ts`](../../src/lib/serverApiBase.ts)
- RBAC: [`backend/docs/RBAC-Setup.md`](../../../../backend/docs/RBAC-Setup.md)
- MinIO: [`minio.md`](../../../../minio.md), [`docs/Project-Plan-Private-MinIO-Images.md`](../../../../docs/Project-Plan-Private-MinIO-Images.md)
- อีเมล: [`docs/Email-Notifications.md`](../../../../docs/Email-Notifications.md)
- Reverse proxy: [`backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md`](../../../../backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md)
- UI: skill [`ui-ux-pro-max`](../ui-ux-pro-max/SKILL.md), skill [`shadcn`](../shadcn/SKILL.md)
