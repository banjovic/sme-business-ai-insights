"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Search,
  TrendingUp,
  Receipt,
  Package,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  useGetStockItemsQuery,
  useGetSalesQuery,
  useGetExpensesQuery,
  useAddSaleMutation,
  useAddStockItemMutation,
  useAddExpenseMutation,
  useRestockItemMutation,
  type StockItemDTO,
} from "@/store/api";
import { formatNaira } from "@/lib/utils";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatLogDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
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
    await addSale({
      itemId,
      quantitySold: Number(quantitySold),
      amount: Number(amount),
      date: new Date(date).toISOString(),
    }).unwrap();
    setQuantitySold("");
    setAmount("");
    toast.success("Sale logged successfully");
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
              <SelectItem key={it.id} value={it.id}>
                {it.name} ({it.quantityOnHand} in stock)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="qty">Quantity sold</Label>
          <Input
            id="qty"
            type="number"
            min={1}
            required
            value={quantitySold}
            onChange={(e) => setQuantitySold(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="amount">Amount (₦)</Label>
          <Input
            id="amount"
            type="number"
            min={0}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <Button type="submit" className="w-full bg-navy text-white hover:bg-navy/90" disabled={isLoading || !itemId || !items?.length}>
        {isLoading ? "Saving…" : "Save Sale"}
      </Button>
      {!items?.length && (
        <p className="text-xs text-body">
          Add a stock item on the Stock tab first, so you can log sales against it.
        </p>
      )}
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
    await addStockItem({
      name,
      quantityOnHand: Number(quantityOnHand),
      reorderPoint: Number(reorderPoint || 5),
      unitPrice: Number(unitPrice || 0),
    }).unwrap();
    setName("");
    setQuantityOnHand("");
    setUnitPrice("");
    toast.success("Stock item cataloged");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="itemName">Item name</Label>
        <Input
          id="itemName"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Cooking Oil (5L)"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="onHand">Initial stock units</Label>
          <Input
            id="onHand"
            type="number"
            min={0}
            required
            value={quantityOnHand}
            onChange={(e) => setQuantityOnHand(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="reorder">Reorder threshold</Label>
          <Input
            id="reorder"
            type="number"
            min={0}
            value={reorderPoint}
            onChange={(e) => setReorderPoint(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="unitPrice">Unit price (₦)</Label>
        <Input
          id="unitPrice"
          type="number"
          min={0}
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          placeholder="14500"
        />
      </div>
      <Button type="submit" className="w-full bg-navy text-white hover:bg-navy/90" disabled={isLoading}>
        {isLoading ? "Saving…" : "Add Stock Item"}
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
    await addExpense({
      category,
      amount: Number(amount),
      date: new Date(date).toISOString(),
    }).unwrap();
    setCategory("");
    setAmount("");
    toast.success("Expense logged successfully");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Generator Fuel, Shop Rent, Transport…"
        />
      </div>
      <div>
        <Label htmlFor="expAmount">Amount (₦)</Label>
        <Input
          id="expAmount"
          type="number"
          min={0}
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="expDate">Date</Label>
        <Input id="expDate" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <Button type="submit" className="w-full bg-navy text-white hover:bg-navy/90" disabled={isLoading}>
        {isLoading ? "Saving…" : "Save Expense"}
      </Button>
    </form>
  );
}

function RestockDialog({ item }: { item: StockItemDTO }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("5");
  const [restockItem, { isLoading }] = useRestockItemMutation();

  async function onRestock(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    if (qty <= 0) return;
    try {
      await restockItem({ itemId: item.id, quantity: qty }).unwrap();
      toast.success(`Restocked ${qty} units of ${item.name}`);
      setOpen(false);
    } catch {
      toast.error("Failed to restock item");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-navy hover:border-navy">
          <PlusCircle size={14} />
          Restock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restock {item.name}</DialogTitle>
          <DialogDescription>
            Current stock: <strong>{item.quantityOnHand} units</strong> (Reorder point: {item.reorderPoint})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onRestock} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="restockQty">Units to add</Label>
            <Input
              id="restockQty"
              type="number"
              min={1}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading} className="bg-navy text-white hover:bg-navy/90">
              {isLoading ? "Saving…" : "Confirm Restock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FullLogsSection() {
  const { data: sales, isLoading: isSalesLoading } = useGetSalesQuery();
  const { data: stockItems, isLoading: isStockLoading } = useGetStockItemsQuery();
  const { data: expenses, isLoading: isExpensesLoading } = useGetExpensesQuery();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "sales" | "expenses" | "stock">("all");
  const [showAll, setShowAll] = useState(false);

  // Combined audit trail
  const combined = useMemo(() => {
    const list = [
      ...(sales ?? []).map((s) => ({
        id: s.id,
        label: s.itemName,
        subtext: `${s.quantitySold} units sold`,
        amount: s.amount,
        date: s.date,
        kind: "sale" as const,
      })),
      ...(expenses ?? []).map((e) => ({
        id: e.id,
        label: e.category,
        subtext: "Operating expense",
        amount: e.amount,
        date: e.date,
        kind: "expense" as const,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((item) => item.label.toLowerCase().includes(q));
  }, [sales, expenses, search]);

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    if (!search.trim()) return sales;
    const q = search.toLowerCase();
    return sales.filter((s) => s.itemName.toLowerCase().includes(q));
  }, [sales, search]);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    if (!search.trim()) return expenses;
    const q = search.toLowerCase();
    return expenses.filter((e) => e.category.toLowerCase().includes(q));
  }, [expenses, search]);

  const filteredStock = useMemo(() => {
    if (!stockItems) return [];
    if (!search.trim()) return stockItems;
    const q = search.toLowerCase();
    return stockItems.filter((i) => i.name.toLowerCase().includes(q));
  }, [stockItems, search]);

  const totalSalesRevenue = useMemo(
    () => sales?.reduce((acc, s) => acc + s.amount, 0) ?? 0,
    [sales]
  );
  const totalExpensesAmount = useMemo(
    () => expenses?.reduce((acc, e) => acc + e.amount, 0) ?? 0,
    [expenses]
  );

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-medium text-ink">Full Activity Logs</h2>
          <p className="text-xs text-body">Complete ledger of your sales, expenses, and inventory</p>
        </div>

        {/* Search Input */}
        <div className="relative mt-2 sm:mt-0 sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-body/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions…"
            className="h-9 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-xs text-ink placeholder:text-body/60 focus:outline-none focus:ring-1 focus:ring-teal"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
        <TabsList className="grid w-full grid-cols-4 sm:inline-flex sm:w-auto">
          <TabsTrigger value="all" className="text-xs">
            All ({combined.length})
          </TabsTrigger>
          <TabsTrigger value="sales" className="text-xs">
            Sales ({sales?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs">
            Expenses ({expenses?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="stock" className="text-xs">
            Stock ({stockItems?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* 1. All Activity Tab */}
        <TabsContent value="all" className="mt-3">
          <Card>
            <CardContent className="pt-4">
              {combined.length === 0 ? (
                <p className="py-6 text-center text-sm text-body">
                  {search ? "No matching records found." : "No transactions logged yet."}
                </p>
              ) : (
                <div className="space-y-2">
                  {(showAll ? combined : combined.slice(0, 10)).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between border-b border-line/50 py-2.5 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            entry.kind === "sale"
                              ? "bg-pearl-aqua/20 text-swatch-dark-teal"
                              : "bg-alert-red/10 text-alert-red"
                          }`}
                        >
                          {entry.kind === "sale" ? <TrendingUp size={15} /> : <Receipt size={15} />}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-ink">{entry.label}</p>
                          <p className="text-xs text-body">
                            {entry.subtext} • {formatLogDate(entry.date)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`tabular text-sm font-semibold ${
                          entry.kind === "sale" ? "text-swatch-dark-teal" : "text-alert-red"
                        }`}
                      >
                        {entry.kind === "sale" ? "+" : "-"}
                        {formatNaira(entry.amount)}
                      </span>
                    </div>
                  ))}

                  {combined.length > 10 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAll(!showAll)}
                      className="mt-3 w-full text-xs text-body hover:bg-canvas"
                    >
                      {showAll ? (
                        <span className="flex items-center gap-1">
                          Show less <ChevronUp size={14} />
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          View all {combined.length} entries <ChevronDown size={14} />
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Sales Tab */}
        <TabsContent value="sales" className="mt-3">
          <Card>
            <CardContent className="pt-4">
              <div className="mb-3 flex items-center justify-between border-b border-line pb-2.5 text-xs text-body">
                <span>
                  Showing {filteredSales.length} sales
                </span>
                <span className="font-medium text-ink">
                  Total: <strong className="text-swatch-dark-teal">{formatNaira(totalSalesRevenue)}</strong>
                </span>
              </div>

              {filteredSales.length === 0 ? (
                <p className="py-6 text-center text-sm text-body">No sales records found.</p>
              ) : (
                <div className="space-y-2">
                  {(showAll ? filteredSales : filteredSales.slice(0, 10)).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between border-b border-line/50 py-2.5 last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">{s.itemName}</p>
                        <p className="text-xs text-body">
                          {s.quantitySold} units sold • {formatLogDate(s.date)}
                        </p>
                      </div>
                      <span className="tabular text-sm font-semibold text-swatch-dark-teal">
                        +{formatNaira(s.amount)}
                      </span>
                    </div>
                  ))}

                  {filteredSales.length > 10 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAll(!showAll)}
                      className="mt-3 w-full text-xs text-body hover:bg-canvas"
                    >
                      {showAll ? "Show less" : `View all ${filteredSales.length} sales`}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Expenses Tab */}
        <TabsContent value="expenses" className="mt-3">
          <Card>
            <CardContent className="pt-4">
              <div className="mb-3 flex items-center justify-between border-b border-line pb-2.5 text-xs text-body">
                <span>
                  Showing {filteredExpenses.length} expenses
                </span>
                <span className="font-medium text-ink">
                  Total: <strong className="text-alert-red">{formatNaira(totalExpensesAmount)}</strong>
                </span>
              </div>

              {filteredExpenses.length === 0 ? (
                <p className="py-6 text-center text-sm text-body">No expense records found.</p>
              ) : (
                <div className="space-y-2">
                  {(showAll ? filteredExpenses : filteredExpenses.slice(0, 10)).map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between border-b border-line/50 py-2.5 last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">{e.category}</p>
                        <p className="text-xs text-body">{formatLogDate(e.date)}</p>
                      </div>
                      <span className="tabular text-sm font-semibold text-alert-red">
                        -{formatNaira(e.amount)}
                      </span>
                    </div>
                  ))}

                  {filteredExpenses.length > 10 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAll(!showAll)}
                      className="mt-3 w-full text-xs text-body hover:bg-canvas"
                    >
                      {showAll ? "Show less" : `View all ${filteredExpenses.length} expenses`}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Stock Catalog Tab */}
        <TabsContent value="stock" className="mt-3">
          <Card>
            <CardContent className="pt-4">
              {filteredStock.length === 0 ? (
                <p className="py-6 text-center text-sm text-body">No stock items found.</p>
              ) : (
                <div className="space-y-3">
                  {filteredStock.map((item) => {
                    const isLow = item.quantityOnHand <= item.reorderPoint;
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 rounded-lg border border-line bg-canvas/40 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-ink">{item.name}</p>
                            {isLow ? (
                              <Badge variant="warning" className="gap-1 py-0 text-[11px]">
                                <AlertTriangle size={11} /> Low Stock
                              </Badge>
                            ) : (
                              <Badge variant="success" className="gap-1 py-0 text-[11px]">
                                <CheckCircle2 size={11} /> In Stock
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-body">
                            <strong>{item.quantityOnHand} units</strong> available • Reorder point at {item.reorderPoint} • Unit price: {formatNaira(item.unitPrice)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <span className="text-xs font-medium text-body">
                            Asset value: <strong className="text-ink">{formatNaira(item.quantityOnHand * item.unitPrice)}</strong>
                          </span>
                          <RestockDialog item={item} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function LogPage() {
  return (
    <div className="px-5 pb-12 pt-8 lg:px-8 lg:pt-10">
      <p className="font-display text-sm text-gold-dark">Daily Operations</p>
      <h1 className="font-display text-2xl font-medium text-ink lg:text-3xl">Record & Audit Activity</h1>

      {/* Forms Section */}
      <Tabs defaultValue="sales" className="mt-6">
        <TabsList>
          <TabsTrigger value="sales">Log Sale</TabsTrigger>
          <TabsTrigger value="stock">Add Stock Item</TabsTrigger>
          <TabsTrigger value="expense">Log Expense</TabsTrigger>
        </TabsList>

        <Card className="mt-4 lg:max-w-md">
          <CardContent className="pt-5">
            <TabsContent value="sales">
              <SalesForm />
            </TabsContent>
            <TabsContent value="stock">
              <StockForm />
            </TabsContent>
            <TabsContent value="expense">
              <ExpenseForm />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      {/* Full Audit Logs Section */}
      <FullLogsSection />
    </div>
  );
}
