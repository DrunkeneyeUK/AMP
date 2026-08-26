# DaySync — Product Requirements Document

## Overview
Multi-tenant work calendar + task app for iOS/Android. Expo + FastAPI + MongoDB.

## Personality
Tactile / Playful. Warm coral (#FF6B5C) default brand, customizable per company. Full **Light / Dark / System** theme support.

## Auth
JWT bearer + email + password, 30-day expiry, secure device storage.
- **Admin** creates a company at signup and gets a one-time invite code.
- **Employees** join with the invite code + own email/password.

## Company setup
- Custom logo (uploaded to Emergent Object Storage)
- Custom brand color (12 swatches)
- Calendar visibility mode: **Shared** (everyone sees each other) or **Private** (self-only)
- Rotate-able invite code
- **Custom event types (categories)** — admin can add, rename, recolor, or delete category types (with a tinted background auto-generated from the color). Defaults: Work / Meeting / Deadline / Personal / Focus.

## Per-employee
Personal accent color (10 palette + admin-assigned default) — shows on their events/tasks in the shared team view.

## Screens
- **Welcome** – hero image + Create/Join/Sign-in buttons
- **Register admin** – company setup form → invite-code confirmation screen with copy-to-clipboard
- **Join** – 8-char invite code + personal info
- **Login**
- **Today** – date tape + agenda; company logo in header
- **Month** – 6-week grid; tap day → bottom-sheet agenda
- **Tasks** – filter chips + tri-state status toggle
- **Create modal** – Event/Task segmented control, dynamic categories from company, hour picker, priority selector
- **Event/Task details** – hero card + delete + cyclable status
- **Profile** – user hero, company card, per-user color picker, team list, **Appearance toggle (Light/Dark/System)**, logout
- **Admin settings** – logo upload, brand color, visibility toggle, invite rotate, **Event types CRUD**, team list

## Backend
- Auth: `POST /api/auth/register-company | join | login`, `GET /api/auth/me`
- Company: `GET/PATCH /api/company`, `POST /api/company/rotate-invite`, `POST /api/company/logo`, `GET /api/files/{path}`
- **Categories: `GET/POST /api/company/categories`, `PATCH/DELETE /api/company/categories/{key}`**
- Users: `GET /api/users`, `PATCH /api/users/me`
- Events + Tasks CRUD with `company_id` isolation + visibility filtering
- Agenda: `GET /api/agenda?date=YYYY-MM-DD`

## Frontend theming
- `ThemeContext` provider (light / dark / system, persisted to storage)
- `useThemedStyles(makeFn)` hook re-runs style factory on theme change
- All screens follow the theme

## Testing
- **36/36 backend pytest passing** (auth, tenant isolation, roles, logo upload, categories CRUD, visibility modes)
- Frontend end-to-end verified: signup, login, join, invite screen, theme switch persists, category add/edit/delete

## Tech Stack
Expo SDK 54 · expo-router · dayjs · expo-image · expo-image-picker · expo-blur · expo-haptics · expo-clipboard · FastAPI · MongoDB · motor · PyJWT · passlib[bcrypt] · Emergent Object Storage

## Business Enhancement Ideas
- **Team tier ($5/user/mo)** — workload heatmap, drag-drop reassignment
- Google Calendar 2-way sync
- AI natural-language quick-add
- Google Sign-in (Emergent Google Auth)
- Push notification reminders
