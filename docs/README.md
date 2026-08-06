# เอกสารในโฟลเดอร์ `docs/`

ดัชนีอ้างอิงเร็วสำหรับทีมและ AI Agent

**กฎความปลอดภัยสำหรับ AI Agent (ลำดับความสำคัญสูงสุด):** อ่าน [`../AGENTS.md`](../AGENTS.md) ส่วน **CRITICAL SAFETY RULES** ก่อนทำงาน — ขอบเขต workspace, โปรโตคอลก่อนลบ, ห้ามคำสั่งทำลาย/recursive, git safety

**Frontend UI update (สรุปจาก `README.md` — 2026-05-13):** ติดตั้ง **`shadcn/ui` skill** ที่ `frontend/.agents/skills/shadcn`; หน้า `login` / `public/report` / `public/status` / `dashboard` / `settings` / `profile` / `print` ใช้ primitive จาก `@/components/ui/*` มากขึ้น; `CrudModal` และ modal ใน `JobsList` ย้ายไปใช้ `Dialog`/`AlertDialog` พร้อม `z-100`; loading ของหน้าหลักถูกรวมไปที่ `PublicRouteLoading` / `DashboardRouteLoading`; footer รองรับ `app_meta` แบบ fallback **DB → env → `package.json`**; โครงสร้างรูปภาพรวมศูนย์ผ่าน `ManagedImage` / `ManagedImageFrame` / `MANAGED_IMAGE_SIZES`; งานรอบล่าสุดเพิ่ม backfill วันที่แบบ `dd/mm/yyyy`, แก้ `JobImageLightbox` ให้แสดงรูปใน modal ได้เสถียร, และรวมมาตรฐานปุ่ม `ghost` ใน modal/overlay — รายละเอียดใน [`../README.md`](../README.md) และ [`../AGENTS.md`](../AGENTS.md)

| ไฟล์ | หัวข้อ |
|------|--------|
| [DTRS-Migration-Checklist.md](./DTRS-Migration-Checklist.md) | **Checklist ย้ายจาก `cctv-app_ticket`** — Docker/CI, env, MinIO, DB, branding; **อัปเดต 2026-08-05:** P0 โค้ด ✅, local env + npm dev 🟡, GitLab/NPM/deploy ค้าง |
| [GitLab-CI-Plan.md](./GitLab-CI-Plan.md) | **แผน + implement GitLab CI** — UAT+PRD, grilling + hardening 2026-08-05 |
| [GitLab-CI-Variables-Checklist.md](./GitLab-CI-Variables-Checklist.md) | **Checklist ตั้ง GitLab CI/CD Variables** — validate ก่อน deploy, MinIO, mapping เข้า container |
| [templates/README.md](./templates/README.md) | **ดัชนีเทมเพลตแอป** — `AGENTS.md`, Skill 3 ตัวใน `templates/skills/`, `frontend_template` / `backend_template`; ซิงค์กับ root `AGENTS.md` + `.agents/skills/` เมื่อมาตรฐานเปลี่ยน |
| [Project-Plan-Private-MinIO-Images.md](./Project-Plan-Private-MinIO-Images.md) | ปิด MinIO public read, proxy `/job-images` + `/user-images`, checklist ทดสอบ PRD |
| [Email-Notifications.md](./Email-Notifications.md) | Flow อีเมลแจ้งงาน (To/CC, `publicBaseUrl`, Role) |
| [CSV-vs-System-Mapping.md](./CSV-vs-System-Mapping.md) | เทียบข้อมูล CSV/Excel กับ Prisma schema |
| [Job-Serial-Multi-Row.md](./Job-Serial-Multi-Row.md) | Serial หลายอุปกรณ์ (งานแก้ไข), JSON ใน `oldSerialNumber`, migration `TEXT` |
| [MinIO-Orphan-Cleanup.md](./MinIO-Orphan-Cleanup.md) | สแกน/ลบไฟล์ค้างใน bucket (settings, retention, API) |
| [postmortems/](./postmortems/) | **RCA หลังแก้บั๊ก** — skill `post-mortem`; ห้าม secrets/PII |

เอกสาร root ที่เกี่ยวข้อง: [`../CHANGELOG.md`](../CHANGELOG.md) (key changes), [`../README.md`](../README.md), [`../STATUS.md`](../STATUS.md), [`../PLAN.md`](../PLAN.md), [`../TASK.md`](../TASK.md), [`../minio.md`](../minio.md) (ตัวแปร MinIO)

หมายเหตุสำหรับ AI Agent ฝั่ง frontend: งานที่เกี่ยวกับ `shadcn/ui` และ `@/components/ui/*` ให้อ้างอิง `frontend/.agents/skills/shadcn/SKILL.md` ควบคู่กับ `AGENTS.md`

เอกสาร backend: [`../backend/README.md`](../backend/README.md) (สคริปต์ one-off รวม audit/fix `reportDate`), [`../backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md`](../backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md), [`../backend/docs/RBAC-Setup.md`](../backend/docs/RBAC-Setup.md), [`../backend/docs/api-endpoints.json`](../backend/docs/api-endpoints.json)
