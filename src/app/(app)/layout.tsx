import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { SidebarNav } from "@/components/sidebar-nav";
import { FloatingChatButton } from "@/components/floating-chat-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

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
