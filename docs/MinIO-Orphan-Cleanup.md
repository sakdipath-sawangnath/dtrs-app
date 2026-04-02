# MinIO: สแกนและลบไฟล์ค้าง (Orphan Files)

**วันที่อัปเดตสถานะ:** 2026-04-02

## บริบท

- ไฟล์ใน bucket อาจค้างเมื่อลบงาน/ข้อมูลอ้างอิงใน DB แล้ว หรือมีอัปโหลดที่ไม่ถูกอ้างอิง
- ฟีเจอร์นี้อยู่ใน **`/dashboard/settings`** (สิทธิ์ **`menu.settings`**) — ใช้สแกนเทียบกับอ้างอิงใน DB แล้วเลือกลบด้วยมือ (ไม่ลบอัตโนมัติทั้งหมด)

## การอ้างอิงในระบบ

- รวบรวม object key จาก `Job.images`, `Job.fixImages`, `User.image` (แปลงจาก URL ใน DB ให้เป็น key ใน bucket ตาม logic ของ `MinioService`)

## นโยบายการลบ (ความปลอดภัย)

- ไฟล์ที่ **อายุ (last modified) ยังไม่เกิน** ช่วง retention ที่กำหนดใน backend จะถูกข้าม (ไม่แสดงเป็นผู้รับการลบ) — ค่า retention ดูใน response ของ API (`retentionDays`)
- การลบต้องพิมพ์ยืนยัน **`DELETE`** และเลือก key ที่ต้องการ — backend จะตรวจสอบซ้ำก่อนลบแต่ละ object

## API (JWT + `menu.settings`)

| Method | Path | คำอธิบาย |
|--------|------|----------|
| POST | `/settings/minio/orphans/scan` | สแกนไฟล์ตาม prefix, รองรับ pagination แบบ continuation token, กรองตามอายุขั้นต่ำ (วัน) |
| POST | `/settings/minio/orphans/delete` | ลบเฉพาะ key ที่ส่งมา พร้อม `confirmText` |

## UI

- สแกน, เลือกรายการ, ส่งออก CSV (หน้าปัจจุบัน/หรือเฉพาะที่เลือก), ปุ่มหน้าถัดไป/ก่อนหน้าเมื่อมีการแบ่งหน้า

## อ้างอิง

- `backend/src/settings/settings.service.ts` — orchestration สแกน/ลบ
- `backend/src/minio/minio.service.ts` — `listObjectsRecursive`, `removeObjectByKey`
- ตัวแปร MinIO ทั่วไป: [`../minio.md`](../minio.md)
- แผน private bucket + proxy: [`Project-Plan-Private-MinIO-Images.md`](./Project-Plan-Private-MinIO-Images.md)
