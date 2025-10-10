"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "../../components/ui/separator";
import { Button } from "../../components/ui/button";
import {
  LogOut,
  LayoutGrid,
  Wrench,
  Building2,
  ClipboardList,
  UserCog,
  Users,
} from "lucide-react";
import ClientSignOutBtn from "./ClientSignOutBtn";

type NavItem = { label: string; href: string; icon: React.ComponentType<any> };

const items: NavItem[] = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutGrid },
  { label: "Clients", href: "/admin/clients", icon: Building2 },
  { label: "Devices", href: "/admin/devices", icon: Wrench },
  { href: "/admin/requests", label: "Requests", icon: ClipboardList },
  { label: "Technicians", href: "/admin/technicians", icon: UserCog },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100dvh-56px)] grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="border-r bg-card">
        <div className="p-4">
          <Link
            href="/admin/dashboard"
            className="font-semibold tracking-tight"
          >
            Admin
          </Link>
        </div>
        <Separator />
        <nav className="p-2">
          <AdminNav />
        </nav>
        <div className="mt-auto p-2">
          // ...
          <div className="mt-auto p-2">
            <ClientSignOutBtn
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </ClientSignOutBtn>
          </div>
          // ...
        </div>
      </aside>
      <section className="p-4 md:p-6">{children}</section>
    </div>
  );
}

function AdminNav() {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {items.map((it) => {
        const active = pathname?.startsWith(it.href);
        const Icon = it.icon;
        return (
          <li key={it.href}>
            <Link
              href={it.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition
                ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary text-foreground"
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
