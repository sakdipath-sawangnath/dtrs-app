# Frontend - ระบบแจ้งซ่อม

Next.js 15 (App Router) สำหรับระบบแจ้งปัญหาและจัดการการซ่อมบำรุง CCTV

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** Tailwind CSS, Lucide React, recharts, **next-themes** (Dark/Light toggle)
- **Auth:** NextAuth.js (Credentials + JWT จาก Backend)
- **HTTP:** Axios; แจ้งเตือน: SweetAlert2 (Toast ผ่าน `@/lib/toast`)

## โครงสร้างหลัก

- `src/app/` — หน้าและ layout (report, status, login, dashboard)
- `src/components/` — SiteHeader (**ThemeToggle** Sun/Moon), SiteFooter, PublicLayoutShell, DashboardPageShell, DashboardFilterBar, **`CrudModal`** (portal → `document.body`, **`z-100`**, Glass theme-aware, พร็อพ `size` md/lg — ใช้ที่ `/dashboard/users`, `/dashboard/roles` ฯลฯ), UserMenuDropdown, SegmentedTabs, JobsList (ตารางงาน + แท็บสัญญา/นอกสัญญา **ไม่ห่อ glass ชั้นนอก** + badge งานค้าง + modal อัปเดตการแก้ไขแบบ Glass + ดูรายละเอียด full page `/dashboard/jobs/:id` + มอบหมายงาน react-select / รับงาน — ปุ่มมอบหมายและย้ายนอกสัญญาอิงสิทธิ์ **`job.assign`** จาก `/roles/me/permissions`; ลบงาน PENDING ไม่มอบหมายอิง **`job.deleteUnassigned`**; รองรับ `assignedToMe` สำหรับงานที่รับผิดชอบ; ลบงาน IN_PROGRESS ที่หน้า `/dashboard/in-progress` อิง **`job.deleteInProgress`**)
- `src/app/globals.css` — **`--glass-*` tokens** + utilities (`.glass-page`, `.glass-card`, `.glass-text`) และ class **`form-input-glass`** (อ่าน `--glass-input-*` ทั้ง Dark/Light; แยกจาก `.form-input` legacy)
- `src/lib/useAppTheme.ts` — hook อ่าน theme จาก `next-themes` (มี `mounted` guard สำหรับ hydration)
- `src/lib/` — auth.ts (NextAuth; รูปผู้ใช้ใน session ใช้ path **`/user-images/:id`** เมื่อมีรูปในระบบ), toast.ts, **apiResponse.ts**, **`jobImageProxy.ts`** + route **`/job-images/...`**, **`userImageProxy.ts`** + route **`/user-images/[userId]`**, **`dashboardJobImageUrl.ts`** — helper path รูปงานสำหรับ `<img>` บนแดชบอร์ด

### Flow สำคัญ

- **/report**
  - กรอกเบอร์โทรศัพท์ได้เฉพาะตัวเลข 10 หลัก และต้องตรงกับผู้แจ้งที่มีอยู่ในระบบ (`/api/users/reporter-by-phone/:phone`) การ์ดอื่น (สถานที่, รายละเอียด, รูปภาพ) จะใช้งานได้เมื่อเบอร์โทรถูกต้องและพบผู้ใช้เท่านั้น
  - เมื่อส่งฟอร์ม ระบบจะสร้าง `Job` ใหม่ + เลขที่ใบแจ้งซ่อม (`ticketNo` เป็นรหัส hex 8 ตัว) แสดง Toast แจ้งเลข Ticket แล้ว redirect ไปหน้า `/status?ticketNo=...`

- **/status**
  - ฟอร์มค้นหารับเลขที่ใบแจ้งซ่อม แล้วเรียก `GET /api/jobs/status/:ticketNo`
  - ถ้ามี `?ticketNo=...` ใน URL จะกรอกช่องค้นหาให้อัตโนมัติและยิงค้นหาให้ทันที เพื่อรองรับการ redirect จากหน้า `/report`

- **/dashboard/my-jobs**
  - งานที่รับผิดชอบ — JobsList แสดงเฉพาะงานที่รับมอบหมายให้ผู้ใช้ปัจจุบัน; filter + DataTable

- **/dashboard/jobs/[id]**
  - รายละเอียดงานเต็มหน้า: การ์ดข้อมูลการแจ้งข้อขัดข้อง + การ์ดข้อมูลการแก้ไข + ฟอร์มบันทึกการแก้ไข (ส่วนขัดข้อง, สาเหตุ, วิธีแก้ไข, รูปการแก้ไข สูงสุด 3 รูป, หมายเหตุ, Serial เก่า/ใหม่); **บันทึกการแก้ไข / Reopen — เฉพาะผู้รับงาน (assignee)**; Reopen มี `confirmDialog` ก่อนเรียก API; เมื่อสถานะ Resolved — พิมพ์/PDF ผ่านหน้า **`/print/jobs/[id]`** + `JobMaintenancePdfTemplate` + `print.css` (หรือดาวน์โหลด PDF ฝั่ง backend `GET /jobs/:id/report-pdf`)

- **`/print/jobs/[id]` (พิมพ์)**
  - ข้อมูล JSON จาก **`GET /api/print-jobs/:id/data`** (Next API route); รูปในเทมเพลตใช้ **`/job-images/:id/:kind/:index`** (ไม่อยู่ใต้ `/api` — reverse proxy ส่งต่อไป Next ตาม host หลักได้โดยไม่ต้องแยก location เพิ่ม) หรือ alias **`/api/job-images/...`** ถ้าตั้ง NPM แยกเหมือน `/api/print-jobs`

- **รูปโปรไฟล์ (แดชบอร์ด)** — **`/user-images/:userId`** (Next proxy → **`GET /api/users/:id/avatar`**) ใช้ใน `PersonAvatar`, หน้า users, header; path ไม่อยู่ใต้ `/api` เหมือน `/job-images`

- **/dashboard/settings** (สิทธิ์ **`menu.settings`**)
  - ตั้งค่า **SMTP** — โหลด/บันทึก/ทดสอบส่งอีเมล (`GET/PUT /api/settings/email-smtp`, `POST /api/settings/email-smtp/test`); ตัวเลือก TLS / self-signed
  - **เทมเพลตอีเมลแจ้งงาน** — `GET/PUT /api/settings/email-templates`: โลโก้, **`publicBaseUrl`** (ลิงก์ในอีเมลบน production), เทมเพลต **แจ้งเหตุ / รับเรื่อง / ปิดงาน** (เปิดปิด, To เพิ่มเติม, CC, **แจ้งตามบทบาท**); flow ผู้รับเริ่มต้น: [../docs/Email-Notifications.md](../docs/Email-Notifications.md)
  - โครง layout เนื้อหาแบบหน้า `/dashboard`

- **/dashboard/users** (สิทธิ์ **`menu.users`**)
  - จัดการผู้ใช้ — คลิกรูปโปรไฟล์ในตารางเพื่อดูรูปขนาดใหญ่ (lightbox); modal CRUD ผ่าน **`CrudModal`** (portal + z-index เหนือ header)

- **/dashboard/roles** (สิทธิ์ **`menu.roles`**)
  - จัดการบทบาทและสิทธิ์ — modal เพิ่ม/แก้ไข/กำหนดสิทธิ์: **`form-input-glass`**, รายการ permission ในกล่อง Dark Glass; `CrudModal` ใช้ `size="lg"` ในโหมดกำหนดสิทธิ์

- **`/public/report`**
  - แจ้งปัญหา (เส้นทาง public); ใช้ **`useSearchParams`** ภายใน **`ReportPageContent`** ที่ห่อด้วย **`<Suspense>`** เพื่อให้ `next build` ผ่าน (Next.js 15)

## Production build

```bash
npm run build
```

ควรรันก่อน merge/deploy; โปรเจกต์หลักใช้ GitLab CI แยก build `frontend` / `backend` ตาม `.gitlab-ci.yml` ที่ root (ดู `README.md` ด้านบน)

## รันพัฒนา

```bash
npm install
copy .env.example .env.local
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) (Backend ต้องรันที่ `http://localhost:4100/api`)

**ตัวแปร env (local):**

| ตัวแปร | ค่า dev |
|--------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4100/api` |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `API_INTERNAL_BASE_URL` | `http://localhost:4100/api` (NextAuth / route ฝั่ง server) |

PRD/Docker: ดูคอมเมนต์ใน [`.env.example`](.env.example) และ [../docs/DTRS-Migration-Checklist.md](../docs/DTRS-Migration-Checklist.md)

## Theme (Dark / Light)

- สลับโหมดจากไอคอน **Sun/Moon** ใน `SiteHeader` (ทุกหน้า)
- ค่าเริ่มต้น: **Dark**; เก็บใน `localStorage` key **`dtrs-theme`**
- Implementation: [`next-themes`](https://github.com/pacocoursey/next-themes) + CSS variables `--glass-*` ใน [`src/app/globals.css`](src/app/globals.css)
- Hook: [`src/lib/useAppTheme.ts`](src/lib/useAppTheme.ts) (`isDark`, `theme`, `mounted`) — ใช้เมื่อต้องการค่า theme ใน JS (เช่น react-select); UI ส่วนใหญ่พึ่ง CSS tokens / `dark:` classes
- **ข้อยกเว้น:** `/print/jobs/*` บังคับ light เสมอผ่าน [`PrintThemeShell`](src/components/PrintThemeShell.tsx) (class `.light` บน subtree — **ไม่**ซ้อน `ThemeProvider`)
- **Contrast:** ใน light mode หลีกเลี่ยง `text-slate-100/200/300` หรือ `border-white/10` แบบไม่มีคู่ `dark:`; ใช้ `text-slate-900 dark:text-slate-100` (หรือ glass utilities ที่อ่านได้บนพื้นขาว)
## เอกสารเพิ่มเติม

- สถานะโปรเจกต์และ API: root [STATUS.md](../STATUS.md), [README.md](../README.md) (ดัชนีเอกสาร)
- Private MinIO + proxy รูป: [../docs/Project-Plan-Private-MinIO-Images.md](../docs/Project-Plan-Private-MinIO-Images.md), [../docs/minio.md](../docs/minio.md)
- Reverse proxy (NPM): [../backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md](../backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md)
- ดัชนีโฟลเดอร์ `docs/`: [../docs/README.md](../docs/README.md)
