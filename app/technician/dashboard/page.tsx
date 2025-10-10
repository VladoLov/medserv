import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { serviceRequests } from "@/db/schemas/schema";
import { eq, and, gte, lte, count, sql } from "drizzle-orm";
import { Card } from "@/components/ui/card";

export default async function TechDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "technician") redirect("/unauthorized");

  const techId = session.user.id;

  const [{ openCnt }] = await db
    .select({ openCnt: count() })
    .from(serviceRequests)
    .where(
      and(
        eq(serviceRequests.assignedTo, techId),
        eq(serviceRequests.status, "scheduled")
      )
    );

  const [{ todayCnt }] = await db
    .select({ todayCnt: count() })
    .from(serviceRequests)
    .where(
      and(
        eq(serviceRequests.assignedTo, techId),
        eq(serviceRequests.status, "scheduled"),
        gte(serviceRequests.scheduledAt, sql`date_trunc('day', now())`),
        lte(
          serviceRequests.scheduledAt,
          sql`date_trunc('day', now()) + interval '1 day' - interval '1 second'`
        )
      )
    );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Scheduled (all)</div>
          <div className="text-2xl font-bold">{openCnt ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Today</div>
          <div className="text-2xl font-bold">{todayCnt ?? 0}</div>
        </Card>
      </div>
      <Card className="p-4">
        <div className="text-sm">
          Go to{" "}
          <a className="underline" href="/technician/requests">
            My Requests
          </a>
        </div>
      </Card>
    </div>
  );
}
