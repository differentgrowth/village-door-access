---
status: accepted
---

# v1 Admin is a shared Password, not an Account

The Operator is whoever knows the Password. v1 uses one global Password typed at `/login`. That is weaker than per-person Accounts on purpose: a village tablet has to stay usable when the town hall changes hands. Comments and the README must say this is a usability choice, not strong auth.

The Password is at least eight characters and at most 128. Letters, digits, and symbols are allowed. There are no complexity rules — do not require a mix of classes or ban symbols. `ADMIN_PASSWORD` uses the same shape; a value that is too short or too long fails at startup instead of locking Operators out.

PIN is a retired name for this secret. An Access Code is four digits and opens a Location; it is not the Password. There are no per-person Accounts.
