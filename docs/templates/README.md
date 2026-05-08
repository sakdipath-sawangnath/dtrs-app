# ดัชนี — Application Templates (`docs/templates/`)

โฟลเดอร์นี้รวม **แม่แบบเอกสาร (.md) + สำเนา Skill + AGENTS** สำหรับเริ่มโปรเจกต์ใหม่ให้สอดคล้องกับมาตรฐานของแอปต้นแบบ (stack Next.js + NestJS)  
**นำไปใช้กับ Application อื่นได้** โดยคัดลอก **ทั้งโฟลเดอร์ `docs/templates/`** ไปยัง repo ปลายทาง (หรือ zip เฉพาะโฟลเดอร์นี้) แล้วปรับข้อความตามชื่อโปรเจกต์

---

## ไฟล์และโครงสร้างในโฟลเดอร์นี้

| รายการ | เนื้อหา |
|--------|---------|
| [AGENTS.md](./AGENTS.md) | คู่มือ Agent 1 หน้า — Security Gate, DoD UI/API, ลิงก์ไป Skill ในแพ็กเกจ |
| [frontend_template.md](./frontend_template.md) | เทมเพลต Frontend — โครง `frontend/`, checklist |
| [backend_template.md](./backend_template.md) | เทมเพลต Backend — โครง `backend/`, checklist |
| [skills/ui-ux-pro-max/SKILL.md](./skills/ui-ux-pro-max/SKILL.md) | สำเนา Skill UI/UX Pro Max |
| [skills/backend-api-pro/SKILL.md](./skills/backend-api-pro/SKILL.md) | สำเนา Skill Backend API Pro |
| [skills/nestjs-best-practices/SKILL.md](./skills/nestjs-best-practices/SKILL.md) | สำเนา Skill NestJS Best Practices |
| **README.md** (ไฟล์นี้) | ดัชนี + วิธี copy ไปใช้ข้าม repo |

---

## วิธีนำไปใช้กับ Application อื่น

1. **คัดลอกทั้งโฟลเดอร์** `docs/templates/` ไปยังโปรเจกต์ใหม่ (แนะนำเก็บ path เดิม `docs/templates/` เพื่อลิงก์ใน `AGENTS.md` ภายในแพ็กเกจยังใช้ได้)
2. ใน repo ใหม่ ให้ **วาง Skill ให้ Agent/IDE อ่านได้** โดยคัดลอกจาก `templates/skills/` ไปยัง:
   - `frontend/.agents/skills/ui-ux-pro-max/SKILL.md`
   - `backend/.agents/skills/backend-api-pro/SKILL.md`
   - `backend/.agents/skills/nestjs-best-practices/SKILL.md`  
   (หรือ symlink / submodules ตามนโยบายทีม)
3. คัดลอก **`AGENTS.md`** จาก `docs/templates/AGENTS.md` ไปที่ **root ของ monorepo** (หรือแยกฝั่งตามโครงทีม) — ปรับส่วน “ไฟล์/เอกสารที่ควรรู้” ให้ตรง repo ใหม่
4. ใช้ **`frontend_template.md`** / **`backend_template.md`** เป็น checklist โครงสร้าง — แก้ stack ถ้าไม่ใช่ Next/Nest/Prisma

**ไม่ต้อง copy** โค้ดทั้งแอปต้นแบบ — แพ็กเกจนี้มีเอกสาร + Skill พร้อมใช้สำหรับ onboarding และ AI Agent

---

## ความสัมพันธ์กับ repo ต้นแบบ (cctv-app)

- ต้นฉบับ `AGENTS.md` ที่ root: [`../../AGENTS.md`](../../AGENTS.md) (ซิงค์กับโค้ดจริง; สำเนาในโฟลเดอร์นี้อาจล้าหลังเล็กน้อยจนกว่าจะอัปเดต)
- Skill ต้นฉบับ: `frontend/.agents/skills/...`, `backend/.agents/skills/...`
- ดัชนี `docs/` ทั้งหมด: [`../README.md`](../README.md)
