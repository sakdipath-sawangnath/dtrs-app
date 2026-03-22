# CCTV Maintenance System

ระบบแจ้งปัญหาและระบบจัดการการซ่อมบำรุงกล้องวงจรปิด (CCTV) ซึ่งพัฒนาต่อเนื่องมาจากการใช้งานผ่าน AppSheet

## บันทึกการอัปเดตล่าสุด (2026-03-22)

- **ตั้งค่าอีเมล (SMTP) — ใช้งานจริง**
  - Backend: โมดูล `SettingsModule` + **nodemailer**; เก็บค่าในตาราง `Setting` คีย์ `email_smtp` (รหัสผ่านไม่ส่งคืนใน GET)
  - API (ADMIN + JWT): `GET/PUT /api/settings/email-smtp`, `POST /api/settings/email-smtp/test`
  - รองรับ **TLS**: ฟิลด์ `tlsRejectUnauthorized` และ env `SMTP_TLS_REJECT_UNAUTHORIZED=false` สำหรับ SMTP ภายใน / self-signed
  - Frontend: หน้า `/dashboard/settings` — โหลด/บันทึก/ทดสอบส่งอีเมล; **โครง layout เนื้อหาแบบเดียวกับหน้าภาพรวม** (`/dashboard`) ไม่ใช้ `DashboardPageShell` เป็นห่อหลัก
- **งานปิดแล้ว (Reopen)**
  - `PATCH /api/jobs/:id/reopen` (เฉพาะผู้รับงาน): สถานะ **เสร็จสิ้น → กำลังแก้ไข**, บันทึกเหตุผลต่อท้าย `fixNote`, ล้าง `fixDate`; กด Reopen มี **ยืนยัน** (SweetAlert) ก่อนเรียก API
  - `PATCH /api/jobs/:id/fix`: **เฉพาะผู้รับงาน** (ไม่ยกเว้น ADMIN); ถ้ายังเป็น `RESOLVED` ต้อง Reopen ก่อน
- **เครื่องมือพัฒนา Backend**: อัปเกรด `@nestjs/cli` เป็น **v11** ให้สอดคล้อง Nest 11 + TypeScript 5.7 (แก้ error watch mode `Cannot read properties of undefined (reading 'paths')`)
- **UI รายการงาน**: แท็บ **สัญญา / นอกสัญญา** — เอา **card/glass ห่อชั้นนอก**ออก เหลือเฉพาะกล่องควบคุมใน `SegmentedTabs`

รายละเอียดเชิงลึกและตาราง API อัปเดตใน `STATUS.md`, `TASK.md`, `PLAN.md`

---

## 🛠️ Tech Stack

ระบบถูกแบ่งออกเป็น 2 ส่วนหลัก เพื่อการทำงานที่มีประสิทธิภาพและรองรับการขยายตัวในอนาคต:

### 1. Frontend (Next.js 15)
- **Framework:** Next.js (App Router)
- **UI & Styling:** Tailwind CSS, Lucide React, Google Font (Sarabun)
- **Standard Theme:** **Dark Glassmorphism** (slate-950 background, semi-transparent glass cards)
- **Layout Architecture:** **No-Card Layout** (แยกส่วน Content เป็น Glass Cards ย่อยๆ แทนการใช้ขอบขาวขนาดใหญ่)
- **Components:** Unified Layout with `SiteHeader` (fixed), `SiteFooter`, `PublicLayoutShell`, `DashboardPageShell`, `DashboardFilterBar`, `CrudModal`, `UserMenuDropdown`, `SegmentedTabs` (แท็บสัญญา/นอกสัญญา + badge จำนวนงานค้าง), `JobsList` (ตารางงาน + ดูรายละเอียด full page + มอบหมายงาน react-select / รับงาน + modal อัปเดตข้อมูลการแก้ไขแบบ Dark Glassmorphism)
- **Authentication:** NextAuth.js (login ด้วยอีเมลหรือชื่อผู้ใช้ + รหัสผ่าน, password toggle)
- **State & Integration:** Axios, Socket.io-client, SweetAlert2 (Toast: success 1.2s, error, confirm)
- **โฟลเดอร์หลัก:** `/frontend`


### 2. Backend (NestJS)
- **Framework:** NestJS (TypeScript)
- **Database & ORM:** MySQL + Prisma
- **Authentication:** Passport-JWT, JWT-based Role-Based Access Control (RBAC)
- **Real-time Engine:** Socket.io (EventsGateway)
- **โฟลเดอร์หลัก:** `/backend`

---

## 🚀 วิธีการติดตั้งและรันโปรเจ็ค

## 🤖 AI Agent Workflow (สำคัญ)

เพื่อให้ AI Agent ทำงานได้ถูกต้องและสอดคล้องมาตรฐานโปรเจกต์ทุกครั้ง:

- อ่าน `AGENT_INSTRUCTIONS.md` ก่อนเริ่มงาน (มี bootstrap + security gate)
- ใช้ checklist/Definition of Done ใน `AGENTS.md` เป็นเกณฑ์ก่อนส่งงาน
- งาน UI/UX ให้ยึด `frontend/.agents/skills/ui-ux-pro-max/SKILL.md`
- งาน Backend/NestJS ให้ยึด `backend/.agents/skills/backend-api-pro/SKILL.md` และ `backend/.agents/skills/nestjs-best-practices/SKILL.md`

### 1. การตั้งค่า Backend (NestJS)

1. เข้าไปยังโฟลเดอร์ `backend`:
   ```bash
   cd backend
   ```
2. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
3. รัน Database Migration และ Generate Prisma Client (ระบบเชื่อมต่อ MySQL database `cctv_app_db` อัตโนมัติในไฟล์ `.env`):
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. เริ่มต้นเซิร์ฟเวอร์ Backend:
   ```bash
   npm run start:dev
   ```
   *เซิร์ฟเวอร์จะรันที่พอร์ต `http://localhost:4000/api`*

### 2. การตั้งค่า Frontend (Next.js)

1. เข้าไปยังโฟลเดอร์ `frontend`:
   ```bash
   cd frontend
   ```
2. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
3. เริ่มต้นเซิร์ฟเวอร์ Frontend:
   ```bash
   npm run dev
   ```
   *หน้าเว็บจะรันที่พอร์ต `http://localhost:3000`*

---

## 📂 โครงสร้างและหน้าจอการใช้งาน

1. **หน้าแจ้งซ่อมออนไลน์ (Public Report):** `http://localhost:3000/report`
   - สำหรับบุคคลทั่วไป แจ้งปัญหาได้ทันทีโดยไม่ต้องเข้าสู่ระบบ (การ์ด: ผู้แจ้ง → สถานที่ → รายละเอียดปัญหา → รูปภาพ)
   - **ผู้ใช้ทั่วไป (ไม่ล็อกอิน):** กรอกเบอร์โทรศัพท์ 10 หลัก แล้วกด **ตรวจสอบ** ให้พบผู้แจ้งในระบบก่อน — หลังนั้นจึงเลือกสถานที่และส่งฟอร์มได้
   - **เจ้าหน้าที่ที่ล็อกอิน** (บทบาท STAFF / ADMIN / SUPERVISOR): ใช้ flow แยก — โหลดรายการสถานที่ได้ทันที, กรอกเบอร์ 10 หลักแล้วดำเนินการต่อได้โดยไม่บังคับพบจากระบบ (ระบุชื่อ-สกุลเองเมื่อไม่พบ), ส่งคำขอพร้อม **Bearer token** ได้, หลังสำเร็จ redirect ไป **`/dashboard/jobs`**
   - เมื่อส่งฟอร์มแล้ว ระบบจะสร้าง **เลขที่ใบแจ้งซ่อม (ticketNo)** อัตโนมัติ แสดงเลขนี้ใน Toast — ผู้ใช้ทั่วไปจะไปหน้า `/status?ticketNo=...`
   - รูปภาพข้อขัดข้องถูกอัปโหลดขึ้น **MinIO** ผ่าน `MinioService` และเก็บ URL ไว้ในฟิลด์ `Job.images`
   - เมื่อ staff ล็อกอินแล้วเข้า `/report` จะเห็น layout แดชบอร์ด (DashboardPageShell) สำหรับบันทึกการแจ้งซ่อม
2. **ตรวจสอบสถานะ:** `http://localhost:3000/status` — ตรวจสอบสถานะการแจ้งซ่อม
   - กรอกเลขที่ใบแจ้งซ่อม (ทั้งจากข้อมูลเดิมใน CSV และงานใหม่) เพื่อดูสถานะ/รายละเอียด
   - รองรับ query string `?ticketNo=...` เมื่อมาจากหน้า `/report` ช่องค้นหาจะถูกกรอกอัตโนมัติและค้นหาให้ทันที
3. **หน้าเข้าสู่ระบบ (Staff Login):** `http://localhost:3000/login`
   - สำหรับเจ้าหน้าที่/ผู้ดูแล (กรอกอีเมลหรือชื่อผู้ใช้ + รหัสผ่าน); การ์ดจัดกลาง
4. **ระบบจัดการแดชบอร์ด (Dashboard):** `http://localhost:3000/dashboard`
   - ภาพรวม (สถิติ, กราฟสัดส่วน/จังหวัด/แนวโน้มรายวัน, เมนูด่วนตาม RBAC)
   - รอดำเนินการ (ปุ่ม ดูรายละเอียด → ไปหน้า `/dashboard/jobs/:id` / มอบหมายงาน Select2 สำหรับ ADMIN·SUPERVISOR / รับงาน / ย้ายนอกสัญญา สำหรับ ADMIN/SUPERVISOR/STAFF (คงสถานะ PENDING))
   - รายละเอียดงาน (`/dashboard/jobs/:id`): พิมพ์รายงานได้เมื่องานมีสถานะเสร็จสิ้น (Resolved) ผ่านหน้า **`/print/jobs/:id`** (เทมเพลต `JobMaintenancePdfTemplate` + `print.css`; พิมพ์จากเบราว์เซอร์)
   - **งานที่รับผิดชอบ** — รายการงานที่รับมอบหมาย (filter + datatable)
   - กำลังแก้ไข (`/dashboard/in-progress`): แท็บสัญญา/นอกสัญญา + badge งานค้าง; ปุ่มอัปเดต (ผู้รับผิดชอบ); **ADMIN ลบงาน IN_PROGRESS ได้** (ปุ่มลบผู้ดูแลระบบ); ข้อขัดข้องทั้งหมด, นอกสัญญา (แสดงเฉพาะ PENDING ที่ `isOutOfContract=true`)
   - จัดการผู้ใช้ (ADMIN: CRUD; บทบาท: ADMIN, STAFF, หัวหน้างาน, ผู้แจ้งซ่อม) — คลิกรูปโปรไฟล์ในตารางเปิด modal ดูรูปขนาดใหญ่
   - จัดการบทบาทและสิทธิ์ (ADMIN), **ตั้งค่าระบบ** (`/dashboard/settings`, ADMIN) — กำหนด SMTP, ทดสอบส่งอีเมล, ตัวเลือก TLS
   - โปรไฟล์เข้าได้จากเมนูผู้ใช้ (dropdown) ไม่แสดงใน sidebar
