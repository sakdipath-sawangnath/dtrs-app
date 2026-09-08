# Reverse proxy (Nginx Proxy Manager) สำหรับ dtrs-app

เอกสารนี้อธิบายการแยก path ระหว่าง **Next.js (พอร์ต 8404)** กับ **NestJS (พอร์ต 8405)** ให้สอดคล้องกับโค้ดใน repo — production **`https://dtrs-app.forth.co.th`**

## สถาปัตยกรรม

| บริการ | พอร์ต host (ตัวอย่าง) | หน้าที่ |
|--------|----------------------|---------|
| Next.js | `8404` → 3000 | หน้าเว็บ, NextAuth (`/api/auth/*`), พิมพ์รายงาน (`/api/print-jobs/*`), **รูปงาน (`/job-images/*`)**, **รูปโปรไฟล์แดชบอร์ด (`/user-images/*`)**, **GlitchTip tunnel (`/monitoring`)** |
| NestJS | `8405` → 4100 | REST API ภายใต้ `/api/*` (เช่น `/api/jobs/...`, `/api/roles/...`), PDF (`/api/jobs/:id/report-pdf`), Socket.IO |

- Backend ตั้ง `app.setGlobalPrefix('api')` — path ที่ส่งเข้า Nest ต้องมี **`/api`** นำหน้า (ห้าม strip `/api` ออกจน Nest ได้แค่ `/jobs/...` โดยไม่มี prefix)
- Socket.IO อยู่ที่ **`/socket.io`** (ไม่อยู่ใต้ `/api`) — ต้องส่งต่อไป backend

## Custom locations (แนะนำลำดับนี้)

ใน **Nginx Proxy Manager → Proxy Host → Custom locations** ให้ใส่ **path เฉพาะก่อน** แล้วค่อย **catch-all `/api/`** ทีหลัง (เพื่อไม่ให้ `/api/auth` ไปชนกับ rule ทั่วไปของ `/api/`)

| Location | Forward ไปที่ | เหตุผล |
|----------|----------------|--------|
| `/api/auth` | `http://<IP-เครื่อง>:8404` | NextAuth — `frontend/src/app/api/auth/[...nextauth]/route.ts` |
| `/api/print-jobs` | `http://<IP-เครื่อง>:8404` | โหลดข้อมูลหน้าพิมพ์ — `frontend/src/app/api/print-jobs/[id]/data/route.ts` |
| `/api/job-images` | `http://<IP-เครื่อง>:8404` | *(ไม่บังคับ)* alias เดียวกับรูปงาน — `frontend/src/app/api/job-images/...` — ใช้เมื่อต้องการ path ใต้ `/api` เท่านั้น |
| `/socket.io` | `http://<IP-เครื่อง>:8405` | `EventsGateway` (Socket.IO) |
| `/api/` | `http://<IP-เครื่อง>:8405` | API หลักของ Nest (รวม `/api/jobs/...`, `/api/jobs/.../report-pdf`, `/api/jobs/.../image/...`) |

**ขนาด request อัปโหลด:** ตั้ง `client_max_body_size 50m;` ที่ location `/api/` (หรือใน Advanced config ของ proxy host) — ค่าเริ่มต้น Nginx ~1MB จะได้ **413** ก่อนถึง Nest เมื่อส่ง multipart รูปหลายไฟล์ (3×5MB + ฟิลด์ฟอร์ม). **Deploy checklist:** หลัง deploy ฟีเจอร์จำกัดรูป 5MB ให้ยืนยันค่านี้บน UAT/PRD ก่อนทดสอบอัปโหลดจากมือถือ

**Fallback ฝั่งแอป (เมื่อยังตั้ง NPM ไม่ได้):** frontend จะบีบอัดรูปใน browser อัตโนมัติเมื่อขนาดรวมใกล้เกิน ~1MB หรือเมื่อได้ HTTP **413** แล้วลองส่งใหม่ (`frontend/src/lib/jobImageProxyFallback.ts`) — คุณภาพอาจลดลง; รูป **HEIC** ที่ใหญ่เกินงบประมาณต่อไฟล์ยังต้องแปลงเป็น JPG เอง

ตัวอย่างค่าใน UI ตรงกับรูปที่ตั้งค่าไว้: scheme **http**, forward ไป **192.168.0.128** แยกพอร์ต **8404** / **8405** ตามตารางด้านบน

### Safety-net ฝั่งแอป (เมื่อ `/api/` ยังชี้ไป Next)

ถ้า Custom Location `/api/` ยังไม่ตั้งหรือชี้ผิด ไปที่ Next แทน Nest แล้วเบราว์เซอร์ได้ **404 จาก Next.js** สำหรับ เช่น `/api/public/jobs/...`:

- Frontend มี catch-all `frontend/src/app/api/[[...path]]/route.ts` ทำหน้าที่ **proxy ไป Nest** ผ่าน `API_INTERNAL_BASE_URL` (เช่น `http://dtrs-app-backend:4100/api` ใน Docker)
- **ไม่แทนที่** การตั้ง NPM ที่ถูกต้อง — โดยเฉพาะ **`/socket.io` ยังต้องชี้ Nest โดยตรง** (proxy นี้ไม่ครอบ Socket.IO)
- ต้องมี `API_INTERNAL_BASE_URL` ใน container frontend (CI ส่งค่านี้ตอน deploy อยู่แล้ว)

### หมายเหตุสำคัญ

1. **`/api/jobs/...` ไป Nest โดยตรง**  
   API หลักของงาน (`GET /api/jobs/:id`, list ฯลฯ) ไป Nest ถูกต้อง  
   **รูปใน `<img>` หน้าพิมพ์** ใช้ **`/job-images/:id/:kind/:index`** บน Next (8404) — path ไม่อยู่ใต้ `/api` จึงโดน forward ไป Next ตามปกติแม้ NPM ไม่ได้แยก `/api/job-images` (ถ้าแยกไป Nest จะได้ **404**) — route แนบ Bearer จาก session cookie แล้วค่อยดึงจาก Nest ภายใน ถ้าเบราว์เซอร์เรียก `GET /api/jobs/.../image/...` ไปชน Nest โดยตรงจะได้ **401** เพราะแท็ก `<img>` ไม่ส่ง header `Authorization`  
   *(ทางเลือก)* **`/api/job-images/...`** ทำงานเหมือนกัน แต่ต้องตั้ง NPM แยกไป Next เหมือน `/api/print-jobs`  
   **`/user-images/*`** — โหลดรูปโปรไฟล์แดชบอร์ดบน Next เช่นเดียวกับ `/job-images/*` (แนบ session cookie → proxy ไป Nest `GET /api/users/.../avatar`) — ถ้า forward ทั้งโดเมนหลักไป Next สำหรับ path ที่ไม่ใช่ `/api` อยู่แล้ว มักไม่ต้องแยก location พิเศษ  
   **`/monitoring`** — tunnel envelope ของ `@sentry/nextjs` บน Next (`frontend/src/app/monitoring/route.ts`) — **อย่า** ใส่ใต้ `/api/` (จะไปชน Nest) และ **ไม่ต้อง** ตั้ง Custom Location ถ้า default ของโดเมนชี้ Next `:8404` อยู่แล้ว (เหมือน `/job-images`) — Next จะ forward ไป GlitchTip ที่ `SENTRY_URL` ภายใน LAN เอง  
   **เครือข่าย:** container frontend ทั้ง UAT (`192.168.0.115`) และ PRD (`192.168.0.128`) ต้องออกไป `SENTRY_URL` (ค่าเริ่มต้น `http://192.168.0.115:8700`) ได้ — ถ้า PRD ถึงพอร์ต 8700 ไม่ได้ เบราว์เซอร์นอก LAN จะได้ 502 ที่ `/monitoring` และ server SDK จะส่ง event ไม่ถึง

2. **WebSocket**  
   ที่ Proxy Host หลักควรเปิด **Websockets Support** (ถ้ามี) และ location `/socket.io` ต้องชี้ไป backend

3. **อย่า strip path**  
   ตรวจว่าไม่ได้ตั้งค่าให้ตัด `/api` ออกก่อนส่งต่อ — Nest ต้องได้ URI แบบ `/api/...`

4. **HTTPS ฝั่งผู้ใช้**  
   ใช้ SSL ที่ NPM; ภายใน LAN เป็น `http://192.168.x.x:83xx` ได้ แต่ **ตัวแปร build/runtime** ฝั่ง client ควรเป็น origin จริง เช่น `NEXT_PUBLIC_API_BASE_URL=https://dtrs-app.forth.co.th/api` เพื่อไม่ให้เบราว์เซอร์โหลดทรัพยากรเป็น `http://` จาก IP (Mixed Content)

5. **PDF ฝั่งเซิร์ฟเวอร์**  
   `GET /api/jobs/:id/report-pdf` อยู่ใน Nest — ต้องมี **Chrome/Chromium สำหรับ Puppeteer** ใน container backend (แยกจากการตั้งค่า reverse proxy)

6. **504 Gateway Time-out ตอนกด “ดาวน์โหลด PDF (เซิร์ฟเวอร์)” — ไม่ใช่ routing เดียวกับหน้าพิมพ์**  
   - หน้า **`/print/jobs/:id`** ที่ผู้ใช้เปิดในเบราว์เซอร์ → traffic ไป **Next (8404)** เป็นหลาย request สั้นๆ  
   - ปุ่มดาวน์โหลด → เบราว์เซอร์เรียก **`GET /api/jobs/:id/report-pdf`** ไป **Nest (8405)** request เดียวแต่ **ใช้เวลานาน** — `JobsPdfService` เปิด Chromium ไปที่ `FRONTEND_BASE_URL/print/jobs/:id` ด้วย `waitUntil: networkidle0` และ **timeout ฝั่ง Puppeteer 120 วินาที** (`jobs-pdf.service.ts`) ก่อนค่อย `page.pdf()`  
   - OpenResty/Nginx ค่าเริ่มต้นมัก **`proxy_read_timeout` ~60s** → upstream (Nest) ยังไม่ตอบ → ลูกค้าได้ **504** พร้อม HTML `<title>504 Gateway Time-out</title>`  
   - **แก้ที่ proxy:** เพิ่ม `proxy_connect_timeout`, `proxy_send_timeout`, `proxy_read_timeout` เป็น **อย่างน้อย 180s–300s** สำหรับ location ที่ forward ไป Nest สำหรับ path นี้ (หรือทั้ง `/api/` ไป backend ถ้าแยก snippet ยาก)  
   - ตัวอย่าง snippet (ปรับให้เข้ากับ NPM / custom config ของ host):

     ```nginx
     proxy_connect_timeout 300s;
     proxy_send_timeout 300s;
     proxy_read_timeout 300s;
     ```

## ตัวแปรที่ควรสอดคล้องกับ reverse proxy นี้

- `NEXT_PUBLIC_API_BASE_URL=https://<โดเมน>/api`
- `NEXTAUTH_URL=https://<โดเมน>`
- `API_INTERNAL_BASE_URL=http://<ชื่อ-container-backend>:4100/api` (ภายใน Docker network)
- Backend: `ALLOWED_ORIGINS=https://<โดเมน>`, `FRONTEND_BASE_URL=https://<โดเมน>`
- Backend (ถ้าจำเป็น): **`MINIO_PUBLIC_URL`** = URL สาธารณะที่เก็บในลิงก์รูปใน DB (เช่น `https://minio-it.example.com`) คู่ **`MINIO_SERVER_FETCH_BASE_URL`** = ฐาน HTTP ภายใน LAN ที่ Nest ใช้โหลด object (เช่น `http://192.168.x.x:9000`) เมื่อจาก container backend ต่อไปโดเมนใน `MINIO_PUBLIC_URL` ไม่ได้ (เช่น :443 ปิด แต่ MinIO API รับที่พอร์ต 9000) — รายละเอียด [`../../README.md`](../../README.md), [`../../docs/minio.md`](../../docs/minio.md), [`../../docs/GitLab-CI-Variables-Checklist.md`](../../docs/GitLab-CI-Variables-Checklist.md)

## Troubleshooting: รูปพิมพ์ได้ 502 แต่ browser เปิด MinIO ตรงๆ ได้

- อาการ: DevTools → request **`/job-images/...`** ได้ **502**; log backend มี **`getJobImageBuffer failed`**
- สาเหตุที่พบบ่อย: DNS ภายในชี้โดเมน MinIO ไป IP เดียวกับที่ผู้ใช้ใช้ HTTPS ผ่าน reverse proxy แต่ **จากเซิร์ฟเวอร์/backend ไม่มีบริการ TLS ที่ :443** — `axios` ใน Nest ล้มเหลว
- แนวทาง: ตั้ง **`MINIO_SERVER_FETCH_BASE_URL`** ให้ชี้ไป **MinIO S3 API** ภายใน (มักพอร์ต **9000**, scheme **http** บน LAN) คู่ **`MINIO_PUBLIC_URL`** ที่ตรงกับ prefix ของ URL ใน `Job.images` / `fixImages`; ทดสอบจาก container backend ด้วย `curl -I` ไป URL หลัง rewrite (หรือไป `http://<ip>:9000/...` ตาม policy/bucket)

---

อัปเดตให้สอดคล้องกับ `docker-compose.yml` (8404 / 8405) และ `README.md`
