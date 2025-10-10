"use server";

import { z } from "zod";
import { db } from "@/db";
import { user as users } from "@/db/schemas/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

type Role = "admin" | "technician" | "client";

async function assertAdmin() {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s || s.user.role !== "admin") throw new Error("Unauthorized");
  return s;
}

const UpdateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "technician", "client"]),
});

/** Promjena role (samo admin) */
export async function updateUserRole(formData: FormData | unknown) {
  await assertAdmin();

  // podrži i <form action> (FormData) i JSON poziv
  let parsed;
  if (formData instanceof FormData) {
    parsed = UpdateRoleSchema.parse({
      userId: String(formData.get("userId") ?? ""),
      role: String(formData.get("role") ?? ""),
    });
  } else {
    parsed = UpdateRoleSchema.parse(formData);
  }

  await db
    .update(users)
    .set({ role: parsed.role })
    .where(eq(users.id, parsed.userId));
  revalidatePath("/admin/users");
}

/** (Opcionalno) Deaktivacija user-a: spusti rolu na client */
export async function deactivateUser(userId: string) {
  await assertAdmin();
  await db.update(users).set({ role: "client" }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}
