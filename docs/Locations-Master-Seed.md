# Locations Master Seed (MS SQL → MySQL)

**อัปเดต:** 2026-08-14

นำเข้า master **จังหวัด / อำเภอ / ตำบล** จาก dump MS SQL (Navicat) เข้าตาราง Prisma `Province` → `District` → `Subdistrict`

## แหล่งข้อมูล

วางไฟล์ใน `backend/scripts/data/`:

| ไฟล์ | ตารางต้นทาง | ใช้คอลัมน์ |
|------|-------------|------------|
| `TB_MST_Province.sql` | `TB_MST_Province` | `Province_Code`, `Province_Name_TH`, `Active` |
| `TB_MST_District.sql` | `TB_MST_District` | `District_Code`, `Province_Code`, `District_Name_TH`, `Active` |
| `TB_MST_SubDistrict.sql` | `TB_MST_SubDistrict` | `District_Code`, `SubDistrict_Name_TH`, `Active` |

- ใช้เฉพาะแถว `Active = 1`
- **trim** ชื่อไทยก่อน insert
- **ไม่เก็บ** Code / ชื่อ EN / รหัสไปรษณีย์ (schema ปัจจุบันไม่มีคอลัมน์เหล่านี้) — Code ใช้แค่จับคู่ FK ระหว่าง import

## สคริปต์

```bash
cd backend
npx ts-node scripts/seed-locations-from-mssql.ts
# หรือ
npm run script:seed-locations-mssql

# ตรวจ parse อย่างเดียว
DRY_RUN=1 npx ts-node scripts/seed-locations-from-mssql.ts
```

- idempotent: `createMany` + `skipDuplicates` ตาม unique `name` / `(parentId, name)`
- หลัง deploy UAT/PRD: ตั้ง `DATABASE_URL` ของ env นั้น แล้วรันสคริปต์บนเครื่องที่มี dump (หรือ copy `scripts/data/` ไปด้วย)

## ปริมาณโดยประมาณ (dump 2026-08-14)

| ระดับ | แถวหลัง parse |
|--------|----------------|
| จังหวัด | ~77 |
| อำเภอ | ~928 |
| ตำบล | ~7432 (หลังตัดชื่อซ้ำต่ออำเภอ) |

## API cascade (lazy-load)

หลัง seed เต็มประเทศ **ห้าม** สมมติว่า `GET /locations/provinces` คืน tree ทั้งก้อนแล้ว

| Method | Path | คืนค่า |
|--------|------|--------|
| GET | `/locations/provinces` | `{ id, name, districtCount }[]` |
| GET | `/locations/provinces/:provinceId/districts` | `{ id, name, provinceId, subdistrictCount }[]` |
| GET | `/locations/districts/:districtId/subdistricts` | `{ id, name, districtId }[]` |

- หน้า public report: รายการจังหวัดจาก **Site** เท่านั้น; อำเภอ/ตำบล merge จาก Site + master (lazy)
- หน้า `/dashboard/locations`: ขยายแถวเพื่อโหลดลูก

## เกี่ยวข้อง

- UI cascade: `/dashboard/locations`, public report, Site form
- แผน Meeting Phase B: [`Meeting-11082026-Requirements-Plan.plan.md`](./Meeting-11082026-Requirements-Plan.plan.md)
- Seed อื่น (Site/Job จาก Excel/CSV): `seed-from-excel.ts`, `seed-from-csv.ts` — **คนละชุด** กับ master จังหวัด–ตำบล
- Seed Site ใหม่ (agency + station): [`Sites-Import.md`](Sites-Import.md) · `seed-sites-from-xlsx.ts` · local ✅ 198 แถว
