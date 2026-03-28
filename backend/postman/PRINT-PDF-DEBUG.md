# Postman Debug - Print/PDF

ไฟล์นี้ใช้คู่กับ `CCTV-Print-PDF-Debug.postman_collection.json` เพื่อไล่ตรวจว่าอาการพิมพ์ PDF ไม่ได้เกิดจากจุดไหน (token, สถานะงาน, proxy, หรือเส้น API)

## 1) Import Collection

1. เปิด Postman
2. กด Import
3. เลือกไฟล์ `backend/postman/CCTV-Print-PDF-Debug.postman_collection.json`

## 2) ตั้งค่า Variables

ตั้งค่าที่ Collection Variables:

- `publicBaseUrl` เช่น `https://cctv-app.forth.co.th`
- `apiBase` เช่น `https://cctv-app.forth.co.th/api`
- `jobId` เช่น `282`
- `emailOrUsername` และ `password` ของผู้ใช้ที่มีสิทธิ์ดูงาน

## 3) ลำดับการทดสอบ (แนะนำ)

รันตามลำดับนี้:

1. `01 - Login (Backend Auth)`
2. `02 - Get Job by ID (Backend)`
3. `03 - Get Issue Image 0 (Backend)`
4. `04 - Get Fix Image 0 (Backend)`
5. `05 - Print Data Route (Next API)`
6. `06 - Open Print Page (HTML)`

> Request แรกจะพยายาม set `access_token` ให้อัตโนมัติใน collection variable

## 4) วิธีอ่านผลลัพธ์

- `01 Login`:
  - ควรได้ `200`
  - ถ้า `401` = user/pass ไม่ถูก
- `02 Get Job`:
  - ควรได้ `200` และดู `status`
  - ถ้า `status != RESOLVED` เส้น print data จะถูกปฏิเสธ (`403`)
- `03/04 Image`:
  - ถ้ามีรูปควรได้ `200` และ `content-type: image/*`
  - ถ้า `404` อาจเป็นรูปไม่มีใน index นั้น (ไม่ใช่ระบบล่มเสมอไป)
  - ถ้าได้ HTML แปลว่า proxy/path routing ผิด
- `05 Print Data Route`:
  - ควรได้ `200` และ body เป็น JSON
  - `401` = token/session ไม่ถึง
  - `403` = งานยังไม่ `RESOLVED`
  - ถ้า body เป็น HTML = เส้น `/api/print-jobs/:id/data` โดน route ผิด (มักเป็น nginx)
- `06 Open Print Page`:
  - ควรได้ `200` HTML
  - หน้าโหลดค้างมักเกี่ยวกับ request ในข้อ 5

## 5) เช็คลัดฝั่ง nginx/reverse proxy

ต้องแน่ใจว่า:

- เส้น `/api/backend-auth/*` ส่งไป backend (Nest)
- เส้น `/api/print-jobs/*` ส่งไป frontend (Next)
- รูปหน้าพิมพ์โหลดที่ **`/job-images/*`** บน Next (ไม่อยู่ใต้ `/api` — ไม่ต้องแยก NPM เพิ่ม)
- *(ทางเลือก)* เส้น `/api/job-images/*` ส่งไป frontend (Next) — ถ้าใช้ alias นี้ต้องแยก location แบบเดียวกับ `/api/print-jobs`
- เส้น `/api/jobs/*` ส่งไป backend (Nest)
- มีการส่ง `Authorization` header ต่อไป upstream

## 6) หมายเหตุ

- ถ้า PRD ใช้โดเมนเดียวกับหน้าเว็บ ให้ใช้ `apiBase=https://<domain>/api` ตาม proxy จริง
- ถ้าทดสอบ local ให้ปรับเป็น `http://localhost:3000/api` (Next) หรือ `http://localhost:4000/api` (Backend) ตามที่รันอยู่
