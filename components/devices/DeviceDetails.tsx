"use client";

import { useTransition } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createServiceRecord } from "@/app/devices/actions";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "../ui/textarea";

const ServiceFormSchema = z.object({
  deviceId: z.string(),
  serviceDate: z.string().min(1),
  type: z.enum(["redovni", "vanredni", "major"]),
  notes: z.string().optional(),
});
type ServiceForm = z.infer<typeof ServiceFormSchema>;

export function DeviceDetails({
  device,
  records,
  canEdit,
}: {
  device: {
    id: string;
    name: string;
    serialNumber: string | null;
    clientName: string;
    installDate: string | null;
    lastServiceDate: string | null;
    nextServiceDate: string | null;
    serviceIntervalMonths: number;
    majorServiceYears: number;
  };
  records: Array<{
    id: string;
    serviceDate: string;
    type: string;
    notes: string | null;
    technicianName: string | null;
  }>;
  canEdit: boolean; // admin/tech = true, client = false
}) {
  const [pending, start] = useTransition();
  const form = useForm<ServiceForm>({
    resolver: zodResolver(ServiceFormSchema),
    defaultValues: {
      deviceId: device.id,
      serviceDate: new Date().toISOString().slice(0, 10),
      type: "redovni",
      notes: "",
    },
  });

  const onSubmit = (values: ServiceForm) => {
    start(async () => {
      await createServiceRecord(values);
      form.reset({ ...values, notes: "" });
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="p-4 lg:col-span-3">
        <h2 className="text-lg font-semibold mb-3">Device</h2>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Name:</span> {device.name}
          </div>
          <div>
            <span className="text-muted-foreground">Serial:</span>{" "}
            {device.serialNumber ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Client:</span>{" "}
            {device.clientName}
          </div>
          <div>
            <span className="text-muted-foreground">Installed:</span>{" "}
            {device.installDate
              ? new Date(device.installDate).toLocaleDateString()
              : "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Last service:</span>{" "}
            {device.lastServiceDate
              ? new Date(device.lastServiceDate).toLocaleDateString()
              : "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Next service:</span>{" "}
            {device.nextServiceDate
              ? new Date(device.nextServiceDate).toLocaleDateString()
              : "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Interval:</span>{" "}
            {device.serviceIntervalMonths} mo
          </div>
          <div>
            <span className="text-muted-foreground">Major:</span> every{" "}
            {device.majorServiceYears} yr
          </div>
        </div>
      </Card>

      <Card className="p-4 lg:col-span-3">
        <h2 className="text-lg font-semibold mb-3">Service</h2>
        {!canEdit ? (
          <p className="text-sm text-muted-foreground">
            Read-only for clients.
          </p>
        ) : (
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <input type="hidden" {...form.register("deviceId")} />
            <div className="space-y-1">
              <div className="space-x-2 flex flex-row justify-between">
                <Label>Date</Label>
                <p>Unesite trenutni datum</p>
              </div>
              <Input type="date" {...form.register("serviceDate")} />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <select
                className="border rounded px-3 py-2 w-full bg-background"
                {...form.register("type")}
              >
                <option value="redovni">Redovni</option>
                <option value="vanredni">Vanredni</option>
                <option value="major">Major</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} placeholder="Optional..." />
            </div>
            <Button
              disabled={pending}
              className="bg-primary text-primary-foreground"
            >
              {pending ? "Saving..." : "Save service"}
            </Button>
          </form>
        )}
      </Card>

      <Card className="p-4 lg:col-span-3">
        <h2 className="text-lg font-semibold mb-3">History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Technician</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="px-3 py-2">
                    {new Date(r.serviceDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary">{r.type}</Badge>
                  </td>
                  <td className="px-3 py-2">{r.technicianName ?? "—"}</td>
                  <td className="px-3 py-2">{r.notes ?? "—"}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-8 text-center text-muted-foreground"
                    colSpan={4}
                  >
                    No records yet.
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
