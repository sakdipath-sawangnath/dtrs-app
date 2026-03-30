# AI Agent Instructions - Skills Reference

> **สำหรับ AI Agent:** อ่านไฟล์นี้ก่อนเริ่มดำเนินการใดๆ ในโปรเจค

## Agent Bootstrap (MUST DO)

ก่อนทำงานใด ๆ ในโปรเจกต์นี้ **ต้องทำตามลำดับ**:

1) **อ่าน Skills พื้นฐานให้ครบ**
- Frontend UI/UX: `frontend/.agents/skills/ui-ux-pro-max/SKILL.md`
- Backend API: `backend/.agents/skills/backend-api-pro/SKILL.md`
- Backend NestJS Patterns: `backend/.agents/skills/nestjs-best-practices/SKILL.md`

2) **เลือกขอบเขตงาน แล้วทำตาม workflow ของ skill**
- งาน UI/UX: ต้องเริ่มจาก “Design System” (ตาม `ui-ux-pro-max`) ก่อน implement/แก้ UI
- งาน Backend/NestJS: ต้องมี validation/authz/error handling ตามแนวทางใน backend skills

3) **Security Gate (ห้ามละเมิด)**
- ห้ามใส่ secrets ลงในไฟล์ `.md` / โค้ด / commit (ใช้ `.env` เท่านั้น)
- ห้าม copy ค่า key/token/password ลงเอกสาร แม้เพื่อ “ตัวอย่าง”
- ถ้าจำเป็นต้องสื่อสารค่า config ให้ใช้ placeholder เช่น `MINIO_SECRET_KEY="***"` และบอกชื่อ env ที่ต้องตั้งแทน

4) **Done Gate (ก่อนส่งงาน)**
- UI: a11y (focus/contrast/aria), responsive 375/768/1024/1440, ไม่มี horizontal scroll, ไม่ใช้ emoji icons
- API: validate input ทุก endpoint, ใช้ Guards ตามสิทธิ์, error เป็นมาตรฐานเดียว, list endpoint มี pagination/filter ตามเหมาะสม

## โครงสร้าง Skills ในโปรเจค

โปรเจคนี้มี Skills สำหรับ AI Agent อยู่ 2 ส่วน:

### 1. Frontend Skills
**ตำแหน่ง:** `/frontend/.agents/skills/`

มี Skills หลักคือ:
- **ui-ux-pro-max** - แนวทางออกแบบ UI/UX ครบวงจร
  - `SKILL.md` - คู่มือการใช้งานและแนวทางการออกแบบ
  - `data/colors.csv` - ชุดสีตามประเภทผลิตภัณฑ์ (97 แพล็ต)
  - `data/styles.csv` - สไตล์ UI ต่างๆ (50+ สไตล์)
  - `data/typography.csv` - ฟอนต์คู่ที่แนะนำ (57 คู่)
  - `data/ux-guidelines.csv` - หลักการ UX ที่สำคัญ
  - `data/charts.csv` - ประเภทกราฟและการใช้งาน
  - `scripts/search.py` - เครื่องมือค้นหา skills

### 2. Backend Skills
**ตำแหน่ง:** `/backend/.agents/skills/`

มี Skills สำหรับ:
- การออกแบบ API
- การจัดการ Database
- Security Best Practices
- และอื่นๆ

## กระบวนการทำงานที่ถูกต้อง

### ก่อนเริ่มงานใดๆ:

1. **ตรวจสอบว่ามี Skills อะไรบ้าง:**
   ```bash
   # Frontend
   ls /frontend/.agents/skills/
   
   # Backend
   ls /backend/.agents/skills/
   ```

2. **อ่าน SKILL.md หลัก:**
   - อ่าน `/frontend/.agents/skills/ui-ux-pro-max/SKILL.md` ก่อนออกแบบ UI
   - อ่าน skill ที่เกี่ยวข้องใน backend ก่อนแก้ไข API

3. **ใช้เครื่องมือค้นหา (Search Script):**
   ```bash
   cd /frontend
   python .agents/skills/ui-ux-pro-max/scripts/search.py "<คำค้น>" --design-system
   ```

### หลักการสำคัญจาก UI/UX Pro Max:

| Priority | Category | สิ่งที่ต้องทำ |
|----------|----------|---------------|
| 1 (CRITICAL) | Accessibility | ไม่ใช้ emoji, focus states ชัด, contrast 4.5:1+ |
| 2 (CRITICAL) | Touch & Interaction | Touch target 44x44px+, cursor-pointer |
| 3 (HIGH) | Performance | Skeleton loading, reduced-motion |
| 4 (HIGH) | Layout & Responsive | ทดสอบ 375px, 768px, 1024px, 1440px |
| 5 (MEDIUM) | Typography & Color | ใช้ CSS variables, ไม่ใช้ inline styles |

## คำสั่งที่ต้องใช้

### สร้าง Design System:
```bash
python .agents/skills/ui-ux-pro-max/scripts/search.py "iot dashboard government" --design-system -p "CCTV System"
```

### ค้นหาเฉพาะด้าน:
```bash
# สี
python .agents/skills/ui-ux-pro-max/scripts/search.py "saas" --domain color

# Typography
python .agents/skills/ui-ux-pro-max/scripts/search.py "professional" --domain typography

# UX Guidelines
python .agents/skills/ui-ux-pro-max/scripts/search.py "accessibility" --domain ux
```

## ข้อห้าม (Anti-Patterns)

❌ **ห้ามทำ:**
- ใช้ emoji เป็น icons (🎨 🚀 ⚙️)
- ใช้ inline styles (`style={{ color: "#xxx" }}`)
- สร้าง components ใหม่โดยไม่ check ว่ามีอยู่แล้ว
- แก้ไขโดยไม่ได้อ่าน skills ก่อน

✅ **ต้องทำ:**
- ใช้ Lucide icons (SVG)
- ใช้ CSS classes จาก globals.css
- ใช้ Tailwind CSS utilities
- อ่าน SKILL.md ก่อนเริ่มงาน

## การตรวจสอบก่อนส่งงาน (Pre-Delivery Checklist)

- [ ] ไม่มี emoji icons
- [ ] ทุก interactive element มี cursor-pointer
- [ ] Focus states มองเห็นชัด
- [ ] Text contrast 4.5:1+
- [ ] Responsive ทุก breakpoint
- [ ] ไม่มี horizontal scroll บน mobile
- [ ] ใช้ aria-label บน icon-only buttons

---

## เอกสารโปรเจกต์ (อ้างอิงฟีเจอร์/API)

- ภาพรวมและตาราง endpoint: `README.md` (บันทึกการอัปเดตล่าสุดที่ส่วนต้นไฟล์), `STATUS.md`
- แผน/งาน: `PLAN.md`, `TASK.md` (Phase 6.4 = SMTP… · **6.7 = เทมเพลตอีเมล** · **6.8 = `CrudModal` (portal/z-100) + หน้า `/dashboard/roles` (`form-input-glass`)** · **6.9 = `/job-images`, `MINIO_SERVER_FETCH_BASE_URL`, 502 รูป** · **Private MinIO = `/user-images`, avatar API, `MINIO_ENSURE_PUBLIC_READ_POLICY` default false** — สรุปใน `docs/Project-Plan-Private-MinIO-Images.md`)
- พิมพ์รายงาน + reverse proxy (NPM): `backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md` — รูปงาน **`/job-images/*`**, รูปโปรไฟล์ **`/user-images/*`** บน Next; ตัวแปร MinIO: `minio.md`
- ดัชนีโฟลเดอร์เอกสาร: `docs/README.md`
- อีเมลแจ้งงาน (To/CC, `publicBaseUrl`, Role): `docs/Email-Notifications.md`
- RBAC: `backend/docs/RBAC-Setup.md`
- สรุป API เป็น JSON: `backend/docs/api-endpoints.json`
- Postman: `backend/postman/README.md`

**หมายเหตุ:** ไฟล์นี้อยู่ที่ `/AGENT_INSTRUCTIONS.md` ให้อ่านทุกครั้งก่อนเริ่มงาน
