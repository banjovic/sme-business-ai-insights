"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Store, Sparkles, Loader2, Eye, EyeOff } from "lucide-react";

interface ShowcaseAccount {
  id?: string;
  name: string;
  email: string;
  sector: string;
  location: string;
  isDemo: boolean;
}

const DEFAULT_DEMO_ACCOUNTS: ShowcaseAccount[] = [
  { name: "Adaeze Stores (Demo)", email: "demo@adaezestores.ng", sector: "Retail Provisions", location: "Lagos", isDemo: true },
  { name: "Chidi Tech & Gadgets", email: "chidi@chidicorner.ng", sector: "Electronics & Repairs", location: "Ikeja, Lagos", isDemo: true },
  { name: "Kano Fine Textiles", email: "aminu@kanotextiles.ng", sector: "Fabrics & Attire", location: "Kano", isDemo: true },
  { name: "Ifeoma Bakes & Pastries", email: "ifeoma@ifeomabakes.ng", sector: "Bakery & Food", location: "Enugu", isDemo: true },
  { name: "Danladi Agro Supplies", email: "danladi@danladiagro.ng", sector: "Grains & Produce", location: "Jos", isDemo: true },
  { name: "Boluwatife Fashion House", email: "bolu@bolufashion.ng", sector: "Boutique & Tailoring", location: "Ibadan", isDemo: true },
  { name: "Deji Auto Spare Parts", email: "deji@dejiauto.ng", sector: "Automotive Spares", location: "Ladipo, Lagos", isDemo: true },
  { name: "Grace Essential Pharmacy", email: "grace@gracepharm.ng", sector: "Pharmaceuticals", location: "Abuja", isDemo: true },
  { name: "Nnamdi Building Materials", email: "nnamdi@nnamdimaterials.ng", sector: "Building & Hardware", location: "Onitsha", isDemo: true },
  { name: "Amina Natural Cosmetics", email: "amina@aminacosmetics.ng", sector: "Beauty & Salon", location: "Kaduna", isDemo: true },
  { name: "Barakat Cold Room & Foods", email: "barakat@barakatfoods.ng", sector: "Frozen Foods", location: "Port Harcourt", isDemo: true },
  { name: "Abeokuta Heritage Pottery", email: "segun@abeokutacrafts.ng", sector: "Crafts & Decor", location: "Abeokuta", isDemo: true },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/dashboard";

  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);

  const [accounts, setAccounts] = useState<ShowcaseAccount[]>(DEFAULT_DEMO_ACCOUNTS);
  const [accountsLoading, setAccountsLoading] = useState(false);

  useEffect(() => {
    async function loadAccounts() {
      setAccountsLoading(true);
      try {
        const res = await fetch("/api/showcase-accounts");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setAccounts(data);
          }
        }
      } catch {
        // Keep default accounts on error
      } finally {
        setAccountsLoading(false);
      }
    }
    loadAccounts();
  }, []);

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

      window.location.href = redirectUrl;
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

  function selectAccount(acc: ShowcaseAccount) {
    setEmail(acc.email);
    if (acc.isDemo) {
      setPassword("Showcase2026!");
    } else {
      setPassword("");
      passwordRef.current?.focus();
    }
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
            <div className="relative">
              <Input
                id="password"
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-body/60 hover:text-ink focus:outline-none focus-visible:text-ink transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-md bg-alert-red/10 px-3 py-2 text-sm text-alert-red">
              {error}
            </motion.p>
          )}

          <Button type="submit" size="lg" className="w-full" loading={loading}>
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

          {/* <div className="mt-3 border-t border-line/60 pt-2">
            <button
              type="button"
              onClick={() => setShowAccounts(!showAccounts)}
              className="flex w-full items-center justify-between font-medium text-navy hover:underline"
            >
              <span className="flex items-center gap-1.5">
                <Store size={14} className="text-gold-dark" />
                All SME Showcase Accounts ({accounts.length}) {showAccounts ? "(Hide)" : "(Select)"}
              </span>
              {showAccounts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAccounts && (
              <div className="mt-2 divide-y divide-line/60 max-h-64 overflow-y-auto space-y-1">
                <p className="pb-1 text-[11px] text-body/80">
                  Click any business below to auto-fill its email (and showcase demo password):
                </p>

                {accountsLoading && (
                  <div className="flex items-center justify-center py-3 text-body gap-2">
                    <Loader2 size={14} className="animate-spin text-teal" />
                    <span>Loading registered businesses…</span>
                  </div>
                )}

                {accounts.map((acc) => (
                  <div
                    key={acc.email}
                    onClick={() => selectAccount(acc)}
                    className="pt-2 pb-1.5 flex justify-between items-center cursor-pointer hover:bg-canvas p-1.5 rounded transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-ink truncate">{acc.name}</p>
                        {!acc.isDemo && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.2 text-[9px] font-semibold">
                            <Sparkles size={9} /> New
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-body truncate">
                        {acc.sector} · {acc.location}
                      </p>
                      <p className="text-[10px] font-mono text-body/70 truncate">{acc.email}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-navy bg-navy/5 px-2 py-1 rounded hover:bg-navy/10">
                      Use this
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div> */}
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
