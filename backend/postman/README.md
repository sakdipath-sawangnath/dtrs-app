# Postman Collection - CCTV Maintenance API

## นำเข้า (Import) เข้า Postman

1. เปิด Postman
2. คลิก **Import** (หรือ File → Import)
3. เลือกไฟล์ **`CCTV-Maintenance-API.postman_collection.json`** จากโฟลเดอร์นี้
4. Collection "CCTV Maintenance API" จะปรากฏใน sidebar

### ไฟล์เสริมสำหรับ debug การพิมพ์รายงาน

- Collection: **`CCTV-Print-PDF-Debug.postman_collection.json`**
- คู่มือ: **`PRINT-PDF-DEBUG.md`**

## ตัวแปร (Variables)

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
|--------|-------------|----------|
| `baseUrl` | `http://localhost:4000/api` | URL ฐานของ API (เปลี่ยนตาม server) |
| `access_token` | (ว่าง) | JWT ที่ได้จาก Login · ใส่หลังรัน request Login |

## วิธีใช้

1. รัน **Auth → Login** (ใส่ email/username และ password ของ admin หรือ user)
2. จาก response คัดลอกค่า `access_token`
3. ไปที่ Collection → คลิก ... (สามจุด) → Edit → แท็บ **Variables** → ใส่ค่า `access_token` ในคอลัมน์ Current Value
4. จากนั้น request ที่ต้องใช้ JWT จะใช้ token นี้โดยอัตโนมัติ (Header: `Authorization: Bearer {{access_token}}`)

## โฟลเดอร์ใน Collection

- **Auth** – Login (สาธารณะ)
- **Users** – ผู้ใช้ (reporters สาธารณะ, me, **assignable** สำหรับ ADMIN/SUPERVISOR/**STAFF**, CRUD ต้อง JWT/ADMIN)
- **Jobs** – งานแจ้งซ่อม (สร้าง/สถานะสาธารณะ, อื่นๆ ต้อง JWT; assign: ADMIN/SUPERVISOR มอบหมายได้, STAFF รับงานตัวเอง; **PATCH :id/fix**: บันทึกการแก้ไข — **เฉพาะผู้รับงาน**; **PATCH :id/reopen**: เปิดงานใหม่หลังปิด — **เฉพาะผู้รับงาน**; อัปโหลดรูปการแก้ไข; **DELETE :id**: ADMIN ลบงาน **IN_PROGRESS** ได้; ADMIN/SUPERVISOR ลบงาน **PENDING** ที่ยังไม่มอบหมายได้) — ดูรายละเอียดใน `../docs/api-endpoints.json`
- **Settings** – ตั้งค่าระบบ (ADMIN): **GET/PUT** `settings/email-smtp`, **POST** `settings/email-smtp/test` (ทดสอบส่งอีเมล); **GET/PUT** `settings/email-templates` (เทมเพลตแจ้งเหตุ/รับเรื่อง/ปิดงาน, `publicBaseUrl`, `notifyRoleIds` ฯลฯ) — สรุปการส่งอีเมล: [`../../docs/Email-Notifications.md`](../../docs/Email-Notifications.md)
- **Sites** – พื้นที่โครงการ (GET สาธารณะ, POST ต้อง JWT)
- **Areas** – พื้นที่รับผิดชอบ (ต้อง JWT)
- **Health** – Hello (health check)

รายละเอียดแต่ละเส้นดูได้ที่ **`../docs/api-endpoints.json`**

## GitLab CI / Deploy

Pipeline อ้างอิงที่ root โปรเจกต์: **`.gitlab-ci.yml`** + **`backend/Dockerfile`** / **`frontend/Dockerfile`** — สรุปการตั้งค่าและตัวแปรดูที่ root **`README.md`**
