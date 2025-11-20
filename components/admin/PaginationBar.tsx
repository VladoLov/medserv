"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function PaginationBar({
  totalPages,
  page,
  pageSize,
  status,
}: {
  totalPages: number;
  page: number;
  pageSize: number;
  status: "scheduled" | "done" | "cancelled";
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const go = (nextPage: number, nextSize = pageSize) => {
    const params = new URLSearchParams(sp.toString());
    params.set("status", status);
    params.set("page", String(nextPage));
    params.set("pageSize", String(nextSize));
    router.push(`/admin/requests?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </div>
      <div className="flex gap-2">
        <button
          className="border rounded px-3 py-1 text-sm disabled:opacity-50"
          onClick={() => go(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Prev
        </button>
        <button
          className="border rounded px-3 py-1 text-sm disabled:opacity-50"
          onClick={() => go(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows:</span>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={pageSize}
          onChange={(e) => go(1, Number(e.target.value))}
        >
          {[10, 20, 50, 100].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
