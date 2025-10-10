// components/devices/DevicesFilter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function DevicesFilter({
  initialQ,
  initialUpcoming,
  showClientFilter,
  clientOptions = [],
  initialClientId,
}: {
  initialQ?: string;
  initialUpcoming?: boolean;
  showClientFilter?: boolean;
  clientOptions?: { id: string; name: string }[];
  initialClientId?: string; // may be "" or an id
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ] = useState(initialQ ?? "");
  const [upcoming, setUpcoming] = useState(!!initialUpcoming);
  // Map "" -> "all" because Select cannot use empty string
  const [clientId, setClientId] = useState(
    initialClientId && initialClientId.length > 0 ? initialClientId : "all"
  );

  useEffect(() => {
    setQ(initialQ ?? "");
    setUpcoming(!!initialUpcoming);
    setClientId(
      initialClientId && initialClientId.length > 0 ? initialClientId : "all"
    );
  }, [initialQ, initialUpcoming, initialClientId]);

  const apply = () => {
    const params = new URLSearchParams(sp.toString());
    q ? params.set("q", q) : params.delete("q");
    upcoming ? params.set("upcoming", "1") : params.delete("upcoming");

    if (showClientFilter) {
      if (clientId === "all") params.delete("clientId");
      else params.set("clientId", clientId);
    }

    router.push(`/devices?${params.toString()}`);
  };

  const reset = () => {
    setQ("");
    setUpcoming(false);
    setClientId("all");
    router.push(`/devices`);
  };

  return (
    <Card className="p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] items-end">
        <div className="space-y-1">
          <Label>Search</Label>
          <Input
            placeholder="Device name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {showClientFilter && (
          <div className="space-y-1">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {clientOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-2 pt-6">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={upcoming}
              onChange={(e) => setUpcoming(e.target.checked)}
            />
            Upcoming (30d)
          </label>
        </div>

        <div className="flex gap-2 pt-6">
          <Button
            onClick={apply}
            className="bg-primary text-primary-foreground"
          >
            Apply
          </Button>
          <Button variant="outline" onClick={reset}>
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
}
