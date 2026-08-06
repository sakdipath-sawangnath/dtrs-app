# Post-mortems (dtrs-app)

บันทึก RCA หลังแก้บั๊กที่ **validate แล้ว** — ไม่ใช่ timeline เหตุการณ์ production

## วิธีใช้

1. Debug ให้ครบ 4 ขั้นของ skill **`debug-mantra`**
2. Optional: review fix ด้วย **`scrutinize`**
3. ให้ agent ร่างด้วย skill **`post-mortem`**
4. ยืนยันก่อน commit ไฟล์ในโฟลเดอร์นี้

Skills:

- Frontend / full-stack (หน้า, NextAuth, unwrap, proxy รูป): [`frontend/.agents/skills/post-mortem/SKILL.md`](../../frontend/.agents/skills/post-mortem/SKILL.md)
- Backend / API (Nest, Prisma, MinIO server): [`backend/.agents/skills/post-mortem/SKILL.md`](../../backend/.agents/skills/post-mortem/SKILL.md)

## ชื่อไฟล์

`docs/postmortems/<ticket-or-slug>.md`

ตัวอย่าง: `job-image-502-prd.md`, `unwrap-permissions-sidebar.md`

## กฎ

- **ห้าม** ใส่ secrets / PII (JWT, SMTP, MinIO keys, เบอร์โทรเต็ม, ที่อยู่)
- ใช้ชื่อ env ไม่ใส่ค่า — ค่าเป็น `***`
- ระบุ `jobId` / `ticketNo` แบบ redacted ได้
- อย่า invent root cause หรือผล validation

## รายการ

ยังไม่มีไฟล์ RCA ใน repo — เพิ่มแถวในตารางนี้เมื่อ commit ฉบับแรก

| ไฟล์ | สรุปสั้น |
|------|----------|
| — | — |
