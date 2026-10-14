"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  useGetStockItemsQuery, useGetSalesQuery, useGetExpensesQuery,
  useAddSaleMutation, useAddStockItemMutation, useAddExpenseMutation,
} from "@/store/api";
import { formatNaira } from "@/lib/utils";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function SalesForm() {
  const { data: items } = useGetStockItemsQuery();
  const [addSale, { isLoading }] = useAddSaleMutation();
  const [itemId, setItemId] = useState("");
  const [quantitySold, setQuantitySold] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayInputValue());

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemId) return;
    await addSale({ itemId, quantitySold: Number(quantitySold), amount: Number(amount), date: new Date(date).toISOString() }).unwrap();
    setQuantitySold("");
    setAmount("");
    toast.success("Sale logged");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="item">Item sold</Label>
        <Select value={itemId} onValueChange={setItemId}>
          <SelectTrigger id="item">
            <SelectValue placeholder="Select an item…" />
          </SelectTrigger>
          <SelectContent>
            {items?.map((it) => (
              <SelectItem key={it.id} value={it.id}>{it.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="qty">Quantity sold</Label>
          <Input id="qty" type="number" min={1} required value={quantitySold} onChange={(e) => setQuantitySold(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="amount">Amount (₦)</Label>
          <Input id="amount" type="number" min={0} required value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading || !itemId || !items?.length}>
        {isLoading ? "Saving…" : "Save Entry"}
      </Button>
      {!items?.length && <p className="text-xs text-body">Add a stock item on the Stock tab first, so you can log sales against it.</p>}
    </form>
  );
}

function StockForm() {
  const [addStockItem, { isLoading }] = useAddStockItemMutation();
  const [name, setName] = useState("");
  const [quantityOnHand, setQuantityOnHand] = useState("");
  const [reorderPoint, setReorderPoint] = useState("5");
  const [unitPrice, setUnitPrice] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await addStockItem({ name, quantityOnHand: Number(quantityOnHand), reorderPoint: Number(reorderPoint || 5), unitPrice: Number(unitPrice || 0) }).unwrap();
    setName("");
    setQuantityOnHand("");
    setUnitPrice("");
    toast.success("Stock item added");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="itemName">Item name</Label>
        <Input id="itemName" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Cooking Oil (5L)" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="onHand">Quantity in stock</Label>
          <Input id="onHand" type="number" min={0} required value={quantityOnHand} onChange={(e) => setQuantityOnHand(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="reorder">Reorder point</Label>
          <Input id="reorder" type="number" min={0} value={reorderPoint} onChange={(e) => setReorderPoint(e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="unitPrice">Unit price (₦, optional)</Label>
        <Input id="unitPrice" type="number" min={0} value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving…" : "Add Item"}
      </Button>
    </form>
  );
}

function ExpenseForm() {
  const [addExpense, { isLoading }] = useAddExpenseMutation();
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayInputValue());

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await addExpense({ category, amount: Number(amount), date: new Date(date).toISOString() }).unwrap();
    setCategory("");
    setAmount("");
    toast.success("Expense logged");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="category">Category</Label>
        <Input id="category" required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Transport, Rent, Supplies…" />
      </div>
      <div>
        <Label htmlFor="expAmount">Amount (₦)</Label>
        <Input id="expAmount" type="number" min={0} required value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="expDate">Date</Label>
        <Input id="expDate" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving…" : "Save Entry"}
      </Button>
    </form>
  );
}

function RecentActivity() {
  const { data: sales } = useGetSalesQuery();
  const { data: expenses } = useGetExpensesQuery();

  const combined = [
    ...(sales ?? []).map((s) => ({ id: s.id, label: s.itemName, amount: s.amount, date: s.date, kind: "sale" as const })),
    ...(expenses ?? []).map((e) => ({ id: e.id, label: e.category, amount: e.amount, date: e.date, kind: "expense" as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  if (combined.length === 0) return null;

  return (
    <div className="mt-8">
      <p className="font-display text-base font-medium text-ink">Recent Entries</p>
      <div className="mt-3 grid gap-2 lg:grid-cols-2">
        <AnimatePresence initial={false}>
          {combined.map((entry) => (
            <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card>
                <CardContent className="flex items-center justify-between py-3">
                  <span className="text-sm text-ink">{entry.label}</span>
                  <span className={`tabular text-sm font-medium ${entry.kind === "sale" ? "text-success" : "text-alert-red"}`}>
                    {entry.kind === "sale" ? "+" : "-"}{formatNaira(entry.amount)}
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function LogPage() {
  return (
    <div className="px-5 pb-8 pt-8 lg:px-8 lg:pt-10">
      <p className="font-display text-sm text-gold-dark">Daily Log</p>
      <h1 className="font-display text-2xl font-medium text-ink lg:text-3xl">Record Today&apos;s Activity</h1>

      <Tabs defaultValue="sales" className="mt-6">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="expense">Expense</TabsTrigger>
        </TabsList>

        <Card className="mt-4 lg:max-w-md">
          <CardContent className="pt-5">
            <TabsContent value="sales"><SalesForm /></TabsContent>
            <TabsContent value="stock"><StockForm /></TabsContent>
            <TabsContent value="expense"><ExpenseForm /></TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <RecentActivity />
    </div>
  );
}
