# Application Template — Frontend (Next.js)

เอกสารนี้เป็น **แม่แบบสำหรับโปรเจกต์ใหม่** ที่ต้องการยึดพื้นฐานเดียวกับแอปพลิเคชันนี้ (CCTV Maintenance / stack เดียวกัน)  
ใช้คู่กับ `backend_template.md` และ [`AGENTS.md`](./AGENTS.md) ในโฟลเดอร์นี้ (ส่วน Definition of Done — UI)

---

## 1. วัตถุประสงค์

- ให้ทีม/Agent รู้ว่าต้อง **คัดลอก Skill อะไร**, **จัดโฟลเดอร์อย่างไร**, และ **มาตรฐาน UI ขั้นต่ำ** ก่อนเริ่มเขียนหน้าจริง
- ลด drift ระหว่างแอปหลายตัว (ดีไซน์, a11y, โครงแดชบอร์ด)

---

## 2. Skill ที่ต้องมีใน repo ใหม่

| Skill | ในแพ็กเกจ `docs/templates/` | หลังวางใน repo แอปใหม่ | ใช้ทำอะไร |
|--------|------------------------------|------------------------|-----------|
| **ui-ux-pro-max** | [`skills/ui-ux-pro-max/SKILL.md`](./skills/ui-ux-pro-max/SKILL.md) | `frontend/.agents/skills/ui-ux-pro-max/SKILL.md` | เกณฑ์ a11y, touch 44px, responsive, ไม่ใช้ emoji เป็น icon, focus, contrast |
| **AGENTS.md** | [`AGENTS.md`](./AGENTS.md) | root `AGENTS.md` | Dark Glassmorphism, No-Card Layout, `form-input-glass`, `CrudModal` + portal/z-index |

**ขั้นตอน bootstrap repo ใหม่**

1. จากโฟลเดอร์ `docs/templates/` คัดลอก `skills/ui-ux-pro-max/SKILL.md` ไปยัง `frontend/.agents/skills/ui-ux-pro-max/SKILL.md`
2. คัดลอก [`AGENTS.md`](./AGENTS.md) ไปที่ root ของ monorepo (หรือเฉพาะ `frontend/`) แล้วปรับข้อความให้ตรงชื่อโปรเจกต์ — คง **Definition of Done — UI** ไว้ถ้าต้องการ visual เดียวกัน

---

## 3. เทคโนโลยีหลัก (อ้างอิงจากแอปนี้)

| หมวด | ค่าแนะนำ |
|--------|----------|
| Framework | **Next.js** (App Router) |
| UI | **React**, **Tailwind CSS** |
| Icons | **Lucide React** (ชุดเดียวทั้งแอป) |
| Auth (ถ้ามี) | **NextAuth** + JWT ไป backend |
| HTTP | **axios** + helper แกะ `{ data }` จาก API (เช่น `unwrapApiData`) |
| Toast / Dialog | ตามที่โปรเจกต์กำหนด (เช่น SweetAlert2 + toast lib) |

ปรับเวอร์ชันใน `package.json` ตามโปรเจกต์ใหม่ — ไม่บังคับเลขเวอร์ชันเดียวกับต้นแบบ

---

## 4. โครงสร้างโฟลเดอร์แนะนำ

```
frontend/
├── .agents/skills/ui-ux-pro-max/SKILL.md
├── src/
│   ├── app/                    # App Router — routes, layout, globals
│   │   ├── globals.css         # form-input-glass, z-index scale, utilities
│   │   ├── dashboard/          # โซนหลังล็อกอิน
│   │   ├── public/             # หน้าสาธารณะ (ถ้ามี)
│   │   └── login/
│   ├── components/             # Shell, Modal, Table, Layout ร่วม
│   ├── hooks/                  # เช่น pagination ตาราง
│   └── lib/                    # apiResponse, formatters, constants
├── next.config.mjs             # แนะนำ .mjs ถ้า production image ไม่รวม typescript
└── package.json
```

**หลักการ**

- หน้า **แดชบอร์ด**: layout shell เดียว (sidebar + header), เนื้อหา **No-Card** ยกเว้นที่ออกแบบเป็นพิเศษ (เช่น overview)
- คอมโพเนนต์ร่วม: `CrudModal` (portal → `document.body`, `z-100`), ตาราง + pagination แยก reusable

---

## 5. มาตรฐาน UI (สรุปจาก AGENTS.md)

- **พื้นหลัง**: `bg-[#020617]` หรือ `bg-slate-950`
- **กล่องแก้ว**: `rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl`
- **Input แดชบอร์ด**: class **`form-input-glass`** ใน `globals.css` (ไม่ใช้ชุด input โทนสว่างกับพื้นมืด)
- **ปุ่ม**: `rounded-xl transition-all active:scale-95 shadow-lg` — ยืนยันหลัก Blue/Red, ยกเลิก Slate-800
- **Responsive**: ทดสอบ breakpoint 375 / 768 / 1024 / 1440 — ไม่ให้เนื้อหาถูกบังโดย header คงที่

---

## 6. Accessibility & Interaction (สอดคล้อง Skill)

- Focus ชัด (`focus-visible:ring-*`)
- เป้าแตะ ≥ **44×44px**
- ปุ่ม async: **disabled** ระหว่างโหลด + feedback error ใกล้ฟิลด์
- ปุ่มมีแค่ icon: ต้องมี **`aria-label`**
- คลิกได้: `cursor-pointer` (หรือชัดเจนว่าเป็นลิงก์/ปุ่ม)

---

## 7. Checklist ก่อนเริ่มฟีเจอร์ใหม่

- [ ] มี `SKILL.md` + `AGENTS.md` (หรือลิงก์ไป root) ใน repo
- [ ] `globals.css` มี token สำหรับ glass form / z-index modal
- [ ] กำหนด **ชื่อ env** สำหรับ `NEXT_PUBLIC_API_BASE_URL` (ไม่ hardcode secret)
- [ ] หน้าใช้ `Suspense` ครอบ `useSearchParams` ถ้า Next.js เวอร์ชันร้องขอ
- [ ] ตารางรายการยาว: มี pagination / page size ตามดีไซน์โปรเจกต์
- [ ] `package.json` มีสคริปต์ **`security:audit`** / **`security:audit:prod`** (`npm audit`) เพื่อเช็ค advisory — **ไม่แทน**การรีวิว dependency หรือสแกนมัลแวร์

---

## 8. สิ่งที่ไม่ใส่ในเทมเพลตนี้ (ปรับตามโดเมน)

- ธุรกิจเฉพาะ (เช่น งานซ่อม, MinIO, พิมพ์ PDF) — ย้ายเป็น `docs/` ของโปรเจกต์นั้น
- รายการ route จริง — สร้างเมื่อรู้เมนู/สิทธิ์ของแอปใหม่

---

## 9. อ้างอิงในแอปต้นแบบ

- `frontend/src/app/globals.css` — `form-input-glass`, utilities
- `frontend/src/lib/apiResponse.ts` — แกะ envelope API
- คอมโพเนนต์ shell/modal ภายใต้ `frontend/src/components/`
