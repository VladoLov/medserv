"use server";

import { db } from "@/db";
import { notifications } from "@/db/schemas/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function markNotificationRead(id: string) {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) throw new Error("Unauthorized");
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, s.user.id),
        isNull(notifications.readAt)
      )
    );
  revalidatePath("/notifications");
  revalidatePath("/"); // navbar counters
}

export async function markAllNotificationsRead() {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) throw new Error("Unauthorized");
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(notifications.userId, s.user.id), isNull(notifications.readAt))
    );
  revalidatePath("/notifications");
  revalidatePath("/");
}
