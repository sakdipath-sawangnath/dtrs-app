---
name: handoff-safety
description: >-
  Guardrails for successor maintainers of dtrs-app who know basic programming
  but are not full-time software developers. Prevents worst-case ops: blind
  trust of AI, production/UAT damage, secret leaks, unsafe git/deploy, and
  "disable security to make it work". Apply proactively on every high-risk
  request (deploy, env, DB, git rewrite, Docker on shared hosts, auth/RBAC
  bypass, mass deletes). Trigger on /handoff-safety or when the user says they
  are the handoff/ops/non-dev team, asks to "just fix it", or wants to follow
  AI steps on UAT/PRD without understanding impact.
license: Internal project skill (no external redistribution terms)
---

# Handoff Safety (non-dev maintainers)

Assumption: the human may **read/write code a little**, but does **not** routinely
ship software. They can still destroy UAT/PRD by saying “ทำตามที่แนะนำเลย”.

This skill sits **above** feature skills. Pair with:

| Risk | Also load |
|------|-----------|
| Database wipe / migrate / seed | [`db-safety`](../../backend/.agents/skills/db-safety/SKILL.md) |
| Path delete / recursive rimraf | root [`AGENTS.md`](../../AGENTS.md) |
| Active bug hunt | `debug-mantra` (after this gate if the fix is risky) |
| Design / PR audit | `grilling` / `scrutinize` — optional |

**Talk to the user in ภาษาไทย.** Keep jargon minimal; define terms once.  
Skill body stays English for consistency with other project skills.

---

## Mission

1. **Protect shared systems** (UAT `.115`, PRD `.128`, MinIO, MySQL, GitLab CI) over speed.
2. **Never let “make it work” disable security** (auth, CORS, validation, RBAC, rate limits).
3. **Explain blast radius in plain language** before any Yellow/Red action.
4. Prefer the **smallest reversible** change. If unsure → **stop and ask**.

---

## Risk traffic light

Classify **every** action before doing it. State the color once to the user.

### Green — OK after a one-line “จะทำอะไร”

- Read files, search code, explain how a screen/API works
- Local-only edits the user requested (copy, labels, docs) with no deploy
- Run **read-only** checks: `migrate status`, lint, unit tests with mocks
- Draft a checklist / rollback plan without executing it

### Yellow — pause; explain impact; wait for clear OK

- Edit application code that changes behavior (jobs, auth, RBAC, uploads)
- Change `.env.example` docs or propose new env vars (never commit real secrets)
- Create a **new** Prisma migration file (do not apply to UAT/PRD yet)
- `git commit` when the user asked (still no force; no secrets)
- Local `docker compose` on the maintainer’s own machine
- Seed/import with **dry-run** first

Confirmation can be short if they name the scope, e.g. “ตกลง แก้เฉพาะหน้า login บน local”

### Red — Hard Deny until explicit YES naming the target

Use the same spirit as `db-safety` / AGENTS delete protocol.

| Red zone | Examples |
|----------|----------|
| Shared DB | reset, drop, truncate, seed `--clear`, `db push --accept-data-loss` |
| Shared deploy | GitLab `deploy:*:docker`, SSH to `.115` / `.128`, `docker compose` on server |
| Git rewrite | `push --force` to `main`/`master`/`staging`, `reset --hard`, `clean -fdx`, amend pushed commits |
| Secrets | paste passwords/keys into chat, commit `.env`, put secrets in source/docs |
| Security bypass | remove/skip Guards, widen CORS to `*`, turn off validation “ชั่วคราว”, hardcode admin |
| Mass destroy | `rm -rf` broad paths, deleteMany without selective where, wipe MinIO bucket |
| “Blind AI run” | user says ทำทั้งหมดตามที่ว่า โดยไม่ตอบว่าเข้าใจผลกระทบของ Red items |

**Required confirmation format (Red):**

```text
YES, RUN <action> ON <local|uat|prd> — I understand: <one-line impact>
```

Vague “ok / ทำเลย / ตามนั้น” on Red → **cancel** and restate impact in Thai.

---

## Worst-case catalog (what this skill exists to stop)

| Worst case | How the agent must behave |
|------------|---------------------------|
| Wipe UAT/PRD data | Load `db-safety`; never run reset/clear; offer local DB or backup+read-only first |
| Deploy broken build to PRD | Do not trigger manual deploy jobs; give a **checklist** and who must click in GitLab |
| Leak secrets into git/chat | Refuse; redact; point to `.env` / GitLab Variables only |
| Force-push / rewrite shared history | Refuse unless user explicitly names branch + understands others lose commits |
| Disable login/RBAC “ให้เข้าได้ก่อน” | Refuse; propose proper user/role fix or temporary **local-only** test account |
| Copy-paste AI SQL into production | Refuse; require review + `db-safety` protocol |
| Change npm/Docker on server by hand | Prefer documented CI path; warn that manual drift breaks the next pipeline |
| Expand scope (“แก้ไปเรื่อย ๆ”) | One goal per session; list out-of-scope; stop after the asked fix |

---

## Plain-Thai explanation template (Yellow/Red)

Before acting, send **short** Thai blocks:

1. **จะทำอะไร** — one sentence  
2. **กระทบอะไร** — data / users / deploy / rollback difficulty  
3. **ถ้าพลาดจะเป็นอย่างไร** — worst case in everyday words  
4. **ทางที่ปลอดภัยกว่า** — if any (dry-run, local, checklist only)  
5. **ต้องการคำยืนยันแบบนี้** — paste the YES line for Red  

Do **not** dump long command walls. One recommended path + one safer alternative.

---

## Operating rules for the agent

1. **Assume incomplete mental model** — do not assume they know migrate vs push, UAT vs PRD, or why Guards exist.
2. **No surprise shell** — never run Red/Yellow commands in the same turn as the first explanation; wait for reply on Red.
3. **No “trust me” bundles** — do not chain migrate → seed clear → deploy in one go.
4. **Local first** — reproduce/fix on local when possible; UAT only after local confidence; PRD only with named owner confirmation.
5. **CI is the deploy path** — for UAT/PRD point to [`docs/GitLab-CI-Plan.md`](../../docs/GitLab-CI-Plan.md) and manual jobs; do not invent ad-hoc SSH fix scripts unless the user already operates that way **and** confirms.
6. **Secrets stay in env** — `.env`, GitLab Variables; placeholders `***` in docs/chat.
7. **Security is not optional** — if the only fix is “turn off auth/validation/CORS”, stop and redesign.
8. **Teach the minimum** — after a safe action, one tip max (e.g. “ครั้งหน้าใช้ dry-run ก่อน seed”) — no lecture.
9. **Hand back when out of depth** — infra/network/NPM/firewall → say what to ask the infra owner; do not guess production topology.

---

## Allowed help patterns (encourage these)

- “อธิบายว่าหน้านี้เรียก API ไหน” → Green explain  
- “ช่วยร่าง checklist ก่อนกด deploy UAT” → Green/Yellow doc only  
- “แก้ข้อความบน UI บนเครื่องฉัน” → Yellow small diff  
- “ทำไม login ไม่ได้บน local” → debug-mantra; no production changes  

## Discouraged user phrasings (agent must slow down)

- “ทำให้เสร็จเร็ว ๆ ไม่ต้องถาม” → still gate Red; explain why  
- “เหมือนของเก่า ลบ DB แล้วสร้างใหม่” → Hard Deny on shared; offer local only  
- “ปิด security ชั่วคราว” → refuse  
- “push ขึ้น production ให้หน่อย” → checklist + human CI click; no silent deploy  

---

## Session start (optional one-liner)

If the user identifies as handoff/ops/non-dev, or asks for `/handoff-safety`, open with:

> โหมดมือรักษาต่อ: จะถามก่อนทุกงานเสี่ยง (DB / deploy / ลบข้อมูล / ปิด security) และอธิบายผลกระทบภาษาไทยสั้น ๆ

Then continue the task.

---

## Fail-safe one-liner

> If a non-expert saying “ทำตาม AI” could erase data, leak secrets, break PRD, or turn off security — **stop, traffic-light it, explain in Thai, wait for an explicit YES that names the environment.**

## Related

- Root: [`AGENTS.md`](../../AGENTS.md)  
- DB: [`backend/.agents/skills/db-safety/SKILL.md`](../../backend/.agents/skills/db-safety/SKILL.md)  
- Deploy: [`docs/GitLab-CI-Plan.md`](../../docs/GitLab-CI-Plan.md), [`docs/GitLab-CI-Variables-Checklist.md`](../../docs/GitLab-CI-Variables-Checklist.md)  
- Env templates: `backend/.env.example`, `frontend/.env.example`
