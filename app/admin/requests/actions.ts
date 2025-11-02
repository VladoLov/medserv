"use server";

import { db } from "@/db";
import {
  devices,
  serviceRequests,
  serviceRecords,
  user,
  clients,
} from "@/db/schemas/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, asc, count, eq, gte, lte } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { redirect } from "next/navigation";

async function assertAdminOrTech() {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s || !["admin", "technician"].includes(s.user.role)) {
    throw new Error("Unauthorized");
  }
  return s;
}

const ScheduleSchema = z.object({
  requestId: z.string().min(1),
  technicianId: z.string().min(1),
  // HTML datetime-local → "YYYY-MM-DDTHH:mm"
  scheduledAt: z.string().min(1),
  // minutes (estimate)
  durationMin: z.coerce
    .number()
    .int()
    .min(15)
    .max(8 * 60)
    .default(60),
});

/** Only admin/technician can schedule */

export async function assignAndScheduleRequest(inputRaw: unknown) {
  await assertAdminOrTech();
  const data = ScheduleSchema.parse(inputRaw);

  // Basic sanity: future time
  const when = new Date(data.scheduledAt);
  if (isNaN(when.getTime())) throw new Error("Invalid date/time");
  if (when.getTime() < Date.now() - 60_000) {
    throw new Error("Cannot schedule in the past");
  }

  // Optional: conflict check (simple window overlap in +/- duration)
  const start = new Date(when);
  const end = new Date(when.getTime() + data.durationMin * 60_000);

  // If you later store duration in DB, you can check true overlaps.
  // For now, detect other "scheduled/in_progress" tasks within +/- 2h
  const startWindow = new Date(when.getTime() - 60 * 60_000);
  const endWindow = new Date(when.getTime() + 60 * 60_000);

  const conflicts = await db
    .select({ c: count() })
    .from(serviceRequests)
    .where(
      and(
        eq(serviceRequests.assignedTo, data.technicianId),
        gte(serviceRequests.scheduledAt, startWindow),
        lte(serviceRequests.scheduledAt, endWindow)
      )
    );

  const conflictCount = conflicts?.[0]?.c ?? 0;

  await db
    .update(serviceRequests)
    .set({
      assignedTo: data.technicianId,
      scheduledAt: when,
      status: "scheduled",
    })
    .where(eq(serviceRequests.id, data.requestId));

  // Revalidate main places
  revalidatePath("/admin/requests");
  revalidatePath("/technician/requests");

  return { ok: true, conflicts: conflictCount };
}

export async function updateRequestStatus(
  id: string,
  status: "delayed" | "scheduled" | "cancelled" | "done" | "in_progress"
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
async function assertAdmin() {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s || s.user.role !== "admin") throw new Error("Unauthorized");
  return s;
}

/** dropdown podaci za formu */
export async function loadNewRequestData() {
  await assertAdmin();
  const clientList = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .orderBy(asc(clients.name));

  const deviceList = await db
    .select({
      id: devices.id,
      name: devices.name,
      clientId: devices.clientId,
    })
    .from(devices);

  const techList = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.role as any, "technician"));

  return { clientList, deviceList, techList };
}

const CreateSchema = z.object({
  clientId: z.string().min(1),
  deviceId: z.string().min(1),
  technicianId: z.string().min(1),
  type: z.enum(["redovni", "vanredni", "major"]),
  scheduledAt: z.string().min(1), // YYYY-MM-DD
  description: z.string().optional(),
  preferredDate: z.string().optional(), // optional YYYY-MM-DD
});

export async function createRequest(input: unknown) {
  const s = await assertAdmin();
  const data = CreateSchema.parse(input);

  // sigurnost: provjeri da uređaj pripada klijentu
  const dev = await db.query.devices.findFirst({
    where: eq(devices.id, data.deviceId),
    columns: { id: true, clientId: true },
  });
  if (!dev || dev.clientId !== data.clientId) {
    throw new Error("Selected device does not belong to that client");
  }

  await db.insert(serviceRequests).values({
    id: createId(),
    deviceId: data.deviceId,
    requestedBy: s.user.id,
    type: data.type,
    description: data.description ?? null,
    preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
    status: "scheduled", // odmah zakazujemo jer dodeljujemo tehničara
    assignedTo: data.technicianId,
    scheduledAt: new Date(data.scheduledAt),
  });

  revalidatePath("/admin/requests");
  redirect("/admin/requests?status=scheduled");
}
