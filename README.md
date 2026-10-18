# EduBridge

EduBridge is a secure academic collaboration platform connecting students, faculty guides, and administrators across the EDI lifecycle. The current implementation is a full-stack-style frontend demo with realistic role-based dashboards, scheduling, document tracking, task management, meeting history, research library, and announcement flows, backed by browser local storage for persistence across sessions.

## Features implemented

- Role-based dashboards for students, faculty, and administrators
- Login, registration, access denial, and password recovery screens
- Students can select a faculty guide, view that guide's published availability, and request an open time
- Faculty can publish or remove availability and approve or reject incoming meeting requests
- Booking requests are restricted to published slots and checked for scheduling conflicts
- Students can invite classmates to their group; invitees accept or decline from their own account
- Group membership is shared with the team's task board, where members can assign tasks to one another and coordinate project activities
- Light interface palette using white, navy blue, and gold accents
- Group, task, document, research, and conference management views
- Notification inbox and institutional announcements
- Responsive app shell with mobile-friendly layouts
- Local persistence via `localStorage` for realistic demo behavior without backend dependencies

## Demo credentials

- Student: `divyanshi@college.edu` / `student123`
- Classmate: `rohan@college.edu` / `student123`
- Classmate: `mira@college.edu` / `student123`
- Faculty: `faculty@college.edu` / `faculty123`
- Admin: `admin@college.edu` / `admin123`

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open the local Vite URL, typically `http://localhost:5173`.

## Production build

```bash
npm run build
```

## Environment variables

Copy `.env.example` and fill in the Supabase values if you later connect the app to a hosted backend:

```bash
cp .env.example .env
```

## Architecture snapshot

- Frontend: React + TypeScript + Vite + Tailwind
- Routing: React Router
- Data access: local shared state layer with demo seed data
- Persistence: browser `localStorage`
- Security: role gating on route access and UI transitions

## Known limitations

- This is a working frontend demo rather than a live Supabase-backed production deployment.
- File uploads, RLS policies, and database migrations are documented as architecture requirements but are not connected to a live backend in this local-demo build.
- Bulk admin imports, secure email delivery, and real-time multi-user syncing are intentionally left as a production extension.

## Next steps for production deployment

1. Replace the local store with Supabase Auth and Postgres-backed models.
2. Add storage policies for private documents and signed URLs.
3. Enable RLS and audit logging for bookings, documents, and admin actions.
4. Add cron jobs and email delivery for reminders and notifications.
