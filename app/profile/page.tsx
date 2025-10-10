import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  user as users,
  clientMembers,
  clients,
  clientProfile,
  technicianProfile,
} from "@/db/schemas/schema";

import ProfileForm from "@/components/profile/ProfileForm";
import { Card } from "@/components/ui/card";

export const revalidate = 0;

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // base user
  const me = await db.query.user.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, name: true, email: true, role: true },
  });
  if (!me) redirect("/login");

  let clientInfo: {
    clientId: string;
    clientName: string;
    org?: string | null;
    address?: string | null;
    contactEmail?: string | null;
  } | null = null;

  let techInfo: { phone?: string | null; region?: string | null } | null = null;

  if (me.role === "client") {
    const membership = await db.query.clientMembers.findFirst({
      where: eq(clientMembers.userId, me.id),
      columns: { clientId: true },
    });

    if (membership) {
      const c = await db.query.clients.findFirst({
        where: eq(clients.id, membership.clientId),
        columns: { id: true, name: true },
        with: {
          clientProfile: true, // if you have relations; otherwise query separately
        } as any,
      });

      // if without relations:
      const p =
        (await db.query.clientProfile.findFirst({
          where: eq(clientProfile.clientId, membership.clientId),
          columns: {
            organizationName: true,
            address: true,
            contactEmail: true,
          },
        })) ?? null;

      clientInfo = {
        clientId: membership.clientId,
        clientName: c?.name ?? "—",
        org: p?.organizationName ?? null,
        address: p?.address ?? null,
        contactEmail: p?.contactEmail ?? null,
      };
    }
  }

  if (me.role === "technician") {
    const t =
      (await db.query.technicianProfile.findFirst({
        where: eq(technicianProfile.userId, me.id),
        columns: { phone: true, region: true },
      })) ?? null;
    techInfo = { phone: t?.phone ?? null, region: t?.region ?? null };
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-xl font-semibold">Profile</h1>

      <Card className="p-4">
        <ProfileForm
          user={{ id: me.id, name: me.name, email: me.email, role: me.role }}
          clientInfo={clientInfo}
          techInfo={techInfo}
        />
      </Card>
    </div>
  );
}
