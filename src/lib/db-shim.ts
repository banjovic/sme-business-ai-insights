// Lightweight Prisma-compatible data-access shim
// ==================================================
// WHY THIS FILE EXISTS: prisma/schema.prisma (see Chapter 3, Fig. 3.4) is
// the authoritative data model for this project, and on a normal machine
// with internet access you would run the real Prisma Client generated from
// it (`npx prisma generate && npx prisma db push`). This sandboxed build
// environment blocks the domain Prisma's CLI downloads its query/schema
// engine binaries from, so `prisma generate` cannot complete here.
//
// To keep the application genuinely runnable and testable in this
// environment, this file re-implements — by hand, with raw SQL over
// better-sqlite3 — exactly the set of Prisma Client calls used elsewhere in
// the codebase. Every call site in src/app/api/**/route.ts and
// src/lib/ai/*.ts is written against the Prisma Client API and is unaware
// this shim exists. See src/lib/prisma.ts for how to switch to the real
// Prisma Client once you have normal internet access.

import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";

const rawUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
const dbPath = rawUrl.replace(/^file:/, "");
const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const db = new Database(resolvedPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, passwordHash TEXT NOT NULL, createdAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS Business (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, sector TEXT NOT NULL, location TEXT NOT NULL,
    userId TEXT UNIQUE NOT NULL, createdAt TEXT NOT NULL, FOREIGN KEY (userId) REFERENCES User(id)
  );
  CREATE TABLE IF NOT EXISTS StockItem (
    id TEXT PRIMARY KEY, businessId TEXT NOT NULL, name TEXT NOT NULL,
    quantityOnHand INTEGER NOT NULL DEFAULT 0, reorderPoint INTEGER NOT NULL DEFAULT 5,
    unitPrice REAL NOT NULL DEFAULT 0, createdAt TEXT NOT NULL,
    FOREIGN KEY (businessId) REFERENCES Business(id)
  );
  CREATE TABLE IF NOT EXISTS SaleRecord (
    id TEXT PRIMARY KEY, businessId TEXT NOT NULL, itemId TEXT NOT NULL,
    quantitySold INTEGER NOT NULL, amount REAL NOT NULL, date TEXT NOT NULL, createdAt TEXT NOT NULL,
    FOREIGN KEY (businessId) REFERENCES Business(id), FOREIGN KEY (itemId) REFERENCES StockItem(id)
  );
  CREATE TABLE IF NOT EXISTS ExpenseRecord (
    id TEXT PRIMARY KEY, businessId TEXT NOT NULL, category TEXT NOT NULL,
    amount REAL NOT NULL, date TEXT NOT NULL, createdAt TEXT NOT NULL,
    FOREIGN KEY (businessId) REFERENCES Business(id)
  );
  CREATE TABLE IF NOT EXISTS Insight (
    id TEXT PRIMARY KEY, businessId TEXT NOT NULL, type TEXT NOT NULL, severity TEXT NOT NULL,
    message TEXT NOT NULL, meta TEXT, generatedAt TEXT NOT NULL,
    FOREIGN KEY (businessId) REFERENCES Business(id)
  );
  CREATE TABLE IF NOT EXISTS ConversationLog (
    id TEXT PRIMARY KEY, userId TEXT NOT NULL, question TEXT NOT NULL, answer TEXT NOT NULL,
    intent TEXT, timestamp TEXT NOT NULL, FOREIGN KEY (userId) REFERENCES User(id)
  );
`);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDate<T extends Record<string, any>>(row: T | undefined, fields: string[]): any {
  if (!row) return row;
  const copy: Record<string, unknown> = { ...row };
  for (const f of fields) if (copy[f]) copy[f] = new Date(copy[f] as string);
  return copy;
}

function isoOf(value: string | Date | undefined): string {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : value;
}

export const prisma = {
  user: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findUnique({ where }: any) {
      if (where.email) {
        const row = db.prepare("SELECT * FROM User WHERE email = ?").get(where.email);
        return toDate(row as never, ["createdAt"]);
      }
      throw new Error("db-shim: unsupported user.findUnique where clause");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create({ data }: any) {
      const userId = randomUUID();
      const createdAt = new Date().toISOString();
      db.prepare("INSERT INTO User (id, email, passwordHash, createdAt) VALUES (?,?,?,?)").run(
        userId, data.email, data.passwordHash, createdAt
      );
      if (data.business?.create) {
        const b = data.business.create;
        db.prepare(
          "INSERT INTO Business (id, name, sector, location, userId, createdAt) VALUES (?,?,?,?,?,?)"
        ).run(randomUUID(), b.name, b.sector, b.location, userId, createdAt);
      }
      return { id: userId, email: data.email, passwordHash: data.passwordHash, createdAt: new Date(createdAt) };
    },
  },

  business: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findUnique({ where }: any) {
      const row = where.userId
        ? db.prepare("SELECT * FROM Business WHERE userId = ?").get(where.userId)
        : db.prepare("SELECT * FROM Business WHERE id = ?").get(where.id);
      return toDate(row as never, ["createdAt"]);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findUniqueOrThrow({ where, include }: any) {
      const row = db.prepare("SELECT * FROM Business WHERE id = ?").get(where.id);
      if (!row) throw new Error("db-shim: Business not found");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const business: any = toDate(row as never, ["createdAt"]);

      if (include?.stockItems) {
        const items = db.prepare("SELECT * FROM StockItem WHERE businessId = ?").all(business.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        business.stockItems = (items as any[]).map((it) => {
          const itemObj = toDate(it, ["createdAt"]);
          if (include.stockItems.include?.sales) {
            const sales = db.prepare("SELECT * FROM SaleRecord WHERE itemId = ?").all(it.id);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            itemObj.sales = (sales as any[]).map((s) => toDate(s, ["date", "createdAt"]));
          }
          return itemObj;
        });
      }
      if (include?.expenses) {
        const expenses = db.prepare("SELECT * FROM ExpenseRecord WHERE businessId = ?").all(business.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        business.expenses = (expenses as any[]).map((e) => toDate(e, ["date", "createdAt"]));
      }
      return business;
    },
  },

  stockItem: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findMany({ where, orderBy }: any) {
      let sql = "SELECT * FROM StockItem WHERE businessId = ?";
      if (orderBy?.name === "asc") sql += " ORDER BY name ASC";
      const rows = db.prepare(sql).all(where.businessId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rows as any[]).map((r) => toDate(r, ["createdAt"]));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findFirst({ where }: any) {
      const row = db.prepare("SELECT * FROM StockItem WHERE id = ? AND businessId = ?").get(where.id, where.businessId);
      return toDate(row as never, ["createdAt"]);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create({ data }: any) {
      const itemId = randomUUID();
      const createdAt = new Date().toISOString();
      db.prepare(
        "INSERT INTO StockItem (id, businessId, name, quantityOnHand, reorderPoint, unitPrice, createdAt) VALUES (?,?,?,?,?,?,?)"
      ).run(itemId, data.businessId, data.name, data.quantityOnHand, data.reorderPoint ?? 5, data.unitPrice ?? 0, createdAt);
      return {
        id: itemId, businessId: data.businessId, name: data.name, quantityOnHand: data.quantityOnHand,
        reorderPoint: data.reorderPoint ?? 5, unitPrice: data.unitPrice ?? 0, createdAt: new Date(createdAt),
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update({ where, data }: any) {
      const sets: string[] = [];
      const vals: unknown[] = [];
      for (const k of Object.keys(data)) { sets.push(`${k} = ?`); vals.push(data[k]); }
      vals.push(where.id);
      db.prepare(`UPDATE StockItem SET ${sets.join(", ")} WHERE id = ?`).run(...(vals as never[]));
      const row = db.prepare("SELECT * FROM StockItem WHERE id = ?").get(where.id);
      return toDate(row as never, ["createdAt"]);
    },
  },

  saleRecord: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findMany({ where, orderBy, take }: any) {
      let sql = "SELECT s.*, i.name as itemName FROM SaleRecord s JOIN StockItem i ON s.itemId = i.id WHERE s.businessId = ?";
      if (orderBy?.date === "desc") sql += " ORDER BY s.date DESC";
      if (take) sql += ` LIMIT ${Number(take)}`;
      const rows = db.prepare(sql).all(where.businessId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rows as any[]).map((r) => {
        const { itemName, ...rest } = r;
        const obj = toDate(rest, ["date", "createdAt"]);
        obj.item = { name: itemName };
        return obj;
      });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create({ data }: any) {
      const saleId = randomUUID();
      const createdAt = new Date().toISOString();
      const dateStr = isoOf(data.date);
      db.prepare(
        "INSERT INTO SaleRecord (id, businessId, itemId, quantitySold, amount, date, createdAt) VALUES (?,?,?,?,?,?,?)"
      ).run(saleId, data.businessId, data.itemId, data.quantitySold, data.amount, dateStr, createdAt);
      return { id: saleId, ...data, date: new Date(dateStr), createdAt: new Date(createdAt) };
    },
  },

  expenseRecord: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findMany({ where, orderBy, take }: any) {
      let sql = "SELECT * FROM ExpenseRecord WHERE businessId = ?";
      if (orderBy?.date === "desc") sql += " ORDER BY date DESC";
      if (take) sql += ` LIMIT ${Number(take)}`;
      const rows = db.prepare(sql).all(where.businessId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rows as any[]).map((r) => toDate(r, ["date", "createdAt"]));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create({ data }: any) {
      const expenseId = randomUUID();
      const createdAt = new Date().toISOString();
      const dateStr = isoOf(data.date);
      db.prepare("INSERT INTO ExpenseRecord (id, businessId, category, amount, date, createdAt) VALUES (?,?,?,?,?,?)").run(
        expenseId, data.businessId, data.category, data.amount, dateStr, createdAt
      );
      return { id: expenseId, ...data, date: new Date(dateStr), createdAt: new Date(createdAt) };
    },
  },

  insight: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async deleteMany({ where }: any) {
      const info = db.prepare("DELETE FROM Insight WHERE businessId = ?").run(where.businessId);
      return { count: info.changes };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createMany({ data }: any) {
      const stmt = db.prepare(
        "INSERT INTO Insight (id, businessId, type, severity, message, meta, generatedAt) VALUES (?,?,?,?,?,?,?)"
      );
      const now = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const d of data as any[]) {
        stmt.run(randomUUID(), d.businessId, d.type, d.severity, d.message, d.meta ?? null, now);
      }
      return { count: data.length };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findMany({ where, orderBy }: any) {
      let sql = "SELECT * FROM Insight WHERE businessId = ?";
      const parts: string[] = [];
      if (Array.isArray(orderBy)) {
        for (const o of orderBy) {
          const [key, dir] = Object.entries(o)[0] as [string, string];
          parts.push(`${key} ${dir.toUpperCase()}`);
        }
      }
      if (parts.length) sql += " ORDER BY " + parts.join(", ");
      const rows = db.prepare(sql).all(where.businessId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rows as any[]).map((r) => toDate(r, ["generatedAt"]));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findFirst({ where, orderBy }: any) {
      let sql = "SELECT * FROM Insight WHERE businessId = ? AND type = ?";
      if (orderBy?.generatedAt === "desc") sql += " ORDER BY generatedAt DESC";
      sql += " LIMIT 1";
      const row = db.prepare(sql).get(where.businessId, where.type);
      return toDate(row as never, ["generatedAt"]);
    },
  },

  conversationLog: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findMany({ where, orderBy, take }: any) {
      let sql = "SELECT * FROM ConversationLog WHERE userId = ?";
      if (orderBy?.timestamp === "asc") sql += " ORDER BY timestamp ASC";
      if (take) sql += ` LIMIT ${Number(take)}`;
      const rows = db.prepare(sql).all(where.userId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rows as any[]).map((r) => toDate(r, ["timestamp"]));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create({ data }: any) {
      const logId = randomUUID();
      const timestamp = new Date().toISOString();
      db.prepare("INSERT INTO ConversationLog (id, userId, question, answer, intent, timestamp) VALUES (?,?,?,?,?,?)").run(
        logId, data.userId, data.question, data.answer, data.intent ?? null, timestamp
      );
      return { id: logId, ...data, timestamp: new Date(timestamp) };
    },
  },

  // Prisma's array form of $transaction takes already-constructed operation
  // promises. Because better-sqlite3 executes synchronously, each operation
  // in the array has, in practice, already run by the time this function
  // receives them (JS evaluates array literals left-to-right). This
  // preserves call-site compatibility and ordering but is NOT atomic — a
  // documented limitation of this sandbox-only shim, not of the production
  // Prisma/PostgreSQL path described in Chapter 4.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async $transaction(ops: Promise<any>[]) {
    const results = [];
    for (const op of ops) results.push(await op);
    return results;
  },
};
