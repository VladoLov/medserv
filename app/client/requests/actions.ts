"use server";

import { db } from "@/db";
import { serviceRequests, devices, clientMembers } from "@/db/schemas/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";

const NewRequestSchema = z.object({
  deviceId: z.string().min(1),
  type: z.enum(["redovni", "vanredni", "major"]),
  preferredDate: z.string().optional(), // yyyy-mm-dd
  description: z.string().optional(),
});

async function getClientSession() {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s || s.user.role !== "client") throw new Error("Unauthorized");
  return s;
}

/** Ensure that the device belongs to client that the current user is member of */
async function assertClientOwnsDevice(userId: string, deviceId: string) {
  // get device.clientId
  const dev = await db.query.devices.findFirst({
    where: eq(devices.id, deviceId),
    columns: { clientId: true },
  });
  if (!dev) throw new Error("Device not found");

  // ensure membership
  const mem = await db.query.clientMembers.findFirst({
    where: (cm, { and: _and, eq: _eq }) =>
      _and(_eq(cm.userId, userId), _eq(cm.clientId, dev.clientId)),
    columns: { userId: true },
  });
  if (!mem) throw new Error("Forbidden");

  return { clientId: dev.clientId! };
}

export async function createClientRequest(inputRaw: unknown) {
  const s = await getClientSession();
  const data = NewRequestSchema.parse(inputRaw);

  await assertClientOwnsDevice(s.user.id, data.deviceId);

  await db.insert(serviceRequests).values({
    id: createId(),
    deviceId: data.deviceId,
    requestedBy: s.user.id,
    type: data.type,
    description: data.description ?? null,
    preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
    status: "open", // important: client-created starts as OPEN
  });

  // Invalidate lists
  revalidatePath("/client/requests");
  revalidatePath(`/client/devices/${data.deviceId}`);

  // redirect to list
  const { redirect } = await import("next/navigation");
  redirect("/client/requests");
}
