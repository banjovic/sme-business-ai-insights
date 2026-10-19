"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Store } from "lucide-react";

const SHOWCASE_ACCOUNTS = [
  { name: "Default Demo Account", email: "demo@adaezestores.ng", sector: "Retail Provisions", location: "Lagos" },
  { name: "Adaeze Stores", email: "adaeze@adaezestores.ng", sector: "Retail Provisions", location: "Lagos" },
  { name: "Chidi Tech & Gadgets", email: "chidi@chidicorner.ng", sector: "Electronics & Repairs", location: "Ikeja, Lagos" },
  { name: "Kano Fine Textiles", email: "aminu@kanotextiles.ng", sector: "Fabrics & Attire", location: "Kano" },
  { name: "Ifeoma Bakes & Pastries", email: "ifeoma@ifeomabakes.ng", sector: "Bakery & Food", location: "Enugu" },
  { name: "Danladi Agro Supplies", email: "danladi@danladiagro.ng", sector: "Grains & Produce", location: "Jos" },
  { name: "Boluwatife Fashion House", email: "bolu@bolufashion.ng", sector: "Boutique & Tailoring", location: "Ibadan" },
  { name: "Deji Auto Spare Parts", email: "deji@dejiauto.ng", sector: "Automotive Spares", location: "Ladipo, Lagos" },
  { name: "Grace Essential Pharmacy", email: "grace@gracepharm.ng", sector: "Pharmaceuticals", location: "Abuja" },
  { name: "Nnamdi Building Materials", email: "nnamdi@nnamdimaterials.ng", sector: "Building & Hardware", location: "Onitsha" },
  { name: "Amina Natural Cosmetics", email: "amina@aminacosmetics.ng", sector: "Beauty & Salon", location: "Kaduna" },
  { name: "Barakat Cold Room & Foods", email: "barakat@barakatfoods.ng", sector: "Frozen Foods", location: "Port Harcourt" },
  { name: "Abeokuta Heritage Pottery", email: "segun@abeokutacrafts.ng", sector: "Crafts & Decor", location: "Abeokuta" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);

  async function handleLogin(loginEmail: string, loginPass: string) {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Incorrect email or password");
        return;
      }

      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleLogin(email, password);
  }

  function fillAccount(accEmail: string) {
    setEmail(accEmail);
    setPassword("Showcase2026!");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <p className="font-display text-sm text-gold-dark">Welcome back</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Business Insight</h1>
        <p className="mt-2 text-[15px] text-body">Log in to see what your business is telling you today.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-md bg-alert-red/10 px-3 py-2 text-sm text-alert-red">
              {error}
            </motion.p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-body">
          New here?{" "}
          <Link href="/register" className="font-medium text-navy underline underline-offset-2">Set up your business</Link>
        </p>

        <div className="mt-8 rounded-md border border-line bg-surface p-4 text-xs text-body">
          <p className="font-medium text-ink">Trying the demo?</p>
          <p className="mt-1">
            Email: <span className="tabular font-mono text-ink">demo@adaezestores.ng</span> · Password: <span className="tabular font-mono text-ink">Showcase2026!</span>
          </p>

          <div className="mt-3 border-t border-line/60 pt-2">
            <button
              type="button"
              onClick={() => setShowAccounts(!showAccounts)}
              className="flex w-full items-center justify-between font-medium text-navy hover:underline"
            >
              <span className="flex items-center gap-1.5">
                <Store size={14} className="text-gold-dark" />
                All 12 Showcase SME Accounts ({showAccounts ? "Hide" : "Select"})
              </span>
              {showAccounts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAccounts && (
              <div className="mt-2 divide-y divide-line/60 max-h-56 overflow-y-auto space-y-1">
                <p className="pb-1 text-[11px] text-body/80">Click any business below to auto-fill its login credentials:</p>
                {SHOWCASE_ACCOUNTS.map((acc) => (
                  <div
                    key={acc.email}
                    onClick={() => fillAccount(acc.email)}
                    className="pt-1.5 pb-1 flex justify-between items-center cursor-pointer hover:bg-canvas p-1 rounded transition-colors"
                  >
                    <div>
                      <p className="font-medium text-ink">{acc.name}</p>
                      <p className="text-[11px] text-body">{acc.sector} · {acc.location}</p>
                    </div>
                    <span className="font-mono text-[10px] text-navy bg-navy/5 px-1.5 py-0.5 rounded">
                      Use this
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <LoginForm />
    </Suspense>
  );
}
