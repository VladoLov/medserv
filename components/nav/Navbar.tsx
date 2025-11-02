import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "../../lib/auth";
import ClientUserMenu from "./ClientUserMenu";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet";
import { Menu } from "lucide-react";

import MobileNav from "./MobileNav";
import NotificationBell from "./NotificationBell";

export default async function Navbar() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isAuth = Boolean(session?.user);
  const role = session?.user.role as
    | "admin"
    | "technician"
    | "client"
    | undefined;

  const homeHref = !isAuth
    ? "/"
    : role === "admin"
    ? "/admin/dashboard"
    : role === "technician"
    ? "/technician/dashboard"
    : "/client/dashboard";

  const links = [
    { href: homeHref, label: "Home", show: true },
    { href: "/devices", label: "Devices", show: true },
    { href: "/admin/clients", label: "Clients", show: role === "admin" },
  ].filter((l) => l.show);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile */}
          <div className="md:hidden">
            <MobileNav
              links={links}
              isAuth={isAuth}
              role={role}
              name={session?.user.name ?? null}
              email={session?.user.email ?? null}
            />
          </div>

          {/* Logo */}
          <Link href={homeHref} className="font-semibold text-lg">
            MediServ
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop user menu + bell */}
        <div className="hidden md:flex space-x-2">
          <ClientUserMenu
            isAuth={isAuth}
            role={role}
            name={session?.user.name ?? null}
            email={session?.user.email ?? null}
          />
          <NotificationBell />
        </div>
      </nav>
    </header>
  );
}
