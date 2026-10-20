"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoutDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LogoutDialog({ children, open: controlledOpen, onOpenChange }: LogoutDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  function setOpen(val: boolean) {
    if (loggingOut) return;
    if (!isControlled) {
      setInternalOpen(val);
    }
    onOpenChange?.(val);
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    // Hard navigate to clear Redux in-memory cache and cookies cleanly
    window.location.href = "/login";
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log out?</DialogTitle>
          <DialogDescription>
            You&apos;ll need to sign back in to see your business data.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loggingOut}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleLogout} loading={loggingOut}>
            {loggingOut ? "Logging out…" : "Log out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MobileLogoutButton({ className }: { className?: string }) {
  return (
    <LogoutDialog>
      <button
        type="button"
        aria-label="Log out"
        className={cn(
          "mt-1 flex h-10 w-10 items-center justify-center rounded-full text-body hover:bg-canvas lg:hidden",
          className
        )}
      >
        <LogOut size={18} /> <span className="text-[9px]">Log out</span>
      </button>
    </LogoutDialog>
  );
}
