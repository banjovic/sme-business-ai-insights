import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "./globals.css";

import type { Metadata } from "next";
import { Toaster } from "sonner";
import { StoreProvider } from "@/store/StoreProvider";

export const metadata: Metadata = {
  title: "SME Business Insight",
  description: "AI-powered business intelligence for Nigerian SMEs — plain-language insights, no dashboards to decode.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <StoreProvider>
          <div className="min-h-screen bg-canvas">{children}</div>
          <Toaster
            position="top-center"
            toastOptions={{
              classNames: {
                toast: "!bg-surface !border !border-line !shadow-popover !rounded-lg",
                title: "!text-ink !font-medium",
                success: "!text-success",
                error: "!text-alert-red",
              },
            }}
          />
        </StoreProvider>
      </body>
    </html>
  );
}
