# Contributing

Thanks for helping. This repo is Village door access, an open-source door-access app for a village site. Issues and pull requests live on [GitHub](https://github.com/differentgrowth/village-door-access).

## Before you write code

1. Read [`CONTEXT.md`](./CONTEXT.md). Use those terms in issues, commits, tests, and identifiers. Do not call a Location a gym, site, or door-record.
2. Read the ADRs that touch your change under [`docs/adr/`](./docs/adr/).
3. Open or claim an issue first for anything larger than a typo. Labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.

## Language

| Surface | Language |
| --- | --- |
| Visitor and Operator UI (labels, toasts, emails, `aria-*`) | Spanish |
| Code, comments, commits, issues, docs | English |

If a user-visible string is new, write it in Spanish. Everything else stays English.

## Dev setup

```sh
pnpm install
# Local Docker Postgres: copy DATABASE_URL from .env.example into .env.development.local
pnpm db:migrate
pnpm dev
```

Do not commit a `.env`. Local Docker uses `.env.development.local` (gitignored; Vite, Prisma, and tests load it). Or export `DATABASE_URL` (Neon or local Postgres). Local Admin uses the demo Password `acceso1a` when `ADMIN_PASSWORD` is unset.

Before you push:

```sh
pnpm typecheck
pnpm lint
pnpm test
```

`pnpm build` must stay green (Vercel runs it).

## How to change things

- **Schema:** edit `prisma/schema.prisma` and add a Prisma migration. Never edit a file that has already been applied.
- **Domain behaviour:** update `CONTEXT.md` in the same change if you introduce or rename a term. Offer an ADR only when the choice is hard to reverse, surprising, and a real trade-off.
- **Auth:** keep the shared Password. Letters, digits, and symbols are allowed (8–128 characters); do not add complexity rules or remount Better Auth, Google, or X. See ADR 0001 and 0003.
- **Locations:** archive and restore; do not hard-delete. See ADR 0002.
- **Visits:** erase rows after 90 days. Do not keep names longer. **Visit count** is the lifetime total and must not drop when rows are purged. See ADR 0004.
- **PWA:** keep `public/manifest.webmanifest` and `public/icon-180.png` linked from `__root.tsx`. No service worker; do not add `public/__grok`.

## Commits and pull requests

- Commits: [Conventional Commits](https://www.conventionalcommits.org/) — `type(scope): description` (for example `feat(access): archive Location from Admin`).
- One pull request, one job. Point at the issue it closes.
- Fill in `.github/pull_request_template.md`.
- Do not commit `.env`, `node_modules`, screenshots, or secrets.

## Conduct

Be kind. See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
