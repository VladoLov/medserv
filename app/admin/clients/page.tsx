import { db } from "../../../db";
import { clients } from "../../../db/schemas/schema";
import { eq, asc } from "drizzle-orm";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import ClientDialog from "../../../components/admin/ClientDialog";

export default async function ClientsPage() {
  const rows = await db.select().from(clients).orderBy(asc(clients.name));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clients</h1>
        <ClientDialog
          mode="create"
          trigger={
            <Button className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" /> Add client
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
                <th className="px-4 py-2">Address</th>
                <th className="px-4 py-2 w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2">{r.address ?? "—"}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <ClientDialog
                        mode="edit"
                        client={r}
                        trigger={
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <ClientDialog
                        mode="delete"
                        client={r}
                        trigger={
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
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
                    colSpan={3}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No clients yet.
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
