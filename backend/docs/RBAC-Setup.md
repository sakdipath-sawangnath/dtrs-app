# การตั้งค่าระบบ RBAC (บทบาทและสิทธิ์)

## โครงสร้างฐานข้อมูล

- **AppRole** — บทบาท (ADMIN, STAFF, USER, SUPERVISOR หรือชื่อที่สร้างเอง)
- **Permission** — สิทธิ์ (เช่น menu.dashboard, menu.users)
- **RolePermission** — ผูกสิทธิ์ให้บทบาท (many-to-many)
- **User.role** — `VARCHAR` เก็บ `AppRole.code` (รวมบทบาทที่สร้างเอง เช่น `ADMIN_1`)
- **User.roleId** — ผูกสิทธิ์จากตาราง Role/Permission (ถ้ามีจะใช้สิทธิ์จากตาราง)

## ขั้นตอนหลังเพิ่ม Schema

1. อัปเดตฐานข้อมูล:
   ```bash
   cd backend
   npx prisma db push
   # หรือ npx prisma migrate dev --name add-rbac
   ```

2. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

3. Seed บทบาทและสิทธิ์ (สร้าง AppRole, Permission, RolePermission และ sync User.roleId):
   ```bash
   npx ts-node scripts/seed-roles-permissions.ts
   ```

## สิทธิ์เมนู (Permission codes)

| Code | ชื่อ |
|------|------|
| menu.profile | โปรไฟล์ |
| menu.report | แจ้งปัญหา |
| menu.status | ตรวจสอบสถานะ |
| menu.dashboard | ภาพรวม |
| menu.pending | รอดำเนินการ |
| menu.inProgress | กำลังแก้ไข |
| menu.all | ประวัติทั้งหมด |
| menu.outOfContract | นอกสัญญา |
| menu.users | จัดการผู้ใช้ |
| menu.settings | ตั้งค่าระบบ (หน้า `/dashboard/settings` — **SMTP**, **เทมเพลตอีเมลแจ้งงาน**, **รหัสผ่านเริ่มต้น**); API `GET/PUT /settings/*` ต้อง JWT + สิทธิ์นี้ — สรุป flow อีเมล: [`../../docs/Email-Notifications.md`](../../docs/Email-Notifications.md) |
| menu.roles | จัดการบทบาทและสิทธิ์ |
| menu.myJobs | งานที่รับผิดชอบ (รายการงานที่รับมอบหมาย) |
| job.assign | มอบหมายงานให้ผู้อื่น (ปุ่ม «มอบหมายงาน») และ **ย้ายนอกสัญญา** (`PATCH /jobs/:id/out-of-contract`) — UI `JobsList` และ API อิงสิทธิ์เดียวกับที่กำหนดใน `/dashboard/roles` |
| job.viewContractTabs | ดูแท็บ **สัญญา/นอกสัญญา** ใน `JobsList` (`/dashboard/all`, `/dashboard/my-jobs`, `/dashboard/in-progress`); หน้าภาพรวม `/dashboard` และ `GET /jobs/reports/summary-pdf` นับเฉพาะงานในสัญญาเมื่อไม่มีสิทธิ์นี้ — ไม่ใช่เมนู sidebar `menu.outOfContract` |
| job.classifyDoc | จำแนกเอกสารหลังปิดงาน (`PATCH /jobs/:id/classify-doc`) — เห็นปุ่ม / เปิด dialog; UI: `/dashboard/all` + `/dashboard/jobs/:id`; ออก Running Doc No ครั้งเดียว; default **ADMIN + SUPERVISOR** |
| job.classifyDoc.contract | เลือกจำแนก **ในสัญญา** (`CM-SHF-YYYY-…`) ใน dialog |
| job.classifyDoc.outOfContract | เลือกจำแนก **นอกสัญญา** (`YYYYMM…` + ย้ายเมนูนอกสัญญา) ใน dialog |
| job.issue.upload | อัปโหลดรูปปัญหาที่แจ้ง (`PATCH /jobs/:id/issue-images`) — UI: `/dashboard/jobs/:id` + wrench modal ใน `JobsList`; งาน **PENDING / IN_PROGRESS**; เติมได้ถึง 3 รูป ไม่ลบ/ไม่แทนที่; **5MB/ไฟล์** JPG/PNG/WebP/HEIC→JPEG; default **ADMIN** เท่านั้น (บทบาทอื่นติ๊กที่ `/dashboard/roles`) |
| job.updateStatus | เปลี่ยนสถานะงาน (`PATCH /jobs/:id/status`) |
| job.deleteInProgress | ลบงานสถานะ **กำลังแก้ไข** (`DELETE /jobs/:id` เมื่อ `IN_PROGRESS`) — UI `JobsList` หน้า `/dashboard/in-progress` |
| job.deleteUnassigned | ลบงานที่ยังไม่มีผู้รับผิดชอบ |
| job.fix.self | บันทึก/ปิดงาน (เฉพาะงานที่รับผิดชอบ) |
| job.fix.any | บันทึก/ปิดงาน (ทุกงาน) |
| job.reopen.self | Reopen งาน (เฉพาะงานที่รับผิดชอบ) |
| job.reopen.any | Reopen งาน (ทุกงาน) |

> **หมายเหตุ (Deploy):** บน GitLab CI ใช้ตัวแปร **`FRONTEND_BASE_URL`** เป็น URL หน้าเว็บ PRD (รวมลิงก์ Environment และส่งเข้า container) — สอดคล้อง `JobsPdfService` ฝั่ง backend

## บทบาทเริ่มต้น

| Code | ชื่อ | คำอธิบาย |
|------|------|----------|
| ADMIN | ผู้ดูแลระบบ | ทุกเมนู + มอบหมายงานได้ |
| STAFF | ช่างเทคนิค | ภาพรวม, รอดำเนินการ, กำลังแก้ไข, ประวัติ, นอกสัญญา — รับงานตัวเองได้ |
| USER | ผู้แจ้งซ่อม | โปรไฟล์, แจ้งปัญหา, ตรวจสอบสถานะ |
| SUPERVISOR | หัวหน้างาน | เทียบเท่า STAFF + สิทธิ์ job.assign (มอบหมายงานให้เจ้าหน้าที่ได้) |

## การทำงาน

- **API แอดมินเมนู:** `roles` / `users` / `settings` ใช้ **`PermissionsGuard`** กับ `menu.roles`, `menu.users`, `menu.settings` (ไม่ใช้แค่ `@Roles('ADMIN')` บน JWT) — บทบาทกำหนดเองที่ได้รับสิทธิ์เมนูนั้นเรียก API ได้
- **Login / Session:** JWT ยังมี `user.role` สำหรับการแสดงผลบางจุด — การตรวจสิทธิ์ API หลักอิง **Permission ใน DB** ตามด้านล่าง
- **สิทธิ์ฝั่ง API (คิวงาน):** `PATCH /jobs/:id/assign`, `PATCH /jobs/:id/out-of-contract`, `PATCH /jobs/:id/status` (ผ่าน `PermissionsGuard` + `job.updateStatus`), การลบ **IN_PROGRESS** (`job.deleteInProgress`) และการลบงาน `PENDING` ที่ยังไม่มอบหมาย (`job.deleteUnassigned` ใน `DELETE /jobs/:id`) ใช้ **`RolesService.getPermissionsForUser(userId)`** ชุดเดียวกับ `GET /roles/me/permissions` (อ่านจาก `User.roleId` → `RolePermission`) เพื่อให้ตรงกับหน้า `/dashboard/roles`; ผู้ใช้ที่ยังไม่มี `roleId` ใน DB ให้ **`PermissionsGuard`** fallback ตาม enum JWT ผ่าน **`RBAC_ROLE_PERMISSION_CODES`** เดียวกับ `RolesService`
- **มอบหมายงาน (API):** มีสิทธิ์ `job.assign` → มอบหมาย `staffId` เป็นใครก็ได้; ไม่มี `job.assign` แต่มี `menu.pending` และ `staffId` = ตัวเอง → **รับงานเอง** (เดิมคือพฤติกรรม STAFF). กติกาสถานะ: งานที่ยังไม่มีผู้รับผิดชอบ (`PENDING`, `IN_PROGRESS`, หรือ `RESOLVED` ที่ `assignedToId` เป็น `null`) → ตั้งผู้รับงานและเปลี่ยนเป็น **`IN_PROGRESS`** (ถ้าเดิมเป็น `RESOLVED` จะล้าง `fixDate` ด้วย); ถ้ามีผู้รับผิดชอบแล้วจะปฏิเสธ (ยังไม่รองรับ reassign). **`POST /jobs/bulk-assign`** — มอบหมายหลาย `jobIds` พร้อมกัน (สูงสุด 50 รายการ) ใช้สิทธิ์เดียวกับ `PATCH /jobs/:id/assign`; หน้า `/dashboard/all` รองรับเลือกหลายแถว
- **ข้อมูลผู้มอบหมาย (assignedById):** ทุกครั้งที่เรียก `PATCH /jobs/:id/assign` ระบบจะบันทึก `assignedById` เป็น “ผู้กดมอบหมาย/รับงาน” (จาก JWT) และคืน `assignedBy` ใน response ของ `GET /jobs/:id` เพื่อให้ UI แยกการ์ด **มอบหมายงาน** (มีผู้มอบหมาย) กับ **รับงานเอง** (ผู้มอบหมาย = ผู้รับงาน) ได้อย่างถูกต้อง; งานเก่าหรือข้อมูลที่ยังไม่เคยบันทึกฟิลด์นี้ อาจมี `assignedBy=null` และจะแสดง fallback ใน UI
- **รายชื่อผู้รับมอบหมาย:** `GET /users/assignable` ใช้ **`PermissionsGuard` + `job.assign`** (ไม่ใช้แค่ JWT role ADMIN/SUPERVISOR/STAFF) — ให้ตรงกับผู้ที่เปิด modal มอบหมายใน `JobsList`
- **Sidebar:** เรียก `GET /roles/me/permissions` เพื่อดึงสิทธิ์ของ user แล้วแสดงเฉพาะเมนูที่ user มีสิทธิ์ — ฝั่ง `DashboardLayoutShell` ต้อง **แกะ `data` จาก body มาตรฐาน** (`{ success, data: { permissions } }`) เหมือนหน้าอื่นที่ใช้ `unwrapApiData`; ถ้ารายการสิทธิ์ที่ได้ **ไม่ตรงกับเมนูใน sidebar เลย** (เช่น มีแค่ `menu.profile`) ให้ **fallback ตามบทบาท** เพื่อไม่ให้เมนูว่าง
- **หน้าจัดการบทบาท:** `/dashboard/roles` (เฉพาะ ADMIN ที่มีสิทธิ์ menu.roles) — สร้าง/แก้ไขบทบาท และกำหนดสิทธิ์ (checkbox) ให้แต่ละบทบาท; UI ใช้ **`CrudModal`** (portal + `z-100`) และฟิลด์ **`form-input-glass`** ตาม `frontend/src/app/globals.css` — ดูภาพรวม UI ที่ `README.md` / `STATUS.md`
- **ผู้ใช้:** ตอนสร้าง/แก้ไข user เลือกบทบาทจาก `AppRole` (มาตรฐาน ADMIN/STAFF/USER/SUPERVISOR หรือที่สร้างเอง) — ระบบตั้ง `User.roleId` และเก็บ `User.role` เป็น `AppRole.code` (`VARCHAR`)
- **มอบหมายงาน (UI):** `JobsList` และ `/dashboard/jobs/:id` แสดงปุ่ม «มอบหมายงาน» / «รับงาน» เมื่องานยังไม่มีผู้รับผิดชอบ (`jobNeedsAssignee` — รวม `PENDING`, `IN_PROGRESS`, `RESOLVED`) โดยปุ่มมอบหมายต้องมี **`job.assign`** (โหลดจาก `/roles/me/permissions`; fallback บทบาท ADMIN/SUPERVISOR) ปุ่ม «รับงาน» เรียก `PATCH /jobs/:id/assign` เป็นตัวเองเมื่อ API อนุญาต (`menu.pending` หรือ `job.assign`)
- **ย้ายนอกสัญญา:** ปุ่ม «ย้ายนอกสัญญา» แสดงเมื่อมี **`job.assign`** (เดิมเทียบเท่า ADMIN/SUPERVISOR); ก่อนเรียก `PATCH /jobs/:id/out-of-contract` มี `alert` ยืนยัน; ระบบคงสถานะงานเป็น `PENDING`
- **ลบงานที่ยังไม่มีผู้รับผิดชอบ:** ปุ่ม «ลบงาน» ใน `/dashboard/pending` จะขึ้นเมื่อ job.status เป็น `PENDING` และ `assignedToId = null` โดยต้องมี permission **`job.deleteUnassigned`** (ฝั่ง UI อ่านจาก `/roles/me/permissions`; ถ้ายังไม่โหลดให้ fallback ตามบทบาท ADMIN/SUPERVISOR)
- **ลบงานกำลังแก้ไข:** ที่หน้า `/dashboard/in-progress` แสดงปุ่ม “ลบงาน (ผู้ดูแลระบบ)” เมื่อมีสิทธิ์ **`job.deleteInProgress`** (อ่านจาก `/roles/me/permissions`) — เรียก `DELETE /jobs/:id`; backend ลบ **IN_PROGRESS** เมื่อมีสิทธิ์นี้ก่อน แล้วจึง fallback ไปลบแบบ PENDING ไม่มอบหมาย (`job.deleteUnassigned`)
- **สัญญา/นอกสัญญา Tabs:** หน้า `/dashboard/my-jobs`, `/dashboard/all`, และ `/dashboard/in-progress` แสดง segmented tabs “สัญญา/นอกสัญญา” เมื่อมีสิทธิ์ **`job.viewContractTabs`** (อ่านจาก `/roles/me/permissions`; fallback บทบาท ADMIN/STAFF/SUPERVISOR) แยกตาม `Job.isOutOfContract` (ค่าเริ่มต้น = “สัญญา”) และมี **badge** จำนวนงานค้าง (ยังไม่ `RESOLVED`) ต่อแท็บ — บทบาทกำหนดเองต้องติ๊กสิทธิ์นี้ที่ `/dashboard/roles`
- **ภาพรวม + PDF สรุป:** ไม่มี **`job.viewContractTabs`** → `/dashboard` กรองงานนอกสัญญาออกจากการ์ดสรุป/กราฟ/สรุปวิเคราะห์ และซ่อน card «นอกสัญญา · ยังไม่ปิด»; `GET /jobs/reports/summary-pdf` กรองชุดข้อมูลเดียวกันและไม่โชว์ KPI นอกสัญญา
- **อัปโหลดรูปปัญหา:** card «รูปภาพปัญหาที่แจ้ง» บน **`/dashboard/jobs/:id`** และ wrench modal ใน `JobsList` แสดงช่องอัปโหลดเมื่อมี **`job.issue.upload`** และงานเป็น `PENDING` หรือ `IN_PROGRESS` (รวมยังไม่มีผู้รับ); เติมช่องว่างได้ถึง 3 รูป ไม่ลบ/ไม่แทนที่รูปเดิม; **5MB/ไฟล์** JPG/PNG/WebP (magic bytes) · HEIC/HEIF แปลงเป็น JPEG ฝั่ง Nest; หน้า public ยังไม่บังคับรูป; ต้อง JWT + `PermissionsGuard`; หลังเพิ่มสิทธิ์ในแคตตาล็อกให้ restart backend (หรือรัน seed) แล้วติ๊กบทบาทที่ `/dashboard/roles`. ถ้า NPM ยังไม่ตั้ง `client_max_body_size` frontend จะบีบรูปแล้ว retry หลัง 413 — [`Reverse-Proxy-Nginx-Proxy-Manager.md`](Reverse-Proxy-Nginx-Proxy-Manager.md)
- **จำแนกเอกสาร:** ปุ่มบน **`/dashboard/all`** และ **`/dashboard/jobs/:id`** เมื่องาน `RESOLVED` และยังเป็น hex — ต้องมี **`job.classifyDoc`** + ลายเซ็นโปรไฟล์ เพื่อเปิด dialog; ปุ่ม「ในสัญญา」ต้องมี **`job.classifyDoc.contract`** / 「นอกสัญญา」ต้องมี **`job.classifyDoc.outOfContract`** (ไม่มีทั้งคู่ → ข้อความ「คุณไม่มีสิทธิ์จำแนกประเภทเอกสาร…」); API ตรวจ key ย่อยตาม `isOutOfContract`; บทบาทที่มี `job.classifyDoc` ได้ทั้งสอง key **รอบแรก** ที่แคตตาล็อกเพิ่มลูก (หรือ seed / ยังไม่มี RolePermission ของลูกเลย) แล้วไปเอาออกได้ที่ `/dashboard/roles` (restart ไม่คืนสิทธิ์ที่ติ๊กออก); `PATCH /jobs/:id/classify-doc` แทนที่ `ticketNo` ด้วย `CM-SHF-YYYY-…` (ปี Asia/Bangkok ณ วันจำแนก; running ไม่รีเซ็ต) หรือ `YYYYMM…` ครั้งเดียว; งานนอกสัญญาที่จำแนกแล้วไม่โชว์ใน `/dashboard/all` และ `/dashboard/my-jobs` แต่ไป `/dashboard/out-of-contract`; จากหน้ารายละเอียดอยู่หน้าเดิมแล้วรีโหลดเลข
- **บันทึกการแก้ไข (`PATCH /jobs/:id/fix`):** คง `IN_PROGRESS` ไม่รับลายเซ็นผู้แจ้ง
  - `job.fix.any` ทำได้ทุกงาน
  - `job.fix.self` ทำได้เฉพาะงานที่เป็นผู้รับงาน (`assignedToId`)
- **ปิดงาน (`PATCH /jobs/:id/close`):** ลายเซ็นผู้แจ้ง + ข้อมูลแก้ไขครบ → `RESOLVED` — สิทธิ์เดียวกับ `/fix`; UI ที่ **`/dashboard/jobs/:id`** และปุ่มไอคอนเซ็นใน **`JobsList`** (งานที่รับผิดชอบ / กำลังแก้ไข / ประวัติทั้งหมด) เมื่อมีป้าย「รอเซ็นผู้แจ้ง」; ป้ายนี้ไม่ใช่สถานะใหม่ — อยู่ข้างสถานะกำลังแก้ไขเมื่อแก้ครบแล้วยังไม่ปิด
- **Reopen (`PATCH /jobs/:id/reopen`):**
  - `job.reopen.any` ทำได้ทุกงาน
  - `job.reopen.self` ทำได้เฉพาะงานที่เป็นผู้รับงาน (`assignedToId`)
- **อัปเดตงานในกำลังแก้ไข (UI):** หน้า `/dashboard/in-progress` และหน้า `/dashboard/jobs/:id` จะเปิดปุ่มตาม permission ด้านบน (อิง `/roles/me/permissions`) ไม่ hardcode role
- **Sidebar:** เมนู "โปรไฟล์" ไม่แสดงใน sidebar; เข้าได้จากเมนูผู้ใช้ (dropdown) เท่านั้น เมนู "งานที่รับผิดชอบ" (`menu.myJobs`) แสดงสำหรับ ADMIN, STAFF, SUPERVISOR

---

## หมายเหตุ: รูปโปรไฟล์และรูปงาน (ไม่ใช่ permission ในเมนู)

- รูปโปรไฟล์ผู้ใช้ในแดชบอร์ดโหลดผ่าน **`GET /api/users/:id/avatar`** / **`GET /api/users/me/avatar`** (JWT) และฝั่ง Next ใช้ path **`/user-images/:userId`**
- รูปประกอบงานโหลดผ่าน **`GET /api/jobs/:id/image/:kind/:index`** (JWT) และฝั่ง Next ใช้ **`/job-images/...`**
- การตั้งค่า MinIO (bucket private, ตัวแปร env): [`../../docs/minio.md`](../../docs/minio.md), [`../../docs/Project-Plan-Private-MinIO-Images.md`](../../docs/Project-Plan-Private-MinIO-Images.md), [`../../docs/GitLab-CI-Variables-Checklist.md`](../../docs/GitLab-CI-Variables-Checklist.md)
