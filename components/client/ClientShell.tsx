// components/client/ClientShell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, LayoutGrid, Wrench, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";

export default function ClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const NavItem = ({ href, label, icon: Icon }: any) => {
    const active = pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={[
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
          active ? "bg-primary/10 text-primary" : "hover:bg-muted",
        ].join(" ")}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  };

  async function signOut() {
    const { error } = await authClient.signOut();
    if (!error) window.location.href = "/login";
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="border-r bg-background">
        <div className="p-4">
          <div className="text-lg font-semibold">MediServ • Client</div>
        </div>
        <Separator />
        <nav className="p-2 space-y-1">
          <NavItem
            href="/client/dashboard"
            label="Dashboard"
            icon={LayoutGrid}
          />
          <NavItem href="/client/devices" label="Devices" icon={Wrench} />
          <NavItem
            href="/client/requests"
            label="Requests"
            icon={ClipboardList}
          />
        </nav>
        <div className="mt-auto p-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
