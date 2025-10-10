// app/devices/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clients, clientMembers, devices } from "@/db/schemas/schema";
import { and, asc, eq, ilike, gte, isNotNull, lte, sql } from "drizzle-orm";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DevicesFilter from "@/components/devices/DeviceFilter";

export const revalidate = 0; // svježe liste nakon akcija

export default async function DevicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; upcoming?: "1" | ""; clientId?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const role = session.user.role;

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const isUpcoming = sp.upcoming === "1";
  const selectedClientId = (sp.clientId ?? "").trim();

  const whereCommon = [
    q ? ilike(devices.name, `%${q}%`) : undefined,
    isUpcoming
      ? and(
          isNotNull(devices.nextServiceDate),
          gte(devices.nextServiceDate, sql`CURRENT_DATE`),
          lte(devices.nextServiceDate, sql`CURRENT_DATE + INTERVAL '30 days'`)
        )
      : undefined,
  ] as const;

  // Role-based WHERE
  let rows: {
    id: string;
    name: string;
    serialNumber: string | null;
    nextServiceDate: Date | null;
    clientName: string | null;
  }[] = [];

  if (role === "client") {
    // nađi clientId za ovog usera
    const membership = await db.query.clientMembers.findFirst({
      where: eq(clientMembers.userId, session.user.id),
      columns: { clientId: true },
    });
    if (!membership) {
      return (
        <div className="space-y-4 p-4 md:p-6">
          <h1 className="text-xl font-semibold">Devices</h1>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              Your account is not linked to any client yet.
            </p>
          </Card>
        </div>
      );
    }

    rows = await db
      .select({
        id: devices.id,
        name: devices.name,
        serialNumber: devices.serialNumber,
        nextServiceDate: devices.nextServiceDate,
        clientName: clients.name,
      })
      .from(devices)
      .innerJoin(clients, eq(devices.clientId, clients.id))
      .where(
        and(
          eq(devices.clientId, membership.clientId),
          ...whereCommon.filter(Boolean)
        )
      )
      .orderBy(asc(devices.name));
  } else {
    // admin/technician → svi uređaji + opcionalni filter po clientId
    rows = await db
      .select({
        id: devices.id,
        name: devices.name,
        serialNumber: devices.serialNumber,
        nextServiceDate: devices.nextServiceDate,
        clientName: clients.name,
      })
      .from(devices)
      .innerJoin(clients, eq(devices.clientId, clients.id))
      .where(
        and(
          selectedClientId ? eq(devices.clientId, selectedClientId) : undefined,
          ...whereCommon.filter(Boolean)
        )
      )
      .orderBy(asc(devices.name));
  }

  const overdue = (d: Date | null) =>
    d ? new Date(d) < new Date(new Date().toDateString()) : false;
  const daysUntil = (d: Date | null) =>
    d
      ? Math.round(
          (new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
            86400000
        )
      : null;

  // za admin/tech trebaju nam i opcije klijenata u filteru
  let clientOptions: { id: string; name: string }[] = [];
  if (role !== "client") {
    clientOptions = await db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .orderBy(asc(clients.name));
  }

  // destinacija detalja po ulozi
  const toDetail = (id: string) =>
    role === "admin"
      ? `/admin/devices/${id}`
      : role === "technician"
      ? `/technician/devices/${id}`
      : `/client/devices/${id}`;

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Devices</h1>
      </div>

      <DevicesFilter
        initialQ={q}
        initialUpcoming={isUpcoming}
        // samo admin/tech vide dropdown za klijenta
        showClientFilter={role !== "client"}
        clientOptions={clientOptions}
        initialClientId={selectedClientId}
      />

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
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Next service</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const due = r.nextServiceDate
                  ? new Date(r.nextServiceDate)
                  : null;
                const isOver = overdue(due);
                const dLeft = daysUntil(due);
                return (
                  <tr key={r.id} className="border-b">
                    <td className="px-4 py-2">{r.name}</td>
                    <td className="px-4 py-2">{r.serialNumber ?? "—"}</td>
                    <td className="px-4 py-2">{r.clientName ?? "—"}</td>
                    <td className="px-4 py-2">
                      {due ? due.toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-2">
                      {isOver ? (
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
                      <Link className="underline" href={toDetail(r.id)}>
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
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
