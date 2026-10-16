"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Runtime route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-12 text-center">
      <div className="w-full max-w-md space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-alert-red/10 text-alert-red">
          <AlertTriangle size={28} />
        </div>

        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-widest text-alert-red">
            Application Error
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            Something Went Wrong
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-body">
            An unexpected error occurred while loading this section. You can try refreshing or returning to the dashboard.
          </p>
        </div>

        {error.message && process.env.NODE_ENV !== "production" && (
          <div className="overflow-hidden rounded-md border border-line bg-surface p-3 text-left font-mono text-xs text-alert-red">
            <p className="font-semibold text-ink">Error details:</p>
            <p className="mt-1 break-words">{error.message}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            size="lg"
            className="w-full sm:w-auto bg-navy text-white hover:bg-navy/90 flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Try Again
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto border-line bg-surface text-ink hover:bg-canvas"
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              <Home size={16} />
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
