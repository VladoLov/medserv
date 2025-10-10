import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import TechnicianShell from "@/components/technician/TechnicianShell";

export default async function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "technician") redirect("/unauthorized");
  return <TechnicianShell>{children}</TechnicianShell>;
}
