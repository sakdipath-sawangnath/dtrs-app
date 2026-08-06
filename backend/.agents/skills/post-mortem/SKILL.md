---
name: post-mortem
description: >-
  Write the canonical engineering record of a fixed dtrs-app bug with a
  Nest/Prisma/MinIO + API lens. Use after debug-mantra lands a validated fix,
  before closing the ticket or GitLab MR. Trigger when the user asks for
  post-mortem, RCA, root cause writeup, or to document/close out a fixed bug.
  For UI / NextAuth / unwrapApiData / page-level RCA, prefer
  frontend/.agents/skills/post-mortem.
license: Internal project skill (no external redistribution terms)
---

# Post-mortem

The canonical engineering record of a bug fix in **CCTV Maintenance System (dtrs-app)** — Next.js 15 frontend + NestJS 11 backend + Prisma + MinIO. Written **after** debugging lands a real fix, **for** other engineers (and future-you). Code identifiers are welcome — this artifact lets the next person recover the mental model fast.

Pair with skill **`debug-mantra`**: mantra steps 1–4 must be satisfied before drafting; the step-4 breadcrumb ledger feeds **How it was found**. Optional before drafting: skill **`scrutinize`** on the fix + tests (static review, not a substitute for validation).

Twin skill (UI / Next seam / full-stack): [`frontend/.agents/skills/post-mortem/SKILL.md`](../../../../frontend/.agents/skills/post-mortem/SKILL.md). Same 9-block template — do not invent a second format.

## When to invoke

- `/post-mortem` or "write the post-mortem / postmortem / RCA / root-cause analysis"
- "document this fix" / "write up the root cause" / "close out this bug with a writeup"
- After a debug session has clearly landed a **validated** fix — offer to draft one.

## When NOT to use

- **Bug not fixed yet, or fix not validated.** Refuse and state what's missing. Point back to **`debug-mantra`**.
- **Production outage / incident** needing timeline, blast radius, paging, comms. This skill is **bug-fix scope** only. Confirm with the user before using this template for incidents.
- **Trivial fix** (typo, obvious one-liner, copy tweak). The GitLab MR description is enough.
- **Plan / design stress-test before coding** → **`grilling`**. **PR review before merge** → **`scrutinize`**.

## Output language

- Draft to the **user: ภาษาไทย** (technical terms, file paths, permission codes, env names stay English).
- Skill body stays English for consistency with other project skills.

## Required inputs — refuse to draft without these

Confirm all four before writing. If any are missing, list gaps and stop:

- [ ] **Reliable repro** exists (deterministic or high-rate flake repro the next person can run).
- [ ] **Root cause is known** (mechanism identified, not a hypothesis).
- [ ] **Fix is identified** (GitLab MR / commit / branch pointer).
- [ ] **Fix is validated** (original repro passes; failing test green; manual / Postman path succeeds).

Maps to `debug-mantra` steps 1–4.

## Structure

Use these blocks **in this order**. **Summary, Root cause, Fix, and Validation are mandatory.**

### 1. Summary _(mandatory)_

One paragraph: what broke (user/workload terms), what fixed it (one sentence). **Flow + layer + env:** public report / status / auth / jobs / RBAC / MinIO / PDF / email / Socket.IO / CI-deploy. Env: local / Docker `8404`+`8405` / UAT (`staging` → `.115`) / PRD (`https://dtrs-app.forth.co.th`). Ticket / GitLab issue, MR `!N`, owner. Reader stopping here should have the right answer.

### 2. Symptom

What was observed — HTTP status, Nest error body, Next proxy 502, UI behavior, log line, Postman result. Concrete identifiers (`ticketNo`, `jobId`, permission code, route). Don't paraphrase the failure mode. **Redact** phone numbers, addresses, tokens.

### 3. Root cause _(mandatory)_

The actual bug mechanism. **Code identifiers expected** — files, functions, branch conditions, DTO fields, Prisma fields, env names (not values). Walk the cause chain end-to-end across layers:

`frontend` → `next-route-handler` → `nest-api` → `prisma` / `minio` / `smtp` / `socket.io`

Name the contract that was violated when relevant, e.g.:

- Nest `ResponseInterceptor` → `{ success, data }` vs missing `unwrapApiData()`
- Public `/public/**` vs JWT dashboard routes
- Reverse proxy: `/api/auth`, `/api/print-jobs`, `/api/job-images` → Next **8404**; `/api/` + `/socket.io` → Nest **8405**
- `PermissionsGuard` vs UI `GET /roles/me/permissions`
- `MINIO_PUBLIC_URL` (browser) vs `MINIO_SERVER_FETCH_BASE_URL` (Nest/Next server fetch)

### 4. Why it produced the symptom

Link root cause to symptom (often non-obvious — e.g. bug in Next image proxy, failure visible only as broken `<img>` on job detail; or RBAC list empty so sidebar falls back to role enum).

### 5. Fix _(mandatory)_

What changed and **why it addresses the root cause**, not the symptom. Link MR/commit. Name prior fix attempts that papered over the symptom, if any (e.g. opening MinIO public read, hardcoding a role in the sidebar).

### 6. How it was found

Short debugging path for the next debugger:

- Repro that made it deterministic (Postman folder, `npm test -- <pattern>`, browser steps, Docker vs local).
- Tools: debugger (`npm run start:debug`), source trace, knob enumeration, `[DBG-xxxx]` instrumentation (`debug-mantra` step 2).
- Hypotheses rejected (one line each) — from breadcrumb ledger. Always note whether Nest was hit **direct** vs via Next proxy.
- Single experiment that confirmed the cause.

### 7. Why it slipped through

Blameless — describe the **gap**, not the person. Common in dtrs-app:

- Frontend assumed unwrapped array/object; missed `unwrapApiData()` / `data.permissions`.
- UI visible (sidebar fallback by role) but API 403 (`PermissionsGuard` / missing seed).
- Wrong permission code (`job.assign` vs `job.fix.self|any` vs `menu.*`).
- Public reporter path leaked or expected `image` URL (public must not).
- Next proxy vs Nest direct: local `localhost:4100` worked; Docker/PRD hairpin failed without `API_INTERNAL_BASE_URL`.
- MinIO: browser URL vs server-side fetch (`MINIO_PUBLIC_URL` vs `MINIO_SERVER_FETCH_BASE_URL`); `MINIO_ENSURE_PUBLIC_READ_POLICY` left true.
- Reverse proxy: `/job-images` or `/socket.io` not forwarded to the right upstream.
- PDF: Puppeteer/`PUPPETEER_EXECUTABLE_PATH` / `CHROME_BIN` missing on runner; print data timeout.
- Job dates: `reportDate` / `fixDate` timezone Bangkok vs UTC; serial multi-row JSON in `oldSerialNumber`.
- Workflow: `PENDING` → `IN_PROGRESS` → `RESOLVED` (+ reopen); `assignedToId` null vs assigned; `isOutOfContract`.
- CI/deploy: wrong backend entry (`dist/main.js` instead of `dist/src/main.js`); `ALLOWED_ORIGINS` / `NEXTAUTH_URL` mismatch; group-A validate skipped.
- No backend test on the status / role / permission combo; frontend has **no** Jest/Playwright — UI path untested in CI.
- Incomplete prior fix (symptom-only guard).

### 8. Validation _(mandatory)_

Concrete evidence the fix works:

- Backend unit / e2e: `cd backend && npm test -- <pattern>` or `npm run test:e2e` (supertest).
- API manual: [`postman/CCTV-Maintenance-API.postman_collection.json`](../../postman/CCTV-Maintenance-API.postman_collection.json) or [`postman/CCTV-Print-PDF-Debug.postman_collection.json`](../../postman/CCTV-Print-PDF-Debug.postman_collection.json) + [`postman/PRINT-PDF-DEBUG.md`](../../postman/PRINT-PDF-DEBUG.md).
- UI manual: browser checklist (frontend has no Jest/Playwright). Note viewport if UI-related (375 / 768 / 1024 / 1440).
- Env matrix: local (`:3000` + `:4100`) vs Docker (`8404`/`8405`) vs UAT vs PRD — state which were actually re-run.

State coverage honestly — e.g. *"Validated job-detail image proxy on Docker local; PRD MinIO path not re-run."*

Terminal test commands require **user approval** per [`AGENTS.md`](../../../../AGENTS.md).

### 9. Action items / follow-ups

What + owner + tracking artifact. Examples: regression test in `backend/src/**/*.spec.ts`, Postman example, note in [`docs/Project-Plan-Private-MinIO-Images.md`](../../../../docs/Project-Plan-Private-MinIO-Images.md) / [`backend/docs/RBAC-Setup.md`](../../docs/RBAC-Setup.md) / [`docs/Email-Notifications.md`](../../../../docs/Email-Notifications.md), seed `seed-roles-permissions.ts`, GitLab CI validate step, guardrail in `AGENTS.md`.

If none: *"None — the fix is sufficient and no class-of-bug follow-up is warranted."*

## Tone

- Engineer-to-engineer; **code identifiers are first-class.**
- Mechanism over narrative — which layer/route/guard under which env.
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

## Worked example — PRD job image 502 (illustrative)

> **Summary.** รูปงานบน job detail ที่ PRD (`https://dtrs-app.forth.co.th`) แตกเป็น 502 เพราะ Next/Nest ฝั่ง server ดึง object ผ่าน `MINIO_PUBLIC_URL` ที่ host PRD เข้าไม่ถึง. Flow: **Images / MinIO** · layer `next-route-handler` + `nest-api` + `minio` · env **PRD**. แก้โดยให้ server fetch ใช้ `MINIO_SERVER_FETCH_BASE_URL` และคง `MINIO_PUBLIC_URL` ไว้สำหรับ browser ถ้าจำเป็น. MR !42, owner (team).
>
> **Symptom.** `/dashboard/jobs/[id]` โหลดรูปไม่ขึ้น. Network: `GET /job-images/:jobId/before/0` → 502. Nest upstream `GET /api/jobs/:id/image/before/0` ก็ 502. Local `:3000`+`:4100` ผ่าน. `ticketNo` / `jobId` ใน repro (redacted).
>
> **Root cause.** [`frontend/src/app/api/job-images/[id]/[kind]/[index]/route.ts`](../../../../frontend/src/app/api/job-images/[id]/[kind]/[index]/route.ts) และ Nest image handler ใช้ public MinIO base สำหรับ server-side GET. บน PRD ค่า `MINIO_PUBLIC_URL` ชี้ endpoint ที่ container/host นี้ route ไม่ถึง (LAN / hairpin). ไม่มี `MINIO_SERVER_FETCH_BASE_URL`. ดู [`docs/Project-Plan-Private-MinIO-Images.md`](../../../../docs/Project-Plan-Private-MinIO-Images.md), [`minio.md`](../../../../docs/minio.md).
>
> **Why it produced the symptom.** Browser เรียก Next proxy (`/job-images/...` ไม่ได้อยู่ใต้ `/api`) → Next เรียก Nest → Nest/MinIO client GET object ล้ม → 502 กลับทั้งสาย. Local MinIO อยู่บนเครือข่ายเดียวกันจึงไม่โผล่.
>
> **Fix.** MR !42: แยก knob — server fetch อ่าน `MINIO_SERVER_FETCH_BASE_URL` (เช่น internal Docker/LAN URL) คู่กับ `MINIO_PUBLIC_URL`. ไม่เปิด `MINIO_ENSURE_PUBLIC_READ_POLICY`. ไม่ส่ง `image` URL ออก public reporter.
>
> **How it was found.** Repro: เปิด job ที่มีรูปบน PRD vs local. Hypothesis "object หายจาก bucket" ถูก disprove ด้วย Postman HEAD ตรง MinIO จากเครื่องที่เข้าถึงได้. Hypothesis "JWT หมดอายุ" ถูก disprove เพราะ `GET /jobs/:id` 200. Confirmed โดยเทียบ env ชื่อ `MINIO_*` ระหว่าง local กับ PRD และยิง Nest ตรง `:4100` vs ผ่าน Next. Ledger: `[DBG-… ]` ที่ image route โชว์ base URL ที่ใช้ตอน fetch.
>
> **Why it slipped through.** Local/UAT ไม่ได้จำลอง PRD network partition ไปยัง MinIO public endpoint; ไม่มี e2e ที่ assert รูปผ่าน proxy; checklist deploy ยังไม่บังคับคู่ `MINIO_PUBLIC_URL` + `MINIO_SERVER_FETCH_BASE_URL`.
>
> **Validation.** Postman `CCTV-Print-PDF-Debug` image step ผ่านบน Docker local (`8404`/`8405`). Manual job detail บน local ผ่าน. PRD re-check หลัง deploy (user-confirmed). ไม่ได้ re-run PDF print path.
>
> **Action items.**
> - ใส่คู่ตัวแปรใน [`docs/GitLab-CI-Variables-Checklist.md`](../../../../docs/GitLab-CI-Variables-Checklist.md) กลุ่ม MinIO. (owner, MR !42.)
> - เพิ่ม backend test ที่ mock MinIO GET fail → 502 mapping. (ticket TBD.)

## Rules

- **Refuse without all four inputs.**
- **Never invent** root cause, owners, validation runs, or action items.
- **Never strip code identifiers** in the engineering record.
- **Blameless**; **honest validation scope.**
- **One iteration is normal**; on third vague revision pass, ask which section is wrong.
- Follow [`AGENTS.md`](../../../../AGENTS.md) Security Gate and path restriction. Do not log or commit secrets.

## Skill routing (dtrs-app)

| Situation | Skill / action |
|-----------|----------------|
| Active debugging | **`debug-mantra`** |
| After validated fix — write RCA | **`post-mortem`** (this) |
| Review fix + tests **before merge** | **`scrutinize`** → optional **`review-bugbot`** / **`review-security`** |
| Stress-test plan **before** coding | **`grilling`** |
| UI / API domain rules | **`ui-ux-pro-max`** + **`shadcn`** / **`backend-api-pro`** + **`nestjs-best-practices`** |

**Recommended close-out:** `debug-mantra` → fix → validate → optional **`scrutinize`** → **`post-mortem`** → user approves destination → commit/MR when requested

## อ้างอิง

- ก่อนเขียน: skill [`debug-mantra`](../debug-mantra/SKILL.md)
- Review fix ก่อน merge: skill [`scrutinize`](../scrutinize/SKILL.md)
- Guardrails: [`AGENTS.md`](../../../../AGENTS.md)
- ภาพรวม: [`README.md`](../../../../README.md), [`STATUS.md`](../../../../STATUS.md)
- ดัชนี docs: [`docs/README.md`](../../../../docs/README.md)
- ปลายทางไฟล์: [`docs/postmortems/`](../../../../docs/postmortems/)
- RBAC: [`docs/RBAC-Setup.md`](../../docs/RBAC-Setup.md)
- API / Postman: [`docs/api-endpoints.json`](../../docs/api-endpoints.json), [`postman/README.md`](../../postman/README.md)
- MinIO: [`minio.md`](../../../../docs/minio.md), [`docs/Project-Plan-Private-MinIO-Images.md`](../../../../docs/Project-Plan-Private-MinIO-Images.md)
- อีเมล: [`docs/Email-Notifications.md`](../../../../docs/Email-Notifications.md)
- Reverse proxy: [`docs/Reverse-Proxy-Nginx-Proxy-Manager.md`](../../docs/Reverse-Proxy-Nginx-Proxy-Manager.md)
- CI: [`.gitlab-ci.yml`](../../../../.gitlab-ci.yml), [`docs/GitLab-CI-Plan.md`](../../../../docs/GitLab-CI-Plan.md)
- UI: skill [`ui-ux-pro-max`](../../../../frontend/.agents/skills/ui-ux-pro-max/SKILL.md), skill [`shadcn`](../../../../frontend/.agents/skills/shadcn/SKILL.md)
- Backend: skill [`backend-api-pro`](../backend-api-pro/SKILL.md), skill [`nestjs-best-practices`](../nestjs-best-practices/SKILL.md)
