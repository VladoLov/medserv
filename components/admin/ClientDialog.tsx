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
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  createClient,
  updateClient,
  deleteClient,
} from "../../app/admin/clients/actions";
import { DialogDescription } from "@radix-ui/react-dialog";

const Schema = z.object({
  name: z.string().min(2, "Name is required"),
  address: z.string().optional(),
});

type Client = { id: string; name: string; address: string | null };

export default function ClientDialog({
  mode,
  client,
  trigger,
}: {
  mode: "create" | "edit" | "delete";
  client?: Client;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: {
      name: client?.name ?? "",
      address: client?.address ?? "",
    },
  });

  const onSubmit = async (values: z.infer<typeof Schema>) => {
    if (mode === "create") await createClient(values);
    if (mode === "edit" && client) await updateClient(client.id, values);
    setOpen(false);
  };

  const onDelete = async () => {
    if (client) {
      await deleteClient(client.id);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" && "Add client"}
            {mode === "edit" && "Edit client"}
            {mode === "delete" && "Delete client"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Create or edit a client data
          </DialogDescription>
        </DialogHeader>

        {mode !== "delete" ? (
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Input {...form.register("address")} />
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
              Are you sure you want to delete <b>{client?.name}</b>?
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
