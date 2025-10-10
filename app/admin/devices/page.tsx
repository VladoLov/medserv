import { db } from "@/db";
import { clients, devices } from "@/db/schemas/schema";
import { eq, asc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DeviceDialog from "@/components/admin/DeviceDialog";

export default async function DevicesPage() {
  // liste za select
  const clientList = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .orderBy(asc(clients.name));

  // join za tabelu
  const rows = await db
    .select({
      id: devices.id,
      name: devices.name,
      serial: devices.serialNumber,
      nextServiceDate: devices.nextServiceDate,
      clientName: clients.name,
      clientId: clients.id,
    })
    .from(devices)
    .innerJoin(clients, eq(devices.clientId, clients.id))
    .orderBy(asc(clients.name), asc(devices.name));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Devices</h1>
        <DeviceDialog
          mode="create"
          clients={clientList}
          trigger={
            <Button className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" /> Add device
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
                <th className="px-4 py-2">Device</th>
                <th className="px-4 py-2">Serial</th>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Next service</th>
                <th className="px-4 py-2 w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2">{r.serial}</td>
                  <td className="px-4 py-2">{r.clientName}</td>
                  <td className="px-4 py-2">
                    {r.nextServiceDate
                      ? new Date(r.nextServiceDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <DeviceDialog
                        mode="edit"
                        clients={clientList}
                        device={{
                          id: r.id,
                          name: r.name,
                          serialNumber: r.serial ?? "",
                          clientId: r.clientId,
                          nextServiceDate: r.nextServiceDate
                            ? new Date(r.nextServiceDate)
                                .toISOString()
                                .slice(0, 10)
                            : "",
                          installDate: "",
                          lastServiceDate: "",
                          serviceIntervalMonths: 6,
                          majorServiceYears: 5,
                        }}
                        trigger={
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DeviceDialog
                        mode="delete"
                        clients={clientList}
                        device={{
                          id: r.id,
                          name: r.name,
                          serialNumber: r.serial ?? "",
                          clientId: r.clientId,
                        }}
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
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No devices yet.
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
