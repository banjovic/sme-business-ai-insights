import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-12 text-center">
      <div className="w-full max-w-md space-y-6">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-gold-dark">
          404 Error
        </p>

        <h1 className="font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
          Page Not Found
        </h1>

        <p className="text-[15px] leading-relaxed text-body">
          The page or insight report you are looking for does not exist or may have been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button asChild size="lg" className="w-full sm:w-auto bg-navy text-white hover:bg-navy/90">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Home size={17} />
              Back to Dashboard
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto border-line bg-surface text-ink hover:bg-canvas">
            <Link href="/login" className="flex items-center gap-2">
              <ArrowLeft size={17} />
              Return to Login
            </Link>
          </Button>
        </div>

        <div className="mt-8 rounded-lg border border-line bg-surface p-4 text-xs text-body">
          <p className="font-medium text-ink">Need immediate business assistance?</p>
          <p className="mt-1">
            You can always ask questions about your stock, expenses, and sales directly in the{" "}
            <Link href="/chat" className="font-medium text-navy underline underline-offset-2">
              AI Chat
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
