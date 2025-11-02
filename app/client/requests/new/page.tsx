import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clientMembers, devices, clients } from "@/db/schemas/schema";
import { eq, and, asc } from "drizzle-orm";
import NewClientRequestForm from "./request-form";

export default async function ClientNewRequestPage({
  searchParams,
}: {
  searchParams?: { deviceId?: string };
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "client") redirect("/unauthorized");

  // find clientId for this user
  const mem = await db.query.clientMembers.findFirst({
    where: eq(clientMembers.userId, session.user.id),
    columns: { clientId: true },
  });
  if (!mem) {
    redirect("/devices"); // or show a helpful message
  }

  // preload client name (optional)
  const clientRow = await db.query.clients.findFirst({
    where: eq(clients.id, mem.clientId),
    columns: { id: true, name: true },
  });

  // limit device list to this client
  const devs = await db
    .select({
      id: devices.id,
      name: devices.name,
    })
    .from(devices)
    .where(eq(devices.clientId, mem.clientId))
    .orderBy(asc(devices.name));

  const initialDeviceId = searchParams?.deviceId ?? "";

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">New service request</h1>
        <p className="text-sm text-muted-foreground">
          {clientRow?.name
            ? `For client: ${clientRow.name}`
            : "For your client"}
        </p>
      </div>

      <NewClientRequestForm
        deviceList={devs}
        initialDeviceId={initialDeviceId}
      />
    </div>
  );
}
