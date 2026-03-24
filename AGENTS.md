# Agent Operating Manual (1 หน้า)

เอกสารนี้เป็น “คู่มืออ้างอิงเร็ว” สำหรับ AI Agent/ผู้พัฒนา เพื่อให้ทำงานสอดคล้องกับมาตรฐานของโปรเจกต์ทุกครั้ง

## MUST READ (Skills พื้นฐาน)
- Frontend UI/UX: `frontend/.agents/skills/ui-ux-pro-max/SKILL.md`
- Backend API: `backend/.agents/skills/backend-api-pro/SKILL.md`
- Backend NestJS: `backend/.agents/skills/nestjs-best-practices/SKILL.md`

## Security Gate (ห้ามละเมิด)
- **ห้ามมี secrets ในเอกสาร/โค้ด/commit** (เช่น access key, secret key, token, password)
- ใช้ `.env` เท่านั้น และในเอกสารให้ใส่เป็น placeholder เช่น `***`

## Definition of Done — UI (Frontend)
- **Accessibility**: focus states มองเห็นชัด, contrast ≥ 4.5:1, form มี label, icon-only buttons มี `aria-label`
- **Interaction**: touch targets ≥ 44x44px, ปุ่ม/ฟอร์ม disable ระหว่าง async, error feedback ใกล้จุดผิด, clickable มี `cursor-pointer`
- **Responsive**: ทดสอบ 375 / 768 / 1024 / 1440, ไม่มี horizontal scroll, content ไม่ถูกซ่อนหลัง fixed header
- **Visual rules**: ไม่ใช้ emoji เป็น icons, ใช้ชุด icon เดียว (เช่น Lucide), hover ไม่ทำให้ layout shift
- **Standard Style**: ทุกหน้าต้องเป็น **Dark Glassmorphism** และโครงสร้างแบบ **No-Card Layout** (ยกเว้นหน้า Dashboard Overview)
    - **Background**: `bg-[#020617]` หรือ `bg-slate-950`
    - **Glass Card**: `rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl`
    - **Inputs**: `rounded-xl bg-slate-900/40 border-white/10 focus:ring-blue-500/50` — บนแดชบอร์ดใช้ class **`form-input-glass`** ใน `frontend/src/app/globals.css` แทน `.form-input` ที่ไปคู่พื้นสว่าง
    - **Buttons**: `rounded-xl transition-all active:scale-95 shadow-lg` (Confirm: Blue/Red, Cancel: Slate-800)
    - **Modal แดชบอร์ด**: `CrudModal` — แสดงด้วย **portal ไป `document.body`**, **`z-100`** (เหนือ header `z-50`), โทน Dark Glass ตามด้านบน

## Definition of Done — API/NestJS (Backend)
- **Validation**: validate input ทุก endpoint (DTO + pipes/validators) ก่อนแตะ DB
- **AuthZ/AuthN**: ใช้ Guards ตรวจสิทธิ์/บทบาทให้ถูกต้อง, endpoint public ต้องระบุเหตุผลชัด
- **Errors**: ใช้ HttpException/exception filter กลาง, status code ถูกต้อง, รูปแบบ error สม่ำเสมอ
- **DB**: เลี่ยง N+1, ใช้ transactions/migrations เมื่อเหมาะสม, list endpoints มี pagination/filter/sort ตามความจำเป็น
- **Testing** (เมื่อ scope เอื้อ): service tests, e2e ด้วย supertest, mock external services

## ไฟล์/เอกสารที่ควรรู้
- ภาพรวมระบบ: `README.md`
- สถานะ/แผน/งาน: `STATUS.md`, `PLAN.md`, `TASK.md` (รวม Phase 6.5–6.8: …, **เทมเพลตอีเมล**, **CrudModal + `/dashboard/roles` Dark Glass**)
- การแจ้งเตือนอีเมล (To/CC เริ่มต้น, `publicBaseUrl`, Role): `docs/Email-Notifications.md`
- Mapping ข้อมูล CSV: `docs/CSV-vs-System-Mapping.md`
- RBAC: `backend/docs/RBAC-Setup.md`
- Postman / สรุป endpoint: `backend/postman/README.md`, `backend/docs/api-endpoints.json`
- Deploy: `.gitlab-ci.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` — อ่านคู่กับ `README.md` (backend รัน **`dist/src/main.js`** ใน image ไม่ใช่ `dist/main.js`; frontend ใช้ **`next.config.mjs`**; ตั้ง **`ALLOWED_ORIGINS`** / **`API_INTERNAL_BASE_URL`** ตาม `README.md`)

