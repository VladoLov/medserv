// app/technician/requests/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { serviceRequests, devices, clients } from "@/db/schemas/schema";
import { eq, and, asc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function TechRequestsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "technician") redirect("/unauthorized");

  const status = (searchParams.status ?? "scheduled") as
    | "scheduled"
    | "in_progress"
    | "delayed"
    | "done";

  const rows = await db
    .select({
      id: serviceRequests.id,
      type: serviceRequests.type,
      status: serviceRequests.status,
      scheduledAt: serviceRequests.scheduledAt,
      deviceId: devices.id,
      deviceName: devices.name,
      clientName: clients.name,
    })
    .from(serviceRequests)
    .innerJoin(devices, eq(serviceRequests.deviceId, devices.id))
    .innerJoin(clients, eq(devices.clientId, clients.id))
    .where(
      and(
        eq(serviceRequests.assignedTo, session.user.id),
        eq(serviceRequests.status, status)
      )
    )
    .orderBy(asc(serviceRequests.scheduledAt));

  const makeFrom = () => {
    const qs = new URLSearchParams({ status });
    return `/technician/requests?${qs.toString()}`;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">
        My Requests — {status.replace("_", " ")}
      </h1>
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Device</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 w-64">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="px-4 py-2">
                    {r.scheduledAt
                      ? new Date(r.scheduledAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{r.clientName}</td>
                  <td className="px-4 py-2">{r.deviceName}</td>
                  <td className="px-4 py-2 capitalize">{r.type}</td>
                  <td className="px-4 py-2">
                    {/* Otvaramo device view ZA TEHNIČARA, sa kontekstom requesta i povratnim linkom */}
                    <Link
                      href={`/technician/devices/${r.deviceId}?requestId=${
                        r.id
                      }&from=${encodeURIComponent(makeFrom())}`}
                    >
                      <Button size="sm">Open</Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-muted-foreground"
                    colSpan={5}
                  >
                    No items.
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
