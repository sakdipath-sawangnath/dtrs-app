# CCTV Maintenance System (dtrs-app)

ระบบแจ้งปัญหาและระบบจัดการการซ่อมบำรุงกล้องวงจรปิด (CCTV) ซึ่งพัฒนาต่อเนื่องมาจากการใช้งานผ่าน AppSheet

**Production:** [`https://dtrs-app.forth.co.th`](https://dtrs-app.forth.co.th) · API ที่ `/api` · GitLab `FORTH/dtrs-app`

**Changelog + app version:** [`CHANGELOG.md`](CHANGELOG.md) — key changes; commit ที่แตะไฟล์นี้จะถาม SemVer bump (`frontend/package.json`) ผ่าน husky · footer แสดง `vX.Y.Z` จาก package (ไม่ใช่ DB) · ครั้งแรก: `npm install` ที่ root

## บันทึกการอัปเดตล่าสุด (2026-08-18)

- **ปิดงานจากรายการ** — ปุ่ม Sign ใน `JobsList` เมื่อป้าย「รอเซ็นผู้แจ้ง」เปิด dialog ลายเซ็นผู้แจ้ง (`PATCH /jobs/:id/close`) โดยไม่ต้องเข้าหน้ารายละเอียด; สิทธิ์เดิม `job.fix.self|any` — [`TASK.md`](TASK.md) §34 · [`CHANGELOG.md`](CHANGELOG.md)

## บันทึกการอัปเดตล่าสุด (2026-08-17)

- **แยกบันทึกแก้ไข / ปิดงาน** — `PATCH /jobs/:id/fix` คง `IN_PROGRESS`; `PATCH /jobs/:id/close` บังคับลายเซ็นผู้แจ้ง (PNG) → `RESOLVED`; ปิดงานที่ `/dashboard/jobs/:id`; รายการงานมีป้าย「รอเซ็นผู้แจ้ง」เมื่อแก้ครบแล้วยังกำลังแก้ไข — [`TASK.md`](TASK.md) §34 · [`CHANGELOG.md`](CHANGELOG.md)
- **อัปโหลดรูปงาน** — **5MB/ไฟล์** · สูงสุด **3 รูป** ต่อช่อง issue/fix · **JPG/PNG/WebP** (magic bytes) · **HEIC/HEIF → JPEG** ฝั่ง Nest; ลายเซ็นผู้แจ้ง PNG เท่านั้น — สิทธิ์รูปปัญหา **`job.issue.upload`** (`PATCH /jobs/:id/issue-images`) ไม่ผูก `job.fix.*`; งาน **PENDING / IN_PROGRESS**; เติมได้ถึง 3 รูป ไม่ลบ/ไม่แทนที่; UI `/dashboard/jobs/:id` + wrench modal; หน้า public ไม่บังคับรูป; seed **ADMIN** เท่านั้น — [`backend/docs/RBAC-Setup.md`](backend/docs/RBAC-Setup.md)
- **อัปโหลดผ่าน reverse proxy** — แนะนำ `client_max_body_size 50m;` ที่ NPM location `/api/` (ค่าเริ่มต้น nginx ~1MB ได้ **413**) — [`backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md`](backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md). **Fallback ฝั่งแอป:** frontend บีบอัดรูปใน browser เมื่อขนาดรวมใกล้เกิน ~1MB หรือได้ 413 แล้ว retry (`frontend/src/lib/jobImageProxyFallback.ts`) — คุณภาพอาจลด; HEIC ใหญ่เกินงบต้องแปลง JPG เอง

## บันทึกการอัปเดตล่าสุด (2026-08-14)

- **บทบาทที่สร้างเอง (`User.role`)** — คอลัมน์เป็น **`VARCHAR`** เก็บ `AppRole.code` (เช่น `ADMIN_1`); ไม่ใช้ Prisma/MySQL enum อีกต่อไป เพื่อไม่ให้ `GET /users` 500 — ดู [`backend/docs/RBAC-Setup.md`](backend/docs/RBAC-Setup.md)
- **แท็บสัญญา/นอกสัญญา** — มองเห็นเมื่อมีสิทธิ์ **`job.viewContractTabs`** (ตั้งที่ `/dashboard/roles`); ไม่ติ๊ก = เห็นแค่งานในสัญญา ไม่มีแท็บสลับ; คนละตัวกับเมนู sidebar `menu.outOfContract` และปุ่มย้ายนอกสัญญา `job.assign` — หลังเพิ่ม permission ให้ restart backend เพื่อ `ensurePermissionCatalogSynced`

## บันทึกการอัปเดตล่าสุด (2026-08-06)

- **Frontend Light / Dark theme** — สลับโหมดจาก **Sun/Moon** ใน `SiteHeader` (`next-themes`, key `dtrs-theme`, ค่าเริ่มต้น **Dark**); tokens `--glass-*` + utilities ใน `globals.css`; `/print/*` บังคับ light ผ่าน `PrintThemeShell` (ไม่ซ้อน ThemeProvider); contrast ตาราง/ฟิลเตอร์ (JobsList, sites, roles ฯลฯ) — ดู [`CHANGELOG.md`](CHANGELOG.md) · [`frontend/README.md`](frontend/README.md) · [`AGENTS.md`](AGENTS.md)
- **GitLab CI/CD Variables (UAT)** — กลุ่ม A scope **`staging` ✅** + กลุ่ม B **MinIO ✅** (`MINIO_PORT` / `MINIO_PUBLIC_URL` / `MINIO_SERVER_FETCH_BASE_URL` = scope **all**) · **`production` กลุ่ม A = pending** · รายละเอียด: [`docs/GitLab-CI-Variables-Checklist.md`](docs/GitLab-CI-Variables-Checklist.md)
- **โฟกัสถัดไป** — `prisma migrate deploy` (DB UAT) → push **`staging`** → Docker `:2375` บน `.115` → manual **`deploy:uat:docker`** → login / ทดสอบอัปโหลดรูป
- **Migration `cctv-app_ticket` → `dtrs-app`** — ดัชนี: [`docs/DTRS-Migration-Checklist.md`](docs/DTRS-Migration-Checklist.md) · แผน CI: [`docs/GitLab-CI-Plan.md`](docs/GitLab-CI-Plan.md)
- **GitLab CI/CD (UAT + PRD)** — [`.gitlab-ci.yml`](.gitlab-ci.yml): stages `test` → `build` → `deploy` → `deploy_docker` → `cleanup`; branch **`staging`** (UAT `.115`) / **`main`/`master`** (PRD `.128`); stage **`deploy_docker` ทั้งก้อน manual**; **`.deploy_ssh_and_validate`** ตรวจกลุ่ม A ก่อน deploy
- **P0 โค้ด** — Docker/CI/compose ใช้ชื่อ `dtrs-app-*`, host ports **8404/8405**, backend ภายใน container **4100**, deploy path UAT/PRD `/home/nurdin/dtrs-app`
- **Local env** — `backend/.env.example`, `frontend/.env.example`; DB `dtrs_app`, `API_INTERNAL_BASE_URL=http://localhost:4100/api`; npm dev backend `:4100` / frontend `:3000` ผ่านแล้ว
- **MinIO** — Variables บน GitLab ครบแล้ว; ตรวจ bucket ตาม `MINIO_BUCKET_NAME` (UAT ควร **`dtrs-app-uat`**) หลัง deploy · NPM / Variables PRD ยัง **pending**

## บันทึกการอัปเดตล่าสุด (2026-08-05)

- **Migration / CI implement** — ดูบันทึก 2026-08-06 สำหรับสถานะ Variables ล่าสุด; checklist: [`docs/DTRS-Migration-Checklist.md`](docs/DTRS-Migration-Checklist.md)

## บันทึกการอัปเดตล่าสุด (2026-05-13)

- **`shadcn/ui` skill (frontend)** — ติดตั้งที่ `frontend/.agents/skills/shadcn`; ใช้ project context จาก `frontend/components.json` และ workflow `npx shadcn@latest info --json` / `docs` / `search` ก่อนเพิ่มหรือปรับ primitive; โปรเจกต์นี้ยืนยันเป็น **Next.js 15 + Tailwind v4 + base=`base` + style=`base-nova`**
- **UI primitives rollout** — หน้า **`/login`**, **`/public/report`**, **`/public/status`**, **`/dashboard`**, **`/dashboard/settings`**, **`/dashboard/profile`** และ **`/print/jobs/[id]`** เปลี่ยนส่วนควบคุมหลักไปใช้ `@/components/ui/*` ที่มีในโปรเจกต์แล้ว (เช่น `Button`, `Input`, `Label`, `Alert`, `Textarea`)
- **Dialog migration** — `CrudModal` เปลี่ยนเป็น wrapper ของ **`ui/Dialog`**; `JobsList` ย้าย modal รายละเอียด / มอบหมาย / อัปเดตการแก้ไขไปใช้ `Dialog` + `JobImageLightbox`; `alert-dialog` ปรับ overlay/popup เป็น **`z-100`**
- **Loading pattern กลาง** — หน้า **`/public/report`**, **`/public/status`**, **`/dashboard/settings`**, **`/dashboard/users`**, **`/dashboard/roles`** และ **`/dashboard/sites`** ใช้ `PublicRouteLoading` / `DashboardRouteLoading` เป็น pattern กลางเดียวกัน แทน loading implementation ที่กระจายหลายแบบ
- **Footer app metadata** — setting คีย์ `app_meta` สำหรับชื่อระบบ/บริษัท; เวอร์ชันที่ footer มาจาก **`frontend/package.json`** (หรือ `NEXT_PUBLIC_APP_VERSION`) ไม่ทับด้วย DB; `SiteFooter` อ่านชื่อจาก `GET /public/settings/app-meta`
- **Image primitives กลาง** — frontend รวมการแสดงรูปด้วย `ManagedImage`, `ManagedImageFrame` และ preset `MANAGED_IMAGE_SIZES` เพื่อให้ avatar / preview / lightbox ใช้โครงสร้างเดียวกัน; template PDF ยังใช้ `forceRaw` ในจุดที่ต้องคง `<img>` สำหรับการ render
- **Backfill วันที่ + modal polish** — หน้า **`/dashboard/jobs/[id]`** ปรับ card “ลงข้อมูลย้อนหลัง (Backfill วันที่)” ให้กรอกวันที่แบบ **`dd/mm/yyyy`** และ validate ก่อนบันทึกให้สอดคล้องบรรทัด preview “ปฏิทินไทย (พ.ศ.)”; `JobImageLightbox` ปรับขนาดพื้นที่แสดงผลให้รูปเปิดดูได้จริง; backdrop ของ report modal บนหน้า dashboard และปุ่ม `ghost` ใน modal/lightbox ถูกปรับมาตรฐานสี `hover` / `focus` เพื่อไม่ให้ข้อความจมหรือพื้นหลังสว่างผิด theme
- **Frontend build** — ยืนยัน `npm run build` ใน `frontend/` ผ่านหลัง refactor รอบนี้ และ warnings กลุ่ม `<img>` / hooks / unused code ที่ตั้งใจเก็บได้ถูกเคลียร์แล้ว

## บันทึกการอัปเดตล่าสุด (2026-05-12)

- **สคริปต์แก้/ตรวจวันที่แจ้ง (Job `reportDate` / `fixDate`)** — อยู่ใน `backend/scripts/`; ใช้ `DATABASE_URL` จาก `backend/.env`; สรุปคำสั่ง `npm run` ดู [`backend/README.md`](backend/README.md) ส่วน Scripts
- **`.gitignore` (backend)** — ไม่ commit ผล compile ใต้ `scripts/**/*.js|.map|.d.ts` และ `tsconfig.build.tsbuildinfo`
- **รูปแบบแปลงวันที่** — สอดคล้อง backfill ใน `JobsService` (สลับเดือน↔วัน + ปี −1 + เลื่อนเวลา ±10–15 น.); ฟังก์ชัน Bangkok ร่วมอยู่ที่ `backend/scripts/lib/jobBangkokAndCorruptionFix.ts`

## บันทึกการอัปเดตล่าสุด (2026-05-10)

- **Docker / hardening — image** — [`frontend/Dockerfile`](frontend/Dockerfile) (Next.js **`output: standalone`**, รัน `node server.js`, target **`runner`** / **`ci-runner`**) และ [`backend/Dockerfile`](backend/Dockerfile) (`puppeteer-core` + Chromium จาก apt สำหรับ PDF, target **`runner`** / **`ci-runner`**): ใช้ **`COPY --chown=node:node`** + **`USER node`**
- **`docker-compose.yml`** — นอกจาก **limits CPU/RAM** และ **`pids_limit`** แล้ว มี **`tmpfs: /tmp:rw,noexec,nosuid`** ทั้ง **frontend** และ **backend** (ลดความเสี่ยงรัน executable จาก `/tmp` ในแท็บเล็กเมื่อ expose public); ถ้าใช้ `docker run` แยก ให้เพิ่ม `--tmpfs /tmp:rw,noexec,nosuid` และจำกัดทรัพยากรตามนโยบาย (ตัวอย่าง frontend: **`--cpus=.5`**, **`--memory=512m`** คู่ map พอร์ต **8404:3000**)
- **`npm audit` / dependency** — รัน `npm run security:audit` / `security:audit:prod` ใน `frontend/` และ `backend/`; โปรเจกต์ใช้ **`overrides`** ใน [`frontend/package.json`](frontend/package.json) (เช่น `postcss` ให้อยู่ในเวอร์ชันที่ advisory ว่าแก้แล้ว) และ [`backend/package.json`](backend/package.json) (แก้ transitive + สคริปต์ seed/migrate ใช้ **exceljs** แทน `xlsx` ในเครื่อง dev) — รายละเอียดเชิงเทคนิคใน commit / log อย่าวาง credential ใน repo
- **หน้า public ตรวจสอบสถานะ** — [`/public/status`](frontend/src/app/public/status/page.tsx): ค้นตามเบอร์หรือเลขที่ใบ; API **`GET /public/jobs/status-by-phone`** และ **`GET /public/jobs/status/:ticketNo`** คืนฟิลด์ **`cause`** และ **`fixMethod`** (จากผู้ซ่อมเมื่อปิดงาน) — UI แสดงปุ่มดูสาเหตุ/วิธีแก้และการ์ดรายละเอียด

## บันทึกการอัปเดต (2026-05-08)

- **แพ็กเกจเทมเพลตแอปใหม่** — `docs/templates/`: สำเนา [`AGENTS.md`](docs/templates/AGENTS.md), Skill ใน `docs/templates/skills/`, [`frontend_template.md`](docs/templates/frontend_template.md) / [`backend_template.md`](docs/templates/backend_template.md), ดัชนี [`docs/templates/README.md`](docs/templates/README.md) — คัดลอกทั้งโฟลเดอร์ไปใช้กับโปรเจกต์อื่นได้
- **`docker-compose.yml`** — จำกัด CPU/RAM และ `pids_limit` ให้ frontend/backend (ลดความเสี่ยงทรัพยากร host ถูกกินจนเครื่องค้าง); ไม่มี volume mount จาก host ใน service หลัก
- **ตรวจ dependency (npm advisory)** — ใน `frontend/` และ `backend/` มีสคริปต์ `npm run security:audit` และ `security:audit:prod` (ดู [`AGENTS.md`](AGENTS.md))

## บันทึกการอัปเดต (2026-04-02)

- **Serial หลายอุปกรณ์ (งานแก้ไข)** — รองรับได้สูงสุด 4 แถว (ชื่ออุปกรณ์ + S/N เดิม/ใหม่); โหมดหลายแถวเก็บ JSON ใน `Job.oldSerialNumber` (migration คอลัมน์เป็น `TEXT`); รายละเอียด [`docs/Job-Serial-Multi-Row.md`](docs/Job-Serial-Multi-Row.md)
- **MinIO Orphan Manager** — หน้า `/dashboard/settings`: สแกน object ใน bucket ที่ไม่อ้างอิงจาก `Job` / `User` แล้วเลือกลบ (มี retention + ยืนยันก่อนลบ); [`docs/MinIO-Orphan-Cleanup.md`](docs/MinIO-Orphan-Cleanup.md)
- **รายงานพิมพ์** — ส่วน «รายการอุปกรณ์» กับ serial หลายแถวจัด layout ให้หัวข้อกับบรรทัดแรกของรายการไม่ปิดอยู่บรรทัดเดียวกัน
- **รหัสผ่านเริ่มต้น** — `GET /settings/default-pass` คืนค่า `{ passwordSet, password }` ให้หน้าตั้งค่าแสดงรหัสปัจจุบัน (สิทธิ์ `menu.settings` เท่านั้น; อย่า log หรือแชร์ค่าที่ได้)

## บันทึกการอัปเดต (2026-03-30)

- **RBAC คิวงาน (หน้ารอดำเนินการ + API)** — ปุ่ม «มอบหมายงาน» / «ย้ายนอกสัญญา» ใน `JobsList` อิงสิทธิ์ **`job.assign`** จาก `GET /roles/me/permissions` (สอดคล้อง `/dashboard/roles`); `PATCH /jobs/:id/assign` และ `PATCH /jobs/:id/out-of-contract` และการลบงาน `PENDING` ไม่มอบหมายใน `DELETE /jobs/:id` ใช้ **`RolesService.getPermissionsForUser`** ฝั่ง Nest (`JobsModule` import `RolesModule`) — รับงานเองได้เมื่อมี `menu.pending` และเลือกตัวเอง; ทุกครั้งที่มอบหมาย/รับงาน ระบบจะบันทึก `assignedById` เพื่อให้ UI แยก **มอบหมายงาน** vs **รับงานเอง** บนหน้า `/dashboard/jobs/:id`; สรุปเชิงลึกที่ [`backend/docs/RBAC-Setup.md`](backend/docs/RBAC-Setup.md)
- **PermissionsGuard** กับ user ที่ยังไม่มี `roleId` ใช้ map **`RBAC_ROLE_PERMISSION_CODES`** เดียวกับ `RolesService` (รหัสบทบาทมาตรฐาน) — หลัง deploy ให้สตาร์ท backend เพื่อ sync permission ใหม่ หรือรัน `seed-roles-permissions.ts`

## บันทึกการอัปเดต (2026-03-28)

- **พิมพ์รายงานบน PRD** — รูปใน PDF โหลดทาง **`/job-images/:jobId/:kind/:index`** บน Next (ไม่อยู่ใต้ `/api` จึงไม่ต้องแยก NPM location เพิ่ม); **`/api/print-jobs/:id/data`** ยังต้องส่งไป Next; รายละเอียด NPM ดู [`backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md`](backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md)
- **DevTools** — เมื่อ Nest ตอบ error ระหว่าง proxy รูป Next ส่ง **JSON สั้นๆ** ใน response (แทน body ว่าง) เพื่ออ่านในแท็บ Preview; ดู [`frontend/src/lib/jobImageProxy.ts`](frontend/src/lib/jobImageProxy.ts)
- **`GET /api/jobs/:id/image/...`** — ถ้าโหลด object จาก URL ใน DB ไม่สำเร็จ → **502 Bad Gateway** + log `getJobImageBuffer failed ...` (เดิมใช้ 400)
- **`MINIO_SERVER_FETCH_BASE_URL`** — ให้ Nest แปลง URL ที่ขึ้นต้นด้วย **`MINIO_PUBLIC_URL`** ไปโหลดทาง **HTTP ภายใน** (เช่น `http://192.168.0.71:9000`) เมื่อ DNS ภายในชี้โดเมน MinIO ไป IP ที่ไม่มี HTTPS :443 แต่ MinIO รับที่พอร์ต API; ส่งผ่าน GitLab Variable / `.gitlab-ci.yml` → container backend
- **Postman** — อัปเดต [`backend/postman/CCTV-Print-PDF-Debug.postman_collection.json`](backend/postman/CCTV-Print-PDF-Debug.postman_collection.json) + [`backend/postman/PRINT-PDF-DEBUG.md`](backend/postman/PRINT-PDF-DEBUG.md)
- **MinIO private + รูปผ่านสิทธิ์** — ค่าเริ่มต้น **`MINIO_ENSURE_PUBLIC_READ_POLICY=false`** (ไม่ตั้ง public read บน bucket ตอนสตาร์ท); แดชบอร์ดใช้ **`/job-images/...`** กับ **`/user-images/:userId`** บน Next (cookie + JWT → Nest); API **`GET /api/users/:id/avatar`** / **`GET /api/users/me/avatar`**; หน้า public **`/public/users/reporter-by-phone`** ไม่ส่ง `image` URL; รายละเอียด [`docs/Project-Plan-Private-MinIO-Images.md`](docs/Project-Plan-Private-MinIO-Images.md)

## บันทึกการอัปเดต (2026-03-24)

- **อีเมลแจ้งงาน (เทมเพลต + Role)** — เก็บใน `Setting` คีย์ `email_templates`; หน้า **`/dashboard/settings`** (ADMIN): โลโก้, **`publicBaseUrl`** สำหรับลิงก์ในอีเมล, เทมเพลต **แจ้งเหตุ / รับเรื่อง / ปิดงาน** (เปิดปิด, To เพิ่มเติม, CC, **แจ้งตามบทบาท** `notifyRoleIds`); HTML อีเมลโทนสว่าง สถานะเป็น badge — **flow ผู้รับ To/CC เริ่มต้น** ดู [`docs/Email-Notifications.md`](docs/Email-Notifications.md)
- **API:** `GET/PUT /api/settings/email-templates` (JWT + สิทธิ์ **`menu.settings`**)
- **CC อีเมล** — CC มาจากช่องตั้งค่า + บทบาทที่เลือกเท่านั้น (ไม่แทรกผู้รับงานเป็น CC อัตโนมัติเมื่อปิดงาน) — สรุปใน [`docs/Email-Notifications.md`](docs/Email-Notifications.md)
- **Modal แดชบอร์ด (`CrudModal`)** — แสดงด้วย **`createPortal` → `document.body`**, **`z-100`** ให้อยู่เหนือ `SiteHeader`/`sidebar` (`z-50`); โทน **Glass ตาม theme** (Dark/Light); พร็อพ **`size`**: `md` | `lg`; ล็อก scroll `body` ขณะเปิด
- **หน้า `/dashboard/roles`** — modal เพิ่ม/แก้ไขบทบาทและกำหนดสิทธิ์: ฟิลด์ใช้ **`form-input-glass`** (`globals.css`); รายการสิทธิ์ในกล่องแก้ว + checkbox สไตล์ dark
- **RBAC งานซ่อม (แก้ไข/ปิดงาน + Reopen + รูปปัญหา)** — คุมสิทธิ์ผ่าน `/dashboard/roles` ด้วย permission:
  - `job.fix.self` / `job.fix.any`
  - `job.reopen.self` / `job.reopen.any`
  - `job.issue.upload` — อัปโหลดรูปปัญหาที่แจ้ง (`PATCH /jobs/:id/issue-images`); ไม่ใช้ `job.fix.*`; default seed **ADMIN** เท่านั้น

### ย้อนหลัง (2026-03-23)

- **RBAC เมนู (Sidebar)** — `DashboardLayoutShell` ดึง `GET /roles/me/permissions` แล้ว **แกะ `data` ตาม ResponseInterceptor** (`unwrapApiData` ใน `src/lib/apiResponse.ts`); ถ้ากรองตาม permission แล้วไม่มีรายการใน sidebar (เช่น มีแค่ `menu.profile`) จะ **fallback ตามบทบาท**; role ใน session ใช้ **uppercase**; เมนูภาพรวม/กำลังแก้ไข/ประวัติ/นอกสัญญา รวม **SUPERVISOR** ให้สอดคล้อง STAFF
- **Deploy PRD — Next.js** — ใช้ **`next.config.mjs`** แทน `.ts` เพื่อไม่ให้ image production (`npm prune --omit=dev`) ต้องมี `typescript` ตอน `next start`
- **Deploy PRD — NextAuth → Backend** — ตั้ง **`API_INTERNAL_BASE_URL`** (เช่น `http://dtrs-app-backend:4100/api`) ใน container frontend เพื่อให้ `authorize()` เรียก backend ใน Docker network แทน public URL (กัน **ConnectTimeout / hairpin** ไปโดเมน PRD)
- **Deploy PRD — CORS** — GitLab CI ส่ง **`ALLOWED_ORIGINS`** เข้า backend container; ตั้งค่าใน GitLab Variables เป็น origin จริงของเว็บ (คั่นด้วย comma)
- **GitLab CI/CD** — ดูบันทึก **2026-08-05** ด้านบน (UAT+PRD, manual deploy, validate env); รายละเอียดเต็มใน [`docs/GitLab-CI-Plan.md`](docs/GitLab-CI-Plan.md)
- **Docker** — `backend/Dockerfile` + `frontend/Dockerfile` + `docker-compose.yml` (รันทดสอบแยกคอนเทนเนอร์, default target **`runner`**); build frontend local ใช้ `--build-arg NEXT_PUBLIC_API_BASE_URL=...`; **ขนาด image เป้าหมาย** ~250–450 MB (frontend) / ~900 MB–1.0 GB (backend — Chromium ~750 MB สำหรับ PDF); GitLab CI ใช้ **`--target ci-runner`** กับ artifacts จาก `build:frontend` / `build:backend` (`NEXT_PUBLIC_API_BASE_URL` ต้องตั้งตอน `build:frontend`); ก่อน build CI รัน [`scripts/docker-ci-allow-artifacts.sh`](scripts/docker-ci-allow-artifacts.sh) เพื่อให้ `.dockerignore` ไม่ตัด `node_modules`/`dist`/`.next` ออกจาก context; **Phase A gates:** [`scripts/docker-artifact-gate.sh`](scripts/docker-artifact-gate.sh), [`scripts/docker-image-size-gate.sh`](scripts/docker-image-size-gate.sh) (ใน `docker_build:*`), [`scripts/docker-regression-smoke.sh`](scripts/docker-regression-smoke.sh) (`smoke:*:docker` หลัง deploy); local smoke: [`scripts/docker-regression-smoke.ps1`](scripts/docker-regression-smoke.ps1)
- **PDF บน PRD (Puppeteer)** — backend image ต้องมี **Chromium/Chrome** ใน runtime; ใน `JobsPdfService` จะ fallback หา Chrome/Edge ที่ติดตั้งในเครื่อง (ตรวจ env `PUPPETEER_EXECUTABLE_PATH`/`CHROME_BIN` ก่อน) เพื่อกัน error `Could not find Chrome ...` บน production และ local
- **Backend ใน container** — รันด้วย `node dist/src/main.js` (และ `npm run start:prod` ชี้ path เดียวกัน) เพราะ TypeScript ใช้ `module: "nodenext"` ทำให้ผล `nest build` อยู่ใต้ `dist/src/` ไม่ใช่ `dist/main.js` — ถ้า PRD ขึ้น `Cannot find module '/app/dist/main.js'` ให้ตรวจว่า image มาจาก commit ที่แก้ Dockerfile แล้ว และไม่ override `command` เป็น path เก่า
- **ตัวแปร CI (GitLab)** — ใช้ **`FRONTEND_BASE_URL`** เดียวสำหรับลิงก์ Environment, ส่งเข้า container และ `JobsPdfService` (ไม่แยก `FRONTEND_URL_PRD`); รายการตัวแปรอื่นดูคอมเมนต์ใน `.gitlab-ci.yml`
- **Production โดเมนเดียว** — เว็บ **`https://dtrs-app.forth.co.th`** + API ที่ **`/api`**: ตั้ง `NEXT_PUBLIC_API_BASE_URL=https://dtrs-app.forth.co.th/api`, `NEXTAUTH_URL=https://dtrs-app.forth.co.th`, `ALLOWED_ORIGINS=https://dtrs-app.forth.co.th`, `FRONTEND_BASE_URL=https://dtrs-app.forth.co.th` ให้สอดคล้อง origin จริง; reverse proxy ต้องส่งต่อ **`/socket.io`** ไป backend (Socket.IO ไม่อยู่ใต้ `/api`); รายละเอียด path **Nginx Proxy Manager** (แยก `/api/auth`, `/api/print-jobs` → Next **8404**; `/api/` + `/socket.io` → Nest **8405**) ดู `backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md` — รูปหน้าพิมพ์ใช้ **`/job-images/...`** บน Next (ไม่อยู่ใต้ `/api`) จึงไม่ต้องแยก NPM เพิ่ม; ถ้าต้องการ alias ใต้ `/api` ค่อยแยก **`/api/job-images`**
- **MINIO_PUBLIC_URL (ตัวอย่าง)** — เช่น `https://minio-it.forth.co.th` สำหรับ URL รูปที่ browser โหลดได้ (ค่าจริงใส่เฉพาะ `.env` / GitLab Variables)
- **MINIO_SERVER_FETCH_BASE_URL (ถ้าจำเป็น)** — เช่น `http://192.168.0.71:9000` ให้ **Nest โหลดรูปจาก MinIO ภายใน LAN** เมื่อ DNS ภายในชี้ `MINIO_PUBLIC_URL` ไป IP ที่ไม่มี HTTPS :443 แต่ MinIO รับที่ :9000 (แก้ 502 ที่ `/jobs/.../image/...` บน PRD)
- **Git** — `.gitignore` ที่ root กำหนดขอบเขตขึ้น repo: `backend/`, `frontend/`, `docs/`, `README.md`, `minio.md`, `PLAN.md`, `TASK.md`, `STATUS.md`, `AGENTS.md`, `AGENT_INSTRUCTIONS.md`, `.gitlab-ci.yml`, `docker-compose.yml`, `.dockerignore`, `docker/`
- **Frontend `npm run build`** — `src/lib/apiResponse.ts` รวม **`unwrapApiData`** (แกะ `{ data }` จาก backend) + ฟังก์ชันช่วย assignable/error; หน้า **`/public/report`**: ห่อ `useSearchParams` ด้วย `<Suspense>` ตาม Next.js 15

### ย้อนหลัง (2026-03-22)

- **ตั้งค่าอีเมล (SMTP) — ใช้งานจริง**
  - Backend: โมดูล `SettingsModule` + **nodemailer**; เก็บค่าในตาราง `Setting` คีย์ `email_smtp` (รหัสผ่านไม่ส่งคืนใน GET)
  - API (ADMIN + JWT): `GET/PUT /api/settings/email-smtp`, `POST /api/settings/email-smtp/test`
  - รองรับ **TLS**: ฟิลด์ `tlsRejectUnauthorized` และ env `SMTP_TLS_REJECT_UNAUTHORIZED=false` สำหรับ SMTP ภายใน / self-signed
  - Frontend: หน้า `/dashboard/settings` — โหลด/บันทึก/ทดสอบส่งอีเมล; **โครง layout เนื้อหาแบบเดียวกับหน้าภาพรวม** (`/dashboard`) ไม่ใช้ `DashboardPageShell` เป็นห่อหลัก
- **งานปิดแล้ว (Reopen) + RBAC (อัปเดต)**
  - `PATCH /api/jobs/:id/reopen`: คุมสิทธิ์ผ่าน RBAC — `job.reopen.any` ทำได้ทุกงาน, `job.reopen.self` ทำได้เฉพาะผู้รับงาน; สถานะ **เสร็จสิ้น → กำลังแก้ไข**, บันทึกเหตุผลต่อท้าย `fixNote`, ล้าง `fixDate`; มี **ยืนยัน** (SweetAlert) ก่อนเรียก API
  - `PATCH /api/jobs/:id/fix`: คุมสิทธิ์ผ่าน RBAC — `job.fix.any` ทำได้ทุกงาน, `job.fix.self` ทำได้เฉพาะผู้รับงาน; บันทึกการแก้ไขคง `IN_PROGRESS`; ถ้างานเป็น `RESOLVED` ต้อง Reopen ก่อน
  - `PATCH /api/jobs/:id/close`: ปิดงานด้วยลายเซ็นผู้แจ้ง (สิทธิ์เดียวกับ `/fix`) → `RESOLVED`
- **เครื่องมือพัฒนา Backend**: อัปเกรด `@nestjs/cli` เป็น **v11** ให้สอดคล้อง Nest 11 + TypeScript 5.7 (แก้ error watch mode `Cannot read properties of undefined (reading 'paths')`)
- **UI รายการงาน**: แท็บ **สัญญา / นอกสัญญา** — เอา **card/glass ห่อชั้นนอก**ออก เหลือเฉพาะกล่องควบคุมใน `SegmentedTabs`

รายละเอียดเชิงลึกและตาราง API อัปเดตใน `STATUS.md`, `TASK.md`, `PLAN.md`

### ดัชนีเอกสารหลัก

| เอกสาร | เนื้อหา |
|--------|---------|
| [`STATUS.md`](STATUS.md) | สถานะระบบและสรุป API |
| [`PLAN.md`](PLAN.md), [`TASK.md`](TASK.md) | แผนและงาน |
| [`docs/README.md`](docs/README.md) | ดัชนีโฟลเดอร์ `docs/` |
| [`docs/System-Workflow.md`](docs/System-Workflow.md) | Flow chart / System workflow (mermaid) |
| [`docs/Meeting-11082026-Requirements-Plan.plan.md`](docs/Meeting-11082026-Requirements-Plan.plan.md) | แผน requirements Meeting-11082026 (Phase A–E ✅ · Reports เลื่อน · จำแนก Doc No) |
| [`docs/Locations-Master-Seed.md`](docs/Locations-Master-Seed.md) | Seed จังหวัด/อำเภอ/ตำบล จาก dump MS SQL → MySQL |
| [`docs/Sites-Import.md`](docs/Sites-Import.md) | Seed Site จาก `Sites.xlsx` (agency + station) — local ✅ 198 แถว |
| [`docs/DTRS-Migration-Checklist.md`](docs/DTRS-Migration-Checklist.md) | Checklist ย้ายจาก `cctv-app_ticket` |
| [`docs/GitLab-CI-Plan.md`](docs/GitLab-CI-Plan.md) | แผน + implement GitLab CI (UAT+PRD) |
| [`docs/GitLab-CI-Variables-Checklist.md`](docs/GitLab-CI-Variables-Checklist.md) | Checklist ตั้ง GitLab CI/CD Variables |
| [`docs/templates/README.md`](docs/templates/README.md) | เทมเพลตแอปใหม่ — AGENTS + Skills + checklist (คัดลอกทั้งโฟลเดอร์ได้) |
| [`docs/Project-Plan-Private-MinIO-Images.md`](docs/Project-Plan-Private-MinIO-Images.md) | Private MinIO + proxy รูป + checklist QA |
| [`docs/minio.md`](docs/minio.md) | ตัวแปร MinIO และหมายเหตุ bucket (GitLab กลุ่ม B ✅) |
| [`docs/Email-Notifications.md`](docs/Email-Notifications.md) | Flow อีเมลแจ้งงาน |
| [`docs/CSV-vs-System-Mapping.md`](docs/CSV-vs-System-Mapping.md) | เทียบ CSV กับ schema |
| [`backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md`](backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md) | Nginx Proxy Manager / path |
| [`backend/docs/RBAC-Setup.md`](backend/docs/RBAC-Setup.md) | RBAC |

---

## 🛠️ Tech Stack

ระบบถูกแบ่งออกเป็น 2 ส่วนหลัก เพื่อการทำงานที่มีประสิทธิภาพและรองรับการขยายตัวในอนาคต:

### 1. Frontend (Next.js 15)
- **Framework:** Next.js (App Router)
- **UI & Styling:** Tailwind CSS, Lucide React, Google Font (Sarabun), **next-themes**
- **Design System / Primitive Library:** `shadcn/ui` (base) + local wrappers ใน `frontend/src/components/ui/`
- **Standard Theme:** **Glassmorphism** — ค่าเริ่มต้น **Dark** + สลับ **Light** จาก `SiteHeader` (`storageKey`: `dtrs-theme`); tokens `--glass-*` ใน `globals.css`; `/print/*` บังคับ light
- **Layout Architecture:** **No-Card Layout** (แยกส่วน Content เป็น Glass Cards ย่อยๆ แทนการใช้ขอบขาวขนาดใหญ่)
- **Components:** Unified Layout with `SiteHeader` (fixed + **ThemeToggle**), `SiteFooter`, `PublicLayoutShell`, `DashboardPageShell`, `DashboardFilterBar`, `CrudModal` (ภายในใช้ `ui/Dialog`), `UserMenuDropdown`, `SegmentedTabs` (แท็บสัญญา/นอกสัญญา + badge จำนวนงานค้าง), `JobsList` (ตารางงาน + modal รายละเอียด/มอบหมาย/อัปเดตผ่าน `Dialog` + `JobImageLightbox`)
- **Shared UI Utilities:** `DashboardRouteLoading`, `PublicRouteLoading`, `ManagedImage`, `ManagedImageFrame`, `JobImageLightbox`, `PrintThemeShell`, `MANAGED_IMAGE_SIZES`
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

- **CRITICAL SAFETY RULES** — อ่านส่วนนี้ใน [`AGENTS.md`](AGENTS.md) ก่อน (ลำดับความสำคัญสูงสุด: ขอบเขต workspace, โปรโตคอลก่อนลบ, ห้ามคำสั่งทำลาย/recursive, git safety)
- อ่าน `AGENT_INSTRUCTIONS.md` ก่อนเริ่มงาน (มี bootstrap + security gate)
- ใช้ checklist/Definition of Done ใน `AGENTS.md` เป็นเกณฑ์ก่อนส่งงาน
- งาน UI/UX ให้ยึด `frontend/.agents/skills/ui-ux-pro-max/SKILL.md`
- งานที่ใช้ `shadcn/ui` / `@/components/ui/*` ให้ยึด `frontend/.agents/skills/shadcn/SKILL.md`
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
3. คัดลอก env และตั้งค่า (ครั้งแรก):
   ```bash
   copy .env.example .env
   ```
   แก้ `DATABASE_URL` → DB **`dtrs_app`**, `MINIO_BUCKET_NAME` → **`dtrs-app`**, secrets อื่นตาม [`../docs/DTRS-Migration-Checklist.md`](../docs/DTRS-Migration-Checklist.md)
4. รัน Generate Prisma Client (ระบบเชื่อมต่อ MySQL database `dtrs_app` จาก `.env`):
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. เริ่มต้นเซิร์ฟเวอร์ Backend:
   ```bash
   npm run start:dev
   ```
   *เซิร์ฟเวอร์จะรันที่พอร์ต `http://localhost:4100/api`*

### 2. การตั้งค่า Frontend (Next.js)

1. เข้าไปยังโฟลเดอร์ `frontend`:
   ```bash
   cd frontend
   ```
2. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
3. คัดลอก env (ครั้งแรก):
   ```bash
   copy .env.example .env.local
   ```
   ค่า dev แนะนำ: `NEXT_PUBLIC_API_BASE_URL=http://localhost:4100/api`, `NEXTAUTH_URL=http://localhost:3000`, `API_INTERNAL_BASE_URL=http://localhost:4100/api` (ดู `.env.example`)
4. เริ่มต้นเซิร์ฟเวอร์ Frontend:
   ```bash
   npm run dev
   ```
   *หน้าเว็บจะรันที่พอร์ต `http://localhost:3000`*

---

## 📂 โครงสร้างและหน้าจอการใช้งาน

1. **หน้าแจ้งซ่อมออนไลน์ (Public Report):** `http://localhost:3000/public/report`
   - สำหรับบุคคลทั่วไป แจ้งปัญหาได้ทันทีโดยไม่ต้องเข้าสู่ระบบ (การ์ด: ผู้แจ้ง → สถานที่ → รายละเอียดปัญหา → รูปภาพ)
   - **ผู้ใช้ทั่วไป (ไม่ล็อกอิน):** กรอกเบอร์โทรศัพท์ 10 หลัก แล้วกด **ตรวจสอบ** ให้พบผู้แจ้งในระบบก่อน — หลังนั้นจึงเลือกสถานที่และส่งฟอร์มได้
   - **เจ้าหน้าที่ที่ล็อกอิน** (บทบาท STAFF / ADMIN / SUPERVISOR): ใช้ flow แยก — โหลดรายการสถานที่ได้ทันที, กรอกเบอร์ 10 หลักแล้วดำเนินการต่อได้โดยไม่บังคับพบจากระบบ (ระบุชื่อ-สกุลเองเมื่อไม่พบ), ส่งคำขอพร้อม **Bearer token** ได้, หลังสำเร็จ redirect ไป **`/dashboard/jobs`**
   - เมื่อส่งฟอร์มแล้ว ระบบจะสร้าง **เลขที่ใบแจ้งซ่อม (ticketNo)** อัตโนมัติ แสดงเลขนี้ใน Toast — ผู้ใช้ทั่วไปจะไปหน้า `/public/status?ticketNo=...` (เส้นทางเดิม `/status` redirect ได้)
   - รูปภาพข้อขัดข้องถูกอัปโหลดขึ้น **MinIO** ผ่าน `MinioService` และเก็บ URL ไว้ในฟิลด์ `Job.images`
   - เมื่อ staff ล็อกอินแล้วเข้า `/report` จะ redirect/ใช้งาน flow เดียวกับ `/public/report` ภายใต้ layout แดชบอร์ด; primitive หลักของฟอร์มถูกย้ายไปใช้ `@/components/ui/*`
2. **ตรวจสอบสถานะ (public):** `http://localhost:3000/public/status` — ตามเบอร์โทร (`?phone=`) หรือเลขที่ใบ (`?ticketNo=`); เส้นทางเดิม `/status` redirect ไปที่นี่
   - กรอกเลขที่ใบแจ้งซ่อม (ทั้งจากข้อมูลเดิมใน CSV และงานใหม่) เพื่อดูสถานะและรายละเอียด (โหมดสาธารณะมีมาสก์ข้อมูลส่วนตัว/รูปตามที่ API ส่งมา)
   - รายการตามเบอร์และรายละเอียดเมื่อได้ JWT มีการแสดง **สาเหตุ** (`cause`) และ **วิธีแก้ไข** (`fixMethod`) เมื่อมีการบันทึกจากผู้ซ่อม
   - รองรับ query string `?ticketNo=...` เมื่อมาจากหน้า `/report` ช่องค้นหาจะถูกกรอกอัตโนมัติและค้นหาให้ทันที
3. **หน้าเข้าสู่ระบบ (Staff Login):** `http://localhost:3000/login`
   - สำหรับเจ้าหน้าที่/ผู้ดูแล (กรอกอีเมลหรือชื่อผู้ใช้ + รหัสผ่าน); การ์ดจัดกลาง และใช้ primitive `Button` / `Input` / `Label` / `Alert`
4. **ระบบจัดการแดชบอร์ด (Dashboard):** `http://localhost:3000/dashboard`
   - ภาพรวม (สถิติ, กราฟสัดส่วน/จังหวัด/แนวโน้มรายวัน, เมนูด่วนตาม RBAC)
   - รอดำเนินการ (ปุ่ม ดูรายละเอียด → ไปหน้า `/dashboard/jobs/:id` / **มอบหมายงาน** และ **ย้ายนอกสัญญา** ตามสิทธิ์ **`job.assign`** จาก RBAC; **รับงาน** = assign เป็นตัวเองเมื่อมี `menu.pending` แต่ไม่มี `job.assign`; **ลบงาน** เมื่อมี **`job.deleteUnassigned`**; ย้ายนอกสัญญาคงสถานะ `PENDING`)
  - รายละเอียดงาน (`/dashboard/jobs/:id`): card **รูปภาพปัญหาที่แจ้ง** อัปโหลดเพิ่มได้เมื่อมี **`job.issue.upload`** และงาน `PENDING`/`IN_PROGRESS` (เติมถึง 3 รูป); พิมพ์รายงานได้เมื่องานมีสถานะเสร็จสิ้น (Resolved) ผ่านหน้า **`/print/jobs/:id`** (เทมเพลต `JobMaintenancePdfTemplate` + `print.css`; พิมพ์จากเบราว์เซอร์); card **Backfill วันที่** ใช้รูปแบบวันที่ **`dd/mm/yyyy`** พร้อม preview ปฏิทินไทย (พ.ศ.) และรูปในงานเปิดดูผ่าน `JobImageLightbox`
   - **งานที่รับผิดชอบ** — รายการงานที่รับมอบหมาย (filter + datatable)
   - กำลังแก้ไข (`/dashboard/in-progress`): แท็บสัญญา/นอกสัญญาเมื่อมี **`job.viewContractTabs`** + badge งานค้าง; ปุ่มอัปเดต (ผู้รับผิดชอบ); ปุ่มลบงาน IN_PROGRESS ตามสิทธิ์ **`job.deleteInProgress`** (UI `JobsList` + API `DELETE /jobs/:id`); ข้อขัดข้องทั้งหมด, นอกสัญญา (แสดงเฉพาะ PENDING ที่ `isOutOfContract=true`)
   - จัดการผู้ใช้ (สิทธิ์ **`menu.users`**: CRUD; เลือกบทบาทจาก `AppRole` รวมที่สร้างเอง) — คลิกรูปโปรไฟล์ในตารางเปิด modal ดูรูปขนาดใหญ่
  - จัดการบทบาทและสิทธิ์ (ADMIN), **ตั้งค่าระบบ** (`/dashboard/settings`, ADMIN) — กำหนด SMTP, ทดสอบส่งอีเมล, ตัวเลือก TLS, เทมเพลตอีเมลแจ้งงาน (รวม `publicBaseUrl`, แจ้งตาม Role), รหัสผ่านเริ่มต้น, ข้อมูล Footer (`appName` / `companyName` / `version`), **สแกน/ลบไฟล์ MinIO ค้าง**; ค่าที่แสดงใน `SiteFooter` ใช้ fallback **DB → env → `package.json`**; สรุป flow การส่งอีเมล: [`docs/Email-Notifications.md`](docs/Email-Notifications.md) · orphan: [`docs/MinIO-Orphan-Cleanup.md`](docs/MinIO-Orphan-Cleanup.md)
   - โปรไฟล์เข้าได้จากเมนูผู้ใช้ (dropdown) ไม่แสดงใน sidebar
