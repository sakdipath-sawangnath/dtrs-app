---
name: debug-mantra
description: >-
  Four-mantra debugging discipline for CCTV Maintenance System (dtrs-app) —
  reproduce, trace the fail path, falsify the hypothesis, cross-reference every
  breadcrumb. Apply in order before proposing any fix. Trigger on /debug-mantra
  and proactively whenever debugging starts — user reports a bug, says something
  is broken/throwing/failing, asks to debug/diagnose/investigate, or pastes a
  stack trace or error log.
license: Internal project skill (no external redistribution terms)
---

# Debug Mantra

Four-step discipline for any debug session in **CCTV Maintenance System (dtrs-app)** — Next.js 15 frontend + NestJS 11 backend + Prisma + MinIO. Internalize the mantra, then apply in order. After the four steps, use the **DTRS addendum** below for flow-specific repro and knobs.

## Mantra (internal — do not paraphrase)

> **Mantra:**
> 1. **First is reproducibility.** Can the issue be reproduced reliably?
> 2. **Know the fail path.** Debugger first; then source trace + knob enumeration; then in-code instrumentation.
> 3. **Question your hypothesis.** What would disprove it?
> 4. **Every run is a breadcrumb.** Cross-reference all of them.

## How to open a debug session (user-facing)

- **Default** (bug report, stack trace, "ไม่ work"): Apply all four steps silently. In the first response, use **one short line** only — e.g. "เริ่มจาก repro ก่อน" — then begin work. Do **not** paste the full mantra block unless asked.
- **`/debug-mantra`**: Recite the mantra block **verbatim** as the first thing in the response, then begin work.
- **User says "skip the mantra"**: Skip any recital; still apply all four steps silently.

---

## 1. Reproduce reliably

Build a runnable repro before anything else.

- **Reliable repro** → capture the exact steps, inputs, and environment as a runnable artifact: failing test, curl/Postman request, CLI invocation, replay harness.
- **Flaky repro** → the bug is not yet debuggable. Raise the rate first: loop the trigger, parallelise, add stress, narrow timing windows, inject sleeps. 50% flake is debuggable; 1% is not.
- **No repro at all** → stop. Say so explicitly. Ask the user for env access, captured artifacts (HAR, log dump, screenshot), or permission to instrument. Do **not** proceed to hypothesise.

Target: a fast (1–5 s), deterministic pass/fail signal. Pin time, seed the RNG, freeze network, isolate filesystem.

## 2. Know the fail path

Once reproducible, find *where* the code breaks and *what stops it from breaking*. The differential narrows the search. Try in this order — escalate only when the prior tactic fails.

1. **Attach a debugger.** If the env supports it, attach and step to the failure site. One breakpoint beats ten logs. Do this **before** turning any knobs.
   - Backend: `npm run start:debug` in `backend/` (Nest `--debug --watch`)
   - Backend tests: `npm run test:debug` in `backend/`
2. **Source trace + knob enumeration.** If no debugger (or it can't reach the bug), trace the code path end-to-end and list every knob that can influence the outcome:
   - config flags, env vars, feature toggles
   - branch conditions, input shape
   - timing, concurrency, build options
   Each knob is a candidate axis to flip in the differential. Flip one at a time.
3. **In-code instrumentation.** If outside knobs can't move the failure, go inside: log statements at the suspected fail site, dump the relevant internal state. Tag every probe with a unique prefix (e.g. `[DBG-a4f2]`) so cleanup is a single grep. Let the trace show where reality diverges from your model.

## 3. Falsify the hypothesis

When a candidate root cause surfaces, scrutinise it **before** testing it.

- Does it actually explain the symptom end-to-end? Walk it through.
- What is the simplest **proof**? What is the cleanest **disproof**?
- Run the **disproof first**. If the hypothesis survives, it's real. If it dies, you saved yourself from chasing a phantom.
- Generate 3–5 ranked hypotheses, not one. Single-hypothesis thinking anchors on the first plausible idea.

## 4. Every run is a breadcrumb

Maintain a running **ledger** of every experiment in this session. Each entry: what changed, what happened, what it ruled in or out.

- When a new hypothesis surfaces, walk the ledger. Does it hold for **every** prior observation, not just the most recent?
- If any past run contradicts it, the hypothesis is wrong or incomplete — refine or discard.
- When in doubt, design the **single experiment** whose outcome makes it certain. Run that next, instead of churning on adjacent runs.
- Update the ledger after every run. It is your memory across the session.

---

## Operating rules

- Recite the mantra block **once** per debug session only when the user invokes `/debug-mantra`. Otherwise keep it internal.
- Recite **verbatim** when `/debug-mantra` is used. Never paraphrase, shorten, or skip lines of the recital.
- If the user says "skip the mantra" → skip the recital but still apply the four steps silently.
- Apply the four steps **in order**:
  - Do not propose a fix before #1 is satisfied (reliable repro exists).
  - Do not start testing hypotheses before #2 has narrowed the fail path.
  - Do not commit to a hypothesis before #3 has tried to disprove it.
  - Do not declare a hypothesis correct until #4 confirms it against every prior breadcrumb.
- If you catch yourself proposing a fix without a reliable repro, stop and return to step 1.
- The mantra is a constraint **you** carry through the session — not advice to deliver back to the user by default.

---

## DTRS addendum (หลัง mantra — โปรเจกต์นี้เท่านั้น)

ใช้ส่วนนี้หลังครบ 4 ขั้น หรือคู่ขนานขั้น 1–2 เพื่อจำกัดขอบเขต flow / layer

### 0. กฎ repo (บังคับ)

- **Security Gate** ([`AGENTS.md`](../../../AGENTS.md)): ห้าม log / dump / commit — `JWT`, `access_token`, `NEXTAUTH_SECRET`, รหัส SMTP, `Authorization`, PII (เบอร์โทร, ที่อยู่), payload รูปเต็ม
- Instrumentation ใช้ prefix เช่น `[DBG-xxxx]` — ลบก่อน merge
- อ่าน skill พื้นฐานตาม layer ก่อนแก้:
  - Frontend UI: [`frontend/.agents/skills/ui-ux-pro-max/SKILL.md`](../../../frontend/.agents/skills/ui-ux-pro-max/SKILL.md)
  - shadcn/ui: [`frontend/.agents/skills/shadcn/SKILL.md`](../../../frontend/.agents/skills/shadcn/SKILL.md)
  - Backend API: [`backend-api-pro`](../backend-api-pro/SKILL.md)
  - NestJS: [`nestjs-best-practices`](../nestjs-best-practices/SKILL.md)

### 1. ระบุ flow + layer ก่อน reproduce

| สัญญาณ | Flow | จุดเริ่ม trace |
|--------|------|----------------|
| `/public/report`, `/report` | แจ้งปัญหา (public) | `frontend/src/app/public/report/page.tsx` → `POST /public/jobs` |
| `/public/status`, `/status` | ตรวจสอบสถานะ | `GET /public/jobs/status-by-phone`, `GET /public/jobs/status/:ticketNo` |
| `/login` | Auth | NextAuth `authorize()` → `frontend/src/lib/auth.ts` → Nest `POST /auth/login` |
| `/dashboard/pending` | คิวรอดำเนินการ | `JobsList` + RBAC `menu.pending`, `job.assign` |
| `/dashboard/in-progress`, `/dashboard/my-jobs` | งานกำลังแก้ / งานของฉัน | `PATCH /jobs/:id/fix` คง `IN_PROGRESS`; ป้าย「รอเซ็นผู้แจ้ง」เมื่อแก้ครบ; `job.fix.*`, Socket.IO refresh; อัปโหลดรูปปัญหา `PATCH /jobs/:id/issue-images` + `job.issue.upload` |
| `/dashboard/all`, `/dashboard/out-of-contract` | ประวัติ / นอกสัญญา | `Job.isOutOfContract`, `PATCH /jobs/:id/out-of-contract` |
| `/dashboard/jobs/[id]` | รายละเอียดงาน | `GET /jobs/:id`, บันทึก `PATCH /jobs/:id/fix`, ปิดงาน `PATCH /jobs/:id/close` (ลายเซ็นผู้แจ้ง), backfill วันที่, อัปโหลดรูปปัญหา (`job.issue.upload`, PENDING/IN_PROGRESS) |
| `/print/jobs/[id]`, PDF | พิมพ์รายงาน | Next `/api/print-jobs/:id/data` → Puppeteer `JobsPdfService`; รูปผ่าน `/job-images/...` |
| `/dashboard/settings` | SMTP / อีเมล / MinIO orphan | `SettingsModule`, `menu.settings` |
| `/dashboard/roles`, `/dashboard/users` | RBAC | `PermissionsGuard`, `GET /roles/me/permissions` |
| เมนูหาย / API 403 | RBAC ≠ UI | `DashboardLayoutShell` + `unwrapApiData` vs `PermissionsGuard` |
| รูปไม่ขึ้น / 502 รูป | MinIO + proxy | `/job-images/...` (Next) → Nest `GET /jobs/:id/image/...` → MinIO |
| แจ้งเตือนไม่อัปเดต | Realtime | Socket.IO (ไม่อยู่ใต้ `/api`) — `NotificationsBell`, `JobsList` |

**Ledger:** ทุก breadcrumb ระบุ layer — `frontend` | `next-route-handler` | `nest-api` | `prisma` | `minio` | `smtp` | `socket.io` — และ identifier ที่เกี่ยว (`jobId`, `ticketNo`, permission code)

### 2. Repro มาตรฐานของ DTRS

| ประเภท | แนวทาง |
|--------|--------|
| API (manual) | Postman: [`postman/CCTV-Maintenance-API.postman_collection.json`](../../postman/CCTV-Maintenance-API.postman_collection.json) — Login → ใส่ `access_token` |
| PDF / รูป | Postman: [`postman/CCTV-Print-PDF-Debug.postman_collection.json`](../../postman/CCTV-Print-PDF-Debug.postman_collection.json) + [`postman/PRINT-PDF-DEBUG.md`](../../postman/PRINT-PDF-DEBUG.md) |
| Backend unit | `cd backend && npm test -- <pattern>` หรือ `npm run test:e2e` |
| Backend debug | `npm run start:debug` / `npm run test:debug` |
| Frontend dev | `cd frontend && npm run dev` (local API ที่ `http://localhost:4100/api`) |
| Docker local | [`docker-compose.yml`](../../../docker-compose.yml) — frontend **8404**, backend **8405** |
| สคริปต์ one-off วันที่ | [`README.md`](../../README.md) § Scripts — `fix-job-dates-by-tickets`, `jobBangkokAndCorruptionFix.ts` |
| Endpoint index | [`docs/api-endpoints.json`](../../docs/api-endpoints.json), [`postman/README.md`](../../postman/README.md) |

> **หมายเหตุ:** frontend **ไม่มี** Jest/Playwright ใน `package.json` — repro UI ใช้ browser manual หรือสร้าง backend test ที่ครอบ API contract แทน

### 3. Knobs ที่มักพลาด (flip ทีละตัว)

**Env / deploy**

- `NEXT_PUBLIC_API_BASE_URL` — browser → Nest (มักลงท้าย `/api`)
- `API_INTERNAL_BASE_URL` — Next server-side / NextAuth / print proxy → Nest ใน Docker (กัน hairpin timeout)
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` — session / JWT cookie
- `ALLOWED_ORIGINS` — CORS บน Nest
- `FRONTEND_BASE_URL` — ลิงก์ในอีเมล + PDF
- `MINIO_PUBLIC_URL` + `MINIO_SERVER_FETCH_BASE_URL` — browser vs Nest fetch รูป (502 บน PRD)
- `MINIO_ENSURE_PUBLIC_READ_POLICY` — ค่าเริ่มต้น `false` (private bucket)
- `PUPPETEER_EXECUTABLE_PATH` / `CHROME_BIN` — PDF บน production
- Backend entry: `node dist/src/main.js` (ไม่ใช่ `dist/main.js`)

**API contract**

- Response wrapper: Nest `ResponseInterceptor` → `{ success, data }` — frontend ต้อง `unwrapApiData()` (`frontend/src/lib/apiResponse.ts`)
- Public vs JWT routes: `/public/**` ไม่ต้อง token; dashboard ต้อง Bearer จาก NextAuth session
- Reverse proxy: `/api/auth`, `/api/print-jobs`, `/api/job-images` → Next **8404**; `/api/` + `/socket.io` → Nest **8405** (ดู [`docs/Reverse-Proxy-Nginx-Proxy-Manager.md`](../../docs/Reverse-Proxy-Nginx-Proxy-Manager.md))

**RBAC**

- UI อ่าน `GET /roles/me/permissions` — ต้อง unwrap `data.permissions`
- Sidebar fallback ตามรหัสบทบาทมาตรฐานเมื่อ permission list ว่าง
- Permission ที่มักสับสน: `job.assign` (มอบหมาย + ย้ายนอกสัญญา), `job.viewContractTabs` (แท็บสัญญา/นอกสัญญาในรายการงาน — ไม่ใช่เมนู `menu.outOfContract`), `job.issue.upload` (อัปโหลดรูปปัญหาที่แจ้ง — ไม่ใช่ `job.fix.*`; PENDING/IN_PROGRESS เท่านั้น), `job.fix.self|any`, `job.reopen.self|any`, `job.deleteInProgress`, `job.deleteUnassigned`, `menu.*`
- หลังเพิ่ม permission ใหม่: restart backend หรือ `seed-roles-permissions.ts`
- `User.role` เป็น `VARCHAR` (`AppRole.code`) ไม่ใช่ Prisma enum — บทบาทที่สร้างเองเก็บที่ `role` + `roleId`

**งาน (Job domain)**

- สถานะ: `PENDING` → `IN_PROGRESS` → `RESOLVED` (+ Reopen)
- `assignedToId` null vs มีคนรับ — กระทบปุ่มมอบหมาย/รับงาน/ลบ
- `isOutOfContract` — แท็บสัญญา/นอกสัญญา (ต้องมี `job.viewContractTabs` ถึงจะเห็นแท็บ)
- Serial หลายแถว — JSON ใน `Job.oldSerialNumber` (ดู [`docs/Job-Serial-Multi-Row.md`](../../../docs/Job-Serial-Multi-Row.md))
- `reportDate` / `fixDate` — timezone Bangkok; backfill ใน `JobsService`

**รูป / MinIO**

- Dashboard: `/job-images/:jobId/:kind/:index` บน Next (ไม่อยู่ใต้ `/api`)
- Nest upstream: `GET /api/jobs/:id/image/:kind/:index` — 502 = โหลด object ไม่ได้
- Avatar: `/user-images/:userId`, `GET /api/users/me/avatar`
- Public reporter: **ไม่** ส่ง `image` URL

**Realtime**

- Socket.IO base = origin ของ API **ไม่มี** `/api` suffix
- Reverse proxy ต้อง forward `/socket.io` ไป Nest

### 4. ห้ามแก้ก่อน repro + falsify

- **ห้าม** แก้ RBAC ฝั่ง UI โดย hardcode role แทน permission — ต้องสอดคล้อง `GET /roles/me/permissions` และ `PermissionsGuard`
- **ห้าม** bypass `unwrapApiData` หรือ assume response เป็น array ตรงๆ
- **ห้าม** เปิด MinIO public read เป็น default fix — ใช้ proxy path ที่มี JWT
- **ห้าม** แก้ `CrudModal` / layout กลาง เพื่อ bug เฉพาะหน้า — แก้ที่หน้านั้นหรือ shared util ที่เกี่ยว
- ถ้า hypothesis = "backend ผิด" → disproof ด้วย Postman/curl ตรง Nest ก่อน (แยกจาก Next proxy)
- ถ้า hypothesis = "proxy/PRD" → disproof ด้วย local dev (`localhost:4100` + `localhost:3000`) ก่อน

### 5. Debugger / trace ใน stack นี้

| Layer | เครื่องมือ |
|-------|-----------|
| Browser UI | DevTools → Network (ดู `/api/**` vs `/job-images/**`), React DevTools |
| Next route handlers | `frontend/src/app/api/**`, log ใน handler; ตรวจ `getServerApiBaseUrl()` |
| NextAuth | `frontend/src/app/api/auth/[...nextauth]/route.ts`, `frontend/src/lib/auth.ts` |
| Nest API | Swagger (ถ้าเปิด), log Nest, breakpoint ใน service/controller |
| Prisma | เปิด query log ใน dev; ตรวจ N+1 ใน list endpoints |
| MinIO | Postman HEAD object; ตรวจ bucket/key ใน DB vs MinIO |
| PDF | `JobsPdfService`, Chromium path; trace `/api/print-jobs/:id/data` timeout |
| Email | `SettingsModule` + [`docs/Email-Notifications.md`](../../../docs/Email-Notifications.md); ทดสอบ `POST /settings/email-smtp/test` |

---

## Skill routing (dtrs-app)

| Situation | Skill / action |
|-----------|----------------|
| Active debugging | **`debug-mantra`** (this) |
| After validated fix — write RCA | **`post-mortem`** (`../post-mortem/SKILL.md`) |
| Stress-test plan **before** coding | **`grilling`** (`../grilling/SKILL.md`) |
| Review PR / diff / fix **before merge** | **`scrutinize`** (`../scrutinize/SKILL.md`) |
| Automated diff review | **`review-bugbot`**, **`review-security`** |

---

## อ้างอิง (ไม่แทน mantra)

- ภาพรวมระบบ: [`README.md`](../../../README.md), [`STATUS.md`](../../../STATUS.md)
- RBAC: [`docs/RBAC-Setup.md`](../../docs/RBAC-Setup.md)
- MinIO + รูป: [`docs/Project-Plan-Private-MinIO-Images.md`](../../../docs/Project-Plan-Private-MinIO-Images.md), [`minio.md`](../../../docs/minio.md)
- อีเมล: [`docs/Email-Notifications.md`](../../../docs/Email-Notifications.md)
- Reverse proxy PRD: [`docs/Reverse-Proxy-Nginx-Proxy-Manager.md`](../../docs/Reverse-Proxy-Nginx-Proxy-Manager.md)
- RCA หลัง fix ที่ validate แล้ว: skill [`post-mortem`](../post-mortem/SKILL.md)
- Agent manual: [`AGENTS.md`](../../../AGENTS.md)
