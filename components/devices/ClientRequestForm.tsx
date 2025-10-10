"use client";

import { useTransition } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createServiceRequest } from "@/app/client/devices/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const Schema = z.object({
  deviceId: z.string(),
  type: z.enum(["redovni", "vanredni", "major"]),
  description: z.string().optional(),
  preferredDate: z.string().optional(),
});
type Form = z.infer<typeof Schema>;

export default function ClientRequestForm({ deviceId }: { deviceId: string }) {
  const [pending, start] = useTransition();
  const form = useForm<Form>({
    resolver: zodResolver(Schema),
    defaultValues: {
      deviceId,
      type: "vanredni",
      description: "",
      preferredDate: "",
    },
  });

  const onSubmit = (values: Form) => {
    start(async () => {
      await createServiceRequest(values);
      form.reset({ ...values, description: "" });
    });
  };

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-3">Request service</h2>
      <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <input type="hidden" {...form.register("deviceId")} />
        <div className="space-y-1">
          <Label>Type</Label>
          <select
            className="border rounded px-3 py-2 w-full bg-background"
            {...form.register("type")}
          >
            <option value="vanredni">Vanredni</option>
            <option value="redovni">Redovni</option>
            <option value="major">Major</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label>Preferred date (optional)</Label>
          <Input type="date" {...form.register("preferredDate")} />
        </div>
        <div className="space-y-1">
          <Label>Description (optional)</Label>
          <Textarea
            {...form.register("description")}
            placeholder="Describe the issue or request..."
          />
        </div>
        <Button
          disabled={pending}
          className="bg-primary text-primary-foreground"
        >
          {pending ? "Sending..." : "Send request"}
        </Button>
      </form>
    </Card>
  );
}
