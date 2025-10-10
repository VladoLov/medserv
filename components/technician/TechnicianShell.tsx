// components/technician/TechnicianShell.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutGrid, ClipboardList, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";

const StatusLink = ({ label, value }: { label: string; value: string }) => {
  const sp = useSearchParams();
  const pathname = "/technician/requests";
  const active =
    sp.get("status") === value || (!sp.get("status") && value === "scheduled");
  const qs = new URLSearchParams(sp);
  qs.set("status", value);
  return (
    <Link
      href={`${pathname}?${qs.toString()}`}
      className={[
        "px-3 py-1 rounded-md text-sm",
        active ? "bg-primary/10 text-primary" : "hover:bg-muted",
      ].join(" ")}
    >
      {label}
    </Link>
  );
};

export default function TechnicianShell({
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
        <Icon className="h-4 w-4" /> {label}
      </Link>
    );
  };

  async function signOut() {
    const { error } = await authClient.signOut();
    if (!error) window.location.href = "/login";
  }

  const showRequestTabs = pathname.startsWith("/technician/requests");

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="border-r bg-background">
        <div className="p-4 text-lg font-semibold">MediServ • Tech</div>
        <Separator />
        <nav className="p-2 space-y-1">
          <NavItem
            href="/technician/dashboard"
            label="Dashboard"
            icon={LayoutGrid}
          />
          <NavItem
            href="/technician/requests"
            label="My Requests"
            icon={ClipboardList}
          />
        </nav>
        <div className="mt-auto p-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <main className="p-4 md:p-6">
        {/* Top subnav za statuse na listi zahtjeva */}
        {showRequestTabs && (
          <div className="mb-4 flex flex-wrap gap-2">
            <StatusLink label="Scheduled" value="scheduled" />
            <StatusLink label="In progress" value="in_progress" />
            <StatusLink label="Delayed" value="delayed" />
            <StatusLink label="Finished" value="done" />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
