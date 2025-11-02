"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { createClientRequest } from "../actions";
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
  deviceId: z.string().min(1, "Select device"),
  type: z.enum(["redovni", "vanredni", "major"]),
  preferredDate: z.string().optional(),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof Schema>;

export default function NewClientRequestForm({
  deviceList,
  initialDeviceId = "",
}: {
  deviceList: { id: string; name: string }[];
  initialDeviceId?: string;
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      deviceId: initialDeviceId || "",
      type: "redovni",
      preferredDate: "",
      description: "",
    },
  });

  useEffect(() => {
    reset((curr) => ({ ...curr, deviceId: initialDeviceId || "" }));
  }, [initialDeviceId, reset]);

  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await createClientRequest(values); // server action redirects to /client/requests
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-4">
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        {/* Device */}
        <div className="space-y-1">
          <Label>Device</Label>
          <Controller
            name="deviceId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || "none"}
                onValueChange={(v) => v !== "none" && field.onChange(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    Select…
                  </SelectItem>
                  {deviceList.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
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
        </div>

        {/* Type */}
        <div className="space-y-1">
          <Label>Service type</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
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

        {/* Preferred date */}
        <div className="space-y-1">
          <Label>Preferred date (optional)</Label>
          <Input type="date" {...register("preferredDate")} />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <Label>Description (optional)</Label>
          <Textarea
            rows={3}
            placeholder="Short note…"
            {...register("description")}
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-primary text-primary-foreground"
          >
            {submitting ? "Submitting…" : "Create request"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
