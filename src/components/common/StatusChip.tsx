import React from "react";
import { Badge } from "@/components/ui/badge";

export function StatusChip({ status }: { status: "draft" | "published" | "closed" | string }) {
  switch (status) {
    case "published":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 rounded-none font-mono text-[10px] uppercase tracking-wider whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 py-1 px-2.5 leading-tight select-none"
        >
          <span className="size-1.5 shrink-0 rounded-none bg-emerald-400 animate-pulse" />
          <span>Active · Published</span>
        </Badge>
      );
    case "draft":
      return (
        <Badge
          variant="outline"
          className="border-amber-500/50 text-amber-400 bg-amber-500/10 rounded-none font-mono text-[10px] uppercase tracking-wider whitespace-nowrap shrink-0 inline-flex items-center py-1 px-2.5 leading-tight select-none"
        >
          <span>Draft</span>
        </Badge>
      );
    case "closed":
      return (
        <Badge
          variant="outline"
          className="border-zinc-500/50 text-zinc-400 bg-zinc-500/10 rounded-none font-mono text-[10px] uppercase tracking-wider whitespace-nowrap shrink-0 inline-flex items-center py-1 px-2.5 leading-tight select-none"
        >
          <span>Closed</span>
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="rounded-none font-mono text-[10px] uppercase whitespace-nowrap shrink-0 inline-flex items-center py-1 px-2.5 leading-tight select-none"
        >
          {status}
        </Badge>
      );
  }
}
