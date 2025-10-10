// app/client/dashboard/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { devices, clientMembers } from "@/db/schemas/schema";
import { and, eq, gte, lte, isNotNull, sql, count } from "drizzle-orm";
import { Card } from "@/components/ui/card";

export default async function ClientDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "client") redirect("/unauthorized");

  const membership = await db.query.clientMembers.findFirst({
    where: eq(clientMembers.userId, session.user.id),
    columns: { clientId: true },
  });
  if (!membership) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            Your account is not linked to any client yet.
          </p>
        </Card>
      </div>
    );
  }

  const clientId = membership.clientId;

  const [{ totalDevices }] = await db
    .select({ totalDevices: count() })
    .from(devices)
    .where(eq(devices.clientId, clientId));

  const [{ upcoming }] = await db
    .select({ upcoming: count() })
    .from(devices)
    .where(
      and(
        eq(devices.clientId, clientId),
        isNotNull(devices.nextServiceDate),
        gte(devices.nextServiceDate, sql`CURRENT_DATE`),
        lte(devices.nextServiceDate, sql`CURRENT_DATE + INTERVAL '30 days'`)
      )
    );

  const [{ overdue }] = await db
    .select({ overdue: count() })
    .from(devices)
    .where(
      and(
        eq(devices.clientId, clientId),
        isNotNull(devices.nextServiceDate),
        lte(devices.nextServiceDate, sql`CURRENT_DATE - INTERVAL '1 day'`)
      )
    );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Devices</div>
          <div className="text-2xl font-bold">{totalDevices ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Upcoming (30d)</div>
          <div className="text-2xl font-bold">{upcoming ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Overdue</div>
          <div className="text-2xl font-bold">{overdue ?? 0}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="text-sm">
          Go to{" "}
          <a className="underline" href="/client/devices">
            Devices
          </a>{" "}
          to view details and request service.
        </div>
      </Card>
    </div>
  );
}
