import { db } from "../../../db";
import {
  clients,
  devices,
  technicianProfile,
} from "../../../db/schemas/schema";
import { and, gte, lte, ilike, eq, sql } from "drizzle-orm";
import UpcomingServicesTable from "@/components/admin/UpcomingServicesTable";
import UpcomingFilterBar from "@/components/admin/UpcomingFilterBar";
import MetricCard from "../../../components/admin/MetricCard";
import { Wrench, CalendarDays, Building2, UserCog } from "lucide-react";

type SP = { clientId?: string; q?: string };

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const nowTo30d = and(
    gte(devices.nextServiceDate, sql`now()`),
    lte(devices.nextServiceDate, sql`now() + interval '30 days'`)
  );

  const whereParts = [nowTo30d];

  if (sp.clientId) {
    whereParts.push(eq(devices.clientId, sp.clientId));
  }
  if (sp.q) {
    // pretraga po nazivu uređaja
    whereParts.push(ilike(devices.name, `%${sp.q}%`));
  }

  // agregati (za cards)
  const [{ value: clientCount }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(clients);

  const [{ value: deviceCount }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(devices);

  const [{ value: upcomingCount }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(devices)
    .where(nowTo30d);

  const technicianCount = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(technicianProfile);

  // liste za filtere
  const clientList = await db
    .select({
      id: clients.id,
      name: clients.name,
    })
    .from(clients)
    .orderBy(clients.name);

  // redovi za tabelu (join kako bismo dobili ime klijenta)
  const rows = await db
    .select({
      deviceId: devices.id,
      deviceName: devices.name,
      nextServiceDate: devices.nextServiceDate,
      clientId: devices.clientId,
      clientName: clients.name,
      serial: devices.serialNumber,
    })
    .from(devices)
    .innerJoin(clients, eq(devices.clientId, clients.id))
    .where(and(...whereParts))
    .orderBy(devices.nextServiceDate);

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Clients"
          value={clientCount ?? 0}
          right={<Building2 className="h-5 w-5 text-muted-foreground" />}
        />
        <MetricCard
          title="Devices"
          value={deviceCount ?? 0}
          right={<Wrench className="h-5 w-5 text-muted-foreground" />}
        />
        <MetricCard
          title="Upcoming (30d)"
          value={upcomingCount ?? 0}
          right={<CalendarDays className="h-5 w-5 text-muted-foreground" />}
        />
        <MetricCard
          title="Technicians"
          value={technicianCount[0]?.value ?? 0}
          right={<UserCog className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <UpcomingFilterBar
          clients={clientList}
          initialClientId={sp.clientId}
          initialQuery={sp.q}
        />
      </div>

      {/* Table */}
      <UpcomingServicesTable rows={rows} />
    </div>
  );
}
