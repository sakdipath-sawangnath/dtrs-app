# Post-mortem: CI fail หลัง Docker slim — jest mock TDZ + env-scoped `NEXT_PUBLIC`

## 1. Summary

Pipeline branch `staging` ที่ commit `c01b8fc` (`perf(docker): slim images…`) ล้มที่ **`test:backend`** และ **`build:frontend`** หลังเพิ่ม unit test ของ `JobsPdfService` (mock `puppeteer-core`) และบังคับมี `NEXT_PUBLIC_API_BASE_URL` ตอน `next build`. Flow: **CI-deploy** · layer `nest-api` (Jest) + `frontend` (Next build) · env **GitLab / UAT (`staging`)**. แก้ที่ commit **`56bebfd`**: hoist-safe mock ผ่าน `jest.requireMock`, และให้ `build:frontend` map branch → GitLab Environment (`$DTRS_CI_ENV`) ด้วย `environment.action: prepare` เพื่อ inject variable ที่ scope เป็น `staging` / `production`.

## 2. Symptom

- **`test:backend`**: `ReferenceError: Cannot access 'launchMock' before initialization` ที่ `backend/src/jobs/jobs-pdf.service.spec.ts` (suite ไม่รัน)
- **`build:frontend`**: `ERROR: NEXT_PUBLIC_API_BASE_URL is empty (required at next build…)`
- **`test:frontend`**: ผ่าน
- Jobs หลัง build (`deploy:*`, `docker_build:*`, `smoke:*`) ถูก skip

## 3. Root cause

1. **Jest hoist + TDZ** — `jest.mock('puppeteer-core', () => …)` ถูก hoist เหนือ `const launchMock = jest.fn()` แล้ว factory อ้าง `launchMock` ตอนตัวแปรยังไม่ initialize
2. **Environment-scoped CI variable ไม่ถูก inject** — บน GitLab, `NEXT_PUBLIC_API_BASE_URL` ตั้ง scope เป็น Environment `staging` (ดู `docs/GitLab-CI-Variables-Checklist.md`) แต่ job `build:frontend` ใน `.gitlab-ci.yml` **ไม่มี** `environment:` จึงได้ค่าว่าง ต่างจาก `docker_build:uat` ที่มี `environment: name: staging`

## 4. Why it produced the symptom

Jest โหลด spec ไม่ผ่าน → `npm test` exit 1 ทั้งที่ eslint เป็นแค่ warnings · `build:frontend` gate ตรวจ env ว่างแล้ว `exit 1` ก่อน `npm run build` · pipeline แดงและไม่ไปต่อ stage build/deploy

## 5. Fix

Commit **`56bebfd`** (`fix(ci): unbreak backend jest mock and inject NEXT_PUBLIC on build`):

- `jobs-pdf.service.spec.ts`: สร้าง `launch: jest.fn()` **ใน** factory ของ `jest.mock` แล้วดึง mock ด้วย `jest.requireMock('puppeteer-core').default.launch` (ไม่ผูก outer const ใน factory)
- `.gitlab-ci.yml`: เพิ่ม `.rules_ci_branches_with_env` ตั้ง `DTRS_CI_ENV` เป็น `staging` / `production` ตาม branch · `build:frontend` ใช้ `environment.name: $DTRS_CI_ENV` + `action: prepare` (อ่าน scoped vars โดยไม่สร้าง deployment record)
- อัปเดตหมายเหตุใน `docs/GitLab-CI-Variables-Checklist.md`

ไม่แก้โดยการย้าย variable เป็น unscoped (คงแยกค่า UAT/PRD ตาม environment)

## 6. How it was found

- Repro: log GitLab ของ commit `c01b8fce` (ไฟล์ Untitled-3 / Untitled-4 จากผู้ใช้)
- Hypothesis “variable ยังไม่ได้ตั้งบน GitLab” ถูก **disprove** เพราะ checklist ระบุว่า `NEXT_PUBLIC_API_BASE_URL` scope `staging` ตั้งแล้ว
- Hypothesis “eslint ทำให้ test fail” ถูก **disprove** เพราะ log แสดง eslint `0 errors` แล้วค่อย `npm test` fail ที่ suite PDF
- Confirm: เทียบ `.gitlab-ci.yml` — `build:frontend` ไม่มี `environment` ในขณะที่ deploy/docker jobs มี · และรูปแบบ `const` นอก factory ของ `jest.mock` ตรงกับ TDZ ใน stack

## 7. Why it slipped through

- แก้ ESLint `unbound-method` บนเครื่อง local เปลี่ยน mock เป็น outer `launchMock` ใน factory ซึ่ง **ผ่านบนเครื่องบางรอบ** แต่ fail ชัดบน CI fresh `npm ci` + Jest hoist
- Checklist บอกว่าตั้ง variable แล้ว แต่ไม่ได้บังคับว่า **job ที่ bake `NEXT_PUBLIC_*` ต้องมี `environment` ตรง scope**
- ไม่มี regression เล็ก ๆ ใน CI ที่ assert “env จาก environment scope ไม่ว่าง” แยกจาก deploy job

## 8. Validation

- Local (`backend/`): `npm test` — **18/18** รวม `jobs-pdf.service.spec.ts` **7/7** · `npx eslint src/jobs/jobs-pdf.service.spec.ts` — **0 errors** (เหลือ warning `no-unsafe-assignment` จาก `expect.arrayContaining` เหมือน pattern อื่นใน repo)
- Commit/push: `56bebfd` → `origin/staging`
- GitLab pipeline **#2674** (commit `56bebfdb`, branch `staging`): **`test:backend`**, **`test:frontend`**, **`build:backend`**, **`build:frontend`**, **`deploy:summary`** ผ่าน — ยืนยันว่าแก้ TDZ + env inject ของ RCA นี้ได้ผล
- `docker_build:uat` ใน pipeline เดียวกันยัง fail คนละสาเหตุ (`.dockerignore`) — ดู [`ci-runner-dockerignore-excludes-artifacts.md`](ci-runner-dockerignore-excludes-artifacts.md)
- **นอกขอบเขต RCA นี้:** ขนาด Docker image หลัง slim / size gate / smoke UAT

## 9. Action items / follow-ups

- ปิดแล้วบางส่วน: test+build เขียวบน pipeline #2674
- ตาม `docker_build:uat` หลัง `5179c32` (dockerignore) และ size gate — RCA image slim แยกไฟล์เมื่อมีตัวเลข
- คงกฎใน checklist: job ที่ต้องการ env-scoped vars ต้องตั้ง `environment` (แนะนำ `action: prepare` ถ้าไม่ใช่ deploy)
