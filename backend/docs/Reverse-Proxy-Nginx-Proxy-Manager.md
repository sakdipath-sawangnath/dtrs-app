# Reverse proxy (Nginx Proxy Manager) สำหรับ CCTV App

เอกสารนี้อธิบายการแยก path ระหว่าง **Next.js (พอร์ต 8309)** กับ **NestJS (พอร์ต 8310)** ให้สอดคล้องกับโค้ดใน repo

## สถาปัตยกรรม

| บริการ | พอร์ต host (ตัวอย่าง) | หน้าที่ |
|--------|----------------------|---------|
| Next.js | `8309` → 3000 | หน้าเว็บ, NextAuth (`/api/auth/*`), Route Handler พิมพ์รายงาน (`/api/print-jobs/*`) |
| NestJS | `8310` → 4000 | REST API ภายใต้ `/api/*` (เช่น `/api/jobs/...`, `/api/roles/...`), PDF (`/api/jobs/:id/report-pdf`), Socket.IO |

- Backend ตั้ง `app.setGlobalPrefix('api')` — path ที่ส่งเข้า Nest ต้องมี **`/api`** นำหน้า (ห้าม strip `/api` ออกจน Nest ได้แค่ `/jobs/...` โดยไม่มี prefix)
- Socket.IO อยู่ที่ **`/socket.io`** (ไม่อยู่ใต้ `/api`) — ต้องส่งต่อไป backend

## Custom locations (แนะนำลำดับนี้)

ใน **Nginx Proxy Manager → Proxy Host → Custom locations** ให้ใส่ **path เฉพาะก่อน** แล้วค่อย **catch-all `/api/`** ทีหลัง (เพื่อไม่ให้ `/api/auth` ไปชนกับ rule ทั่วไปของ `/api/`)

| Location | Forward ไปที่ | เหตุผล |
|----------|----------------|--------|
| `/api/auth` | `http://<IP-เครื่อง>:8309` | NextAuth — `frontend/src/app/api/auth/[...nextauth]/route.ts` |
| `/api/print-jobs` | `http://<IP-เครื่อง>:8309` | โหลดข้อมูลหน้าพิมพ์ — `frontend/src/app/api/print-jobs/[id]/data/route.ts` |
| `/socket.io` | `http://<IP-เครื่อง>:8310` | `EventsGateway` (Socket.IO) |
| `/api/` | `http://<IP-เครื่อง>:8310` | API หลักของ Nest (รวม `/api/jobs/...`, `/api/jobs/.../report-pdf`, `/api/jobs/.../image/...`) |

ตัวอย่างค่าใน UI ตรงกับรูปที่ตั้งค่าไว้: scheme **http**, forward ไป **192.168.0.128** แยกพอร์ต **8309** / **8310** ตามตารางด้านบน

### หมายเหตุสำคัญ

1. **`/api/jobs/...` ไป Nest โดยตรง**  
   ใน repo มี Route Handler ที่ `frontend/src/app/api/jobs/[id]/image/...` เป็นตัว proxy ไป Nest — เมื่อ reverse proxy ส่ง `/api/` ไปพอร์ต **8310** แล้ว คำขอจะถึง **Nest โดยตรง** (ไม่ผ่าน Next) ซึ่งถูกต้อง เพราะ Nest มี `GET /api/jobs/:id/image/...` อยู่แล้ว

2. **WebSocket**  
   ที่ Proxy Host หลักควรเปิด **Websockets Support** (ถ้ามี) และ location `/socket.io` ต้องชี้ไป backend

3. **อย่า strip path**  
   ตรวจว่าไม่ได้ตั้งค่าให้ตัด `/api` ออกก่อนส่งต่อ — Nest ต้องได้ URI แบบ `/api/...`

4. **HTTPS ฝั่งผู้ใช้**  
   ใช้ SSL ที่ NPM; ภายใน LAN เป็น `http://192.168.x.x:83xx` ได้ แต่ **ตัวแปร build/runtime** ฝั่ง client ควรเป็น origin จริง เช่น `NEXT_PUBLIC_API_BASE_URL=https://cctv-app.forth.co.th/api` เพื่อไม่ให้เบราว์เซอร์โหลดทรัพยากรเป็น `http://` จาก IP (Mixed Content)

5. **PDF ฝั่งเซิร์ฟเวอร์**  
   `GET /api/jobs/:id/report-pdf` อยู่ใน Nest — ต้องมี **Chrome/Chromium สำหรับ Puppeteer** ใน container backend (แยกจากการตั้งค่า reverse proxy)

## ตัวแปรที่ควรสอดคล้องกับ reverse proxy นี้

- `NEXT_PUBLIC_API_BASE_URL=https://<โดเมน>/api`
- `NEXTAUTH_URL=https://<โดเมน>`
- `API_INTERNAL_BASE_URL=http://<ชื่อ-container-backend>:4000/api` (ภายใน Docker network)
- Backend: `ALLOWED_ORIGINS=https://<โดเมน>`, `FRONTEND_BASE_URL=https://<โดเมน>`

---

อัปเดตให้สอดคล้องกับ `docker-compose.yml` (8309 / 8310) และ `README.md`
