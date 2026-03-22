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
| menu.settings | ตั้งค่าระบบ (หน้า `/dashboard/settings` — ตั้งค่า **SMTP** / ทดสอบส่งอีเมล; API ต้อง JWT + ADMIN) |
| menu.roles | จัดการบทบาทและสิทธิ์ |
| menu.myJobs | งานที่รับผิดชอบ (รายการงานที่รับมอบหมาย) |
| job.assign | มอบหมายงาน (ปุ่มมอบหมายงานในหน้ารอดำเนินการ) |
| job.deleteUnassigned | ลบงานที่ยังไม่มีผู้รับผิดชอบ |

## บทบาทเริ่มต้น

| Code | ชื่อ | คำอธิบาย |
|------|------|----------|
| ADMIN | ผู้ดูแลระบบ | ทุกเมนู + มอบหมายงานได้ |
| STAFF | ช่างเทคนิค | ภาพรวม, รอดำเนินการ, กำลังแก้ไข, ประวัติ, นอกสัญญา — รับงานตัวเองได้ |
| USER | ผู้แจ้งซ่อม | โปรไฟล์, แจ้งปัญหา, ตรวจสอบสถานะ |
| SUPERVISOR | หัวหน้างาน | เทียบเท่า STAFF + สิทธิ์ job.assign (มอบหมายงานให้เจ้าหน้าที่ได้) |

## การทำงาน

- **Login / Session:** ยังใช้ `user.role` (enum) จาก JWT สำหรับ Guards ที่ตรวจบทบาท (เช่น ADMIN only)
- **Sidebar:** เรียก `GET /roles/me/permissions` เพื่อดึงสิทธิ์ของ user แล้วแสดงเฉพาะเมนูที่ user มีสิทธิ์
- **หน้าจัดการบทบาท:** `/dashboard/roles` (เฉพาะ ADMIN ที่มีสิทธิ์ menu.roles) — สร้าง/แก้ไขบทบาท และกำหนดสิทธิ์ (checkbox) ให้แต่ละบทบาท
- **ผู้ใช้:** ตอนสร้าง/แก้ไข user เลือก role เป็น ADMIN/STAFF/USER/SUPERVISOR ได้ ระบบจะ map ไปที่ AppRole และ set User.roleId ให้
- **มอบหมายงาน:** หน้ารอดำเนินการ (`/dashboard/pending`) แสดงปุ่ม "มอบหมายงาน" เฉพาะผู้ใช้ที่มีบทบาท ADMIN หรือ SUPERVISOR (หรือมีสิทธิ์ job.assign) ปุ่ม "รับงาน" ใช้สำหรับ STAFF รับงานตัวเอง
- **ย้ายนอกสัญญา:** ปุ่ม “ย้ายนอกสัญญา” ในหน้ารอดำเนินการแสดง `alert ยืนยัน` ก่อนเรียก `PATCH /jobs/:id/out-of-contract` และระบบคงสถานะงานเดิมเป็น `PENDING`
- **ลบงานที่ยังไม่มีผู้รับผิดชอบ:** ปุ่ม “ลบงาน” ใน `/dashboard/pending` จะขึ้นเมื่อ job.status เป็น `PENDING` และ `assignedToId = null` โดยต้องมี permission `job.deleteUnassigned` (หรือบทบาท ADMIN/SUPERVISOR ตาม fallback ในโค้ด)
- **ลบงานกำลังแก้ไข (เฉพาะ ADMIN):** ที่หน้า `/dashboard/in-progress` ผู้ใช้บทบาท **ADMIN** เห็นปุ่ม “ลบงาน (ผู้ดูแลระบบ)” สำหรับงานสถานะ `IN_PROGRESS` — เรียก `DELETE /jobs/:id` (ฝั่ง backend แยก logic: ADMIN ลบ IN_PROGRESS ได้ก่อน แล้วจึง fallback ไปลบแบบ PENDING ไม่มอบหมาย) — **ไม่ใช้** permission code แยก แต่เช็ค `role === ADMIN` ใน API/UI
- **สัญญา/นอกสัญญา Tabs:** หน้า `/dashboard/my-jobs`, `/dashboard/all`, และ `/dashboard/in-progress` แสดง segmented tabs “สัญญา/นอกสัญญา” โดยแยกตาม `Job.isOutOfContract` (ค่าเริ่มต้น = “สัญญา”) และมี **badge** จำนวนงานค้าง (ยังไม่ `RESOLVED`) ต่อแท็บ
- **อัปเดตงานในกำลังแก้ไข:** หน้า `/dashboard/in-progress` ปุ่ม “อัปเดต” เปิด modal “ข้อมูลการแก้ไข” (ฟอร์มและอัปโหลดรูป) และส่ง `PATCH /jobs/:id/fix` โดยฝั่ง UI เปิดเฉพาะผู้รับผิดชอบตาม `assignedTo`
- **Sidebar:** เมนู "โปรไฟล์" ไม่แสดงใน sidebar; เข้าได้จากเมนูผู้ใช้ (dropdown) เท่านั้น เมนู "งานที่รับผิดชอบ" (`menu.myJobs`) แสดงสำหรับ ADMIN, STAFF, SUPERVISOR
