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
- **Database:** SQLite locally (`prisma/schema.prisma` defines the schema,
  matching the ERD in Chapter 3, Figure 3.4); swaps to PostgreSQL for
  production by changing one line, per Chapter 4, Table 4.1.
- **Auth:** a small hand-rolled signed-cookie session (`src/lib/auth.ts`),
  standing in for the NextAuth.js/Auth.js approach specified in Chapter 4.

## ⚠️ About the database layer in this build

`prisma/schema.prisma` is the authoritative data model. On a normal machine
with internet access, you'd use the real, generated Prisma Client. This
project was assembled in a sandboxed environment that blocks the domain
Prisma's CLI downloads its engine binaries from, so `prisma generate`
couldn't run there. To keep the app genuinely testable, `src/lib/prisma.ts`
currently re-exports a hand-written shim (`src/lib/db-shim.ts`) that
implements the exact Prisma Client calls used elsewhere in the app, backed
directly by `better-sqlite3`. Every route and AI module is written against
the normal Prisma Client API and has no idea the shim exists.

**On your own machine, switch to the real Prisma Client:**

```bash
npm install @prisma/adapter-better-sqlite3
npx prisma generate
npx prisma db push
```

Then replace the single export line in `src/lib/prisma.ts` with the
real-Prisma-Client version documented in that file's comments. No other
file needs to change.

## Getting started

```bash
npm install
npm run db:seed     # creates prisma/dev.db with a demo account + 5 weeks of data
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
    auth.ts, currentBusiness.ts, prisma.ts, db-shim.ts, utils.ts
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
| Database | PostgreSQL via Prisma | SQLite via a Prisma-call-compatible shim (see above) |
| AI/ML layer | Separate Python/FastAPI microservice | In-process TypeScript (same algorithms, no cross-service hop) |
| Conversational layer | LLM API via function-calling | Rule-based intent classifier over the same fixed intent set |

Each simplification is called out in code comments at the relevant file,
with the production-path swap documented alongside it.
