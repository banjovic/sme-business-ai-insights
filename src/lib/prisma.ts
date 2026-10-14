// This project's data model is defined in prisma/schema.prisma (see
// Chapter 3, Fig. 3.4) and is intended to be accessed through the real,
// generated Prisma Client. In THIS sandboxed build environment, Prisma's
// CLI cannot download its query/schema engine binaries (the domain it uses
// is not reachable here), so `prisma generate` cannot run. To keep the
// application genuinely runnable for review, this file currently exports a
// hand-written, Prisma-call-compatible shim (src/lib/db-shim.ts) backed
// directly by better-sqlite3 instead.
//
// ON YOUR OWN MACHINE (with normal internet access), switch back to the
// real Prisma Client like this:
//
//   1. npx prisma generate
//   2. npx prisma db push
//   3. Replace the export line below with:
//
//        import { PrismaClient } from "@prisma/client";
//        import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
//
//        const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
//        const adapter = new PrismaBetterSQLite3({ url: process.env.DATABASE_URL! });
//        export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
//        if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
//
//      (npm install @prisma/adapter-better-sqlite3 first)
//
// No other file needs to change — every call site in src/app/api/**/route.ts
// and src/lib/ai/*.ts is written directly against the Prisma Client API.
export { prisma } from "@/lib/db-shim";
