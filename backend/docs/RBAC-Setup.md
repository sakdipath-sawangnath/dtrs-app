# การตั้งค่าระบบ RBAC (บทบาทและสิทธิ์)

## โครงสร้างฐานข้อมูล

- **AppRole** — บทบาท (ADMIN, STAFF, USER, SUPERVISOR หรือชื่อที่สร้างเอง)
- **Permission** — สิทธิ์ (เช่น menu.dashboard, menu.users)
- **RolePermission** — ผูกสิทธิ์ให้บทบาท (many-to-many)
- **User.roleId** — ผู้ใช้ผูกกับบทบาท (optional; ถ้ามีจะใช้สิทธิ์จากตาราง ไม่ใช้ enum)

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
- **มอบหมายงาน (API):** มีสิทธิ์ `job.assign` → มอบหมาย `staffId` เป็นใครก็ได้; ไม่มี `job.assign` แต่มี `menu.pending` และ `staffId` = ตัวเอง → **รับงานเอง** (เดิมคือพฤติกรรม STAFF)
- **ข้อมูลผู้มอบหมาย (assignedById):** ทุกครั้งที่เรียก `PATCH /jobs/:id/assign` ระบบจะบันทึก `assignedById` เป็น “ผู้กดมอบหมาย/รับงาน” (จาก JWT) และคืน `assignedBy` ใน response ของ `GET /jobs/:id` เพื่อให้ UI แยกการ์ด **มอบหมายงาน** (มีผู้มอบหมาย) กับ **รับงานเอง** (ผู้มอบหมาย = ผู้รับงาน) ได้อย่างถูกต้อง; งานเก่าหรือข้อมูลที่ยังไม่เคยบันทึกฟิลด์นี้ อาจมี `assignedBy=null` และจะแสดง fallback ใน UI
- **รายชื่อผู้รับมอบหมาย:** `GET /users/assignable` ใช้ **`PermissionsGuard` + `job.assign`** (ไม่ใช้แค่ JWT role ADMIN/SUPERVISOR/STAFF) — ให้ตรงกับผู้ที่เปิด modal มอบหมายใน `JobsList`
- **Sidebar:** เรียก `GET /roles/me/permissions` เพื่อดึงสิทธิ์ของ user แล้วแสดงเฉพาะเมนูที่ user มีสิทธิ์ — ฝั่ง `DashboardLayoutShell` ต้อง **แกะ `data` จาก body มาตรฐาน** (`{ success, data: { permissions } }`) เหมือนหน้าอื่นที่ใช้ `unwrapApiData`; ถ้ารายการสิทธิ์ที่ได้ **ไม่ตรงกับเมนูใน sidebar เลย** (เช่น มีแค่ `menu.profile`) ให้ **fallback ตามบทบาท** เพื่อไม่ให้เมนูว่าง
- **หน้าจัดการบทบาท:** `/dashboard/roles` (เฉพาะ ADMIN ที่มีสิทธิ์ menu.roles) — สร้าง/แก้ไขบทบาท และกำหนดสิทธิ์ (checkbox) ให้แต่ละบทบาท; UI ใช้ **`CrudModal`** (portal + `z-100`) และฟิลด์ **`form-input-glass`** ตาม `frontend/src/app/globals.css` — ดูภาพรวม UI ที่ `README.md` / `STATUS.md`
- **ผู้ใช้:** ตอนสร้าง/แก้ไข user เลือก role เป็น ADMIN/STAFF/USER/SUPERVISOR ได้ ระบบจะ map ไปที่ AppRole และ set User.roleId ให้
- **มอบหมายงาน (UI):** หน้ารอดำเนินการ (`/dashboard/pending`) แสดงปุ่ม «มอบหมายงาน» เมื่อมีสิทธิ์ **`job.assign`** (โหลดจาก `/roles/me/permissions` ใน `JobsList`; ระหว่างโหลดสิทธิ์จะ fallback ตามบทบาท ADMIN/SUPERVISOR ใน JWT) ปุ่ม «รับงาน» ยังแสดงสำหรับงาน `PENDING` และเรียก assign เป็นตัวเอง — สำเร็จได้เมื่อ API อนุญาตตามกติกาด้านบน
- **ย้ายนอกสัญญา:** ปุ่ม «ย้ายนอกสัญญา» แสดงเมื่อมี **`job.assign`** (เดิมเทียบเท่า ADMIN/SUPERVISOR); ก่อนเรียก `PATCH /jobs/:id/out-of-contract` มี `alert` ยืนยัน; ระบบคงสถานะงานเป็น `PENDING`
- **ลบงานที่ยังไม่มีผู้รับผิดชอบ:** ปุ่ม «ลบงาน» ใน `/dashboard/pending` จะขึ้นเมื่อ job.status เป็น `PENDING` และ `assignedToId = null` โดยต้องมี permission **`job.deleteUnassigned`** (ฝั่ง UI อ่านจาก `/roles/me/permissions`; ถ้ายังไม่โหลดให้ fallback ตามบทบาท ADMIN/SUPERVISOR)
- **ลบงานกำลังแก้ไข:** ที่หน้า `/dashboard/in-progress` แสดงปุ่ม “ลบงาน (ผู้ดูแลระบบ)” เมื่อมีสิทธิ์ **`job.deleteInProgress`** (อ่านจาก `/roles/me/permissions`) — เรียก `DELETE /jobs/:id`; backend ลบ **IN_PROGRESS** เมื่อมีสิทธิ์นี้ก่อน แล้วจึง fallback ไปลบแบบ PENDING ไม่มอบหมาย (`job.deleteUnassigned`)
- **สัญญา/นอกสัญญา Tabs:** หน้า `/dashboard/my-jobs`, `/dashboard/all`, และ `/dashboard/in-progress` แสดง segmented tabs “สัญญา/นอกสัญญา” โดยแยกตาม `Job.isOutOfContract` (ค่าเริ่มต้น = “สัญญา”) และมี **badge** จำนวนงานค้าง (ยังไม่ `RESOLVED`) ต่อแท็บ
- **บันทึก/ปิดงาน (`PATCH /jobs/:id/fix`):**
  - `job.fix.any` ทำได้ทุกงาน
  - `job.fix.self` ทำได้เฉพาะงานที่เป็นผู้รับงาน (`assignedToId`)
- **Reopen (`PATCH /jobs/:id/reopen`):**
  - `job.reopen.any` ทำได้ทุกงาน
  - `job.reopen.self` ทำได้เฉพาะงานที่เป็นผู้รับงาน (`assignedToId`)
- **อัปเดตงานในกำลังแก้ไข (UI):** หน้า `/dashboard/in-progress` และหน้า `/dashboard/jobs/:id` จะเปิดปุ่มตาม permission ด้านบน (อิง `/roles/me/permissions`) ไม่ hardcode role
- **Sidebar:** เมนู "โปรไฟล์" ไม่แสดงใน sidebar; เข้าได้จากเมนูผู้ใช้ (dropdown) เท่านั้น เมนู "งานที่รับผิดชอบ" (`menu.myJobs`) แสดงสำหรับ ADMIN, STAFF, SUPERVISOR

---

## หมายเหตุ: รูปโปรไฟล์และรูปงาน (ไม่ใช่ permission ในเมนู)

- รูปโปรไฟล์ผู้ใช้ในแดชบอร์ดโหลดผ่าน **`GET /api/users/:id/avatar`** / **`GET /api/users/me/avatar`** (JWT) และฝั่ง Next ใช้ path **`/user-images/:userId`**
- รูปประกอบงานโหลดผ่าน **`GET /api/jobs/:id/image/:kind/:index`** (JWT) และฝั่ง Next ใช้ **`/job-images/...`**
- การตั้งค่า MinIO (bucket private, ตัวแปร env): [`../../minio.md`](../../minio.md), [`../../docs/Project-Plan-Private-MinIO-Images.md`](../../docs/Project-Plan-Private-MinIO-Images.md)
