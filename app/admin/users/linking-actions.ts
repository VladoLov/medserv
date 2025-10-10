"use server";

import { db } from "@/db";
import { clientMembers, clients, user as users } from "@/db/schemas/schema";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

async function assertAdmin() {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s || s.user.role !== "admin") throw new Error("Unauthorized");
}

const LinkSchema = z.object({
  userId: z.string().min(1),
  clientId: z.string().min(1),
});

export async function linkUserToClient(input: unknown) {
  await assertAdmin();
  const data = LinkSchema.parse(input);

  // osiguraj da user postoji i da je “client” (opciono: auto-setuj)
  const u = await db.query.user.findFirst({
    where: eq(users.id, data.userId),
    columns: { id: true, role: true },
  });
  if (!u) throw new Error("User not found");

  // (opciono) ako nije client, spusti rolu:
  if (u.role !== "client") {
    await db
      .update(users)
      .set({ role: "client" })
      .where(eq(users.id, data.userId));
  }

  // upsert članstvo (ako korisnik već postoji u toj bolnici – ignoriši)
  await db
    .insert(clientMembers)
    .values({
      clientId: data.clientId,
      userId: data.userId,
      roleInClient: "member",
    })
    .onConflictDoNothing();

  revalidatePath("/admin/users");
}

export async function unlinkUserFromClient(input: unknown) {
  await assertAdmin();
  const data = LinkSchema.parse(input);

  await db
    .delete(clientMembers)
    .where(eq(clientMembers.clientId, data.clientId))
    .where(eq(clientMembers.userId, data.userId));

  revalidatePath("/admin/users");
}
