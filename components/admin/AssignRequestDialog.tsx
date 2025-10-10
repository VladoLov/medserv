"use client";

import { useState } from "react";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { assignRequest } from "@/app/admin/requests/actions";

const Schema = z.object({
  requestId: z.string(),
  technicianId: z.string().min(1, "Technician is required"),
  scheduledAt: z.string().optional(),
});
type Form = z.infer<typeof Schema>;

export default function AssignRequestDialog({
  requestId,
  technicians,
  defaultDate,
  trigger,
}: {
  requestId: string;
  technicians: { id: string; name: string | null }[];
  defaultDate?: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<Form>({
    resolver: zodResolver(Schema),
    defaultValues: {
      requestId,
      technicianId: "",
      scheduledAt: defaultDate ?? "",
    },
  });

  const onSubmit = async (values: Form) => {
    await assignRequest(values);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign request</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <input type="hidden" {...form.register("requestId")} />
          <div>
            <Select
              value={form.watch("technicianId")}
              onValueChange={(v) => form.setValue("technicianId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select technician" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name ?? t.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.technicianId && (
              <p className="text-xs text-red-600 mt-1">
                {String(form.formState.errors.technicianId.message)}
              </p>
            )}
          </div>
          <div>
            <Input type="date" {...form.register("scheduledAt")} />
            <p className="text-xs text-muted-foreground">
              Optional schedule date
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground"
            >
              Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
