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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertRequestToRecord } from "@/app/admin/requests/actions";
import { DialogDescription } from "@radix-ui/react-dialog";

const Schema = z.object({
  requestId: z.string(),
  deviceId: z.string(),
  serviceDate: z.string().min(1, "Date is required"),
  type: z.enum(["redovni", "vanredni", "major"]),
  notes: z.string().optional(),
});
type Form = z.infer<typeof Schema>;

export default function ConvertRequestDialog({
  requestId,
  deviceId,
  defaultType,
  trigger,
}: {
  requestId: string;
  deviceId: string;
  defaultType: "redovni" | "vanredni" | "major";
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<Form>({
    resolver: zodResolver(Schema),
    defaultValues: {
      requestId,
      deviceId,
      serviceDate: new Date().toISOString().slice(0, 10),
      type: defaultType,
      notes: "",
    },
  });

  const onSubmit = async (values: Form) => {
    await convertRequestToRecord(values);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert to service record</DialogTitle>
          <DialogDescription className="sr-only">
            Create a completed service record from this request
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <input type="hidden" {...form.register("requestId")} />
          <input type="hidden" {...form.register("deviceId")} />
          <div className="space-y-1">
            <Label>Date</Label>
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
            <Input {...form.register("notes")} placeholder="Optional..." />
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
              Convert
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
