"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { assignAndScheduleRequest } from "@/app/admin/requests/actions"; // adjust path if needed
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

const Schema = z.object({
  requestId: z.string().min(1),
  technicianId: z.string().min(1),
  scheduledAt: z.string().min(1), // datetime-local
  durationMin: z.coerce
    .number()
    .min(15)
    .max(8 * 60)
    .default(60),
});

type FormValues = z.infer<typeof Schema>;

function toLocalDatetimeInputValue(d = new Date()) {
  // "YYYY-MM-DDTHH:mm" local, without seconds
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

export default function SchedulerCard({
  requestId,
  technicians,
  defaultTechId,
  defaultDate, // ISO or "YYYY-MM-DDTHH:mm"
  defaultDuration = 60,
  onScheduled,
  title = "Schedule service",
}: {
  requestId: string;
  technicians: { id: string; name: string | null; workload?: number }[];
  defaultTechId?: string;
  defaultDate?: string;
  defaultDuration?: number;
  onScheduled?: (info: { conflicts: number }) => void;
  title?: string;
}) {
  const router = useRouter();
  const nowValue = useMemo(() => toLocalDatetimeInputValue(), []);
  const minValue = nowValue;

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      requestId,
      technicianId: defaultTechId ?? "",
      scheduledAt: defaultDate ?? nowValue,
      durationMin: defaultDuration,
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const wDate = form.watch("scheduledAt");
  const wDur = form.watch("durationMin");
  const endAt = useMemo(() => {
    if (!wDate) return null;
    const d = new Date(wDate);
    if (isNaN(d.getTime())) return null;
    d.setMinutes(d.getMinutes() + Number(wDur || 0));
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [wDate, wDur]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const res = await assignAndScheduleRequest(values);
      onScheduled?.({ conflicts: res.conflicts ?? 0 });
      // inline toast alternative:
      if (res.conflicts > 0) {
        console.info(`Scheduled with ${res.conflicts} potential conflicts`);
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const addOffset = (mins: number) => {
    const base = new Date(form.getValues("scheduledAt") || new Date());
    base.setMinutes(base.getMinutes() + mins);
    form.setValue("scheduledAt", toLocalDatetimeInputValue(base), {
      shouldDirty: true,
    });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <Badge variant="outline">TZ: Europe/Sarajevo</Badge>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        {/* Technician */}
        <div className="space-y-1">
          <Label>Technician</Label>
          <Controller
            name="technicianId"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value || "none"}
                onValueChange={(v) => v !== "none" && field.onChange(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    Select…
                  </SelectItem>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center justify-between gap-3">
                        <span>{t.name ?? t.id}</span>
                        {typeof t.workload === "number" && (
                          <Badge
                            variant={
                              t.workload > 3 ? "destructive" : "secondary"
                            }
                          >
                            {t.workload} tasks
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Date / time */}
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-1">
            <Label>Date & time</Label>
            <Input
              type="datetime-local"
              min={minValue}
              {...form.register("scheduledAt")}
            />
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addOffset(24 * 60)}
              >
                +1d
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addOffset(7 * 24 * 60)}
              >
                +1w
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addOffset(14 * 24 * 60)}
              >
                +2w
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addOffset(30 * 24 * 60)}
              >
                +1m
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Duration (min)</Label>
            <Input
              type="number"
              min={15}
              max={8 * 60}
              step={15}
              {...form.register("durationMin", { valueAsNumber: true })}
            />
            {endAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Ends around <b>{endAt}</b>
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-primary text-primary-foreground"
          >
            {submitting ? "Saving…" : "Save schedule"}
          </Button>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
        </div>
      </form>
    </Card>
  );
}
