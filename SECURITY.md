# Security

## Known, intentional limits

v1 Admin is a **shared Password** (`ADMIN_PASSWORD`). That is weaker than per-person accounts on purpose. See [`docs/adr/0001-v1-shared-password.md`](./docs/adr/0001-v1-shared-password.md). Reports that only restate “this is a shared secret” will be closed as wontfix.

In production, set a long `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`. Never commit either. If `ADMIN_PASSWORD` is set and `ADMIN_SESSION_SECRET` is missing, the app refuses to sign or verify Operator cookies. An `ADMIN_PASSWORD` that is shorter than eight characters or longer than 128 fails at startup instead of locking Operators out. Changing the Password invalidates existing Operator cookies.

Visit names are deleted after 90 days (ADR 0004). That is storage limitation, not a reason to file a vulnerability. Do not propose keeping Visit rows longer “for forensics” without reopening that ADR.

## Reporting a vulnerability

Do **not** open a public GitHub issue for a vulnerability.

Use [GitHub’s private advisory form](https://github.com/differentgrowth/village-door-access/security/advisories/new) for this repository.

Include:

- What an attacker can do
- Steps to reproduce
- Affected routes or env vars, if you know them
- Whether you have a patch

We will acknowledge the report and tell you when a fix is published.

## Scope

In scope: Access Code leaks before a Visit, session cookie issues, injection, auth bypass that does not require knowing the Password.

Out of scope: guessing the demo Password on a machine with `ADMIN_PASSWORD` unset; brute-forcing a short shared Password you already treat as public in a village.
