"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#F6FAF9] p-6 text-center font-sans text-[#001219]">
        <div className="w-full max-w-md space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#AE2012]/10 text-[#AE2012]">
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#AE2012]">
              System Error
            </p>
            <h1 className="mt-1 text-3xl font-medium tracking-tight text-[#001219]">
              Something Went Wrong
            </h1>
            <p className="mt-2 text-sm text-[#3D5568]">
              A critical error occurred while rendering the platform shell.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1D3557] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#122540]"
          >
            <RefreshCw size={15} />
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
