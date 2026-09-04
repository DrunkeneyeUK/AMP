# Shared Database

A small self-hosted web app for teams that need a shared, customisable database.
Create as many "databases" (tables) as you like, define your own fields for
each one, and everyone with a login sees and edits the same shared data.

Example: an electrician could create a **Customers** database with fields for
Name, Address, Distribution Board Type (dropdown) and Annual Cost (currency).
A plumber, or any other trade, could create a completely different set of
tables with their own fields — nothing is hard-coded.

## Features

- Multiple named user accounts (the first person to register becomes admin)
- Create unlimited custom databases (tables)
- Custom fields per table: text, long text, number, currency, date, yes/no,
  dropdown, email, phone — each optional or required
- Add, edit, delete, and search records in a spreadsheet-style grid
- Add/remove fields on a table at any time, without losing existing data
- All data is shared live between every logged-in user

## Tech stack

- **Backend:** Node.js, Express, SQLite (via `better-sqlite3`), JWT auth
- **Frontend:** React + Vite

## Running locally

Requires Node.js 18+.

### 1. Backend

```bash
cd server
npm install
JWT_SECRET="replace-with-a-long-random-string" npm start
```

The API runs on `http://localhost:4000` by default (override with `PORT`).
Data is stored in `server/data/app.db` (SQLite), created automatically.

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server proxies `/api` requests to the
backend on port 4000.

### First use

1. Register the first account — it automatically becomes an admin.
2. Create a database (e.g. "Customers") and define its fields.
3. Add records. Anyone else who registers/logs in sees and can edit the same
   data.

## Deploying

For production, build the frontend and serve it as static files (behind a
reverse proxy, or from the Express server) while running the backend with a
real `JWT_SECRET` and a persisted `server/data/app.db` (or set `DB_PATH` to
point it elsewhere, e.g. a mounted volume).

```bash
cd client && npm run build   # outputs client/dist
```

## Project layout

```
server/            Express API + SQLite database
  src/
    db.js          Schema + migrations (users, tables_def, fields_def, records)
    auth.js         JWT signing/verification middleware
    routes/         auth, tables (schema), records, users
client/             React (Vite) frontend
  src/
    pages/          Login, Register, Dashboard, TableView
    components/     Navbar, modals for creating tables/fields/records
    api.js          Fetch wrapper for the backend API
```
