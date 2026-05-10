# Application Template — Backend (NestJS + Prisma)

เอกสารนี้เป็น **แม่แบบสำหรับ API ใหม่** ที่ต้องการยึดพื้นฐานเดียวกับแอปพลิเคชันนี้  
ใช้คู่กับ [`frontend_template.md`](./frontend_template.md) และ [`AGENTS.md`](./AGENTS.md) ในโฟลเดอร์นี้ (ส่วน Definition of Done — API/NestJS)

---

## 1. วัตถุประสงค์

- ระบุ **Skill**, **โครงโมดูล**, และ **เกณฑ์ความปลอดภัย/validation** ก่อนเพิ่ม endpoint
- ให้โครงสร้างคล้ายแอปต้นแบบ: Nest feature modules, Prisma, Guards, DTO, exception กลาง

---

## 2. Skill ที่ต้องมีใน repo ใหม่

| Skill | ในแพ็กเกจ `docs/templates/` | หลังวางใน repo แอปใหม่ | ใช้ทำอะไร |
|--------|------------------------------|------------------------|-----------|
| **backend-api-pro** | [`skills/backend-api-pro/SKILL.md`](./skills/backend-api-pro/SKILL.md) | `backend/.agents/skills/backend-api-pro/SKILL.md` | แบบ API, security, validation, error shape, DB patterns (แนวทางทั่วไป + Express-oriented — นำมาประยุกต์กับ Nest) |
| **nestjs-best-practices** | [`skills/nestjs-best-practices/SKILL.md`](./skills/nestjs-best-practices/SKILL.md) | `backend/.agents/skills/nestjs-best-practices/SKILL.md` | โมดูลตาม feature, DI, Guards, HttpException, ORM, testing |
| **AGENTS.md** | [`AGENTS.md`](./AGENTS.md) | root `AGENTS.md` | Validation ทุก endpoint, AuthN/AuthZ, error filter กลาง, list มี pagination เมื่อจำเป็น |

**ขั้นตอน bootstrap repo ใหม่**

1. จาก `docs/templates/skills/` คัดลอก `backend-api-pro/SKILL.md` และ `nestjs-best-practices/SKILL.md` ไปยัง `backend/.agents/skills/...` ตามตารางด้านบน
2. ใช้ [`AGENTS.md`](./AGENTS.md) ที่ root ให้ทีมอ่าน **Security Gate** (ห้าม secrets ใน repo — ใช้ `.env` + placeholder ในเอกสาร)

---

## 3. เทคโนโลยีหลัก (อ้างอิงจากแอปนี้)

| หมวด | ค่าแนะนำ |
|--------|----------|
| Runtime | **Node.js** + **TypeScript** |
| Framework | **NestJS** |
| ORM | **Prisma** (`schema.prisma`, migrations) |
| Validation | **class-validator** + **class-transformer** (DTO + `ValidationPipe`) |
| Auth | **JWT** + **Passport** (ตามความเหมาะสม) + **Guards** / Roles |
| Test | **Jest** + **Supertest** (e2e เมื่อ scope เอื้อ) |

---

## 4. โครงสร้างโฟลเดอร์แนะนำ

```
backend/
├── .agents/skills/
│   ├── backend-api-pro/SKILL.md
│   └── nestjs-best-practices/SKILL.md
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── prisma/
│   ├── auth/
│   ├── roles/              # RBAC (ถ้าใช้แบบต้นแบบ)
│   ├── <feature>/          # โมดูลตาม domain — controller, service, dto, guards
│   └── common/             # filters, interceptors, decorators (ถ้ามี)
├── Dockerfile
├── package.json
└── docs/                   # RBAC, Postman, api-endpoints.json
```

**หลักการ Nest (จาก nestjs-best-practices)**

- จัด **ตาม feature** ไม่ใช่แยกชั้น technical หนาเกินไป
- **Validate input ก่อนแตะ DB** — DTO + pipe
- Endpoint **public** ต้องมีเหตุผลและเอกสาร (rate limit / เฉพาะข้อมูลที่ปลอดภัย)
- **เลี่ยง N+1** — `include`/`select` ชัดเจน, transaction เมื่อหลายขั้นตอน

---

## 5. API & Error (สรุปจาก AGENTS + Skill)

- ใช้ **HttpException** / exception filter กลาง — status และ body รูปแบบสม่ำเสมอ
- List endpoints: **pagination / filter / sort** ตามความจำเป็น
- ไม่ log หรือส่งคืน **password / secret / token** ใน response

---

## 6. Security Gate (ห้ามละเมิด — จาก AGENTS.md)

- ไม่ commit **secrets** (access key, secret key, token, password)
- ค่าจริงอยู่ที่ **`.env`** / secret manager — ในเอกสารใช้ `***`

---

## 7. Deploy / Build ข้อสังเกตจากแอปต้นแบบ

- **Entry production**: ตรวจว่า `Dockerfile` / `npm run start:prod` ชี้ไฟล์ที่ build ออกจริง (ในแอปนี้ใช้ **`node dist/src/main.js`** เพราะผล `nest build` อยู่ใต้ `dist/src/`)
- **CORS**: `ALLOWED_ORIGINS` ตั้ง origin ของ frontend จริง
- ถ้ามี reverse proxy: แยก path `/api`, WebSocket (`/socket.io`) ตามเอกสารโปรเจกต์
- **`docker-compose.yml` (ทดสอบ local)**: พิจารณา **`deploy.resources.limits`** (CPU/RAM) และ **`pids_limit`** เพื่อกันคอนเทนเนอร์ยึดทรัพยากร host และตรวจว่าไม่ mount path host ที่ไม่จำเป็น

บันทึกรายละเอียดเฉพาะเครื่อง deploy ไว้ใน `README.md` ของโปรเจกต์ใหม่ — ไม่ฝัง secret

---

## 8. เอกสารประกอบที่มักสร้างคู่ backend

| เอกสาร | หน้าที่ |
|---------|---------|
| `backend/docs/api-endpoints.json` หรือ OpenAPI | ดัชนี endpoint |
| `backend/postman/*.json` | ทดสอบมือ / QA |
| `backend/docs/RBAC-Setup.md` | ถ้าใช้ permission แบบ dynamic |

---

## 9. Checklist ก่อนเพิ่มโมดูลใหม่

- [ ] มี DTO + validation pipe สำหรับ body/query/params
- [ ] ใส่ Guard ให้ถูกต้อง (public vs JWT vs role/permission)
- [ ] Service ไม่พ่น raw DB error — แปลงเป็น HTTP ที่เหมาะสม
- [ ] Migration Prisma ทดสอบบน DB dev ก่อน merge
- [ ] (ถ้ามี) อัปเดต `api-endpoints.json` / Postman
- [ ] `package.json` มี **`security:audit`** / **`security:audit:prod`** และรันเป็นระยะ (`npm audit` = เฉพาะ advisory)

---

## 10. สิ่งที่ไม่ใส่ในเทมเพลตนี้

- Schema ตารางเฉพาะธุรกิจ (งานซ่อม, ไฟล์, ฯลฯ) — ออกแบบใหม่ตามโดเมน
- Integration พิเศษ (SMTP, MinIO, Puppeteer) — ย้ายเป็น `docs/` เฉพาะโปรเจกต์

---

## 11. อ้างอิงในแอปต้นแบบ

- `backend/src/main.ts` — global prefix, validation, CORS
- `backend/docs/RBAC-Setup.md` — แนว RBAC
- `backend/postman/README.md` — การใช้งาน collection
