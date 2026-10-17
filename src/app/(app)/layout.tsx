import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getSession } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { SidebarNav } from "@/components/sidebar-nav";
import { FloatingChatButton } from "@/components/floating-chat-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let isAuthenticated = false;

  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    try {
      const { userId } = auth();
      if (userId) isAuthenticated = true;
    } catch {
      // ignore
    }
  }

  if (!isAuthenticated) {
    const session = await getSession();
    if (session) isAuthenticated = true;
  }

  if (!isAuthenticated) redirect("/login");

  return (
    <>
      <SidebarNav />
      <div className="pb-20 lg:pb-0 lg:pl-60">
        <div className="mx-auto w-full max-w-md lg:max-w-3xl">{children}</div>
      </div>
      <FloatingChatButton />
      <BottomNav />
    </>
  );
}
