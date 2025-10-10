"use client";

import { useMemo } from "react";
import { Card } from "../../components/ui/card";
import { cn } from "../../lib/utils"; // ako nemaš util, možeš koristiti classnames ili ukloniti cn
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";

type Row = {
  deviceId: string;
  deviceName: string;
  clientId: string;
  clientName: string | null;
  serial: string | null;
  nextServiceDate: string | Date | null;
};

export default function UpcomingServicesTable({ rows }: { rows: Row[] }) {
  const formatted = useMemo(() => {
    const now = new Date();
    return rows.map((r) => {
      const d = r.nextServiceDate ? new Date(r.nextServiceDate) : null;
      const daysLeft = d
        ? Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...r,
        nextServiceDateLabel: d ? d.toLocaleDateString() : "—",
        daysLeft,
      };
    });
  }, [rows]);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">
          Upcoming services (next 30 days)
        </h2>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead className="hidden md:table-cell">Serial</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Next service</TableHead>
              <TableHead className="text-right">Days left</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formatted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No upcoming services in the next 30 days.
                </TableCell>
              </TableRow>
            ) : (
              formatted.map((r) => (
                <TableRow key={r.deviceId}>
                  <TableCell className="font-medium">{r.deviceName}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {r.serial ?? "—"}
                  </TableCell>
                  <TableCell>{r.clientName ?? "—"}</TableCell>
                  <TableCell>{r.nextServiceDateLabel}</TableCell>
                  <TableCell className="text-right">
                    {r.daysLeft !== null ? (
                      <Badge
                        className={cn(
                          "font-normal",
                          r.daysLeft <= 3
                            ? "bg-red-600 text-white hover:bg-red-600"
                            : r.daysLeft <= 14
                            ? "bg-amber-500 text-white hover:bg-amber-500"
                            : "bg-emerald-500 text-white hover:bg-emerald-500"
                        )}
                      >
                        {r.daysLeft}d
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
