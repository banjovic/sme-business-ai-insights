"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    businessName: "",
    sector: "",
    location: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to set up account");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("An unexpected error occurred. Please try again.");
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
        <p className="font-display text-sm text-gold-dark">Get started</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">Set up your business</h1>
        <p className="mt-2 text-[15px] text-body">A few details, then you can start logging sales, stock, and expenses.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <Label htmlFor="businessName">Business name</Label>
            <Input
              id="businessName"
              required
              value={form.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              placeholder="Adaeze Stores"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                required
                value={form.sector}
                onChange={(e) => update("sector", e.target.value)}
                placeholder="Retail / Trading"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                required
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="Lagos"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@business.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-md bg-alert-red/10 px-3 py-2 text-sm text-alert-red">
              {error}
            </motion.p>
          )}

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {loading ? "Setting up business…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-body">
          Already set up?{" "}
          <Link href="/login" className="font-medium text-navy underline underline-offset-2">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}
