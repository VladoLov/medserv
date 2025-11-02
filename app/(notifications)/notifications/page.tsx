import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { notifications } from "@/db/schemas/schema";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead, markNotificationRead } from "../actions";

export const revalidate = 0;

export default async function NotificationsPage() {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) redirect("/login");

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, s.user.id))
    .orderBy(desc(notifications.createdAt));

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notifications</h1>
        {rows.some((r) => !r.readAt) && (
          <form action={markAllNotificationsRead}>
            <Button variant="outline">Mark all as read</Button>
          </form>
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No notifications.
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((n) => (
              <li key={n.id} className="p-4 flex gap-3 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{n.title}</span>
                    {!n.readAt && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                        new
                      </span>
                    )}
                  </div>
                  {n.body && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {n.body}
                    </p>
                  )}
                  {n.link && (
                    <Link
                      href={n.link}
                      className="text-sm underline mt-2 inline-block"
                    >
                      Open
                    </Link>
                  )}
                </div>
                {!n.readAt && (
                  <form
                    action={async () => {
                      "use server";
                      await markNotificationRead(n.id);
                    }}
                  >
                    <Button variant="ghost" size="sm">
                      Mark read
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
