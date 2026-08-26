# DaySync — Product Requirements Document

## Overview
DaySync is a work-focused calendar and task management mobile app for iOS and Android, built with Expo + React Native. It converts a ChatGPT-conceived calendar web app into a proper native mobile experience.

## Personality
Tactile / Playful — warm coral (#FF6B5C) brand on warm off-white surfaces. Rounded tactile cards, generous spacing, chunky segmented controls, blurred glass tab bar.

## Core Features (MVP)
- **Today Agenda**: Sticky header with greeting + selected date, horizontal 14-day date tape, events section, tasks section with inline complete toggle, FAB to create.
- **Month View**: 6-week grid with today highlight, colored dots per event, plus indicator for tasks; tap a day to open a bottom-sheet with that day's agenda.
- **Tasks List**: Filter chips (All / To do / In progress / Done) with counts, tri-state status toggle (todo → in_progress → done), high-priority badge, category dot.
- **Create Modal**: Segmented toggle Event ↔ Task; category chip picker (Work / Meeting / Deadline / Personal / Focus); hour picker chips; priority selector for tasks; location / assignee / notes fields; KeyboardAvoidingView with anchored Save.
- **Event Details**: Category-tinted hero card with title + time; location, notes, assignee blocks; Delete action.
- **Task Details**: Category + priority chips; big status button that cycles (todo/in_progress/done); Delete action.
- **Profile**: User hero card, team avatars, preference rows.

## Backend (FastAPI + MongoDB)
All routes prefixed `/api`, UUID ids, Mongo `_id` excluded from all responses.

- `POST /api/events`, `GET /api/events` (filters: `start_after`, `start_before`), `GET /api/events/{id}`, `PATCH /api/events/{id}`, `DELETE /api/events/{id}`
- `POST /api/tasks`, `GET /api/tasks` (filters: `status`, `due_after`, `due_before`), `GET /api/tasks/{id}`, `PATCH /api/tasks/{id}`, `DELETE /api/tasks/{id}`
- `GET /api/agenda?date=YYYY-MM-DD` → `{events, tasks}`

## Data Models
- **Event**: id, title, description, start (ISO), end (ISO), location, category, color, assignee, all_day, created_at, updated_at
- **Task**: id, title, description, due_date (ISO), priority (low|medium|high), status (todo|in_progress|done), category, assignee, created_at, updated_at

## Business Enhancement Ideas (v2)
- **Team assignment & workload heatmap** — Turn DaySync into a paid team tier ($5/user/mo) where managers see who's overloaded and drag-drop tasks between team members. Existing `assignee` field is the foundation.
- Google Calendar two-way sync
- AI natural-language quick add ("meeting tomorrow 3pm w/ Priya")
- Push notification reminders

## Tech Stack
Expo SDK 54 · expo-router · React Native 0.81 · dayjs · expo-blur · expo-haptics · expo-image · FastAPI · MongoDB · motor
