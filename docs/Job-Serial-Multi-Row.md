# บันทึกการแก้ไข: Serial หลายอุปกรณ์ (ชื่ออุปกรณ์ + S/N เดิม/ใหม่)

**วันที่อัปเดตสถานะ:** 2026-04-02

## บริบท

- ในงานบางเคสมีการเปลี่ยนอุปกรณ์มากกว่า 1 ชิ้น จึงต้องรองรับ **ได้สูงสุด 4 แถว** ในฟอร์มบันทึกการแก้ไข (`PATCH /jobs/:id/fix`)
- โครงสร้างฐานข้อมูลยังใช้คอลัมน์เดิม: `Job.oldSerialNumber`, `Job.newSerialNumber` (ไม่เพิ่มตารางใหม่)

## รูปแบบการเก็บข้อมูล

### แบบเดิม (แถวเดียว)

- `oldSerialNumber` = S/N เดิม (plain text, ตัวอักษร `0-9`, `A-Z`, `-`)
- `newSerialNumber` = S/N ใหม่ (เงื่อนเดียวกัน)

### แบบหลายแถว หรือมีชื่ออุปกรณ์

- เก็บ JSON ใน **`oldSerialNumber`** เท่านั้น รูปแบบ:

```json
{
  "v": 1,
  "rows": [
    { "n": "ชื่ออุปกรณ์", "o": "SN-OLD", "x": "SN-NEW" }
  ]
}
```

- **`newSerialNumber`** ใช้ `null` (หรือว่าง) เมื่อใช้โหมด JSON

### Migration ฐานข้อมูล

- คอลัมน์ `oldSerialNumber` / `newSerialNumber` เป็น **`TEXT`** (migration `20260402103000_job_serial_columns_text`) เพื่อให้ JSON ยาวพอเมื่อมีหลายแถว
- หลัง deploy ให้รัน `npx prisma migrate deploy` บนเซิร์ฟเวอร์ที่ใช้ DB จริง

## UI

- หน้า **`/dashboard/jobs/:id`** และ modal อัปเดตใน **`JobsList`**: แยกแถวละ ชื่ออุปกรณ์ / S/N เดิม / S/N ใหม่ + ปุ่มเพิ่ม/ลบแถว (สูงสุด 4)

## รายงานพิมพ์ (PDF)

- หน้า **`/print/jobs/:id`** — ส่วน **รายการอุปกรณ์** แสดงหัวข้อบรรทัดแรก แล้วรายการแต่ละแถวขึ้นบรรทัดใหม่ (ไม่ให้แถวแรกไปต่อท้ายหัวข้อบรรทัดเดียวกัน)

## อ้างอิงโค้ด

- Frontend: `frontend/src/lib/jobSerialRows.ts`
- Backend validation: `backend/src/jobs/dto/create-job.dto.ts` (`UpdateFixInfoSchema`), `backend/src/jobs/job-serial-rows.schema.ts`
