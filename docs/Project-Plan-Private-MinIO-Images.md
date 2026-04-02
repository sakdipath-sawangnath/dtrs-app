# แผนโครงการ: ปิดการเข้าถึงรูป MinIO แบบสาธารณะ (Private Object + โหลดผ่านสิทธิ์)

**สถานะ:** ดำเนินการในโค้ดแล้ว (2026-03-28) — ทดสอบบน PRD / ลบ policy เก่าที่ MinIO เป็นหน้าที่ ops  
**Ops MinIO Console:** bucket → แท็บ **Anonymous** ควรไม่มี rule; **Access Policy** ใช้ **Private** หรือ Custom ที่ไม่เปิด `GetObject` ให้ทุกคน — สรุป env: [`../minio.md`](../minio.md)

---

## สรุปผล implement

| Phase | สถานะ |
|-------|--------|
| 0 | ทีมกำหนด bucket / rollback / ทดสอบ PRD ตาม checklist ด้านล่าง |
| 1 | `MinioService` parse key + `getBucketObjectBuffer`; `JobsService.getJobImageBuffer` SDK ก่อน axios |
| 2 | แดชบอร์ด: `dashboardJobImagePath` → `/job-images/...`; หน้า job, JobsList, modal, สถานะเจ้าหน้าที่ |
| 3 | `GET /users/me/avatar`, `GET /users/:id/avatar`; `userImageProxy` + `/user-images/[userId]`; `PersonAvatar`; auth session ใช้ `/user-images/:id`; users page / profile |
| 4 | ค่าเริ่มต้น **`MINIO_ENSURE_PUBLIC_READ_POLICY=false`**; ลบ policy public เดิมบน MinIO ด้วยมือถ้ามี |
| 5 | Checklist ทดสอบด้านล่าง (manual) |
| 6 | เอกสาร: README, STATUS, PLAN, TASK, api-endpoints.json, Reverse-Proxy, minio.md, `docs/README.md` |

---

## Public API

- **`GET /public/users/reporter-by-phone`** — ตอบ **`image: null`** เสมอ (ไม่รั่ว URL MinIO ไปหน้าแจ้งซ่อมสาธารณะ)

---

## Checklist ทดสอบ (Phase 5 — manual)

- [ ] แดชบอร์ด: รายละเอียดงาน, JobsList, modal, lightbox รูป issue/fix
- [ ] รูปโปรไฟล์: header, users, profile, PersonAvatar ในรายการงาน
- [ ] หน้า **`/print/jobs/:id`** และดาวน์โหลด PDF
- [ ] **`/public/status`** (เจ้าหน้าที่ล็อกอิน): รูปผู้แจ้ง + รูปประกอบ
- [ ] เปิด URL MinIO ตรงใน incognito → **403/404** (หลังลบ public policy บน bucket แล้ว)
- [ ] **`GET /jobs/status/:ticketNo`** แบบ public — ไม่มี URL รูป (มีแต่ `issueImageCount`)

---

## Rollback

- ตั้ง **`MINIO_ENSURE_PUBLIC_READ_POLICY=true`** ชั่วคราว + ตั้ง policy public บน MinIO อีกครั้ง (เฉพาะเหตุฉุกเฉิน)

---

## อ้างอิงใน repo

- `backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md` — `/job-images`, `/user-images`
- `minio.md` — env
- [`MinIO-Orphan-Cleanup.md`](./MinIO-Orphan-Cleanup.md) — สแกน/ลบไฟล์ค้างใน bucket (หน้า settings)
- `PLAN.md` §4.10
