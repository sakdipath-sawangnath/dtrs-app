# Postman Collection - CCTV Maintenance API

## นำเข้า (Import) เข้า Postman

1. เปิด Postman
2. คลิก **Import** (หรือ File → Import)
3. เลือกไฟล์ **`CCTV-Maintenance-API.postman_collection.json`** จากโฟลเดอร์นี้
4. Collection "CCTV Maintenance API" จะปรากฏใน sidebar

### ไฟล์เสริมสำหรับ debug การพิมพ์รายงาน

- Collection: **`CCTV-Print-PDF-Debug.postman_collection.json`** — รวม MinIO HEAD (ไม่ใช้ JWT), `/job-images`, คำอธิบาย 502/404, ตัวแปร `minioBaseUrl` / `jobId`, แนวทาง **`MINIO_SERVER_FETCH_BASE_URL`** ใน `PRINT-PDF-DEBUG.md` §8
- คู่มือ: **`PRINT-PDF-DEBUG.md`**

## ตัวแปร (Variables)

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
|--------|-------------|----------|
| `baseUrl` | `http://localhost:4100/api` | URL ฐานของ API (เปลี่ยนตาม server) |
| `jobId` | `1` | เลขงานสำหรับ request ในโฟลเดอร์ Jobs |
| `access_token` | (ว่าง) | JWT ที่ได้จาก Login · ใส่หลังรัน request Login |

## วิธีใช้

1. รัน **Auth → Login** (ใส่ email/username และ password ของ admin หรือ user)
2. จาก response คัดลอกค่า `access_token`
3. ไปที่ Collection → คลิก ... (สามจุด) → Edit → แท็บ **Variables** → ใส่ค่า `access_token` ในคอลัมน์ Current Value
4. จากนั้น request ที่ต้องใช้ JWT จะใช้ token นี้โดยอัตโนมัติ (Header: `Authorization: Bearer {{access_token}}`)

## โฟลเดอร์ใน Collection

- **Auth** – Login (สาธารณะ)
- **Users** – ผู้ใช้ (reporters สาธารณะ — `GET /public/users/reporter-by-phone` ไม่ส่ง `image` URL; **me**; **`GET /users/me/avatar`**, **`GET /users/:id/avatar`** สตรีมรูปโปรไฟล์ JWT; **`GET /users/assignable`** ต้องมีสิทธิ์ **`job.assign`** (PermissionsGuard); CRUD (`GET/POST/PATCH/DELETE /users` ฯลฯ) ต้อง JWT + **`menu.users`**)
- **Jobs** – งานแจ้งซ่อม (**POST `/public/jobs`** multipart: `description` อย่างน้อย **10** ไม่เกิน **500** ตัวอักษร (400 ถ้าเกิน); `images[]` สูงสุด 3, **5MB/ไฟล์**, JPG/PNG/WebP/HEIC→JPEG, `reporterAvatar` optional; สถานะสาธารณะ; อื่นๆ ต้อง JWT; **PATCH :id/issue-images**: JWT + **`job.issue.upload`** (PENDING/IN_PROGRESS, เติมถึง 3 รูป, **5MB/ไฟล์**, magic bytes); **PATCH :id/fix**: multipart `fixImages` (สูงสุด 3×5MB) คง `IN_PROGRESS`; **PATCH :id/close**: `reporterSignature` PNG ≤5MB → `RESOLVED`; **PATCH :id/assign**: RBAC — `job.assign` มอบหมายใครก็ได้ / `menu.pending` + ตัวเอง = รับงาน; ระบบจะบันทึก `assignedById` เพื่อแยก “มอบหมายงาน” vs “รับงานเอง” ใน UI; **PATCH :id/out-of-contract**: ต้อง **`job.assign`**; **PATCH :id/status**: **`job.updateStatus`**; **PATCH :id/reopen**: RBAC `job.reopen.*`; **DELETE :id**: ลบ **IN_PROGRESS** ต้อง **`job.deleteInProgress`**; ลบ **PENDING** ไม่มอบหมายต้อง **`job.deleteUnassigned`**) — ดูรายละเอียดใน `../docs/api-endpoints.json` และ [`RBAC-Setup.md`](RBAC-Setup.md)
- **Settings** – ตั้งค่าระบบ (JWT + **`menu.settings`**): **GET/PUT** `settings/email-smtp`, **POST** `settings/email-smtp/test`; **GET/PUT** `settings/email-templates`; **GET/PUT** `settings/default-pass` — สรุปการส่งอีเมล: [`../../docs/Email-Notifications.md`](../../docs/Email-Notifications.md)
- **Sites** – พื้นที่โครงการ (GET สาธารณะ, POST ต้อง JWT)
- **Areas** – พื้นที่รับผิดชอบ (ต้อง JWT)
- **Health** – Hello (health check)

รายละเอียดแต่ละเส้นดูได้ที่ **`../docs/api-endpoints.json`**

## GitLab CI / Deploy

Pipeline อ้างอิงที่ root โปรเจกต์: **`.gitlab-ci.yml`** + **`backend/Dockerfile`** / **`frontend/Dockerfile`** — สรุปการตั้งค่าและตัวแปรดูที่ root **`README.md`**
