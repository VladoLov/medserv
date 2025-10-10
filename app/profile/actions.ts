"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  user as users,
  clientMembers,
  clientProfile,
  technicianProfile,
} from "@/db/schemas/schema";

async function requireSession() {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) throw new Error("Unauthorized");
  return s;
}

/* —— All: update basic account —— */
const AccountSchema = z.object({ name: z.string().min(2, "Name is required") });

export async function updateAccount(input: unknown) {
  const s = await requireSession();
  const data = AccountSchema.parse(input);

  await db
    .update(users)
    .set({ name: data.name })
    .where(eq(users.id, s.user.id));
  revalidatePath("/profile");
}

/* —— Client: update organization profile —— */
const ClientSchema = z.object({
  organizationName: z.string().min(2, "Organization is required"),
  address: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional(),
});

export async function updateClientProfileAction(input: unknown) {
  const s = await requireSession();
  if (s.user.role !== "client") throw new Error("Forbidden");

  const data = ClientSchema.parse(input);

  // find client_id through membership
  const membership = await db.query.clientMembers.findFirst({
    where: eq(clientMembers.userId, s.user.id),
    columns: { clientId: true },
  });
  if (!membership) throw new Error("No client membership");

  // upsert client_profile by client_id (PK)
  const exists = await db.query.clientProfile.findFirst({
    where: eq(clientProfile.clientId, membership.clientId),
    columns: { clientId: true },
  });

  if (exists) {
    await db
      .update(clientProfile)
      .set({
        organizationName: data.organizationName,
        address: data.address ?? null,
        contactEmail: data.contactEmail ?? null,
      })
      .where(eq(clientProfile.clientId, membership.clientId));
  } else {
    await db.insert(clientProfile).values({
      clientId: membership.clientId,
      organizationName: data.organizationName,
      address: data.address ?? null,
      contactEmail: data.contactEmail ?? null,
    });
  }

  revalidatePath("/profile");
}

/* —— Technician: update profile —— */
const TechSchema = z.object({
  phone: z.string().optional(),
  region: z.string().optional(),
});

export async function updateTechnicianProfileAction(input: unknown) {
  const s = await requireSession();
  if (s.user.role !== "technician") throw new Error("Forbidden");

  const data = TechSchema.parse(input);

  const exists = await db.query.technicianProfile.findFirst({
    where: eq(technicianProfile.userId, s.user.id),
    columns: { userId: true },
  });

  if (exists) {
    await db
      .update(technicianProfile)
      .set({
        phone: data.phone ?? null,
        region: data.region ?? null,
      })
      .where(eq(technicianProfile.userId, s.user.id));
  } else {
    await db.insert(technicianProfile).values({
      userId: s.user.id,
      phone: data.phone ?? null,
      region: data.region ?? null,
    });
  }

  revalidatePath("/profile");
}
