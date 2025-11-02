import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { notifications } from "@/db/schemas/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function NotificationBell() {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) return null;

  const unread = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, s.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(5);

  const unreadCount = unread.filter((n) => !n.readAt).length;

  return (
    <div className="relative">
      <Link href="/notifications" className="inline-flex items-center">
        <Button variant="outline" size="icon" aria-label="Notifications">
          🔔
        </Button>
        {unreadCount > 0 && (
          <span className="ml-2 text-xs bg-destructive text-destructive-foreground rounded-full px-2 py-0.5">
            {unreadCount}
          </span>
        )}
      </Link>
    </div>
  );
}
