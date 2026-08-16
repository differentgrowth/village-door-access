# Village door access

Open-source door access for a village site. A visitor picks a **Location** (any physical door — gym hall, pavilion, pool), leaves their name, and sees that Location’s four-digit **Access Code**. An operator opens **Admin** (Gestión) with one shared **Password**, adds Locations, rotates codes, and reads the visit log.

The visitor UI is Spanish. Code, issues, and docs are English. Domain words live in [`CONTEXT.md`](./CONTEXT.md).

**v0.1.0** is usable: seed Location **Acceso 1**, visit registration, per-Location Access Codes, archive/restore, Password gate at `/login`.

## Visit retention (RGPD)

A Visit stores a person’s name. That row is **deleted after 90 days**. The sweep runs when someone opens `/`, when an Operator opens Admin, and when a new Visit is recorded.

| Kept | Erased |
| --- | --- |
| Locations (including archived) | Visit rows older than 90 days (name, timestamp, Access Code shown that day) |
| Access Code History | — |
| **Visit count** per Location (lifetime total) | — |

Admin shows **Hoy** (Visits today at the selected Location, from rows that still exist) and **Total** (Visit count). Total does not go down when old Visits are erased.

The public page tells the visitor, in Spanish, that the name is only for the access log, that it is deleted after 90 days, and that the Ayuntamiento de Aldearrodrigo is the controller.

See [`docs/adr/0004-visit-retention.md`](./docs/adr/0004-visit-retention.md).

## Why the Password is weak on purpose

Admin is **not** per-person accounts. Whoever knows `ADMIN_PASSWORD` is the Operator. That is a village-usability choice (the town hall can hand over one secret), not strong authentication.

See [`docs/adr/0001-v1-shared-password.md`](./docs/adr/0001-v1-shared-password.md). Do not “fix” this by adding Google/X sign-in; that decision is recorded in [`docs/adr/0003-no-platform-accounts.md`](./docs/adr/0003-no-platform-accounts.md).

## Use

| Who | Where | What |
| --- | --- | --- |
| Visitor | `/` | Pick a Location, type name and surnames, register the Visit, copy the Access Code |
| Operator | `/login` → `/admin` | Shared Password, then rotate codes, read Visits (Hoy + lifetime Total), add / rename / archive / restore Locations |

The Location picker is tabs for a few doors, then a select (mobile at 4+, desktop at 7+).

## Develop

You need [Node.js](https://nodejs.org/) 22+ and [pnpm](https://pnpm.io/) 11 (`packageManager` in `package.json`).

```sh
git clone git@github.com:differentgrowth/village-door-access.git
cd village-door-access
pnpm install
# Docker Postgres (postgres:16) — same vars as CI / .env.development.local
docker run -d --name village-pg -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=village -p 5432:5432 postgres:16
pnpm db:migrate
pnpm dev
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080). `DATABASE_URL` must point at Neon or local Postgres. There is no in-memory fallback.

Local Docker values live in `.env.development.local` (gitignored). Vite, Prisma, and `pnpm test` load that file when it is present. Do **not** commit a `.env`. Local Admin uses the demo Password `acceso1a` (shown on `/login`) when `ADMIN_PASSWORD` is unset.

| Script | What it does |
| --- | --- |
| `pnpm dev` | Vite on `0.0.0.0:8080` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | Biome |
| `pnpm test` | Node tests under `scripts/**/*.test.mjs` (needs `DATABASE_URL`) |
| `pnpm build` | `prisma generate`, `prisma migrate deploy`, then the Nitro / Vercel bundle |
| `pnpm db:migrate` | `prisma migrate deploy` (unpooled URL if `DATABASE_URL_UNPOOLED` is set) |
| `pnpm preview` | Serve the production build on 8080 |

Schema changes: edit `prisma/schema.prisma` and add a Prisma migration. Never edit a file that has already been applied. UI strings are Spanish; everything else is English — see [CONTRIBUTING.md](./CONTRIBUTING.md).

Add to Home Screen uses `public/manifest.webmanifest` and `public/icon-180.png`. There is no service worker.

## Deploy

Production target is **Vercel**. The Vite build enables Nitro with `preset: "vercel"`. Pair it with **Neon** Postgres.

1. Create a Vercel project from this GitHub repo (`differentgrowth/village-door-access`).
2. Create a Neon database and copy its connection string.
3. In the Vercel project, set the environment variables from [`.env.example`](./.env.example) (Production; Preview if you want those deploys to share or use a branch DB).
4. Deploy. `pnpm build` runs `prisma migrate deploy` first, then compiles. Pending Prisma migrations apply once (recorded in `_prisma_migrations`). A failed migration fails the deploy.
5. Open `/login`, sign in with `ADMIN_PASSWORD`, and rotate the seed Location’s Access Code.

| Variable | Required | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon Postgres URL (pooled is fine for the app). Required — there is no in-memory fallback. |
| `DATABASE_URL_UNPOOLED` | optional | Direct Neon URL for `prisma migrate deploy`. The Vercel Neon integration injects this. Falls back to `DATABASE_URL`. |
| `ADMIN_PASSWORD` | yes | Shared Admin Password. 8–128 characters; letters, digits, and symbols allowed. No complexity rules. |
| `ADMIN_SESSION_SECRET` | yes | Signs the Admin cookie. Use a long random string, not the Password. |
| `NOTIFY_EMAIL` | optional | Inbox for the visit Notice. |
| `RESEND_API_KEY` | with email | Sends the Notice. Both this and `NOTIFY_EMAIL` must be set or no mail is sent. |
| `NOTIFY_FROM` | optional | From address. |

Framework preset can stay the default for a Vite/Nitro app; do not add a second install command. Install command: `pnpm install`. Build command: `pnpm build`. Output is whatever Nitro’s Vercel preset emits.

After the first deploy, confirm:

- `/` shows **Acceso 1** and the 90-day notice
- `/login` accepts `ADMIN_PASSWORD` (or the local demo Password when that is unset)
- `/admin` after sign-in shows Hoy and Total
- A Visit appears in Admin and, if mail is configured, a Notice arrives

HTTPS is required for the Admin cookie’s `Secure` flag in production.

## Project shape

| Path | Role |
| --- | --- |
| `src/routes/` | Pages: `/`, `/login`, `/admin` |
| `src/lib/access.*` | Locations, Access Codes, Visits |
| `src/lib/admin-session.server.ts` | Shared Password session |
| `prisma/` | Schema and migrations. Do not edit applied migration files |
| `CONTEXT.md` | Glossary |
| `docs/adr/` | Why we chose this Password, archive, no platform Accounts, 90-day Visit erasure |
| `docs/agents/` | How agent skills talk to GitHub Issues |

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request. Security reports go through [SECURITY.md](./SECURITY.md), not a public issue.

## License

[MIT](./LICENSE) © 2026 Village Door Access / Different Growth.
