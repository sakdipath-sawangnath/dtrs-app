---
name: db-safety
description: >-
  Hard safety gate for Prisma/MySQL in dtrs-app backend — block destructive DB
  ops, require explicit confirmation, verify target environment, and keep
  migrations/seeds/raw SQL safe. Apply proactively whenever the agent would run
  prisma/migrate/seed scripts, edit schema.prisma or migrations, write
  deleteMany/updateMany/$executeRaw/$queryRaw, or touch DATABASE_URL / UAT / PRD
  data. Trigger on /db-safety or when the user mentions reset, drop, truncate,
  migrate, seed clear, or database wipe.
license: Internal project skill (no external redistribution terms)
---

# DB Safety (Prisma / MySQL)

Hard gate that sits **above** normal Prisma/Nest guidance. Complements root
[`AGENTS.md`](../../../AGENTS.md) path/delete rules, cross-cutting
[`handoff-safety`](../../../.agents/skills/handoff-safety/SKILL.md) for
non-dev successor teams, and Nest rules `db-use-migrations`,
`db-use-transactions`, `db-avoid-n-plus-one`.

**Output to user: ภาษาไทย** (paths / command names may stay English).  
Skill body stays English for consistency with other project skills.

## When to apply

- Any shell that hits Prisma CLI, MySQL client, or `backend/scripts/*seed*`
- Edits to `backend/prisma/schema.prisma` or `backend/prisma/migrations/**`
- Code using `deleteMany`, `updateMany`, `$executeRaw`, `$queryRaw`, `$transaction` that mutates many rows
- User says reset / drop / truncate / wipe / clear / migrate / seed against a shared DB
- `/db-safety`

## When NOT to replace

- General Nest/API design → `nestjs-best-practices` / `backend-api-pro`
- Active debugging of a data bug → still apply **this gate** before running fix scripts; then `debug-mantra`
- File/folder deletes outside DB → root `AGENTS.md` delete protocol

---

## Hard Deny (never run — no exceptions without explicit user YES)

Do **not** execute these unless the user confirmed with the protocol below:

| Class | Examples |
|-------|----------|
| Reset / wipe schema+data | `prisma migrate reset`, `prisma db push --force-reset`, `prisma db push --accept-data-loss` |
| Drop / truncate | `DROP DATABASE`, `DROP TABLE`, `TRUNCATE`, `DELETE FROM …` without a selective `WHERE` |
| Blind bulk wipe in app/scripts | `deleteMany({})`, `updateMany` with empty/over-broad `where`, seed `:clear` / `--clear` |
| Wrong-env writes | Any migrate/seed/raw write when `DATABASE_URL` host/db looks like UAT/PRD/shared and user did not name that env |
| Schema sync shortcuts on shared DB | `prisma db push` against non-local DB (prefer migration files + `migrate deploy`) |

Also **never**:

- Commit `.env` or paste real `DATABASE_URL` passwords into chat/docs/commits (placeholder `***`)
- Log full `DATABASE_URL` (redact userinfo)
- Invent `synchronize: true` / disable migrations for “convenience”
- Run destructive SQL “just to see what happens”

If unsure whether a command is destructive → **treat as Hard Deny** → ask.

---

## Confirmation protocol (verbatim gate)

Before any Hard Deny / high-risk write, stop and show **all** of:

1. **Target** — redacted `DATABASE_URL` shape: `mysql://***@<host>:<port>/<database>` (no password)
2. **Inferred env** — `local` / `uat` / `prd` / `unknown` (from host, db name, user wording)
3. **Command or code** — exact command or the Prisma call
4. **Blast radius** — tables/rows affected; irreversible? migration down possible?
5. **Why** — one sentence purpose

Then wait for an unambiguous confirmation, e.g.:

- `YES, RUN <command> ON <database>`
- or clear equivalent naming the **same** database

If confirmation is vague (“ok”, “ทำเลย”, “ไป”) → **cancel** and ask again with the five points.

Mirror the root AGENTS delete protocol: no clear YES → do not proceed.

---

## Environment gate (before every mutating DB action)

1. Read intended target from user + `backend/.env` / CI vars (**do not echo secrets**).
2. Classify:
   - **local** — `localhost` / `127.0.0.1` / docker compose service to local MySQL, db typically `dtrs_app`
   - **uat** — staging host / UAT naming (e.g. shared `192.168.0.115` patterns in deploy docs)
   - **prd** — production host / `dtrs-app.forth.co.th` related DB
   - **unknown** — treat as **prd-level risk**
3. Rules:
   - **local**: still confirm Hard Deny ops; routine `migrate dev` / selective seeds OK after stating target
   - **uat / prd / unknown**: **no** reset, force-reset, accept-data-loss, truncate, or seed `--clear` without protocol; prefer read-only investigation first
4. Prefer **dry-run** when available (`script:seed-sites-xlsx:dry`, `DRY_RUN=1` on location seed) before write.

---

## Safe defaults (what to do instead)

| Goal | Prefer | Avoid |
|------|--------|--------|
| Schema change | New migration under `prisma/migrations/` + review SQL | `db push` on shared; edit applied migration files |
| Apply on deploy | `prisma migrate deploy` | `migrate reset`, `migrate dev` on UAT/PRD |
| Local experiment | Disposable local DB / docker volume the user owns | Pointing `.env` at UAT to “test migrate” |
| Seed / import | `:dry` / `DRY_RUN=1` → review counts → write | `:clear` then seed without confirmation |
| One-off data fix | Script with explicit `where`, transaction, backup note | Ad-hoc `$executeRaw` DELETE/UPDATE without where |
| Query | Prisma client / tagged `$queryRaw` with params | String-concat SQL |

### Migration authoring checklist

- [ ] Additive first when possible (add column/table nullable → backfill → constrain)
- [ ] No `DROP` / type-shrink / NOT NULL on populated columns without data plan + confirmation
- [ ] `down` considered or explicitly documented as non-rollbackable
- [ ] Do not rewrite migrations already applied on UAT/PRD — add a new migration
- [ ] After writing SQL, re-read for missing `WHERE` on `UPDATE`/`DELETE`

### Application code checklist

- [ ] Every `deleteMany` / `updateMany` has a **selective** `where`
- [ ] Multi-step mutations use `$transaction` when consistency matters
- [ ] `$executeRaw` / `$queryRaw` use parameterized templates only
- [ ] No secrets in seed dumps committed to git

---

## Allowed without extra YES (still announce target once)

- `prisma migrate status` / `prisma validate` / `prisma format`
- Read-only `findMany` / `findUnique` / `$queryRaw` SELECT
- Generating a **new** migration file locally without applying to shared DB
- Unit tests with mocked `PrismaService` (no real DB)

Announce redacted target when first touching a real DB in the session.

---

## Fail-safe one-liner

> If the command can destroy or irreversibly rewrite data, or the env is not clearly local — **stop, show the five protocol points, wait for `YES, RUN … ON …`.**

## Related

- Root safety: [`AGENTS.md`](../../../AGENTS.md)
- Handoff / non-dev maintainers: [`handoff-safety`](../../../.agents/skills/handoff-safety/SKILL.md)
- Nest DB rules: `nestjs-best-practices` → `db-use-migrations`, `db-use-transactions`, `db-avoid-n-plus-one`
- Seeds: [`docs/Sites-Import.md`](../../../docs/Sites-Import.md), [`docs/Locations-Master-Seed.md`](../../../docs/Locations-Master-Seed.md)
- Env template: [`backend/.env.example`](../../.env.example)
