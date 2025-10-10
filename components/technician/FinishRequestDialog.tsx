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
import { finishRequest } from "@/app/technician/requests/action";

const Schema = z.object({
  requestId: z.string(),
  serviceDate: z.string().min(1, "Date required"),
  type: z.enum(["redovni", "vanredni", "major"]),
  notes: z.string().optional(),
});
type Form = z.infer<typeof Schema>;

export default function FinishRequestDialog({
  requestId,
  trigger,
  defaultType = "vanredni",
}: {
  requestId: string;
  trigger: React.ReactNode;
  defaultType?: "redovni" | "vanredni" | "major";
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<Form>({
    resolver: zodResolver(Schema),
    defaultValues: {
      requestId,
      serviceDate: new Date().toISOString().slice(0, 10),
      type: defaultType,
      notes: "",
    },
  });
  const onSubmit = async (v: Form) => {
    await finishRequest(v);
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finish & create record</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <input type="hidden" {...form.register("requestId")} />
          <div>
            <label className="text-sm">Service date</label>
            <Input type="date" {...form.register("serviceDate")} />
          </div>
          <div>
            <label className="text-sm">Type</label>
            <select
              className="border rounded px-3 py-2 w-full bg-background"
              {...form.register("type")}
            >
              <option value="redovni">Redovni</option>
              <option value="vanredni">Vanredni</option>
              <option value="major">Major</option>
            </select>
          </div>
          <div>
            <label className="text-sm">Notes (optional)</label>
            <Input {...form.register("notes")} />
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
              Finish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
