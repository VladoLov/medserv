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
import { Textarea } from "@/components/ui/textarea";
import { delayRequest } from "@/app/technician/requests/action";

const Schema = z.object({
  requestId: z.string(),
  newDate: z.string().optional(),
  reason: z.string().optional(),
});
type Form = z.infer<typeof Schema>;

export default function DelayRequestDialog({
  requestId,
  trigger,
  defaultDate,
}: {
  requestId: string;
  trigger: React.ReactNode;
  defaultDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<Form>({
    resolver: zodResolver(Schema),
    defaultValues: { requestId, newDate: defaultDate ?? "", reason: "" },
  });
  const onSubmit = async (v: Form) => {
    await delayRequest(v);
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delay request</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <input type="hidden" {...form.register("requestId")} />
          <div>
            <label className="text-sm">New date (optional)</label>
            <Input type="date" {...form.register("newDate")} />
          </div>
          <div>
            <label className="text-sm">Reason (optional)</label>
            <Textarea rows={3} {...form.register("reason")} />
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
      </DialogContent>
    </Dialog>
  );
}
