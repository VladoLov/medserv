"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function ClientDevicesFilter({
  initialQ,
  initialUpcoming,
}: {
  initialQ?: string;
  initialUpcoming?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQ ?? "");
  const [upcoming, setUpcoming] = useState(!!initialUpcoming);

  useEffect(() => {
    setQ(initialQ ?? "");
    setUpcoming(!!initialUpcoming);
  }, [initialQ, initialUpcoming]);

  const apply = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    if (upcoming) params.set("upcoming", "1");
    else params.delete("upcoming");
    router.push(`/client/devices?${params.toString()}`);
  };

  const reset = () => {
    setQ("");
    setUpcoming(false);
    router.push(`/client/devices`);
  };

  return (
    <Card className="p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] items-end">
        <div className="space-y-1">
          <Label>Search</Label>
          <Input
            placeholder="Search by device name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={upcoming}
              onChange={(e) => setUpcoming(e.target.checked)}
            />
            Upcoming (next 30 days)
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
