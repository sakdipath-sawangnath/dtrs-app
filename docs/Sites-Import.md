# Sites import จาก Sites.xlsx

นำเข้ารายการ Site (สถานที่ในโครงการ) จากไฟล์ Excel ให้สอดคล้อง schema ปัจจุบัน

## ไฟล์และแมปคอลัมน์

| ไฟล์ | Sheet |
|------|--------|
| `backend/scripts/data/Sites.xlsx` | `info` |

| คอลัมน์ Excel | Prisma `Site` |
|---------------|---------------|
| จังหวัด | `province` |
| อำเภอ | `district` |
| ตำบล | `subdistrict` (optional) |
| สถานที่/หน่วยงาน | `agency` |
| ชื่อสถานี | `station` |

**ไม่ import รอบนี้:** พื้นที่เขตฯ, ภาค

## ความหมายฟิลด์ (หลังแยก agency/station)

- `Site.agency` = สถานที่/หน่วยงาน
- `Site.station` = ชื่อสถานี
- Cascade บนฟอร์ม: จังหวัด → อำเภอ → ตำบล → สถานที่/หน่วยงาน → ชื่อสถานี
- **Public report cascade API (ไม่โหลด `/sites` ทั้งก้อน):**
  - `GET /sites/options/provinces`
  - `GET /sites/options/districts?province=`
  - `GET /sites/options/subdistricts?province=&district=`
  - `GET /sites/options/agencies?province=&district=&subdistrict?=`
  - `GET /sites/options/stations?province=&district=&agency=&subdistrict?=`
  - หลังตรวจเบอร์ยิงแค่ provinces; ที่เหลือ lazy ตามขั้น; ข้อมูลจาก Site เท่านั้น
  - เคลียร์ค่าลูก (อำเภอ→สถานี) เฉพาะเมื่อผู้ใช้เปลี่ยน Select — ไม่ล้างตอน restore draft จาก sessionStorage
- `Job.agency` = denormalize สถานที่/หน่วยงาน (nullable สำหรับงานเก่า)
- `Job.location` = ชื่อสถานี
- **ตำบลบน public report:** optional — ถ้าไม่เลือก ระบบยัง match Site ได้ด้วยคีย์ 4 ฟิลด์ (จังหวัด/อำเภอ/agency/station) แล้วเติม `Job.subdistrict` จากแถว Site ที่เจอตอนสร้างงาน

## Migration

รัน migration ก่อน import:

```bash
cd backend
npx prisma migrate deploy
```

Migration `20260814100000_add_site_station_job_agency`:

- เพิ่ม `Site.station` (backfill `station = agency` แล้ว `NOT NULL`)
- เพิ่ม `Job.agency` (nullable)

## รันสคริปต์

```bash
cd backend

# ดูสรุป + ตัวอย่างแถว (ไม่เขียน DB) — ใช้ได้ทุก OS
npm run script:seed-sites-xlsx:dry

# เขียนจริง (idempotent ตามคีย์ 5 ฟิลด์)
npm run script:seed-sites-xlsx
```

**Windows (PowerShell)** — ถ้าต้องการตั้ง env เอง:

```powershell
$env:DRY_RUN = "1"
npm run script:seed-sites-xlsx
Remove-Item Env:DRY_RUN
```

**Unix/macOS:**

```bash
DRY_RUN=1 npm run script:seed-sites-xlsx
```

### แทนที่ Site ทั้งก้อน (อันตราย)

```bash
# สำรอง DB ก่อน — ลบ Site ทั้งหมดแล้ว import ใหม่
npm run script:seed-sites-xlsx:clear
```

PowerShell: `$env:CLEAR_SITES_BEFORE_IMPORT="1"; npm run script:seed-sites-xlsx`

ค่าเริ่มต้น: **ไม่** ลบ Site เก่า — แถวที่ตรงคีย์จะ skip หรือ update

## สถานะนำเข้า

| สภาพแวดล้อม | Migration | Seed | หมายเหตุ |
|-------------|-----------|------|----------|
| **Local (dev DB)** | ✅ `20260814100000_add_site_station_job_agency` | ✅ 198 แถว | dry-run + import ผ่าน 2026-08-14 · **`:clear` แล้ว** (ลบของเก่า 209 → สร้าง 198 จาก Excel) |
| UAT/PRD | ☐ หลัง deploy | ☐ | รัน `migrate deploy` แล้ว `script:seed-sites-xlsx`; ใช้ `:clear` เฉพาะเมื่อต้องแทนที่ Site เก่าทั้งก้อน |

## หลัง migrate บน local/UAT

1. รัน migration
2. ถ้ามี Site เก่าที่ backfill `station = agency` ไม่ตรง Excel → ใช้ `CLEAR_SITES_BEFORE_IMPORT=1` (หลังสำรอง DB) แล้ว import
3. สุ่มตรวจ 1 แถว Excel กับ DB
4. ทดสอบ public report cascade 5 ขั้น → สร้างงาน → ตรวจ `Job.agency` + `Job.location`

## ดูร่วมกับ

- [`Locations-Master-Seed.md`](Locations-Master-Seed.md) — master จังหวัด/อำเภอ/ตำบล
- [`PLAN.md`](../PLAN.md) § Site/Area
