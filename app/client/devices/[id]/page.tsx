import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  devices,
  clients,
  serviceRecords,
  user,
  clientMembers,
  serviceRequests,
} from "@/db/schemas/schema";
import { eq, desc } from "drizzle-orm";
import { DeviceDetails } from "@/components/devices/DeviceDetails";
import { auth } from "@/lib/auth";
import ClientRequestForm from "@/components/devices/ClientRequestForm";

export default async function Page({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "client") redirect("/unauthorized");

  // provjera da user pripada klijentu ovog uređaja
  const d = await db.query.devices.findFirst({
    where: eq(devices.id, params.id),
    columns: { clientId: true, name: true },
  });
  if (!d) redirect("/client/devices");

  const mem = await db.query.clientMembers.findFirst({
    where: (cm, { and, eq: _eq }) =>
      and(_eq(cm.clientId, d.clientId), _eq(cm.userId, session.user.id)),
  });
  if (!mem) redirect("/unauthorized");

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

  if (dev.length === 0) redirect("/client/devices");

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

  const requests = await db
    .select({
      id: serviceRequests.id,
      type: serviceRequests.type,
      description: serviceRequests.description,
      preferredDate: serviceRequests.preferredDate,
      status: serviceRequests.status,
      createdAt: serviceRequests.createdAt,
    })
    .from(serviceRequests)
    .where(eq(serviceRequests.deviceId, params.id));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{dev[0].name}</h1>
      <DeviceDetails device={dev[0]} records={records} canEdit={false} />
      {/* klijent može poslati zahtjev */}
      <ClientRequestForm deviceId={params.id} />

      {/* lista zahtjeva */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-3">My service requests</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Preferred</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="px-3 py-2">
                    {new Date(r.createdAt!).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">{r.type}</td>
                  <td className="px-3 py-2">
                    {r.preferredDate
                      ? new Date(r.preferredDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">{r.description ?? "—"}</td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-8 text-center text-muted-foreground"
                    colSpan={5}
                  >
                    No requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
