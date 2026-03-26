# Task & Implementation Plan 

รายการงานสำหรับการย้ายระบบแจ้งซ่อม CCTV จาก AppSheet มาสู่ Next.js และ NestJS

## 1. Project Setup
- [x] Initialize NestJS backend in `backend/` directory.
- [x] Initialize Next.js frontend in `frontend/` directory.
- [x] Configure Tailwind CSS and Shadcn UI in frontend.

## 2. Database & Backend Preparation
- [x] Setup Prisma ORM and MySQL connection in `backend/`.
- [x] Define Prisma Schema based on AppSheet data structure (Jobs, Users, Settings).
- [x] Create data migration script to read `ระบบแจ้งซ่อม CCTV .xlsx` and populate MySQL database.
- [x] Generate Prisma client and create initial migrations.

## 3. Backend Implementation (NestJS)
- [x] Implement Authentication module (JWT + RBAC).
- [x] Implement Users module (Staff, Reporters).
- [x] Implement Jobs/Issues module (CRUD, filtering by status).
- [x] Implement Settings module.
- [x] Setup MinIO integration for object storage.
- [x] Implement Socket.io Gateway for real-time updates.

## 4. Frontend Implementation (Next.js)
- [x] Setup NextAuth.js v4 for login.
- [x] Implement Base Layout (Sidebar, Header, Main Content).
- [x] Create Reporting Page (No login required).
- [x] Create Dashboard for Staff (Pending jobs, In-progress, All jobs, Out of contract).
- [x] Create Staff Management Page.
- [x] Create Settings Page (MinIO, Email config).
- [x] Integrate Socket.io client for real-time notifications.
- [x] Polish UI with SweetAlert2.

## 6. Phase 2 - Schema Alignment with Excel (2026-03-08)
- [x] ตรวจสอบโครงสร้าง Excel (`ระบบแจ้งซ่อม CCTV .xlsx`) ทุกชีท
- [x] เพิ่มตาราง `Site` (พื้นที่ในโครงการ: จังหวัด, อำเภอ, หน่วยงาน)
- [x] เพิ่มตาราง `Area` (พื้นที่รับผิดชอบ: อำเภอ, Site Engineer)
- [x] ขยายตาราง `User` — เพิ่ม `position`, `image`, relation `areas`, `reportedJobs`
- [x] ขยายตาราง `Job` — เพิ่มฟิลด์ครบตาม Excel: `ticketNo`, `province`, `district`, `reporterEmail`, `images/fixImages` (Json), `fixTicketNo`, `fixDate`, `brokenPart`, `cause`, `fixMethod`, `oldSerialNumber`, `newSerialNumber`, `fixNote`, `systemStatus`
- [x] รัน `prisma db push` สำเร็จ — ฐานข้อมูล MySQL ซิงค์แล้ว
- [x] สร้าง Sites Module/Controller/Service (`GET/POST /api/sites`)
- [x] สร้าง Areas Module/Controller/Service (`GET/POST /api/areas`)
- [x] ตั้งค่า `frontend/.env.local` ให้ครบถ้วน (NEXT_PUBLIC_API_BASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET)

## 7. Phase 3 - Frontend Enhancement & UI Redesign (2026-03-11)
- [x] ออกแบบ Unified Template (เปลี่ยนเป็น `PublicLayoutShell` ใช้แชร์งานหน้าระบบ Public ทั่วไป: Login, Report, Status)
- [x] เปลี่ยนระบบ Font หลักจาก Prompt ไปใช้งาน `Sarabun` ให้ลักษณะเป็นทางการขึ้น
- [x] ปรับปรุง UI เป็นโทน Silver/Slate/Blue โทน Modern Minimal สว่างสบายตา
- [x] อัปเดตฟอร์มแจ้งซ่อม (`/report`) เรียงการ์ด: แบบฟอร์มจำกัดเบอร์โทรเฉพาะตัวเลข 10 หลัก และฟิลด์ค้นหาสถานที่เป็น Select2 (`react-select`)
- [x] เพิ่มระบบค้นหาประวัติผู้แจ้งจากเบอร์โทร และล็อคข้อมูลชื่อ-อีเมลเมื่อพบในระบบ (Read-only)
- [x] เขียน Seed Script (`seed-from-excel.ts`, `seed-from-csv.ts`, `seed-admin.ts`)
- [x] ตรวจสอบความถูกต้องของข้อมูลพื้นที่โครงการ (Sites) อ้างอิงตาม Excel/CSV
- [x] Login ด้วยอีเมลหรือชื่อผู้ใช้ + password toggle
- [x] User dropdown ใน header (โปรไฟล์, ออกจากระบบ); หน้าโปรไฟล์ แก้ไขข้อมูล/เปลี่ยนรหัสผ่าน
- [x] Dashboard: Sidebar ไม่เลื่อนตาม scroll; ภาพรวมมีกราฟ (Pie, Bar, แนวโน้มรายวัน 14 วัน)
- [x] ข้อขัดข้อง (/dashboard/all): filter จังหวัด, page limit 15/30/50/ทั้งหมด, pagination
- [x] Component ร่วม: DashboardPageShell, DashboardFilterBar, CrudModal, Toast (success 1.2s, error, confirm)
- [x] ลบ /dashboard/staff; รวมการจัดการที่ /dashboard/users (ADMIN CRUD, STAFF read-only)
- [x] บทบาท SUPERVISOR (หัวหน้างาน) + สิทธิ์ job.assign; ปุ่มมอบหมายงานในหน้ารอดำเนินการ (modal เลือกเจ้าหน้าที่); GET /users/assignable, PATCH /jobs/:id/assign (ADMIN/SUPERVISOR มอบหมายได้, STAFF รับงานตัวเอง)
- [x] หน้ารอดำเนินการ: ปุ่มดูรายละเอียด → ไปหน้า `/dashboard/jobs/:id` (full page); ปุ่มมอบหมายงานใช้ react-select
- [x] นอกสัญญา (คงสถานะ PENDING) + ย้ายนอกสัญญา
  - `/dashboard/out-of-contract` แสดงเฉพาะงาน `PENDING` ที่ `isOutOfContract=true` (โครงสร้างเหมือน `/dashboard/pending`)
  - เพิ่มปุ่ม "ย้ายนอกสัญญา" ให้ Role `ADMIN/SUPERVISOR/STAFF` บนหน้ารอดำเนินการ เพื่อย้ายงาน `pending → out-of-contract` โดย “คงสถานะเป็น PENDING”
  - Backend มี endpoint `PATCH /jobs/:id/out-of-contract` เพื่อย้ายนอกสัญญา
- [x] Sidebar: เพิ่ม "งานที่รับผิดชอบ" (`/dashboard/my-jobs`); ไม่แสดงเมนู โปรไฟล์ (เข้าได้จาก dropdown)
- [x] หน้ารายละเอียดงาน (`/dashboard/jobs/:id`): การ์ดแจ้งข้อขัดข้อง + การ์ดข้อมูลการแก้ไข + ฟอร์มบันทึกการแก้ไข (ลำดับ: fixEnvironment (Indoor/Outdoor) ก่อน แล้วค่อย brokenPartType (Hardware/Software); ฟิลด์บังคับ: cause, fixMethod และรูปการแก้ไข “อย่างน้อย 2 รูปแรก”; หมายเหตุ/Serial ไม่บังคับ); PATCH /jobs/:id/fix; พิมพ์/PDF — หน้า `/print/jobs/:id` + เทมเพลต (อัปเดต: ไม่ใช้ html2canvas บนหน้ารายละเอียด; มี `GET /jobs/:id/report-pdf` สำหรับไฟล์ PDF)

## 8. Phase 4 - MinIO Integration (2026-03-11)
- [x] ติดตั้ง NestJS MinIO SDK และระบบอัปโหลดรูปภาพ
- [x] ปรับปรุง Frontend ให้ส่งภาพแบบ FormData แทน Base64
- [x] เพิ่มสคริปต์ migrate รูปของ Job (`Job.images`/`Job.fixImages`) จาก legacy path → MinIO URL เพื่อแก้ปัญหารูปไม่แสดงในหน้ารายละเอียดงาน

## 9. Phase 5 - Employee Data Migration (2026-03-11)
- [x] ย้ายข้อมูลพนักงานและรูปโปรไฟล์จาก AppSheet มายัง MinIO และ Database

## 10. Phase 6 - Production Readiness (Backlog)
- [ ] รัน Seed Script นำเข้าข้อมูลจริง (Sites/Areas)
- [ ] ติดตั้ง Real-time Notifications UI
- [x] ปรับปรุงฟอร์มแจ้งซ่อมหน้า Public (`/report`) ให้:
  - ตรวจสอบเบอร์โทรศัพท์เป็นเลข 10 หลักเท่านั้น และต้องตรงกับผู้แจ้งในระบบก่อนการกรอกฟิลด์อื่น
  - หลังสร้างงานสำเร็จ แสดงเลขที่ใบแจ้งซ่อม (ticketNo) และ redirect ไปหน้า `/status?ticketNo=...`
  - ส่งรูปภาพข้อขัดข้องเป็นไฟล์ไปยัง MinIO แทนการเก็บเป็น path แบบเดิม
- [x] ปรับปรุงหน้า `/status` ให้รองรับ query string `?ticketNo=...` และค้นหาสถานะให้อัตโนมัติ
- [x] เพิ่มฟังก์ชันสร้างเลขที่ใบแจ้งซ่อมอัตโนมัติใน Backend (`JobsService.generateTicketNo`) ให้มีรูปแบบใกล้เคียงกับข้อมูลเดิมใน CSV (รหัส hex 8 ตัว ไม่ซ้ำ)
- [x] ระบบออกรายงาน PDF / พิมพ์ (Resolved) — หน้า `/print/jobs/[id]` + เทมเพลต + `print.css`; ดาวน์โหลด PDF ผ่าน `GET /jobs/:id/report-pdf` (อัปเดตจาก html2canvas+jsPDF บนหน้ารายละเอียด)

## 11. Phase 6.1 - Dashboard UI/Permission Polish (2026-03-20)
- [x] เพิ่ม segmented tabs “สัญญา/นอกสัญญา” ใน `/dashboard/my-jobs`, `/dashboard/all`, และ `/dashboard/in-progress` (ค่าเริ่มต้นเป็น “สัญญา” แยกตาม `Job.isOutOfContract`)
- [x] ปรับ `/dashboard/pending`: ซ่อนคอลัมน์ “ผู้รับผิดชอบ” และจัดลำดับปุ่ม “จัดการ” โดยย้ายปุ่ม “ลบงาน” (`ลบงาน`) ไปไว้ท้ายสุด
- [x] เพิ่ม alert ยืนยันก่อน “ย้ายนอกสัญญา” ในหน้ารอดำเนินการ และคงสถานะงานเดิมเป็น `PENDING` ตาม requirement
- [x] ปรับ `/dashboard/in-progress`: ปุ่ม “อัปเดต” เปิด modal กรอก “ข้อมูลการแก้ไข” เหมือนรูปแบบการ์ดใน `/dashboard/jobs/:id` และบันทึกด้วย `PATCH /jobs/:id/fix` (อัปโหลดรูปได้สูงสุด 3 รูป)
- [x] ยืนยัน/ปรับ RBAC gating ของปุ่มลบงานใน pending ให้ใช้ permission `job.deleteUnassigned` ได้ถูกต้อง (unwrapped response ให้สอดคล้องกับ ResponseInterceptor)
- [x] ปรับส่วน user info บน header: แสดงรูปโปรไฟล์เมื่อ `session.user.image` มีค่า และ fallback เป็น initials เมื่อไม่มีรูปหรือโหลดรูปไม่สำเร็จ
- [x] แก้ backend validation เฉพาะ `@Body` สำหรับ endpoint ย้ายนอกสัญญา เพื่อลดปัญหา validation error จาก route params

## 12. Phase 6.2 — Report API, Jobs list, Print/PDF & Staff report (2026-03-21)

### Backend
- [x] **`GET /jobs/list`** — รายการงานสำหรับ Dashboard (JWT); ลดความสับสนกับ `GET /jobs` ที่อาจถูกเรียกโดยไม่ตั้งใจ
- [x] **Validation แจ้งซ่อม** — `create-job.dto` + Zod (`reporterEmail` preprocess/trim); `ZodValidationPipe` รวม error เป็น `message` array
- [x] **`POST /jobs` สร้างงาน** — หลัง validate Site ถ้าเบอร์ `reporterPhone` มีใน `User` ให้ **connect `reporter`** (`UsersModule` ใน `JobsModule`, `UsersService.findByPhone`)

### Frontend — หน้าแจ้งซ่อม (`/report`)
- [x] แสดงข้อความ error จาก API (`extractApiErrorMessage`)
- [x] **Flow เจ้าหน้าที่** (STAFF / ADMIN / SUPERVISOR): โหลดสถานที่ทันที; ไม่บังคับกด «ตรวจสอบ» หากกรอกเบอร์ 10 หลักและชื่อเอง; ส่ง Bearer เมื่อมี session; สำเร็จแล้วไป `/dashboard/jobs`
- [x] **ผู้ใช้ทั่วไป** — ยังต้องตรวจสอบเบอร์ให้พบในระบบก่อนเลือกสถานที่

### Frontend — รายการงาน & รายละเอียดงาน
- [x] `JobsList` / Dashboard เรียก **`/jobs/list`**
- [x] หน้า **`/dashboard/jobs/[id]`** — ฟอร์มแก้ไขธีม Dark Glassmorphism; **ลบ**ปุ่มดาวน์โหลดแบบ html2canvas และถอด dependency **html2canvas / jsPDF** จาก `package.json`
- [x] หน้า **`/print/jobs/[id]`** — layout พิมพ์ 2 หน้า, ปุ่มพิมพ์, ไม่มีปุ่มกลับ; ใช้ `JobMaintenancePdfTemplate` + `print.css`

### เอกสาร / Postman
- [x] อัปเดต `backend/postman` และ `backend/docs/api-endpoints.json` ให้สอดคล้อง path `/jobs/list` (ตามที่มีใน repo)

## 13. Phase 6.3 — Jobs UI, Users lightbox, Admin delete IN_PROGRESS (2026-03-21)

### Backend
- [x] **`DELETE /jobs/:id`** — ถ้า JWT เป็น **ADMIN** และงานเป็น **IN_PROGRESS** ให้ลบได้; ไม่ใช่กรณีนั้น fallback ไป `deleteUnassignedJob` (PENDING + ไม่มีผู้รับผิดชอบ) สำหรับ ADMIN/SUPERVISOR

### Frontend
- [x] **`SegmentedTabs`** — รองรับ `badgeCount`; แท็บสัญญา/นอกสัญญาแสดงจำนวนงานค้าง; ปรับ layout กล่องให้พอดี
- [x] **`JobsList`** — modal อัปเดตข้อมูลการแก้ไข = Dark Glass (แสดงกลางจอผ่าน portal เพื่อลดปัญหา header ทับ); **ADMIN** ที่หน้ากำลังแก้ไขเห็นปุ่มลบงาน IN_PROGRESS
- [x] **`/dashboard/users`** — คลิกรูปโปรไฟล์เปิด modal ดูรูปใหญ่

### เอกสาร
- [x] อัปเดต `README.md`, `STATUS.md`, `PLAN.md`, `TASK.md`, `backend/docs/RBAC-Setup.md`, `backend/postman/README.md`, `frontend/README.md`, `backend/docs/api-endpoints.json`

## 14. Phase 6.4 — SMTP, Reopen, assignee-only fix, Nest CLI v11, JobsList tabs (2026-03-22)

### Backend
- [x] **ตั้งค่าอีเมล (SMTP)** — `SettingsModule` + nodemailer; `GET/PUT /settings/email-smtp`, `POST /settings/email-smtp/test` (ADMIN); เก็บใน `Setting` คีย์ `email_smtp`; `tlsRejectUnauthorized` + env `SMTP_TLS_REJECT_UNAUTHORIZED`
- [x] **`PATCH /jobs/:id/reopen`** — เฉพาะผู้รับงาน; `RESOLVED` → `IN_PROGRESS`, ล้าง `fixDate`, ต่อท้ายเหตุผลใน `fixNote`
- [x] **`PATCH /jobs/:id/fix`** — เฉพาะผู้รับงาน (ไม่ยกเว้น ADMIN); ถ้ายัง `RESOLVED` ต้อง reopen ก่อน
- [x] **@nestjs/cli** อัปเกรดเป็น **v11** — แก้ watch / `compilerOptions.paths` กับ TypeScript ใหม่

### Frontend
- [x] **`/dashboard/settings`** — ฟอร์ม SMTP โหลด/บันทึก/ทดสอบ; layout เนื้อหาแบบ `/dashboard` (ไม่ใช้ `DashboardPageShell` เป็นห่อหลัก)
- [x] **`/dashboard/jobs/[id]` + `JobsList`** — Reopen + `confirmDialog`; เรียก API reopen/fix ตามสิทธิ์ assignee
- [x] **`JobsList`** — แท็บสัญญา/นอกสัญญา: เอา card/glass ห่อชั้นนอกออก (เหลือ `SegmentedTabs`)

### เอกสาร
- [x] อัปเดต `README.md`, `STATUS.md`, `PLAN.md`, `TASK.md`, `AGENTS.md`, `AGENT_INSTRUCTIONS.md`, `frontend/README.md`, `backend/postman/README.md`

## 15. Phase 6.5 — GitLab CI, Docker, พอร์ต PRD, production URL, build (2026-03-23)

### CI / Deploy
- [x] **`.gitlab-ci.yml`** — build แยก `frontend` / `backend`, deploy Docker บน PRD, SSH run; พอร์ต **8309→3000**, **8310→4000**; cleanup image แบบ manual
- [x] **`backend/Dockerfile`**, **`frontend/Dockerfile`**, **`docker-compose.yml`**, **`.dockerignore`** (ไม่ใช้ `docker/entrypoint.sh` รวมอีกต่อไป); backend CMD / `start:prod` → **`dist/src/main.js`**
- [x] **GitLab Variables** — ใช้ **`FRONTEND_BASE_URL`** เดียว (เลิกใช้ `FRONTEND_URL_PRD` ใน pipeline)

### Frontend
- [x] **`apiResponse.ts`** — `extractAssignableArray`, `axiosErrorData`, `formatApiErrorDetail`, `asRecord`
- [x] **`/public/report`** — `<Suspense>` + `ReportPageContent` สำหรับ `useSearchParams` (Next 15)
- [x] **`reactSelectGlassStyles.ts`** — `eslint-disable` เฉพาะไฟล์สำหรับ `StylesConfig<any>`

### เอกสาร
- [x] อัปเดต `README.md`, `STATUS.md`, `PLAN.md`, `TASK.md`, `AGENTS.md`, `AGENT_INSTRUCTIONS.md`, `frontend/README.md`, `backend/postman/README.md`, `backend/docs/RBAC-Setup.md` (ถ้ามีบรรทัดที่เกี่ยวข้อง)

## 16. Phase 6.6 — RBAC sidebar + PRD env (NextAuth / CORS / next.config) (2026-03-23)

### Frontend
- [x] **`DashboardLayoutShell`** — แกะ response `/roles/me/permissions` ตาม `ResponseInterceptor`; fallback เมนูเมื่อ permission ไม่ชี้ sidebar; **SUPERVISOR** ในเมนูที่เทียบ STAFF
- [x] **`apiResponse.ts`** — **`unwrapApiData`** สำหรับ body มาตรฐาน `{ success, data }`

### Deploy / CI
- [x] **`next.config.mjs`** + **Dockerfile** copy ไฟล์ที่ถูกต้อง
- [x] **`API_INTERNAL_BASE_URL`** (GitLab default + docker-compose) สำหรับ server-side login
- [x] **`ALLOWED_ORIGINS`** ใน `.gitlab-ci.yml` → backend container

### เอกสาร
- [x] อัปเดต `README.md`, `STATUS.md`, `PLAN.md`, `TASK.md`, `AGENTS.md`, `backend/docs/RBAC-Setup.md`, `backend/docs/api-endpoints.json` (รอบ 6.7 — เทมเพลตอีเมล + `docs/Email-Notifications.md`)

## 17. Phase 6.7 — เทมเพลตอีเมลแจ้งงาน + เอกสาร flow (2026-03-24)

### Backend / Frontend
- [x] **เทมเพลตอีเมล** — `GET/PUT /api/settings/email-templates`; ส่งอีเมลเมื่อแจ้งเหตุ / มอบหมาย / ปิดงาน (`JobEmailNotificationService` + HTML โทนสว่าง, badge สถานะ)
- [x] **หน้า settings** — ตั้งค่า `publicBaseUrl`, โลโก้, To เพิ่มเติม, CC, **แจ้งตาม Role** (`notifyRoleIds`)

### เอกสาร
- [x] [`docs/Email-Notifications.md`](docs/Email-Notifications.md) — flow ผู้รับ To/CC เริ่มต้น; อัปเดต `README.md`, `STATUS.md`, `PLAN.md`, `TASK.md`, `AGENTS.md`, `AGENT_INSTRUCTIONS.md`, `backend/README.md`, `frontend/README.md`, `backend/postman/README.md`

## 18. Phase 6.8 — CrudModal + หน้า Roles (Dark Glass) (2026-03-24)

### Frontend
- [x] **`CrudModal`** — Portal ไป `document.body`, `z-100`, สไตล์ Dark Glass, `size` md/lg
- [x] **`/dashboard/roles`** — `form-input-glass`, modal กำหนดสิทธิ์ + กล่องรายการ permission

### เอกสาร
- [x] อัปเดต `README.md`, `STATUS.md`, `PLAN.md`, `TASK.md`, `AGENTS.md`, `AGENT_INSTRUCTIONS.md`, `frontend/README.md`

