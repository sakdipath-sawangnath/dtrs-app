# เอกสารในโฟลเดอร์ `docs/`

ดัชนีอ้างอิงเร็วสำหรับทีมและ AI Agent

**กฎความปลอดภัยสำหรับ AI Agent (ลำดับความสำคัญสูงสุด):** อ่าน [`../AGENTS.md`](../AGENTS.md) ส่วน **CRITICAL SAFETY RULES** ก่อนทำงาน — ขอบเขต workspace, โปรโตคอลก่อนลบ, ห้ามคำสั่งทำลาย/recursive, git safety

**Frontend UI update (สรุป — 2026-08-06):** **Dark default + Light toggle** (`next-themes`, `dtrs-theme`, `ThemeToggle` ใน header); tokens `--glass-*` / `PrintThemeShell` สำหรับ `/print/*`; contrast ตาราง dashboard ใน light mode — ดู [`../CHANGELOG.md`](../CHANGELOG.md), [`../frontend/README.md`](../frontend/README.md), [`../AGENTS.md`](../AGENTS.md)

**Frontend UI update (สรุปจาก `README.md` — 2026-05-13):** ติดตั้ง **`shadcn/ui` skill** ที่ `frontend/.agents/skills/shadcn`; หน้า `login` / `public/report` / `public/status` / `dashboard` / `settings` / `profile` / `print` ใช้ primitive จาก `@/components/ui/*` มากขึ้น; `CrudModal` และ modal ใน `JobsList` ย้ายไปใช้ `Dialog`/`AlertDialog` พร้อม `z-100`; loading ของหน้าหลักถูกรวมไปที่ `PublicRouteLoading` / `DashboardRouteLoading`; footer รองรับ `app_meta` แบบ fallback **DB → env → `package.json`**; โครงสร้างรูปภาพรวมศูนย์ผ่าน `ManagedImage` / `ManagedImageFrame` / `MANAGED_IMAGE_SIZES`; งานรอบล่าสุดเพิ่ม backfill วันที่แบบ `dd/mm/yyyy`, แก้ `JobImageLightbox` ให้แสดงรูปใน modal ได้เสถียร, และรวมมาตรฐานปุ่ม `ghost` ใน modal/overlay — รายละเอียดใน [`../README.md`](../README.md) และ [`../AGENTS.md`](../AGENTS.md)

| ไฟล์ | หัวข้อ |
|------|--------|
| [System-Workflow.md](./System-Workflow.md) | **Flow chart / System workflow** — **§2 ครบวงจร แจ้ง→ปิดงาน**, lifecycle, report/status, dashboard, อีเมล, MinIO, auth, PDF, proxy (mermaid) |
| [Meeting-11082026-Requirements-Plan.plan.md](./Meeting-11082026-Requirements-Plan.plan.md) | **แผน Meeting-11082026** — Phase A–E ✅ · ข้อ 8 Reports ✅ (PDF CM/SHF); Doc No จำแนกหลังปิดงาน; UI `/all` + job detail; รูปปัญหา `job.issue.upload` · **5MB/HEIC** · fallback 413 · แยก `/fix` กับ `/close` + ป้าย「รอเซ็นผู้แจ้ง」+ ปุ่ม Sign ในรายการ |
| [Locations-Master-Seed.md](./Locations-Master-Seed.md) | **Seed จังหวัด/อำเภอ/ตำบล** จาก dump MS SQL (`TB_MST_*.sql`) → MySQL ผ่าน `seed-locations-from-mssql.ts` |
| [Sites-Import.md](./Sites-Import.md) | **Seed Site** จาก `Sites.xlsx` (agency + station) · migration `Site.station` / `Job.agency` · local ✅ |
| [DTRS-Migration-Checklist.md](./DTRS-Migration-Checklist.md) | **Checklist ย้ายจาก `cctv-app_ticket`** — Docker/CI, env, MinIO, DB, branding; **อัปเดต 2026-08-06:** P0 ✅ · Variables UAT กลุ่ม A+B ✅ · `production`/NPM/deploy pending |
| [GitLab-CI-Plan.md](./GitLab-CI-Plan.md) | **แผน + implement GitLab CI** — UAT+PRD, grilling + hardening; Variables MinIO ✅ 2026-08-06 |
| [GitLab-CI-Variables-Checklist.md](./GitLab-CI-Variables-Checklist.md) | **Checklist GitLab CI/CD Variables** — กลุ่ม A `staging` ✅ · กลุ่ม B MinIO ✅ · `production` pending · mapping เข้า container |
| [templates/README.md](./templates/README.md) | **ดัชนีเทมเพลตแอป** — `AGENTS.md`, Skill 3 ตัวใน `templates/skills/`, `frontend_template` / `backend_template`; ซิงค์กับ root `AGENTS.md` + `.agents/skills/` เมื่อมาตรฐานเปลี่ยน |
| [Project-Plan-Private-MinIO-Images.md](./Project-Plan-Private-MinIO-Images.md) | ปิด MinIO public read, proxy `/job-images` + `/user-images`, checklist ทดสอบ PRD |
| [Email-Notifications.md](./Email-Notifications.md) | Flow อีเมลแจ้งงาน (To/CC, `publicBaseUrl`, Role) |
| [CSV-vs-System-Mapping.md](./CSV-vs-System-Mapping.md) | เทียบข้อมูล CSV/Excel กับ Prisma schema |
| [Job-Serial-Multi-Row.md](./Job-Serial-Multi-Row.md) | Serial หลายอุปกรณ์ (งานแก้ไข), JSON ใน `oldSerialNumber`, migration `TEXT` |
| [MinIO-Orphan-Cleanup.md](./MinIO-Orphan-Cleanup.md) | สแกน/ลบไฟล์ค้างใน bucket (settings, retention, API) |
| [postmortems/](./postmortems/) | **RCA หลังแก้บั๊ก** — skill `post-mortem`; ห้าม secrets/PII |

เอกสาร root ที่เกี่ยวข้อง: [`../CHANGELOG.md`](../CHANGELOG.md) (key changes), [`../README.md`](../README.md), [`../STATUS.md`](../STATUS.md), [`../PLAN.md`](../PLAN.md), [`../TASK.md`](../TASK.md), [`minio.md`](./minio.md) (ตัวแปร MinIO · GitLab กลุ่ม B ✅)

หมายเหตุสำหรับ AI Agent ฝั่ง frontend: งานที่เกี่ยวกับ `shadcn/ui` และ `@/components/ui/*` ให้อ้างอิง `frontend/.agents/skills/shadcn/SKILL.md` ควบคู่กับ `AGENTS.md`

เอกสาร backend: [`../backend/README.md`](../backend/README.md) (สคริปต์ one-off รวม audit/fix `reportDate`), [`../backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md`](../backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md), [`../backend/docs/RBAC-Setup.md`](../backend/docs/RBAC-Setup.md), [`../backend/docs/api-endpoints.json`](../backend/docs/api-endpoints.json)
