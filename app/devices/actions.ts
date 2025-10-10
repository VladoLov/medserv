"use server";

import { db } from "@/db";
import {
  devices,
  serviceRecords,
  clients,
  clientMembers,
} from "@/db/schemas/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";

const ServiceSchema = z.object({
  deviceId: z.string().min(1),
  type: z.enum(["redovni", "vanredni", "major"]),
  serviceDate: z.string().transform((v) => new Date(v)),
  notes: z.string().optional(),
});

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

async function assertAdminOrTech() {
  const s = await getSession();
  if (!s || !["admin", "technician"].includes(s.user.role)) {
    throw new Error("Unauthorized");
  }
  return s;
}

/** Klijentski pristup (read-only). Provjera da user pripada bolnici tog uređaja. */
export async function assertClientAccessToDevice(deviceId: string) {
  const s = await getSession();
  if (!s || s.user.role !== "client") throw new Error("Unauthorized");

  // dohvat device.clientId
  const d = await db.query.devices.findFirst({
    where: eq(devices.id, deviceId),
    columns: { clientId: true },
  });
  if (!d) throw new Error("Not found");

  const mem = await db.query.clientMembers.findFirst({
    where: (cm, { and, eq: _eq }) =>
      and(_eq(cm.clientId, d.clientId), _eq(cm.userId, s.user.id)),
  });
  if (!mem) throw new Error("Forbidden");
  return { session: s, clientId: d.clientId };
}

/** Admin/Tech kreira servis + auto update uređaja (last/next) */
export async function createServiceRecord(input: unknown) {
  const { user } = await assertAdminOrTech();
  const data = ServiceSchema.parse(input);

  // dohvat intervala sa uređaja
  const dev = await db.query.devices.findFirst({
    where: eq(devices.id, data.deviceId),
    columns: {
      id: true,
      serviceIntervalMonths: true,
    },
  });
  if (!dev) throw new Error("Device not found");

  const addMonths = (date: Date, months: number) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const next = addMonths(data.serviceDate, dev.serviceIntervalMonths ?? 6);

  // 1) upiši servis
  await db.insert(serviceRecords).values({
    id: createId(),
    deviceId: data.deviceId,
    technicianId: user.id,
    serviceDate: data.serviceDate,
    type: data.type,
    notes: data.notes ?? null,
    nextServiceDate: next,
  });

  // 2) ažuriraj uređaj
  await db
    .update(devices)
    .set({
      lastServiceDate: data.serviceDate,
      nextServiceDate: next,
    })
    .where(eq(devices.id, data.deviceId));

  revalidatePath(`/admin/devices/${data.deviceId}`);
  revalidatePath(`/client/devices/${data.deviceId}`);
  revalidatePath(`/admin/dashboard`);
}
