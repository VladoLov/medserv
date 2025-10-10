import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { devices, clients, serviceRecords, user } from "@/db/schemas/schema";
import { eq, desc } from "drizzle-orm";
import { DeviceDetails } from "@/components/devices/DeviceDetails";

export default async function Page({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/unauthorized");

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
    .where(eq(devices.id, params.id))
    .limit(1);

  if (dev.length === 0) redirect("/admin/devices");

  const records = await db
    .select({
      id: serviceRecords.id,
      serviceDate: serviceRecords.serviceDate,
      type: serviceRecords.type,
      notes: serviceRecords.notes,
      technicianName: user.name,
    })
    .from(serviceRecords)
    .leftJoin(user, eq(serviceRecords.technicianId, user.id))
    .where(eq(serviceRecords.deviceId, params.id))
    .orderBy(desc(serviceRecords.serviceDate));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{dev[0].name}</h1>
      <DeviceDetails device={dev[0]} records={records} canEdit />
    </div>
  );
}
