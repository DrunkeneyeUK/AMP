# AMP Field

Site reporting for subcontractors and the teams who run them.

AMP Field is an iOS and Android application built with Expo, React Native and
Supabase. It covers subcontractor reporting, site information, field requests,
blockers, progress records and company/subcontractor communication.

AMP Field is **not** the technical engineer assistant. Fault diagnosis, product
manuals, wiring guidance, product identification and compliance advice belong to
AMP Engineer and must not be added here.

---

## Status

| Phase                                         | State       |
| --------------------------------------------- | ----------- |
| PR #1 — Phase 0: AMP Field Foundation         | this branch |
| PR #2 — Phase 0: Secure Auth and Tenant Shell | not started |
| PR #3 onwards — Phase 1                       | not started |

This PR establishes the application shell only. There is deliberately no
project, site, report, request or blocker functionality yet — see
[Scope](#scope-of-this-pr).

---

## Requirements

- Node.js 22 (see `.nvmrc`)
- npm 10
- Expo Go, or a development build, on an iPhone or Android handset

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase values
npm start
```

Press `i` for iOS or `a` for Android in the Expo CLI.

## Environments

Four environments are configured. Select one with `APP_ENV`; it defaults to
`local`.

| `APP_ENV`     | App name          | Scheme           | Bundle id                       |
| ------------- | ----------------- | ---------------- | ------------------------------- |
| `local`       | AMP Field (Local) | `ampfield-local` | `uk.co.amplogic.ampfield.local` |
| `development` | AMP Field (Dev)   | `ampfield-dev`   | `uk.co.amplogic.ampfield.dev`   |
| `staging`     | AMP Field (Beta)  | `ampfield-beta`  | `uk.co.amplogic.ampfield.beta`  |
| `production`  | AMP Field         | `ampfield`       | `uk.co.amplogic.ampfield`       |

Every environment has its own bundle identifier and deep-link scheme, so builds
install side by side on one device and a recovery link opens the build it was
issued for.

```bash
APP_ENV=development npm start
APP_ENV=staging npx expo export --platform ios
```

Static metadata lives in `constants/environments.json`. Endpoints and keys come
from `.env.<app-env>` (git-ignored; copy from the matching `.example` file) or
from CI/EAS secrets.

### Security rules for configuration

- **Only** the Supabase anon/publishable key may appear in a `.env` file or in
  the app bundle. `lib/env` refuses to start the app with a service-role or
  secret key, `npm run validate:config` fails the build, and
  `npm run scan:bundle` fails CI if one reaches the exported bundle.
- Never point a development or beta build at the production Supabase project.
- Production values belong in EAS/CI secrets, never in a committed file.

## Scripts

| Command                   | What it does                                       |
| ------------------------- | -------------------------------------------------- |
| `npm start`               | Expo dev server                                    |
| `npm run typecheck`       | `tsc --noEmit`                                     |
| `npm run lint`            | ESLint, zero warnings tolerated                    |
| `npm run format`          | Prettier check (`format:write` to fix)             |
| `npm test`                | Jest unit and integration tests                    |
| `npm run validate:config` | Resolves the Expo config for all four environments |
| `npm run scan:bundle`     | Scans `dist/` for privileged credentials           |
| `npm run verify`          | Everything CI runs, in one command                 |

## Project structure

```
app/            expo-router routes only — no business logic
components/ui/  shared, reusable primitives (AppButton, AppCard, …)
features/       feature modules (app-shell, auth, …)
lib/            supabase client, env, validation, sync primitives
hooks/          shared hooks
theme/          semantic design tokens and the theme provider
constants/      product strings and environment metadata
tests/          Jest suites mirroring the source tree
scripts/        build and security tooling
```

Business logic never lives inside a screen. Screens compose components and
feature modules.

## Design system

Every colour comes from a semantic token in `theme/tokens.ts`
(`surfacePrimary`, `textSecondary`, `accentPrimary`, `statusWarning`, …). Raw
hex values are rejected by lint outside `theme/palette.ts`.

The visual direction is a near-black ground, graphite panels, white primary
typography, slate secondary text, restrained AMP red and modest material depth —
no glow, no generic dark dashboard.

Accessibility expectations enforced in the components and covered by tests:
dynamic type with a sensible cap, a 48pt minimum touch target, screen-reader
labels on every control, and no state communicated by colour alone.

## Scope of this PR

Delivered:

- Expo + TypeScript project with expo-router
- Semantic design tokens and theme provider
- Reusable UI primitives and the loading / empty / error / offline states
- Four-environment configuration with runtime validation
- Supabase client shell with chunked, keystore-backed session storage
- Branded splash, loading and sign-in shell
- Lint, formatting, typecheck, tests and CI

Deliberately **not** in this PR (they belong to later PRs in the build
sequence): authentication, session restore, organisation membership, role
routing, RLS policies, projects, sites, work areas, assignments, daily reports,
requests, blockers, notifications and weekly reporting.
