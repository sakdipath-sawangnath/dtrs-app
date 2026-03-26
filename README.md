# CCTV Maintenance System

ระบบแจ้งปัญหาและระบบจัดการการซ่อมบำรุงกล้องวงจรปิด (CCTV) ซึ่งพัฒนาต่อเนื่องมาจากการใช้งานผ่าน AppSheet

## บันทึกการอัปเดตล่าสุด (2026-03-24)

- **อีเมลแจ้งงาน (เทมเพลต + Role)** — เก็บใน `Setting` คีย์ `email_templates`; หน้า **`/dashboard/settings`** (ADMIN): โลโก้, **`publicBaseUrl`** สำหรับลิงก์ในอีเมล, เทมเพลต **แจ้งเหตุ / รับเรื่อง / ปิดงาน** (เปิดปิด, To เพิ่มเติม, CC, **แจ้งตามบทบาท** `notifyRoleIds`); HTML อีเมลโทนสว่าง สถานะเป็น badge — **flow ผู้รับ To/CC เริ่มต้น** ดู [`docs/Email-Notifications.md`](docs/Email-Notifications.md)
- **API:** `GET/PUT /api/settings/email-templates` (ADMIN)
- **CC อีเมล** — CC มาจากช่องตั้งค่า + บทบาทที่เลือกเท่านั้น (ไม่แทรกผู้รับงานเป็น CC อัตโนมัติเมื่อปิดงาน) — สรุปใน [`docs/Email-Notifications.md`](docs/Email-Notifications.md)
- **Modal แดชบอร์ด (`CrudModal`)** — แสดงด้วย **`createPortal` → `document.body`**, **`z-100`** ให้อยู่เหนือ `SiteHeader`/`sidebar` (`z-50`); โทน **Dark Glassmorphism** (backdrop, `ring-1 ring-white/5`, พร็อพ **`size`**: `md` | `lg`); ล็อก scroll `body` ขณะเปิด
- **หน้า `/dashboard/roles`** — modal เพิ่ม/แก้ไขบทบาทและกำหนดสิทธิ์: ฟิลด์ใช้ **`form-input-glass`** (`globals.css`); รายการสิทธิ์ในกล่องแก้ว + checkbox สไตล์ dark

### ย้อนหลัง (2026-03-23)

- **RBAC เมนู (Sidebar)** — `DashboardLayoutShell` ดึง `GET /roles/me/permissions` แล้ว **แกะ `data` ตาม ResponseInterceptor** (`unwrapApiData` ใน `src/lib/apiResponse.ts`); ถ้ากรองตาม permission แล้วไม่มีรายการใน sidebar (เช่น มีแค่ `menu.profile`) จะ **fallback ตามบทบาท**; role ใน session ใช้ **uppercase**; เมนูภาพรวม/กำลังแก้ไข/ประวัติ/นอกสัญญา รวม **SUPERVISOR** ให้สอดคล้อง STAFF
- **Deploy PRD — Next.js** — ใช้ **`next.config.mjs`** แทน `.ts` เพื่อไม่ให้ image production (`npm prune --omit=dev`) ต้องมี `typescript` ตอน `next start`
- **Deploy PRD — NextAuth → Backend** — ตั้ง **`API_INTERNAL_BASE_URL`** (เช่น `http://cctv-app-ticket-backend:4000/api`) ใน container frontend เพื่อให้ `authorize()` เรียก backend ใน Docker network แทน public URL (กัน **ConnectTimeout / hairpin** ไปโดเมน PRD)
- **Deploy PRD — CORS** — GitLab CI ส่ง **`ALLOWED_ORIGINS`** เข้า backend container; ตั้งค่าใน GitLab Variables เป็น origin จริงของเว็บ (คั่นด้วย comma)
- **GitLab CI/CD** — `.gitlab-ci.yml`: stages `build` → `deploy` → `deploy_docker` → `cleanup`; build แยก `frontend` / `backend`; build image **สองตัว** บน Docker daemon PRD (`cctv-app-ticket-frontend`, `cctv-app-ticket-backend`); SSH รัน **สอง container** + network `cctv-app-ticket-net` — map **8309→3000** (Next.js), **8310→4000** (NestJS)
- **Docker** — `backend/Dockerfile` + `frontend/Dockerfile` + `docker-compose.yml` (รันทดสอบแยกคอนเทนเนอร์); build frontend ใช้ `--build-arg NEXT_PUBLIC_API_BASE_URL=...`
- **PDF บน PRD (Puppeteer)** — backend image ต้องมี **Chromium/Chrome** ใน runtime; ใน `JobsPdfService` จะ fallback หา Chrome/Edge ที่ติดตั้งในเครื่อง (ตรวจ env `PUPPETEER_EXECUTABLE_PATH`/`CHROME_BIN` ก่อน) เพื่อกัน error `Could not find Chrome ...` บน production และ local
- **Backend ใน container** — รันด้วย `node dist/src/main.js` (และ `npm run start:prod` ชี้ path เดียวกัน) เพราะ TypeScript ใช้ `module: "nodenext"` ทำให้ผล `nest build` อยู่ใต้ `dist/src/` ไม่ใช่ `dist/main.js` — ถ้า PRD ขึ้น `Cannot find module '/app/dist/main.js'` ให้ตรวจว่า image มาจาก commit ที่แก้ Dockerfile แล้ว และไม่ override `command` เป็น path เก่า
- **ตัวแปร CI (GitLab)** — ใช้ **`FRONTEND_BASE_URL`** เดียวสำหรับลิงก์ Environment, ส่งเข้า container และ `JobsPdfService` (ไม่แยก `FRONTEND_URL_PRD`); รายการตัวแปรอื่นดูคอมเมนต์ใน `.gitlab-ci.yml`
- **Production โดเมนเดียว (ตัวอย่าง)** — เว็บ `https://cctv-app.forth.co.th` + API ที่ **`/api`**: ตั้ง `NEXT_PUBLIC_API_BASE_URL=https://cctv-app.forth.co.th/api`, `NEXTAUTH_URL`, `ALLOWED_ORIGINS`, `FRONTEND_BASE_URL` ให้สอดคล้อง origin จริง; reverse proxy ต้องส่งต่อ **`/socket.io`** ไป backend (Socket.IO ไม่อยู่ใต้ `/api`); รายละเอียด path **Nginx Proxy Manager** (แยก `/api/auth`, `/api/print-jobs` → Next **8309**; `/api/` + `/socket.io` → Nest **8310**) ดู `backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md`
- **MINIO_PUBLIC_URL (ตัวอย่าง)** — เช่น `https://minio-it.forth.co.th` สำหรับ URL รูปที่ browser โหลดได้ (ค่าจริงใส่เฉพาะ `.env` / GitLab Variables)
- **Git** — `.gitignore` ที่ root กำหนดขอบเขตขึ้น repo: `backend/`, `frontend/`, `docs/`, `README.md`, `PLAN.md`, `TASK.md`, `STATUS.md`, `AGENTS.md`, `AGENT_INSTRUCTIONS.md`, `.gitlab-ci.yml`, `docker-compose.yml`, `.dockerignore`, `docker/`
- **Frontend `npm run build`** — `src/lib/apiResponse.ts` รวม **`unwrapApiData`** (แกะ `{ data }` จาก backend) + ฟังก์ชันช่วย assignable/error; หน้า **`/public/report`**: ห่อ `useSearchParams` ด้วย `<Suspense>` ตาม Next.js 15

### ย้อนหลัง (2026-03-22)

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
   - จัดการบทบาทและสิทธิ์ (ADMIN), **ตั้งค่าระบบ** (`/dashboard/settings`, ADMIN) — กำหนด SMTP, ทดสอบส่งอีเมล, ตัวเลือก TLS, เทมเพลตอีเมลแจ้งงาน (รวม `publicBaseUrl`, แจ้งตาม Role); สรุป flow การส่งอีเมล: [`docs/Email-Notifications.md`](docs/Email-Notifications.md)
   - โปรไฟล์เข้าได้จากเมนูผู้ใช้ (dropdown) ไม่แสดงใน sidebar
