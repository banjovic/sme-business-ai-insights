import { NextResponse } from "next/server";
import { createClerkClient } from "@clerk/backend";
import { prisma } from "@/lib/prisma";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verify password for showcase/demo accounts
    if (password !== "Showcase2026!" && password !== "demo1234") {
      return NextResponse.json({ error: "Not a valid showcase password" }, { status: 401 });
    }

    // Find DB user by email
    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let clerkId = user.clerkId;
    if (!clerkId) {
      const clerkUsers = await clerk.users.getUserList({ emailAddress: [cleanEmail] });
      const clerkUser = clerkUsers.data?.[0] || (clerkUsers as any)[0];
      if (!clerkUser) {
        return NextResponse.json({ error: "User not registered in Clerk" }, { status: 404 });
      }
      clerkId = clerkUser.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { clerkId },
      });
    }

    // Create a single-use sign-in ticket to bypass email code MFA
    const ticket = await clerk.signInTokens.createSignInToken({
      userId: clerkId,
      expiresInSeconds: 60,
    });

    return NextResponse.json({ ticket: ticket.token });
  } catch (err: any) {
    console.error("Demo ticket error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate ticket" }, { status: 500 });
  }
}
