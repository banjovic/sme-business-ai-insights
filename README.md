# AI-Powered Business Intelligence Platform for Nigerian SMEs

This is the working prototype accompanying the final-year project report
(Chapters 1–4). It implements the platform designed in Chapter 3 and
described in Chapter 4: a mobile-first web app where an SME owner logs
daily sales, stock, and expenses, and receives plain-language, AI-generated
insights — stockout warnings, slow-selling-period alerts, and unusual-
spending flags — plus a conversational query interface.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript, Tailwind CSS,
  hand-built shadcn/ui-style components, Motion for animation, Redux
  Toolkit + RTK Query for data fetching/caching.
- **Backend/API:** Next.js Route Handlers (Node.js runtime).
- **AI/ML layer:** Hand-written TypeScript models in `src/lib/ai/` —
  stockout prediction (sales-velocity based), slow-selling-period detection
  (recent-vs-baseline comparison), and unusual-spending detection
  (z-score anomaly detection) — plus a rule-based conversational
  intent-classifier standing in for the LLM function-calling design
  described in Chapter 3, Section 3.6.4 (see that file for how to swap in
  a real LLM API).
- **Database:** PostgreSQL via Prisma (`prisma/schema.prisma` defines the schema).
- **Auth:** a small hand-rolled signed-cookie session (`src/lib/auth.ts`),
  standing in for the NextAuth.js/Auth.js approach specified in Chapter 4.

## Database setup

The app uses the generated Prisma Client with PostgreSQL, including Supabase.
Set `DATABASE_URL` in `.env` to your PostgreSQL connection string. The public
Supabase URL and publishable key alone do not connect Prisma to the database.
For a Supabase transaction pooler, use the connection parameters recommended
in your project's connection settings.

`npm install` generates the client automatically. After changing the schema,
run `npm run db:generate`. For a new database, run `npm run db:push` to create
the application tables; review schema changes before applying to existing data.
The optional demo seed adds data only if its demo email does not already exist.

## Getting started

```bash
npm install
npm run db:push     # creates the application tables in the configured database
npm run db:seed     # optional demo account + 5 weeks of data
npm run dev          # http://localhost:3000
```

Demo login: **demo@adaezestores.ng** / **demo1234**

The seeded data is engineered so all three AI models have something to
detect on first login: Cooking Oil is about to run out, Milk Cartons sales
have dropped sharply this week, and one Transport expense is a clear
outlier.

To build for production:

```bash
npm run build
npm run start
```

## Project structure

```
src/
  app/
    login/, register/          — auth pages
    (app)/dashboard, log, chat — the three main screens (protected)
    api/                        — route handlers (auth, stock, sales,
                                   expenses, insights, chat)
  lib/
    ai/                         — the four AI/ML modules (Chapter 3, 3.6.3–3.6.4)
    auth.ts, currentBusiness.ts, prisma.ts, utils.ts
  components/ui/                — hand-built shadcn/ui-style components
  store/                        — Redux store + RTK Query API slice
prisma/
  schema.prisma                 — data model (Chapter 3, Fig. 3.4)
  seed.ts                       — demo data generator
```

## What's implemented vs. simplified for this prototype

| Area | Chapter 4 design | This build |
|---|---|---|
| Auth | NextAuth.js/Auth.js | Hand-rolled signed-cookie session |
| Database | PostgreSQL via Prisma | PostgreSQL via Prisma |
| AI/ML layer | Separate Python/FastAPI microservice | In-process TypeScript (same algorithms, no cross-service hop) |
| Conversational layer | LLM API via function-calling | Rule-based intent classifier over the same fixed intent set |

Each simplification is called out in code comments at the relevant file,
with the production-path swap documented alongside it.
