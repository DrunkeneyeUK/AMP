# DaySync — Product Requirements Document

## Overview
DaySync is a multi-tenant work calendar and task management mobile app for iOS and Android, built with Expo + React Native + FastAPI + MongoDB.

## Personality
Tactile / Playful. Default brand: warm coral (#FF6B5C) on warm off-white surfaces. **Every company can override the brand color and logo**, and each employee has a personal accent color.

## Auth model
Email + password (JWT bearer, 30-day expiry). Two roles:
- **Admin** – created when signing up a new company. Can upload logo, edit company name/brand color/visibility, rotate invite code, and manage team members.
- **Employee** – joins with an admin's invite code. Can view calendar per visibility rules, create/edit their own events + tasks, pick their personal color.

## Company setup (during admin signup)
Admin picks a **calendar visibility mode**:
- **Shared** – everyone in the company sees each other's events + tasks (color-coded per user).
- **Private** – employees only see their own; admin still sees everything.

## Core Features
- **Today Agenda**: date tape, greeting w/ user's first name, company logo in header, agenda list, FAB.
- **Month View**: 6-week grid with per-event dots; tap a day → bottom sheet.
- **Tasks List**: filter chips (all/todo/in-progress/done) with counts, tri-state toggle.
- **Create modal**: segmented Event/Task, category chips, hour picker, priority selector.
- **Event/Task details** with delete + cyclable status.
- **Profile**: user avatar (their color), company card, 10-color picker, team list, sign out. Admin also sees "Admin settings" link.
- **Admin settings** (admins only): logo upload (via Emergent Object Storage), company name, brand color picker (12 swatches), visibility toggle, invite code with rotate button, team members list.
- **Auth flow**: welcome → sign in / create a company / join with invite code.

## Backend
FastAPI + MongoDB (motor). UUID ids, no `_id` leakage.

- `POST /api/auth/register-company` → creates Company + admin user, returns token + **invite_code (shown once)**
- `POST /api/auth/join` → invite-code signup for employees
- `POST /api/auth/login` → JWT
- `GET /api/auth/me` → current user + company
- `GET /api/company`, `PATCH /api/company` (admin), `POST /api/company/rotate-invite` (admin)
- `POST /api/company/logo` (admin, multipart) → uploads to Emergent Object Storage, returns public URL served via `/api/files/{path}`
- `GET /api/users` → same-company members
- `PATCH /api/users/me` → update name/color
- Events/Tasks CRUD with `company_id` isolation and `visibility_mode` filtering
- `GET /api/agenda?date=YYYY-MM-DD` → combined events + tasks for a day

## Tech Stack
Expo SDK 54 · expo-router · React Native 0.81 · dayjs · expo-blur · expo-haptics · expo-image · expo-image-picker · expo-clipboard · FastAPI · MongoDB · motor · PyJWT · passlib[bcrypt] · Emergent Object Storage for logo uploads

## Testing
21/21 backend pytest passing (auth, isolation, roles, upload, CRUD). Frontend flow verified end-to-end by testing agent.

## Business Enhancement Ideas (v2)
- **Paid team tier ($5/user/mo)**: workload heatmap, drag-drop task reassignment
- Google Calendar two-way sync
- AI natural-language quick-add
- Push notification reminders
