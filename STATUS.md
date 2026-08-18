# Project Status - ระบบแจ้งซ่อม

**วันที่อัปเดตสถานะ:** 2026-08-17

**Migration (`cctv-app_ticket` → `dtrs-app`):** ดู [`docs/DTRS-Migration-Checklist.md`](docs/DTRS-Migration-Checklist.md) — P0 โค้ด ✅ · GitLab CI ✅ · **Variables กลุ่ม A `staging` + MinIO กลุ่ม B ✅** · **`production` กลุ่ม A / NPM = pending** · โฟกัสถัดไป = deploy UAT

**ดัชนีเอกสาร:** [`README.md`](README.md) (ตารางสรุป), [`docs/README.md`](docs/README.md), [`docs/DTRS-Migration-Checklist.md`](docs/DTRS-Migration-Checklist.md), [`docs/GitLab-CI-Plan.md`](docs/GitLab-CI-Plan.md), [`docs/GitLab-CI-Variables-Checklist.md`](docs/GitLab-CI-Variables-Checklist.md), [`docs/minio.md`](docs/minio.md), [`docs/Project-Plan-Private-MinIO-Images.md`](docs/Project-Plan-Private-MinIO-Images.md), [`docs/Job-Serial-Multi-Row.md`](docs/Job-Serial-Multi-Row.md), [`docs/Locations-Master-Seed.md`](docs/Locations-Master-Seed.md), [`docs/Sites-Import.md`](docs/Sites-Import.md), [`docs/MinIO-Orphan-Cleanup.md`](docs/MinIO-Orphan-Cleanup.md)

---

## 🟢 สถานะภาพรวม: Phase 6.14 (Light/Dark theme) Complete

---

### รายละเอียดของสถานะระบบ

1. 🗄️ **ฐานข้อมูลและการเชื่อมโยงข้อมูล (Data Alignment): `🟢 สำเร็จ`**
   - **Prisma Schema**: ปรับปรุงตาราง `Site`, `Area`, `User`, `Job` ให้รองรับข้อมูลจาก Excel 100%
   - **Sites Data**: `Site.agency` (สถานที่/หน่วยงาน) + `Site.station` (ชื่อสถานี); import จาก `Sites.xlsx` sheet `info` — [`docs/Sites-Import.md`](docs/Sites-Import.md); **local ✅ 198 แถว** (หลัง `:clear` ลบของเก่า 209) — UAT/PRD รันหลัง deploy
   - **Seed Script**: `seed-from-excel.ts` / `seed-from-csv.ts` (Sites legacy, Areas, Users, Jobs); **`seed-sites-from-xlsx.ts`** (Sites ใหม่); **`seed-locations-from-mssql.ts`** (Province/District/Subdistrict จาก `scripts/data/TB_MST_*.sql`) — คู่มือ [`docs/Locations-Master-Seed.md`](docs/Locations-Master-Seed.md); local นำเข้าแล้ว (~77 / ~928 / ~7432 ตำบล master) — UAT/PRD รันหลัง deploy ถ้ายังว่าง
   - **Locations master**: ตาราง `Province` / `District` / `Subdistrict` + เมนู `/dashboard/locations` (`menu.locations`)

2. ⚙️ **Backend API (NestJS): `🟢 พร้อมใช้งาน`**
   - Endpoint `/api/users/reporters` สำหรับดึงรายชื่อผู้แจ้งซ่อมในหน้ารายงาน
   - ระบบ Authentication: **JwtAuthGuard** + **`PermissionsGuard`** ตาม `Permission.code` จาก DB (สอดคล้องหน้า `/dashboard/roles`); `RolesGuard` ยังมีใน `AuthModule` แต่ endpoint หลักของ roles/users/settings ใช้ permission แทนการเทียบสตริง role ใน JWT อย่างเดียว
   - **Login**: รองรับอีเมลหรือชื่อผู้ใช้ (`email` / `username`) + รหัสผ่าน คืนค่า `access_token` + `user` (id, name, username, role)
   - **User CRUD**: ผู้ที่มีสิทธิ์ **`menu.users`** เรียก `GET/POST/PATCH/DELETE /users` ได้ — บทบาทกำหนดเองที่ได้รับเมนูนี้ใช้งานได้; **`User.role`** เป็น `VARCHAR` เก็บ `AppRole.code` (รวมรหัสที่สร้างเอง เช่น `ADMIN_1`) คู่กับ `User.roleId`
   - **โปรไฟล์ผู้ใช้**: `GET /users/me`, `PATCH /users/me` (ชื่อ, อีเมล, เบอร์, ตำแหน่ง, รูป), `PATCH /users/me/password` (เปลี่ยนรหัสผ่านต้องส่งรหัสเดิม)
   - **มอบหมายงาน**: `GET /users/assignable` — ต้องมีสิทธิ์ **`job.assign`** (`PermissionsGuard`); `PATCH /jobs/:id/assign` — อิง RBAC เหมือน `GET /roles/me/permissions`: มี **`job.assign`** → ส่ง `staffId` ใครก็ได้; ไม่มี `job.assign` แต่มี **`menu.pending`** และ `staffId` = ตัวเอง → รับงานเอง; **`PENDING`** → เปลี่ยนเป็น **`IN_PROGRESS`**; **`IN_PROGRESS`/`RESOLVED` ที่ยังไม่มีผู้รับผิดชอบ** (ข้อมูล import) → ตั้งผู้รับงานโดยคงสถานะเดิม
   - **นอกสัญญา**: `PATCH /jobs/:id/out-of-contract` — ตั้ง `isOutOfContract=true` โดย “คงสถานะเป็น `PENDING`”; ต้องมีสิทธิ์ **`job.assign`**
   - **อัปโหลดรูปปัญหาที่แจ้ง**: `PATCH /jobs/:id/issue-images` — สิทธิ์ **`job.issue.upload`** อย่างเดียว (ไม่ใช้ `job.fix.*`); งาน **PENDING / IN_PROGRESS** (รวมยังไม่มีผู้รับ); เติมได้ถึง 3 รูป ไม่ลบ/ไม่แทนที่; **5MB/ไฟล์** JPG/PNG/WebP (magic bytes) · HEIC/HEIF→JPEG ฝั่ง Nest; UI: `/dashboard/jobs/:id` + wrench modal ใน `JobsList`; หน้า public ยังไม่บังคับรูป; default seed **ADMIN** เท่านั้น (บทบาทอื่นติ๊กที่ `/dashboard/roles`; restart backend เพื่อ sync แคตตาล็อก). **Fallback 413:** frontend บีบรูปอัตโนมัติถ้า NPM ยัง ~1MB — [`backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md`](backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md)
   - **บันทึกการแก้ไขงาน**: `PATCH /jobs/:id/fix` — คุมสิทธิ์ผ่าน RBAC (`job.fix.self|any`); คง `IN_PROGRESS`; ถ้ามีรูปแก้ไขใน DB ≥ 2 รูปแล้ว **ไม่บังคับ** แนบไฟล์ใหม่ — แนบใหม่ ≥ 2 รูปจะแทนที่ชุดรูปเดิม
    - ต้องส่ง `fixEnvironment` (INDOOR/OUTDOOR), `brokenPartType` (Hardware/Software), `cause`, `fixMethod` และรูปอย่างน้อย 2 รูปแรก; `note` / Serial ไม่บังคับ — หลายอุปกรณ์ตาม [`docs/Job-Serial-Multi-Row.md`](docs/Job-Serial-Multi-Row.md)
   - **ปิดงาน**: `PATCH /jobs/:id/close` — สิทธิ์เดียวกับ `/fix`; บังคับลายเซ็นผู้แจ้ง (PNG) + ข้อมูลแก้ไขครบใน DB → `RESOLVED` + `fixDate` + อีเมล/PDF; UI ที่ `/dashboard/jobs/:id` และปุ่ม Sign ใน `JobsList` เมื่อป้าย「รอเซ็นผู้แจ้ง」
    - ถ้างานมีสถานะ `RESOLVED` ต้อง **`PATCH /jobs/:id/reopen`** ก่อนจึงจะบันทึกการแก้ไขได้อีก
  - **เปิดงานใหม่หลังปิด (Reopen)**: `PATCH /jobs/:id/reopen` — คุมสิทธิ์ผ่าน RBAC:
    - `job.reopen.any`: ทำได้ทุกงาน
    - `job.reopen.self`: ทำได้เฉพาะผู้รับงาน
    - `RESOLVED` → `IN_PROGRESS`, ล้าง `fixDate`, ต่อท้ายเหตุผลใน `fixNote`
   - **ตั้งค่าระบบ (`/settings/*`)**: ทุกเส้นต้อง JWT + สิทธิ์ **`menu.settings`** — รวม **SMTP** (`GET/PUT /settings/email-smtp`, `POST /settings/email-smtp/test`), **เทมเพลตอีเมล** (`GET/PUT /settings/email-templates`), **รหัสผ่านเริ่มต้น** (`GET/PUT /settings/default-pass`; `GET` คืนค่า `passwordSet` + `password` ให้หน้า settings แสดงรหัสปัจจุบัน), **MinIO orphan** (`POST /settings/minio/orphans/scan`, `POST /settings/minio/orphans/delete`) — เก็บใน `Setting`; nodemailer + `tlsRejectUnauthorized` / env `SMTP_TLS_REJECT_UNAUTHORIZED`; flow อีเมล [`docs/Email-Notifications.md`](docs/Email-Notifications.md); orphan: [`docs/MinIO-Orphan-Cleanup.md`](docs/MinIO-Orphan-Cleanup.md)
   - **Jobs**: สร้างงานตรวจสอบ Site ว่าจังหวัด/อำเภอ/สถานที่/ชื่อสถานีมีในระบบก่อน (`SitesService.existsByLocation`); บันทึก `Job.agency` + `Job.location`; `ticketNo` = **hex 8 ตัว** ตอนสร้าง — Running Doc No ออกตอน **`PATCH /jobs/:id/classify-doc`** หลัง `RESOLVED` (`job.classifyDoc` + ลายเซ็น); มอบหมาย/ย้าย OOC **ไม่** gen เลข; หลังสร้างงาน ถ้า `reporterPhone` ตรงกับผู้ใช้ในระบบจะ **เชื่อม `reporterId`** อัตโนมัติ (`UsersService.findByPhone`)
   - **รายการงาน (Dashboard)**: `GET /jobs/list` — ดึงรายการแจ้งซ่อม (JWT); ไม่มี `GET /api/jobs` แบบเปล่า — แยก path เพื่อไม่ให้สับสนกับ `POST /jobs` (แจ้งซ่อมสาธารณะ) เมื่อเปิด URL ในเบราว์เซอร์
   - **เปลี่ยนสถานะงาน**: `PATCH /jobs/:id/status` — ต้องมีสิทธิ์ **`job.updateStatus`**
   - **ลบงาน `DELETE /jobs/:id`**: ถ้ามีสิทธิ์ **`job.deleteInProgress`** และงานเป็น **IN_PROGRESS** จะลบได้ก่อน; มิฉะนั้นลบได้เฉพาะงาน **PENDING** ที่ยังไม่มอบหมาย — ต้องมี **`job.deleteUnassigned`** (อ่านจาก `RolesService.getPermissionsForUser`)
   - **จัดการบทบาท**: `GET/POST/PATCH/DELETE /roles/*` (ยกเว้น **`GET /roles/me/permissions`**) ต้องมี **`menu.roles`**
   - **พื้นที่ (`areas`)**: `POST /areas` ต้องมี **`site.create`** (สอดคล้องจัดการ Site)
   - **Validation แจ้งซ่อม (Public POST)**: DTO + Zod (`create-job.dto`) รวมถึง `reporterEmail` preprocess/trim; `ZodValidationPipe` รวม error message เป็น array ชัดเจน
   - **MinIO**: ค่าเริ่มต้น **ไม่** ตั้ง public read บน bucket (`MINIO_ENSURE_PUBLIC_READ_POLICY` ปิด); เก็บ URL ใน DB ตามเดิม; Nest ดึง object ด้วย **SDK** ใน `getJobImageBuffer` / `getAvatarImageBuffer` + fallback HTTP; **`MINIO_SERVER_FETCH_BASE_URL`** ใช้เมื่อต้องโหลดภายใน LAN; **`GET /users/:id/avatar`**, **`GET /users/me/avatar`**
   - **พิมพ์รายงาน / รูปงาน / แดชบอร์ด**: หน้าพิมพ์ — **`/job-images/...`** → Nest; แดชบอร์ด/สถานะเจ้าหน้าที่ — รูปงานผ่าน **`dashboardJobImagePath`** (`/job-images/...`); รูปโปรไฟล์ผ่าน **`/user-images/:userId`**; เอกสาร NPM: `backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md`
   - **Public API**: `GET /public/users/reporter-by-phone` **ไม่ส่ง** `image` URL (กันเปิดรูป MinIO โดยไม่ login)

3. 🖥️ **Frontend & UI Design (Glassmorphism Dark + Light): `🟢 สมบูรณ์`**
   - **Theme (2026-08-06):** `next-themes` + ปุ่ม Sun/Moon ใน `SiteHeader`; default **Dark**, `localStorage` key **`dtrs-theme`**; `--glass-*` tokens / `.glass-page` / `.glass-card` / `form-input-glass`; `/print/*` บังคับ light ผ่าน `PrintThemeShell` (class `.light`, ไม่ซ้อน ThemeProvider); contrast ตาราง JobsList / sites / roles / status badges ใน light mode
   - **RBAC Sidebar (แก้แล้ว):** `DashboardLayoutShell` แกะ response `/roles/me/permissions` แบบเดียวกับ `ResponseInterceptor`; ถ้า permission ที่ได้ไม่ map กับรายการเมนูใน sidebar จะ fallback ตามบทบาท; เมนูสำหรับ **SUPERVISOR** ในหมวดเดียวกับ STAFF (ภาพรวม, กำลังแก้ไข, ประวัติ, นอกสัญญา) สอดคล้องเอกสาร
   - **Unified Public Template (`PublicLayoutShell`)**: หน้า `/public/report`, `/public/status` และ `/login` ใช้ Layout และ Background Glassmorphism แบบเดียวกันทั้งหมด (เส้นทางเดิม `/report` และ `/status` redirect) สร้างความเป็นเอกภาพ (Consistency)
   - **Global Font เปลี่ยนเป็น `Sarabun`**: แก้ไข Layout หลักให้ดึงฟอนต์ Sarabun แทน Prompt เพื่อเพิ่มความเป็นทางการและดูหน้าเชื่อถือ
   - **shadcn/ui skill + project context**: ติดตั้งที่ `frontend/.agents/skills/shadcn`; อ้างอิง `components.json` ของโปรเจกต์นี้ (Next.js 15, Tailwind v4, `base`, `base-nova`, `lucide`) และใช้กับงาน `@/components/ui/*`
   - **Login**: กรอกอีเมลหรือชื่อผู้ใช้ + รหัสผ่าน มีปุ่มแสดง/ซ่อนรหัสผ่าน (password toggle) และใช้ primitive `Button` / `Input` / `Label` / `Alert`
   - **Report Page**: ดีไซน์แบบ Card-based UI `rounded-2xl`, เงานุ่มนวล และปรับฟอร์มหลักไปใช้ `Button` / `Input` / `Label` / `Textarea`
     - **ระบบดึงข้อมูลผู้แจ้งซ่อมจากเบอร์โทร:** มีการจำกัดความยาวเบอร์โทร 10 หลักและกรอกได้เฉพาะตัวเลข ระบบจะดึงข้อมูลผ่าน API `/users/reporter-by-phone/:phone` แบบอ่านอย่างเดียว (Read-only) เมื่อพบประวัติ
     - **ระบบค้นหาสถานที่ (Select2)**: นำ `react-select` มาใช้งานในช่องสถานที่ ส่งผลให้ผู้ใช้สามารถพิมพ์ค้นหาชื่อ จังหวัด/อำเภอ/หน่วยงาน ได้สะดวกรวดเร็วกว่า Dropdown แบบเก่า
   - **Status Page (`/public/status`)**: ค้นหาตามเบอร์/เลขที่ใบด้วย primitive `Input` / `Button`; ปุ่มดูสาเหตุและวิธีแก้ในตารางใช้ component เดียวกันกับ theme หลัก
   - **Dashboard Layout**: Sidebar **ไม่เลื่อนตาม scroll** (sticky ใน flex container; หน้าใช้ `h-screen overflow-hidden`)
   - **Dashboard ภาพรวม**: กราฟสัดส่วนสถานะ (Pie), จำนวนแจ้งซ่อมตามจังหวัด Top 8 (Bar), **แนวโน้มรายวัน 14 วัน** = แจ้งในวันนั้น vs เสร็จในวันนั้น (ใช้ `fixDate` สำหรับเสร็จ); เมนูด่วนอ้างอิง RBAC (permission); filter/report controls ใช้ `Button` / `Input` / `Label`
   - **หน้ารอดำเนินการ**: ปุ่ม **ดูรายละเอียด** → ไปหน้าเต็ม `/dashboard/jobs/:id` (ไม่ใช้ modal); ปุ่ม **มอบหมายงาน** ตามสิทธิ์ **`job.assign`**; ปุ่ม **รับงาน**; ปุ่ม **ลบงาน** ตาม **`job.deleteUnassigned`** — **ไม่มี** ปุ่มย้ายนอกสัญญา (ย้าย OOC หลังปิดงานผ่านจำแนกเอกสาร)
   - **งานที่รับผิดชอบ** (`/dashboard/my-jobs`): DataTable งานที่รับมอบหมายให้ผู้ใช้ปัจจุบัน พร้อม filter; ป้าย「รอเซ็นผู้แจ้ง」เมื่อแก้ครบแล้วยัง `IN_PROGRESS`; ปุ่ม Sign เปิด dialog ลายเซ็นผู้แจ้งจากรายการ (`PATCH /close`); ปุ่มดูรายละเอียดไปหน้า `/dashboard/jobs/:id`
  - **หน้ารายละเอียดงาน** (`/dashboard/jobs/:id`): แสดงเต็มพื้นที่ — การ์ดซ้าย "ข้อมูลการแจ้งข้อขัดข้อง" (card **รูปภาพปัญหาที่แจ้ง** อัปโหลดได้เมื่อมี **`job.issue.upload`** และงาน `PENDING`/`IN_PROGRESS`; เติมถึง 3 รูป), การ์ดขวา "ข้อมูลการแก้ไข" + ฟอร์ม **บันทึกการแก้ไข** (`PATCH /jobs/:id/fix`, คง `IN_PROGRESS`) และบล็อกแยก **ปิดงาน — ลายเซ็นผู้แจ้ง** (`PATCH /jobs/:id/close`); ลำดับฟอร์ม: `fixEnvironment` → `brokenPartType`; บังคับ cause, fixMethod และรูปอย่างน้อย 2 รูปแรก; **บันทึก/ปิดงาน และ Reopen คุมสิทธิ์ด้วย RBAC** (`job.fix.*`, `job.reopen.*`); มีปุ่ม Reopen เมื่อ `RESOLVED`; การ์ด **ไทม์ไลน์งาน**; card **Backfill วันที่** (`dd/mm/yyyy`); **หลังปิดงาน:** พิมพ์/PDF + **จำแนกเอกสาร** (`job.classifyDoc`) — พิมพ์ผ่าน **`/print/jobs/[id]`**
   - **หน้าแจ้งซ่อม** (`/report`): ผู้ใช้ทั่วไปยังต้องกด **ตรวจสอบ** ให้พบผู้แจ้งในระบบก่อนเลือกสถานที่; **เจ้าหน้าที่ที่ล็อกอิน** (บทบาท STAFF / ADMIN / SUPERVISOR) ใช้ flow แยก — โหลด `GET /sites` ทันที, กรอกเบอร์ 10 หลักแล้วดำเนินการต่อได้โดยไม่บังคับพบจากระบบ (กรอกชื่อ-สกุลเองเมื่อไม่พบ), ส่ง `POST /jobs` พร้อม **`Authorization: Bearer`** เมื่อมี session, หลังสำเร็จ redirect ไป **`/dashboard/jobs`**; แสดงข้อความ error จาก API ชัดเจน (`extractApiErrorMessage`)
  - **Component ร่วม**: `DashboardPageShell`, `DashboardFilterBar`, **`CrudModal`** (wrapper ของ `ui/Dialog`, portal ไป `document.body`, `z-100`, Glass ตาม theme, พร็อพ `size` md/lg; ใช้ที่ `/dashboard/users`, `/dashboard/roles` ฯลฯ), `JobsList` (รองรับ prop `assignedToMe`; modal รายละเอียด/มอบหมาย/อัปเดตการแก้ไขย้ายเป็น `Dialog` + `JobImageLightbox`), `modalGhostButtonStyles` (มาตรฐานปุ่ม `ghost` ใน modal/overlay), Toast (`toastSuccess` ปิดอัตโนมัติ 1.2 วินาที, `toastError`, `toastWarning`, `confirmDialog` — อ่าน theme จาก `html` class)
   - **ฟอร์มแดชบอร์ด**: ช่อง input แนะนำ class **`form-input-glass`** ใน `globals.css` (อ่าน `--glass-input-*` ทั้ง Dark/Light; แยกจาก `.form-input` legacy)
   - **หน้าจัดการบทบาท** (`/dashboard/roles`): modal สร้าง/แก้ไข/กำหนดสิทธิ์ — UI Glass ตาม theme + `form-input-glass` + กล่องรายการ permission แบบ scroll
   - **Sidebar**: ไม่แสดงเมนู "โปรไฟล์"; **เมนูผู้ใช้**: Dropdown ใน header มี โปรไฟล์ → `/dashboard/profile` และ ออกจากระบบ
   - **สัญญา/นอกสัญญา (Contract Tabs)**: `SegmentedTabs` บน `/dashboard/my-jobs`, `/dashboard/all`, `/dashboard/in-progress` เมื่อมีสิทธิ์ **`job.viewContractTabs`** (ไม่ติ๊ก = ไม่มีแท็บ และเห็นแค่งานในสัญญา) — แยกตาม `Job.isOutOfContract`; **ไม่ห่อด้วย card/glass ชั้นนอก**; **badge** จำนวนงานที่ยังไม่เสร็จ (ไม่นับ `RESOLVED`) ต่อแท็บ; บทบาทกำหนดเองติ๊กที่ `/dashboard/roles`
   - **Modal อัปเดตจากรายการงาน**: modal “ข้อมูลการแก้ไข”, modal รายละเอียด, และ modal มอบหมายใน `JobsList` ใช้ `Dialog`/`JobImageLightbox` ธีม **Glass ตาม theme** สอดคล้อง `AGENTS.md`; `AlertDialog` ใช้ `z-100`
   - **หน้าจัดการผู้ใช้**: คลิกรูปโปรไฟล์ในตารางเปิด lightbox ดูรูปใหญ่ (ปิดด้วยพื้นหลัง / X / Escape)
   - **Pending Table UX**:
     - ซ่อนคอลัมน์ “ผู้รับผิดชอบ” ใน `/dashboard/pending`
     - จัดลำดับปุ่มในคอลัมน์ “จัดการ” ให้ “ลบงาน” (`ลบงาน`) อยู่ท้ายสุด
     - ปุ่ม “ย้ายนอกสัญญา” แสดง `alert ยืนยัน` ก่อนย้าย และคงสถานะเดิมเป็น `PENDING`
   - **In-progress Update UX**: ปุ่ม “อัปเดต” ใน `/dashboard/in-progress` เปิด modal “ข้อมูลการแก้ไข” (ผู้รับงาน + `IN_PROGRESS`) พร้อมฟอร์มและอัปโหลดรูปแก้ไข (สูงสุด 3 รูป) แล้วบันทึก `PATCH /jobs/:id/fix` (คง `IN_PROGRESS`); ปุ่ม Sign ในรายการ (เมื่อรอเซ็น) เปิด dialog ลายเซ็นผู้แจ้ง (`PATCH /jobs/:id/close`) — ยังปิดงานที่หน้ารายละเอียดได้; คอลัมน์สถานะมีป้าย「รอเซ็นผู้แจ้ง」เมื่อแก้ครบแล้วยัง `IN_PROGRESS`; card รูปปัญหาที่แจ้งอัปโหลดเพิ่มได้เมื่อมี **`job.issue.upload`**; มีส่วน Reopen เมื่อทำงานเป็น Resolved แล้ว; ปุ่ม **ลบงาน (ผู้ดูแลระบบ)** แสดงตามสิทธิ์ **`job.deleteInProgress`** (`/roles/me/permissions`)
   - **Header Avatar**: header แสดงรูปโปรไฟล์เมื่อมี `session.user.image` และ fallback เป็น initials เมื่อไม่มีรูปหรือโหลดรูปไม่สำเร็จ

---

## 🔑 API Endpoints (localhost:4100/api)

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-----------|
| POST | `/backend-auth/login` | ❌ | เข้าสู่ระบบ (body: email หรือ username + password; คืนค่า access_token + user) |
| GET | `/users/reporters` | ❌ | ดึงรายชื่อผู้แจ้งซ่อม (Dropdown) |
| GET | `/users/me` | ✅ JWT | โปรไฟล์ผู้ใช้ที่ล็อกอินอยู่ |
| PATCH | `/users/me` | ✅ JWT | แก้ไขโปรไฟล์ตัวเอง (ชื่อ, อีเมล, เบอร์, ตำแหน่ง, รูป) |
| PATCH | `/users/me/password` | ✅ JWT | เปลี่ยนรหัสผ่านตัวเอง (currentPassword, newPassword) |
| GET | `/users/assignable` | ✅ JWT + **`job.assign`** | รายชื่อผู้ที่มอบหมายได้ (RBAC เดียวกับ modal มอบหมายในแดชบอร์ด) |
| GET | `/users` | ✅ JWT + **`menu.users`** | รายชื่อผู้ใช้ทั้งหมด |
| GET | `/users/:id` | ✅ JWT + **`menu.users`** | ดูข้อมูลผู้ใช้ |
| POST | `/users` | ✅ JWT + **`menu.users`** | สร้างผู้ใช้ |
| PATCH | `/users/:id` | ✅ JWT + **`menu.users`** | แก้ไขผู้ใช้ (ชื่อ, อีเมล, เบอร์, ตำแหน่ง, role, image) |
| PATCH | `/users/:id/password` | ✅ JWT + **`menu.users`** | เปลี่ยนรหัสผ่านผู้ใช้ |
| DELETE | `/users/:id` | ✅ JWT + **`menu.users`** | ลบผู้ใช้ |
| GET | `/roles/me/permissions` | ✅ JWT | สิทธิ์ของผู้ใช้ปัจจุบัน (sidebar / UI) |
| GET | `/roles` | ✅ JWT + **`menu.roles`** | รายการบทบาท (จัดการ roles) |
| GET | `/roles/permissions` | ✅ JWT + **`menu.roles`** | แคตตาล็อก permission ทั้งหมด |
| GET | `/roles/:id` | ✅ JWT + **`menu.roles`** | ดูบทบาทตาม id |
| GET | `/roles/:id/permissions` | ✅ JWT + **`menu.roles`** | id ของ permission ที่ผูกกับบทบาท |
| PATCH | `/roles/:id/permissions` | ✅ JWT + **`menu.roles`** | ตั้งสิทธิ์บทบาท |
| POST | `/roles` | ✅ JWT + **`menu.roles`** | สร้างบทบาท |
| PATCH | `/roles/:id` | ✅ JWT + **`menu.roles`** | แก้ไขบทบาท |
| DELETE | `/roles/:id` | ✅ JWT + **`menu.roles`** | ลบบทบาท |
| POST | `/jobs` | ❌ (อนุญาต Bearer แบบเสริมได้) | แจ้งซ่อมใหม่ (สาธารณะ; ตรวจสอบ Site ก่อนสร้าง; ฝั่งเจ้าหน้าที่อาจส่ง JWT เพื่อ audit / เชื่อม reporter จากเบอร์) |
| GET | `/jobs/list` | ✅ JWT | ดูรายการแจ้งซ่อมทั้งหมด (Dashboard / JobsList) |
| GET | `/jobs/:id/image/:kind/:index` | ✅ JWT | สตรีมรูป (`kind`= issue \| fix, `index`=0–2) จาก URL ใน `Job.images` / `Job.fixImages` — proxy same-origin ให้ frontend ไม่ติด CORS |
| GET | `/jobs/:id/report-pdf` | ✅ JWT | สร้างไฟล์ PDF รายงาน (โหลดหน้า `/print/jobs/:id` + Chromium) |
| PATCH | `/jobs/:id/assign` | ✅ JWT | มอบหมายงาน (RBAC): มี `job.assign` → `staffId` ใครก็ได้; ไม่มีแต่มี `menu.pending` และ `staffId` = ตัวเอง → รับงานเอง; `PENDING` → `IN_PROGRESS`; `IN_PROGRESS`/`RESOLVED` ไม่มีผู้รับผิดชอบ → ตั้งผู้รับงานคงสถานะ (ข้อมูล import); บันทึก `assignedById` |
| PATCH | `/jobs/:id/issue-images` | ✅ JWT + **`job.issue.upload`** | อัปโหลดรูปปัญหา (multipart `images`, สูงสุด 3 × **5MB**, JPG/PNG/WebP/HEIC→JPEG) — เติมต่อได้ถึง 3 รูป ไม่แทนที่; งาน `PENDING` หรือ `IN_PROGRESS` เท่านั้น |
| PATCH | `/jobs/:id/fix` | ✅ JWT | บันทึกการแก้ไข (RBAC `job.fix.*`); รูปแก้ไข — แนบใหม่ ≥ 2 รูป **หรือ** มีรูปใน DB ≥ 2 รูป; แนบ 1 รูปไม่รองรับ; **คง `IN_PROGRESS`**; ถ้ายัง `RESOLVED` ต้อง reopen ก่อน |
| PATCH | `/jobs/:id/close` | ✅ JWT | ปิดงาน (RBAC `job.fix.*`); บังคับลายเซ็นผู้แจ้ง PNG + ข้อมูลแก้ไขครบใน DB → `RESOLVED` + `fixDate` + อีเมล/PDF |
| PATCH | `/jobs/:id/reopen` | ✅ JWT | Reopen (RBAC): `job.reopen.any` ทำได้ทุกงาน, `job.reopen.self` ทำได้เฉพาะ assignee; `RESOLVED` → `IN_PROGRESS`, ล้าง `fixDate`, ต่อท้ายเหตุผลใน `fixNote` |
| PATCH | `/jobs/:id/status` | ✅ JWT + **`job.updateStatus`** | เปลี่ยนสถานะงาน |
| GET | `/settings/email-smtp` | ✅ JWT + **`menu.settings`** | อ่านการตั้งค่า SMTP (ไม่คืนรหัสผ่าน) |
| PUT | `/settings/email-smtp` | ✅ JWT + **`menu.settings`** | บันทึกการตั้งค่า SMTP (รหัสผ่านเข้ารหัสใน DB) |
| POST | `/settings/email-smtp/test` | ✅ JWT + **`menu.settings`** | ทดสอบส่งอีเมลด้วยค่าที่บันทึกแล้ว |
| GET | `/settings/email-templates` | ✅ JWT + **`menu.settings`** | อ่านเทมเพลตอีเมลแจ้งงาน (`email_templates`) |
| PUT | `/settings/email-templates` | ✅ JWT + **`menu.settings`** | บันทึกเทมเพลตอีเมล (รวม `publicBaseUrl`, `notifyRoleIds` ต่อเทมเพลต) |
| GET | `/settings/default-pass` | ✅ JWT + **`menu.settings`** | คืนค่า `{ passwordSet, password }` ให้หน้าตั้งค่าแสดงรหัสปัจจุบัน (สิทธิ์ `menu.settings` เท่านั้น) |
| PUT | `/settings/default-pass` | ✅ JWT + **`menu.settings`** | ตั้งรหัสผ่านเริ่มต้น |
| POST | `/settings/minio/orphans/scan` | ✅ JWT + **`menu.settings`** | สแกน object ใน MinIO ที่ไม่อ้างอิงจาก DB (pagination + กรองอายุขั้นต่ำ) — [`docs/MinIO-Orphan-Cleanup.md`](docs/MinIO-Orphan-Cleanup.md) |
| POST | `/settings/minio/orphans/delete` | ✅ JWT + **`menu.settings`** | ลบ key ที่เลือก พร้อมยืนยัน — [`docs/MinIO-Orphan-Cleanup.md`](docs/MinIO-Orphan-Cleanup.md) |
| PATCH | `/jobs/:id/out-of-contract` | ✅ JWT | ย้ายนอกสัญญา: ต้องมี **`job.assign`**; ตั้ง `isOutOfContract=true` โดย “คงสถานะเป็น PENDING”; **ไม่** ออก Running Doc No |
| PATCH | `/jobs/:id/classify-doc` | ✅ JWT + **`job.classifyDoc`** + `.contract` / `.outOfContract` | จำแนกเอกสารหลัง `RESOLVED`: แทนที่ hex ด้วย `CM-SHF-2002-XXXX` / `YYYYMM####` ครั้งเดียว + ตั้ง `isOutOfContract`; ต้องมีลายเซ็นโปรไฟล์; ปุ่มใน dialog แยกสิทธิ์ในสัญญา/นอกสัญญา |
| DELETE | `/jobs/:id` | ✅ JWT | ลบ **IN_PROGRESS**: ต้องมี **`job.deleteInProgress`**; ลบ **PENDING** ไม่มอบหมาย: **`job.deleteUnassigned`** |
| GET | `/sites` | ❌ Public | ข้อมูลพื้นที่โครงการ (สำหรับหน้าแจ้งปัญหา) |
| GET | `/areas` | ✅ JWT | ข้อมูลพื้นที่รับผิดชอบ |
| POST | `/areas` | ✅ JWT + **`site.create`** | สร้างพื้นที่รับผิดชอบ |

---

## 👤 User & Role (Role-based menu & RBAC)

- **ADMIN** (มาตรฐาน): เห็นทุกเมนู + ทุก permission ใน seed — รวม **`menu.users`**, **`menu.roles`**, **`menu.settings`**, **`job.deleteInProgress`**, **`job.updateStatus`**, **`job.issue.upload`**
- **STAFF** (มาตรฐาน): เห็นเมนูคิวงาน + **`job.updateStatus`** + fix/reopen แบบ self — ไม่มีเมนูผู้ใช้/roles/ตั้งค่า และไม่มี **`job.deleteInProgress`** / **`job.issue.upload`** (ติ๊กเองถ้าต้องการ)
- **SUPERVISOR (หัวหน้างาน, มาตรฐาน)**: เทียบเท่า STAFF + **`menu.sites`** + action งาน/site ครบยกเว้น **`job.deleteInProgress`**, **`job.backfillDate`**, **`job.issue.upload`** — มอบหมายงาน / ย้ายนอกสัญญา / **จำแนกเอกสาร (`job.classifyDoc`)** / ลบ PENDING ไม่มอบหมายได้ตามสิทธิ์ที่ติ๊กใน `/dashboard/roles` (STAFF **ไม่มี** `job.classifyDoc` โดย default)
- **USER**: ใช้สำหรับผู้แจ้งซ่อม (dropdown ในฟอร์มแจ้งปัญหา); เห็นเฉพาะ โปรไฟล์, แจ้งปัญหา, ตรวจสอบสถานะ

---

## 📐 Dashboard Routes (path ใต้ /dashboard)

ทุกหน้างานหลัง login อยู่ใต้ `/dashboard` เพื่อใช้ layout เดียว (sidebar + header) และตรวจสิทธิ์ได้จาก path เดียว

| Path | คำอธิบาย |
|------|----------|
| `/dashboard` | ภาพรวม (KPI, กราฟสัดส่วน/จังหวัด/แนวโน้มรายวัน 14 วัน, เมนูด่วน) |
| `/dashboard/pending` | รอดำเนินการ – DataTable + filter; ปุ่ม ดูรายละเอียด / มอบหมาย ตาม **`job.assign`** / รับงาน / ลบตาม **`job.deleteUnassigned`** — **ไม่มี** ปุ่มย้ายนอกสัญญา |
| `/dashboard/my-jobs` | **งานที่รับผิดชอบ** – งานที่รับมอบหมายให้ผู้ใช้ปัจจุบัน; DataTable + filter; แท็บสัญญา/นอกสัญญาตาม **`job.viewContractTabs`**; ป้าย「รอเซ็นผู้แจ้ง」เมื่อแก้ครบแล้วยัง `IN_PROGRESS`; ปุ่ม Sign ปิดงานจากรายการ |
| `/dashboard/jobs/:id` | รายละเอียดงานเต็มหน้า + ฟอร์มบันทึกการแก้ไข (`PATCH /fix`, คง `IN_PROGRESS`) + ปิดงานลายเซ็นผู้แจ้ง (`PATCH /close`); อัปโหลดรูปปัญหาเมื่อมี **`job.issue.upload`** (`PENDING`/`IN_PROGRESS`); พิมพ์/PDF เมื่อ Resolved; **จำแนกเอกสาร** เมื่อ `RESOLVED` + hex + **`job.classifyDoc`** (อยู่หน้าเดิมหลังออกเลข) |
| `/print/jobs/:id` | หน้าพิมพ์รายงานบำรุงรักษา (layout 2 หน้า, ปุ่มพิมพ์) |
| `/dashboard/in-progress` | กำลังแก้ไข – DataTable + filter; แท็บสัญญา/นอกสัญญาตาม **`job.viewContractTabs`** + badge งานค้าง; ป้าย「รอเซ็นผู้แจ้ง」เมื่อแก้ครบแล้วยัง `IN_PROGRESS`; ปุ่ม Sign ปิดงานจากรายการ; ลบงาน IN_PROGRESS ตาม **`job.deleteInProgress`** |
| `/dashboard/all` | **ข้อขัดข้อง** – ประวัติทั้งหมด; filter จังหวัด + pagination; แท็บสัญญา/นอกสัญญาตาม **`job.viewContractTabs`**; ปุ่ม Sign เมื่อรอเซ็น; **จำแนกเอกสาร** (`job.classifyDoc`); ซ่อน `RESOLVED` นอกสัญญาที่จำแนกแล้ว |
| `/dashboard/out-of-contract` | นอกสัญญา – `PENDING` OOC + `RESOLVED` OOC ที่จำแนกแล้ว (เมนู **`menu.outOfContract`**) |
| `/dashboard/users` | จัดการผู้ใช้ – DataTable + filter; ต้องมีเมนู **`menu.users`**; CRUD (Modal + Toast); เลือกบทบาทจาก `AppRole` (มาตรฐาน + ที่สร้างเอง) |
| `/dashboard/profile` | โปรไฟล์ – แก้ไขข้อมูลผู้ใช้ / เปลี่ยนรหัสผ่าน (เข้าได้จากเมนูผู้ใช้ dropdown; ไม่แสดงใน sidebar) |
| `/dashboard/settings` | ตั้งค่าระบบ — สิทธิ์ **`menu.settings`**; **SMTP** + **เทมเพลตอีเมลแจ้งงาน** + รหัสผ่านเริ่มต้น + **MinIO orphan** (สแกน/ลบไฟล์ค้าง); layout เนื้อหาแบบหน้า `/dashboard` — flow อีเมล: [`docs/Email-Notifications.md`](docs/Email-Notifications.md) · serial หลายแถว: [`docs/Job-Serial-Multi-Row.md`](docs/Job-Serial-Multi-Row.md) · orphan: [`docs/MinIO-Orphan-Cleanup.md`](docs/MinIO-Orphan-Cleanup.md) |

**หมายเหตุ:** `/dashboard/staff` ถูกลบแล้ว; redirect ไป `/dashboard/users`

**Content area:** แสดงผลเต็มพื้นที่ (full width) ทุกหน้า รายการใช้รูปแบบ **FilterBar + DataTable** พร้อมส่วน filter (ค้นหา, dropdown) และปุ่มรีเฟรช/เพิ่มตามหน้า

---

สร้าง user admin ครั้งแรก และ seed บทบาท/สิทธิ์ (รวม SUPERVISOR, `job.assign`, `job.classifyDoc`, `job.issue.upload` (ADMIN), `job.viewContractTabs`, `job.updateStatus`, `job.deleteInProgress` ฯลฯ — หรือให้ backend สตาร์ทเพื่อ `ensurePermissionCatalogSynced`):
```bash
cd backend && npx ts-node scripts/seed-admin.ts
npx ts-node scripts/seed-roles-permissions.ts
```
ค่าเริ่มต้น admin: username=`admin`, password=`admin123` (ควรเปลี่ยนหลัง login ครั้งแรก)  
บทบาท: ADMIN, STAFF, USER, **SUPERVISOR (หัวหน้างาน)** และบทบาทที่สร้างเองใน `/dashboard/roles` — ดูรายละเอียด RBAC ที่ `backend/docs/RBAC-Setup.md`

---

## 🟢 สถานะการทำงานปัจจุบัน

- **MinIO Integration (Phase 4)**: ระบบรองรับการอัปโหลดรูปภาพผ่าน MinIO แทน Base64 แล้ว
- **Employee Migration (Phase 5)**: ย้ายข้อมูลพนักงานและรูปภาพโปรไฟล์จาก AppSheet มายังระบบใหม่และ MinIO เรียบร้อยพื้นฐานแล้ว
- **รายงาน PDF / พิมพ์ (งาน Resolved)**: ใช้หน้า `/print/jobs/[id]` + `JobMaintenancePdfTemplate` + `print.css` (พิมพ์จากเบราว์เซอร์); ลบ dependency **html2canvas / jsPDF** ออกจากหน้ารายละเอียดงานแล้ว
- **แจ้งซ่อม + รายการงาน**: Validation/API ชัดเจนขึ้น; รายการใน Dashboard ใช้ **`GET /jobs/list`**; flow เจ้าหน้าที่บน `/report` แยกจากผู้ใช้ทั่วไป
- **ตั้งค่าอีเมล (SMTP) + Reopen (2026-03-22)**: API ตั้งค่า SMTP (ADMIN); **`PATCH /jobs/:id/fix`** และ **`PATCH /jobs/:id/reopen`** — เฉพาะผู้รับงาน; Frontend หน้า settings + Reopen ยืนยันก่อนเรียก API; `@nestjs/cli` v11; `JobsList` แท็บสัญญา/นอกสัญญาไม่ห่อ glass ชั้นนอก
- **เทมเพลตอีเมลแจ้งงาน + Role (2026-03-24)**: `GET/PUT /settings/email-templates`, `JobEmailNotificationService`, HTML โทนสว่าง + badge สถานะ; เอกสาร flow: [`docs/Email-Notifications.md`](docs/Email-Notifications.md)
- **UI Modal + บทบาท (2026-03-24, อัปเดตล่าสุด 2026-05-13)**: `CrudModal` — `Dialog` + portal, `z-100`, Glass ตาม theme; `/dashboard/roles` — `form-input-glass` + modal กำหนดสิทธิ์ (`size="lg"`)
- **Deploy / CI (2026-03-23)**: **GitLab CI** (`.gitlab-ci.yml`) + **`Dockerfile`** — build แยก frontend/backend; พอร์ต host **8404→3000**, **8405→4100**; **`FRONTEND_BASE_URL`**; production โดเมนเดียว + `/api` + `/socket.io`; pipeline ส่ง **`MINIO_SERVER_FETCH_BASE_URL`** เข้า backend เมื่อตั้งใน GitLab Variables — รายละเอียด PRD ใน `README.md`
- **GitLab CI UAT+PRD (2026-08-05)**: pipeline **`test` → `build` → `deploy_docker`** — branch **`staging`** (UAT `nurdin@192.168.0.115`) / **`main`/`master`** (PRD build `.115` → **`transfer:prd:images`** ด้วย **`DOCKER_HOST_PRD`** + `docker load` → deploy `nurdin@192.168.0.128`); stage **`deploy_docker` ทุก job manual** (`docker_build` / `transfer` / `deploy:*:docker`); **`.deploy_ssh_and_validate`** ตรวจกลุ่ม A ก่อน deploy; แผน [`docs/GitLab-CI-Plan.md`](docs/GitLab-CI-Plan.md) · Variables [`docs/GitLab-CI-Variables-Checklist.md`](docs/GitLab-CI-Variables-Checklist.md)
- **CI hardening (2026-08-06)**: deploy **health check** (container Running + logs); transfer verify ใช้ `export DOCKER_HOST`; **`test:backend`** รัน eslint ห้าม `--fix`; cleanup **`needs`** ไม่รอ manual deploy; docs บังคับ **`prisma migrate deploy`** ก่อนกด deploy ครั้งแรก
- **RBAC คิวงาน (2026-03-30)**: `PATCH /jobs/:id/assign`, `PATCH /jobs/:id/out-of-contract`, และลบ `PENDING` ไม่มอบหมายใน **`DELETE /jobs/:id`** ใช้ **`getPermissionsForUser`** สอดคล้อง `/dashboard/roles`; `JobsList` แสดงปุ่มมอบหมาย/ย้ายนอกสัญญาตาม **`job.assign`**
- **RBAC แท็บสัญญา/นอกสัญญา + บทบาทกำหนดเอง (2026-08-14)**: `JobsList` แสดงแท็บเมื่อมี **`job.viewContractTabs`**; `User.role` เป็น `VARCHAR` (`AppRole.code`) — [`CHANGELOG.md`](CHANGELOG.md), [`backend/docs/RBAC-Setup.md`](backend/docs/RBAC-Setup.md)
- **Meeting-11082026 Doc No / จำแนกเอกสาร (2026-08-14)**: สร้างงานออก hex; Running Doc No ตอน `PATCH /jobs/:id/classify-doc` (`job.classifyDoc`); UI บน `/dashboard/all` + `/dashboard/jobs/:id`; งานนอกสัญญาที่จำแนกแล้วอยู่ `/dashboard/out-of-contract` — [`docs/Meeting-11082026-Requirements-Plan.plan.md`](docs/Meeting-11082026-Requirements-Plan.plan.md), [`docs/System-Workflow.md`](docs/System-Workflow.md)
- **อัปโหลดรูปปัญหา (2026-08-17)**: `PATCH /jobs/:id/issue-images` + สิทธิ์ **`job.issue.upload`** (ไม่ผูก `job.fix.*`); งาน PENDING/IN_PROGRESS เติมได้ถึง 3 รูป; **5MB/ไฟล์** JPG/PNG/WebP/HEIC→JPEG; fallback บีบรูปฝั่ง browser เมื่อ NPM ได้ 413; unit/e2e ใน `job-image-upload.spec.ts` + `public-jobs-upload.e2e-spec.ts` + `jobs-issue-images.e2e-spec.ts` — [`backend/docs/RBAC-Setup.md`](backend/docs/RBAC-Setup.md), [`CHANGELOG.md`](CHANGELOG.md)
- **แยกบันทึกแก้ไข / ปิดงาน (2026-08-17)**: `PATCH /jobs/:id/fix` คง `IN_PROGRESS`; `PATCH /jobs/:id/close` ลายเซ็นผู้แจ้ง → `RESOLVED`; unit `jobs-close.service.spec.ts` + e2e `jobs-close.e2e-spec.ts` — [`TASK.md`](TASK.md) §34
- **ป้ายรอเซ็นผู้แจ้ง (2026-08-17)**: ใน `JobsList` (คอลัมน์สถานะ + modal) เมื่อ `IN_PROGRESS` และข้อมูลแก้ไขครบ — ไม่เพิ่มสถานะใหม่; unit `jobFixImageSlots.test.ts`
- **ปิดงานจากรายการ (2026-08-18)**: ปุ่ม Sign ใน `JobsList` เมื่อป้าย「รอเซ็นผู้แจ้ง」เปิด `JobReporterSignDialog` (`PATCH /close`, สิทธิ์เดิม `job.fix.self|any`); ปุ่มประแจยังจำกัดผู้รับงาน; modal ประแจเปิด dialog เซ็นแทนการพาไปหน้ารายละเอียด — [`CHANGELOG.md`](CHANGELOG.md)
- **RBAC API เต็มชุด (2026-03-31)**: `roles` / `users` / `settings` → **`menu.roles`**, **`menu.users`**, **`menu.settings`**; `PATCH /jobs/:id/status` → **`job.updateStatus`**; ลบ IN_PROGRESS → **`job.deleteInProgress`**; `POST /areas` → **`site.create`**; `RBAC_ROLE_PERMISSION_CODES` ร่วมกับ `PermissionsGuard`; `JobsService` ใช้ `RolesService.getPermissionsForUser`
- **Serial หลายอุปกรณ์ + MinIO orphan + พิมพ์ (2026-04-02)**: `oldSerialNumber`/`newSerialNumber` รองรับ JSON หลายแถว (สูงสุด 4) + migration `TEXT`; หน้า settings — `POST /settings/minio/orphans/scan|delete`, retention 7 วัน; PDF — หัวข้อรายการอุปกรณ์แยกบรรทัดจากแถวแรก; `GET /settings/default-pass` คืน `password` ให้หน้า settings — เอกสาร [`docs/Job-Serial-Multi-Row.md`](docs/Job-Serial-Multi-Row.md), [`docs/MinIO-Orphan-Cleanup.md`](docs/MinIO-Orphan-Cleanup.md)
- **shadcn rollout + docs sync (2026-05-13)**: ติดตั้ง `frontend/.agents/skills/shadcn`; audit `components.json`/`globals.css`/`package.json`; `CrudModal` ย้ายเป็น `Dialog`; `JobsList` modal รายละเอียด/มอบหมาย/อัปเดตย้ายเป็น `Dialog`; หน้า `login`, `/public/report`, `/public/status`, `/dashboard`, `/dashboard/settings`, `/dashboard/profile`, `/print/jobs/[id]` ใช้ primitive จาก `@/components/ui/*` มากขึ้น และ build ฝั่ง frontend ผ่านหลังปรับ
- **งานเก็บ polish หน้า dashboard/jobs + modal overlay (2026-05-13)**: card backfill วันที่บน `/dashboard/jobs/:id` เปลี่ยนเป็นกรอก **`dd/mm/yyyy`** พร้อม validation/preview ปฏิทินไทย; `JobImageLightbox` ปรับความสูง container ให้รูปใน modal แสดงจริง; report modal บน `/dashboard` เปลี่ยน backdrop จาก `Button` เป็น overlay ปกติ; ปุ่ม `ghost` ใน `Dialog`/`JobAssignDialog`/`JobImageLightbox` รวมมาตรฐาน `hover` / `focus-visible` ผ่าน utility กลาง และ `npm run build` ฝั่ง frontend ผ่านหลังแก้
- **Light / Dark theme (2026-08-06)**: `next-themes` + `ThemeToggle` ใน header; default Dark; `--glass-*` + contrast ตาราง/ฟิลเตอร์ใน light mode; print isolate ผ่าน `PrintThemeShell` — [`CHANGELOG.md`](CHANGELOG.md), [`frontend/README.md`](frontend/README.md)
- **พิมพ์ + รูปงานบน PRD (2026-03-28)**: รูปในเทมเพลตผ่าน **`/job-images/...`** บน Next; Nest **`MINIO_SERVER_FETCH_BASE_URL`** แก้กรณี backend โหลด MinIO ทาง public URL ไม่ได้ → **502** พร้อม log `getJobImageBuffer failed` ถ้ายังไม่ตั้งค่า
- **Backend Docker entry (Nest + nodenext)**: image backend ใช้ **`node dist/src/main.js`** — ไม่ใช่ `dist/main.js`; สาเหตุเดิมของ error PRD `MODULE_NOT_FOUND` คือ path entry ไม่ตรงกับผล compile
- **Frontend build (2026-03-23)**: `apiResponse.ts`; **`/public/report`** ใช้ `<Suspense>` รอบ `useSearchParams` เพื่อให้ `next build` ผ่าน
- **Deploy PRD (2026-03-23 ต่อ):** `next.config.mjs` (ไม่ต้องมี TypeScript ใน runner image); **`API_INTERNAL_BASE_URL`** สำหรับ `authorize()` → backend ใน Docker network; GitLab ส่ง **`ALLOWED_ORIGINS`** เข้า backend container
- **MinIO GitLab Variables (2026-08-06):** กลุ่ม B ครบบน UI — `MINIO_PORT` / `MINIO_PUBLIC_URL` / `MINIO_SERVER_FETCH_BASE_URL` = scope **all**; ตรวจ bucket ตาม `MINIO_BUCKET_NAME` หลัง deploy UAT

---

## 🚀 แผนงานถัดไป (Phase 6)

- [x] ตั้ง GitLab CI/CD Variables กลุ่ม A scope **`staging`** ✅ — [`docs/GitLab-CI-Variables-Checklist.md`](docs/GitLab-CI-Variables-Checklist.md)
- [ ] **โฟกัส UAT:** `prisma migrate deploy` (DB UAT) → push `staging` → ตรวจ Docker `:2375` บน `.115` → manual `deploy:uat:docker`
- [ ] ⏸️ **pending:** Variables กลุ่ม A scope **`production`** · NPM — ทำหลัง UAT นิ่ง
- [x] MinIO กลุ่ม B บน GitLab ✅ (2026-08-06) — ตรวจอัปโหลดหลัง deploy UAT
- [ ] รัน Seed Script บน **UAT/PRD** (และ seed-admin ถ้ายังไม่มี admin) — **`seed-locations-from-mssql.ts`** เมื่อ Locations ว่าง · **`seed-sites-from-xlsx.ts`** หลัง migration `Site.station`/`Job.agency` (local ✅ 198 แถวแล้ว) — ดู [`docs/Locations-Master-Seed.md`](docs/Locations-Master-Seed.md), [`docs/Sites-Import.md`](docs/Sites-Import.md)
- [ ] ติดตั้ง Socket.io บน Frontend เพื่อ Real-time Notifications
- [x] ระบบออกรายงาน PDF / พิมพ์ — ใช้หน้า `/print/jobs/[id]` + เทมเพลต + `print.css` (แทนการดาวน์โหลด html2canvas บนหน้ารายละเอียด); ปรับแต่ง layout เพิ่มเติมทำได้เป็นงานต่อยอด
- [ ] พัฒนาหน้าจอ Admin สำหรับการจัดการบทบาทและสิทธิ์แบบ Visual
- [x] ป้าย「รอเซ็นผู้แจ้ง」ในรายการงาน เมื่อ `IN_PROGRESS` แต่บันทึกการแก้ไขครบ — ปุ่ม Sign ปิดงานจากรายการ — [`TASK.md`](TASK.md) §34
