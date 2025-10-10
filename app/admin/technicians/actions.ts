"use server";

import { db } from "@/db";
import { user as users, technicianProfile } from "@/db/schemas/schema";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

const CreateTechSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  region: z.string().optional(),
});

const UpdateTechSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(2),
  phone: z.string().optional(),
  region: z.string().optional(),
});

async function assertAdmin() {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s || s.user.role !== "admin") throw new Error("Unauthorized");
}

/**
 * Kreira BA korisnika (email+password), postavlja role='technician',
 * i dodaje technician_profile.
 */
export async function createTechnician(input: unknown) {
  await assertAdmin();
  const data = CreateTechSchema.parse(input);

  // 1) Kreiraj account preko Better Auth API rute
  //    (siguran interni poziv na sopstveni endpoint)
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    // Better Auth očekuje { email, password, name }
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      name: data.name,
    }),
    // cookies nisu potrebni jer kreiramo drugi nalog
  });

  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.error?.message || "Failed to create auth user");
  }

  // 2) Nadji kreiranog user-a i postavi rolu 'technician'
  const [u] = await db
    .update(users)
    .set({ role: "technician" })
    .where(eq(users.email, data.email))
    .returning({ id: users.id });

  // Ako BA vraća ID u response-u, možeš iskoristiti umjesto lookup-a.
  // Ovdje lookup radimo po emailu (jedinstven).
  if (!u?.id) throw new Error("User not found after sign-up");

  // 3) Upisi technician_profile (upsert - ako već postoji)
  await db
    .insert(technicianProfile)
    .values({
      userId: u.id,
      phone: data.phone ?? null,
      region: data.region ?? null,
    })
    .onConflictDoUpdate({
      target: technicianProfile.userId,
      set: { phone: data.phone ?? null, region: data.region ?? null },
    });

  revalidatePath("/admin/technicians");
}

export async function updateTechnician(input: unknown) {
  await assertAdmin();
  const data = UpdateTechSchema.parse(input);

  // Ažuriraj ime (users)
  await db
    .update(users)
    .set({ name: data.name })
    .where(eq(users.id, data.userId));

  // Upsert profil
  await db
    .insert(technicianProfile)
    .values({
      userId: data.userId,
      phone: data.phone ?? null,
      region: data.region ?? null,
    })
    .onConflictDoUpdate({
      target: technicianProfile.userId,
      set: { phone: data.phone ?? null, region: data.region ?? null },
    });

  revalidatePath("/admin/technicians");
}

/** Deaktivacija: spustimo rolu na 'client' i obrišemo tech profil (opcija) */
export async function deactivateTechnician(userId: string) {
  await assertAdmin();
  await db.update(users).set({ role: "client" }).where(eq(users.id, userId));
  // Ako želiš zadržati historiju ali uklniti profil, obriši profil:
  // await db.delete(technicianProfile).where(eq(technicianProfile.userId, userId));
  revalidatePath("/admin/technicians");
}
