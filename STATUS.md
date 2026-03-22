# Project Status - ระบบแจ้งซ่อม CCTV

**วันที่อัปเดตสถานะ:** 2026-03-22

---

## 🟢 สถานะภาพรวม: Phase 4 (MinIO) + Phase 5 (Migration) Complete

---

### รายละเอียดของสถานะระบบ

1. 🗄️ **ฐานข้อมูลและการเชื่อมโยงข้อมูล (Data Alignment): `🟢 สำเร็จ`**
   - **Prisma Schema**: ปรับปรุงตาราง `Site`, `Area`, `User`, `Job` ให้รองรับข้อมูลจาก Excel 100%
   - **Sites Data**: ยืนยันข้อมูล จังหวัด/อำเภอ/หน่วยงาน อ้างอิงจาก Sheet "พื้นที่ ในโครงการ" ในไฟล์ Excel
   - **Seed Script**: สร้างสคริปต์ `backend/scripts/seed-from-excel.ts` และ `seed-from-csv.ts` พร้อมสำหรับการนำเข้าข้อมูล (Sites, Areas, Users, Jobs)

2. ⚙️ **Backend API (NestJS): `🟢 พร้อมใช้งาน`**
   - Endpoint `/api/users/reporters` สำหรับดึงรายชื่อผู้แจ้งซ่อมในหน้ารายงาน
   - ระบบ Authentication และ JWT Guard + **RolesGuard** (RBAC) ทำงานสมบูรณ์
   - **Login**: รองรับอีเมลหรือชื่อผู้ใช้ (`email` / `username`) + รหัสผ่าน คืนค่า `access_token` + `user` (id, name, username, role)
   - **User CRUD**: ADMIN ทำ CRUD ผู้ใช้ได้; STAFF เห็นรายชื่อผู้ใช้อย่างเดียว (read-only)
   - **โปรไฟล์ผู้ใช้**: `GET /users/me`, `PATCH /users/me` (ชื่อ, อีเมล, เบอร์, ตำแหน่ง, รูป), `PATCH /users/me/password` (เปลี่ยนรหัสผ่านต้องส่งรหัสเดิม)
   - **มอบหมายงาน**: `GET /users/assignable` (ADMIN/SUPERVISOR/STAFF) รายชื่อเจ้าหน้าที่ที่มอบหมายได้; `PATCH /jobs/:id/assign` — ADMIN/SUPERVISOR ส่ง staffId ใครก็ได้, STAFF ส่งได้เฉพาะตัวเอง (รับงาน)
   - **นอกสัญญา**: `PATCH /jobs/:id/out-of-contract` — ตั้ง `isOutOfContract=true` โดย “คงสถานะเป็น `PENDING`”
   - **บันทึกการแก้ไขงาน**: `PATCH /jobs/:id/fix` — **เฉพาะผู้รับงาน (assignee)** ไม่ยกเว้น ADMIN; ถ้าสถานะยังเป็น `RESOLVED` ต้อง **`PATCH /jobs/:id/reopen`** ก่อน; ส่ง brokenPartType, cause, fixMethod, note, oldSerialNumber, newSerialNumber และไฟล์รูปการแก้ไข (fixImages) อัปโหลดไป MinIO เก็บ URL ใน Job; ระบบตั้ง status = RESOLVED และ fixDate อัตโนมัติ
   - **เปิดงานใหม่หลังปิด (Reopen)**: `PATCH /jobs/:id/reopen` — **เฉพาะผู้รับงาน**; `RESOLVED` → `IN_PROGRESS`, ล้าง `fixDate`, ต่อท้ายเหตุผลใน `fixNote`
   - **ตั้งค่าอีเมล (SMTP)**: `GET/PUT /api/settings/email-smtp`, `POST /api/settings/email-smtp/test` (ADMIN + JWT) — เก็บใน `Setting` คีย์ `email_smtp` ด้วย **nodemailer**; รองรับ `tlsRejectUnauthorized` และ env `SMTP_TLS_REJECT_UNAUTHORIZED`
   - **Jobs**: สร้างงานตรวจสอบ Site ว่าจังหวัด/อำเภอ/หน่วยงานมีในระบบก่อน (SitesService.existsByLocation); หลังสร้างงาน ถ้า `reporterPhone` ตรงกับผู้ใช้ในระบบจะ **เชื่อม `reporterId`** อัตโนมัติ (`UsersService.findByPhone`)
   - **รายการงาน (Dashboard)**: `GET /jobs/list` — ดึงรายการแจ้งซ่อม (JWT); ไม่มี `GET /api/jobs` แบบเปล่า — แยก path เพื่อไม่ให้สับสนกับ `POST /jobs` (แจ้งซ่อมสาธารณะ) เมื่อเปิด URL ในเบราว์เซอร์
   - **ลบงาน `DELETE /jobs/:id`**: ถ้าเป็น **ADMIN** และงานสถานะ **IN_PROGRESS** จะลบได้ทันที; มิฉะนั้นใช้กับงาน **PENDING** ที่ยังไม่มอบหมายเท่านั้น (ต้องเป็น **ADMIN** หรือ **SUPERVISOR** ตาม logic เดิม)
   - **Validation แจ้งซ่อม (Public POST)**: DTO + Zod (`create-job.dto`) รวมถึง `reporterEmail` preprocess/trim; `ZodValidationPipe` รวม error message เป็น array ชัดเจน
   - **MinIO**: ใช้ `MINIO_PUBLIC_URL` (ถ้ามี) สำหรับ URL รูปที่ browser เข้าถึงได้; bucket policy ตั้งเป็น public read ตอน onModuleInit

3. 🖥️ **Frontend & UI Design (Modern Minimal Theme & UX Improvements): `🟢 สมบูรณ์`**
   - **Unified Public Template (`PublicLayoutShell`)**: หน้า `/report`, `/status` และ `/login` ใช้ Layout และ Background Glassmorphism แบบเดียวกันทั้งหมด สร้างความเป็นเอกภาพ (Consistency)
   - **Global Font เปลี่ยนเป็น `Sarabun`**: แก้ไข Layout หลักให้ดึงฟอนต์ Sarabun แทน Prompt เพื่อเพิ่มความเป็นทางการและดูหน้าเชื่อถือ
   - **Login**: กรอกอีเมลหรือชื่อผู้ใช้ + รหัสผ่าน มีปุ่มแสดง/ซ่อนรหัสผ่าน (password toggle)
   - **Report Page**: ดีไซน์แบบ Card-based UI `rounded-2xl`, เงานุ่มนวล 
     - **ระบบดึงข้อมูลผู้แจ้งซ่อมจากเบอร์โทร:** มีการจำกัดความยาวเบอร์โทร 10 หลักและกรอกได้เฉพาะตัวเลข ระบบจะดึงข้อมูลผ่าน API `/users/reporter-by-phone/:phone` แบบอ่านอย่างเดียว (Read-only) เมื่อพบประวัติ
     - **ระบบค้นหาสถานที่ (Select2)**: นำ `react-select` มาใช้งานในช่องสถานที่ ส่งผลให้ผู้ใช้สามารถพิมพ์ค้นหาชื่อ จังหวัด/อำเภอ/หน่วยงาน ได้สะดวกรวดเร็วกว่า Dropdown แบบเก่า
   - **Dashboard Layout**: Sidebar **ไม่เลื่อนตาม scroll** (sticky ใน flex container; หน้าใช้ `h-screen overflow-hidden`)
   - **Dashboard ภาพรวม**: กราฟสัดส่วนสถานะ (Pie), จำนวนแจ้งซ่อมตามจังหวัด Top 8 (Bar), **แนวโน้มรายวัน 14 วัน** = แจ้งในวันนั้น vs เสร็จในวันนั้น (ใช้ `fixDate` สำหรับเสร็จ); เมนูด่วนอ้างอิง RBAC (permission)
   - **หน้ารอดำเนินการ**: ปุ่ม **ดูรายละเอียด** → ไปหน้าเต็ม `/dashboard/jobs/:id` (ไม่ใช้ modal), ปุ่ม **มอบหมายงาน** (เฉพาะ ADMIN/SUPERVISOR — modal ใช้ `react-select` เลือกเจ้าหน้าที่), ปุ่ม **รับงาน** (STAFF/SUPERVISOR รับงานตัวเอง)
   - **งานที่รับผิดชอบ** (`/dashboard/my-jobs`): DataTable งานที่รับมอบหมายให้ผู้ใช้ปัจจุบัน พร้อม filter; ปุ่มดูรายละเอียดไปหน้า `/dashboard/jobs/:id`
   - **หน้ารายละเอียดงาน** (`/dashboard/jobs/:id`): แสดงเต็มพื้นที่ — การ์ดซ้าย "ข้อมูลการแจ้งข้อขัดข้อง", การ์ดขวา "ข้อมูลการแก้ไข" + ฟอร์มบันทึกการแก้ไข (ส่วนขัดข้อง, สาเหตุ, วิธีแก้ไข, รูปการแก้ไข สูงสุด 3 รูป, หมายเหตุ, Serial เก่า/ใหม่); **บันทึกการแก้ไข / Reopen — เฉพาะผู้รับงาน** (assignee); เมื่อสถานะเป็น `RESOLVED` มีปุ่ม **Reopen** (ยืนยันผ่าน `confirmDialog` ก่อนเรียก API); สไตล์ฟอร์มแก้ไขเป็น **Dark Glassmorphism** ตามมาตรฐานโปรเจกต์; **พิมพ์/PDF รายงาน** — ไม่ใช้ดาวน์โหลดแบบ html2canvas บนหน้ารายละเอียดแล้ว ใช้หน้า **`/print/jobs/[id]`** + `print.css` + เทมเพลต `JobMaintenancePdfTemplate` (พิมพ์จากเบราว์เซอร์; ฝั่ง backend มี `JobsPdfService` พร้อม `emulateMediaType('print')` เมื่อสร้าง PDF)
   - **หน้าแจ้งซ่อม** (`/report`): ผู้ใช้ทั่วไปยังต้องกด **ตรวจสอบ** ให้พบผู้แจ้งในระบบก่อนเลือกสถานที่; **เจ้าหน้าที่ที่ล็อกอิน** (บทบาท STAFF / ADMIN / SUPERVISOR) ใช้ flow แยก — โหลด `GET /sites` ทันที, กรอกเบอร์ 10 หลักแล้วดำเนินการต่อได้โดยไม่บังคับพบจากระบบ (กรอกชื่อ-สกุลเองเมื่อไม่พบ), ส่ง `POST /jobs` พร้อม **`Authorization: Bearer`** เมื่อมี session, หลังสำเร็จ redirect ไป **`/dashboard/jobs`**; แสดงข้อความ error จาก API ชัดเจน (`extractApiErrorMessage`)
   - **Component ร่วม**: `DashboardPageShell`, `DashboardFilterBar`, `CrudModal`, `JobsList` (รองรับ prop `assignedToMe`), Toast (`toastSuccess` ปิดอัตโนมัติ 1.2 วินาที, `toastError`, `toastWarning`, `confirmDialog`)
   - **Sidebar**: ไม่แสดงเมนู "โปรไฟล์"; **เมนูผู้ใช้**: Dropdown ใน header มี โปรไฟล์ → `/dashboard/profile` และ ออกจากระบบ
   - **สัญญา/นอกสัญญา (Contract Tabs)**: `SegmentedTabs` บน `/dashboard/my-jobs`, `/dashboard/all`, `/dashboard/in-progress` — แยกตาม `Job.isOutOfContract`; **ไม่ห่อด้วย card/glass ชั้นนอก** (เหลือเฉพาะกล่องควบคุมในแท็บ); **badge สีน้ำเงิน** แสดงจำนวนงานที่ยังไม่เสร็จ (ไม่นับ `RESOLVED`) ต่อแท็บ
   - **Modal อัปเดตจากรายการงาน**: modal “ข้อมูลการแก้ไข” ใน `JobsList` ใช้ธีม **Dark Glassmorphism** สอดคล้อง `AGENTS.md`
   - **หน้าจัดการผู้ใช้**: คลิกรูปโปรไฟล์ในตารางเปิด lightbox ดูรูปใหญ่ (ปิดด้วยพื้นหลัง / X / Escape)
   - **Pending Table UX**:
     - ซ่อนคอลัมน์ “ผู้รับผิดชอบ” ใน `/dashboard/pending`
     - จัดลำดับปุ่มในคอลัมน์ “จัดการ” ให้ “ลบงาน” (`ลบงาน`) อยู่ท้ายสุด
     - ปุ่ม “ย้ายนอกสัญญา” แสดง `alert ยืนยัน` ก่อนย้าย และคงสถานะเดิมเป็น `PENDING`
   - **In-progress Update UX**: ปุ่ม “อัปเดต” ใน `/dashboard/in-progress` เปิด modal “ข้อมูลการแก้ไข” พร้อมฟอร์มและการอัปโหลดรูป (สูงสุด 3 รูป) คล้ายกับการ์ดฟอร์มใน `/dashboard/jobs/:id` และมีส่วน Reopen เมื่อทำงานเป็น Resolved แล้ว
   - **Header Avatar**: header แสดงรูปโปรไฟล์เมื่อมี `session.user.image` และ fallback เป็น initials เมื่อไม่มีรูปหรือโหลดรูปไม่สำเร็จ

---

## 🔑 API Endpoints (localhost:4000/api)

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|-----------|
| POST | `/auth/login` | ❌ | เข้าสู่ระบบ (body: email หรือ username + password; คืนค่า access_token + user) |
| GET | `/users/reporters` | ❌ | ดึงรายชื่อผู้แจ้งซ่อม (Dropdown) |
| GET | `/users/me` | ✅ JWT | โปรไฟล์ผู้ใช้ที่ล็อกอินอยู่ |
| PATCH | `/users/me` | ✅ JWT | แก้ไขโปรไฟล์ตัวเอง (ชื่อ, อีเมล, เบอร์, ตำแหน่ง, รูป) |
| PATCH | `/users/me/password` | ✅ JWT | เปลี่ยนรหัสผ่านตัวเอง (currentPassword, newPassword) |
| GET | `/users/assignable` | ✅ JWT (ADMIN, SUPERVISOR, STAFF) | รายชื่อผู้ที่มอบหมายได้ (ADMIN/STAFF/SUPERVISOR) |
| GET | `/users` | ✅ JWT (ADMIN) | รายชื่อผู้ใช้ทั้งหมด |
| GET | `/users/:id` | ✅ JWT (ADMIN) | ดูข้อมูลผู้ใช้ |
| POST | `/users` | ✅ JWT (ADMIN) | สร้างผู้ใช้ |
| PATCH | `/users/:id` | ✅ JWT (ADMIN) | แก้ไขผู้ใช้ (ชื่อ, อีเมล, เบอร์, ตำแหน่ง, role, image) |
| PATCH | `/users/:id/password` | ✅ JWT (ADMIN) | เปลี่ยนรหัสผ่านผู้ใช้ |
| DELETE | `/users/:id` | ✅ JWT (ADMIN) | ลบผู้ใช้ |
| POST | `/jobs` | ❌ (อนุญาต Bearer แบบเสริมได้) | แจ้งซ่อมใหม่ (สาธารณะ; ตรวจสอบ Site ก่อนสร้าง; ฝั่งเจ้าหน้าที่อาจส่ง JWT เพื่อ audit / เชื่อม reporter จากเบอร์) |
| GET | `/jobs/list` | ✅ JWT | ดูรายการแจ้งซ่อมทั้งหมด (Dashboard / JobsList) |
| GET | `/jobs/:id/image/:kind/:index` | ✅ JWT | สตรีมรูป (`kind`= issue \| fix, `index`=0–2) จาก URL ใน `Job.images` / `Job.fixImages` — proxy same-origin ให้ frontend ไม่ติด CORS |
| GET | `/jobs/:id/report-pdf` | ✅ JWT | สร้างไฟล์ PDF รายงาน (โหลดหน้า `/print/jobs/:id` + Chromium) |
| PATCH | `/jobs/:id/assign` | ✅ JWT | มอบหมายงาน: ADMIN/SUPERVISOR กำหนด staffId ใครก็ได้; STAFF ส่งได้เฉพาะ staffId = ตัวเอง |
| PATCH | `/jobs/:id/fix` | ✅ JWT (**เฉพาะผู้รับงาน**) | บันทึกการแก้ไข: brokenPartType, cause, fixMethod, note, oldSerialNumber, newSerialNumber, fixImages (multipart); ตั้ง status=RESOLVED, fixDate อัตโนมัติ; ถ้ายัง `RESOLVED` ต้อง reopen ก่อน |
| PATCH | `/jobs/:id/reopen` | ✅ JWT (**เฉพาะผู้รับงาน**) | Reopen: `RESOLVED` → `IN_PROGRESS`, ล้าง `fixDate`, ต่อท้ายเหตุผลใน `fixNote` |
| GET | `/settings/email-smtp` | ✅ JWT (ADMIN) | อ่านการตั้งค่า SMTP (ไม่คืนรหัสผ่าน) |
| PUT | `/settings/email-smtp` | ✅ JWT (ADMIN) | บันทึกการตั้งค่า SMTP (รหัสผ่านเข้ารหัสใน DB) |
| POST | `/settings/email-smtp/test` | ✅ JWT (ADMIN) | ทดสอบส่งอีเมลด้วยค่าที่บันทึกแล้ว |
| PATCH | `/jobs/:id/out-of-contract` | ✅ JWT (ADMIN, STAFF, SUPERVISOR) | ย้ายนอกสัญญา: ตั้ง `isOutOfContract=true` โดย “คงสถานะเป็น PENDING” |
| DELETE | `/jobs/:id` | ✅ JWT | **ADMIN**: ลบงาน **IN_PROGRESS** ได้; **ADMIN/SUPERVISOR**: ลบงาน **PENDING** ที่ยังไม่มีผู้รับผิดชอบ (`deleteUnassigned`) |
| GET | `/sites` | ❌ Public | ข้อมูลพื้นที่โครงการ (สำหรับหน้าแจ้งปัญหา) |
| GET | `/areas` | ✅ JWT | ข้อมูลพื้นที่รับผิดชอบ |

---

## 👤 User & Role (Role-based menu & RBAC)

- **ADMIN**: เห็นทุกเมนูใน Dashboard รวมถึง **จัดการผู้ใช้**, **จัดการบทบาทและสิทธิ์**, **ตั้งค่าระบบ**; ทำ CRUD ผู้ใช้ได้; มอบหมายงานให้ใครก็ได้
- **STAFF**: เห็น ภาพรวม, รอดำเนินการ, กำลังแก้ไข, ข้อขัดข้องทั้งหมด, นอกสัญญา; รับงานตัวเองได้ (ปุ่มรับงาน); ไม่เห็น จัดการผู้ใช้/ตั้งค่าระบบ
- **SUPERVISOR (หัวหน้างาน)**: เห็นเมนูเทียบเท่า STAFF + **ปุ่มมอบหมายงาน** ในหน้ารอดำเนินการ (เลือกเจ้าหน้าที่จาก modal); เรียก `GET /users/assignable`, `PATCH /jobs/:id/assign`
- **USER**: ใช้สำหรับผู้แจ้งซ่อม (dropdown ในฟอร์มแจ้งปัญหา); เห็นเฉพาะ โปรไฟล์, แจ้งปัญหา, ตรวจสอบสถานะ

---

## 📐 Dashboard Routes (path ใต้ /dashboard)

ทุกหน้างานหลัง login อยู่ใต้ `/dashboard` เพื่อใช้ layout เดียว (sidebar + header) และตรวจสิทธิ์ได้จาก path เดียว

| Path | คำอธิบาย |
|------|----------|
| `/dashboard` | ภาพรวม (KPI, กราฟสัดส่วน/จังหวัด/แนวโน้มรายวัน 14 วัน, เมนูด่วน) |
| `/dashboard/pending` | รอดำเนินการ – DataTable + filter; ปุ่ม ดูรายละเอียด (ไป `/dashboard/jobs/:id`) / มอบหมายงาน (react-select) (ADMIN, SUPERVISOR) / รับงาน และมีปุ่ม “ย้ายนอกสัญญา” (ADMIN/SUPERVISOR/STAFF) |
| `/dashboard/my-jobs` | **งานที่รับผิดชอบ** – งานที่รับมอบหมายให้ผู้ใช้ปัจจุบัน; DataTable + filter |
| `/dashboard/jobs/:id` | รายละเอียดงานเต็มหน้า + ฟอร์มบันทึกการแก้ไข; พิมพ์รายงานเมื่อ Resolved ผ่าน **`/print/jobs/:id`** (ไม่ใช้ html2canvas บนหน้ารายละเอียด) |
| `/print/jobs/:id` | หน้าพิมพ์รายงานบำรุงรักษา (layout 2 หน้า, ปุ่มพิมพ์) |
| `/dashboard/in-progress` | กำลังแก้ไข – DataTable + filter; แท็บสัญญา/นอกสัญญา + badge งานค้าง; **ADMIN** ลบงาน IN_PROGRESS ได้ |
| `/dashboard/all` | **ข้อขัดข้อง** – ประวัติทั้งหมด; filter จังหวัด + จำนวนต่อหน้า (15/30/50/ทั้งหมด) + pagination |
| `/dashboard/out-of-contract` | นอกสัญญา – DataTable + filter |
| `/dashboard/users` | จัดการผู้ใช้ – DataTable + filter; ADMIN ทำ CRUD ได้ (Modal + Toast); เลือกบทบาทได้ ADMIN/STAFF/SUPERVISOR/USER |
| `/dashboard/profile` | โปรไฟล์ – แก้ไขข้อมูลผู้ใช้ / เปลี่ยนรหัสผ่าน (เข้าได้จากเมนูผู้ใช้ dropdown; ไม่แสดงใน sidebar) |
| `/dashboard/settings` | ตั้งค่าระบบ (ADMIN) — **SMTP**: โหลด/บันทึก/ทดสอบส่งอีเมล; layout เนื้อหาแบบหน้า `/dashboard` (ไม่ใช้ `DashboardPageShell` เป็นห่อหลัก) |

**หมายเหตุ:** `/dashboard/staff` ถูกลบแล้ว; redirect ไป `/dashboard/users`

**Content area:** แสดงผลเต็มพื้นที่ (full width) ทุกหน้า รายการใช้รูปแบบ **FilterBar + DataTable** พร้อมส่วน filter (ค้นหา, dropdown) และปุ่มรีเฟรช/เพิ่มตามหน้า

---

สร้าง user admin ครั้งแรก และ seed บทบาท/สิทธิ์ (รวม SUPERVISOR + job.assign):
```bash
cd backend && npx ts-node scripts/seed-admin.ts
npx ts-node scripts/seed-roles-permissions.ts
```
ค่าเริ่มต้น admin: username=`admin`, password=`admin123` (ควรเปลี่ยนหลัง login ครั้งแรก)  
บทบาท: ADMIN, STAFF, USER, **SUPERVISOR (หัวหน้างาน)** — ดูรายละเอียด RBAC ที่ `backend/docs/RBAC-Setup.md`

---

## 🟢 สถานะการทำงานปัจจุบัน

- **MinIO Integration (Phase 4)**: ระบบรองรับการอัปโหลดรูปภาพผ่าน MinIO แทน Base64 แล้ว
- **Employee Migration (Phase 5)**: ย้ายข้อมูลพนักงานและรูปภาพโปรไฟล์จาก AppSheet มายังระบบใหม่และ MinIO เรียบร้อยพื้นฐานแล้ว
- **รายงาน PDF / พิมพ์ (งาน Resolved)**: ใช้หน้า `/print/jobs/[id]` + `JobMaintenancePdfTemplate` + `print.css` (พิมพ์จากเบราว์เซอร์); ลบ dependency **html2canvas / jsPDF** ออกจากหน้ารายละเอียดงานแล้ว
- **แจ้งซ่อม + รายการงาน**: Validation/API ชัดเจนขึ้น; รายการใน Dashboard ใช้ **`GET /jobs/list`**; flow เจ้าหน้าที่บน `/report` แยกจากผู้ใช้ทั่วไป
- **ตั้งค่าอีเมล (SMTP) + Reopen (2026-03-22)**: API ตั้งค่า SMTP (ADMIN); **`PATCH /jobs/:id/fix`** และ **`PATCH /jobs/:id/reopen`** — เฉพาะผู้รับงาน; Frontend หน้า settings + Reopen ยืนยันก่อนเรียก API; `@nestjs/cli` v11; `JobsList` แท็บสัญญา/นอกสัญญาไม่ห่อ glass ชั้นนอก

---

## 🚀 แผนงานถัดไป (Phase 6)

- [ ] รัน Seed Script เพื่อเตรียมข้อมูลจริงเข้าสู่ Production (และ seed-admin ถ้ายังไม่มี admin)
- [ ] ติดตั้ง Socket.io บน Frontend เพื่อ Real-time Notifications
- [x] ระบบออกรายงาน PDF / พิมพ์ — ใช้หน้า `/print/jobs/[id]` + เทมเพลต + `print.css` (แทนการดาวน์โหลด html2canvas บนหน้ารายละเอียด); ปรับแต่ง layout เพิ่มเติมทำได้เป็นงานต่อยอด
- [ ] พัฒนาหน้าจอ Admin สำหรับการจัดการบทบาทและสิทธิ์แบบ Visual
