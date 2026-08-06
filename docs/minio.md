# MinIO — ตัวแปรสภาพแวดล้อมและหมายเหตุการ deploy

**ห้ามใส่ secrets จริงในไฟล์เอกสารหรือ commit** — ใช้ `.env` / GitLab Variables และ placeholder เช่น `***`

แผนรูปแบบ private bucket + proxy: [`Project-Plan-Private-MinIO-Images.md`](./Project-Plan-Private-MinIO-Images.md)

การสแกนและลบ object ที่ไม่อ้างอิงจาก DB (orphan): [`MinIO-Orphan-Cleanup.md`](./MinIO-Orphan-Cleanup.md)

**GitLab CI Variables (กลุ่ม B):** ตั้งบน UI แล้ว (2026-08-06) — ดู [`GitLab-CI-Variables-Checklist.md`](./GitLab-CI-Variables-Checklist.md)  
· `MINIO_PORT` / `MINIO_PUBLIC_URL` / `MINIO_SERVER_FETCH_BASE_URL` = scope **all**  
· bucket แนะนำ: UAT **`dtrs-app-uat`** · PRD **`dtrs-app`** (อย่าใช้ `cctv-app`)

---

## พฤติกรรมใน production

- ค่าเริ่มต้น **`MINIO_ENSURE_PUBLIC_READ_POLICY=false`** — backend **ไม่** ตั้ง public read บน bucket ตอนสตาร์ท
- ถ้า bucket เคยมี policy / **Anonymous** แบบเปิดอ่านสาธารณะไว้แล้ว ต้องไปแก้ที่ **MinIO Console** เอง (โค้ดไม่ลบ policy เก่าให้)
- รูปใน UI โหลดผ่าน Nest + cookie/session ผ่าน Next: **`/job-images/...`**, **`/user-images/...`** (ดู [`../backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md`](../backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md))

---

## ตัวแปรที่ใช้ใน backend (ตัวอย่างรูปแบบ)

```env
MINIO_ENDPOINT="192.168.x.x"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="***"
MINIO_SECRET_KEY="***"
MINIO_BUCKET_NAME="dtrs-app-uat"
MINIO_PUBLIC_URL="https://minio-it.forth.co.th"
MINIO_SERVER_FETCH_BASE_URL="http://192.168.x.x:9000"
```

- **`MINIO_BUCKET_NAME`** — UAT: **`dtrs-app-uat`** · PRD: **`dtrs-app`** (แยกจาก `cctv-app` / `cctv-report-images`)
- **`MINIO_PUBLIC_URL`** — URL สาธารณะที่ใช้เป็น prefix ของลิงก์รูปใน DB
- **`MINIO_SERVER_FETCH_BASE_URL`** — *(แนะนำใน Docker)* ฐาน HTTP ภายใน LAN ให้ Nest โหลด object เมื่อจาก container ต่อ `MINIO_PUBLIC_URL` ไม่ได้ — โค้ดจะ rewrite เฉพาะส่วนที่ขึ้นต้นด้วย `MINIO_PUBLIC_URL` ใน URL ที่เก็บใน `Job.images` / `Job.fixImages` / รูปผู้ใช้

รายละเอียดเชื่อมกับ CI: [`../README.md`](../README.md) · Migration: [`DTRS-Migration-Checklist.md`](./DTRS-Migration-Checklist.md)
