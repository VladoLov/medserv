// app/technician/devices/[id]/page.tsx  (dopune)
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  devices,
  clients,
  serviceRecords,
  user as users,
  serviceRequests,
} from "@/db/schemas/schema";
import { eq, desc } from "drizzle-orm";
import { DeviceDetails } from "@/components/devices/DeviceDetails";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import TechRequestStatusBar from "@/components/technician/TechRequestStatusBar";

export default async function TechnicianDevicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ requestId?: string; from?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "technician") redirect("/unauthorized");
  const paramsId = (await params).id;
  const sp = await searchParams;
  const dev = await db
    .select({
      id: devices.id,
      name: devices.name,
      serialNumber: devices.serialNumber,
      clientName: clients.name,
      installDate: devices.installDate,
      lastServiceDate: devices.lastServiceDate,
      nextServiceDate: devices.nextServiceDate,
      serviceIntervalMonths: devices.serviceIntervalMonths,
      majorServiceYears: devices.majorServiceYears,
    })
    .from(devices)
    .innerJoin(clients, eq(devices.clientId, clients.id))
    .where(eq(devices.id, paramsId))
    .limit(1);

  if (dev.length === 0) redirect(sp.from || "/technician/requests");

  const records = await db
    .select({
      id: serviceRecords.id,
      serviceDate: serviceRecords.serviceDate,
      type: serviceRecords.type,
      notes: serviceRecords.notes,
      technicianName: users.name,
    })
    .from(serviceRecords)
    .leftJoin(users, eq(serviceRecords.technicianId, users.id))
    .where(eq(serviceRecords.deviceId, paramsId))
    .orderBy(desc(serviceRecords.serviceDate));

  // Ako smo došli sa liste i imamo requestId, povuci trenutni request
  let req: {
    id: string;
    status: string;
    type: string;
    scheduledAt: Date | null;
  } | null = null;
  if (sp.requestId) {
    const r = await db
      .select({
        id: serviceRequests.id,
        status: serviceRequests.status,
        type: serviceRequests.type,
        scheduledAt: serviceRequests.scheduledAt,
      })
      .from(serviceRequests)
      .where(eq(serviceRequests.id, sp.requestId))
      .limit(1);
    req = r[0] ?? null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {sp.from && (
          <Link href={sp.from}>
            <Button variant="outline">Back</Button>
          </Link>
        )}
        <h1 className="text-xl font-semibold">{dev[0].name}</h1>
      </div>

      {/* Ako imamo request kontekst, prikaži status traku i kontrole */}
      {req && (
        <TechRequestStatusBar
          requestId={req.id}
          currentStatus={req.status}
          defaultType={req.type as any}
          redirectTo={sp.from || "/technician/requests?status=in_progress"}
          defaultDate={
            req.scheduledAt
              ? new Date(req.scheduledAt).toISOString().slice(0, 10)
              : ""
          }
        />
      )}

      <DeviceDetails device={dev[0]} records={records} canEdit />
    </div>
  );
}
