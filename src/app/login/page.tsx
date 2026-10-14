"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
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
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
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

        <div className="mt-10 rounded-md border border-line bg-surface p-4 text-xs text-body">
          <p className="font-medium text-ink">Trying the demo?</p>
          <p className="mt-1">
            Email: <span className="tabular">demo@adaezestores.ng</span> · Password: <span className="tabular">demo1234</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
