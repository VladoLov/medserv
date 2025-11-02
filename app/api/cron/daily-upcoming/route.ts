import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  devices,
  clients,
  clientMembers,
  user,
  notifications,
} from "@/db/schemas/schema";
import { and, eq, inArray, sql, gte, lte } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

const DAYS = [30, 14, 7, 1];

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export async function GET(req: Request) {
  // simple auth for cron
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const today = startOfToday();
  const targetDates = DAYS.map((n) =>
    addDays(today, n).toISOString().slice(0, 10)
  ); // yyyy-mm-dd

  // fetch devices due on target dates
  const dueRows = await db
    .select({
      deviceId: devices.id,
      deviceName: devices.name,
      clientId: devices.clientId,
      nextDate: devices.nextServiceDate,
      clientName: clients.name,
    })
    .from(devices)
    .innerJoin(clients, eq(devices.clientId, clients.id))
    .where(
      and(
        // date equality by day
        inArray(
          sql`to_char(${devices.nextServiceDate}, 'YYYY-MM-DD')`,
          targetDates
        ),
        // and not null just in case
        gte(devices.nextServiceDate, sql`CURRENT_DATE`)
      )
    );

  if (dueRows.length === 0) return NextResponse.json({ ok: true, created: 0 });

  // who to notify: client members + admins
  const clientIds = Array.from(new Set(dueRows.map((r) => r.clientId)));
  const clientMembersRows = await db
    .select({ userId: clientMembers.userId, clientId: clientMembers.clientId })
    .from(clientMembers)
    .where(inArray(clientMembers.clientId, clientIds));

  const adminUsers = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.role, "admin"));

  const byClient: Record<string, string[]> = {};
  clientMembersRows.forEach(({ clientId, userId }) => {
    (byClient[clientId] ||= []).push(userId);
  });

  // create notifications (in-app). Keep it simple: one notification per user per device.
  const notifs = [];
  for (const row of dueRows) {
    const ids = new Set<string>([
      ...(byClient[row.clientId] || []),
      ...adminUsers.map((a) => a.id),
    ]);
    for (const uid of ids) {
      notifs.push({
        id: createId(),
        userId: uid,
        title: `Upcoming service in ${
          DAYS.find(
            (n) =>
              addDays(today, n).toDateString() ===
              new Date(row.nextDate!).toDateString()
          ) ?? "N"
        } days`,
        body: `${row.deviceName} @ ${row.clientName} is due on ${new Date(
          row.nextDate!
        ).toLocaleDateString()}.`,
        link: `/devices?clientId=${row.clientId}&upcoming=1`,
        createdAt: new Date(),
      });
    }
  }

  if (notifs.length) {
    await db.insert(notifications).values(notifs);
  }

  // optional: email via Resend (send simple batch)
  if (process.env.RESEND_API_KEY) {
    // ... if you want, enqueue or call Resend here
    // Keep minimal in v1. We can add this in the next mini-step.
  }

  return NextResponse.json({ ok: true, created: notifs.length });
}
