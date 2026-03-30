# แผนปรับปรุงระบบแจ้งซ่อม CCTV

**อัปเดต:** 2026-03-28 (ส่วน 4.10 — Private MinIO implement แล้ว)

---

## 1. บริบทจากเอกสาร Project

- **ดัชนีเอกสารใน `docs/`**: [`docs/README.md`](docs/README.md) · ตัวแปร MinIO: [`minio.md`](minio.md)
- **TASK.md / STATUS.md**: ระบบย้ายจาก AppSheet มา Next.js + NestJS แล้ว Phase 2–3 เสร็จ
- **ข้อมูลพื้นที่**: Backend มีตาราง `Site` (จังหวัด, อำเภอ, หน่วยงาน) และ `Area` (อำเภอ, Site Engineer); การสร้าง Job ตรวจสอบ Site ก่อน (existsByLocation)
- **Seed Script**: `backend/scripts/seed-from-excel.ts` (Excel), `backend/scripts/seed-from-csv.ts` (CSV), `backend/scripts/seed-admin.ts` (สร้าง admin ครั้งแรก)

---

## 2. ความสัมพันธ์ Site/Area กับ Excel

| หน้า/ระบบ | ข้อมูลที่ใช้ | แหล่งข้อมูลใน Excel |
|-----------|----------------|----------------------|
| **หน้าแจ้งปัญหา** (`/report`) | จังหวัด → อำเภอ → สถานที่/หน่วยงาน (Cascading Dropdown) | ต้องมาจาก Sheet **"พื้นที่ ในโครงการ"** (คอลัมน์: จังหวัด, อำเภอ, หน่วยงาน) |
| **Seed – Sites** | `Site` (province, district, agency) | Sheet **"พื้นที่ ในโครงการ"** |
| **Seed – Areas** | `Area` (district, staffId) | Sheet **"พื้นที่ รับผิดชอบ"** (ในโค้ดใช้ชื่อ **"พื้นที่ รับผิชอบ"** — ตรวจสอบชื่อชีทจริงในไฟล์ Excel) |

**ข้อควรทำ**
- วางไฟล์ **`ระบบแจ้งซ่อม CCTV .xlsx`** ที่ root โปรเจกต์ (`d:\cctv-app.forth.co.th\`) เพื่อให้ seed script อ่านได้
- ให้ชื่อ Sheet ใน Excel ตรงกับที่ seed ใช้:
  - **"พื้นที่ ในโครงการ"** → Sites (จังหวัด, อำเภอ, หน่วยงาน)
  - **"พื้นที่ รับผิชอบ"** หรือ **"พื้นที่ รับผิดชอบ"** → Areas (อำเภอ, Site Engineer, เบอร์ติดต่อ)
- รัน seed หลังแก้ Excel: `cd backend && npx ts-node scripts/seed-from-excel.ts`
- หน้าแจ้งปัญหาดึงรายการ Site ผ่าน API **GET /sites** — endpoint นี้ต้อง **ไม่ต้องล็อกอิน** (Public) เพื่อให้ dropdown สถานที่ทำงานได้

---

## 3. รายการงานที่ดำเนินการแล้ว

- [x] **เปิด GET /sites เป็น Public**  
  หน้าแจ้งปัญหา (`/report`) เรียก `GET /api/sites` โดยไม่ล็อกอิน

- [x] **เปลี่ยนโทนสีเว็บเป็น Modern Minimal Theme และฟอนต์ Sarabun**  
  โทนน้ำเงิน/เงิน (Silver/Slate/Blue) ปรับแต่ง UI ให้ดูสะอาดตา เป็นรูปแบบ Card interface เงานุ่มนวล ทั้งระบบใช้งานฟอนต์ `Sarabun` เป็นฟอนต์มาตรฐาน

- [x] **รวม Layout หน้า Public (`PublicLayoutShell`)**
  หน้า `/report`, `/status` และ `/login` ใช้ดีไซน์ Background Glassmorphism และ Layout แบบเดียวกันทั้งหมด ง่ายต่อการบริหารจัดการ

- [x] **เพิ่มความสามารถและ Validation หน้าแจ้งปัญหา (Report UX/UI)**
  - ดึงข้อมูลจากเบอร์โทร รองรับแค่ตัวเลขจำกัด 10 หลัก ป้องกันชื่อ-อีเมลแก้ไขเมื่อพบประวัติ 
  - เปลี่ยนพฤติกรรมการค้นหาสถานที่มาใช้รูปแบบ Searchable Dropdown (Select2) ด้วยไลบรารี `react-select`
  - การ์ดข้อมูลสถานที่/รายละเอียด/รูปภาพ และปุ่มส่งฟอร์ม จะ active ได้ต่อเมื่อเบอร์โทรถูกต้อง 10 หลักและเป็นผู้แจ้งที่มีอยู่ในระบบเท่านั้น
  - เมื่อส่งฟอร์มแจ้งซ่อมสำเร็จ Backend จะสร้างเลขที่ใบแจ้งซ่อม (`ticketNo` เป็นรหัส hex 8 ตัวให้รูปแบบใกล้กับข้อมูลเดิมใน CSV) แล้ว Frontend จะแสดง Toast พร้อมเลขนี้ จากนั้น redirect ไปหน้า `/status?ticketNo=...` เพื่อให้ผู้ใช้เห็นสถานะของงานนั้นทันที
  - **อัปเดต 2026-03-21:** ผู้ใช้ทั่วไปยังต้องตรวจสอบเบอร์ให้พบในระบบก่อน; **เจ้าหน้าที่ที่ล็อกอิน** (STAFF/ADMIN/SUPERVISOR) ใช้ flow แยก — โหลดสถานที่ทันที, ไม่บังคับ phone lookup, ส่ง Bearer เมื่อมี session, สำเร็จแล้วไป `/dashboard/jobs`

- [x] **Login ด้วยอีเมลหรือชื่อผู้ใช้ + Password toggle**  
  Backend รองรับ `email` หรือ `username` ใน body; Frontend มีปุ่มแสดง/ซ่อนรหัสผ่าน

- [x] **User & Role + โปรไฟล์**  
  RBAC (ADMIN, STAFF, USER); หน้าโปรไฟล์ (`/dashboard/profile`) แก้ไขข้อมูลผู้ใช้และเปลี่ยนรหัสผ่าน; API `/users/me`, `/users/me/password`

- [x] **Dashboard UI ร่วม (Toast, Modal, FilterBar, Sidebar fix)**  
  Component: `DashboardPageShell`, `DashboardFilterBar`, `CrudModal`, Toast (success 1.5s, error, confirm); Sidebar ดีไซน์ใหม่ Modern Look

- [x] **รวม Staff กับ Users**  
  ลบ `/dashboard/staff`; redirect ไป `/dashboard/users` (ADMIN CRUD, STAFF ดูอย่างเดียว)

- [x] **ข้อขัดข้อง (/dashboard/all)**  
  ชื่อ "ข้อขัดข้อง", filter จังหวัด, จำนวนต่อหน้า 15/30/50/ทั้งหมด, pagination

- [x] **บทบาท SUPERVISOR (หัวหน้างาน) + ปุ่มมอบหมายงาน**  
  Role SUPERVISOR เห็นเมนูเทียบเท่า STAFF; สิทธิ์ `job.assign`; ปุ่ม "มอบหมายงาน" ในหน้ารอดำเนินการ (modal เลือกเจ้าหน้าที่ด้วย react-select); API `GET /users/assignable`, `PATCH /jobs/:id/assign` — **อัปเดต 2026-03-30:** คุมสิทธิ์ด้วย RBAC (`job.assign` / `menu.pending` สำหรับรับงานเอง) สอดคล้อง `/dashboard/roles`

- [x] **นอกสัญญา (คงสถานะ PENDING) + ปุ่มย้ายนอกสัญญา**
  - หน้า `/dashboard/out-of-contract` แสดงเฉพาะงาน `PENDING` ที่ `isOutOfContract=true` (โครงสร้างเหมือน `/dashboard/pending`)
  - ปุ่ม "ย้ายนอกสัญญา" ในหน้ารอดำเนินการ — **อัปเดต 2026-03-30:** ต้องมีสิทธิ์ **`job.assign`**; ย้ายงาน `pending → out-of-contract` โดย “คงสถานะเป็น PENDING”
  - Backend มี endpoint `PATCH /jobs/:id/out-of-contract` เพื่อตั้ง `isOutOfContract=true`
---

## 3. รายการงานที่ดำเนินการแล้ว (เพิ่มเติม)

- [x] **MinIO Integration & Employee Migration (Phase 4-5)**  
  พัฒนาระบบอัปโหลดภาพผ่าน MinIO และย้ายข้อมูลพนักงานพร้อมรูปโปรไฟล์จาก AppSheet เรียบร้อยแล้ว

- [x] **สคริปต์ migrate รูปของ Job → MinIO (legacy path → URL)**
  - เตรียมสคริปต์ `backend/scripts/migrate-job-images-to-minio.ts` และ `backend/scripts/migrate-all-job-images-to-minio.ts` เพื่อแก้ปัญหา `Job.images/fixImages` ที่เก็บเป็น path แบบ legacy ทำให้หน้า `/dashboard/jobs/:id` ไม่แสดงรูป

- [x] **งานที่รับผิดชอบ + หน้ารายละเอียดงานเต็มหน้า**  
  Sidebar เพิ่มเมนู "งานที่รับผิดชอบ" (`/dashboard/my-jobs`) แสดง DataTable งานที่รับมอบหมาย; ปุ่มดูรายละเอียดไปหน้า `/dashboard/jobs/:id` (full page) แทน modal; layout การ์ดซ้าย "ข้อมูลการแจ้งข้อขัดข้อง" และขวา "ข้อมูลการแก้ไข" ให้สอดคล้องกัน

- [x] **ฟอร์มบันทึกการแก้ไขงาน (PATCH /jobs/:id/fix)**  
  หน้ารายละเอียดงานมีฟอร์ม: ส่วนขัดข้อง (Hardware/Software), สาเหตุ, วิธีแก้ไข, รูปการแก้ไข (สูงสุด 3 รูป), หมายเหตุ, Serial เก่า/ใหม่; Admin/Supervisor แก้ได้เสมอ, Staff แก้ได้เฉพาะก่อน Resolved; Backend อัปโหลดรูปไป MinIO และตั้ง status=RESOLVED, fixDate อัตโนมัติ

- [x] **Sidebar ไม่แสดงเมนู โปรไฟล์**  
  โปรไฟล์เข้าได้จากเมนูผู้ใช้ (dropdown) เท่านั้น; seed สิทธิ์ `menu.myJobs` สำหรับงานที่รับผิดชอบ

---

## 4. แผนงานถัดไป (Phase 6)

- [ ] รัน Seed Script นำเข้าข้อมูลจริงจาก Excel หลังยืนยันชื่อ Sheet
- [ ] ติดตั้ง Socket.io บน Frontend เพื่อ Real-time Notifications
- [x] ระบบออกรายงาน PDF / พิมพ์ — หน้า `/print/jobs/[id]` + `JobMaintenancePdfTemplate` + `print.css`; ดาวน์โหลด PDF ฝั่ง backend ผ่าน `GET /jobs/:id/report-pdf` (Chromium + `emulateMediaType('print')`); ลบการดาวน์โหลดแบบ html2canvas บนหน้ารายละเอียดงาน
- [ ] พัฒนาหน้าจอ Admin สำหรับการจัดการบทบาทและสิทธิ์แบบ Visual

## 4.1 Dashboard UI/Permission Polish (2026-03-20)
- [x] แยก “สัญญา/นอกสัญญา” ด้วย segmented tabs บน `/dashboard/my-jobs`, `/dashboard/all`, และ `/dashboard/in-progress` (default: สัญญา แยกตาม `Job.isOutOfContract`)
- [x] ซ่อนคอลัมน์ “ผู้รับผิดชอบ” ใน `/dashboard/pending`
- [x] จัดลำดับปุ่ม “ลบงาน” (`ลบงาน`) ไปท้ายสุด และให้ปุ่ม “ย้ายนอกสัญญา” แสดง `alert ยืนยัน` ก่อนทำรายการ
- [x] ปุ่ม “อัปเดต” ใน `/dashboard/in-progress` เปิด modal “ข้อมูลการแก้ไข” และบันทึกด้วย `PATCH /jobs/:id/fix` (ส่งฟอร์ม + รูปสูงสุด 3 รูป)
- [x] Header user info: แสดงรูปโปรไฟล์เมื่อ `session.user.image` มีค่า และ fallback เป็น initials เมื่อไม่มี/โหลดไม่สำเร็จ
- [x] RBAC gating สำหรับปุ่มลบงาน pending ใช้ permission `job.deleteUnassigned` และ unwrap response ให้ถูกต้อง

## 4.2 Report, Jobs API & Print flow (2026-03-21)
- [x] **`GET /jobs/list`** — รายการงานใน Dashboard; แยกจาก `POST /jobs` เพื่อลดความสับสน (เปิด `/api/jobs` แบบ GET ไม่ได้)
- [x] **Validation `POST /jobs`** — DTO/Zod + pipe แสดง error ชัด; สร้างงานแล้วเชื่อม **reporter** จากเบอร์โทรถ้ามีใน `User`
- [x] **หน้า `/report`** — แยก flow **เจ้าหน้าที่ที่ล็อกอิน** (โหลดสถานที่ทันที, ไม่บังคับ phone lookup, Bearer, redirect `/dashboard/jobs`) กับผู้ใช้ทั่วไป
- [x] **พิมพ์/PDF** — `/print/jobs/[id]`, ปรับ layout/หน้า 2; เอา html2canvas ออกจากหน้า `/dashboard/jobs/[id]`

## 4.3 Dashboard UI / Jobs API (2026-03-21 ต่อ)

- [x] **แท็บสัญญา/นอกสัญญา** — `SegmentedTabs` แสดง **badge** จำนวนงานค้าง (สถานะไม่ใช่ `RESOLVED`) ต่อแท็บ; ปรับกล่อง glass ให้พอดีเนื้อหา (มือถือเต็มความกว้าง / จอใหญ่ `w-fit`)
- [x] **Modal ข้อมูลการแก้ไข** ใน `JobsList` — ธีม **Dark Glassmorphism** (`AGENTS.md`)
- [x] **`/dashboard/users`** — คลิกรูปโปรไฟล์ในตารางเปิด **lightbox** ดูรูปใหญ่
- [x] **`DELETE /jobs/:id`** — ลบงาน **IN_PROGRESS** ต้องมี **`job.deleteInProgress`**; ลบ **PENDING** ไม่มอบหมายต้องมี **`job.deleteUnassigned`** — **อัปเดต 2026-03-31:** สอดคล้อง `RolesService.getPermissionsForUser` / หน้า `/dashboard/roles`
- [x] **หน้า `/dashboard/in-progress`** — ปุ่ม **ลบงาน (ผู้ดูแลระบบ)** เมื่อ `statusFilter === IN_PROGRESS` ตามสิทธิ์ **`job.deleteInProgress`**

## 4.4 SMTP, Reopen, assignee-only fix & tooling (2026-03-22)

- [x] **ตั้งค่าอีเมล (SMTP)** — Backend: `GET/PUT /settings/email-smtp`, `POST /settings/email-smtp/test` (ADMIN), nodemailer, เก็บ `email_smtp` ใน `Setting`; TLS / `SMTP_TLS_REJECT_UNAUTHORIZED`
- [x] **Reopen** — `PATCH /jobs/:id/reopen` (เฉพาะ assignee); `fix` ต้องไม่ใช่กรณี `RESOLVED` จนกว่าจะ reopen
- [x] **Frontend** — `/dashboard/settings` (SMTP + ทดสอบส่ง); Reopen ยืนยันก่อนเรียก API; `JobsList` เอา glass ห่อชั้นนอกรอบแท็บสัญญา/นอกสัญญาออก
- [x] **@nestjs/cli v11** — แก้ปัญหา watch mode กับ TypeScript/Nest 11

## 4.5 GitLab CI, Docker, production URL & build (2026-03-23)

- [x] **`.gitlab-ci.yml`** — stages: build (frontend+backend), deploy (สรุป), deploy_docker (build image + SSH `docker run`), cleanup (manual); map พอร์ต **8309:3000**, **8310:4000**; container แยก **`cctv-app-ticket-frontend`** / **`cctv-app-ticket-backend`**
- [x] **`backend/Dockerfile` + `frontend/Dockerfile`** — multi-stage build; backend runtime `dumb-init` + **`node dist/src/main.js`** (สอดคล้องผล `nest build` ใต้ `dist/src/`)
- [x] **ตัวแปร CI** — `FRONTEND_BASE_URL` รวมบทบาทเดิมของ `FRONTEND_URL_PRD` + ใช้กับ backend PDF
- [x] **เอกสาร production** — โดเมนเดียว + `/api` + proxy **`/socket.io`**; ตัวอย่าง `MINIO_PUBLIC_URL` (เช่น minio-it.forth.co.th) ใน `README.md`
- [x] **`npm run build`** — แก้ ESLint/TS + Suspense หน้า `/public/report`; เพิ่ม `frontend/src/lib/apiResponse.ts`

## 4.6 RBAC เมนู + Deploy PRD (NextAuth / CORS) (2026-03-23)

- [x] **`DashboardLayoutShell`** — แกะ `GET /roles/me/permissions` ผ่าน **`unwrapApiData`**; ถ้ากรอง permission แล้วเมนูว่างให้ fallback ตาม role; `userRole` ใช้ **uppercase**; เพิ่ม **SUPERVISOR** ในเมนูเดียวกับ STAFF ที่เกี่ยวข้อง
- [x] **`frontend/src/lib/apiResponse.ts`** — export **`unwrapApiData`** ใช้ร่วมกับ fetch/axios กับ backend
- [x] **`next.config.mjs`** — แทน `next.config.ts` เพื่อไม่ให้ production image ต้องมี `typescript` ตอน `next start`
- [x] **`API_INTERNAL_BASE_URL`** — default ใน `.gitlab-ci.yml` + `docker-compose` ชี้ backend ใน Docker network (แก้ hairpin/timeout ตอน login)
- [x] **`ALLOWED_ORIGINS`** — ส่งจาก GitLab Variables เข้า backend container ใน deploy

## 4.7 เทมเพลตอีเมลแจ้งงาน + ลิงก์ production (2026-03-24)

- [x] **Backend** — เก็บ `email_templates` ใน `Setting`; `GET/PUT /api/settings/email-templates`; `JobEmailNotificationService` (แจ้งเหตุ / มอบหมาย / ปิดงาน); ลิงก์อีเมลใช้ `publicBaseUrl` ก่อน แล้วจึง `FRONTEND_BASE_URL`
- [x] **Frontend** — `/dashboard/settings`: แก้ไขเทมเพลต, `publicBaseUrl`, เลือก **แจ้งตามบทบาท** (`notifyRoleIds`) ต่อเทมเพลต
- [x] **เอกสาร** — [`docs/Email-Notifications.md`](docs/Email-Notifications.md) สรุปตาราง To/CC ตามหน้า settings (ไม่แทรกผู้รับงานเป็น CC อัตโนมัติเมื่อปิดงาน)

## 4.8 Modal แดชบอร์ด + หน้า Roles (Dark Glass) (2026-03-24)

- [x] **`CrudModal`** — `createPortal` → `document.body`, `z-100`, โทน Dark Glass (`ring`, backdrop), พร็อพ `size` md/lg, ล็อก scroll `body`
- [x] **`/dashboard/roles`** — ฟอร์มบทบาท + กำหนดสิทธิ์ใช้ `form-input-glass`; รายการ checkbox ในกล่องแก้ว
- [x] **เอกสาร** — อัปเดต `README.md`, `STATUS.md`, `TASK.md`, `AGENTS.md`, `AGENT_INSTRUCTIONS.md`, `frontend/README.md`

## 4.9 พิมพ์รายงาน PRD + MinIO fetch ภายใน (2026-03-28)

- [x] **Next** — route **`/job-images/*`** + `jobImageProxy` (แชร์ logic กับ `/api/job-images/*`); error upstream ส่ง JSON ให้ DevTools
- [x] **Nest** — `getJobImageBuffer` ใช้ **`MinioService.rewriteStorageUrlForServerFetch`** + env **`MINIO_SERVER_FETCH_BASE_URL`**; ล้มเหลวโหลด object → **502** + log
- [x] **CI** — `.gitlab-ci.yml` ส่ง `MINIO_SERVER_FETCH_BASE_URL` เข้า backend container (optional)
- [x] **เอกสาร** — `README.md`, `STATUS.md`, `TASK.md`, `AGENTS.md`, `AGENT_INSTRUCTIONS.md`, `minio.md`, `backend/README.md`, `backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md`, `backend/postman/PRINT-PDF-DEBUG.md`, `backend/postman/README.md`, `frontend/README.md`

## 4.10 ปิด MinIO public read + โหลดรูปผ่านสิทธิ์ (2026-03-28)

- [x] Backend: Phase 1 — SDK + avatar **`getAvatarImageBuffer`**; **`GET /users/me/avatar`**, **`GET /users/:id/avatar`**; public reporter-by-phone ไม่ส่ง `image`
- [x] Frontend: **`/user-images/[userId]`**, **`dashboardJobImageUrl`**, job detail + JobsList + status staff; **`PersonAvatar`**, auth, users, profile
- [x] Infra default: **`MINIO_ENSURE_PUBLIC_READ_POLICY=false`** — ลบ policy public เดิมบน MinIO ด้วยมือถ้าเคยเปิดไว้
- [ ] ทดสอบ PRD ตาม checklist ใน **[`docs/Project-Plan-Private-MinIO-Images.md`](docs/Project-Plan-Private-MinIO-Images.md)**
- [x] เอกสารประกอบ — `docs/README.md`, อัปเดต `README.md` / `AGENTS.md` / `AGENT_INSTRUCTIONS.md` / Postman / RBAC / Email-Notifications / CSV mapping

---

## 5. หมายเหตุการตรวจสอบ Excel / CSV

- **Excel:** เปิดไฟล์ `ระบบแจ้งซ่อม CCTV .xlsx` แล้วตรวจสอบชื่อ Tab แต่ละ Sheet  
  ถ้า Sheet พื้นที่รับผิดชอบชื่อ **"พื้นที่ รับผิดชอบ"** (สะกดถูก) ให้แก้ใน `seed-from-excel.ts` บรรทัดที่อ่าน Area จาก `'พื้นที่ รับผิชอบ'` เป็น `'พื้นที่ รับผิดชอบ'`
- **CSV:** ถ้าใช้ไฟล์ CSV จากโปรเจกต์ root ให้ดูการเทียบโครงสร้างใน **`docs/CSV-vs-System-Mapping.md`** และรัน seed จาก CSV:
  ```bash
  cd backend && npx ts-node scripts/seed-from-csv.ts
  ```
  ไฟล์ที่ใช้: `area_project.csv`, `ผู้แจ้ง.csv`, `ผู้แก้ไข.csv`, `พื้นที่รับผิดชอบ.csv`, `ข้อมูลการแจ้งซ่อม.csv`
