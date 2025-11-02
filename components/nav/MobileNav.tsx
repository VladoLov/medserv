"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import ClientUserMenu from "./ClientUserMenu";

type LinkItem = { href: string; label: string };

export default function MobileNav({
  links,
  isAuth,
  role,
  name,
  email,
}: {
  links: LinkItem[];
  isAuth: boolean;
  role?: "admin" | "technician" | "client";
  name?: string | null;
  email?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open menu">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>MediServ</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}

          {/* Optional: Notifications link that closes the sheet */}
          <Link
            href="/notifications"
            onClick={close}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Notifications
          </Link>
        </div>

        <Separator className="my-4" />

        <div className="flex items-center justify-center">
          <ClientUserMenu
            isAuth={isAuth}
            role={role}
            name={name ?? null}
            email={email ?? null}
            onNavigate={close}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
