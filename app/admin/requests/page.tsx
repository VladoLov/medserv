import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { serviceRequests, devices, clients, user } from "@/db/schemas/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AssignRequestDialog from "@/components/admin/AssignRequestDialog";
import ConvertRequestDialog from "@/components/admin/ConvertRequestDialog";
import { updateRequestStatus } from "./actions";
import PaginationBar from "@/components/admin/PaginationBar";

// ---- helpers ----
const STATUSES = ["scheduled", "done", "cancelled"] as const;
type Segment = (typeof STATUSES)[number];

const statusVariant = (
  s: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (s) {
    case "scheduled":
      return "secondary";
    case "done":
      return "outline";
    case "cancelled":
      return "destructive";
    default:
      return "default";
  }
};

export const revalidate = 0;

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: Segment;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !["admin", "technician"].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  // ---- read query params safely in RSC ----
  const sp = await searchParams;
  const status: Segment =
    sp.status && STATUSES.includes(sp.status) ? sp.status : "scheduled";
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(5, Number(sp.pageSize ?? "10") || 10)
  );
  const offset = (page - 1) * pageSize;

  // ---- counts per segment (for the tabs) ----
  // Using 3 small COUNT(*) queries keeps SQL simple & indexed.
  const [scheduledCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(serviceRequests)
    .where(eq(serviceRequests.status, "scheduled"));

  const [doneCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(serviceRequests)
    .where(eq(serviceRequests.status, "done"));

  const [cancelledCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(serviceRequests)
    .where(eq(serviceRequests.status, "cancelled"));

  const totalMap: Record<Segment, number> = {
    scheduled: Number(scheduledCount?.c ?? 0),
    done: Number(doneCount?.c ?? 0),
    cancelled: Number(cancelledCount?.c ?? 0),
  };

  const total = totalMap[status];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // ---- main page query (filtered by segment, paginated) ----
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
    .where(and(eq(serviceRequests.status, status)))
    .orderBy(desc(serviceRequests.createdAt))
    .limit(pageSize)
    .offset(offset);

  // technicians for Assign dialog
  const techs = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.role, "technician"))
    .orderBy(user.name);

  // ---- UI helpers ----
  const tabLink = (seg: Segment) => {
    const params = new URLSearchParams();
    params.set("status", seg);
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    return `/admin/requests?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Service Requests</h1>
      </div>

      {/* Segmented Tabs (links so it stays RSC-friendly) */}
      <Card className="p-2">
        <div className="flex gap-2">
          {STATUSES.map((seg) => {
            const active = seg === status;
            const count =
              seg === "scheduled"
                ? totalMap.scheduled
                : seg === "done"
                ? totalMap.done
                : totalMap.cancelled;
            return (
              <Link
                key={seg}
                href={tabLink(seg)}
                className={`px-3 py-1 rounded-md text-sm border ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted"
                }`}
              >
                {seg.charAt(0).toUpperCase() + seg.slice(1)} ({count})
              </Link>
            );
          })}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {rows.length} of {total} {status}
          </p>
          <PageSizeSelect current={pageSize} status={status} />
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
                  <td className="px-4 py-2">
                    <Badge
                      variant={statusVariant(r.status)}
                      className="capitalize"
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-2">
                      {/* Update status */}
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
                        <select
                          name="status"
                          defaultValue={r.status}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="done">Done</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                        >
                          Update
                        </Button>
                      </form>

                      {/* Convert → Record */}
                      <ConvertRequestDialog
                        requestId={r.id}
                        deviceId={r.deviceId}
                        defaultType={r.type as "redovni" | "vanredni" | "major"}
                        trigger={<Button size="sm">Convert to record</Button>}
                      />

                      {/* Assign tech & date (visible mainly for scheduled) */}
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
                    No {status} requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t">
          <PaginationBar
            totalPages={totalPages}
            page={page}
            pageSize={pageSize}
            status={status}
          />
        </div>
      </Card>
    </div>
  );
}

// ------- Client components for pagination & page size -------

function PageSizeSelect({
  current,
  status,
}: {
  current: number;
  status: Segment;
}) {
  return (
    <form
      className="flex items-center gap-2"
      action={async (formData) => {
        "use server";
        await updateRequestStatus(r.id, formData.get("status") as any);
      }}
    >
      <span className="text-xs text-muted-foreground">Page size:</span>
      <span className="text-xs">{current}</span>
    </form>
  );
}
