import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { clients, clientMembers, devices } from "@/db/schemas/schema";
import { and, asc, eq, ilike, isNotNull, lte, gte, sql } from "drizzle-orm";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientDevicesFilter } from "@/components/client/ClientDevicesFilter";

export default async function ClientDevicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    upcoming?: "1" | "";
    clientId?: string;
  }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "client") redirect("/unauthorized");
  const sp = await searchParams;
  // pronađi client_id za ovog usera (pretpostavljamo da je član jedne bolnice)
  const membership = await db.query.clientMembers.findFirst({
    where: eq(clientMembers.userId, session.user.id),
    columns: { clientId: true },
  });
  if (!membership) {
    // nije uvezan ni na jednog klijenta
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">My Devices</h1>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            Your account is not linked to any client yet.
          </p>
        </Card>
      </div>
    );
  }

  const q = (sp.q ?? "").trim();
  const isUpcoming = sp.upcoming === "1";

  // vremenski prozor za "upcoming": danas .. +30 dana
  const now = new Date();
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);

  // where klauzula
  const where = and(
    eq(devices.clientId, membership.clientId),
    q ? ilike(devices.name, `%${q}%`) : undefined,
    isUpcoming
      ? and(
          isNotNull(devices.nextServiceDate),
          gte(devices.nextServiceDate, sql`CURRENT_DATE`),
          lte(devices.nextServiceDate, sql`CURRENT_DATE + INTERVAL '30 days'`)
        )
      : undefined
  );

  const rows = await db
    .select({
      id: devices.id,
      name: devices.name,
      serialNumber: devices.serialNumber,
      nextServiceDate: devices.nextServiceDate,
      lastServiceDate: devices.lastServiceDate,
      serviceIntervalMonths: devices.serviceIntervalMonths,
    })
    .from(devices)
    .where(where)
    .orderBy(asc(devices.name));

  const overdue = (d: Date | null) => {
    if (!d) return false;
    const dd = new Date(d);
    return dd < new Date(new Date().toDateString()); // prije današnjeg datuma
  };

  const daysUntil = (d: Date | null) => {
    if (!d) return null;
    const one = new Date(d).setHours(0, 0, 0, 0);
    const two = new Date().setHours(0, 0, 0, 0);
    return Math.round((one - two) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">My Devices</h1>
      </div>

      <ClientDevicesFilter initialQ={q} initialUpcoming={isUpcoming} />

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b">
          <p className="text-sm text-muted-foreground">{rows.length} total</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b">
                <th className="px-4 py-2">Device</th>
                <th className="px-4 py-2">Serial</th>
                <th className="px-4 py-2">Next service</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const due = r.nextServiceDate
                  ? new Date(r.nextServiceDate)
                  : null;
                const isOverdue = overdue(due as any);
                const dLeft = daysUntil(due as any);

                return (
                  <tr key={r.id} className="border-b">
                    <td className="px-4 py-2">{r.name}</td>
                    <td className="px-4 py-2">{r.serialNumber ?? "—"}</td>
                    <td className="px-4 py-2">
                      {due ? due.toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-2">
                      {isOverdue ? (
                        <Badge variant="destructive">Overdue</Badge>
                      ) : dLeft != null ? (
                        <Badge variant="secondary">
                          Due in {dLeft}{" "}
                          {Math.abs(dLeft) === 1 ? "day" : "days"}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not scheduled</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        className="underline"
                        href={`/client/devices/${r.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No devices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
