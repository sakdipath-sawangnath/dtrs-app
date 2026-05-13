"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_BADGE_CLASS, STATUS_LABELS } from "./jobDetailStyles";

export default function JobStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto border-0 bg-transparent px-2 py-1 text-xs font-semibold shadow-none ring-0",
        STATUS_BADGE_CLASS[status] ?? STATUS_BADGE_CLASS.PENDING,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
