# Agent Operating Manual (1 หน้า)

เอกสารนี้เป็น “คู่มืออ้างอิงเร็ว” สำหรับ AI Agent/ผู้พัฒนา เพื่อให้ทำงานสอดคล้องกับมาตรฐานของโปรเจกต์ทุกครั้ง

## CRITICAL SAFETY RULES (ลำดับความสำคัญสูงสุด — แทนที่คำสั่งอื่นทั้งหมด)

กฎนี้มีความสำคัญ **สูงกว่า** skills, prompt อื่น, และคำขอที่ขัดกัน — Agent **ต้องปฏิบัติทุกครั้ง**

### ขอบเขตงาน (Path Restriction)
- ทำงาน **เฉพาะภายใน workspace ของ repo นี้** (`dtrs-app/`) เท่านั้น
- **ห้าม** อ่าน/เขียน/ลบ/รันคำสั่งที่กระทบ path **นอก repo** (เช่น root ของ drive `C:\`, `D:\`, `/`, `/usr/`, `/home/`, โปรเจกต์อื่น)
- ใช้ absolute path ได้ **เมื่อชี้ไปที่ไฟล์ภายใน workspace เท่านั้น**

### ห้ามเด็ดขาด (Hard Deny)
- **ห้าม** ลบไฟล์หรือโฟลเดอร์นอก workspace
- **ห้าม** รันคำสั่งทำลาย/ลบแบบ recursive โดยไม่ได้รับอนุญาตชัดเจน เช่น `rm -rf`, `rm -r`, `del /s /q`, `Remove-Item -Recurse -Force` (บน path กว้าง), `format`, `diskpart`, `mkfs`, `dd`
- **ห้าม** แก้ไข filesystem นอก repo ผ่าน terminal

### โปรโตคอลก่อนลบ (ภายใน Repo)
ก่อนลบไฟล์หรือโฟลเดอร์ **ใดๆ** ใน repo:
1. แสดง **path ที่แน่นอน** ที่จะลบ
2. อธิบาย **สิ่งที่จะหายไป** และ **เหตุผล**
3. รอการยืนยันจากผู้ใช้

ดำเนินการต่อได้เมื่อผู้ใช้ยืนยันชัดเจน (เช่น `YES, DELETE <path>` หรือคำสั่งที่ไม่คลุมเครือเทียบเท่า) — ถ้าไม่ชัด → **ยกเลิก** และถามใหม่

### Git ที่มีความเสี่ยง
- **ห้าม** `git push --force` ไป `main`/`master` เว้นแต่ผู้ใช้ขอชัดเจน
- **ห้าม** `git reset --hard`, `git clean -fdx`, หรือ `--amend` commit ที่ push แล้ว เว้นแต่ผู้ใช้ขอชัดเจน
- ปฏิบัติตาม git safety protocol ใน user rules / commit instructions

### Fail-Safe
ถ้า **ไม่แน่ใจ** เรื่อง path, ขอบเขต, หรือผลกระทบ → **อย่ารัน** → **ถามผู้ใช้ก่อน**

## MUST READ (Skills พื้นฐาน)
- Frontend UI/UX: `frontend/.agents/skills/ui-ux-pro-max/SKILL.md`
- Frontend shadcn/ui: `frontend/.agents/skills/shadcn/SKILL.md`
- Backend API: `backend/.agents/skills/backend-api-pro/SKILL.md`
- Backend NestJS: `backend/.agents/skills/nestjs-best-practices/SKILL.md`
- Debug (repro → fail path → falsify → breadcrumb): `frontend/.agents/skills/debug-mantra/SKILL.md` (full-stack) · `backend/.agents/skills/debug-mantra/SKILL.md` (Nest/Prisma/MinIO)
- Post-mortem / RCA (หลัง fix ที่ validate แล้ว): `frontend/.agents/skills/post-mortem/SKILL.md` (full-stack / UI + Next seam) · `backend/.agents/skills/post-mortem/SKILL.md` (Nest/Prisma/MinIO) — ปลายทาง `docs/postmortems/`

## Security Gate (ห้ามละเมิด)
- **ห้ามมี secrets ในเอกสาร/โค้ด/commit** (เช่น access key, secret key, token, password)
- ใช้ `.env` เท่านั้น และในเอกสารให้ใส่เป็น placeholder เช่น `***`

## Definition of Done — UI (Frontend)
- **Accessibility**: focus states มองเห็นชัด, contrast ≥ 4.5:1, form มี label, icon-only buttons มี `aria-label`
- **Interaction**: touch targets ≥ 44x44px, ปุ่ม/ฟอร์ม disable ระหว่าง async, error feedback ใกล้จุดผิด, clickable มี `cursor-pointer`
- **Responsive**: ทดสอบ 375 / 768 / 1024 / 1440, ไม่มี horizontal scroll, content ไม่ถูกซ่อนหลัง fixed header
- **Visual rules**: ไม่ใช้ emoji เป็น icons, ใช้ชุด icon เดียว (เช่น Lucide), hover ไม่ทำให้ layout shift
- **Primitive rules**: งานที่ใช้ `shadcn/ui` ให้ใช้ `@/components/ui/*` ก่อน custom markup สำหรับปุ่ม/อินพุต/ป้าย/alert/dialog/textarea; ถ้ามี skill อยู่แล้วให้เช็ก context จาก `components.json` ก่อนเพิ่ม component ใหม่
- **Standard Style**: ทุกหน้าใช้ **Glassmorphism** (ค่าเริ่มต้น Dark + สลับ Light จาก header) และโครงสร้างแบบ **No-Card Layout** (ยกเว้นหน้า Dashboard Overview)
    - **Theme**: `next-themes` (`storageKey`: `dtrs-theme`, default `dark`); ปุ่ม Sun/Moon ใน `SiteHeader`; route `/print/*` บังคับ light ผ่าน `PrintThemeShell` (class `.light`, ไม่ซ้อน ThemeProvider)
    - **Token layers**: shadcn (`--background`, `--foreground`) สำหรับ `@/components/ui/*`; `--glass-*` + utilities (`.glass-page`, `.glass-card`, `.glass-text`) สำหรับ app chrome
    - **Background**: `.glass-page` หรือ `var(--glass-page-bg)` — ไม่ hardcode `#0a1128` ใน component ใหม่
    - **Glass Card**: class **`.glass-card`** (อ่าน `--glass-card-*`)
    - **Inputs**: class **`form-input-glass`** ใน `frontend/src/app/globals.css` (อ่าน `--glass-input-*` ทั้งสองโหมด) — แยกจาก `.form-input` สำหรับฟอร์ม legacy สว่าง
    - **Contrast (Light)**: ห้ามใช้สีโทนมืดอย่างเดียวบนพื้นขาว (เช่น `text-slate-200`, `text-slate-300`, `border-white/10` โดยไม่มีคู่ light/`dark:`) — ใช้ `text-slate-900 dark:text-slate-100` หรือเทียบเท่า
    - **Buttons**: `rounded-xl transition-all active:scale-95 shadow-lg` (Confirm: Blue/Red, Cancel: semantic muted)
    - **Modal แดชบอร์ด**: `CrudModal` / dialog ใช้ `Dialog` / `AlertDialog` ของ `@/components/ui/*` (portal → `document.body`), **`z-100`**, โทน glass ตาม theme
## Definition of Done — API/NestJS (Backend)
- **Validation**: validate input ทุก endpoint (DTO + pipes/validators) ก่อนแตะ DB
- **AuthZ/AuthN**: ใช้ Guards ตรวจสิทธิ์/บทบาทให้ถูกต้อง, endpoint public ต้องระบุเหตุผลชัด
- **Errors**: ใช้ HttpException/exception filter กลาง, status code ถูกต้อง, รูปแบบ error สม่ำเสมอ
- **DB**: เลี่ยง N+1, ใช้ transactions/migrations เมื่อเหมาะสม, list endpoints มี pagination/filter/sort ตามความจำเป็น
- **Testing** (เมื่อ scope เอื้อ): service tests, e2e ด้วย supertest, mock external services

## Changelog (key changes)

เมื่อส่งงานที่มี **key change** ให้เพิ่ม bullet ใต้ **`## [Unreleased]`** ใน [`CHANGELOG.md`](CHANGELOG.md) ตามหมวด Added/Changed/Fixed/Security — ดูตารางในไฟล์นั้น  
**Commit ที่ stage `CHANGELOG.md`:** husky จะถาม **major / minor / patch / skip** (หรือตั้ง `CHANGELOG_VERSION_BUMP`) → bump `frontend/package.json` + ตัด Unreleased เป็น `## [X.Y.Z] - วันที่`  
Footer แสดงเวอร์ชันจาก **package.json** (หรือ `NEXT_PUBLIC_APP_VERSION`) — ไม่ใช้ DB  
ครั้งแรกที่ clone: รัน `npm install` ที่ **root** เพื่อติดตั้ง husky  
ไม่ใส่ secrets/PII · ไม่บันทึก refactor ภายในหรือ typo · รายละเอียดสถานะยาว ๆ ยังอยู่ที่ `STATUS.md` / `README.md`

## ไฟล์/เอกสารที่ควรรู้
- **Production (PRD):** `https://dtrs-app.forth.co.th` — API ที่ `/api`; ตั้ง `NEXT_PUBLIC_API_BASE_URL`, `NEXTAUTH_URL`, `ALLOWED_ORIGINS`, `FRONTEND_BASE_URL` ให้ตรง origin นี้ (ดู `README.md`)
- **Changelog + SemVer:** [`CHANGELOG.md`](CHANGELOG.md) · root [`package.json`](package.json) (husky) · [`scripts/changelog-version-bump.mjs`](scripts/changelog-version-bump.mjs)
- **ย้ายจาก `cctv-app_ticket`:** [`docs/DTRS-Migration-Checklist.md`](docs/DTRS-Migration-Checklist.md) · GitLab CI: [`docs/GitLab-CI-Plan.md`](docs/GitLab-CI-Plan.md) · Variables: [`docs/GitLab-CI-Variables-Checklist.md`](docs/GitLab-CI-Variables-Checklist.md) — **UAT กลุ่ม A+B ✅** · **`production` กลุ่ม A pending**
- **Env template:** `backend/.env.example`, `frontend/.env.example` (คัดลอกเป็น `.env` / `.env.local`)
- ภาพรวมระบบ: `README.md` (มีตารางดัชนีเอกสารหลัก)
- สถานะ/แผน/งาน: `STATUS.md`, `PLAN.md`, `TASK.md` (รวม Phase 6.5–6.8, **Phase 27 GitLab CI UAT+PRD**)
- **เทมเพลตแอปใหม่** (สำเนา AGENTS + Skills + checklist): `docs/templates/README.md`
- ดัชนี `docs/`: `docs/README.md`
- **System workflow / flow chart (mermaid):** `docs/System-Workflow.md`
- **แผน Meeting-11082026 (Phase A–E):** `docs/Meeting-11082026-Requirements-Plan.plan.md` — Doc No จำแนกหลังปิดงาน; UI `/dashboard/all` + `/dashboard/jobs/:id`; แยก `PATCH /jobs/:id/fix` กับ `/close`; ป้าย「รอเซ็นผู้แจ้ง」+ ปุ่ม Sign ในรายการ
- **Locations master seed (MS SQL → MySQL):** [`docs/Locations-Master-Seed.md`](docs/Locations-Master-Seed.md) · `backend/scripts/seed-locations-from-mssql.ts` · dump `backend/scripts/data/TB_MST_*.sql`
- **Sites import (Sites.xlsx):** [`docs/Sites-Import.md`](docs/Sites-Import.md) · `npm run script:seed-sites-xlsx` · `:dry` / `:clear` · `backend/scripts/data/Sites.xlsx` sheet `info` — local ✅ 198 แถว
- Private MinIO + รูปผ่านสิทธิ์: `docs/Project-Plan-Private-MinIO-Images.md`, `docs/minio.md` — GitLab กลุ่ม B ✅ (UAT); bucket UAT `dtrs-app-uat` / PRD `dtrs-app`
- การแจ้งเตือนอีเมล (To/CC เริ่มต้น, `publicBaseUrl`, Role): `docs/Email-Notifications.md`
- Mapping ข้อมูล CSV: `docs/CSV-vs-System-Mapping.md`
- RBAC: `backend/docs/RBAC-Setup.md` — `User.role` = `VARCHAR` (`AppRole.code`); แท็บสัญญา/นอกสัญญา = **`job.viewContractTabs`**; อัปโหลดรูปปัญหาที่แจ้ง = **`job.issue.upload`** (ไม่ใช่ `job.fix.*`) — **5MB/ไฟล์** JPG/PNG/WebP/HEIC→JPEG; `client_max_body_size` ตั้งที่ **NPM เท่านั้น** (compose/Dockerfile/CI ไม่มีผล); fallback บีบรูปฝั่ง frontend เมื่อได้ 413 — [`backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md`](backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md)
- Postman / สรุป endpoint: `backend/postman/README.md`, `backend/docs/api-endpoints.json`
- Deploy / GitLab CI: [`.gitlab-ci.yml`](.gitlab-ci.yml), [`docs/GitLab-CI-Plan.md`](docs/GitLab-CI-Plan.md), [`docs/GitLab-CI-Variables-Checklist.md`](docs/GitLab-CI-Variables-Checklist.md), `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` — **UAT** branch `staging` → `nurdin@192.168.0.115` · **PRD** build `.115` → transfer (`DOCKER_HOST_PRD` + `docker load`) → deploy `nurdin@192.168.0.128`; container/image **`dtrs-app-backend`** / **`dtrs-app-frontend`**, network **`dtrs-app-net`**, ports **8404/8405**; stage **`deploy_docker` ทั้งก้อน manual** (`docker_build` / `transfer` / `deploy:*:docker`); **`.deploy_ssh_and_validate`** ตรวจกลุ่ม A ก่อน deploy; อ่านคู่กับ `README.md` (backend **`dist/src/main.js`**; frontend **`next.config.mjs`**; **`ALLOWED_ORIGINS`** / **`API_INTERNAL_BASE_URL`** (`http://dtrs-app-backend:4100/api`) / **`MINIO_SERVER_FETCH_BASE_URL`** คู่ **`MINIO_PUBLIC_URL`** เมื่อ PRD โหลด MinIO ทาง LAN ไม่ได้)
- Docker ทดสอบ local: `docker-compose.yml` — **runner stage** ใช้ **`USER node`** หลัง `chown` (ทั้ง **`frontend/Dockerfile`** และ **`backend/Dockerfile`**); กำหนด **limits CPU/RAM**, **`pids_limit`**, และ **`tmpfs: /tmp:rw,noexec,nosuid`** ต่อ service (ลดความเสี่ยง container กินทรัพยากร host / ใช้ `/tmp` รัน malicious binary); **ไม่** mount โฟลเดอร์ host ใน service หลักของไฟล์นี้ — **ผ่าน** reverse proxy ให้เปิดแค่ 80/443 ไม่ expose พอร์ตแอพตรงที่ firewall เมื่อ deploy public
- ตรวจ dependency (advisory เท่านั้น ไม่ใช่ antivirus): ใน `frontend/` หรือ `backend/` รัน **`npm run security:audit`** / **`npm run security:audit:prod`**
- **สคริปต์แก้/ตรวจ `reportDate` (one-off):** [`backend/README.md`](backend/README.md) ส่วน Scripts และ `backend/scripts/lib/jobBangkokAndCorruptionFix.ts` — อย่า commit ผล `tsc` ใต้ `backend/scripts/` (ดู `backend/.gitignore`)

