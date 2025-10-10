"use server";

import { db } from "@/db";
import { devices, clientMembers, serviceRequests } from "@/db/schemas/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";

const RequestSchema = z.object({
  deviceId: z.string().min(1),
  type: z.enum(["redovni", "vanredni", "major"]),
  description: z.string().optional(),
  preferredDate: z
    .string()
    .transform((v) => (v ? new Date(v) : null))
    .nullable()
    .optional(),
});

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

async function assertClientAccessToDevice(deviceId: string) {
  const s = await getSession();
  if (!s || s.user.role !== "client") throw new Error("Unauthorized");

  const d = await db.query.devices.findFirst({
    where: eq(devices.id, deviceId),
    columns: { clientId: true },
  });
  if (!d) throw new Error("Device not found");

  const mem = await db.query.clientMembers.findFirst({
    where: (cm, { and, eq: _eq }) =>
      and(_eq(cm.clientId, d.clientId), _eq(cm.userId, s.user.id)),
  });
  if (!mem) throw new Error("Forbidden");

  return s.user.id;
}

export async function createServiceRequest(input: unknown) {
  const data = RequestSchema.parse(input);
  const requesterId = await assertClientAccessToDevice(data.deviceId);

  await db.insert(serviceRequests).values({
    id: createId(),
    deviceId: data.deviceId,
    requestedBy: requesterId,
    type: data.type,
    description: data.description ?? null,
    preferredDate: data.preferredDate ?? null,
    status: "open",
  });

  revalidatePath(`/client/devices/${data.deviceId}`);
}
