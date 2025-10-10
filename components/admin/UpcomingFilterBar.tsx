// components/admin/UpcomingFilterBar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../components/ui/select";

type ClientOpt = { id: string; name: string };

export default function UpcomingFilterBar({
  clients,
  initialClientId,
  initialQuery,
}: {
  clients: ClientOpt[];
  initialClientId?: string;
  initialQuery?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  // vrijednost u Selectu: "" = bez filtera (placeholder)
  const [clientId, setClientId] = useState(initialClientId ?? "");
  const [q, setQ] = useState(initialQuery ?? "");

  const pushWithParams = useMemo(() => {
    let tid: any;
    return (params: URLSearchParams) => {
      clearTimeout(tid);
      tid = setTimeout(() => {
        router.push(`/admin/dashboard?${params.toString()}`);
      }, 200);
    };
  }, [router]);

  useEffect(() => {
    const params = new URLSearchParams(sp.toString());

    if (clientId) params.set("clientId", clientId);
    else params.delete("clientId");

    if (q) params.set("q", q);
    else params.delete("q");

    pushWithParams(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, q]);

  const clear = () => {
    setClientId("");
    setQ("");
    router.push("/admin/dashboard");
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="w-full sm:w-64">
        <Select
          value={clientId || "_all"} // "_all" prikazuje 'All clients' kao selektovano
          onValueChange={(val) => setClientId(val === "_all" ? "" : val)}
        >
          <SelectTrigger aria-label="Select client">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            {/* ⬇️ Nema praznog stringa, koristimo '_all' */}
            <SelectItem value="_all">All clients</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:max-w-xs">
        <Input
          placeholder="Search device..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="sm:ml-auto flex gap-2">
        <Button variant="outline" onClick={clear}>
          Reset
        </Button>
      </div>
    </div>
  );
}
