# Post-mortem: `docker_build` ci-runner — `.dockerignore` ตัด artifacts

## 1. Summary

Job **`docker_build:uat`** บน pipeline หลัง commit `56bebfd` ล้มที่ `COPY node_modules` / `dist` ใน `backend/Dockerfile` target **`ci-runner`** ทั้งที่ **`scripts/docker-artifact-gate.sh` ผ่าน** (ไฟล์มีบน runner disk). Flow: **CI-deploy / Docker** · layer `ci-runner` Dockerfile · env **GitLab UAT (`staging`)**. Root cause: `backend/.dockerignore` (และ `frontend/.dockerignore` สำหรับ `.next`) ตัด artifacts ออกจาก Docker **build context** · แก้ที่ commit **`5179c32`** ด้วย [`scripts/docker-ci-allow-artifacts.sh`](../../scripts/docker-ci-allow-artifacts.sh) ก่อน `docker build --target ci-runner`.

## 2. Symptom

Log `docker_build:uat` (commit `56bebfdb`):

- `docker-artifact-gate` → OK `frontend/.next/standalone/server.js`, `backend/node_modules/@prisma/client`, `backend/dist/src/main.js`
- `docker build --target ci-runner -f backend/Dockerfile ./backend` →  
  `ERROR: "/node_modules": not found` และ `"/dist": not found` ที่  
  `COPY --chown=node:node node_modules ./node_modules` (Dockerfile ~บรรทัด 27)
- Pipeline สถานะ warning; `smoke:uat:docker` skip; deploy/cleanup ยังเป็น manual

## 3. Root cause

`.dockerignore` ของ backend มี `node_modules` และ `dist` (frontend มี `.next` และ `node_modules`) เพื่อกัน local **`runner`** ไม่ส่ง host deps/build เข้า context

`docker build` ส่งเฉพาะไฟล์ที่ผ่าน `.dockerignore` ไปยัง daemon (`DOCKER_HOST_BUILD`) — ไฟล์บน workspace ที่ artifact gate เห็น **ไม่เข้า context** → `COPY` ใน stage `ci-runner` หา path ไม่เจอ

สัญญาที่ผิด: สมมติว่า “artifact บน disk = อยู่ใน Docker context”

## 4. Why it produced the symptom

Artifact gate ตรวจ filesystem ของ GitLab job · Docker BuildKit คำนวณ checksum จาก context หลังกรอง ignore → fail ทันทีที่ layer COPY · frontend `ci-runner` จะเจอปัญหาเดียวกันกับ `.next` ถ้า backend ผ่านก่อน

## 5. Fix

Commit **`5179c32`** (`fix(ci): allow artifact paths into Docker context for ci-runner`):

- เพิ่ม [`scripts/docker-ci-allow-artifacts.sh`](../../scripts/docker-ci-allow-artifacts.sh) — ใน workspace CI ลบบรรทัด `node_modules` / `dist` (backend) และ `.next` / `node_modules` (frontend) ออกจาก `.dockerignore`
- `.docker_build_ci_runner` ใน [`.gitlab-ci.yml`](../../.gitlab-ci.yml) เรียกสคริปต์หลัง artifact gate ก่อน `docker build`
- คอมเมนต์ใน `.dockerignore` อธิบายว่า local ยัง ignore; CI เปิดเฉพาะตอน build `ci-runner`
- ไม่ลบ ignore ถาวร (local `docker compose` / `runner` ยังต้องการ)

## 6. How it was found

- Repro: log Untitled-5 จากผู้ใช้บน `docker_build:uat`
- Hypothesis “artifact ไม่ถูก download” ถูก **disprove** เพราะ gate พิมพ์ OK ครบ
- Hypothesis “Dockerfile path ผิด / WORKDIR” ถูก **disprove** เพราะ error เป็น `failed to calculate checksum` ของ context path `"/node_modules"` ไม่ใช่ runtime ใน image
- Confirm: อ่าน `backend/.dockerignore` มี `node_modules` + `dist` ตรงกับไฟล์ที่ COPY fail

## 7. Why it slipped through

- ออกแบบ `ci-runner` ให้ COPY จาก CI artifacts แต่คง `.dockerignore` แบบ local-only โดยไม่มีขั้นตอน “เปิด context สำหรับ CI”
- Artifact gate ตรวจ disk อย่างเดียว ไม่ได้ assert ว่า path ผ่าน ignore เข้า build context
- Local มักใช้ target **`runner`** (`COPY --from=builder`) จึงไม่เจอโหมด `ci-runner` + prebuilt artifacts

## 8. Validation

- Fail path: ยืนยันจาก log `docker_build:uat` (artifact OK + COPY not found)
- Fix: push `5179c32` → `origin/staging`; สคริปต์ + wiring ใน `.gitlab-ci.yml` ครบ
- **`docker_build:uat` หลัง `5179c32`:** ยังไม่ยืนยันผลเขียวจากผู้ใช้ ณ เวลาเขียน RCA — ต้อง re-run manual job แล้วเช็ก size gate ด้วย
- Local Docker daemon บนเครื่อง dev ไม่ได้ใช้ยืนยันรอบนี้

## 9. Action items / follow-ups

- รัน `docker_build:uat` บน pipeline ของ `5179c32` (หรือใหม่กว่า) ให้ผ่าน + บันทึกขนาด image จาก size gate
- (optional) ขยาย artifact gate หรือ CI note: เตือนว่า `.dockerignore` ต้องอนุญาต artifacts ก่อน `ci-runner`
- RCA ขนาด image slim แยกไฟล์เมื่อมีตัวเลข size จริงหลัง optimize
