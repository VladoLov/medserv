import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { serviceRequests, devices, clients, user } from "@/db/schemas/schema";
import { eq, desc, asc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Link from "next/link";
import { updateRequestStatus } from "./actions";
import ConvertRequestDialog from "@/components/admin/ConvertRequestDialog";
import AssignRequestDialog from "@/components/admin/AssignRequestDialog";

export default async function AdminRequestsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !["admin", "technician"].includes(session.user.role))
    redirect("/unauthorized");

  const rows = await db
    .select({
      id: serviceRequests.id,
      createdAt: serviceRequests.createdAt,
      type: serviceRequests.type,
      status: serviceRequests.status,
      description: serviceRequests.description,
      preferredDate: serviceRequests.preferredDate,
      deviceId: devices.id,
      deviceName: devices.name,
      clientName: clients.name,
      requesterName: user.name,
    })
    .from(serviceRequests)
    .innerJoin(devices, eq(serviceRequests.deviceId, devices.id))
    .innerJoin(clients, eq(devices.clientId, clients.id))
    .innerJoin(user, eq(serviceRequests.requestedBy, user.id))
    .orderBy(desc(serviceRequests.createdAt));

  const statusBadge = (s: string) => {
    const map: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      open: "default",
      scheduled: "secondary",
      done: "outline",
      cancelled: "destructive",
    };
    return (
      <Badge variant={map[s] ?? "default"} className="capitalize">
        {s}
      </Badge>
    );
  };
  const techs = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.role, "technician"))
    .orderBy(asc(user.name));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Service Requests</h1>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b">
          <p className="text-sm text-muted-foreground">{rows.length} total</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b">
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Device</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Preferred</th>
                <th className="px-4 py-2">Requester</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 w-64">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b align-top">
                  <td className="px-4 py-2">
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{r.clientName}</td>
                  <td className="px-4 py-2">
                    <Link
                      className="underline"
                      href={`/admin/devices/${r.deviceId}`}
                    >
                      {r.deviceName}
                    </Link>
                    {r.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {r.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 capitalize">{r.type}</td>
                  <td className="px-4 py-2">
                    {r.preferredDate
                      ? new Date(r.preferredDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{r.requesterName ?? "—"}</td>
                  <td className="px-4 py-2">{statusBadge(r.status)}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-2">
                      {/* Promjena statusa */}
                      <form
                        action={async (formData) => {
                          "use server";
                          await updateRequestStatus(
                            r.id,
                            formData.get("status") as any
                          );
                        }}
                      >
                        <input type="hidden" name="id" value={r.id} />
                        <Select name="status" defaultValue={r.status}>
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="mt-2 w-36"
                        >
                          Update status
                        </Button>
                      </form>

                      {/* Convert → Service Record */}
                      <ConvertRequestDialog
                        requestId={r.id}
                        deviceId={r.deviceId}
                        defaultType={r.type as "redovni" | "vanredni" | "major"}
                        trigger={<Button size="sm">Convert to record</Button>}
                      />
                      <AssignRequestDialog
                        requestId={r.id}
                        technicians={techs}
                        defaultDate={
                          r.preferredDate
                            ? new Date(r.preferredDate)
                                .toISOString()
                                .slice(0, 10)
                            : ""
                        }
                        trigger={
                          <Button variant="outline" size="sm">
                            Assign
                          </Button>
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
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
