"use server";

import { db } from "@/db";
import { devices, serviceRequests, serviceRecords } from "@/db/schemas/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

async function assertAdminOrTech() {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s || !["admin", "technician"].includes(s.user.role)) {
    throw new Error("Unauthorized");
  }
  return s;
}

export async function updateRequestStatus(
  id: string,
  status: "open" | "scheduled" | "cancelled" | "done"
) {
  await assertAdminOrTech();
  await db
    .update(serviceRequests)
    .set({ status })
    .where(eq(serviceRequests.id, id));
  revalidatePath("/admin/requests");
}

const ConvertSchema = z.object({
  requestId: z.string(),
  serviceDate: z
    .string()
    .min(1)
    .transform((v) => new Date(v)),
  type: z.enum(["redovni", "vanredni", "major"]),
  notes: z.string().optional(),
});

export async function convertRequestToRecord(input: unknown) {
  const s = await assertAdminOrTech();
  const data = ConvertSchema.parse(input);

  // 1) Nađi zahtjev i uređaj
  const req = await db.query.serviceRequests.findFirst({
    where: eq(serviceRequests.id, data.requestId),
    columns: { id: true, deviceId: true, type: true, status: true },
  });
  if (!req) throw new Error("Request not found");
  if (req.status === "done" || req.status === "cancelled")
    throw new Error("Request already closed");

  const dev = await db.query.devices.findFirst({
    where: eq(devices.id, req.deviceId),
    columns: { id: true, serviceIntervalMonths: true },
  });
  if (!dev) throw new Error("Device not found");

  const addMonths = (d: Date, months: number) => {
    const r = new Date(d);
    r.setMonth(r.getMonth() + (months ?? 6));
    return r;
  };

  const next = addMonths(data.serviceDate, dev.serviceIntervalMonths ?? 6);

  // 2) Kreiraj service record
  await db.insert(serviceRecords).values({
    id: createId(),
    deviceId: req.deviceId,
    technicianId: s.user.id, // ko je “odradio”
    serviceDate: data.serviceDate,
    type: data.type, // admin/tech može override-ati tip
    notes: data.notes ?? null,
    nextServiceDate: next,
  });

  // 3) Ažuriraj uređaj
  await db
    .update(devices)
    .set({ lastServiceDate: data.serviceDate, nextServiceDate: next })
    .where(eq(devices.id, req.deviceId));

  // 4) Označi zahtjev “done”
  await db
    .update(serviceRequests)
    .set({ status: "done" })
    .where(eq(serviceRequests.id, data.requestId));

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/devices/${req.deviceId}`);
  revalidatePath("/admin/dashboard");
}

export async function assignRequest(input: unknown) {
  const s = await assertAdminOrTech();
  const schema = z.object({
    requestId: z.string(),
    technicianId: z.string().min(1),
    scheduledAt: z.string().optional(), // ISO date or empty
  });
  const data = schema.parse(input);

  await db
    .update(serviceRequests)
    .set({
      assignedTo: data.technicianId,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      status: "scheduled",
    })
    .where(eq(serviceRequests.id, data.requestId));

  revalidatePath("/admin/requests");
}
