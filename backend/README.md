<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Backend API สำหรับ **ระบบแจ้งซ่อม** — NestJS + Prisma + MySQL

- **Auth:** JWT; จุดที่ต้องสิทธิ์ละเอียดใช้ **`PermissionsGuard`** + `Permission.code` (สอดคล้อง `/dashboard/roles`) — ยังมี `RolesGuard` ในบางจุด; `User.role` เป็น `VARCHAR` (`AppRole.code`); user ที่ยังไม่มี `roleId` ใช้ fallback **`RBAC_ROLE_PERMISSION_CODES`** ตามรหัสบทบาทมาตรฐาน
- **Modules:** Auth, Users, Jobs, Sites, Areas, Settings, **Roles** (dynamic RBAC: AppRole, Permission, RolePermission)
- **API หลัก:** `GET /users/assignable` (**`job.assign`**) รายชื่อเจ้าหน้าที่มอบหมายได้; `PATCH /jobs/:id/assign` — RBAC: มี `job.assign` มอบหมายใครก็ได้ / `menu.pending` + ตัวเอง = รับงาน; `PATCH /jobs/:id/status` (**`job.updateStatus`**); `DELETE /jobs/:id` — **`job.deleteInProgress`** (IN_PROGRESS) หรือ **`job.deleteUnassigned`** (PENDING ไม่มอบหมาย); `POST /public/jobs` และ `PATCH /jobs/:id/issue-images` / `PATCH /jobs/:id/fix` — อัปโหลดรูป **5MB/ไฟล์**, allowlist JPG/PNG/WebP (HEIC→JPEG ฝั่ง server), สูงสุด 3 รูป issue/fix; เกินขนาด/จำนวน → **400** ข้อความไทย; `PATCH /jobs/:id/issue-images` ต้อง **`job.issue.upload`**; `PATCH /jobs/:id/fix` บันทึกการแก้ไขงาน (RBAC `job.fix.*`; multipart → MinIO) คง `IN_PROGRESS`; `PATCH /jobs/:id/close` ปิดงานด้วยลายเซ็นผู้แจ้ง → `RESOLVED`; `GET /jobs/status/:ticketNo` ตรวจสอบสถานะจากเลขที่ใบแจ้งซ่อม; `POST /areas` (**`site.create`**); `/settings/*` (**`menu.settings`**); `GET /public/settings/app-meta` สำหรับ footer ฝั่ง public; CRUD roles (**`menu.roles`**); CRUD users หลัก (**`menu.users`**); แท็บสัญญา/นอกสัญญาใน UI อิง **`job.viewContractTabs`**
- **อัปโหลด + proxy:** helper `src/common/upload/job-image-upload.ts`; หลัง deploy ต้องมี `file-type` / `heic-convert` ใน image (`npm install`). NPM แนะนำ `client_max_body_size 50m` ที่ `/api/` — ถ้ายังไม่ได้ตั้ง frontend จะบีบรูปแล้ว retry หลัง 413 — [docs/Reverse-Proxy-Nginx-Proxy-Manager.md](docs/Reverse-Proxy-Nginx-Proxy-Manager.md)
- **Jobs Flow:** `POST /jobs` รับฟอร์มแจ้งซ่อมจากหน้า `/report` (multipart/form-data) อัปโหลดรูปไป MinIO ผ่าน `MinioService.uploadFile()` เก็บ URL ลง `Job.images` และถ้าไม่ส่ง `ticketNo` มาด้วย ระบบจะสร้างรหัสใหม่เป็น hex 8 ตัว ไม่ซ้ำ (ให้รูปแบบใกล้เคียงกับข้อมูลเดิมใน CSV)
- **MinIO:** รองรับ `MINIO_PUBLIC_URL` ใน `.env` (ลิงก์ใน DB); **`MINIO_SERVER_FETCH_BASE_URL`** ให้ Nest โหลด object ทาง HTTP ภายในเมื่อจำเป็น; ค่าเริ่มต้น **`MINIO_ENSURE_PUBLIC_READ_POLICY=false`** — ไม่เปิด public read บน bucket ตอนสตาร์ท; รูปงานผ่าน `GET /jobs/:id/image/...` (SDK + fallback); รูปโปรไฟล์ผ่าน **`GET /users/:id/avatar`** / **`GET /users/me/avatar`**; แผน private bucket + checklist: [../docs/Project-Plan-Private-MinIO-Images.md](../docs/Project-Plan-Private-MinIO-Images.md); ตัวแปร env: [../docs/minio.md](../docs/minio.md); GitLab Variables: [../docs/GitLab-CI-Variables-Checklist.md](../docs/GitLab-CI-Variables-Checklist.md) (UAT กลุ่ม B ✅)
- **Scripts (รัน `cd backend` ก่อน):** seed/migrate เดิม — `scripts/seed-admin.ts`, `scripts/seed-roles-permissions.ts`, `scripts/seed-from-excel.ts`, `scripts/seed-from-csv.ts`, `scripts/seed-locations-from-mssql.ts` (dump `scripts/data/TB_MST_*.sql` → Province/District/Subdistrict; `DRY_RUN=1` ได้), `scripts/seed-sites-from-xlsx.ts` (`Sites.xlsx` sheet `info`; `npm run script:seed-sites-xlsx` / `:dry` / `:clear`) — ดู [`../docs/Sites-Import.md`](../docs/Sites-Import.md) · local ✅ 198 แถว, `scripts/migrate-appsheet-images-to-minio.ts`, `scripts/import-appsheet-employees.ts`
- **สคริปต์แก้วันที่ Job (one-off, ต้องสำรอง DB ก่อน):**
  - `npm run script:audit-report-future-year` — อ่านอย่างเดียว: `reportDate` ในปีปฏิทิน Bangkok (`AUDIT_YEAR` ค่าเริ่มต้น 2026) ที่ **ล่วงหน้า**กว่าวันนี้ (เทียบ `getEndOfTodayBangkok()` เดียวกับ API)
  - `npm run script:fix-report-future-audited` — แก้เฉพาะแถวที่ audit จับได้; **ค่าเริ่มต้น dry-run**; ตั้ง `APPLY_WRITE=1` เมื่อยืนยันแล้ว; **`DRY_RUN=1` บังคับ dry แม้ env ค้าง `APPLY_WRITE`**
  - `npm run script:fix-job-dates-batch` — แก้ตาม `ticketNo` ในไฟล์ หรือ `FIX_BY_YEAR` + `APPLY_WRITE` (ดูหัวคอมเมนต์ใน `scripts/fix-job-dates-by-tickets.ts`)
  - SQL ตัวอย่างชุด ticket: `scripts/fix-job-report-fix-dates-ticket-batch.sql`
  - ฟังก์ชัน Bangkok + แปลง corruption ร่วม: `scripts/lib/jobBangkokAndCorruptionFix.ts`
- **อีเมลแจ้งงาน:** `JobEmailNotificationService` + `GET/PUT /settings/email-templates` (JWT + **`menu.settings`**; เก็บ `email_templates`); สรุปผู้รับ To/CC — [../docs/Email-Notifications.md](../docs/Email-Notifications.md)
- **System footer metadata:** `GET/PUT /settings/app-meta` (JWT + **`menu.settings`**) และ `GET /public/settings/app-meta`; เก็บค่า `app_meta` ในตาราง `Setting` เพื่อให้ frontend ใช้ fallback **DB → env → `package.json`** ใน `SiteFooter`

รายละเอียด API และสถานะโปรเจกต์: ดูที่ root [STATUS.md](../STATUS.md) และ [README.md](../README.md).

---

## Project setup

คัดลอก env ครั้งแรก:

```bash
copy .env.example .env
```

แก้ `DATABASE_URL` (DB **`dtrs_app`**), `MINIO_BUCKET_NAME` (**`dtrs-app`**), secrets — ดู [`.env.example`](.env.example) และ [../docs/DTRS-Migration-Checklist.md](../docs/DTRS-Migration-Checklist.md)

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# อัปโหลดรูปงาน (unit + e2e ที่เกี่ยวข้อง)
$ npx jest src/common/upload/job-image-upload.spec.ts --runInBand
$ npx jest --config ./test/jest-e2e.json test/public-jobs-upload.e2e-spec.ts test/jobs-issue-images.e2e-spec.ts --runInBand

# แยกบันทึกแก้ไข / ปิดงาน (unit + e2e)
$ npx jest src/jobs/jobs-close.service.spec.ts --runInBand
$ npx jest --config ./test/jest-e2e.json test/jobs-close.e2e-spec.ts --runInBand

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
