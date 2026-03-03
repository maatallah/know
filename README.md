# Know — Digital Operational Knowledge Platform

A structured, multilingual platform for capturing machine procedures, operational skills, and technical know-how.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- **Backend:** Next.js API Routes, Prisma ORM, PostgreSQL
- **Auth:** NextAuth v4 (Credentials + JWT)
- **i18n:** next-intl (Arabic RTL, French, English)
- **Validation:** Zod

## Getting Started

### Prerequisites

- Node.js ≥ 24
- PostgreSQL ≥ 18

### Setup

```bash
# Install dependencies
npm install

# Copy env file and configure your DATABASE_URL
cp .env.example .env

# Push schema to database
npx prisma db push

# Seed the database
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | password123 | Super Admin |
| expert@example.com | password123 | Expert |
| reviewer@example.com | password123 | Reviewer |

## Features

- **Knowledge Base** — CRUD with search, filters, pagination
- **Workflow** — Draft → In Review → Approved → Archived (RBAC enforced)
- **Dashboard** — Live stats, department breakdown, most viewed, contributors
- **Attachments** — Upload/download files (PDF, images, video, audio) up to 300MB
- **Knowledge Gaps** — Submit missing procedures, assign, close
- **Health Score** — Automated freshness/quality scoring
- **Audit Log** — Full action history
- **Multilingual** — Arabic (RTL), French, English with automatic layout mirroring
- **Dark/Light Theme** — Persistent toggle

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # Locale-specific pages
│   │   ├── knowledge/     # Knowledge CRUD pages
│   │   ├── gaps/          # Knowledge Gap pages
│   │   ├── machines/      # Machines list
│   │   ├── departments/   # Departments list
│   │   ├── users/         # User management
│   │   ├── audit/         # Audit log
│   │   └── login/         # Auth
│   └── api/               # API routes
│       ├── knowledge/     # Knowledge CRUD + workflow + attachments
│       ├── gaps/          # Gap CRUD
│       ├── dashboard/     # Aggregated stats
│       └── auth/          # NextAuth
├── components/            # Shared UI components
├── i18n/                  # Internationalization config
└── lib/                   # Utilities (prisma, auth, validations, health-score)
messages/                  # Translation files (ar.json, fr.json, en.json)
prisma/                    # Schema + seed script
```

## Environment Variables

See `.env.example` for all required variables.

## License

Private — All rights reserved.
