import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getSession } from "@/lib/auth";

export default async function RootPage() {
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

  redirect(isAuthenticated ? "/dashboard" : "/login");
}

