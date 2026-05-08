# เอกสารในโฟลเดอร์ `docs/`

ดัชนีอ้างอิงเร็วสำหรับทีมและ AI Agent

| ไฟล์ | หัวข้อ |
|------|--------|
| [templates/README.md](./templates/README.md) | **ดัชนีเทมเพลตแอป** — `AGENTS.md`, Skill 3 ตัวใน `templates/skills/`, `frontend_template` / `backend_template`, copy ทั้งโฟลเดอร์ไปโปรเจกต์อื่นได้ |
| [Project-Plan-Private-MinIO-Images.md](./Project-Plan-Private-MinIO-Images.md) | ปิด MinIO public read, proxy `/job-images` + `/user-images`, checklist ทดสอบ PRD |
| [Email-Notifications.md](./Email-Notifications.md) | Flow อีเมลแจ้งงาน (To/CC, `publicBaseUrl`, Role) |
| [CSV-vs-System-Mapping.md](./CSV-vs-System-Mapping.md) | เทียบข้อมูล CSV/Excel กับ Prisma schema |
| [Job-Serial-Multi-Row.md](./Job-Serial-Multi-Row.md) | Serial หลายอุปกรณ์ (งานแก้ไข), JSON ใน `oldSerialNumber`, migration `TEXT` |
| [MinIO-Orphan-Cleanup.md](./MinIO-Orphan-Cleanup.md) | สแกน/ลบไฟล์ค้างใน bucket (settings, retention, API) |

เอกสาร root ที่เกี่ยวข้อง: [`../README.md`](../README.md), [`../STATUS.md`](../STATUS.md), [`../PLAN.md`](../PLAN.md), [`../TASK.md`](../TASK.md), [`../minio.md`](../minio.md) (ตัวแปร MinIO)

เอกสาร backend: [`../backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md`](../backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md), [`../backend/docs/RBAC-Setup.md`](../backend/docs/RBAC-Setup.md), [`../backend/docs/api-endpoints.json`](../backend/docs/api-endpoints.json)
