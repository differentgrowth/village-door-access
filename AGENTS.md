# Village door access

Village door access. A Visitor records a Visit at a Location and then sees
that Location's current Access Code. An Operator with the Password opens Admin.

There is one agents file: this `AGENTS.md`. Do not create `AGENTS.project.md`.

Agents and code speak English. Spanish appears only in UI strings.

## Domain

Read `CONTEXT.md` before naming a domain concept. ADRs live in `docs/adr/`.
How to consume them: `docs/agents/domain.md`.

Reach the ADRs when a change touches Admin, the Password, Locations, or Access
Codes:

- `docs/adr/0001-v1-shared-password.md` — Admin is a shared Password
- `docs/adr/0002-locations-are-archived.md` — Locations are archived, not deleted
- `docs/adr/0003-no-platform-accounts.md` — no Better Auth, Google, or X
- `docs/adr/0004-visit-retention.md` — Visit rows erased after 90 days; Visit count stays

## Auth

Admin is opened with the shared Password at `/login`. The session is an HMAC
cookie in `src/lib/admin-session.server.ts`. Gate Operator writes and Admin
reads with `requireAdmin()` / `isAdminSession()`. Public Visit recording stays
ungated.

Password source: `ADMIN_PASSWORD`, or the demo value when unset. At least
eight characters and at most 128; letters, digits, and symbols are allowed;
no complexity rules. This is a usability choice, not strong auth.

Do not remount Better Auth, `/api/auth/*`, Google, or X sign-in.

## Data

Postgres via `getPrisma()` from `@/lib/db` (Prisma + `pg`). `DATABASE_URL`
is required — there is no PGLite fallback. Schema lives in `prisma/`; add
migrations with Prisma, never inline SQL in server functions. Neon applies
them in `pnpm db:migrate` (`prisma migrate deploy`, first half of
`pnpm build`). Prefer `DATABASE_URL_UNPOOLED` for that CLI step.

Location data is village-shared, not per-user.

Do not commit a `.env` file. Local Docker uses `.env.development.local`
(gitignored). On deploy set `DATABASE_URL`, `ADMIN_PASSWORD`, and
`ADMIN_SESSION_SECRET`. Visit Notices need `NOTIFY_EMAIL` and
`RESEND_API_KEY`. Only `VITE_`-prefixed vars reach the browser.

## Routes

| Path | Who | What |
| --- | --- | --- |
| `/` | Visitor | Record a Visit, then see the Access Code |
| `/login` | Operator | Password gate |
| `/admin` | Operator | Locations, rotation, Visits. UI label: Gestión |

Keep `src/lib/error-component.tsx` as the router `defaultErrorComponent`.

## Stack

React 19, TypeScript, Vite 8, TanStack Start / Router, Tailwind v4, @base-ui/react,
lucide, sonner. Package manager: pnpm.

## PWA

Add to Home Screen uses static files: `public/manifest.webmanifest` and
`public/icon-180.png`, linked from `__root.tsx`. No service worker.

## Commands

```bash
pnpm dev          # 0.0.0.0:8080
pnpm build        # prisma generate + migrate deploy + production build
pnpm typecheck
pnpm test         # scripts/**/*.test.mjs (needs DATABASE_URL)
pnpm lint
```

`startup.sh` brings the dev server back after a restart. Keep it in sync with
how the app actually starts. Confirm `pnpm build` and `pnpm typecheck` before
treating work as done.

## Agent skills

### Issue tracker

Issues live as local markdown under `.scratch/` (Origin has no issues). See `docs/agents/issue-tracker.md`.

### Triage labels

`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.
See `docs/agents/triage-labels.md`.

### Domain docs

Single-context. Glossary is `CONTEXT.md`. ADRs live in `docs/adr/` (Password,
archive, no platform Accounts, 90-day Visit erasure). Open-source and PWA
rules are in `docs/agents/domain.md`. See that file before exploring.
