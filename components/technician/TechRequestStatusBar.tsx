"use client";

import { Button } from "@/components/ui/button";
import DelayRequestDialog from "./DelayRequestDialog";
import FinishRequestDialog from "./FinishRequestDialog";
import { startRequest } from "@/app/technician/requests/action";

export default function TechRequestStatusBar({
  requestId,
  currentStatus,
  defaultType,
  redirectTo,
  defaultDate,
}: {
  requestId: string;
  currentStatus:
    | "scheduled"
    | "in_progress"
    | "delayed"
    | "done"
    | "cancelled"
    | string;
  defaultType: "redovni" | "vanredni" | "major";
  redirectTo: string;
  defaultDate?: string;
}) {
  const canStart = currentStatus === "scheduled" || currentStatus === "delayed";
  const canFinish =
    currentStatus === "in_progress" || currentStatus === "scheduled";

  return (
    <div className="card p-3 flex flex-wrap items-center gap-2">
      <div className="text-sm">
        <b>Status:</b>{" "}
        <span className="capitalize">{currentStatus.replace("_", " ")}</span>
      </div>
      <div className="ml-auto flex gap-2">
        {canStart && (
          <form action={startRequest.bind(null, { requestId, redirectTo })}>
            <Button type="submit" variant="outline" size="sm">
              Start
            </Button>
          </form>
        )}
        {currentStatus !== "done" && currentStatus !== "cancelled" && (
          <DelayRequestDialog
            requestId={requestId}
            defaultDate={defaultDate}
            trigger={
              <Button size="sm" variant="secondary">
                Delay
              </Button>
            }
          />
        )}
        {canFinish && (
          <FinishRequestDialog
            requestId={requestId}
            defaultType={defaultType}
            trigger={
              <Button size="sm" className="bg-primary text-primary-foreground">
                Finish
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
