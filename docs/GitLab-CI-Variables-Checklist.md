# Checklist: GitLab CI/CD Variables — `FORTH/dtrs-app`

> **Production:** `https://dtrs-app.forth.co.th` · API ที่ `/api`  
> **อ้างอิง pipeline:** [`.gitlab-ci.yml`](../.gitlab-ci.yml) — UAT (`staging`) + PRD (`main`/`master`); แผน: [`GitLab-CI-Plan.md`](./GitLab-CI-Plan.md)  
> **Migration รวม:** [`DTRS-Migration-Checklist.md`](./DTRS-Migration-Checklist.md)  
> **สถานะ UAT (2026-08-05):** กลุ่ม A scope **`staging` ✅** ตั้งบน GitLab UI แล้ว · SSH/path `.115` พร้อม · **PRD / MinIO ยังไม่ตั้ง**

**ที่ตั้งใน GitLab:** Project **`FORTH/dtrs-app`** → **Settings** → **CI/CD** → **Variables**

---

## วิธีตั้ง (แนะนำ)

| ตั้งค่า | ใช้กับ |
|---------|--------|
| **Masked** | secret (JWT, DB password, MinIO keys, SSH key) |
| **Protected** | ตัวแปร PRD — รันได้เฉพาะ protected branch (`main` / `master`) |
| **Expand variable reference** | เปิด (default) |

**Security:** อย่า commit ค่าจริงลง repo — ใส่เฉพาะใน GitLab Variables หรือ `.env` local (gitignore)

---

## กลุ่ม A — บังคับก่อน deploy (ตั้งได้เลย)

> **Pipeline validate อัตโนมัติ:** job **`deploy:uat:docker`** และ **`deploy:prd:docker`** ใช้ template **`.deploy_ssh_and_validate`** — ถ้าตัวแปรด้านล่าง (ยกเว้น `SSH_PRIVATE_KEY` ที่เช็กใน `.ssh_setup`) ว่างใน scope ของ environment นั้น job จะ **fail ก่อน SSH/deploy** พร้อมข้อความชี้มาที่เอกสารนี้  
> **`MINIO_*` ยังไม่ถูก validate** — deploy ได้แต่อัปโหลดรูปอาจ fail จนกว่าจะตั้งกลุ่ม B

| ☐ | Variable | ส่งเข้า | ค่า PRD แนะนำ | Masked | validate ก่อน deploy |
|---|----------|---------|---------------|--------|
| ☐ | `SSH_PRIVATE_KEY` | SSH deploy | **ชื่อเดียว** — แยกค่า scope **`staging`** / **`production`** (private key ของ **`nurdin@192.168.0.115`** UAT · **`nurdin@192.168.0.128`** PRD) | ✅ | ✅ (`.ssh_setup`) |
| ☐ | `DATABASE_URL` | backend container | **PRD:** `mysql://USER:***@192.168.0.126:3306/dtrs_app` | ✅ | ✅ |
| ☐ | `JWT_SECRET` | backend | **สร้างใหม่** — อย่า reuse จาก `cctv-app_ticket` | ✅ | ✅ |
| ☐ | `NEXTAUTH_SECRET` | frontend container | **สร้างใหม่** | ✅ | ✅ |
| ☐ | `NEXTAUTH_URL` | frontend | `https://dtrs-app.forth.co.th` | | ✅ |
| ☐ | `NEXT_PUBLIC_API_BASE_URL` | build frontend Docker image (`--build-arg`) | `https://dtrs-app.forth.co.th/api` | | — (build time) |
| ☐ | `FRONTEND_BASE_URL` | backend (PDF Puppeteer, อีเมล) + GitLab Environment URL | `https://dtrs-app.forth.co.th` | | ✅ |
| ☐ | `ALLOWED_ORIGINS` | backend CORS | `https://dtrs-app.forth.co.th` (คั่นด้วย comma ถ้ามีหลาย origin) | | ✅ |

> **`NEXT_PUBLIC_API_BASE_URL`** ถูก bake ตอน `docker build` frontend — เปลี่ยนค่าต้อง rebuild image ใหม่

---

## กลุ่ม B — MinIO (⏸️ รอ bucket `dtrs-app` บน server)

| ☐ | Variable | ส่งเข้า | ค่าแนะนำ | Masked |
|---|----------|---------|----------|--------|
| ☐ | `MINIO_ENDPOINT` | backend | IP/hostname MinIO (เช่น `192.168.0.71`) | |
| ☐ | `MINIO_PORT` | backend | `9000` | |
| ☐ | `MINIO_ACCESS_KEY` | backend | จากทีม infra | ✅ |
| ☐ | `MINIO_SECRET_KEY` | backend | จากทีม infra | ✅ |
| ☐ | `MINIO_BUCKET_NAME` | backend | **`dtrs-app`** (แยกจาก `cctv-app`) | |
| ☐ | `MINIO_PUBLIC_URL` | backend (prefix URL ใน DB) | เช่น `https://minio-it.forth.co.th` | |
| ☐ | `MINIO_SERVER_FETCH_BASE_URL` | backend (Nest โหลด object ภายใน LAN) | เช่น `http://192.168.0.71:9000` | |

**หมายเหตุ:** pipeline ปัจจุบัน **ไม่ส่ง** `MINIO_USE_SSL` — backend ใช้ default ในโค้ด; ถ้า PRD ต้อง SSL อาจเพิ่มใน `.gitlab-ci.yml` ภายหลัง

---

## กลุ่ม C — Optional

| ☐ | Variable | จำเป็น? | หมายเหตุ |
|---|----------|---------|----------|
| ☐ | `API_INTERNAL_BASE_URL` | ไม่บังคับ | มี default ใน `.gitlab-ci.yml`: `http://dtrs-app-backend:4100/api` (NextAuth / server-side fetch) |
| ☐ | `SMTP_TLS_REJECT_UNAUTHORIZED` | ไม่บังคับ | `false` ถ้า SMTP ภายใน / certificate self-signed |
| ☐ | `CRON_SECRET` | ไม่บังคับ | ถ้ามี scheduled job ที่ backend ตรวจ secret |

---

## กลุ่ม D — อยู่ใน `.gitlab-ci.yml` แล้ว (override ได้ถ้าต้องการ)

| Variable | ค่า default ใน repo |
|----------|---------------------|
| `DOCKER_HOST_BUILD` | `tcp://192.168.0.115:2375` |
| `DOCKER_HOST_UAT` | `tcp://192.168.0.115:2375` |
| `DOCKER_HOST_PRD` | `tcp://192.168.0.128:2375` — ใช้ใน **`transfer:prd:images`** (`docker load`) และ **`deploy:prd:docker`** |
| `DEPLOY_SERVER_UAT` | `nurdin@192.168.0.115` |
| `DEPLOY_PATH_UAT` | `/home/nurdin/dtrs-app` |
| `DEPLOY_SERVER_PRD` | `nurdin@192.168.0.128` |
| `DEPLOY_PATH_PRD` | `/home/nurdin/dtrs-app` |
| `APP_IMAGE_BACKEND` | `dtrs-app-backend` |
| `APP_IMAGE_FRONTEND` | `dtrs-app-frontend` |
| `API_INTERNAL_BASE_URL` | `http://dtrs-app-backend:4100/api` |

---

## Checklist ตามลำดับทำ

### 1) ตอนนี้ (ไม่รอ MinIO)

- [x] ตั้งกลุ่ม A ครบใน scope **`staging`** (UAT — 2026-08-05)
- [ ] ตั้งกลุ่ม A ครบใน scope **`production`** (PRD)
- [x] `SSH_PRIVATE_KEY` (UAT) — คู่ key `dtrs-app-uat` · public append บน `.115` · **ยืนยันค่าใน GitLab เป็น private คู่ที่ทดสอบ SSH ผ่านแล้ว**
- [x] `DATABASE_URL` (UAT) → `@192.168.0.11:3306/dtrs_app`
- [x] `JWT_SECRET` (UAT) — gen ใหม่ แยกจาก PRD / `cctv-app_ticket`
- [x] `NEXTAUTH_SECRET` (UAT) — gen ใหม่ แยกจาก PRD
- [x] `NEXTAUTH_URL` (UAT) → `http://192.168.0.115:8404`
- [x] `NEXT_PUBLIC_API_BASE_URL` (UAT) → `http://192.168.0.115:8405/api`
- [x] `FRONTEND_BASE_URL` (UAT) → `http://192.168.0.115:8404`
- [x] `ALLOWED_ORIGINS` (UAT) → `http://192.168.0.115:8404`
- [ ] ยืนยัน runner tag **`docker`** (+ `forth`) ใช้ได้กับ project นี้
- [ ] Protected branch = **`main`** (หรือ `master`) — สำหรับ Variables PRD

### 1b) ก่อนกด deploy UAT/PRD ครั้งแรก (DB schema)

> Pipeline **ไม่** รัน `prisma migrate` — ต้อง sync schema กับ DB เป้าหมายก่อน ไม่เช่นนั้น container อาจขึ้นแต่ API 500

- [ ] **UAT:** `cd backend && npx prisma migrate deploy` ชี้ `DATABASE_URL` ของ `@192.168.0.11:3306/dtrs_app` (หรือยืนยัน schema ครบแล้ว)
- [ ] **PRD:** เช่นกันกับ `@192.168.0.126:3306/dtrs_app` ก่อน deploy production
- [ ] มี admin user ใน DB (เช่น `seed-admin.ts`) สำหรับทดสอบ login

### 2) หลังทีม infra สร้าง bucket `dtrs-app`

- [ ] `MINIO_ENDPOINT`
- [ ] `MINIO_PORT`
- [ ] `MINIO_ACCESS_KEY`
- [ ] `MINIO_SECRET_KEY`
- [ ] `MINIO_BUCKET_NAME` → `dtrs-app`
- [ ] `MINIO_PUBLIC_URL`
- [ ] `MINIO_SERVER_FETCH_BASE_URL` (ถ้า Nest โหลดรูปจาก LAN ไม่ได้ผ่าน public URL)

### 3) หลัง deploy ครั้งแรก (ตรวจ)

- [ ] Pipeline `FORTH/dtrs-app` build ผ่าน
- [ ] Image tag `dtrs-app-backend` / `dtrs-app-frontend`
- [ ] Container ชื่อ **`dtrs-app-*`** (ไม่ใช่ `cctv-app-ticket-*`) และ job deploy **ไม่ fail** ที่ health check
- [ ] Login บน UAT `http://192.168.0.115:8404` / PRD `https://dtrs-app.forth.co.th`
- [ ] Container **`cctv-app-ticket-*`** ยังทำงาน (ถ้ายังใช้ production เก่า)
- [ ] อัปโหลดรูป → bucket **`dtrs-app`** (ไม่ไป `cctv-app`)

---

## ตัวอย่างค่า PRD (placeholder — ใส่ secret จริงใน GitLab เท่านั้น)

```env
# --- Deploy / Auth ---
SSH_PRIVATE_KEY=***
DATABASE_URL=mysql://USER:***@192.168.0.126:3306/dtrs_app
JWT_SECRET=***
NEXTAUTH_SECRET=***
NEXTAUTH_URL=https://dtrs-app.forth.co.th
NEXT_PUBLIC_API_BASE_URL=https://dtrs-app.forth.co.th/api
FRONTEND_BASE_URL=https://dtrs-app.forth.co.th
ALLOWED_ORIGINS=https://dtrs-app.forth.co.th
API_INTERNAL_BASE_URL=http://dtrs-app-backend:4100/api

# --- MinIO (หลัง bucket พร้อม) ---
MINIO_ENDPOINT=192.168.0.71
MINIO_PORT=9000
MINIO_ACCESS_KEY=***
MINIO_SECRET_KEY=***
MINIO_BUCKET_NAME=dtrs-app
MINIO_PUBLIC_URL=https://minio-it.forth.co.th
MINIO_SERVER_FETCH_BASE_URL=http://192.168.0.71:9000

# --- Optional ---
SMTP_TLS_REJECT_UNAUTHORIZED=false
CRON_SECRET=***
```

---

## สิ่งที่ CI **ไม่** ส่งเข้า container

ตั้งผ่านหน้าแอปแทน (ไม่ใช่ GitLab Variables):

| รายการ | วิธีตั้ง |
|--------|---------|
| SMTP host / user / password | `/dashboard/settings` → เก็บใน DB (`email_smtp`) |
| เทมเพลตอีเมล | `/dashboard/settings` |
| ชื่อแอป / footer | settings หรือ `NEXT_PUBLIC_APP_*` ตอน build (ถ้าต้องการ) |

---

## Mapping: Variable → container

| Variable | Backend `dtrs-app-backend` | Frontend `dtrs-app-frontend` | Docker build |
|----------|---------------------------|------------------------------|--------------|
| `DATABASE_URL` | ✅ `-e` | | |
| `JWT_SECRET` | ✅ | | |
| `ALLOWED_ORIGINS` | ✅ | | |
| `FRONTEND_BASE_URL` | ✅ | | |
| `MINIO_*` | ✅ | | |
| `SMTP_TLS_REJECT_UNAUTHORIZED` | ✅ | | |
| `CRON_SECRET` | ✅ | | |
| `NEXTAUTH_SECRET` | | ✅ `-e` | |
| `NEXTAUTH_URL` | | ✅ `-e` | |
| `API_INTERNAL_BASE_URL` | | ✅ `-e` | |
| `NEXT_PUBLIC_API_BASE_URL` | | | ✅ `--build-arg` |
| `SSH_PRIVATE_KEY` | deploy script only | | | ✅ ก่อน SSH |

---

## UAT (`staging`) — scope GitLab Environment

> ตัดสินใจแล้ว (grilling 2026-08-05): [`GitLab-CI-Plan.md`](./GitLab-CI-Plan.md)  
> **อัปเดต 2026-08-05:** กลุ่ม A ตั้งบน GitLab UI แล้ว · infra SSH/path บน `.115` พร้อม

| ☐ | Variable | Scope | ค่า UAT | สถานะ |
|---|----------|-------|---------|--------|
| ☑ | `SSH_PRIVATE_KEY` | `staging` | Private key คู่ **`dtrs-app-uat`** ของ **`nurdin@192.168.0.115`** | ✅ บน UI · ยืนยันว่าเป็นไฟล์ private ที่ SSH ผ่านแล้ว |
| ☑ | `DATABASE_URL` | `staging` | `mysql://USER:***@192.168.0.11:3306/dtrs_app` | ✅ |
| ☑ | `JWT_SECRET` | `staging` | **สร้างใหม่** — แยกจาก PRD | ✅ gen 2026-08-05 |
| ☑ | `NEXTAUTH_SECRET` | `staging` | **สร้างใหม่** — แยกจาก PRD | ✅ gen 2026-08-05 |
| ☑ | `NEXTAUTH_URL` | `staging` | `http://192.168.0.115:8404` | ✅ |
| ☑ | `NEXT_PUBLIC_API_BASE_URL` | `staging` | `http://192.168.0.115:8405/api` (bake ตอน **`build:frontend`** + docker build) | ✅ · job `build:frontend` ใช้ `environment: $DTRS_CI_ENV` + `action: prepare` เพื่อ inject scope |
| ☑ | `FRONTEND_BASE_URL` | `staging` | `http://192.168.0.115:8404` | ✅ |
| ☑ | `ALLOWED_ORIGINS` | `staging` | `http://192.168.0.115:8404` | ✅ |
| ☐ | `MINIO_BUCKET_NAME` | `staging` | **`dtrs-app-uat`** (⏸️ รอ infra สร้าง bucket) | ☐ |
| ☐ | `MINIO_*` (endpoint, keys, URLs) | `staging` | จากทีม infra — อาจชี้ MinIO เดียวกับ PRD แต่ bucket แยก | ☐ |

### Infra บน `.115` (คู่กับ Variables UAT)

- [x] Public key `dtrs-app-uat.pub` — **append** ท้าย `~/.ssh/authorized_keys` ของ `nurdin` (ไม่ลบ key EAS / โปรเจกต์อื่น)
- [x] Path `/home/nurdin/dtrs-app` — `drwxr-xr-x` owner `nurdin`
- [x] ทดสอบจากเครื่อง dev: `ssh -i …dtrs-app-uat nurdin@192.168.0.115` → `whoami` + `ls -ld` ผ่าน
- [ ] `DOCKER_HOST=tcp://127.0.0.1:2375 docker ps` บน `.115`

**Deploy path บน `.115` (UAT):** `/home/nurdin/dtrs-app` ✅  
**Deploy path บน `.128` (PRD):** `/home/nurdin/dtrs-app` (ยังไม่เตรียม SSH รอบนี้)

---

## เอกสารที่เกี่ยวข้อง

- [`GitLab-CI-Plan.md`](./GitLab-CI-Plan.md) — แผน pipeline UAT+PRD
- [`.gitlab-ci.yml`](../.gitlab-ci.yml) — pipeline และ default variables
- [`backend/.env.example`](../backend/.env.example) — local backend env
- [`frontend/.env.example`](../frontend/.env.example) — local frontend env
- [`backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md`](../backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md) — NPM 8404/8405
- [`minio.md`](../minio.md) — ตัวแปร MinIO รายละเอียด
- [`DTRS-Migration-Checklist.md`](./DTRS-Migration-Checklist.md) — checklist ย้ายจาก `cctv-app_ticket`
