# Contributing to AMP Field

## Before you open a pull request

Run the full check suite:

```bash
npm run verify
```

That is exactly what CI runs: typecheck, lint, formatting, tests and Expo
configuration validation for all four environments. A pull request cannot merge
while a required check is failing.

## Ground rules

1. **Business logic never lives in a screen.** Screens under `app/` compose
   components and feature modules; the logic belongs in `features/` or `lib/`.
2. **No hard-coded colours.** Use a semantic token from `@/theme`. Lint rejects
   hex literals outside `theme/palette.ts`.
3. **Reuse before you add.** If a pattern already exists in `components/ui/`,
   extend it rather than writing a screen-specific variant.
4. **Every screen accounts for every state**: loading, empty, success,
   recoverable error, fatal error, offline, unauthorised and disabled action.
   A blank screen during a fetch or a failure is a bug.
5. **Errors explain the action.** "Something went wrong" is not acceptable.
   Say what failed, what is safe, and what to do next.
6. **Never imply delivery while offline.** Queued work says "Waiting to sync".
7. **No privileged credentials in the client.** Only the Supabase anon key.
8. **Tenant isolation is a release blocker.** Any change touching data access
   needs a test proving one organisation cannot read another's rows.

## Product boundary

AMP Field covers field reporting, site information, requests, blockers, progress
records and company/subcontractor communication.

It is not the technical engineer assistant. Fault diagnosis, product manuals,
wiring guidance, product identification and compliance advice belong to AMP
Engineer.

## Tests

- Unit and integration tests live in `tests/`, mirroring the source tree.
- Test behaviour a user or an auditor would care about, not implementation
  detail.
- Native modules are mocked centrally in `tests/setup.ts`.
