"use server";

import { db } from "@/db";
import { devices, clients } from "@/db/schemas/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, inArray, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

const DeviceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  name: z.string().min(2, "Name is required"),
  serialNumber: z.string().min(1, "Serial is required"),
  installDate: z
    .string()
    .transform((v) => (v ? new Date(v) : null))
    .nullable()
    .optional(),
  lastServiceDate: z
    .string()
    .transform((v) => (v ? new Date(v) : null))
    .nullable()
    .optional(),
  nextServiceDate: z
    .string()
    .transform((v) => (v ? new Date(v) : null))
    .nullable()
    .optional(),
  serviceIntervalMonths: z.coerce.number().int().min(1).default(6),
  majorServiceYears: z.coerce.number().int().min(1).default(5),
});

async function assertAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

export async function createDevice(input: unknown) {
  await assertAdmin();
  const data = DeviceSchema.parse(input);

  await db.insert(devices).values({
    id: createId(),
    clientId: data.clientId,
    name: data.name,
    serialNumber: data.serialNumber,
    installDate: data.installDate ?? null,
    lastServiceDate: data.lastServiceDate ?? null,
    nextServiceDate: data.nextServiceDate ?? null,
    serviceIntervalMonths: data.serviceIntervalMonths,
    majorServiceYears: data.majorServiceYears,
  });

  revalidatePath("/admin/devices");
  revalidatePath("/admin/dashboard");
}

export async function updateDevice(id: string, input: unknown) {
  await assertAdmin();
  const data = DeviceSchema.parse(input);

  await db
    .update(devices)
    .set({
      clientId: data.clientId,
      name: data.name,
      serialNumber: data.serialNumber,
      installDate: data.installDate ?? null,
      lastServiceDate: data.lastServiceDate ?? null,
      nextServiceDate: data.nextServiceDate ?? null,
      serviceIntervalMonths: data.serviceIntervalMonths,
      majorServiceYears: data.majorServiceYears,
    })
    .where(eq(devices.id, id));

  revalidatePath("/admin/devices");
  revalidatePath("/admin/dashboard");
}

export async function deleteDevice(id: string) {
  await assertAdmin();
  await db.delete(devices).where(eq(devices.id, id));
  revalidatePath("/admin/devices");
  revalidatePath("/admin/dashboard");
}
