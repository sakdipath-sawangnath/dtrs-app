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

Backend API สำหรับ **ระบบแจ้งซ่อม CCTV** — NestJS + Prisma + MySQL

- **Auth:** JWT + RolesGuard (ADMIN, STAFF, USER, SUPERVISOR)
- **Modules:** Auth, Users, Jobs, Sites, Areas, Settings, **Roles** (dynamic RBAC: AppRole, Permission, RolePermission)
- **API หลัก:** `GET /users/assignable` (ADMIN/SUPERVISOR) รายชื่อเจ้าหน้าที่มอบหมายได้; `PATCH /jobs/:id/assign` มอบหมายงาน (ADMIN/SUPERVISOR ใครก็ได้, STAFF รับงานตัวเอง); `PATCH /jobs/:id/fix` บันทึกการแก้ไขงาน (brokenPartType, cause, fixMethod, note, serial numbers, fixImages → MinIO) ตั้ง status=RESOLVED; `GET /jobs/status/:ticketNo` ตรวจสอบสถานะจากเลขที่ใบแจ้งซ่อม
- **Jobs Flow:** `POST /jobs` รับฟอร์มแจ้งซ่อมจากหน้า `/report` (multipart/form-data) อัปโหลดรูปไป MinIO ผ่าน `MinioService.uploadFile()` เก็บ URL ลง `Job.images` และถ้าไม่ส่ง `ticketNo` มาด้วย ระบบจะสร้างรหัสใหม่เป็น hex 8 ตัว ไม่ซ้ำ (ให้รูปแบบใกล้เคียงกับข้อมูลเดิมใน CSV)
- **MinIO:** รองรับ `MINIO_PUBLIC_URL` ใน `.env` สำหรับ URL รูปที่ browser เข้าถึงได้; **`MINIO_SERVER_FETCH_BASE_URL`** (เช่น `http://192.168.0.71:9000`) ให้ Nest โหลด object ทาง HTTP ภายในเมื่อโดเมนสาธารณะชี้ไป IP ที่ไม่มี :443; bucket policy ตั้งเป็น public read ตอน service init
- **Scripts:** `scripts/seed-admin.ts`, `scripts/seed-roles-permissions.ts` (บทบาท+สิทธิ์ รวม SUPERVISOR, job.assign), `scripts/seed-from-excel.ts`, `scripts/seed-from-csv.ts`, `scripts/migrate-appsheet-images-to-minio.ts`, `scripts/import-appsheet-employees.ts`
- **อีเมลแจ้งงาน:** `JobEmailNotificationService` + `GET/PUT /settings/email-templates` (เก็บ `email_templates`); สรุปผู้รับ To/CC — [../docs/Email-Notifications.md](../docs/Email-Notifications.md)

รายละเอียด API และสถานะโปรเจกต์: ดูที่ root [STATUS.md](../STATUS.md) และ [README.md](../README.md).

---

## Project setup

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
