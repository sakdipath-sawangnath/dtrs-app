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

## [0.7.0] - 2026-09-09

### Added

- GlitchTip performance traces: sample rate ตาม env (staging 1 / production 0.1 / local 0) override ได้ด้วย `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` ตอน `build:frontend`

---

## [0.6.1] - 2026-09-08

### Fixed

- GitLab `build:frontend`: artifact ส่งเฉพาะ `.next/standalone` + `.next/static` + `public` (ไม่ส่ง webpack cache) เพื่อไม่ให้ upload โดน 413

---

## [0.6.0] - 2026-09-08

### Added

- Next.js ส่ง error เข้า GlitchTip ผ่าน same-origin `/monitoring` (ผู้ใช้นอก LAN ไม่ต้องเข้า ingest ในวงภายใน); หน้าทดสอบ `/debug/glitchtip` เปิดเฉพาะนอก production และต้องล็อกอินแดชบอร์ด

### Security

- `/monitoring` forward เฉพาะ envelope ที่โปรเจกต์และ public key ตรง DSN ของ env, จำกัดขนาด 1MB, และตอบ 503 ถ้ายังไม่ตั้ง DSN

---

## [0.5.1] - 2026-09-08

### Changed

- รายงาน PDF (`/print/jobs/:id`): ป้ายลายเซ็น「ผู้ดำเนินการ」→「ผู้เข้าดำเนินการ」ให้ตรงกับช่องข้อมูลด้านบน

---

## [0.5.0] - 2026-09-07

### Added

- เมนู **คู่มือระบบ** (`/dashboard/user-guide`, สิทธิ์ `menu.userGuide`) — สรุป workflow งานแจ้งซ่อมและความหมาย permission สำหรับแอดมิน พร้อมลิงก์ไปจัดการบทบาท/ตั้งค่าระบบ (default ADMIN)
- หน้าคู่มือระบบ: แท็บ **ผู้แจ้งปัญหา / เจ้าหน้าที่ / ผู้ดูแลระบบ** — ขั้นตอน end user, checklist ช่าง, ตารางสถานะงาน, FAQ และส่วน RBAC เดิม
- คู่มือระบบ (แท็บผู้ดูแล): ส่วน **Master Site / พื้นที่** — อธิบาย `menu.locations` vs `location.create` แยกจาก `site.*` ในตารางสิทธิ์

### Fixed

- หน้าภาพรวม (`/dashboard`): แสดง skeleton สรุป KPI/กราฟจนโหลด permissions เสร็จ — กัน KPI fail-open (ผู้ไม่มี `job.viewContractTabs`) และ fail-closed (ผู้มีสิทธิ์) ชั่วคราว; การ์ดนอกสัญญายังซ่อนจนโหลดเสร็จ
- หน้า `/dashboard/locations`: ซ่อนปุ่มเพิ่มจังหวัด/อำเภอ/ตำบล จนกว่าโหลด permissions เสร็จ และแสดงเฉพาะเมื่อมี **`location.create`** (แยกจาก `site.create`; `menu.locations` = เข้าดูหน้าเท่านั้น)
- **`JobsList`** (`/dashboard/my-jobs`, `/dashboard/all`, `/dashboard/in-progress`): ซ่อนแท็บทั้งหมด/สัญญา/นอกสัญญา จนกว่าโหลด permissions เสร็จ — แสดงเฉพาะเมื่อมี `job.viewContractTabs` (ไม่ fallback ตาม JWT role ตอน loading); ปุ่ม action อื่นใน `JobsList` (`job.assign`, `job.fix.*`, `job.delete*`) ใช้ pattern เดียวกัน
- ปุ่มตาแสดง/ซ่อนรหัสผ่าน (Default Pass ใน Settings, หน้า Login, Profile): remount input เมื่อสลับ type เพราะ Base UI Input ไม่อัปเดต attribute `type` บน DOM ทำให้ยังเห็นเป็นจุดแม้ state เป็น text

### Changed

- สิทธิ์ใหม่ **`location.create`** — ปุ่มเพิ่มจังหวัด/อำเภอ/ตำบล และ `POST /locations/*` ใช้ key นี้แทน `site.create` (ดู master ด้วย `menu.locations` อย่างเดียวได้โดยไม่มีปุ่มสร้าง); บทบาทกำหนดเองที่เคยพึ่ง `site.create` ต้องติ๊ก `location.create` ที่ `/dashboard/roles`; หลัง deploy restart backend หรือรัน seed
- **`RBAC-Setup.md` / `api-endpoints.json` / คู่มือระบบ:** สอดคล้อง `location.create` และ pattern ซ่อน UI จนโหลด permissions
- หน้าจัดการ Site (`/dashboard/sites`): ตัวกรองสรุปจังหวัด/อำเภอจากบัตรใหญ่เป็น chip แบบเดียวกับ `/dashboard/all` (แสดงทุกจังหวัด ไม่จำกัด 12 อันดับ; เลือก「ทั้งหมด」เพื่อล้าง)
- Modal เพิ่ม/แก้ Site (`/dashboard/sites`): จังหวัด–อำเภอ–ตำบล ใช้ **`react-select`** ค้นหาได้ (glass theme + portal ใน modal) แทน native `<select>`
- ตัวกรองจังหวัด/อำเภอ และ modal เพิ่มอำเภอ/ตำบล บน `/dashboard/locations` + ตัวกรองจังหวัด/อำเภอบน `/dashboard/sites` ใช้ **`react-select`** แบบเดียวกัน (ค้นหาได้, glass theme)
- **`DataTablePageSizeSelect`** (จำนวนแถวต่อหน้า): ใช้ **`react-select`** แทน native `<select>` — ใช้ใน `JobsList`, `/dashboard/users`, `/dashboard/sites`, `/public/status`
- **`GlassReactSelect`**: component ร่วมสำหรับ dropdown แบบ glass (theme + portal) — ตัวกรอง `JobsList` (สถานะ/ประเภท/จังหวัด/อำเภอ/ผู้รับงาน/เรียงลำดับ), `/dashboard/users` (กรองบทบาท·สถานะล็อก + บทบาทในฟอร์ม), `/dashboard/settings` (SMTP secure, อายุ orphan cleanup) แทน native `<select>` ที่เหลือ
- ลบ modal master จังหวัด/อำเภอที่ไม่ได้ใช้บน `/dashboard/sites` (จัดการ master ที่ `/dashboard/locations` เท่านั้น)
- แท็บขอบเขตสัญญาในรายการงาน (`/dashboard/all`, `my-jobs`, `in-progress`): เพิ่ม「ทั้งหมด」ซ้ายสุด (default ยังเป็น「สัญญา」) — ใช้สิทธิ์ `job.viewContractTabs` เดิม; แท็บทั้งหมด/นอกสัญญารวมงานนอกสัญญาที่จำแนกแล้ว (คิวย่อเมนูนอกสัญญายังจำกัด `PENDING` + RESOLVED ที่จำแนก — แท็บประวัติเป็น **superset** ได้) + ป้าย สัญญา/นอกสัญญา ในแถวเมื่อแท็บทั้งหมด; badge เป็นผลรวมงานค้าง

---

## [0.4.0] - 2026-09-04

### Removed

- หน้า public (`/public/report`, `/public/status`): ลบ watermark ไอคอน CCTV บนพื้นหลัง
- หน้าภาพรวม (`/dashboard`): ลบ section แนวทางขยายวิเคราะห์ในอนาคต และ card placeholder «เร็วๆ นี้»

### Changed

- หน้าภาพรวม: แถบช่วงสรุปเป็น glass-card มี padding คงที่ทุก breakpoint; select ใช้ padding ที่ทับ `.form-input-glass`
- Doc No ในสัญญา: `CM-SHF-YYYY-XXXX` (YYYY = ปี Asia/Bangkok ณ วันจำแนก; running ไม่รีเซ็ต) แทน `CM-SHF-2002-XXXX` — เลขเก่า `CM-SHF-2002-…` ยังถือว่าเป็นเลขทางการ

### Fixed

- หน้าภาพรวม (`/dashboard`): การ์ดสรุป / กราฟ / สรุปวิเคราะห์นับเฉพาะงานในสัญญาเมื่อไม่มี `job.viewContractTabs` (สอดคล้อง `JobsList`) และซ่อน card «นอกสัญญา · ยังไม่ปิด»
- `GET /jobs/reports/summary-pdf`: กรองงานนอกสัญญาและซ่อน KPI นอกสัญญาเมื่อผู้ใช้ไม่มี `job.viewContractTabs` (สอดคล้องหน้าภาพรวม)

---

## [0.3.3] - 2026-09-04

### Changed

- CSV ส่งออกจากรายการงาน: ไม่รวมคอลัมน์「หัวข้อ」;「หมายเหตุการซ่อม」ตัด `[Reopen …]`; คอลัมน์ S/N แตกหลายอุปกรณ์เป็นข้อความอ่านง่าย +「จำนวนอุปกรณ์」/「รายการ_S/N」(ไม่ส่ง raw JSON `v:1`)
- หน้าประวัติทั้งหมด (`/dashboard/all`): ตัวกรองการ์ดสถานะ/ประเภทสถานที่/ประเภทงาน เป็น chip/pill (จุดสี + ตัวนับ) — scroll แนวนอนบนมือถือ, wrap บน tablet/desktop; ปรับ spacing/padding ของ chip · แถบค้นหา · dropdown ให้มีจังหวะหายใจและ responsive grid; แก้ dropdown ล้นกรอบจาก min-content ของ native `<select>` + flex wrapper

---

## [0.3.2] - 2026-09-04

### Changed

- รายงาน PDF (`/print/jobs/:id`): ขยายลายเซ็นผู้ดำเนินการ / ผู้แจ้งให้ใหญ่ขึ้นเล็กน้อย
- รายงาน PDF: ย่อโลโก้ FORTH และชิดขอบขวาให้ตรงขอบตาราง (ไม่ล้นออกนอกกรอบ)
- รายงาน PDF: ป้าย「ชื่อผู้แจ้ง」→「ชื่อผู้แจ้งเหตุขัดข้อง」

### Fixed

- รายงาน PDF (`/print/jobs/:id`): ไม่แสดง audit `[Reopen …]` ในช่องวิธีแก้ไข ทั้งทั้งบรรทัดและกลางบรรทัด (ยังเก็บใน `fixNote` สำหรับหน้าแก้ไขงาน)

---

## [0.3.1] - 2026-08-18

### Fixed

- หน้าจัดการผู้ใช้: ปุ่มเพิ่ม/แก้ไข/ลบอิงสิทธิ์ `menu.users` แทนการจำกัดเฉพาะรหัสบทบาท `ADMIN` — บทบาทที่สร้างเอง (เช่น `ADMIN_1`) ที่ได้เมนูนี้จัดการผู้ใช้ได้ตาม API; รายการบทบาทในฟอร์มใช้ `/roles/public-styles` ไม่บังคับ `menu.roles`

---

## [0.3.0] - 2026-08-18

### Added

- Dropdown โปรไฟล์แสดง Role ของผู้ใช้ที่ล็อกอิน (เช่น `Role: Admin`) เพื่อรู้บทบาทปัจจุบันโดยไม่ต้องเข้าหน้าโปรไฟล์
- ปุ่มไอคอนเซ็นปิดงาน (`FileSignature`) ใน `JobsList` เมื่อป้าย「รอเซ็นผู้แจ้ง」— เปิด dialog ลายเซ็นผู้แจ้งจากรายการโดยไม่ต้องเข้าหน้ารายละเอียด (สิทธิ์เดิม `job.fix.self|any`; ปุ่มประแจยังจำกัดเฉพาะผู้รับงาน)
- จำแนกเอกสารแยกสิทธิ์ปุ่มในสัญญา / นอกสัญญา: `job.classifyDoc.contract` และ `job.classifyDoc.outOfContract` (ประตูเดิม `job.classifyDoc`); บทบาทที่มี `job.classifyDoc` ได้ทั้งสอง key รอบแรกที่แคตตาล็อกเพิ่มลูก (และตอน seed) — ติ๊กออกที่ `/dashboard/roles` แล้ว restart ไม่คืนสิทธิ์

### Changed

- Modal ประแจ: ปุ่มบันทึกแล้วปิดงานเปิด dialog เซ็นในรายการ แทนการพาไปหน้ารายละเอียด

### Fixed

- จำแนกเอกสาร: inherit สิทธิ์ลูกให้บทบาทที่มี `job.classifyDoc` แม้รัน seed ก่อนสตาร์ท backend (หรือแคตตาล็อกสร้างแถว Permission แล้วยังไม่มี RolePermission ของลูก)

---

## [0.2.0] - 2026-08-17

### Added

- ปิดงานแยกขั้นตอน: `PATCH /jobs/:id/close` (ลายเซ็นผู้แจ้ง → `RESOLVED`) — บันทึกการแก้ไขใช้ `PATCH /jobs/:id/fix` คง `IN_PROGRESS`; ปิดงานได้ที่ `/dashboard/jobs/:id` เท่านั้น
- ป้าย「รอเซ็นผู้แจ้ง」ในคอลัมน์สถานะของรายการงาน เมื่อ `IN_PROGRESS` และข้อมูลแก้ไขครบแล้ว (ไม่เพิ่มสถานะใหม่)
- อัปโหลดรูปงาน: fallback ฝั่ง browser เมื่อ reverse proxy จำกัด body (~1MB) — บีบอัดรูปอัตโนมัติหรือ retry หลัง HTTP 413 (degraded quality; HEIC ใหญ่เกินงบต้องแปลงเป็น JPG เอง)

### Fixed

- Lightbox ดูรูปใน Modal: light mode ใช้ตัวอักษร/ปุ่มสีขาวบนพื้นดำ (ไม่ใช้ `glass-text` ที่บังคับสีเข้ม)
- Modal ประแจ: ปุ่มไปปิดงานบันทึก `PATCH /jobs/:id/fix` สำเร็จก่อนแล้วค่อยไปหน้ารายละเอียด (กันข้อมูลที่กรอกหาย)
- ปิดงาน: ตรวจว่าข้อมูลแก้ไขครบก่อนอัปโหลดลายเซ็นผู้แจ้ง; ถ้าบันทึกแก้ไขผ่านแต่ปิดงานล้ม แจ้งว่าข้อมูลถูกบันทึกแล้ว
- Modal อัปเดตงาน / หน้ารายละเอียด: เลือกไฟล์รูปปัญหาแล้วเห็น preview และกดอัปโหลดได้
- อัปโหลดรูปงาน: HEIC/HEIF ที่แปลงไม่ได้คืน **400** ข้อความไทยแทน 500
- อัปโหลดรูปงาน: ไฟล์เกิน 5MB หรือเกิน 3 รูป คืน **400** ข้อความไทย (ไม่ใช้ 413 / `Unexpected field` จาก Multer)
- `GET /users`: รองรับบทบาทที่สร้างเอง (เช่น `ADMIN_1`) — เปลี่ยน `User.role` จาก MySQL/Prisma enum เป็น `VARCHAR` ให้เก็บ `AppRole.code` ได้โดยไม่ 500
- Public report: หลังแจ้งสำเร็จพาไป `/public/status` ด้วยเบอร์ (และแสดงเลข hex เมื่อมี)
- ปิดงาน: ปฏิเสธการตั้ง `RESOLVED` ผ่าน `PATCH /jobs/:id/status` — ต้องใช้ `PATCH /jobs/:id/close` พร้อมลายเซ็นผู้แจ้ง (หลังบันทึกการแก้ไขครบ)
- จำแนกเอกสารบนหน้ารายละเอียด: ถือว่าสำเร็จเมื่อเลขทางการโชว์แล้ว (รีโหลดเงียบ); toast error ใช้ข้อความจาก API; ป้ายโซนเป็น «หลังปิดงาน»

### Security

- Public report: จำกัดช่องอาการที่พบสูงสุด **500 ตัวอักษร** ทั้ง UI (`maxLength` + ตัวนับ) และ API (`CreateJobSchema`) — คอลัมน์ `Job.description` ยังเป็น TEXT
- อัปโหลดรูปงาน (public report, issue-images, fix, reporterAvatar): จำกัด **5MB/ไฟล์** · allowlist **JPG/PNG/WebP** (magic bytes) · **HEIC/HEIF แปลงเป็น JPEG ฝั่ง backend** · สูงสุด **3 รูป** ต่อช่อง issue/fix; ลายเซ็นผู้แจ้ง PNG เท่านั้น
- `GET /users/:id/signature`: จำกัดเฉพาะตัวเอง / `menu.users` / สิทธิ์เมนูงานหรือปิดงาน (บล็อกผู้แจ้งดึงลายเซ็นเจ้าหน้าที่คนอื่น)
- `PATCH /jobs/:id/issue-images`: ต้องมีสิทธิ์ **`job.issue.upload`** (ไม่ใช้ `job.fix.*`) และงานต้องเป็น PENDING หรือ IN_PROGRESS

### Changed

- PDF รายงาน CM (SHF): ปรับ `JobMaintenancePdfTemplate` ให้ตรงเทมเพลต CM.pdf — หัวโครงการ SHF + โลโก้ NBTC/FORTH ทั้ง 2 หน้า, ตารางข้อมูล 5 แถว (ชื่อสถานี/ตำบล), ลายเซ็นหน้า 1, caption ใต้รูปเป็น `1.รูปภาพข้อขัดข้อง` / `2.รูปภาพการแก้ไข` ทุกคู่; ค่าคงที่ใน `reportPdfConstants.ts`
- บันทึก/ปิดงาน: แยก `PATCH /jobs/:id/fix` (บันทึกการแก้ไข คง `IN_PROGRESS`) กับ `PATCH /jobs/:id/close` (ลายเซ็นผู้แจ้ง → `RESOLVED`); modal ประแจบันทึกอย่างเดียว — ปิดงานที่หน้ารายละเอียดงาน
- `/dashboard/pending`: เอาปุ่ม «ย้ายนอกสัญญา» ออกจากคอลัมน์จัดการ (API `PATCH …/out-of-contract` ยังมี; จำแนกนอกสัญญาหลังปิดงานใช้ `classify-doc`)
- Public report: cascade สถานที่โหลดทีละขั้นผ่าน `GET /sites/options/*` (Site-only) — หลังตรวจเบอร์ยิงแค่ provinces ไม่ดึง `/sites` ทั้งก้อน; เคลียร์ลูกเฉพาะตอนผู้ใช้เปลี่ยน Select (ไม่ล้างตอน restore draft); dashboard คง `GET /sites`
- Site/Job location: แยก `Site.agency` (สถานที่/หน่วยงาน) กับ `Site.station` (ชื่อสถานี); เพิ่ม `Job.agency`; cascade 5 ขั้น; `findByLocation` ตอนสร้างงานถ้าไม่ส่งตำบลใช้ `whenSubdistrictEmpty: 'any'` แล้วเติมตำบลจาก Site
- Locations API: `GET /locations/provinces` คืนเฉพาะจังหวัด (lazy-load); เพิ่ม `GET …/provinces/:id/districts` และ `GET …/districts/:id/subdistricts` — public report แสดงจังหวัดจาก Site เท่านั้น
- Public report (`/public/report`): อีเมลและรูปภาพประกอบเป็น optional; ฟอร์มส่ง `agency` + `location` (ชื่อสถานี); สร้าง/ผูกผู้แจ้งจากเบอร์ (`username = phone` เมื่อไม่มีอีเมล)
- Locations master: เพิ่ม `Subdistrict` + API ตำบล; เมนู `/dashboard/locations` (`menu.locations`); ฟอร์ม Site/public cascade จังหวัด→อำเภอ→ตำบล→สถานที่/หน่วยงาน→ชื่อสถานี — **หลัง deploy รัน** `npx ts-node scripts/seed-roles-permissions.ts` (ใน `backend/`) เพื่อผูก `menu.locations`
- Doc No: สร้างงานออก hex; Running Doc No (`CM-SHF-2002-XXXX` / `YYYYMM####`) ออกครั้งเดียวตอนจำแนกเอกสารหลังปิดงาน — ไม่ gen ตอน assign/OOC
- `/dashboard/all`: dialog จำแนกเอกสารเลือกในสัญญา/นอกสัญญาก่อน แล้วกดยืนยัน — กันกดผิดจากปุ่มสีใกล้กัน และเตือนว่าเลขชั่วคราวถูกแทนที่ครั้งเดียว

### Added

- อัปโหลดรูปงาน: ตรวจขนาด/ชนิดไฟล์ทั้ง UI และ API (5MB, JPG/PNG/WebP/HEIC); helper กลาง `job-image-upload`; frontend pre-check ที่ public report, issue upload panel, และฟอร์มรูปแก้ไข
- RBAC: สิทธิ์ `job.viewContractTabs` คุมการมองเห็นแท็บสัญญา/นอกสัญญาในรายการงาน (`/dashboard/all`, `my-jobs`, `in-progress`) — ตั้งที่ `/dashboard/roles`; บทบาทมาตรฐาน ADMIN/STAFF/SUPERVISOR ได้โดย default หลัง restart backend
- Sites seed: นำเข้า `Sites.xlsx` (sheet `info`, ~198 แถว) ผ่าน `npm run script:seed-sites-xlsx` — dry-run `:dry`, แทนที่ทั้งก้อน `:clear` (Windows-friendly) — ดู [`docs/Sites-Import.md`](docs/Sites-Import.md); **local verify ✅**
- Locations seed: นำเข้าจังหวัด/อำเภอ/ตำบลจาก dump MS SQL (`scripts/data/TB_MST_*.sql`) ผ่าน `npx ts-node scripts/seed-locations-from-mssql.ts` (รองรับ `DRY_RUN=1`) — ดู [`docs/Locations-Master-Seed.md`](docs/Locations-Master-Seed.md) (API lazy-load หลัง seed เต็มประเทศ)
- Jobs: อัปโหลดรูปปัญหา (`PATCH /jobs/:id/issue-images`) ด้วยสิทธิ์ **`job.issue.upload`** — งาน PENDING/IN_PROGRESS (รวมยังไม่มีผู้รับ), เติมได้ถึง 3 รูปไม่แทนที่; UI ที่ `/dashboard/jobs/:id` และ wrench modal; ติ๊กบทบาทที่ `/dashboard/roles` (ADMIN ได้จาก seed)
- Jobs: คอลัมน์/CSV「ระยะเวลาจบงาน」บน `/dashboard/all`
- ลายเซ็นอิเล็กทรอนิกส์: `User.signature` + `Job.reporterSignature`; ตั้งที่โปรไฟล์; hard gate assign/bulk/OOC/fix/reopen/จำแนกเอกสาร; บังคับเซ็นผู้แจ้งตอนปิดงาน; ฝังใน PDF ปิดงานเมื่อมี
- จำแนกเอกสาร: `PATCH /jobs/:id/classify-doc` + สิทธิ์ `job.classifyDoc` (ADMIN/SUPERVISOR); ปุ่มบน `/dashboard/all` และหน้ารายละเอียดงาน (คู่พิมพ์/PDF); งานนอกสัญญาที่จำแนกแล้วไป `/dashboard/out-of-contract`
- Unit tests (Meeting A–E): Doc No format, CreateJob email optional, issue-image count, signature gate, CSV/workDurationDays

---

## [0.1.3] - 2026-08-06

### Fixed

- UAT/โดเมน: เมื่อ reverse proxy ส่ง `/api/*` มา Next โดยไม่ตั้ง `/api/` → Nest ให้ catch-all proxy ไป `API_INTERNAL_BASE_URL` (แก้ 404 ของ `/api/public/...`) — ยังแนะนำตั้ง NPM ให้ถูก และ `/socket.io` ต้องชี้ Nest โดยตรง

---

## [0.1.2] - 2026-08-06

### Fixed

- Light mode: หน้ารายละเอียดข้อขัดข้อง (`/dashboard/jobs/[id]`) ไม่บังคับพื้นหลังมืด และปรับ contrast ของ alert/ปุ่มสถานะ
- Light mode: dropdown มอบหมายงาน (react-select) ใน Dialog รายละเอียดงานและ JobsList ตาม theme แทน hardcode dark
- Light mode: ปรับ contrast บน `/public/status`, `/public/report`, `/login`, JobsList CTA, RoleBadge, users, settings (orphan), และ dashboard overview
- Browser tab title: จาก `CCTV Maintenance` เป็นชื่อจาก `NEXT_PUBLIC_APP_NAME` (ค่าเริ่มต้น ระบบแจ้งซ่อม)

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
