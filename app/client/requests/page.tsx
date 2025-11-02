import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  clientMembers,
  devices,
  clients,
  serviceRequests,
} from "@/db/schemas/schema";
import { eq, and, desc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 0;

export default async function ClientRequestsPage() {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s || s.user.role !== "client") redirect("/unauthorized");

  const mem = await db.query.clientMembers.findFirst({
    where: eq(clientMembers.userId, s.user.id),
    columns: { clientId: true },
  });
  if (!mem) redirect("/devices");

  const rows = await db
    .select({
      id: serviceRequests.id,
      createdAt: serviceRequests.createdAt,
      type: serviceRequests.type,
      status: serviceRequests.status,
      preferredDate: serviceRequests.preferredDate,
      deviceName: devices.name,
      clientName: clients.name,
    })
    .from(serviceRequests)
    .innerJoin(devices, eq(serviceRequests.deviceId, devices.id))
    .innerJoin(clients, eq(devices.clientId, clients.id))
    .where(
      and(
        eq(clients.id, mem.clientId),
        eq(serviceRequests.requestedBy, s.user.id)
      )
    )
    .orderBy(desc(serviceRequests.createdAt));

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="text-xl font-semibold">My requests</h1>
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b">
          <p className="text-sm text-muted-foreground">{rows.length} total</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b">
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2">Device</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Preferred</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="px-4 py-2">
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{r.deviceName}</td>
                  <td className="px-4 py-2 capitalize">{r.type}</td>
                  <td className="px-4 py-2">
                    {r.preferredDate
                      ? new Date(r.preferredDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <Badge
                      className="capitalize"
                      variant={
                        r.status === "open"
                          ? "default"
                          : r.status === "in_progress"
                          ? "secondary"
                          : r.status === "delayed"
                          ? "secondary"
                          : r.status === "done"
                          ? "outline"
                          : r.status === "cancelled"
                          ? "destructive"
                          : "default"
                      }
                    >
                      {r.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No requests yet.
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
