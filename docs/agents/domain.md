# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root
- **`docs/adr/`** — every ADR that touches the area you are about to work in
- **`CONTRIBUTING.md`** and **`SECURITY.md`** when the change is a public issue, a PR, or auth/privacy
- **`README.md`** for the open-source contract (MIT, how to run, Visit retention)

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates glossary and ADRs lazily when terms or decisions actually get resolved.

## File structure

Single-context repo:

```
/
├── CONTEXT.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE                 ← MIT
├── docs/adr/
│   ├── 0001-v1-shared-password.md
│   ├── 0002-locations-are-archived.md
│   ├── 0003-no-platform-accounts.md
│   ├── 0004-visit-retention.md
│   └── 0005-qr-encodes-location-url.md
├── public/
│   ├── manifest.webmanifest
│   └── icon-180.png
└── src/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

Agents and code speak English. Spanish appears only in UI strings.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Decisions in force

Honor these. If a ticket or suggestion contradicts one, surface the ADR instead of “fixing” it.

| Topic | Rule | ADR / doc |
| --- | --- | --- |
| Open source | MIT. Public GitHub Issues and PRs. Collaborators follow `CONTRIBUTING.md`. Vulnerabilities go to GitHub private advisories (`SECURITY.md`), never a public issue. | LICENSE, CONTRIBUTING, SECURITY |
| Password | One shared Admin Password. Min 8, max 128; symbols allowed; no complexity rules. Village usability, not strong auth. Do not add per-person Accounts. | 0001 |
| No platform Accounts | Do not remount Better Auth, `/api/auth/*`, Google, or X. | 0003 |
| Locations | Archive and restore. No hard delete. Last Location cannot be archived. | 0002 |
| Visit erasure | Delete Visit rows after 90 days. Do not keep names longer “for the log.” | 0004 |
| Visit count | Lifetime total per Location. Purge must not decrement it. Hoy is counted from remaining rows. | 0004 |
| Door sticker QR | Encodes `/?location=<Location id>`. Visit still required. Do not put the Access Code in the QR. | 0005 |
| PWA | Keep `public/manifest.webmanifest` and `public/icon-180.png` linked from `__root.tsx` (`rel=manifest`, apple-touch-icon). No service worker. Do not reintroduce `public/__grok` or `grokPwaPlugin`. | AGENTS.md § PWA |

Reach the matching ADR when the change touches Admin, the Password, Locations, Access Codes, Visits, Visit count, door sticker QRs, or the install-to-home-screen files.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0004 (Visit rows erased after 90 days) — but worth reopening because…_
