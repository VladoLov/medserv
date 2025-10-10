"use server";

import { db } from "@/db";
// ⚠️ koristi tačan import u tvom projektu: "@/db/schema" ili "@/db/schemas/schema"
import { devices, serviceRequests, serviceRecords } from "@/db/schemas/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";

/* --------------------- helpers & guards --------------------- */
async function assertTech() {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s || s.user.role !== "technician") throw new Error("Unauthorized");
  return s;
}

async function assertOwnRequest(requestId: string) {
  const s = await assertTech();
  const req = await db.query.serviceRequests.findFirst({
    where: eq(serviceRequests.id, requestId),
    columns: {
      id: true,
      assignedTo: true,
      deviceId: true,
      status: true,
      scheduledAt: true, // za delay fallback
    },
  });
  if (!req) throw new Error("Request not found");
  if (req.assignedTo !== s.user.id) throw new Error("Forbidden");
  return { session: s, req };
}

const DelaySchema = z.object({
  requestId: z.string(),
  newDate: z.string().optional(), // YYYY-MM-DD
  reason: z.string().optional(),
  redirectTo: z.string().optional(),
});

const FinishSchema = z.object({
  requestId: z.string(),
  serviceDate: z.string().min(1), // YYYY-MM-DD
  type: z.enum(["redovni", "vanredni", "major"]),
  notes: z.string().optional(),
  redirectTo: z.string().optional(),
});

const addMonths = (d: Date, m: number) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
};

/* --------------------- actions --------------------- */

/** START */
export async function startRequest(input: {
  requestId: string;
  redirectTo?: string;
}) {
  const { req } = await assertOwnRequest(input.requestId);
  if (!["scheduled", "delayed"].includes(req.status!)) {
    throw new Error("Request cannot be started in current status");
  }
  await db
    .update(serviceRequests)
    .set({ status: "in_progress", startedAt: new Date() })
    .where(eq(serviceRequests.id, input.requestId));

  // svježi listing
  revalidatePath("/technician/requests");

  // preusmjeri na In progress tab (ili custom)
  const target = input.redirectTo ?? "/technician/requests?status=in_progress";
  const { redirect } = await import("next/navigation");
  redirect(target);
}

/** DELAY */
export async function delayRequest(inputRaw: unknown) {
  const input = DelaySchema.parse(inputRaw);
  const { req } = await assertOwnRequest(input.requestId);

  await db
    .update(serviceRequests)
    .set({
      status: "delayed",
      scheduledAt: input.newDate
        ? new Date(input.newDate)
        : req.scheduledAt ?? null,
      delayReason: input.reason ?? null,
    })
    .where(eq(serviceRequests.id, input.requestId));

  revalidatePath("/technician/requests");

  // default: ostani na "delayed" tabu
  const target = input.redirectTo ?? "/technician/requests?status=delayed";
  const { redirect } = await import("next/navigation");
  redirect(target);
}

/** FINISH → kreira service record + update device + status=done + redirect Finished tab */
export async function finishRequest(inputRaw: unknown) {
  const input = FinishSchema.parse(inputRaw);
  const { session, req } = await assertOwnRequest(input.requestId);

  // 1) device & interval
  const dev = await db.query.devices.findFirst({
    where: eq(devices.id, req.deviceId!),
    columns: {
      id: true,
      serviceIntervalMonths: true,
    },
  });
  if (!dev) throw new Error("Device not found");

  const date = new Date(input.serviceDate);
  const next = addMonths(date, dev.serviceIntervalMonths ?? 6);

  // 2) insert service record
  await db.insert(serviceRecords).values({
    id: createId(),
    deviceId: dev.id!,
    technicianId: session.user.id,
    serviceDate: date,
    type: input.type,
    notes: input.notes ?? null,
    nextServiceDate: next,
  });

  // 3) update device last/next
  await db
    .update(devices)
    .set({ lastServiceDate: date, nextServiceDate: next })
    .where(eq(devices.id, dev.id!));

  // 4) close request
  await db
    .update(serviceRequests)
    .set({ status: "done", finishedAt: new Date() })
    .where(eq(serviceRequests.id, input.requestId));

  // 5) revalidations
  revalidatePath("/technician/requests");
  revalidatePath(`/technician/devices/${dev.id}`);

  // 6) redirect na Finished tab (default) ili na dati redirectTo
  const target = input.redirectTo ?? "/technician/requests?status=done";
  const { redirect } = await import("next/navigation");
  redirect(target);
}
