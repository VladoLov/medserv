"use server";

import { db } from "@/db";
import { clients } from "../../../db/schemas/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "../../../lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

const ClientSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
});

async function assertAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

export async function createClient(formData: unknown) {
  await assertAdmin();
  const data = ClientSchema.parse(formData);
  try {
    await db.insert(clients).values({
      id: createId(), // ili crypto.randomUUID()
      name: data.name,
      address: data.address ?? "",
      createdAt: new Date(),
    });
    revalidatePath("/admin/clients");
  } catch (e: any) {
    console.error("createClient error:", e?.message, e?.cause ?? e);
    throw e;
  }
}

export async function updateClient(id: string, formData: unknown) {
  await assertAdmin();
  const data = ClientSchema.parse(formData);
  await db
    .update(clients)
    .set({
      name: data.name,
      address: data.address ?? null,
    })
    .where(eq(clients.id, id));
  revalidatePath("/admin/clients");
}

export async function deleteClient(id: string) {
  await assertAdmin();
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/admin/clients");
}
