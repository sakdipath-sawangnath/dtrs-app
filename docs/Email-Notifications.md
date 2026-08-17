# การแจ้งเตือนทางอีเมล (Job notifications)

เอกสารอ้างอิงสำหรับ flow การส่งอีเมลอัตโนมัติของระบบแจ้งซ่อม

**อัปเดต:** 2026-03-28 (หมายเหตุรูปในอีเมล — bucket MinIO แบบ private)

---

## รูปภาพในอีเมล vs MinIO private

- ข้อความ HTML ในอีเมลมักอ้าง **ลิงก์หน้าเว็บ** (`publicBaseUrl` + path เช่นสถานะงาน) — ไม่ควรฝัง URL ตรงไปยัง object MinIO ถ้า bucket **ไม่** public เพราะผู้รับอาจเปิดไม่ได้เมื่อไม่มีสิทธิ์
- ถ้าต้องการแสดงรูปในอีเมลจริง ๆ ต้องออกแบบแยก (เช่น แนบไฟล์จาก backend, presigned URL ช่วงสั้น ๆ หรือบริการ CDN ที่ควบคุมสิทธิ์) — นอกขอบเขตเทมเพลตปัจจุบันที่เน้นข้อความ + ลิงก์

---

## เงื่อนไขรวม

- ต้องมีการตั้งค่า **SMTP** ครบและบันทึกแล้ว (รหัสผ่านใน DB) — มิฉะนั้นระบบจะไม่ส่งและ log ว่าข้าม
- แต่ละเทมเพลตมีสวิตช์ **เปิด/ปิด** (`enabled`) แยกกัน
- เก็บการตั้งค่าเทมเพลตในตาราง `Setting` คีย์ `email_templates` (JSON)
- **ลิงก์ในอีเมล:** ใช้ `publicBaseUrl` จากการตั้งค่า (ถ้าเป็น URL `http://` หรือ `https://` ที่ถูกต้อง) — ถ้าไม่ตั้ง จะใช้ **`FRONTEND_BASE_URL`** ของ process backend (บน dev มักเป็น `http://localhost:3000`)  
  → บน production ควรตั้ง `publicBaseUrl` หรือ `FRONTEND_BASE_URL` ให้เป็น origin จริงของเว็บ

---

## เทมเพลต 3 ช่วง (ใน `/dashboard/settings`)

| เทมเพลต | เมื่อไหร่ถูกเรียก (โดยประมาณ) | ผู้รับหลัก (**To**) | **CC** (ไม่มีการแทรกนอกหน้าตั้งค่า) |
|----------|------------------------------|---------------------|----------------------------------------|
| **แจ้งเหตุ / สร้างคำร้อง** (`onReported`) | หลังสร้างงานแจ้งซ่อมสำเร็จ | อีเมลผู้แจ้ง + **toExtra** | เฉพาะช่อง **CC** + อีเมลผู้ใช้ตาม **บทบาทที่เลือก** (`notifyRoleIds`) — ถ้าเว้นช่อง CC และไม่เลือกบทบาท = **ไม่มี CC** |
| **รับเรื่อง / มอบหมาย** (`onAssigned`) | หลังมอบหมายหรือรับงาน | อีเมลผู้รับงาน (`assignedTo` / `fixerEmail`) + **toExtra** | เช่นเดียวกับแถวบน (**CC** + `notifyRoleIds`) |
| **ปิดงาน / เสร็จสิ้น** (`onClosed`) | เมื่อ `PATCH /jobs/:id/close` สำเร็จ (สถานะ `RESOLVED`) | **ฉบับที่ 1:** อีเมลผู้แจ้ง + **toExtra** (ไม่แนบ PDF) · **ฉบับที่ 2:** กลุ่ม CC/`notifyRoleIds` ถูกส่งเป็น **To** พร้อมแนบ `DTRS-{ticketNo}.pdf` | ฉบับที่ 1 ไม่มี CC · ฉบับที่ 2 ใช้รายชื่อจากช่อง **CC** + บทบาท (`notifyRoleIds`) เป็นผู้รับ — **ไม่**ใส่ผู้รับงานอัตโนมัติ |

หมายเหตุ: ระบบกรองอีเมลซ้ำ (ไม่ส่ง To ซ้ำใน CC) และต้องเป็นรูปแบบอีเมลที่อ่านได้

---

## ทำไมบัญชี admin อาจได้รับอีเมล

ระบบ **ไม่ได้ส่งหา “ADMIN” โดยชื่อบทบาทโดยอัตโนมัติ** นอกเหนือจากที่ตั้งในหน้า settings:

1. **ผู้แจ้ง (To)** — ถ้าอีเมลผู้แจ้งหรือ user ที่ผูกเป็นผู้แจ้งคือ admin จะเป็น **ผู้รับหลัก (To)** ไม่ใช่แค่ CC
2. **ช่อง CC / To เพิ่มเติม** — ถ้ามีการบันทึกอีเมล admin ไว้
3. **Role ที่เลือกในเทมเพลต** — ถ้าเลือกบทบาทที่มี user เป็น admin อยู่ และ user นั้นมีอีเมลในระบบ (ส่งเป็น CC)
4. **ผู้รับงาน** — จะได้อีเมลเฉพาะเมื่อเป็น **To** (เช่น เทมเพลตรับเรื่อง) หรืออยู่ในช่อง CC / บทบาทที่เลือก — **ไม่**ถูกใส่ CC อัตโนมัติเมื่อปิดงานแล้ว

---

## โค้ดอ้างอิง (Backend)

- `backend/src/jobs/job-email-notification.service.ts` — รวม To/CC, เรียก `MailService.sendHtmlMail`
- `backend/src/jobs/job-email-html.ts` — HTML อีเมล (โทนสว่าง, สถานะเป็น badge ตาม `statusCode`)
- `backend/src/settings/email-templates.types.ts` — โครงสร้าง `EmailTemplatesSettings` และค่าเริ่มต้น
- `backend/src/settings/settings.service.ts` — `getEmailTemplates` / `updateEmailTemplates`

---

## API ที่เกี่ยวข้อง (ADMIN + JWT)

- `GET /api/settings/email-templates` — อ่านเทมเพลต (รวม `publicBaseUrl`, โลโก้, แต่ละบล็อก)
- `PUT /api/settings/email-templates` — บันทึกเทมเพลต
- `GET/PUT /api/settings/email-smtp`, `POST /api/settings/email-smtp/test` — SMTP

รายละเอียด endpoint อื่น: `STATUS.md`, `backend/docs/api-endpoints.json`, `backend/postman/README.md`
