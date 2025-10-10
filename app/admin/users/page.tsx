import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { clients, user as users } from "@/db/schemas/schema";
import { asc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { updateUserRole, deactivateUser } from "./actions";
import LinkUserToClientDialog from "@/components/admin/LinkUserToClientDialog";

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/unauthorized");

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.name));

  const roleBadge = (r: string) => {
    const v =
      r === "admin" ? "default" : r === "technician" ? "secondary" : "outline";
    return (
      <Badge variant={v as any} className="capitalize">
        {r}
      </Badge>
    );
  };
  const clientOptions = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .orderBy(asc(clients.name));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">{rows.length} total</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2 w-[360px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{roleBadge(u.role ?? "client")}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-2">
                      {/* Quick role change via server action form */}
                      <form
                        action={updateUserRole}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="userId" value={u.id} />
                        <Select name="role" defaultValue={u.role ?? "client"}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="technician">
                              Technician
                            </SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="submit" variant="outline" size="sm">
                          Update
                        </Button>
                      </form>

                      {/* Optional: Deactivate to client */}
                      <form
                        action={async () => {
                          "use server";
                          await deactivateUser(u.id);
                        }}
                      >
                        <Button type="submit" variant="destructive" size="sm">
                          Deactivate
                        </Button>
                      </form>

                      {/* Optional: Link to client */}
                      <LinkUserToClientDialog
                        userId={u.id}
                        clients={clientOptions}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-muted-foreground"
                    colSpan={4}
                  >
                    No users yet.
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
