// Seeds a demo account ("Adaeze Stores") with several weeks of sales, stock,
// and expense history, engineered so that all three AI models in
// src/lib/ai/ have something meaningful to detect: an item running low, an
// item in a genuine slow patch, and one clearly anomalous expense.
//
// NOTE: run with `npm run db:seed`. Uses the same db-shim as the running
// app (see src/lib/prisma.ts for why) so seeded data is immediately visible
// to the Next.js dev server without a separate migration step. This script
// deletes and recreates the SQLite file for a clean slate on every run.
//
// IMPORTANT: db-shim is imported dynamically, AFTER the file deletion below,
// because a static top-level `import` would be hoisted above this cleanup
// code and open a database handle on a file we're about to delete out from
// under it (writes would then vanish when the process exits).

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const rawUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
const dbPath = rawUrl.replace(/^file:/, "");
const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
for (const suffix of ["", "-wal", "-shm"]) {
  if (fs.existsSync(resolvedPath + suffix)) fs.unlinkSync(resolvedPath + suffix);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d;
}

async function main() {
  const { prisma } = await import("../src/lib/db-shim");

  const passwordHash = await bcrypt.hash("demo1234", 10);
  const user = await prisma.user.create({
    data: {
      email: "demo@adaezestores.ng",
      passwordHash,
      business: { create: { name: "Adaeze Stores", sector: "Retail / Provisions Trading", location: "Lagos, Nigeria" } },
    },
  });
  const business = await prisma.business.findUnique({ where: { userId: user.id } });
  const businessId = business.id;

  const rice = await prisma.stockItem.create({ data: { businessId, name: "Bag of Rice (50kg)", quantityOnHand: 14, reorderPoint: 5, unitPrice: 35000 } });
  const oil = await prisma.stockItem.create({ data: { businessId, name: "Cooking Oil (5L)", quantityOnHand: 4, reorderPoint: 5, unitPrice: 9200 } });
  const milk = await prisma.stockItem.create({ data: { businessId, name: "Milk Cartons (Pack of 12)", quantityOnHand: 22, reorderPoint: 6, unitPrice: 7600 } });
  const detergent = await prisma.stockItem.create({ data: { businessId, name: "Detergent (1kg)", quantityOnHand: 30, reorderPoint: 8, unitPrice: 2100 } });

  const sales: { businessId: string; itemId: string; quantitySold: number; amount: number; date: Date }[] = [];

  for (let d = 34; d >= 0; d -= 3) sales.push({ businessId, itemId: rice.id, quantitySold: 1, amount: 35000, date: daysAgo(d) });

  for (let d = 34; d >= 8; d -= 2) sales.push({ businessId, itemId: oil.id, quantitySold: 2, amount: 18400, date: daysAgo(d) });
  for (let d = 6; d >= 0; d -= 1) sales.push({ businessId, itemId: oil.id, quantitySold: 2, amount: 18400, date: daysAgo(d) });

  for (let d = 34; d >= 8; d -= 2) sales.push({ businessId, itemId: milk.id, quantitySold: 3, amount: 22800, date: daysAgo(d) });
  for (let d = 6; d >= 0; d -= 3) sales.push({ businessId, itemId: milk.id, quantitySold: 1, amount: 7600, date: daysAgo(d) });

  for (let d = 30; d >= 0; d -= 4) sales.push({ businessId, itemId: detergent.id, quantitySold: 2, amount: 4200, date: daysAgo(d) });

  for (const s of sales) await prisma.saleRecord.create({ data: s });

  const expenses: { businessId: string; category: string; amount: number; date: Date }[] = [];
  for (let d = 32; d >= 4; d -= 4) expenses.push({ businessId, category: "Transport", amount: 3000 + Math.round(Math.random() * 800), date: daysAgo(d) });
  for (let d = 30; d >= 2; d -= 6) expenses.push({ businessId, category: "Rent", amount: 45000, date: daysAgo(d) });
  for (let d = 28; d >= 3; d -= 5) expenses.push({ businessId, category: "Utilities", amount: 4500 + Math.round(Math.random() * 500), date: daysAgo(d) });
  expenses.push({ businessId, category: "Transport", amount: 16500, date: daysAgo(2) });

  for (const e of expenses) await prisma.expenseRecord.create({ data: e });

  console.log("Seeded demo account:");
  console.log("  email:    demo@adaezestores.ng");
  console.log("  password: demo1234");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
