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
import { DialogDescription } from "@radix-ui/react-dialog";
import {
  createTechnician,
  updateTechnician,
  deactivateTechnician,
} from "@/app/admin/technicians/actions";

const CreateSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Min 6 chars"),
  phone: z.string().optional(),
  region: z.string().optional(),
});

const EditSchema = z.object({
  userId: z.string(),
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
  region: z.string().optional(),
});

type Tech = {
  userId: string;
  name: string;
  email: string;
  phone: string;
  region: string;
};

export default function TechnicianDialog({
  mode,
  technician,
  trigger,
}: {
  mode: "create" | "edit" | "deactivate";
  technician?: Tech;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(mode === "create" ? CreateSchema : EditSchema),
    defaultValues:
      mode === "create"
        ? { name: "", email: "", password: "", phone: "", region: "" }
        : {
            userId: technician?.userId ?? "",
            name: technician?.name ?? "",
            phone: technician?.phone ?? "",
            region: technician?.region ?? "",
          },
  });

  const onSubmit = async (values: any) => {
    if (mode === "create") {
      await createTechnician(values);
    } else if (mode === "edit") {
      await updateTechnician(values);
    }
    setOpen(false);
  };

  const onDeactivate = async () => {
    if (technician?.userId) {
      await deactivateTechnician(technician.userId);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" && "Add technician"}
            {mode === "edit" && "Edit technician"}
            {mode === "deactivate" && "Deactivate technician"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Technician management
          </DialogDescription>
        </DialogHeader>

        {mode === "deactivate" ? (
          <div className="space-y-4">
            <p>
              Deactivate technician <b>{technician?.name}</b>? This will set
              their role to <b>client</b>.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={onDeactivate}>
                Deactivate
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            {mode === "edit" && (
              <input type="hidden" {...form.register("userId")} />
            )}

            <div className="space-y-1">
              <Label>Name</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-600">
                  {String(form.formState.errors.name.message)}
                </p>
              )}
            </div>

            {mode === "create" && (
              <>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" {...form.register("email")} />
                </div>
                <div className="space-y-1">
                  <Label>Password</Label>
                  <Input type="password" {...form.register("password")} />
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label>Phone</Label>
              <Input {...form.register("phone")} />
            </div>
            <div className="space-y-1">
              <Label>Region</Label>
              <Input {...form.register("region")} />
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
        )}
      </DialogContent>
    </Dialog>
  );
}
