import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user as users, technicianProfile } from "@/db/schemas/schema";
import { eq, asc, and } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, UserX } from "lucide-react";
import TechnicianDialog from "@/components/admin/TechnicianDialog";
import { Suspense } from "react";

export default async function TechniciansPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/unauthorized");

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: technicianProfile.phone,
      region: technicianProfile.region,
    })
    .from(users)
    .leftJoin(technicianProfile, eq(technicianProfile.userId, users.id))
    .where(eq(users.role, "technician"))
    .orderBy(asc(users.name));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Technicians</h1>
        <TechnicianDialog
          mode="create"
          trigger={
            <Button className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" /> Add technician
            </Button>
          }
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b">
          <p className="text-sm text-muted-foreground">{rows.length} total</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Region</th>
                <th className="px-4 py-2 w-52">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="px-4 py-2">{t.name}</td>
                  <td className="px-4 py-2">{t.email}</td>
                  <td className="px-4 py-2">{t.phone ?? "—"}</td>
                  <td className="px-4 py-2">{t.region ?? "—"}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <TechnicianDialog
                        mode="edit"
                        technician={{
                          userId: t.id,
                          name: t.name,
                          email: t.email,
                          phone: t.phone ?? "",
                          region: t.region ?? "",
                        }}
                        trigger={
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <TechnicianDialog
                        mode="deactivate"
                        technician={{
                          userId: t.id,
                          name: t.name,
                          email: t.email,
                          phone: t.phone ?? "",
                          region: t.region ?? "",
                        }}
                        trigger={
                          <Button variant="destructive" size="sm">
                            <UserX className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No technicians yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
