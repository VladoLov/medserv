"use client";

import { useMemo, useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { createRequest } from "../actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const Schema = z.object({
  clientId: z.string().min(1, "Select client"),
  deviceId: z.string().min(1, "Select device"),
  technicianId: z.string().min(1, "Select technician"),
  type: z.enum(["redovni", "vanredni", "major"]),
  scheduledAt: z.string().min(1, "Pick a date"),
  description: z.string().optional(),
  preferredDate: z.string().optional(),
});
type FormValues = z.infer<typeof Schema>;

export default function NewRequestForm({
  clientList,
  deviceList,
  techList,
  initialClientId = "",
  initialDeviceId = "",
}: {
  clientList: { id: string; name: string }[];
  deviceList: { id: string; name: string; clientId: string }[];
  techList: { id: string; name: string | null }[];
  initialClientId?: string;
  initialDeviceId?: string;
}) {
  // Lookups
  const deviceMap = useMemo(
    () => Object.fromEntries(deviceList.map((d) => [d.id, d] as const)),
    [deviceList]
  );

  // Derived defaults from initial ids
  const derivedDefaults: Partial<FormValues> = useMemo(() => {
    if (initialDeviceId && deviceMap[initialDeviceId]) {
      const dev = deviceMap[initialDeviceId];
      return {
        clientId: dev.clientId,
        deviceId: initialDeviceId,
        type: "redovni",
      };
    }
    return { clientId: initialClientId || "", deviceId: "", type: "redovni" };
  }, [initialClientId, initialDeviceId, deviceMap]);

  // Lock flags – if you open with existing ids, don’t allow changing them
  const lockClient = Boolean(initialClientId);
  const lockDevice = Boolean(initialDeviceId);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    watch,
    register,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      clientId: derivedDefaults.clientId || "",
      deviceId: derivedDefaults.deviceId || "",
      technicianId: "",
      type: (derivedDefaults.type as any) || "redovni",
      scheduledAt: "",
      description: "",
      preferredDate: "",
    },
  });

  // keep in sync if props change (e.g., via URL)
  useEffect(() => {
    reset({
      clientId: derivedDefaults.clientId || "",
      deviceId: derivedDefaults.deviceId || "",
      technicianId: "",
      type: (derivedDefaults.type as any) || "redovni",
      scheduledAt: "",
      description: "",
      preferredDate: "",
    });
  }, [derivedDefaults, reset]);

  // Watch fields for UI updates
  const wClientId = watch("clientId");
  const wDeviceId = watch("deviceId");
  const wTechnicianId = watch("technicianId");
  const wType = watch("type");

  // Device list filtered by chosen client (or all if none)
  const deviceOptions = useMemo(
    () =>
      wClientId
        ? deviceList.filter((d) => d.clientId === wClientId)
        : deviceList,
    [deviceList, wClientId]
  );

  // Keep ids consistent
  function handleClientChange(newClientId: string) {
    setValue("clientId", newClientId, {
      shouldValidate: true,
      shouldDirty: true,
    });
    const currentDeviceId = getValues("deviceId");
    if (currentDeviceId) {
      const dev = deviceMap[currentDeviceId];
      if (!dev || dev.clientId !== newClientId) {
        setValue("deviceId", "", { shouldValidate: true, shouldDirty: true });
      }
    }
  }

  function handleDeviceChange(newDeviceId: string) {
    setValue("deviceId", newDeviceId, {
      shouldValidate: true,
      shouldDirty: true,
    });
    const dev = deviceMap[newDeviceId];
    if (dev && getValues("clientId") !== dev.clientId) {
      setValue("clientId", dev.clientId, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }

  const [submitting, setSubmitting] = useState(false);
  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await createRequest(values); // server action should redirect
    } catch (e) {
      // optional: toast error here
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-4 max-w-xl">
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        {/* Client */}
        <div className="space-y-1">
          <Label>Client</Label>
          <Controller
            name="clientId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || "none"}
                onValueChange={(v) => {
                  if (v === "none") return;
                  field.onChange(v);
                  handleClientChange(v);
                }}
                disabled={lockClient}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    Select…
                  </SelectItem>
                  {clientList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{" "}
                      {/*  <span className="text-xs text-muted-foreground">
                        ({c.id})
                      </span> */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.clientId && (
            <p className="text-xs text-red-600">
              {String(errors.clientId.message)}
            </p>
          )}
          {wClientId && (
            <p className="text-xs text-muted-foreground">
              Selected client ID: <span className="font-mono">{wClientId}</span>
            </p>
          )}
        </div>

        {/* Device */}
        <div className="space-y-1">
          <Label>Device</Label>
          <Controller
            name="deviceId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || "none"}
                onValueChange={(v) => {
                  if (v === "none") return;
                  field.onChange(v);
                  handleDeviceChange(v);
                }}
                disabled={lockDevice}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      wClientId
                        ? "Select a device"
                        : "Select a device (client auto-sets)"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    Select…
                  </SelectItem>
                  {deviceOptions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}{" "}
                      {/*  <span className="text-xs text-muted-foreground">
                        ({d.id})
                      </span> */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.deviceId && (
            <p className="text-xs text-red-600">
              {String(errors.deviceId.message)}
            </p>
          )}
          {wDeviceId && (
            <p className="text-xs text-muted-foreground">
              Selected device ID: <span className="font-mono">{wDeviceId}</span>
            </p>
          )}
        </div>

        {/* Technician */}
        <div className="space-y-1">
          <Label>Technician</Label>
          <Controller
            name="technicianId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || "none"}
                onValueChange={(v) => v !== "none" && field.onChange(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    Select…
                  </SelectItem>
                  {techList.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name ?? t.id}{" "}
                      {/*  <span className="text-xs text-muted-foreground">
                        ({t.id})
                      </span> */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.technicianId && (
            <p className="text-xs text-red-600">
              {String(errors.technicianId.message)}
            </p>
          )}
        </div>

        {/* Type */}
        <div className="space-y-1">
          <Label>Service type</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => field.onChange(v as FormValues["type"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="redovni">Redovni</SelectItem>
                  <SelectItem value="vanredni">Vanredni</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Dates & notes (REGISTERED!) */}
        <div className="space-y-1">
          <Label>Scheduled date</Label>
          <Input type="date" {...register("scheduledAt")} />
          {errors.scheduledAt && (
            <p className="text-xs text-red-600">
              {String(errors.scheduledAt.message)}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Description (optional)</Label>
          <Textarea
            rows={3}
            placeholder="Short note…"
            {...register("description")}
          />
        </div>

        <div className="space-y-1">
          <Label>Preferred date (optional)</Label>
          <Input type="date" {...register("preferredDate")} />
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-primary text-primary-foreground"
          >
            {submitting ? "Saving…" : "Create request"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
