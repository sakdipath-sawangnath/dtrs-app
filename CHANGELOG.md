# Changelog

บันทึก **key changes** ของ `dtrs-app` (ผู้ใช้เห็นได้ / deploy / ความปลอดภัย / API ที่ breaking หรือสำคัญ)

รูปแบบอิง [Keep a Changelog](https://keepachangelog.com/th/1.1.0/) + SemVer บน `frontend/package.json`  
รายละเอียดเชิงสถานะ/แผนงานยาว ๆ ยังอยู่ที่ [`STATUS.md`](STATUS.md) · [`TASK.md`](TASK.md) · [`README.md`](README.md)

---

## วิธีอัปเดต (สำหรับทีมและ AI Agent)

### เมื่อไหร่ต้องเขียน

| เขียนใน `[Unreleased]` | ไม่ต้องเขียน |
|------------------------|--------------|
| ฟีเจอร์ที่ผู้ใช้หรือ ops ใช้งานได้ | refactor / rename ภายในที่ไม่เปลี่ยนพฤติกรรม |
| แก้บั๊กที่กระทบ production หรือ flow หลัก | แก้ typo, format, comment |
| Breaking / เปลี่ยนสัญญา API หรือ env ที่ต้องตั้งใหม่ | เอกสารอย่างเดียวโดยไม่มีผลรันระบบ |
| ความปลอดภัย (authz, Docker hardening, dependency ที่มี advisory สำคัญ) | งาน WIP ที่ยังไม่ merge / ยังไม่พร้อมใช้ |
| Deploy / CI ที่เปลี่ยนขั้นตอน deploy จริง | ปรับข้อความ UI เล็กน้อยโดยไม่เปลี่ยน flow |

### วิธีเขียน

1. ใส่รายการใต้ **`## [Unreleased]`** ก่อน — จัดหมวด `Added` / `Changed` / `Fixed` / `Security` / `Removed` / `Deprecated`
2. เขียนสั้น เน้น **ทำไม/ผลต่อผู้ใช้หรือ ops** ไม่ dump รายชื่อไฟล์
3. **Commit ที่ stage `CHANGELOG.md`** จะถูก husky pre-commit ถาม **major / minor / patch / skip** (มีคำใบ้จากหมวดใน diff) — bump `frontend/package.json` + lockfile แล้วตัด `[Unreleased]` เป็น `## [X.Y.Z] - YYYY-MM-DD`
4. ไม่มี TTY (CI/agent): ตั้ง `CHANGELOG_VERSION_BUMP=major|minor|patch|skip`
5. **ห้าม** ใส่ secrets, token, รหัสผ่าน, หรือ PII
6. หลัง milestone ใหญ่ — อัปเดตบรรทัดสั้นใน [`README.md`](README.md) ได้ (ไม่บังคับซ้ำทุก bullet)

### เวอร์ชันที่แสดงในแอป (footer)

- Source of truth: **`frontend/package.json`** → badge `vX.Y.Z`
- Override ชั่วคราว: `NEXT_PUBLIC_APP_VERSION` (deploy env)
- **ไม่ใช้** ค่า version จาก DB / หน้า settings (ช่องนั้นอ่านอย่างเดียว)
- ไม่ bump `backend/package.json` คู่กับผลิตภัณฑ์

### ติดตั้ง hook (ครั้งแรก)

```bash
npm install
```

ที่ root ของ repo (ติดตั้ง husky) — จากนั้น `git commit` ที่แตะ `CHANGELOG.md` จะถาม bump

---

## [Unreleased]

---

## [0.1.1] - 2026-08-06

### Changed

- อีเมลปิดงาน: ชื่อไฟล์ PDF แนบจาก `CCTV-Job-*.pdf` เป็น `DTRS-*.pdf`

---

## [0.1.0] - 2026-08-06

### Added

- Frontend: สลับ Dark/Light จาก SiteHeader (`next-themes`, storage key `dtrs-theme`, ค่าเริ่มต้น Dark) พร้อม `--glass-*` tokens และ utilities
- Print (`/print/*`): บังคับโทนสว่างผ่าน `PrintThemeShell` โดยไม่ซ้อน ThemeProvider กับ root

### Fixed

- Light mode: contrast ข้อความตาราง/ฟิลเตอร์/การ์ดบน JobsList (`/dashboard/all` และหน้าที่เกี่ยวข้อง) และ `/dashboard/sites`
- Light mode: ปรับ badge/สถานะและพื้นผิว dashboard (roles, stat cards, toast ตาม theme) ให้อ่านได้บนพื้นขาว

### Changed

- Sync docs มาตรฐาน UI: `README.md`, `STATUS.md`, `TASK.md`, `PLAN.md`, `docs/README.md`, `frontend/README.md`, `AGENTS.md` — Glassmorphism Dark default + Light toggle

---

## [0.0.1] - 2026-08-06

### Added

- `CHANGELOG.md` + husky pre-commit (`scripts/changelog-version-bump.mjs`): เมื่อ stage changelog ให้เลือก major/minor/patch/skip แล้ว bump SemVer
- ตั้ง SemVer ผลิตภัณฑ์เริ่มต้นที่ **`0.0.1`** (`frontend/package.json`) สำหรับ badge ใน footer

### Changed

- Footer / settings: เวอร์ชันมาจาก `package.json` (หรือ `NEXT_PUBLIC_APP_VERSION`) เท่านั้น — ไม่ทับด้วย DB `app_meta.version`

---

## [2026-08-06]

### Fixed

- CI: แก้ backend Jest mock และ inject `NEXT_PUBLIC_*` ตอน build frontend ให้ pipeline ผ่าน

### Changed

- Docker: ลดขนาด image (Next standalone / `puppeteer-core`) และเพิ่ม gate ขนาด/smoke ใน CI
- Sync พอร์ต backend **4100**, lint/format backend, agent skills

---

## [2026-08-05]

### Added

- GitLab CI UAT + PRD: pipeline `test` → `build` → `deploy_docker` (manual); UAT บน `staging` → `.115`; PRD build → transfer (`DOCKER_HOST_PRD`) → deploy `.128`
- เอกสาร migration / CI plan / Variables checklist สำหรับย้ายจาก `cctv-app_ticket`

### Changed

- ชื่อ container/image/network เป็น `dtrs-app-*`; host ports **8404/8405**; deploy path `/home/nurdin/dtrs-app`
- Deploy gate: ตรวจ GitLab Variables กลุ่ม A ก่อน deploy + health check หลัง deploy

---

## [2026-05-13]

### Added

- `shadcn/ui` skill + rollout primitives บน login / public / dashboard / print
- Footer `app_meta` (ชื่อแอป / บริษัท / เวอร์ชัน) — fallback DB → env → `package.json`
- Image primitives กลาง (`ManagedImage` / `ManagedImageFrame`)

### Changed

- `CrudModal` และ modal ใน `JobsList` → `Dialog` / `AlertDialog` (`z-100`, Dark Glass)
- Backfill วันที่บนหน้ารายละเอียดงานเป็นรูปแบบ **`dd/mm/yyyy`** + preview ปฏิทินไทย

---

## [2026-05-10]

### Security

- Docker runner เป็น non-root (`USER node`); `docker-compose` ใส่ `tmpfs` `/tmp` + จำกัด CPU/RAM/`pids_limit`
- สคริปต์ `npm run security:audit` / `security:audit:prod` + overrides ตาม advisory

### Added

- หน้า `/public/status`: แสดงสาเหตุ / วิธีแก้จากงานที่ปิดแล้ว

---

## [2026-05-08]

### Added

- แพ็กเกจเทมเพลตแอปใหม่ที่ `docs/templates/`

### Changed

- จำกัดทรัพยากร container ใน `docker-compose.yml`

---

## [2026-04-02]

### Added

- Serial หลายอุปกรณ์ในงานแก้ไข (สูงสุด 4 แถว) — ดู [`docs/Job-Serial-Multi-Row.md`](docs/Job-Serial-Multi-Row.md)
- MinIO Orphan Manager ใน settings (สแกน/ลบ object ค้าง) — ดู [`docs/MinIO-Orphan-Cleanup.md`](docs/MinIO-Orphan-Cleanup.md)

### Changed

- `GET /settings/default-pass` คืนรหัสผ่านเริ่มต้นให้หน้า settings (เฉพาะผู้มี `menu.settings`)

---

## [2026-03-31]

### Changed

- RBAC API สอดคล้อง `/dashboard/roles`: `menu.roles` / `menu.users` / `menu.settings`, `job.updateStatus`, `job.deleteInProgress`, `site.create`

---

## [2026-03-30]

### Changed

- คิวงาน: มอบหมาย / ย้ายนอกสัญญา / ลบ PENDING ไม่มอบหมาย อิง `job.assign` และ permission จาก DB
- บันทึก `assignedById` เพื่อแยกมอบหมาย vs รับงานเองบนหน้ารายละเอียดงาน

---

## [2026-03-28]

### Added

- Proxy รูปงาน/โปรไฟล์ผ่านสิทธิ์ (`/job-images`, `/user-images`); MinIO ไม่เปิด public read เป็นค่าเริ่มต้น
- `MINIO_SERVER_FETCH_BASE_URL` สำหรับโหลดรูปภายใน LAN ตอนสร้าง PDF / proxy

### Fixed

- พิมพ์/PDF บน PRD เมื่อ NPM / MinIO routing ทำให้รูป 404 หรือ fetch ไม่ได้

---

## [2026-03-24]

### Added

- เทมเพลตอีเมลแจ้งงาน (แจ้งเหตุ / รับเรื่อง / ปิดงาน) + แจ้งตามบทบาท — [`docs/Email-Notifications.md`](docs/Email-Notifications.md)
- Permission `job.fix.self|any`, `job.reopen.self|any`

### Changed

- Modal แดชบอร์ดโทน Dark Glass + portal เหนือ header

---

## [2026-03-23]

### Added

- GitLab CI/Docker แยก frontend–backend; `API_INTERNAL_BASE_URL` / `ALLOWED_ORIGINS` สำหรับ CORS และ NextAuth ใน Docker

### Fixed

- Backend container entry เป็น `dist/src/main.js` (nodenext)
- Frontend: `next.config.mjs`, Suspense รอบ `useSearchParams` หน้า public report

---

## [2026-03]

### Added

- ระบบแจ้งซ่อมสาธารณะ + แดชบอร์ดเจ้าหน้าที่ (NestJS + Next.js + Prisma + MinIO)
- JWT + RBAC, มอบหมายงาน, นอกสัญญา, พิมพ์รายงาน/PDF, ตั้งค่า SMTP
- Seed จาก Excel/CSV, บทบาท ADMIN / STAFF / SUPERVISOR / USER

---

## ลิงก์ที่เกี่ยวข้อง

- [`README.md`](README.md) — บันทึกอัปเดตล่าสุดแบบขยาย + ดัชนีเอกสาร
- [`STATUS.md`](STATUS.md) — สถานะระบบปัจจุบัน
- [`docs/postmortems/`](docs/postmortems/) — RCA หลังแก้บั๊ก (ไม่แทนที่ changelog)
