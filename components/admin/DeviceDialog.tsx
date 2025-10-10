"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  createDevice,
  updateDevice,
  deleteDevice,
} from "@/app/admin/devices/actions";

const Schema = z.object({
  clientId: z.string().min(1, "Client is required"),
  name: z.string().min(2, "Name is required"),
  serialNumber: z.string().min(1, "Serial is required"),
  installDate: z.string().optional(),
  lastServiceDate: z.string().optional(),
  nextServiceDate: z.string().optional(),
  serviceIntervalMonths: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v || 6)),
  majorServiceYears: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v || 5)),
});

type ClientOpt = { id: string; name: string };
type Device =
  | {
      id: string;
      clientId: string;
      name: string;
      serialNumber: string;
      installDate?: string;
      lastServiceDate?: string;
      nextServiceDate?: string;
      serviceIntervalMonths?: number;
      majorServiceYears?: number;
    }
  | undefined;

export default function DeviceDialog({
  mode,
  device,
  clients,
  trigger,
}: {
  mode: "create" | "edit" | "delete";
  device?: Device;
  clients: ClientOpt[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: {
      clientId: device?.clientId ?? "",
      name: device?.name ?? "",
      serialNumber: device?.serialNumber ?? "",
      installDate: device?.installDate ?? "",
      lastServiceDate: device?.lastServiceDate ?? "",
      nextServiceDate: device?.nextServiceDate ?? "",
      serviceIntervalMonths: device?.serviceIntervalMonths ?? (6 as number),
      majorServiceYears: device?.majorServiceYears ?? (5 as number),
    },
  });

  useEffect(() => {
    if (device && open) {
      form.reset({
        clientId: device.clientId ?? "",
        name: device.name ?? "",
        serialNumber: device.serialNumber ?? "",
        installDate: device.installDate ?? "",
        lastServiceDate: device.lastServiceDate ?? "",
        nextServiceDate: device.nextServiceDate ?? "",
        serviceIntervalMonths: device.serviceIntervalMonths ?? 6,
        majorServiceYears: device.majorServiceYears ?? 5,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device?.id, open]);

  const onSubmit = async (values: z.infer<typeof Schema>) => {
    if (mode === "create") await createDevice(values);
    if (mode === "edit" && device?.id) await updateDevice(device.id, values);
    setOpen(false);
  };

  const onDelete = async () => {
    if (device?.id) {
      await deleteDevice(device.id);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" && "Add device"}
            {mode === "edit" && "Edit device"}
            {mode === "delete" && "Delete device"}
          </DialogTitle>
        </DialogHeader>

        {mode !== "delete" ? (
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <Label>Client</Label>
              <Select
                value={form.watch("clientId") || "_none"}
                onValueChange={(v) =>
                  form.setValue("clientId", v === "_none" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none" disabled>
                    Select client
                  </SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.clientId && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.clientId.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Device name</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Serial number</Label>
              <Input {...form.register("serialNumber")} />
              {form.formState.errors.serialNumber && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.serialNumber.message}
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Install date</Label>
                <Input type="date" {...form.register("installDate")} />
              </div>
              <div className="space-y-1">
                <Label>Last service</Label>
                <Input type="date" {...form.register("lastServiceDate")} />
              </div>
              <div className="space-y-1">
                <Label>Next service</Label>
                <Input type="date" {...form.register("nextServiceDate")} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Interval (months)</Label>
                <Input
                  type="number"
                  min={1}
                  {...form.register("serviceIntervalMonths")}
                />
              </div>
              <div className="space-y-1">
                <Label>Major service (years)</Label>
                <Input
                  type="number"
                  min={1}
                  {...form.register("majorServiceYears")}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <p>
              Are you sure you want to delete <b>{device?.name}</b>?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
