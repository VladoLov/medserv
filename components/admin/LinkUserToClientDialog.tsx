"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { linkUserToClient } from "@/app/admin/users/linking-actions";

type ClientOpt = { id: string; name: string };

export default function LinkUserToClientDialog({
  userId,
  clients,
  trigger,
}: {
  userId: string;
  clients: ClientOpt[];
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState<string>("");

  // koristimo server action direktno (bez <form>) iz klijentske komponente
  async function onLink() {
    if (!clientId) return;
    await linkUserToClient({ userId, clientId });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            Link to client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link user to client</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground"
              onClick={onLink}
              disabled={!clientId}
            >
              Link
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
