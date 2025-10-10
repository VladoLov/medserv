// app/client/layout.tsx
import { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ClientShell from "@/components/client/ClientShell";

export default async function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "client") redirect("/unauthorized");

  return <ClientShell>{children}</ClientShell>;
}
